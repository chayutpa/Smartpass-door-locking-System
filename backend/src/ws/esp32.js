// จัดการ websocket connection ที่มาจากตัว ESP32 ของแต่ละห้อง (ไม่ใช่จาก browser)
// ESP32 แต่ละตัวต่อเข้ามาที่ path /ws/esp32?secret=XXXX ค้างไว้ตลอดเวลา (persistent connection)
// secret เป็นของเฉพาะห้อง (เก็บใน Room.secret) ใช้แยกว่า connection ไหนเป็นของห้องไหน
import { Room } from "../models/Room.js";
import { AccessLog } from "../models/AccessLog.js";

const pendingArms = new Map(); // requestId -> {resolve, reject, timer} รอ ack ว่า ESP32 arm สำเร็จ
const armedRequests = new Map(); // requestId -> {userId, username, roomName} เก็บไว้ log ตอนรู้ผลจริง

// roomId (string) -> Set ของ socket ที่ต่ออยู่ (ปกติห้องละ 1 ตัว แต่รองรับหลายตัวเผื่อ ESP32 สำรอง)
const connectedDevicesByRoom = new Map();
const pendingAcks = new Map(); // requestId -> {resolve, reject, timer}

export default async function esp32WsRoute(fastify) {
  fastify.get("/ws/esp32", { websocket: true }, async (socket, req) => {
    const secret = req.query?.secret;

    if (!secret) {
      socket.close(4001, "missing secret");
      return;
    }

    // ผูก listener ดักข้อความไว้ก่อน "await" ใดๆ ทันที กัน ESP32 ส่งข้อความมาถึงเร็วเกินไป
    // ระหว่างที่ยังรอผล Room.findOne() อยู่ (ไม่งั้นข้อความจะหายเงียบๆ โดยไม่มี error)
    const earlyMessages = [];
    const bufferMessage = (raw) => earlyMessages.push(raw);
    socket.on("message", bufferMessage);

    const room = await Room.findOne({ secret });
    if (!room) {
      socket.off("message", bufferMessage);
      fastify.log.warn("ESP32 พยายามเชื่อมต่อด้วย secret ที่ไม่ตรงกับห้องใดเลย");
      socket.close(4001, "invalid secret");
      return;
    }

    const roomId = room._id.toString();
    fastify.log.info(`ESP32 ของห้อง "${room.name}" เชื่อมต่อ websocket สำเร็จ`);

    if (!connectedDevicesByRoom.has(roomId)) {
      connectedDevicesByRoom.set(roomId, new Set());
    }
    connectedDevicesByRoom.get(roomId).add(socket);

    // ส่งชุดรหัสฉุกเฉินล่าสุดให้ ESP32 ทันทีที่เชื่อมต่อสำเร็จ (เผื่อ admin เพิ่ง generate/regenerate รหัสไว้
    // ตอนที่ ESP32 ออฟไลน์อยู่ พอกลับมาออนไลน์จะได้ชุดล่าสุดเก็บไว้ใช้ครั้งต่อไปทันที)
    socket.send(
      JSON.stringify({
        type: "sync_codes",
        codes: room.offlineCodes.map((c, index) => ({ index, code: c.code, used: c.used })),
      })
    );

    // สถานะสำหรับ heartbeat ที่ backend เป็นฝ่ายเช็คเอง (แยกจาก heartbeat ฝั่ง ESP32 ที่เป็นคนละทิศทาง)
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    const handleMessage = (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ESP32 ตอบกลับหลังปลดล็อกเสร็จ: {"type":"ack","requestId":"...","status":"ok"}
      if (msg.type === "ack" && msg.requestId && pendingAcks.has(msg.requestId)) {
        const pending = pendingAcks.get(msg.requestId);
        clearTimeout(pending.timer);
        pending.resolve(msg.status === "ok");
        pendingAcks.delete(msg.requestId);
      }

      // ESP32 ส่ง heartbeat มาเป็นระยะ
      if (msg.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
      }

      // ESP32 รายงานว่ารหัสฉุกเฉินตัวไหนถูกใช้ไปแล้วบ้างระหว่างออฟไลน์: {"type":"codes_used_report","usedIndices":[2,5]}
      if (msg.type === "codes_used_report" && Array.isArray(msg.usedIndices)) {
        fastify.log.info(`ได้รับรายงานรหัสที่ใช้แล้วจากห้อง ${room.name}: ${JSON.stringify(msg.usedIndices)}`);
        Room.findById(roomId)
          .then((r) => {
            if (!r) return;
            fastify.log.info(`อัปเดต Room สำเร็จ: ${JSON.stringify(r.offlineCodes)}`);
            let changed = false;
            for (const index of msg.usedIndices) {
              if (r.offlineCodes[index] && !r.offlineCodes[index].used) {
                r.offlineCodes[index].used = true;
                changed = true;
              }
            }
            if (changed) return r.save();
          })
          .catch((err) => fastify.log.error(`อัปเดตสถานะรหัสฉุกเฉินของห้อง ${room.name} ล้มเหลว: ${err.message}`));
      }
      // ESP32 ตอบกลับทันทีว่า arm สำเร็จ พร้อมรับการกดปุ่มแล้ว
      if (msg.type === "armed_ack" && msg.requestId && pendingArms.has(msg.requestId)) {
        const pending = pendingArms.get(msg.requestId);
        clearTimeout(pending.timer);
        pending.resolve(true);
        pendingArms.delete(msg.requestId);
      }

      // มีคนกดปุ่มจริงที่หน้าห้องสำเร็จ ปลดล็อกจริงแล้ว
      if (msg.type === "unlock_confirmed" && msg.requestId) {
        const info = armedRequests.get(msg.requestId);
        armedRequests.delete(msg.requestId);
        if (info) {
          AccessLog.create({
            user: info.userId, username: info.username,
            room: roomId, roomName: info.roomName,
            action: "unlock_success", detail: msg.requestId,
          }).catch((err) => fastify.log.error(`log unlock_success ล้มเหลว: ${err.message}`));
        }
      }

      // หมดเวลา 10 วิ ไม่มีใครกดปุ่ม
      if (msg.type === "arm_expired" && msg.requestId) {
        const info = armedRequests.get(msg.requestId);
        armedRequests.delete(msg.requestId);
        if (info) {
          AccessLog.create({
            user: info.userId, username: info.username,
            room: roomId, roomName: info.roomName,
            action: "unlock_failed", detail: "หมดเวลา ไม่มีการกดปุ่มที่หน้าห้อง",
          }).catch((err) => fastify.log.error(`log arm_expired ล้มเหลว: ${err.message}`));
        }
      }
    };

    // ปลดบัฟเฟอร์ชั่วคราวออก แล้วผูก handler จริงแทน
    socket.off("message", bufferMessage);
    socket.on("message", handleMessage);

    // เอาข้อความที่ค้างมาถึงระหว่างรอ Room.findOne() (ถ้ามี) มาประมวลผลตอนนี้เลย
    for (const raw of earlyMessages) handleMessage(raw);

    const cleanup = () => {
      const set = connectedDevicesByRoom.get(roomId);
      if (set) {
        set.delete(socket);
        if (set.size === 0) connectedDevicesByRoom.delete(roomId);
      }
    };

    socket.on("close", () => {
      fastify.log.info(`ESP32 ของห้อง "${room.name}" หลุดการเชื่อมต่อ websocket`);
      cleanup();
    });

    socket.on("error", cleanup);
  });

  // ทุก 5 วิ: ไล่ ping ทุก ESP32 ที่ต่ออยู่ ถ้าตัวไหนไม่ตอบ pong รอบก่อนหน้า (แปลว่าตายไปแล้วจริง
  // เช่น โดนตัดไฟ/รีเซ็ตกะทันหันโดยไม่ได้ปิด connection อย่างเป็นทางการ) ให้ตัดทิ้งทันที
  // แก้ปัญหาที่สถานะ "ออนไลน์" ค้างอยู่นานกว่าความเป็นจริง เพราะ TCP เพียงอย่างเดียวตรวจจับการหลุดกะทันหันไม่ได้เร็วพอ
  const heartbeatInterval = setInterval(() => {
    for (const set of connectedDevicesByRoom.values()) {
      for (const socket of set) {
        if (socket.isAlive === false) {
          socket.terminate(); // จะ trigger event "close" -> cleanup() เอง ทำให้สถานะห้องนั้นเปลี่ยนเป็นออฟไลน์
          continue;
        }
        socket.isAlive = false;
        socket.ping();
      }
    }
  }, 5000);

  fastify.addHook("onClose", () => {
    clearInterval(heartbeatInterval);
  });
}

export function isRoomOnline(roomId) {
  const set = connectedDevicesByRoom.get(roomId.toString());
  return !!set && set.size > 0;
}

export function onlineRoomIds() {
  return [...connectedDevicesByRoom.keys()];
}

// ส่งชุดรหัสฉุกเฉินล่าสุดไปให้ ESP32 ของห้องนี้ทันที (เรียกจาก admin routes ตอนสร้าง/สุ่มรหัสใหม่)
// ถ้า ESP32 ห้องนี้ไม่ได้ออนไลน์อยู่ตอนนี้ ก็แค่ไม่มีผลอะไร (จะได้ชุดล่าสุดตอนเชื่อมต่อครั้งถัดไปแทน)
export function pushOfflineCodesSync(roomId, offlineCodes) {
  const set = connectedDevicesByRoom.get(roomId.toString());
  if (!set || set.size === 0) return;

  const payload = JSON.stringify({
    type: "sync_codes",
    codes: offlineCodes.map((c, index) => ({ index, code: c.code, used: c.used })),
  });
  for (const socket of set) {
    socket.send(payload);
  }
}

// ส่งคำสั่ง "arm" (ขอสิทธิ์) ไปให้ ESP32 ของห้องที่ระบุ แล้วรอ ack แค่ว่า ESP32 ได้รับคำสั่งจริง
// (ไม่ใช่รอว่าปลดล็อกสำเร็จ เพราะต้องรอคนไปกดปุ่มจริงที่หน้าห้องก่อน)
export function sendArmCommand(roomId, requestId, meta, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const set = connectedDevicesByRoom.get(roomId.toString());
    if (!set || set.size === 0) {
      reject(new Error("ไม่มี ESP32 ของห้องนี้เชื่อมต่ออยู่"));
      return;
    }

    armedRequests.set(requestId, meta); // เก็บไว้ log ตอนได้ผลจริง (unlock_confirmed/arm_expired)

    const timer = setTimeout(() => {
      pendingArms.delete(requestId);
      reject(new Error("ESP32 ไม่ตอบกลับภายในเวลาที่กำหนด"));
    }, timeoutMs);

    pendingArms.set(requestId, { resolve, reject, timer });

    const payload = JSON.stringify({ type: "arm", requestId, windowSeconds: 10 });
    for (const socket of set) {
      socket.send(payload);
    }
  });
}
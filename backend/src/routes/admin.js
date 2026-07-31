import crypto from "node:crypto";
import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { AccessLog } from "../models/AccessLog.js";
import { pushOfflineCodesSync } from "../ws/esp32.js";

// สุ่มรหัส 6 หลัก (000000-999999) เป็น string เสมอ เผื่อขึ้นต้นด้วย 0
function generateSixDigitCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

export default async function adminRoutes(fastify) {
  const preHandler = [fastify.authenticate, fastify.requireAdmin];

  // ---------- จัดการผู้ใช้ ----------

  // ดูรายชื่อ user ทั้งหมด พร้อมรายชื่อห้องที่มีสิทธิ์ปลดล็อก
  fastify.get("/api/admin/users", { preHandler }, async (request, reply) => {
    const users = await User.find().select("-passwordHash").populate("allowedRooms", "name").sort({ createdAt: -1 });
    return reply.send({ users });
  });

  // เปิด/ปิดสิทธิ์ปลดล็อกของ user รายคน ต่อห้องใดห้องหนึ่ง
  fastify.patch("/api/admin/users/:id/rooms/:roomId", { preHandler }, async (request, reply) => {
    const { id, roomId } = request.params;
    const { allow } = request.body || {};
    if (typeof allow !== "boolean") {
      return reply.code(400).send({ error: "ต้องระบุ allow เป็น true หรือ false" });
    }

    const user = await User.findById(id);
    if (!user) return reply.code(404).send({ error: "ไม่พบผู้ใช้" });

    const has = user.allowedRooms.some((r) => r.toString() === roomId);
    if (allow && !has) {
      user.allowedRooms.push(roomId);
    } else if (!allow && has) {
      user.allowedRooms = user.allowedRooms.filter((r) => r.toString() !== roomId);
    }
    await user.save();
    await user.populate("allowedRooms", "name");

    return reply.send({ user });
  });

  // แก้ role ของ user (admin / user)
  fastify.patch("/api/admin/users/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    const { role } = request.body || {};
    if (role !== "admin" && role !== "user") {
      return reply.code(400).send({ error: "role ต้องเป็น admin หรือ user" });
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true })
      .select("-passwordHash")
      .populate("allowedRooms", "name");
    if (!user) return reply.code(404).send({ error: "ไม่พบผู้ใช้" });
    return reply.send({ user });
  });

  // ลบ user
  fastify.delete("/api/admin/users/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    if (id === request.user.sub) {
      return reply.code(400).send({ error: "ไม่สามารถลบบัญชีตัวเองได้" });
    }
    await User.findByIdAndDelete(id);
    return reply.send({ message: "ลบผู้ใช้แล้ว" });
  });

  // ---------- จัดการห้อง ----------

  // สร้างห้องใหม่ -> ระบบสุ่ม secret ให้ ต้องคัดลอกไปฝังในโค้ด ESP32 ของห้องนั้น
  fastify.post("/api/admin/rooms", { preHandler }, async (request, reply) => {
    const { name } = request.body || {};
    if (!name || !name.trim()) {
      return reply.code(400).send({ error: "กรุณาระบุชื่อห้อง" });
    }

    const secret = crypto.randomBytes(24).toString("hex"); // secret เฉพาะห้องนี้ ยาว 48 ตัวอักษร
    const room = await Room.create({ name: name.trim(), secret });

    return reply.code(201).send({ room });
  });

  // ดูรายชื่อห้องทั้งหมด พร้อม secret (admin เท่านั้นที่เห็นได้ ไว้ก็อปไปใส่ ESP32 ซ้ำได้ถ้าทำอุปกรณ์หาย)
  fastify.get("/api/admin/rooms", { preHandler }, async (request, reply) => {
    const rooms = await Room.find().sort({ createdAt: -1 });
    return reply.send({ rooms });
  });

  // เปลี่ยนชื่อห้อง
  fastify.patch("/api/admin/rooms/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    const { name } = request.body || {};
    if (!name || !name.trim()) {
      return reply.code(400).send({ error: "กรุณาระบุชื่อห้อง" });
    }
    const room = await Room.findByIdAndUpdate(id, { name: name.trim() }, { new: true });
    if (!room) return reply.code(404).send({ error: "ไม่พบห้องนี้" });
    return reply.send({ room });
  });

  // สุ่ม secret ใหม่ให้ห้อง (ใช้เมื่อของหาย หรือสงสัยว่า secret รั่วไหล) ต้องอัปโหลดโค้ด ESP32 ใหม่ด้วย
  fastify.post("/api/admin/rooms/:id/regenerate-secret", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    const secret = crypto.randomBytes(24).toString("hex");
    const room = await Room.findByIdAndUpdate(id, { secret }, { new: true });
    if (!room) return reply.code(404).send({ error: "ไม่พบห้องนี้" });
    return reply.send({ room });
  });

  // ลบห้อง (ต้องเอาห้องนี้ออกจาก allowedRooms ของทุก user ด้วย กันข้อมูลค้าง)
  fastify.delete("/api/admin/rooms/:id", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    await Room.findByIdAndDelete(id);
    await User.updateMany({}, { $pull: { allowedRooms: id } });
    return reply.send({ message: "ลบห้องแล้ว" });
  });

  // ---------- รหัสฉุกเฉินสำหรับปลดล็อกตอน ESP32 ไม่มีอินเทอร์เน็ต ----------

  // สร้างชุดรหัสฉุกเฉินใหม่ทั้ง 10 ชุด (ใช้ตอนตั้งห้องครั้งแรก หรือต้องการล้างของเก่าทิ้งทั้งหมด)
  fastify.post("/api/admin/rooms/:id/offline-codes/generate", { preHandler }, async (request, reply) => {
    const { id } = request.params;
    const room = await Room.findById(id);
    if (!room) return reply.code(404).send({ error: "ไม่พบห้องนี้" });

    room.offlineCodes = Array.from({ length: 10 }, () => ({ code: generateSixDigitCode(), used: false }));
    await room.save();

    pushOfflineCodesSync(id, room.offlineCodes); // ถ้า ESP32 ห้องนี้ออนไลน์อยู่ตอนนี้ จะได้รับชุดใหม่ทันที
    return reply.send({ room });
  });

  // สุ่มรหัสใหม่ทีละชุด (index 0-9) เช่น ใช้เมื่อรหัสชุดนั้นถูกใช้ไปแล้วอยากได้ชุดใหม่มาแทน
  fastify.post("/api/admin/rooms/:id/offline-codes/:index/regenerate", { preHandler }, async (request, reply) => {
    const { id, index } = request.params;
    const idx = Number(index);
    const room = await Room.findById(id);
    if (!room) return reply.code(404).send({ error: "ไม่พบห้องนี้" });
    if (!room.offlineCodes[idx]) return reply.code(400).send({ error: "ลำดับรหัสไม่ถูกต้อง (ต้องเป็น 0-9)" });

    room.offlineCodes[idx] = { code: generateSixDigitCode(), used: false };
    await room.save();

    pushOfflineCodesSync(id, room.offlineCodes);
    return reply.send({ room });
  });

  // ---------- log ----------
  fastify.get("/api/admin/logs", { preHandler }, async (request, reply) => {
    const logs = await AccessLog.find().sort({ createdAt: -1 }).limit(200);
    return reply.send({ logs });
  });
}
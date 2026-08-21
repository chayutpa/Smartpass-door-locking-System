import crypto from "node:crypto";
import { AccessLog } from "../models/AccessLog.js";
import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { sendArmCommand } from "../ws/esp32.js";

export default async function doorRoutes(fastify) {
  fastify.post("/api/door/:roomId/unlock", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub, ssoId } = request.user;
    const { roomId } = request.params;

    const room = await Room.findById(roomId);
    if (!room) return reply.code(404).send({ error: "ไม่พบห้องนี้" });

    const currentUser = await User.findById(sub);
    const canUnlock =
      currentUser?.role === "admin" ||
      currentUser?.allowedRooms.some((id) => id.toString() === roomId);

    if (!canUnlock) {
      await AccessLog.create({
        user: sub, username: ssoId, room: room._id, roomName: room.name,
        action: "unlock_failed", detail: "ไม่มีสิทธิ์ปลดล็อกห้องนี้",
      });
      return reply.code(403).send({ error: `คุณไม่มีสิทธิ์ปลดล็อกห้อง ${room.name} กรุณาติดต่อ admin` });
    }

    const requestId = crypto.randomUUID();
    await AccessLog.create({
      user: sub, username: ssoId, room: room._id, roomName: room.name,
      action: "unlock_request", detail: requestId,
    });

    try {
      // ส่งคำขอไปให้ ESP32 "arm" ตัวเองรอ 10 วิ ยังไม่ปลดล็อกจริง ต้องมีคนไปกดปุ่มที่หน้าห้องก่อน
      await sendArmCommand(roomId, requestId, { userId: sub, username: ssoId, roomName: room.name });
      return reply.send({
        message: `ส่งคำขอสำเร็จ! กรุณากดปุ่มที่หน้าห้อง ${room.name} ภายใน 10 วินาที`,
      });
    } catch (err) {
      await AccessLog.create({
        user: sub, username: ssoId, room: room._id, roomName: room.name,
        action: "unlock_failed", detail: err.message,
      });
      return reply.code(502).send({ error: `ขอสิทธิ์ห้อง ${room.name} ไม่สำเร็จ: ${err.message}` });
    }
  });
}
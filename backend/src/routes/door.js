import crypto from "node:crypto";
import { AccessLog } from "../models/AccessLog.js";
import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { sendUnlockCommand } from "../ws/esp32.js";

export default async function doorRoutes(fastify) {
  fastify.post("/api/door/:roomId/unlock", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub, username } = request.user;
    const { roomId } = request.params;

    const room = await Room.findById(roomId);
    if (!room) return reply.code(404).send({ error: "ไม่พบห้องนี้" });

    // เช็คสิทธิ์สดจากฐานข้อมูลทุกครั้ง ไม่ใช้ค่าที่ cache ไว้ใน JWT
    const currentUser = await User.findById(sub);
    const canUnlock =
      currentUser?.role === "admin" ||
      currentUser?.allowedRooms.some((id) => id.toString() === roomId);

    if (!canUnlock) {
      await AccessLog.create({
        user: sub,
        username,
        room: room._id,
        roomName: room.name,
        action: "unlock_failed",
        detail: "ไม่มีสิทธิ์ปลดล็อกห้องนี้",
      });
      return reply.code(403).send({ error: `คุณไม่มีสิทธิ์ปลดล็อกห้อง ${room.name} กรุณาติดต่อ admin` });
    }

    const requestId = crypto.randomUUID();
    await AccessLog.create({
      user: sub,
      username,
      room: room._id,
      roomName: room.name,
      action: "unlock_request",
      detail: requestId,
    });

    try {
      await sendUnlockCommand(roomId, requestId);
      await AccessLog.create({
        user: sub,
        username,
        room: room._id,
        roomName: room.name,
        action: "unlock_success",
        detail: requestId,
      });
      return reply.send({ message: `ปลดล็อกห้อง ${room.name} สำเร็จ` });
    } catch (err) {
      await AccessLog.create({
        user: sub,
        username,
        room: room._id,
        roomName: room.name,
        action: "unlock_failed",
        detail: err.message,
      });
      return reply.code(502).send({ error: `ปลดล็อกห้อง ${room.name} ไม่สำเร็จ: ${err.message}` });
    }
  });
}

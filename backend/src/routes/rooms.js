import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { isRoomOnline } from "../ws/esp32.js";
import { AccessLog } from "../models/AccessLog.js";

// route สำหรับผู้ใช้ทั่วไป (ไม่ใช่ admin) ใช้ดูรายชื่อห้องที่มีในระบบ + สถานะออนไลน์ + สิทธิ์ของตัวเอง
export default async function roomsRoutes(fastify) {
  fastify.get("/api/rooms", { preHandler: fastify.authenticate }, async (request, reply) => {
    const currentUser = await User.findById(request.user.sub);
    if (!currentUser) return reply.code(404).send({ error: "ไม่พบผู้ใช้" });

    const rooms = await Room.find().sort({ name: 1 });
    const allowedSet = new Set(currentUser.allowedRooms.map((id) => id.toString()));

    const result = rooms.map((room) => ({
      id: room._id,
      name: room.name,
      online: isRoomOnline(room._id.toString()),
      canUnlock: currentUser.role === "admin" || allowedSet.has(room._id.toString()),
      armWindowSeconds: room.armWindowSeconds || 10,
    }));

    return reply.send({ rooms: result });
  });
  // เช็คสถานะล่าสุดของประวัติการปลดล็อก ใช้ตอน frontend รอดูว่ามีคนกดปุ่มที่หน้าห้องสำเร็จหรือยัง
  // เช็คผลของคำขอปลดล็อก "รายการเดียว" ตาม requestId ใช้ตอน frontend รอดูว่ามีคนกดปุ่มที่หน้าห้องหรือยัง
  fastify.get("/api/rooms/unlock-status/:requestId", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { requestId } = request.params;
    const log = await AccessLog.findOne({
      requestId,
      action: { $in: ["unlock_success", "unlock_failed"] },
    }).sort({ createdAt: -1 });

    if (!log) return reply.send({ status: "pending" });
    return reply.send({ status: log.action === "unlock_success" ? "success" : "failed" });
  });
}
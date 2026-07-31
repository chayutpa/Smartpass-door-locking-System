import { Room } from "../models/Room.js";
import { User } from "../models/User.js";
import { isRoomOnline } from "../ws/esp32.js";

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
    }));

    return reply.send({ rooms: result });
  });
}
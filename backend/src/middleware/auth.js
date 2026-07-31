// middleware สำหรับตรวจสอบว่า request มี JWT ที่ถูกต้อง (ผู้ใช้ล็อกอินแล้ว)
export async function requireAuth(request, reply) {
  try {
    await request.jwtVerify(); // อ่าน JWT จาก cookie (ดู server.js ที่ตั้งค่า cookie: true)
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

// middleware สำหรับ route ที่ admin เท่านั้นที่เข้าได้ ต้องใช้ต่อจาก requireAuth
export async function requireAdmin(request, reply) {
  if (request.user?.role !== "admin") {
    reply.code(403).send({ error: "Forbidden: admin only" });
  }
}

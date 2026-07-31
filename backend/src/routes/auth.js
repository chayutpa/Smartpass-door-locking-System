import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export default async function authRoutes(fastify) {
  // สมัครสมาชิก - user ใหม่จะยังไม่มีสิทธิ์ปลดล็อก (canUnlock: false) จนกว่า admin จะอนุมัติ
  fastify.post("/api/auth/register", async (request, reply) => {
    const { username, password, displayName } = request.body || {};
    if (!username || !password) {
      return reply.code(400).send({ error: "username และ password จำเป็นต้องกรอก" });
    }
    if (password.length < 8) {
      return reply.code(400).send({ error: "password ต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return reply.code(409).send({ error: "username นี้ถูกใช้ไปแล้ว" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash,
      displayName: displayName || username,
    });

    return reply.code(201).send({
      message: "สมัครสมาชิกสำเร็จ กรุณารอ admin อนุมัติสิทธิ์ปลดล็อกห้องที่ต้องการใช้งาน",
      user: { id: user._id, username: user.username },
    });
  });

  // ล็อกอิน - ออก JWT แล้วเซ็ตเป็น httpOnly cookie
  fastify.post("/api/auth/login", async (request, reply) => {
    const { username, password } = request.body || {};
    if (!username || !password) {
      return reply.code(400).send({ error: "username และ password จำเป็นต้องกรอก" });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return reply.code(401).send({ error: "username หรือ password ไม่ถูกต้อง" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "username หรือ password ไม่ถูกต้อง" });
    }

    const token = fastify.jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      { expiresIn: "12h" }
    );

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // ต้องเป็น true เมื่อรันจริงผ่าน https
      maxAge: 60 * 60 * 12,
    });

    return reply.send({
      user: { id: user._id, username: user.username, role: user.role, displayName: user.displayName },
    });
  });

  fastify.post("/api/auth/logout", async (request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.send({ message: "ออกจากระบบแล้ว" });
  });

  fastify.get("/api/auth/me", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await User.findById(request.user.sub).select("-passwordHash");
    if (!user) return reply.code(404).send({ error: "ไม่พบผู้ใช้" });
    return reply.send({ user });
  });
}

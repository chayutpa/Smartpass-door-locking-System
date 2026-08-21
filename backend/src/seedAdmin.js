import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import { User } from "./models/User.js";
import mongoose from "mongoose";

const [, , loginId, password] = process.argv;
if (!loginId || !password) {
  console.error("วิธีใช้: node src/seedAdmin.js <loginId> <password>");
  process.exit(1);
}

await connectDB();

const existing = await User.findOne({ ssoId: loginId });
if (existing) {
  existing.role = "admin";
  await existing.save();
  console.log(`ตั้งให้ ${loginId} เป็น admin เรียบร้อยแล้ว`);
} else {
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    ssoId: loginId,
    passwordHash,
    hasPassword: true,
    role: "admin",
    displayName: loginId,
  });
  console.log(`สร้าง admin ใหม่ (${loginId}) เรียบร้อยแล้ว — ล็อกอินด้วยฟอร์ม username/password ไม่ต้องผ่าน SSO`);
}

await mongoose.disconnect();
process.exit(0);
// สคริปต์สร้าง admin คนแรกของระบบ รันด้วย: npm run seed:admin
// จะถามผ่าน argv: node src/seedAdmin.js <username> <password>
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import { User } from "./models/User.js";
import mongoose from "mongoose";

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("วิธีใช้: node src/seedAdmin.js <username> <password>");
  process.exit(1);
}

await connectDB();

const existing = await User.findOne({ username: username.toLowerCase() });
if (existing) {
  existing.role = "admin";
  await existing.save();
  console.log(`ตั้งให้ ${username} เป็น admin เรียบร้อยแล้ว`);
} else {
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    username: username.toLowerCase(),
    passwordHash,
    role: "admin",
    displayName: username,
  });
  console.log(`สร้าง admin ใหม่ชื่อ ${username} เรียบร้อยแล้ว`);
}

await mongoose.disconnect();
process.exit(0);

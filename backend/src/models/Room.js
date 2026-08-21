import mongoose from "mongoose";

// แต่ละห้อง = ประตู 1 บาน มี secret เฉพาะตัวที่ฝังไว้ในโค้ด ESP32 ของห้องนั้น
// ใช้ secret แยกรายห้องแทนตัวเดียวทั้งระบบ เพื่อให้แยกแยะได้ว่าคำสั่ง unlock ไหนต้องส่งไปหา ESP32 ตัวไหน
const offlineCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true }, // รหัส 6 หลักที่ ESP32 ใช้ปลดล็อกตอนไม่มีเน็ต
    used: { type: Boolean, default: false },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // เช่น "311", "312"
    secret: { type: String, required: true, unique: true }, // สุ่มตอนสร้างห้อง เอาไปฝังใน ESP32
    // ชุดรหัส 6 หลักสำหรับปลดล็อกตอน ESP32 ไม่มีอินเทอร์เน็ต (ESP32 ซิงก์มาเก็บเองผ่าน WebSocket ตอนออนไลน์)
    offlineCodes: { type: [offlineCodeSchema], default: [] },
    // รายชื่อคณะ/สาขา (ตรงกับ field "faculty"/"program" ที่ SSO ส่งมา) ที่จะได้สิทธิ์ห้องนี้อัตโนมัติ
    // ตอน user คนนั้นล็อกอิน SSO ครั้งแรก โดยไม่ต้องรอ admin ติ๊กอนุญาตทีละคน
    autoGrantFaculties: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
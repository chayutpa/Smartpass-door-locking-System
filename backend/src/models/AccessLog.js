import mongoose from "mongoose";

// เก็บ log ทุกครั้งที่มีการปลดล็อกประตู เพื่อให้ admin ตรวจสอบย้อนหลังได้
const accessLogSchema = new mongoose.Schema(
  {
    // user ไม่บังคับ required อีกต่อไป เพราะ log ที่เกิดจากรหัสฉุกเฉิน offline ไม่มีบัญชีผู้ใช้ผูกอยู่เลย
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String, required: true },
    // เก็บ snapshot ชื่อจริง/รหัสนักศึกษาไว้ ณ ขณะเกิดเหตุการณ์ กันข้อมูลหายถ้า user ถูกลบทีหลัง
    displayName: { type: String, default: "" },
    studentId: { type: String, default: "" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    roomName: { type: String, default: "" },
    action: {
      type: String,
      enum: ["unlock_request", "unlock_success", "unlock_failed", "offline_unlock_success"],
      required: true,
    },
    detail: { type: String, default: "" },
    requestId: { type: String, default: "", index: true },
  },
  { timestamps: true }
);

export const AccessLog = mongoose.model("AccessLog", accessLogSchema);

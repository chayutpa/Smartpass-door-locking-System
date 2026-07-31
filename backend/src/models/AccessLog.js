import mongoose from "mongoose";

// เก็บ log ทุกครั้งที่มีการปลดล็อกประตู เพื่อให้ admin ตรวจสอบย้อนหลังได้
const accessLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    roomName: { type: String, default: "" },
    action: { type: String, enum: ["unlock_request", "unlock_success", "unlock_failed"], required: true },
    detail: { type: String, default: "" },
  },
  { timestamps: true }
);

export const AccessLog = mongoose.model("AccessLog", accessLogSchema);

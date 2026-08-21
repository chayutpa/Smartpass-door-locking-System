import mongoose from "mongoose";

// เก็บ state ชั่วคราวตอนเริ่ม SSO flow กัน CSRF หมดอายุอัตโนมัติใน 10 นาที
const ssoStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

export const SsoState = mongoose.model("SsoState", ssoStateSchema);
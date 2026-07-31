import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    // รายชื่อห้องที่ user คนนี้มีสิทธิ์ปลดล็อกได้ (admin เป็นคนกำหนดทีละห้อง)
    allowedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
    displayName: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

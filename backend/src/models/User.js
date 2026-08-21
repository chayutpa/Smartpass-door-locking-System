import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ตัวระบุจาก SSO มหาวิทยาลัย (uid) — แทน username แบบตั้งเองที่เอาออกไปแล้ว
    ssoId: { type: String, required: true, unique: true },

    displayName: { type: String, default: "" },
    email: { type: String, default: "" },
    studentId: { type: String, default: "" },
    faculty: { type: String, default: "" },
    program: { type: String, default: "" },

    role: { type: String, enum: ["admin", "user"], default: "user" },
    allowedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],

    // สำหรับล็อกอินแบบที่ 2 (ตั้งได้เองหลัง SSO ครั้งแรก)
    passwordHash: { type: String, default: null },
    hasPassword: { type: Boolean, default: false },

    ssoRawProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
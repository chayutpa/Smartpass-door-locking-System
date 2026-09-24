import React, { useState } from "react";
import { api } from "../api.js";

export default function RoomConfigModal({ room, onDone, onCancel }) {
  const [wifiSsid, setWifiSsid] = useState(room.wifiSsid || "");
  const [wifiPassword, setWifiPassword] = useState(room.wifiPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [armWindowSeconds, setArmWindowSeconds] = useState(room.armWindowSeconds || 10);
  const [unlockDurationSeconds, setUnlockDurationSeconds] = useState(room.unlockDurationSeconds || 5);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.updateRoomConfig(room._id, {
        wifiSsid,
        wifiPassword,
        armWindowSeconds: Number(armWindowSeconds),
        unlockDurationSeconds: Number(unlockDurationSeconds),
      });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>ตั้งค่าห้อง {room.name}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <label className="auth-field-label">ชื่อ WiFi (SSID) ของห้องเรียน</label>
          <input placeholder="เช่น KKC-RMUTI-Student" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} />

          <label className="auth-field-label">รหัสผ่าน WiFi</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <label className="auth-field-label">เวลานับถอยหลังรอกดปุ่มยืนยัน (วินาที)</label>
          <input type="number" min="3" max="60" value={armWindowSeconds} onChange={(e) => setArmWindowSeconds(e.target.value)} />

          <label className="auth-field-label">เวลาปลดล็อกค้างไว้ก่อนล็อกกลับ (วินาที)</label>
          <input type="number" min="1" max="30" value={unlockDurationSeconds} onChange={(e) => setUnlockDurationSeconds(e.target.value)} />

          <p style={{ fontSize: 12.5, color: "#888", marginTop: -8 }}>
            หลังบันทึกแล้ว ต้องกด "ดาวน์โหลด .ino" ใหม่ แล้วอัปโหลดเข้า ESP32 อีกครั้ง ค่าที่ตั้งไว้ถึงจะมีผลจริง
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" className="secondary" onClick={onCancel} style={{ flex: 1 }}>
              ยกเลิก
            </button>
            <button disabled={loading} style={{ flex: 1 }}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { api } from "../api.js";

export default function SetPasswordModal({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (password !== confirm) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    setLoading(true);
    try {
      await api.setPassword(password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2>ยินดีต้อนรับ! ตั้งรหัสผ่านของคุณ</h2>
        <p>นี่คือการล็อกอินครั้งแรก ตั้งรหัสผ่านไว้ล็อกอินแบบไม่ผ่าน SSO ในครั้งถัดไปได้ (ไม่บังคับ)</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="ตั้งรหัสผ่าน (อย่างน้อย 8 ตัว)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button disabled={loading}>{loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่าน"}</button>
        </form>
        <button className="link-btn" onClick={onDone} style={{ width: "100%", textAlign: "center" }}>
          ข้ามไปก่อน
        </button>
      </div>
    </div>
  );
}
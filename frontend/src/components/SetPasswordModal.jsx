import React, { useState } from "react";
import { api } from "../api.js";

export default function SetPasswordModal({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
          <input type="password" placeholder="ตั้งรหัสผ่าน (อย่างน้อย 8 ตัว)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" placeholder="ยืนยันรหัสผ่านอีกครั้ง" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button disabled={loading}>{loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่าน"}</button>
        </form>
        <button className="link-btn" onClick={onDone} style={{ width: "100%", textAlign: "center" }}>
          ข้ามไปก่อน
        </button>
      </div>
    </div>
  );
}
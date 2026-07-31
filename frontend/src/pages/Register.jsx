import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register(form.username, form.password, form.displayName);
      setSuccess("สมัครสมาชิกสำเร็จ! กรุณารอ admin อนุมัติสิทธิ์ปลดล็อกก่อนใช้งาน");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-left">
          <h1>JOIN US</h1>
          <p className="auth-subhead">SmartPass Door Locking System</p>
          <p>สมัครสมาชิกเพื่อขอสิทธิ์ปลดล็อกห้อง เมื่อ admin อนุมัติแล้วจะใช้งานได้ทันที</p>
        </div>

        <div className="auth-right">
          <h2>Sign up</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <form onSubmit={onSubmit}>
            <label className="auth-field-label">ชื่อที่แสดง</label>
            <input
              placeholder="ชื่อที่แสดง"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />

            <label className="auth-field-label">Username</label>
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <label className="auth-field-label">Password</label>
            <div className="password-field">
              <input
                placeholder="Password (อย่างน้อย 8 ตัว)"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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

            <button disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "กำลังสมัคร..." : "Sign up"}
            </button>
          </form>

          <p className="auth-bottom-text">
            มีบัญชีแล้ว? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
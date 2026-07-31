import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import Footer from "../Footer.jsx";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(username, password);
      await refresh();
      navigate("/");
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
          <h1>WELCOME</h1>
          <p className="auth-subhead">SmartPass Door Locking System</p>
          <p>เข้าสู่ระบบเพื่อปลดล็อกประตูห้องที่คุณมีสิทธิ์ใช้งาน</p>
        </div>

        <div className="auth-right">
          <h2>Login</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={onSubmit}>
            <label className="auth-field-label">Username</label>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />

            <label className="auth-field-label">Password</label>
            <div className="password-field">
              <input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
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



            <button disabled={loading} style={{ marginTop: 12 }}>{loading ? "กำลังเข้าสู่ระบบ..." : "Sign in"}</button>
          </form>

          <p className="auth-bottom-text">
            ยังไม่มีบัญชี? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
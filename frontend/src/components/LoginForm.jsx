import React, { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";

export default function LoginForm({ onBeforeSso }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingSso, setLoadingSso] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const { refresh } = useAuth();

  const onClickSso = async () => {
    setError("");
    setLoadingSso(true);
    try {
      if (onBeforeSso) onBeforeSso(); // เก็บ pendingRoomId ไว้ก่อน redirect (ถ้ามี)
      const { authorizeUrl } = await api.ssoInit();
      window.location.href = authorizeUrl;
    } catch (err) {
      setError(err.message);
      setLoadingSso(false);
    }
  };

  const onSubmitPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!loginId.trim() && !password) {
      setError("กรุณากรอก username และ password");
      return;
    }
    if (!loginId.trim()) {
      setError("กรุณากรอก username");
      return;
    }
    if (!password) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }

    setLoadingLogin(true);
    try {
      const { user } = await api.login(loginId.trim(), password);
      onLoggedIn(user, false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-left">
          <h1>WELCOME</h1>
          <p className="auth-subhead">Smart Door Lock</p>
          <p>เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย (SSO) เพื่อปลดล็อกประตูห้องที่คุณมีสิทธิ์ใช้งาน</p>
        </div>

        <div className="auth-right">
          <h2>Sign in</h2>
          {error && <div className="error">{error}</div>}

          <button onClick={onClickSso} disabled={loadingSso}>
            {loadingSso ? "กำลังพาไปหน้า SSO..." : "เข้าสู่ระบบด้วย SSO มหาวิทยาลัย"}
          </button>

          <div className="divider">หรือ</div>

          {!showPasswordForm ? (
            <button className="secondary" onClick={() => setShowPasswordForm(true)}>
              เข้าสู่ระบบด้วยรหัสผ่าน
            </button>
          ) : (
            <form onSubmit={onSubmitPassword}>
              <label className="auth-field-label">Username (ไม่มี@rmuti.ac.th)</label>
              <input placeholder="Username" value={loginId} onChange={(e) => setLoginId(e.target.value)} />

              <label className="auth-field-label">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
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

              <button disabled={loadingLogin} style={{ marginTop: 12 }}>
                {loadingLogin ? "กำลังเข้าสู่ระบบ..." : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="contact-footer">
        <div className="contact-row">
          <a href="https://www.kkc.rmuti.ac.th/" target="_blank" rel="noreferrer" className="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น
          </a>
          <span className="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
              <path d="M9 9v.01M9 12v.01M9 15v.01" />
            </svg>
            วิศวกรรมคอมพิวเตอร์
          </span>
        </div>

        <div className="contact-row">
          <span className="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            นายชยุตม์ ปฐมกำเหนิด
          </span>
          <a href="tel:0851839086" className="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            085-183-9086
          </a>
          <span className="contact-item">หรือ</span>
          <span className="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            ผศ.ดร.อติราช สุขสวัสดิ์
          </span>
          <a href="tel:0614515915" className="contact-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            061-451-5915
          </a>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import Dashboard from "./Dashboard.jsx";
import LoginForm from "../components/LoginForm.jsx";

export default function Root() {
  const { user, loading, refresh } = useAuth();
  const [handlingCallback, setHandlingCallback] = useState(false);
  const [callbackError, setCallbackError] = useState("");
  const hasHandledCallback = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) return;
    if (hasHandledCallback.current) return;
    hasHandledCallback.current = true;

    setHandlingCallback(true);
    api
      .ssoExchange(code, state)
      .then(async () => {
        await refresh();
        window.history.replaceState({}, "", "/");

        // ถ้ามาจากการสแกน QR ของห้องใดห้องหนึ่ง (เก็บไว้ก่อน redirect ไป SSO)
        // พากลับไปหน้าห้องนั้นแทนที่จะโชว์ dashboard รวมทุกห้อง
        const pendingRoomId = sessionStorage.getItem("pendingRoomId");
        if (pendingRoomId) {
          sessionStorage.removeItem("pendingRoomId");
          navigate(`/r/${pendingRoomId}`, { replace: true });
        }
      })
      .catch((err) => {
        setCallbackError(err.message);
        window.history.replaceState({}, "", "/");
      })
      .finally(() => setHandlingCallback(false));
  }, []);

  if (loading || handlingCallback) {
    return (
      <div className="page">
        <span className="bouncing-cat">🐱</span>
      </div>
    );
  }

  if (user) return <Dashboard />;

  return (
    <>
      {callbackError && (
        <div className="page" style={{ paddingBottom: 0 }}>
          <div className="error" style={{ maxWidth: 380 }}>{callbackError}</div>
        </div>
      )}
      <LoginForm />
    </>
  );
}
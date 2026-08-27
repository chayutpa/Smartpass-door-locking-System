import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import Dashboard from "./Dashboard.jsx";
import LoginForm from "../components/LoginForm.jsx";
import LoadingCat from "../components/LoadingCat.jsx";

export default function Root() {
  const { user, loading, refresh } = useAuth();
  const [handlingCallback, setHandlingCallback] = useState(false);
  const [callbackError, setCallbackError] = useState("");
  const hasHandledCallback = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoError = params.get("error");
    const code = params.get("code");
    const state = params.get("state");

    if (ssoError) {
      if (hasHandledCallback.current) return;
      hasHandledCallback.current = true;

      const message =
        ssoError === "access_denied"
          ? "คุณไม่ได้อนุญาตให้เข้าถึงข้อมูลจาก SSO กรุณาล็อกอินใหม่และกด “อนุญาต” เพื่อใช้งานระบบ"
          : "เกิดข้อผิดพลาดระหว่างล็อกอินด้วย SSO กรุณาลองใหม่อีกครั้ง";

      setCallbackError(message);
      window.history.replaceState({}, "", "/");
      return;
    }

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
        <LoadingCat />
      </div>
    );
  }

  if (user) return <Dashboard />;

  return <LoginForm initialError={callbackError} />;
}
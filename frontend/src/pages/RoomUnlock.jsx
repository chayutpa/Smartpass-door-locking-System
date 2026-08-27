import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import LoginForm from "../components/LoginForm.jsx";
import Layout from "../components/Layout.jsx";
import CountdownModal from "../components/CountdownModal.jsx";
import LoadingCat from "../components/LoadingCat.jsx";

export default function RoomUnlock() {
  const { roomId } = useParams();
  const { user, loading } = useAuth();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [message, setMessage] = useState(null);
  const [armed, setArmed] = useState(false);

  const loadRoom = async () => {
    try {
      const data = await api.listRooms();
      const found = data.rooms.find((r) => r.id === roomId);
      setError(found ? "" : "ไม่พบห้องนี้ในระบบ");
      if (found) setRoom(found);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadRoom();
    const interval = setInterval(loadRoom, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const onUnlock = async () => {
    setUnlocking(true);
    setMessage(null);
    try {
      await api.unlockRoom(roomId);
      setArmed(true);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingCat />
      </div>
    );
  }

  if (!user) {
    // เก็บห้องที่ตั้งใจจะเปิดไว้ก่อน (SSO callback วิ่งกลับมาที่ "/" เสมอ ไม่รองรับ path ย่อย
    // ต้องอาศัย sessionStorage พาผู้ใช้กลับมาที่หน้านี้เองหลังล็อกอินสำเร็จ)
    sessionStorage.setItem("pendingRoomId", roomId);
    return <LoginForm />;
  }

  return (
    <Layout title={room ? `ห้อง ${room.name}` : "ปลดล็อกประตู"} subtitle="สแกนมาจาก QR Code ประจำห้อง">
      {error && <div className="error">{error}</div>}

      {!error && !room && (
        <div className="card" style={{ textAlign: "center" }}>
          <LoadingCat />
        </div>
      )}

      {room && (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            <span className={`status-dot ${room.online ? "status-online" : "status-offline"}`}></span>
            {room.online ? "ออนไลน์" : "ออฟไลน์"}
          </div>
          {!room.online && (
            <p style={{ color: "#b45309", fontSize: 13, marginTop: -4 }}>
              ห้องนี้ไม่มีอินเทอร์เน็ต กดปุ่มที่หน้าห้อง 1 ครั้งเพื่อเปิดโหมดปลดล็อกฉุกเฉิน
            </p>
          )}

          {message && <div className={message.type === "success" ? "success" : "error"}>{message.text}</div>}

          <button className="unlock-btn" onClick={onUnlock} disabled={unlocking || !room.canUnlock || !room.online}>
            {unlocking ? "กำลังส่งคำขอ..." : `ขอสิทธิ์ ${room.name}`}
          </button>

          {!room.canUnlock && <p style={{ color: "#666", fontSize: 14 }}>คุณยังไม่มีสิทธิ์ปลดล็อกห้องนี้ กรุณาติดต่อ admin</p>}
        </div>
      )}
      {armed && room && (
        <CountdownModal roomName={room.name} seconds={10} onClose={() => setArmed(false)} />
      )}
    </Layout>
  );
}
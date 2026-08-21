import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [unlockingId, setUnlockingId] = useState(null);
  const [messages, setMessages] = useState({});

  const loadRooms = async () => {
    try {
      const data = await api.listRooms();
      setRooms(data.rooms);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const onUnlock = async (room) => {
    setUnlockingId(room.id);
    setMessages((m) => ({ ...m, [room.id]: null }));
    try {
      const data = await api.unlockRoom(room.id);
      setMessages((m) => ({ ...m, [room.id]: { type: "success", text: data.message } }));
    } catch (err) {
      setMessages((m) => ({ ...m, [room.id]: { type: "error", text: err.message } }));
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <Layout>
      {error && <div className="error">{error}</div>}

      {rooms.length === 0 && !error && (
        <div className="card" style={{ textAlign: "center", color: "#666" }}>
          ยังไม่มีห้องในระบบ กรุณาติดต่อ admin ให้เพิ่มห้อง
        </div>
      )}

      {rooms.map((room) => {
        const msg = messages[room.id];
        return (
          <div className="card" key={room.id} style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              <span className={`status-dot ${room.online ? "status-online" : "status-offline"}`}></span>
              ห้อง {room.name} — {room.online ? "ออนไลน์" : "ออฟไลน์"}
            </div>
            {!room.online && (
              <p style={{ color: "#b45309", fontSize: 13, marginTop: -4 }}>
                ห้องนี้ไม่มีอินเทอร์เน็ต กดปุ่มที่หน้าห้อง 1 ครั้งเพื่อเปิดโหมดปลดล็อกฉุกเฉิน
              </p>
            )}

            {msg && <div className={msg.type === "success" ? "success" : "error"}>{msg.text}</div>}

            <button
              className="unlock-btn"
              onClick={() => onUnlock(room)}
              disabled={unlockingId === room.id || !room.canUnlock || !room.online}
            >
              {unlockingId === room.id ? "กำลังส่งคำขอ..." : `ขอสิทธิ์ ${room.name}`}
            </button>

            {!room.canUnlock && <p style={{ color: "#666", fontSize: 14 }}>คุณยังไม่มีสิทธิ์ปลดล็อกห้องนี้ กรุณาติดต่อ admin</p>}
          </div>
        );
      })}
    </Layout>
  );
}
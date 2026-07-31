import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import Footer from "../Footer.jsx";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [unlockingId, setUnlockingId] = useState(null);
  const [messages, setMessages] = useState({}); // roomId -> ข้อความผลลัพธ์ล่าสุดของห้องนั้น
  const navigate = useNavigate();

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
    const interval = setInterval(loadRooms, 5000); // เช็คสถานะห้องทุก 5 วิ
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

  const onLogout = async () => {
    await api.logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="page">
      <div className="top-nav">
        <div>
          <b>{user?.displayName || user?.username}</b>
          <div style={{ fontSize: 13, color: "#666" }}>{user?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน"}</div>
        </div>
        <div>
          {user?.role === "admin" && (
            <Link to="/admin" className="link-btn" style={{ marginRight: 8 }}>
              จัดการสิทธิ์
            </Link>
          )}
          <button className="link-btn" onClick={onLogout}>
            ออกจากระบบ
          </button>
        </div>
      </div>

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

            {msg && <div className={msg.type === "success" ? "success" : "error"}>{msg.text}</div>}

            <button
              className="unlock-btn"
              onClick={() => onUnlock(room)}
              disabled={unlockingId === room.id || !room.canUnlock || !room.online}
            >
              {unlockingId === room.id ? "กำลังปลดล็อก..." : `ปลดล็อก ${room.name}`}
            </button>

            {!room.canUnlock && <p style={{ color: "#666", fontSize: 14 }}>คุณยังไม่มีสิทธิ์ปลดล็อกห้องนี้ กรุณาติดต่อ admin</p>}
          </div>
        );
      })}
      <Footer />
    </div>
  );
}

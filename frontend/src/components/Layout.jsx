import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";
import Sidebar from "./Sidebar.jsx";

const GREETING_TEMPLATES = [
  "ยินดีต้อนรับกลับ",
  "สวัสดีอีกครั้ง",
  "ดีใจที่เจอกันอีกครั้ง",
  "หวังว่าวันนี้จะเป็นวันที่ดี",
  "พร้อมปลดล็อกหรือยัง",
];

function getGreeting() {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "อรุณสวัสดิ์" : hour < 18 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
  const random = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)];
  return Math.random() < 0.5 ? timeGreeting : random;
}

export default function Layout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [greeting] = useState(getGreeting); // สุ่มครั้งเดียวตอนโหลดหน้า ไม่สุ่มซ้ำระหว่างที่อยู่หน้านี้

  const onLogout = async () => {
    await api.logout();
    setUser(null);
    navigate("/");
  };

  const headline = title ?? `${greeting}${user?.displayName ? `, ${user.displayName}` : ""}`;

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} user={user} onLogout={onLogout} />
      <main className="app-main">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="app-greeting">
            <h1>{headline}</h1>
            {subtitle && <p className="app-greeting-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
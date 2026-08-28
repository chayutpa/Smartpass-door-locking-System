import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ collapsed, onToggle, user, onLogout, onContactClick }) {
  const location = useLocation();

  const navItem = (to, label, icon) => {
    const active = location.pathname === to;
    return (
      <Link key={to} to={to} className={`sidebar-link ${active ? "active" : ""}`} title={collapsed ? label : undefined}>
        <span className="sidebar-icon">{icon}</span>
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <button className="sidebar-toggle" onClick={onToggle} aria-label="พับ/ขยายเมนู">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {!collapsed && <span className="sidebar-brand">Smart Door Lock</span>}
      </div>

      <nav className="sidebar-nav">
        {navItem(
          "/",
          "หน้าหลัก",
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
          </svg>
        )}

        {navItem(
          "/manual",
          "คู่มือการใช้งาน",
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
        )}

        <button
          className="sidebar-link sidebar-link-button"
          onClick={onContactClick}
          title={collapsed ? "ติดต่อแอดมิน" : undefined}
        >
          <span className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </span>
          {!collapsed && <span>ติดต่อแอดมิน</span>}
        </button>

        {user?.role === "admin" && (
          <>
            {!collapsed && <div className="sidebar-section-label">จัดการระบบ</div>}
            {navItem(
              "/admin/rooms",
              "จัดการห้อง",
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            )}
            {navItem(
              "/admin/users",
              "จัดการผู้ใช้",
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )}
            {navItem(
              "/admin/logs",
              "ประวัติการใช้งาน",
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            )}
          </>
        )}
      </nav>
      <div className="sidebar-bottom">
        <button className="sidebar-logout" onClick={onLogout} title={collapsed ? "ออกจากระบบ" : undefined}>
          <span className="sidebar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </span>
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
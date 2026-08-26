import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);

  const load = async () => {
    try {
      const [u, r] = await Promise.all([api.listUsers(), api.listAdminRooms()]);
      setUsers(u.users);
      setRooms(r.rooms);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRoomAccess = async (userId, roomId, current) => {
    await api.setUserRoomAccess(userId, roomId, !current);
    load();
  };

  const toggleRole = async (id, current) => {
    await api.updateUserRole(id, current === "admin" ? "user" : "admin");
    load();
  };

  const removeUser = (user) => setConfirmDeleteUser(user);

  const confirmDelete = async () => {
    await api.deleteUser(confirmDeleteUser._id);
    setConfirmDeleteUser(null);
    load();
  };

  const keyword = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!keyword) return true;
    return (
      (u.displayName || "").toLowerCase().includes(keyword) ||
      (u.ssoId || "").toLowerCase().includes(keyword) ||
      (u.studentId || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <Layout title="จัดการผู้ใช้" subtitle="ค้นหา ดูรายละเอียด และจัดการสิทธิ์ของผู้ใช้ในระบบ">
      {error && <div className="error">{error}</div>}

      <div className="card">
        <label className="auth-field-label">ค้นหาจากชื่อ, username หรือรหัสนักศึกษา</label>
        <input
          placeholder="เช่น Chayut, chayut.pa หรือ 66332310138-6"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ผู้ใช้</th>
              <th>บทบาท</th>
              {rooms.map((room) => (
                <th key={room._id}>{room.name}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={rooms.length + 3} style={{ textAlign: "center", color: "#666", padding: 20 }}>
                  ไม่พบผู้ใช้ที่ตรงกับคำค้นหา
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const allowedIds = new Set(u.allowedRooms.map((r) => r._id));
                const isExpanded = expandedUserId === u._id;
                return (
                  <React.Fragment key={u._id}>
                    <tr>
                      <td>
                        <span
                          onClick={() => setExpandedUserId(isExpanded ? null : u._id)}
                          style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
                          title="คลิกเพื่อดูรายละเอียด"
                        >
                          {u.displayName || u.ssoId} {isExpanded ? "▲" : "▼"}
                        </span>
                        <br />
                        <span style={{ color: "#888", fontSize: 12 }}>@{u.ssoId}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${u.role === "admin" ? "badge-yes" : "badge-no"}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleRole(u._id, u.role)}
                          title="คลิกเพื่อสลับบทบาท"
                        >
                          {u.role}
                        </span>
                      </td>
                      {rooms.map((room) => (
                        <td key={room._id} style={{ textAlign: "center" }}>
                          {u.role === "admin" ? (
                            <span title="admin ปลดล็อกได้ทุกห้องอัตโนมัติ">—</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={allowedIds.has(room._id)}
                              onChange={() => toggleRoomAccess(u._id, room._id, allowedIds.has(room._id))}
                            />
                          )}
                        </td>
                      ))}
                      <td>
                        <button className="danger" style={{ width: "auto", padding: "6px 10px" }} onClick={() => removeUser(u)}>
                          ลบ
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={rooms.length + 3} style={{ background: "#f8faff", padding: "16px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 14 }}>
                            <div><b>อีเมล:</b> {u.email || "-"}</div>
                            <div><b>รหัสนักศึกษา:</b> {u.studentId || "-"}</div>
                            <div><b>คณะ:</b> {u.faculty || "-"}</div>
                            <div><b>สาขา:</b> {u.program || "-"}</div>
                            <div><b>ตั้งรหัสผ่านแล้ว:</b> {u.hasPassword ? "ใช่" : "ยัง"}</div>
                            <div><b>สมัครเมื่อ:</b> {new Date(u.createdAt).toLocaleString("th-TH")}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {confirmDeleteUser && (
        <ConfirmModal
          title="ลบผู้ใช้"
          message={`ยืนยันการลบผู้ใช้ ${confirmDeleteUser.displayName || confirmDeleteUser.ssoId}?`}
          confirmLabel="ลบผู้ใช้"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteUser(null)}
        />
      )}
    </Layout>
  );
}
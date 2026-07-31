import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [justCreatedSecret, setJustCreatedSecret] = useState(null); // {roomName, secret} โชว์ครั้งเดียวตอนสร้างเสร็จ
  const [offlineRoomId, setOfflineRoomId] = useState("");

  const load = async () => {
    try {
      const [u, r, l] = await Promise.all([api.listUsers(), api.listAdminRooms(), api.listLogs()]);
      setUsers(u.users);
      setRooms(r.rooms);
      setLogs(l.logs);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ---------- จัดการห้อง ----------
  const onCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const { room } = await api.createRoom(newRoomName.trim());
      setJustCreatedSecret({ roomName: room.name, secret: room.secret });
      setNewRoomName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onRenameRoom = async (room) => {
    const name = prompt("ตั้งชื่อห้องใหม่", room.name);
    if (!name || !name.trim()) return;
    await api.renameRoom(room._id, name.trim());
    load();
  };

  const onRegenerateSecret = async (room) => {
    if (!confirm(`สุ่ม secret ใหม่ให้ห้อง ${room.name}? ต้องอัปโหลดโค้ด ESP32 ของห้องนี้ใหม่ด้วย ไม่งั้นจะเชื่อมต่อไม่ได้`)) return;
    const { room: updated } = await api.regenerateRoomSecret(room._id);
    setJustCreatedSecret({ roomName: updated.name, secret: updated.secret });
    load();
  };

  const onDeleteRoom = async (room) => {
    if (!confirm(`ยืนยันการลบห้อง ${room.name}? สิทธิ์ของ user ทุกคนที่มีต่อห้องนี้จะถูกลบไปด้วย`)) return;
    await api.deleteRoom(room._id);
    load();
  };

  const onGenerateOfflineCodes = async (roomId) => {
    if (!confirm("สร้างชุดรหัสฉุกเฉินใหม่ทั้ง 10 ชุด? ชุดเดิมทั้งหมดจะใช้ไม่ได้อีกทันที")) return;
    await api.generateOfflineCodes(roomId);
    load();
  };

  const onRegenerateOfflineCode = async (roomId, index) => {
    await api.regenerateOfflineCode(roomId, index);
    load();
  };

  // ---------- จัดการ user ----------
  const toggleRoomAccess = async (userId, roomId, current) => {
    await api.setUserRoomAccess(userId, roomId, !current);
    load();
  };

  const toggleRole = async (id, current) => {
    await api.updateUserRole(id, current === "admin" ? "user" : "admin");
    load();
  };

  const removeUser = async (id) => {
    if (!confirm("ยืนยันการลบผู้ใช้นี้?")) return;
    await api.deleteUser(id);
    load();
  };

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div className="top-nav">
        <h2>จัดการระบบ</h2>
        <Link to="/" className="link-btn">
          กลับหน้าหลัก
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {/* ---------- จัดการห้อง ---------- */}
      <div className="card">
        <h3>ห้อง / ประตู</h3>

        {justCreatedSecret && (
          <div className="card" style={{ background: "#fffbea", border: "1px solid #fde68a" }}>
            <b>Secret สำหรับห้อง {justCreatedSecret.roomName}</b>
            <p style={{ fontSize: 13, color: "#666", margin: "4px 0" }}>
              คัดลอกค่านี้ไปใส่ตัวแปร <code>WS_PATH</code> ในโค้ด ESP32 ของห้องนี้ (ส่วน <code>secret=...</code>) — ค่านี้จะไม่แสดงซ้ำอีก
              เว้นแต่จะกด "สุ่ม secret ใหม่"
            </p>
            <code style={{ wordBreak: "break-all", fontSize: 13 }}>{justCreatedSecret.secret}</code>
            <br />
            <button className="link-btn" onClick={() => setJustCreatedSecret(null)}>
              ปิด
            </button>
          </div>
        )}

        <form onSubmit={onCreateRoom} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="ชื่อห้องใหม่ เช่น 311"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button style={{ width: 140 }}>เพิ่มห้อง</button>
        </form>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>ชื่อห้อง</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room._id}>
                <td>{room.name}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => onRenameRoom(room)}>
                    เปลี่ยนชื่อ
                  </button>
                  <button className="secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => onRegenerateSecret(room)}>
                    สุ่ม secret ใหม่
                  </button>
                  <button className="danger" style={{ width: "auto", padding: "6px 10px" }} onClick={() => onDeleteRoom(room)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="card">
        <h3>รหัสฉุกเฉิน (ใช้ตอน ESP32 ไม่มีอินเทอร์เน็ต)</h3>
        <p style={{ fontSize: 13, color: "#666", marginTop: 0 }}>
          ESP32 จะซิงก์รหัสชุดนี้ไปเก็บไว้เองอัตโนมัติทุกครั้งที่ออนไลน์ ไม่ต้องแก้โค้ด ESP32 เพื่อเปลี่ยนรหัส
        </p>

        <select
          value={offlineRoomId}
          onChange={(e) => setOfflineRoomId(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d9dce1", marginBottom: 12 }}
        >
          <option value="">-- เลือกห้อง --</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.name}
            </option>
          ))}
        </select>

        {offlineRoomId &&
          (() => {
            const room = rooms.find((r) => r._id === offlineRoomId);
            if (!room) return null;
            const codes = room.offlineCodes || [];

            return (
              <div>
                <button style={{ width: 220, marginBottom: 12 }} onClick={() => onGenerateOfflineCodes(room._id)}>
                  สร้างชุดรหัสใหม่ทั้ง 10 ชุด
                </button>

                {codes.length === 0 ? (
                  <p style={{ color: "#666" }}>ห้องนี้ยังไม่มีรหัสฉุกเฉิน กด "สร้างชุดรหัสใหม่ทั้ง 10 ชุด" ก่อน</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>ลำดับ</th>
                        <th>รหัส</th>
                        <th>สถานะ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td><code style={{ fontSize: 15 }}>{c.code}</code></td>
                          <td>
                            <span className={`badge ${c.used ? "badge-no" : "badge-yes"}`}>{c.used ? "ใช้แล้ว" : "ยังไม่ใช้"}</span>
                          </td>
                          <td>
                            <button
                              className="secondary"
                              style={{ width: "auto", padding: "6px 10px" }}
                              onClick={() => onRegenerateOfflineCode(room._id, index)}
                            >
                              สุ่มใหม่
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}
      </div>

      {/* ---------- จัดการสิทธิ์ user รายห้อง ---------- */}
      <div className="card">
        <h3>สิทธิ์ผู้ใช้ต่อห้อง</h3>
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
            {users.map((u) => {
              const allowedIds = new Set(u.allowedRooms.map((r) => r._id));
              return (
                <tr key={u._id}>
                  <td>
                    {u.displayName || u.username}
                    <br />
                    <span style={{ color: "#888", fontSize: 12 }}>@{u.username}</span>
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
                    <button className="danger" style={{ width: "auto", padding: "6px 10px" }} onClick={() => removeUser(u._id)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- log ---------- */}
      <div className="card">
        <h3>ประวัติการปลดล็อกล่าสุด</h3>
        <table>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>ผู้ใช้</th>
              <th>ห้อง</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString("th-TH")}</td>
                <td>{log.username}</td>
                <td>{log.roomName || "-"}</td>
                <td>{log.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

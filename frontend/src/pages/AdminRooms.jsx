import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import PromptModal from "../components/PromptModal.jsx";

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [revealedSecret, setRevealedSecret] = useState(null); // {roomName, secret}
  const [qrRoom, setQrRoom] = useState(null);
  const [autoGrantInputs, setAutoGrantInputs] = useState({});
  const [confirmAction, setConfirmAction] = useState(null); // {title, message, danger, confirmLabel, onConfirm}
  const [renameTarget, setRenameTarget] = useState(null); // room ที่กำลังเปลี่ยนชื่ออยู่
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const r = await api.listAdminRooms();
      setRooms(r.rooms);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const { room } = await api.createRoom(newRoomName.trim());
      setRevealedSecret({ roomName: room.name, secret: room.secret });
      setNewRoomName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onRenameRoom = (room) => setRenameTarget(room);

  const confirmRename = async (newName) => {
    await api.renameRoom(renameTarget._id, newName);
    setRenameTarget(null);
    load();
  };

  const onRegenerateSecret = (room) => {
    setConfirmAction({
      title: "สุ่ม secret ใหม่",
      message: `สุ่ม secret ใหม่ให้ห้อง ${room.name}? ต้องอัปโหลดโค้ด ESP32 ของห้องนี้ใหม่ด้วย ไม่งั้นจะเชื่อมต่อไม่ได้`,
      confirmLabel: "สุ่มใหม่",
      danger: true,
      onConfirm: async () => {
        const { room: updated } = await api.regenerateRoomSecret(room._id);
        setRevealedSecret({ roomName: updated.name, secret: updated.secret });
        setConfirmAction(null);
        load();
      },
    });
  };

  const onDeleteRoom = (room) => {
    setConfirmAction({
      title: "ลบห้อง",
      message: `ยืนยันการลบห้อง ${room.name}? สิทธิ์ของ user ทุกคนที่มีต่อห้องนี้จะถูกลบไปด้วย`,
      confirmLabel: "ลบห้อง",
      danger: true,
      onConfirm: async () => {
        await api.deleteRoom(room._id);
        setConfirmAction(null);
        load();
      },
    });
  };

  const onGenerateOfflineCodes = (roomId, roomName) => {
    setConfirmAction({
      title: "สร้างชุดรหัสฉุกเฉินใหม่",
      message: "สร้างชุดรหัสฉุกเฉินใหม่ทั้ง 10 ชุด? ชุดเดิมทั้งหมดจะใช้ไม่ได้อีกทันที",
      confirmLabel: "สร้างชุดใหม่",
      danger: true,
      onConfirm: async () => {
        await api.generateOfflineCodes(roomId);
        setConfirmAction(null);
        load();
      },
    });
  };

  const onRegenerateOfflineCode = (roomId, index) => {
    setConfirmAction({
      title: "สุ่มรหัสใหม่",
      message: `สุ่มรหัสฉุกเฉินชุดที่ ${index + 1} ใหม่? รหัสเดิมจะใช้ไม่ได้อีกทันที`,
      confirmLabel: "สุ่มใหม่",
      onConfirm: async () => {
        await api.regenerateOfflineCode(roomId, index);
        setConfirmAction(null);
        load();
      },
    });
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(revealedSecret.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSaveAutoGrant = async (roomId) => {
    const raw = autoGrantInputs[roomId] ?? "";
    const faculties = raw.split(",").map((s) => s.trim()).filter(Boolean);
    await api.updateRoomAutoGrant(roomId, faculties);
    load();
  };

  return (
    <Layout title="จัดการห้อง" subtitle="เพิ่มห้องใหม่ ตั้งค่า secret สิทธิ์อัตโนมัติ และรหัสฉุกเฉินของแต่ละห้อง">
      {error && <div className="error">{error}</div>}

      {/* ---------- เพิ่มห้องใหม่ ---------- */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>เพิ่มห้องใหม่</h3>
        <form onSubmit={onCreateRoom} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="ชื่อห้องใหม่ เช่น 313"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button style={{ width: 140 }}>เพิ่มห้อง</button>
        </form>
      </div>

      {/* ---------- การ์ดจัดการแยกรายห้อง ---------- */}
      {rooms.map((room) => {
        const codes = room.offlineCodes || [];
        return (
          <div className="card" key={room._id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>ห้อง {room.name}</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => setQrRoom(room)}>
                  QR Code
                </button>
                <button className="secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => onRenameRoom(room)}>
                  เปลี่ยนชื่อ
                </button>
                <button className="secondary" style={{ width: "auto", padding: "6px 10px" }} onClick={() => onRegenerateSecret(room)}>
                  สุ่ม secret ใหม่
                </button>
                <button className="danger" style={{ width: "auto", padding: "6px 10px" }} onClick={() => onDeleteRoom(room)}>
                  ลบห้อง
                </button>
              </div>
            </div>

            {/* ---------- ให้สิทธิ์อัตโนมัติตามคณะ/สาขา ---------- */}
            <div style={{ marginBottom: 20 }}>
              <label className="auth-field-label">ให้สิทธิ์อัตโนมัติตามคณะ/สาขา (คั่นด้วยจุลภาค)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="เช่น วิศวกรรมคอมพิวเตอร์, วิศวกรรมไฟฟ้า"
                  value={autoGrantInputs[room._id] ?? (room.autoGrantFaculties || []).join(", ")}
                  onChange={(e) => setAutoGrantInputs((prev) => ({ ...prev, [room._id]: e.target.value }))}
                  style={{ marginBottom: 0 }}
                />
                <button className="secondary" style={{ width: 100 }} onClick={() => onSaveAutoGrant(room._id)}>
                  บันทึก
                </button>
              </div>
            </div>

            {/* ---------- รหัสฉุกเฉินออฟไลน์ ---------- */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="auth-field-label" style={{ marginBottom: 0 }}>
                  รหัสฉุกเฉิน (ใช้ตอน ESP32 ไม่มีอินเทอร์เน็ต)
                </label>
                <button
                  className="secondary"
                  style={{ width: "auto", padding: "6px 10px" }}
                  onClick={() => onGenerateOfflineCodes(room._id, room.name)}
                >
                  สร้างชุดใหม่ทั้ง 10 ชุด
                </button>
              </div>

              {codes.length === 0 ? (
                <p style={{ color: "#666", fontSize: 14 }}>ยังไม่มีรหัสฉุกเฉิน กด "สร้างชุดใหม่ทั้ง 10 ชุด" ก่อน</p>
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
          </div>
        );
      })}

      {/* ---------- modal: secret ที่เพิ่งสร้าง/สุ่มใหม่ ---------- */}
      {revealedSecret && (
        <div className="modal-backdrop" onClick={() => setRevealedSecret(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Secret สำหรับห้อง {revealedSecret.roomName}</h2>
            <p>
              คัดลอกค่านี้ไปใส่ตัวแปร <code>WS_PATH</code> ในโค้ด ESP32 ของห้องนี้ (ส่วน <code>secret=...</code>) — ค่านี้จะไม่แสดงซ้ำอีก
            </p>
            <code style={{ wordBreak: "break-all", fontSize: 13, display: "block", marginBottom: 4 }}>
              {revealedSecret.secret}
            </code>
            <button className="copy-btn secondary" onClick={copySecret}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
            </button>
            <br />
            <button className="secondary" onClick={() => setRevealedSecret(null)} style={{ marginTop: 12 }}>
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* ---------- modal: QR code ---------- */}
      {qrRoom && (
        <div className="modal-backdrop" onClick={() => setQrRoom(null)}>
          <div className="modal-box" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h2>QR Code ห้อง {qrRoom.name}</h2>
            <p>พิมพ์ติดไว้หน้าห้องนี้ ให้ user สแกนเพื่อปลดล็อก</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                `${window.location.origin}/r/${qrRoom._id}`
              )}`}
              alt={`QR code ห้อง ${qrRoom.name}`}
              style={{ width: "100%", maxWidth: 260, borderRadius: 12 }}
            />
            <p style={{ fontSize: 12, color: "#888", wordBreak: "break-all" }}>
              {window.location.origin}/r/{qrRoom._id}
            </p>
            <button className="secondary" onClick={() => setQrRoom(null)}>
              ปิด
            </button>
          </div>
        </div>
      )}
      {renameTarget && (
        <PromptModal
          title={`เปลี่ยนชื่อห้อง ${renameTarget.name}`}
          defaultValue={renameTarget.name}
          confirmLabel="บันทึก"
          onConfirm={confirmRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          danger={confirmAction.danger}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Layout>
  );
}
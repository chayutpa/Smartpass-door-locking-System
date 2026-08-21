import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Layout from "../components/Layout.jsx";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [textSearch, setTextSearch] = useState("");

  const load = async () => {
    try {
      const l = await api.listLogs();
      setLogs(l.logs);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roomOptions = [...new Set(logs.map((l) => l.roomName).filter(Boolean))];

  const filteredLogs = logs.filter((log) => {
    const d = new Date(log.createdAt);

    if (dateFilter) {
      const logDate = d.toISOString().slice(0, 10);
      if (logDate !== dateFilter) return false;
    }

    if (fromTime || toTime) {
      const hm = d.toTimeString().slice(0, 5); // "HH:MM"
      if (fromTime && hm < fromTime) return false;
      if (toTime && hm > toTime) return false;
    }

    if (roomFilter && log.roomName !== roomFilter) return false;

    if (textSearch.trim()) {
      const kw = textSearch.trim().toLowerCase();
      if (!(log.username || "").toLowerCase().includes(kw)) return false;
    }

    return true;
  });

  const onClearFilters = () => {
    setDateFilter("");
    setFromTime("");
    setToTime("");
    setRoomFilter("");
    setTextSearch("");
  };

  return (
  <Layout title="ประวัติการใช้งาน" subtitle="ตรวจสอบและค้นหาประวัติการปลดล็อกประตูย้อนหลัง">
    {error && <div className="error">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>ค้นหาประวัติการใช้งาน</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="auth-field-label">วันที่</label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
          <div>
            <label className="auth-field-label">ห้อง</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              style={{ padding: 12, borderRadius: 12, border: "1.5px solid #dde2ea", width: "100%" }}
            >
              <option value="">ทุกห้อง</option>
              {roomOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="auth-field-label">ตั้งแต่เวลา</label>
            <input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
          <div>
            <label className="auth-field-label">ถึงเวลา</label>
            <input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        </div>

        <label className="auth-field-label" style={{ marginTop: 12 }}>ชื่อผู้ใช้ (username)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="เช่น chayut.pa"
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button className="secondary" style={{ width: 120 }} onClick={onClearFilters}>
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      <div className="card">
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
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#666", padding: 20 }}>
                  ไม่พบประวัติที่ตรงกับตัวกรอง
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString("th-TH")}</td>
                  <td>{log.username}</td>
                  <td>{log.roomName || "-"}</td>
                  <td>{log.action}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
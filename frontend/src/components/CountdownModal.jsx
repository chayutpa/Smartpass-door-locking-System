import React, { useEffect, useState, useRef } from "react";
import { api } from "../api.js";

export default function CountdownModal({ roomId, roomName, seconds = 10, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const startTimeRef = useRef(Date.now());
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // เก็บ callback ล่าสุดไว้เสมอ กันปัญหา closure ค้างค่าเก่าใน interval

  useEffect(() => {
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(seconds - elapsedSec));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onCloseRef.current();
      }
    };

    const interval = setInterval(tick, 200);
    tick();

    // poll เช็คว่ามีคนกดปุ่มที่หน้าห้องสำเร็จแล้วหรือยัง ถ้าใช่ให้ปิด modal ทันทีไม่ต้องรอครบเวลา
    let cancelled = false;
    const pollStatus = async () => {
      if (!roomId || cancelled) return;
      try {
        const data = await api.checkUnlockStatus(roomId);
        if (data.status === "success" || data.status === "failed") {
          if (!cancelled) {
            clearInterval(interval);
            clearInterval(statusInterval);
            onCloseRef.current();
          }
        }
      } catch {
        // เงียบไว้ ไม่ต้องแสดง error แค่ลอง poll รอบถัดไปต่อ
      }
    };
    const statusInterval = setInterval(pollStatus, 1000); // เช็คทุก 1 วิ พอ ไม่ต้องถี่เท่าวงแหวน

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [seconds, roomId]);

  const progress = (secondsLeft / seconds) * 100;

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ textAlign: "center" }}>
        <h2>ส่งคำขอสำเร็จ!</h2>
        <p>
          กรุณากดปุ่มที่หน้าห้อง <b>{roomName}</b> ภายในเวลาที่กำหนด
        </p>

        <div className="countdown-ring-wrap">
          <svg viewBox="0 0 100 100" className="countdown-ring">
            <circle cx="50" cy="50" r="44" className="countdown-ring-bg" />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="countdown-ring-fg"
              style={{
                strokeDashoffset: 276.5 - (276.5 * progress) / 100,
                transition: "stroke-dashoffset 0.2s linear",
              }}
            />
          </svg>
          <span className="countdown-ring-number">{secondsLeft}</span>
        </div>

        <button className="secondary" onClick={() => onCloseRef.current()} style={{ marginTop: 16 }}>
          ปิด
        </button>
      </div>
    </div>
  );
}
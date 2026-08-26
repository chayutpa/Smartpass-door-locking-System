import React, { useEffect, useState } from "react";

export default function CountdownModal({ roomName, seconds = 10, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, onClose]);

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
              style={{ strokeDashoffset: 276.5 - (276.5 * progress) / 100 }}
            />
          </svg>
          <span className="countdown-ring-number">{secondsLeft}</span>
        </div>

        <button className="secondary" onClick={onClose} style={{ marginTop: 16 }}>
          ปิด
        </button>
      </div>
    </div>
  );
}
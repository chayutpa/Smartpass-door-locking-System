import React from "react";

export default function ConfirmModal({ title, message, confirmLabel = "ยืนยัน", danger, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary" onClick={onCancel} style={{ flex: 1 }}>
            ยกเลิก
          </button>
          <button className={danger ? "danger" : ""} onClick={onConfirm} style={{ flex: 1 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
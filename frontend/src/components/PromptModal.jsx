import React, { useState } from "react";

export default function PromptModal({ title, message, defaultValue = "", confirmLabel = "บันทึก", onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        <form onSubmit={onSubmit}>
          <input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="secondary" onClick={onCancel} style={{ flex: 1 }}>
              ยกเลิก
            </button>
            <button type="submit" style={{ flex: 1 }}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
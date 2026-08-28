import React from "react";

export default function ContactModal({ onClose }) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ color: "#1a1a1a" }}>ติดต่อแอดมิน</h2>
                <p>หากไม่มีสิทธิ์เข้าห้องที่ต้องการ หรือพบปัญหาการใช้งาน ติดต่อได้ตามช่องทางนี้</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 4, color: "#1a1a1a" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            นายชยุตม์ ปฐมกำเหนิด
                        </div>
                        <a href="tel:0851839086" style={{ display: "flex", alignItems: "center", gap: 8, color: "#2563eb", fontSize: 14, textDecoration: "none" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                            </svg>
                            085-183-9086
                        </a>
                    </div>

                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 4, color: "#1a1a1a" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            ผศ.ดร.อติราช สุขสวัสดิ์
                        </div>
                        <a href="tel:0954594163" style={{ display: "flex", alignItems: "center", gap: 8, color: "#2563eb", fontSize: 14, textDecoration: "none" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                            </svg>
                            061-451-5915
                        </a>
                    </div>
                </div>

                <button className="secondary" onClick={onClose} style={{ width: "100%" }}>
                    ปิด
                </button>
            </div>
        </div>
    );
}
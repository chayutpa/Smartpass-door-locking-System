# Smart Door Lock System

ระบบปลดล็อกประตูด้วย ESP32 + เว็บแอป ล็อกอินผ่าน SSO มหาวิทยาลัย รองรับหลายห้อง มีโหมดฉุกเฉินเมื่อไม่มีอินเทอร์เน็ต และระบบยืนยันตัวตนสองขั้นตอน (ขอสิทธิ์ผ่านเว็บ + กดปุ่มจริงที่หน้าห้อง) เพื่อป้องกันการสั่งปลดล็อกจากระยะไกล

## สถาปัตยกรรมระบบ
[เว็บแอป React] ---- HTTPS/REST ----> [Backend Fastify] <---- WebSocket ---- [ESP32 x หลายห้อง]
| |
|-- SSO มหาวิทยาลัย (OAuth2) |-- MongoDB Atlas

- **Frontend**: React + Vite, พอร์ต 3000
- **Backend**: Fastify + Mongoose, พอร์ต 4000
- **Database**: MongoDB Atlas
- **Hardware**: ESP32 + Relay + LCD I2C 16x2 + ปุ่มกดจริงหน้าห้อง

## Flow การล็อกอิน

1. เข้าเว็บครั้งแรก **ต้องล็อกอินผ่าน SSO มหาวิทยาลัยเท่านั้น** ไม่มีระบบสมัครสมาชิกด้วยตนเองแล้ว
2. Backend ดึงโปรไฟล์จาก SSO (ชื่อไทย, อีเมล, รหัสนักศึกษา, คณะ, สาขา) มาสร้าง/อัปเดตบัญชีผู้ใช้อัตโนมัติ
3. ถ้าคณะ/สาขาตรงกับที่ admin ตั้ง auto-grant ไว้ในห้องใด จะได้สิทธิ์ปลดล็อกห้องนั้นทันทีโดยไม่ต้องรออนุมัติ
4. ล็อกอินครั้งแรกจะมี popup ให้ตั้งรหัสผ่าน (ไม่บังคับ) — ถ้าตั้งไว้ ครั้งถัดไปล็อกอินด้วย username (=ssoId)/password ได้โดยไม่ต้องผ่าน SSO ก็ได้

## Flow การปลดล็อกประตู (สำคัญ — ระบบความปลอดภัย 2 ขั้นตอน)

เพื่อป้องกันการสั่งปลดล็อกจากที่ไหนก็ได้ ปุ่มบนเว็บไม่ได้ปลดล็อกประตูโดยตรงอีกต่อไป:

1. User กดปุ่ม **"ขอสิทธิ์"** ที่เว็บ (หรือสแกน QR Code หน้าห้อง เพื่อเข้าหน้าห้องนั้นโดยตรง)
2. Backend เช็คสิทธิ์ แล้วส่งคำสั่ง `arm` ไปยัง ESP32 ของห้องนั้น
3. ESP32 ขึ้นจอ "Ready to unlock! Press in Xs" นับถอยหลัง 10 วินาที
4. **ต้องมีคนไปกดปุ่มจริงที่ติดไว้หน้าห้อง** ภายใน 10 วินาที ประตูถึงจะปลดล็อกจริง (relay ทำงาน 5 วินาทีแล้วล็อกกลับอัตโนมัติ)
5. ถ้าไม่มีใครกดภายในเวลา คำขอถูกยกเลิกอัตโนมัติ ต้องขอสิทธิ์ใหม่

## QR Code ต่อห้อง

แต่ละห้องมี URL เฉพาะ `/r/<roomId>` — admin กดปุ่ม "QR Code" ในหน้าจัดการห้องเพื่อสร้าง QR ไปพิมพ์ติดหน้าห้อง สแกนแล้วเข้าหน้าขอสิทธิ์ของห้องนั้นโดยตรง (ถ้ายังไม่ login จะพาไปล็อกอินก่อนแล้วกลับมาหน้าห้องเดิมให้อัตโนมัติ)

## โหมดฉุกเฉิน (ไม่มีอินเทอร์เน็ต)

ESP32 แต่ละตัวเช็คสถานะ WiFi/backend แยกกันชัดเจน:

| สถานะจอ | ความหมาย |
|---|---|
| `No Internet / Press 1x=AP` | WiFi หลุด ไม่เชื่อมต่อ router |
| `Server offline / Press 1x=AP` | WiFi เชื่อมปกติ แต่ backend/เน็ตต่อไม่ได้ |
| `Room XXX / Ready` | ทุกอย่างปกติ |
| `Connect to WiFi: DoorLock-Offline` | อยู่ในโหมดฮอตสปอตสำรอง |

**วิธีเข้าโหมดฉุกเฉิน**: กดปุ่มที่หน้าห้อง 1 ครั้งเมื่อจอแสดงสถานะออฟไลน์ ESP32 จะเปิดฮอตสปอต `DoorLock-Offline` พร้อม captive portal (เด้ง popup ให้กรอกรหัสอัตโนมัติเหมือน WiFi สาธารณะทั่วไป) ให้กรอกรหัสฉุกเฉิน 6 หลัก (สร้าง/ดูได้จากหน้า admin จัดการห้อง) รหัสใช้ได้ครั้งเดียว มีระบบ lockout แบบ exponential backoff กันการเดารหัสสุ่ม กดปุ่ม 1 ครั้งอีกทีเพื่อออกจากโหมดนี้ได้ทันที หรือระบบจะออกให้เองอัตโนมัติเมื่อเชื่อมต่อ backend ได้จริง

## โครงสร้างโปรเจกต์
smart-door-lock/
├── backend/
│ ├── src/
│ │ ├── models/ # User, Room, AccessLog, SsoState
│ │ ├── routes/ # auth (SSO+password), admin, door, rooms
│ │ ├── middleware/ # JWT auth
│ │ ├── ws/esp32.js # WebSocket handler + arm/unlock logic
│ │ ├── db.js
│ │ ├── server.js
│ │ └── seedAdmin.js # สร้าง admin คนแรกแบบไม่ผ่าน SSO
│ ├── Dockerfile
│ └── .env.example
├── frontend/
│ ├── src/
│ │ ├── pages/ # Root(login), Dashboard, AdminRooms, AdminUsers, AdminLogs, Manual, RoomUnlock
│ │ ├── components/ # Layout, Sidebar, LoginForm, SetPasswordModal
│ │ ├── App.jsx # routing + AuthProvider
│ │ └── api.js
│ ├── Dockerfile
│ └── .env.example
└── esp32/
└── esp32_door_lock.ino

## หน้าเว็บทั้งหมด

- `/` — หน้าแรก: ล็อกอิน (ถ้ายังไม่เข้าระบบ) หรือปุ่มขอสิทธิ์ทุกห้อง (ถ้าเข้าระบบแล้ว)
- `/r/:roomId` — หน้าขอสิทธิ์เฉพาะห้อง (สำหรับสแกน QR)
- `/manual` — คู่มือการใช้งาน แยกเนื้อหา User/Admin อัตโนมัติตาม role
- `/admin/rooms` — จัดการห้อง: เพิ่มห้อง, QR Code, secret, auto-grant สิทธิ์ตามคณะ/สาขา, รหัสฉุกเฉิน (เฉพาะ admin)
- `/admin/users` — จัดการผู้ใช้: ค้นหา, ดูรายละเอียด, กำหนดสิทธิ์ห้อง, เปลี่ยนบทบาท (เฉพาะ admin)
- `/admin/logs` — ประวัติการใช้งาน: กรองตามวันที่/เวลา/ห้อง/ผู้ใช้ (เฉพาะ admin)

## การตั้งค่า SSO

ต้องมี OAuth Application ของตัวเอง (Authorization Code Grant) กรอกค่าใน `backend/.env`:

```env
SSO_CLIENT_ID=...
SSO_CLIENT_SECRET=...
SSO_REDIRECT_URI=http://localhost:3000     # ต้องตรงกับ Login callback ที่ลงทะเบียนไว้เป๊ะๆ
SSO_AUTHORIZE_URL=https://.../oauth2/authorize/
SSO_TOKEN_URL=https://.../oauth2/token/
SSO_USERINFO_URL=https://.../oauth2/resources/user/
SSO_SCOPE=read
```

**หมายเหตุ**: การแลก token ส่งแค่ 4 พารามิเตอร์ (`client_id`, `code`, `grant_type`, `client_secret`) ไม่ส่ง `redirect_uri` ซ้ำตาม spec ของระบบ SSO ที่ใช้อยู่

## รัน Backend

```bash
cd backend
cp .env.example .env   # กรอกค่าจริงให้ครบ (MongoDB, JWT, SSO)
npm install
npm run dev
```

สร้าง admin คนแรก (ไม่ผ่าน SSO เพราะยังไม่มีใครในระบบ):
```bash
npm run seed:admin -- <loginId> <password>
```

## รัน Frontend

```bash
cd frontend
cp .env.example .env   # ตั้ง VITE_API_URL
npm install
npm run dev
```

พอร์ตตายตัวที่ 3000 (ตั้งใน `vite.config.js`) เพราะต้องตรงกับ Login callback ที่ลงทะเบียนกับ SSO

## ESP32 Firmware

ไลบรารีที่ต้องติดตั้งผ่าน Arduino Library Manager:
- WebSockets (Markus Sattler)
- ArduinoJson
- LiquidCrystal I2C

**ตั้งค่าในโค้ดก่อน upload**:
- `WIFI_SSID` / `WIFI_PASSWORD`
- `WS_HOST` — IP หรือโดเมนของ backend (ต้องอัปเดตถ้า IP เปลี่ยน แนะนำตั้ง DHCP reservation ที่ router)
- `WS_PATH` — secret เฉพาะห้อง (คัดลอกจากหน้า admin ตอนสร้างห้อง)
- `ROOM_LABEL` — ชื่อห้องที่แสดงบนจอ
- `OFFLINE_AP_PASSWORD` — รหัส WiFi ของโหมดฉุกเฉิน (ควรตั้งให้คาดเดายาก)

**การต่อฮาร์ดแวร์**:
- Relay → GPIO14
- ปุ่มกดจริง → GPIO27 (INPUT_PULLUP, อีกขาต่อ GND)
- LCD I2C → SDA (GPIO21), SCL (GPIO22)
- **แนะนำแยกไฟเลี้ยง relay และจอ LCD ออกจาก ESP32** (ไม่ใช้ไฟจากขา 3.3V/5V ของบอร์ดโดยตรง) เพื่อป้องกัน brownout reset ตอน relay ทำงาน — ต่อ GND ร่วมกันเสมอ

## Docker

มี `Dockerfile` แยกทั้ง backend และ frontend พร้อม `.dockerignore` (ไม่ commit ไฟล์ `.env`/`node_modules` ขึ้น git — ตรวจสอบ `.gitignore` ที่ root ให้ครบก่อน push เสมอ)

```bash
cd backend && docker build -t smart-door-backend .
docker run -p 4000:4000 --env-file .env smart-door-backend
```

## ความปลอดภัย

- Secret ต่อห้อง (ESP32 WebSocket auth) แยกกันคนละค่า สุ่มใหม่ได้จากหน้า admin
- Backend heartbeat เช็คว่า ESP32 ยังออนไลน์จริงทุก 5 วินาที (ไม่พึ่ง TCP timeout อย่างเดียว)
- CSRF protection สำหรับ SSO flow ด้วย `state` แบบใช้ครั้งเดียว (เก็บใน MongoDB, TTL 10 นาที)
- ปลดล็อกต้องยืนยันตัวจริงที่หน้าห้อง (ปุ่มกดจริง) ไม่ใช่แค่กดปุ่มบนเว็บ
- รหัสฉุกเฉิน offline มีระบบ lockout ป้องกันการเดารหัสสุ่ม
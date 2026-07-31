# Smart Door Lock (Fastify + React + ESP32 + MongoDB Atlas) — รองรับหลายห้อง

โปรเจกต์นี้ประกอบด้วย 3 ส่วน:
- `backend/` — Fastify API + WebSocket server + MongoDB (mongoose)
- `frontend/` — React (Vite) หน้าเว็บล็อกอิน/ปลดล็อก/แผงควบคุม admin
- `esp32/` — โค้ด Arduino สำหรับ ESP32 ที่ต่อกับ relay (เฟิร์มแวร์เดียวกัน ใช้ได้กับทุกห้อง แค่เปลี่ยนค่า secret)

## ภาพรวมการทำงาน (หลายห้อง)
1. แต่ละ "ห้อง" คือประตู 1 บาน มี ESP32 ของตัวเอง และมี **secret เฉพาะห้อง** (สุ่มโดย backend ตอน admin สร้างห้อง)
2. Admin ล็อกอิน -> ไปหน้า `/admin` -> เพิ่มห้องใหม่ (ตั้งชื่อ เช่น "311") -> ระบบสุ่ม secret มาให้ -> คัดลอกไปฝังในโค้ด ESP32 ของห้องนั้น (ตัวแปร `WS_PATH`) แล้ว upload ขึ้นบอร์ด
3. ESP32 ของห้องนั้นเชื่อม WebSocket ไปที่ backend พร้อมแนบ secret -> backend เช็คว่า secret ตรงกับห้องไหนในฐานข้อมูล แล้วจดจำว่า connection นี้เป็นของห้องนั้น
4. Admin ไปที่ตาราง "สิทธิ์ผู้ใช้ต่อห้อง" ติ๊กเปิด/ปิดว่า user คนไหนปลดล็อกห้องไหนได้บ้าง (เช่น user1 ติ๊กห้อง 311 แต่ไม่ติ๊กห้อง 312)
5. User ล็อกอิน -> หน้า Dashboard แสดงห้องทั้งหมดที่มีในระบบ พร้อมสถานะออนไลน์ของแต่ละห้อง -> กดปลดล็อกได้เฉพาะห้องที่ admin อนุญาต (ปุ่มห้องอื่นจะถูก disable)
6. Backend เช็คสิทธิ์สดจากฐานข้อมูลทุกครั้งที่กดปลดล็อก (ไม่ cache ใน JWT) แล้วส่งคำสั่งไปยัง ESP32 ของห้องนั้นเจาะจง ไม่กระจายไปห้องอื่น
7. Admin เป็นข้อยกเว้นพิเศษ: ปลดล็อกได้ทุกห้องโดยอัตโนมัติ ไม่ต้องตั้งสิทธิ์แยกทีละห้อง

## 1) ตั้งค่า MongoDB Atlas
1. สมัคร/ล็อกอิน https://cloud.mongodb.com แล้วสร้าง Cluster (ใช้ free tier M0 ได้)
2. ไปที่ **Database Access** สร้าง user + password สำหรับต่อฐานข้อมูล
3. ไปที่ **Network Access** เพิ่ม IP ที่อนุญาต (ตอน dev ใส่ `0.0.0.0/0` ได้ก่อน แต่ตอน production ควรจำกัด IP ของ server จริง)
4. ไปที่ **Database -> Connect -> Drivers -> Node.js** จะได้ connection string
5. เอามาใส่ใน `backend/.env` ที่ตัวแปร `MONGODB_URI` (เพิ่ม `/smart_door` ต่อท้าย host เพื่อระบุชื่อ database เช่นใน `.env.example`)

## 2) รัน Backend
```bash
cd backend
cp .env.example .env   # แล้วแก้ค่าจริงทั้งหมด (MONGODB_URI, JWT_SECRET)
npm install
npm run seed:admin -- myadmin StrongPassword123   # สร้าง admin คนแรก
npm run dev
```
Backend จะรันที่ `http://localhost:4000`
- REST API: `http://localhost:4000/api/...`
- WebSocket สำหรับ ESP32 (ทุกห้องใช้ path เดียวกัน แยกกันด้วย secret): `ws://localhost:4000/ws/esp32?secret=...`

> หมายเหตุ: เวอร์ชันหลายห้องนี้ **ไม่มี** ตัวแปร `ESP32_DEVICE_SECRET` ใน `.env` อีกต่อไป เพราะ secret ย้ายไปผูกกับแต่ละห้องในฐานข้อมูลแทน (สร้างผ่านหน้าเว็บ admin)

## 3) รัน Frontend
```bash
cd frontend
cp .env.example .env   # ตั้ง VITE_API_URL ให้ตรงกับ backend
npm install
npm run dev
```
เปิดเบราว์เซอร์ที่ `http://localhost:5173`

## 4) สร้างห้องแรกและตั้งสิทธิ์
1. ล็อกอินด้วยบัญชี admin ที่ seed ไว้ -> ไปหน้า `/admin`
2. ที่การ์ด "ห้อง / ประตู" พิมพ์ชื่อห้อง (เช่น `311`) แล้วกด "เพิ่มห้อง"
3. ระบบจะโชว์ secret ยาวๆ ให้ครั้งเดียว — **คัดลอกเก็บไว้ทันที** เพราะปิดหน้าไปแล้วจะไม่เห็นซ้ำ (ต้องกด "สุ่ม secret ใหม่" ถ้าทำหาย)
4. เอา secret นี้ไปวางที่ตัวแปร `WS_PATH` ในไฟล์ `esp32/esp32_door_lock.ino` (ดูขั้นตอนละเอียดในหัวข้อ 5)
5. ทำซ้ำข้อ 2-4 สำหรับห้องอื่นๆ เช่น `312`
6. ที่การ์ด "สิทธิ์ผู้ใช้ต่อห้อง" จะเห็นตารางที่มีคอลัมน์เป็นชื่อห้องแต่ละห้อง ติ๊ก/ไม่ติ๊กเพื่อกำหนดว่า user คนไหนปลดล็อกห้องไหนได้บ้าง

## 5) เชื่อมต่อ ESP32 (ทำซ้ำทุกห้อง)
ฮาร์ดแวร์ที่ใช้: ESP32 dev board + โมดูล relay 1 ช่อง + กลอนประตูไฟฟ้า (electric strike / solenoid lock) + จอ LCD I2C (ไม่บังคับ)

**การต่อวงจร relay (ตัวอย่าง):**
- ESP32 GPIO26 -> ขา IN ของโมดูล relay
- ESP32 GND -> GND ของโมดูล relay (และ GND ของแหล่งจ่ายกลอนประตูต้องร่วมกัน)
- ESP32 5V/VIN -> VCC ของโมดูล relay (เช็ค spec โมดูล relay ว่าใช้ 5V หรือ 3.3V)
- ขา COM/NO ของ relay -> ต่ออนุกรมกับสายไฟที่จ่ายให้กลอนประตู (ใช้แหล่งจ่ายแยกสำหรับกลอนประตู ไม่ใช้ไฟจาก ESP32 โดยตรง เพราะกลอนประตูกินกระแสสูงกว่ามาก)
- แนะนำให้มี flyback diode ที่ตัวกลอน (solenoid lock) เพื่อป้องกันแรงดันย้อนกลับทำลายวงจร (โมดูล relay สำเร็จรูปส่วนใหญ่มีมาให้แล้ว)
- ถ้าเจอไฟกระชากตอนต่อ WiFi ทำให้จอ/บอร์ดทำงานแปลกๆ ให้แยกแหล่งจ่ายไฟ relay ออกจาก ESP32/จอ และเติม capacitor คร่อม VCC-GND

**การต่อจอ LCD I2C (ไม่บังคับ แต่โค้ดตัวอย่างเปิดใช้งานไว้แล้ว):**
- VCC -> 5V, GND -> GND, SDA -> GPIO21, SCL -> GPIO22
- จอแสดงลำดับสถานะอัตโนมัติ: "Connecting WiFi" → "WiFi Connected" (พร้อม IP) → "Connecting to Server" → "Ready" → ตอนปลดล็อกขึ้น "Door Unlocked! Lock in Ns" นับถอยหลัง
- ถ้าจอไม่ขึ้นอะไรเลย ให้รัน I2C Scanner sketch หา address จริง แล้วแก้ค่า `LCD_ADDR` (ส่วนใหญ่เป็น `0x27` หรือ `0x3F`)

**ขั้นตอนตั้งค่าโค้ด (`esp32/esp32_door_lock.ino`) — ทำซ้ำสำหรับ ESP32 ทุกตัว/ทุกห้อง:**
1. เปิดไฟล์ด้วย Arduino IDE, ติดตั้ง ESP32 board package (Boards Manager -> ค้นหา "esp32" โดย Espressif)
2. ติดตั้งไลบรารีผ่าน Library Manager: `WebSockets` (โดย Markus Sattler), `ArduinoJson`, และ `LiquidCrystal I2C` (โดย Frank de Brabander)
3. แก้ค่าตัวแปรด้านบนของไฟล์:
   - `WIFI_SSID`, `WIFI_PASSWORD` — ชื่อ/รหัส WiFi (ต้องเป็นวงเดียวกับเครื่องที่รัน backend หรือ public domain ถ้า deploy จริง)
   - `WS_HOST`, `WS_PORT` — IP/domain และพอร์ตของเครื่องที่รัน backend
   - `WS_PATH` — ใส่ secret **ของห้องนี้โดยเฉพาะ** ที่คัดลอกมาจากหน้าเว็บ admin ตอนสร้างห้อง (ห้ามใช้ secret ห้องอื่นซ้ำ)
   - `ROOM_LABEL` — ชื่อห้องที่จะโชว์บนจอ LCD เท่านั้น (ไม่ผูกกับระบบยืนยันตัวตน) ตั้งให้ตรงกับชื่อห้องที่ตั้งไว้ในเว็บ admin จะได้ไม่งง
4. เลือกบอร์ดที่ถูกต้องใน Tools -> Board (เช่น "ESP32 Dev Module") และเลือกพอร์ต USB ที่ถูกต้อง
5. กด Upload แล้วเปิด Serial Monitor (115200 baud) เพื่อดู log การเชื่อมต่อ WiFi และ WebSocket
6. กลับไปที่หน้าเว็บ Dashboard ควรเห็นห้องนี้ขึ้นสถานะ "ออนไลน์"

**หลักการทำงานของ WebSocket (แยกห้องด้วย secret):**
- ESP32 แต่ละตัวเป็นฝ่าย "client" ที่เปิดการเชื่อมต่อค้างไว้กับ backend ตลอดเวลา ผ่าน path เดียวกันคือ `/ws/esp32` แต่แนบ `?secret=...` ของห้องตัวเองไปด้วย
- Backend รับ connection เข้ามาแล้วค้นหาในฐานข้อมูลว่า secret นี้ตรงกับห้องไหน ถ้าไม่พบเลย (secret ผิด) จะตัดการเชื่อมต่อทันที
- เมื่อ user กดปลดล็อกห้องใดห้องหนึ่ง (`POST /api/door/:roomId/unlock`) backend จะส่งคำสั่งไปยัง **เฉพาะ** connection ที่เป็นของห้องนั้น ห้องอื่นจะไม่ได้รับคำสั่งเลย
- ESP32 สั่ง relay แล้วตอบกลับ `{"type":"ack","requestId":"...","status":"ok"}` ทันทีหลังปลดล็อกสำเร็จ (ก่อนเริ่มนับถอยหลังบนจอ) เพื่อให้ backend รู้ว่าสำเร็จโดยไม่ต้องรอ
- ถ้า ESP32 หลุดเน็ต ไลบรารีจะพยายาม reconnect อัตโนมัติทุก 5 วิ และหน้าเว็บจะเช็คสถานะออนไลน์ของทุกห้องทุก 5 วิ ผ่าน `/api/rooms`

**เรื่อง production ที่ควรทำเพิ่ม (ไม่ได้ทำไว้ในโค้ดตัวอย่างนี้):**
- รัน backend หลัง HTTPS/reverse proxy (เช่น nginx + Let's Encrypt) แล้วให้ ESP32 ต่อผ่าน `wss://` (ตั้ง `USE_TLS = true` และ `secure: true` ของ cookie)
- เปลี่ยน `JWT_SECRET` เป็นค่าที่สุ่มยาวๆ จริงจัง อย่าใช้ค่าตัวอย่าง (secret ของแต่ละห้องระบบสุ่มให้อัตโนมัติอยู่แล้วตอนสร้างห้อง ไม่ต้องตั้งเอง)
- จำกัด Network Access ของ MongoDB Atlas ให้เหลือเฉพาะ IP ของ server ที่รัน backend จริง
- ถ้า secret ของห้องไหนรั่วไหล (เช่น ESP32 หาย) ให้กด "สุ่ม secret ใหม่" ที่หน้า admin แล้วอัปโหลดโค้ดใหม่ให้ ESP32 ตัวที่เหลือของห้องนั้นทันที เพราะของเก่าจะใช้เชื่อมต่อไม่ได้อีก

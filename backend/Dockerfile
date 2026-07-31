# ใช้ Node.js เวอร์ชัน 20 แบบ slim (image เล็ก โหลดเร็ว)
FROM node:20-slim

WORKDIR /app

# ก็อปแค่ package.json ก่อน เพื่อให้ Docker cache ขั้นตอน npm install ไว้
# (ถ้าโค้ดเปลี่ยนแต่ dependency ไม่เปลี่ยน จะไม่ต้อง npm install ใหม่ทุกครั้ง build เร็วขึ้นมาก)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ค่อยก็อปโค้ดที่เหลือทั้งหมดเข้ามา
COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
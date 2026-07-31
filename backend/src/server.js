import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";

import { connectDB } from "./db.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import doorRoutes from "./routes/door.js";
import roomsRoutes from "./routes/rooms.js";
import esp32WsRoute from "./ws/esp32.js";

const fastify = Fastify({ logger: true });

await connectDB();

await fastify.register(cors, {
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true, // จำเป็นเพื่อให้ browser ส่ง cookie ไปกับ request ข้าม origin
});

await fastify.register(cookie);

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  cookie: { cookieName: "token", signed: false },
});

await fastify.register(websocket);

// decorator ให้ทุก route เรียกใช้ preHandler ได้ง่ายๆ ว่า fastify.authenticate / fastify.requireAdmin
fastify.decorate("authenticate", requireAuth);
fastify.decorate("requireAdmin", requireAdmin);

await fastify.register(authRoutes);
await fastify.register(adminRoutes);
await fastify.register(doorRoutes);
await fastify.register(roomsRoutes);
await fastify.register(esp32WsRoute);

fastify.get("/api/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT) || 4000;
fastify
  .listen({ port, host: "0.0.0.0" })
  .then(() => fastify.log.info(`Server listening on port ${port}`))
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });

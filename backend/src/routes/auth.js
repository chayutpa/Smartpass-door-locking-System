import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { SsoState } from "../models/SsoState.js";

function ssoConfig() {
  return {
    clientId: process.env.SSO_CLIENT_ID,
    clientSecret: process.env.SSO_CLIENT_SECRET,
    redirectUri: process.env.SSO_REDIRECT_URI,
    authorizeUrl: process.env.SSO_AUTHORIZE_URL,
    tokenUrl: process.env.SSO_TOKEN_URL,
    userinfoUrl: process.env.SSO_USERINFO_URL,
    scope: process.env.SSO_SCOPE || "read",
  };
}

// SSO ของ มทร.อีสาน ส่งทุก field มาเป็น array เช่น {"uid":["chayut.pa"]}
function pickField(obj, candidates) {
  for (const key of candidates) {
    let value = obj?.[key];
    if (Array.isArray(value)) value = value[0];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

// เช็ค autoGrantFaculties ของทุกห้อง แล้วให้สิทธิ์ user คนนี้อัตโนมัติถ้าคณะ/สาขาตรงกัน
// เรียกเฉพาะตอน user ใหม่ล็อกอิน SSO ครั้งแรกเท่านั้น (ไม่ทับสิทธิ์ที่ admin ปรับเองทีหลัง)
async function autoGrantRooms(user) {
  if (!user.faculty && !user.program) return;

  const rooms = await Room.find({ autoGrantFaculties: { $exists: true, $ne: [] } });

  for (const room of rooms) {
    // เช็คแบบ "คำที่ admin พิมพ์ไว้ อยู่ในข้อความคณะ/สาขาจริงหรือไม่" (ไม่ต้องตรงเป๊ะทุกตัวอักษร)
    const matched = room.autoGrantFaculties.some((keyword) => {
      const kw = keyword.trim();
      if (!kw) return false;
      return (user.faculty && user.faculty.includes(kw)) || (user.program && user.program.includes(kw));
    });

    if (matched && !user.allowedRooms.some((r) => r.toString() === room._id.toString())) {
      user.allowedRooms.push(room._id);
    }
  }
}

export default async function authRoutes(fastify) {
  fastify.post("/api/auth/sso/init", async (request, reply) => {
    const cfg = ssoConfig();
    if (!cfg.clientId || !cfg.authorizeUrl) {
      return reply.code(500).send({ error: "ยังไม่ได้ตั้งค่า SSO ใน backend/.env ให้ครบ" });
    }

    const state = crypto.randomBytes(24).toString("hex");
    await SsoState.create({ state });

    const authorizeUrl = new URL(cfg.authorizeUrl);
    authorizeUrl.searchParams.set("client_id", cfg.clientId);
    authorizeUrl.searchParams.set("redirect_uri", cfg.redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", cfg.scope);
    authorizeUrl.searchParams.set("state", state);

    return reply.send({ authorizeUrl: authorizeUrl.toString() });
  });

  fastify.post("/api/auth/sso/exchange", async (request, reply) => {
    const { code, state } = request.body || {};
    if (!code || !state) return reply.code(400).send({ error: "ขาด code หรือ state" });

    const stateDoc = await SsoState.findOneAndDelete({ state });
    if (!stateDoc) {
      return reply.code(400).send({ error: "state ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาล็อกอินใหม่อีกครั้ง" });
    }

    const cfg = ssoConfig();

    let tokenData;
    try {
      const tokenRes = await fetch(cfg.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: cfg.clientId,
          code,
          grant_type: "authorization_code",
          client_secret: cfg.clientSecret,
        }),
      });
      tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        fastify.log.error(`SSO token exchange ล้มเหลว: ${JSON.stringify(tokenData)}`);
        return reply.code(502).send({ error: "แลก token กับ SSO ไม่สำเร็จ" });
      }
    } catch (err) {
      return reply.code(502).send({ error: "ติดต่อ SSO token endpoint ไม่ได้" });
    }

    let profile;
    try {
      const profileRes = await fetch(cfg.userinfoUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      profile = await profileRes.json();
      if (!profileRes.ok) {
        return reply.code(502).send({ error: "ดึงโปรไฟล์จาก SSO ไม่สำเร็จ" });
      }
    } catch (err) {
      return reply.code(502).send({ error: "ติดต่อ SSO userinfo endpoint ไม่ได้" });
    }

    fastify.log.info(`SSO userinfo raw response: ${JSON.stringify(profile)}`);

    const ssoId = pickField(profile, ["uid", "username", "sub", "login"]);
    if (!ssoId) {
      return reply.code(502).send({ error: "ไม่พบ field ที่ใช้เป็นตัวระบุตัวตนจาก SSO response" });
    }

    const firstNameThai = pickField(profile, ["firstNameThai"]);
    const lastNameThai = pickField(profile, ["lastNameThai"]);
    const prenameThai = pickField(profile, ["prename"]); // คำนำหน้า เช่น "นาย", "นาง"

    const displayNameThai = firstNameThai && lastNameThai ? `${prenameThai}${firstNameThai} ${lastNameThai}` : "";
    const displayName = displayNameThai || pickField(profile, ["displayName", "gecos", "name"]);
    const email = pickField(profile, ["mail", "email"]);
    const studentId = pickField(profile, ["studentId", "student_id", "employeeId"]);
    const faculty = pickField(profile, ["faculty"]);
    const program = pickField(profile, ["program"]);

    let user = await User.findOne({ ssoId });
    const isNewUser = !user;
    if (!user) user = new User({ ssoId, allowedRooms: [] });

    user.displayName = displayName || user.displayName;
    user.email = email || user.email;
    user.studentId = studentId || user.studentId;
    user.faculty = faculty || user.faculty;
    user.program = program || user.program;
    user.ssoRawProfile = profile;

    if (isNewUser) {
      await autoGrantRooms(user); // ให้สิทธิ์ห้องอัตโนมัติเฉพาะตอนสร้าง user ใหม่เท่านั้น
    }

    await user.save();

    const token = fastify.jwt.sign({ sub: user._id.toString(), ssoId: user.ssoId, role: user.role }, { expiresIn: "12h" });
    reply.setCookie("token", token, {
      path: "/", httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return reply.send({
      user: { id: user._id, ssoId: user.ssoId, displayName: user.displayName, role: user.role },
      needsPasswordSetup: !user.hasPassword,
    });
  });

  fastify.post("/api/auth/set-password", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { password } = request.body || {};
    if (!password || password.length < 8) {
      return reply.code(400).send({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
    }
    const user = await User.findById(request.user.sub);
    if (!user) return reply.code(404).send({ error: "ไม่พบผู้ใช้" });
    if (user.hasPassword) {
      return reply.code(400).send({ error: "ตั้งรหัสผ่านไปแล้ว" });
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.hasPassword = true;
    await user.save();
    return reply.send({ message: "ตั้งรหัสผ่านสำเร็จ" });
  });

  fastify.post("/api/auth/login", async (request, reply) => {
    const { loginId, password } = request.body || {};
    if (!loginId || !password) return reply.code(400).send({ error: "กรุณากรอก username และ password" });

    const user = await User.findOne({ ssoId: loginId.trim() });
    if (!user || !user.hasPassword) {
      return reply.code(401).send({ error: "ไม่พบบัญชีนี้ หรือยังไม่เคยตั้งรหัสผ่าน กรุณาล็อกอินด้วย SSO ก่อน" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return reply.code(401).send({ error: "username หรือ password ไม่ถูกต้อง" });

    const token = fastify.jwt.sign({ sub: user._id.toString(), ssoId: user.ssoId, role: user.role }, { expiresIn: "12h" });
    reply.setCookie("token", token, {
      path: "/", httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production", 
    });
    return reply.send({
      user: { id: user._id, ssoId: user.ssoId, displayName: user.displayName, role: user.role },
      needsPasswordSetup: false,
    });
  });

  fastify.post("/api/auth/logout", async (request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.send({ message: "ออกจากระบบแล้ว" });
  });

  fastify.get("/api/auth/me", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await User.findById(request.user.sub).select("-passwordHash -ssoRawProfile");
    if (!user) return reply.code(404).send({ error: "ไม่พบผู้ใช้" });
    return reply.send({ user, needsPasswordSetup: !user.hasPassword });
  });
}
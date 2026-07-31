const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include", // สำคัญ: ให้ browser แนบ cookie (JWT) ไปด้วยทุกครั้ง
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "เกิดข้อผิดพลาด");
  }
  return data;
}

export const api = {
  register: (username, password, displayName) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify({ username, password, displayName }) }),
  login: (username, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),

  listRooms: () => request("/api/rooms"),
  unlockRoom: (roomId) => request(`/api/door/${roomId}/unlock`, { method: "POST" }),

  listUsers: () => request("/api/admin/users"),
  updateUserRole: (id, role) => request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  setUserRoomAccess: (id, roomId, allow) =>
    request(`/api/admin/users/${id}/rooms/${roomId}`, { method: "PATCH", body: JSON.stringify({ allow }) }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: "DELETE" }),

  listAdminRooms: () => request("/api/admin/rooms"),
  createRoom: (name) => request("/api/admin/rooms", { method: "POST", body: JSON.stringify({ name }) }),
  renameRoom: (id, name) => request(`/api/admin/rooms/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  regenerateRoomSecret: (id) => request(`/api/admin/rooms/${id}/regenerate-secret`, { method: "POST" }),
  deleteRoom: (id) => request(`/api/admin/rooms/${id}`, { method: "DELETE" }),
  generateOfflineCodes: (roomId) => request(`/api/admin/rooms/${roomId}/offline-codes/generate`, { method: "POST" }),
  regenerateOfflineCode: (roomId, index) =>
    request(`/api/admin/rooms/${roomId}/offline-codes/${index}/regenerate`, { method: "POST" }),
  
  listLogs: () => request("/api/admin/logs"),
};

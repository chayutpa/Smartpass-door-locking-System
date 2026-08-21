import React, { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api.js";
import Root from "./pages/Root.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminRooms from "./pages/AdminRooms.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminLogs from "./pages/AdminLogs.jsx";
import Manual from "./pages/Manual.jsx";
import RoomUnlock from "./pages/RoomUnlock.jsx";
import SetPasswordModal from "./components/SetPasswordModal.jsx";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api.me();
      setUser(data.user);
      setNeedsPasswordSetup(data.needsPasswordSetup);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, needsPasswordSetup, setNeedsPasswordSetup, refresh, loading }}>
      {children}
      {user && needsPasswordSetup && <SetPasswordModal onDone={() => setNeedsPasswordSetup(false)} />}
    </AuthContext.Provider>
  );
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/r/:roomId" element={<RoomUnlock />} />
          <Route path="/manual" element={<PrivateRoute><Manual /></PrivateRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/rooms" replace />} />
          <Route path="/admin/rooms" element={<AdminRoute><AdminRooms /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
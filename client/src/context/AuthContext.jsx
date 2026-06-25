import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api, API_BASE_URL } from "../lib/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  // authLoading = true while we verify the token on first boot
  const [authLoading, setAuthLoading] = useState(() => !!localStorage.getItem("token"));
  const refreshTimerRef = useRef(null);

  // On first mount: if we have a stored token, silently refresh it to confirm it's still valid
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) { setAuthLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST", credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          setToken(data.token);
        } else {
          // Refresh failed — clear everything
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } catch {
        // Network error — keep existing token optimistically
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // Listen for forced logout triggered by 401 interceptor when refresh also fails
  useEffect(() => {
    const handler = () => {
      clearInterval(refreshTimerRef.current);
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // Auto-refresh access token every 13 minutes (before 15min expiry)
  useEffect(() => {
    if (!token) return;
    const refresh = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST", credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          setToken(data.token);
        } else {
          logoutUser();
        }
      } catch { /* ignore */ }
    };
    refreshTimerRef.current = setInterval(refresh, 13 * 60 * 1000);
    return () => clearInterval(refreshTimerRef.current);
  }, [!!token]);

  const loginUser = (payload) => {
    if (payload.token) { localStorage.setItem("token", payload.token); setToken(payload.token); }
    if (payload.user)  { localStorage.setItem("user", JSON.stringify(payload.user)); setUser(payload.user); }
  };

  const logoutUser = () => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearInterval(refreshTimerRef.current);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, authLoading, loginUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
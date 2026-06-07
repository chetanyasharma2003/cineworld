import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

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
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (!cancelled) setUser(res.data.user);
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const loginUser = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    setAuthLoading(false);
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    setAuthLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, authLoading, loginUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

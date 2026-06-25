import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    // Don't retry auth endpoints to avoid loops
    const isAuthCall = original.url?.includes("/auth/");
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Refresh failed");
        const data = await res.json();
        const newToken: string = data.token;
        localStorage.setItem("token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 429 Too Many Requests — show a toast and reject
    if (error.response?.status === 429) {
      toast.error("Too many requests — please wait a moment.", { id: "rate-limit" });
    }

    return Promise.reject(error);
  }
);

export const imageUrl = (path: string | null | undefined, size = "w500"): string => {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const posterFallback = (title = "Movie"): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=333&color=fff&size=300`;
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong"): string => {
  if (error instanceof AxiosError) return error.response?.data?.message || fallback;
  return fallback;
};

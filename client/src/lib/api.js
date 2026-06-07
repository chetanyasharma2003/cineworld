import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const imageUrl = (path, size = "w500") => {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const posterFallback = (title = "Movie") => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=333&color=fff&size=300`;
};

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  return error.response?.data?.message || fallback;
};

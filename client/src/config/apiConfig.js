// API configuration - automatically detects environment
const getApiBaseUrl = () => {
  // 1. Check if explicit env var is set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. In production (Vercel), use Render backend
  if (import.meta.env.PROD) {
    return 'https://cineworld-4b28.onrender.com/api';
  }

  // 3. In development, use localhost
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
};

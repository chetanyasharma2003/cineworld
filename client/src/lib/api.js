import { API_BASE_URL } from "../config/apiConfig";

// HTTP error wrapper
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

// Fetch wrapper with auth token
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new APIError(
      data.error || data.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return data;
};

export const api = {
  get: (endpoint) => fetchWithAuth(endpoint),
  post: (endpoint, body) =>
    fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    fetchWithAuth(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint) => fetchWithAuth(endpoint, { method: "DELETE" }),
};

export { API_BASE_URL };

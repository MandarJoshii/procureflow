import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach the JWT token to every request, if we have one stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("procureflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
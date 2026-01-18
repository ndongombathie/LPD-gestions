// src/services/api.js
import axios from "axios";

export const API_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Si tu utilises un token (login)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

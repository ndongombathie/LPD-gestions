// src/services/authService.js
import api from "./api";

export async function loginUser(phone, password) {
  try {
    const response = await api.post("/login", {
      phone,
      password,
    });

    // suppose que Laravel renvoie un token
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  } catch (error) {
    console.error("Erreur login:", error.response?.data || error.message);
    throw error;
  }
}

import axios from "axios";

// Récupération de l’URL de base depuis ton .env
const baseURL = import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // On stockera le token ici après connexion
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs globales
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expirée. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

/**
 * 🌐 HTTP Client - Instance Axios UNIQUE et centralisée
 * 
 * Responsabilités:
 * - Créer instance axios unique avec configuration cohérente
 * - Gérer les intercepteurs (request/response)
 * - Ajouter token automatiquement
 * - Gérer les erreurs globales (401, timeout, etc)
 * - Timeout par défaut (10 secondes)
 */

import axios from 'axios';

// ===== CONFIGURATION =====
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Instance Axios UNIQUE - Ne pas créer d'autres instances!
 */
export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes timeout - augmenté pour éviter les timeouts prématurés
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ===== INTERCEPTEURS =====

/**
 * Intercepteur Request: Ajouter le token JWT automatiquement
 */
httpClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur Response: Gérer les erreurs globales
 */
httpClient.interceptors.response.use(
  (response) => {
    // ✅ Succès
    return response;
  },
  (error) => {
    // 🔴 Erreur globale

    // 401: Token expiré ou invalide
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token expiré ou invalide');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      // Événement global pour redirection (les composants peuvent l'écouter)
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout - La requête a pris trop longtemps');
      error.message = 'Timeout: La requête a dépassé 10 secondes';
    }

    // 500: Erreur serveur
    if (error.response?.status >= 500) {
      console.error('🔴 Erreur serveur:', error.response?.status, error.response?.data);
    }

    // 403: Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 403 Forbidden - Accès refusé');
    }

    // Network error (pas de réponse du serveur)
    if (!error.response && error.request) {
      console.error('🌐 Erreur réseau - Impossible de contacter le serveur');
      error.message = 'Erreur réseau - Vérifiez votre connexion';
    }

    return Promise.reject(error);
  }
);

export default httpClient;

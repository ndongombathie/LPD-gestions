/**
 * 🔐 Authentication API
 * 
 * Gère:
 * - Login / Register
 * - Logout
 * - Change password
 * - Token & User management (centralizado)
 */

import httpClient from '../http/client';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  REFRESH_TOKEN: '/auth/refresh',
};

/**
 * Token Management Functions
 */
const tokenManager = {
  getToken: () => sessionStorage.getItem('token'),
  setToken: (token) => {
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
    }
  },
  clear: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
};

/**
 * User Management Functions
 */
const userManager = {
  getUser: () => {
    const userStr = sessionStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('❌ Erreur parsing user:', e);
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  },
  clear: () => sessionStorage.removeItem('user'),
};

/**
 * Auth API Methods
 */
export const authAPI = {
  /**
   * Connexion utilisateur
   * @param {string} email - Email utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<{token, user}>}
   */
  login: async (email, password) => {
    try {
      const response = await httpClient.post(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      // Sauvegarder token et user
      if (response.data?.token) {
        tokenManager.setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('boutique_id', response.data.user.boutique_id);
        console.log('user:', localStorage.getItem('token'));
      }
      if (response.data?.user) {
        userManager.setUser(response.data.user);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erreur login:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Inscription utilisateur
   * @param {object} data - {email, password, prenom, nom, role}
   * @returns {Promise<{token, user}>}
   */
  register: async (data) => {
    try {
      const response = await httpClient.post(AUTH_ENDPOINTS.REGISTER, data);

      if (response.data?.token) {
        tokenManager.setToken(response.data.token);
      }
      if (response.data?.user) {
        userManager.setUser(response.data.user);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erreur register:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Déconnexion utilisateur
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Appel API (best practice)
      await httpClient.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue même si l'API fail
      console.warn('⚠️ Erreur logout API:', error.message);
    } finally {
      // Toujours nettoyer le local storage
      tokenManager.clear();
      userManager.clear();
    }
  },

  /**
   * Obtenir l'utilisateur actuel
   * @returns {object|null}
   */
  getCurrentUser: () => {
    return userManager.getUser();
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!tokenManager.getToken();
  },

  /**
   * Changer le mot de passe
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @param {string} newPasswordConfirmation - Confirmation nouveau mot de passe
   * @returns {Promise<object>}
   */
  changePassword: async (currentPassword, newPassword, newPasswordConfirmation) => {
    try {
      const response = await httpClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur changePassword:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Rafraîchir le token (si API supporte)
   * @returns {Promise<{token}>}
   */
  refreshToken: async () => {
    try {
      const response = await httpClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
      
      if (response.data?.token) {
        tokenManager.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erreur refreshToken:', error.message);
      // Si le refresh échoue, déconnecter
      tokenManager.clear();
      userManager.clear();
      throw error;
    }
  },
};

export { tokenManager, userManager };

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
  CHANGE_PASSWORD: '/change-password',
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
   * 🔑 Login
   */
  login: async (email, password) => {
    try {
      const response = await httpClient.post(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      if (response.data?.token) {
        tokenManager.setToken(response.data.token);
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
   * 🧾 Register
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
   * 🚪 Logout
   */
  logout: async () => {
    try {
      await httpClient.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn('⚠️ Erreur logout API:', error.message);
    } finally {
      tokenManager.clear();
      userManager.clear();
    }
  },

  /**
   * 👤 Current User
   */
  getCurrentUser: () => {
    return userManager.getUser();
  },

  /**
   * ✅ Auth check
   */
  isAuthenticated: () => {
    return !!tokenManager.getToken();
  },

  /**
   * 🔐 Change Password (CORRIGÉ)
   */
  changePassword: async (
    currentPassword,
    newPassword,
    newPasswordConfirmation
  ) => {
    try {
      const response = await httpClient.put(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
        {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        '❌ Erreur changePassword:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * 🔄 Refresh token
   */
  refreshToken: async () => {
    try {
      const response = await httpClient.post(
        AUTH_ENDPOINTS.REFRESH_TOKEN
      );

      if (response.data?.token) {
        tokenManager.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erreur refreshToken:', error.message);
      tokenManager.clear();
      userManager.clear();
      throw error;
    }
  },
};

export { tokenManager, userManager };

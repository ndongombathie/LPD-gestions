/**
 * 🔐 AuthContext - Gestion centralisée de l'authentification
 * 
 * Responsabilités:
 * - Fournir user state global
 * - Gérer login/logout/register
 * - Persister user/token
 * - Redirection sur 401
 * - Single source of truth pour l'authentification
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI, tokenManager, userManager } from '@/services/api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialiser l'authentification au chargement
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = userManager.getUser();
        if (storedUser && tokenManager.getToken()) {
          setUser(storedUser);
        }
      } catch (err) {
        console.error('❌ Erreur init auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Gérer redirection sur 401 global
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('⚠️ Session expirée');
      setUser(null);
      tokenManager.clear();
      userManager.clear();
      window.location.href = '/login';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  /**
   * Login utilisateur
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authAPI.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register utilisateur
   */
  const register = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authAPI.register(data);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'inscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout utilisateur
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('⚠️ Erreur logout:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Changer le mot de passe
   */
  const changePassword = useCallback(async (currentPassword, newPassword, newPasswordConfirmation) => {
    setError(null);
    try {
      const result = await authAPI.changePassword(currentPassword, newPassword, newPasswordConfirmation);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur changement mot de passe');
      throw err;
    }
  }, []);

  /**
   * Mettre à jour le profil utilisateur
   */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    userManager.setUser(updatedUser);
  }, []);

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user && !!tokenManager.getToken(),
    login,
    register,
    logout,
    changePassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

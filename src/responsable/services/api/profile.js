/**
 * Profile API Service
 * Gère les endpoints relatifs au profil utilisateur et les notifications
 */

import client from '@/services/http/client';

const profileAPI = {
  /**
   * Récupère le profil utilisateur connecté
   * @returns {Promise<Object>} Données du profil
   */
  getProfile: async () => {
    const { data } = await client.get('/mon-profil');
    return data;
  },

  /**
   * Met à jour le profil utilisateur
   * @param {Object} payload - Données à mettre à jour (prenom, nom, photo)
   * @returns {Promise<Object>} Profil mis à jour
   */
  updateProfile: async (payload) => {
    const { data } = await client.put('/mon-profil', payload);
    return data;
  },

  /**
   * Récupère les notifications de l'utilisateur
   * @returns {Promise<Array>} Liste des notifications
   */
  getNotifications: async () => {
    const { data } = await client.get('/notifications');
    return data;
  },

  /**
   * Marque un module comme notifié
   * @param {string} module - Nom du module
   * @returns {Promise<Object>} Réponse du serveur
   */
  markNotificationModule: async (module) => {
    const { data } = await client.post('/notifications/mark-module', { module });
    return data;
  },
};

export default profileAPI;

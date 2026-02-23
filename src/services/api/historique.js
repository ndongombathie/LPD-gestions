// src/services/api/historique.js
import httpClient from '../http/client';

export const historiqueAPI = {
  /**
   * Récupère l'historique des actions (modifications et suppressions)
   * @param {Object} params - Paramètres de requête (page, etc.)
   * @returns {Promise} - Promesse contenant les données paginées
   */
  getAll: async (params = {}) => {
    const response = await httpClient.get('/historique-actions', { params });
    return response.data;
  }
};
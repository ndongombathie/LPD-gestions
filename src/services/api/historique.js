// src/services/api/historique.js
import httpClient from '../http/client';

const ENDPOINT = '/historique-actions';

export const historiqueAPI = {
  /**
   * Récupère toutes les entrées d'historique
   */
  getAll: async (params = {}) => {
    const response = await httpClient.get(ENDPOINT, { params });
    return response.data; // Suppose que la réponse est un tableau d'objets
  },

  /**
   * Crée une nouvelle entrée d'historique
   * @param {Object} data - { produit_nom, type_action, details, utilisateur_id? }
   */
  create: async (data) => {
    const response = await httpClient.post(ENDPOINT, data);
    return response.data;
  },
};
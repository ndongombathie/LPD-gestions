// src/services/api/historiqueActions.js
import httpClient from '../http/client';

export const historiqueActionsAPI = {
  // Récupérer l'historique des actions avec pagination
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get('/historique-actions', { params });
      return response.data;
    } catch (error) {
      console.error('❌ historiqueActionsAPI.getAll error:', error);
      throw error;
    }
  },

  // Récupérer l'historique pour un produit spécifique
  getByProduitId: async (produitId, params = {}) => {
    try {
      const response = await httpClient.get(`/historique-actions/produit/${produitId}`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ historiqueActionsAPI.getByProduitId error:', error);
      throw error;
    }
  },
};
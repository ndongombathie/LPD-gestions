// src/services/api/mouvements.js
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/mouvements-stock',
  // On pourra ajouter CREATE plus tard quand ton collègue aura fini
};

export const mouvementsAPI = {
  
  /**
   * Récupère la liste des mouvements de stock
   * @param {Object} params - (page, filtres...)
   */
  getAll: async (params = {}) => {
    try {
      // On utilise httpClient comme dans produits.js
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll mouvements:', error.message);
      throw error;
    }
  }
};
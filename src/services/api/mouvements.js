// src/services/api/mouvements.js
import httpClient from '../http/client';

const ENDPOINTS = {
  // Assure-toi que cela correspond au dossier de ton script PHP (api/mouvements/index.php)
  BASE: '/mouvements', 
};

export const mouvementsAPI = {
  
  /**
   * Récupère l'historique complet
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.BASE, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll mouvements:', error);
      throw error;
    }
  },

  /**
   * Crée un nouveau mouvement (Entrée/Sortie) et met à jour le stock
   * @param {Object} data - { productId, type, quantity, ... }
   */
  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.BASE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create mouvement:', error);
      throw error;
    }
  }
};
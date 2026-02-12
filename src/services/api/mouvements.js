/**
 * 📦 Mouvements de Stock API
 * 
 * Endpoint réel (Laravel) : /api/mouvements-stock
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  // 🔁 Correction : le endpoint Laravel est '/mouvements-stock' (avec trait d'union)
  BASE: '/mouvements-stock',
};

export const mouvementsAPI = {
  
  /**
   * Récupère l'historique complet des mouvements
   * @param {Object} params - Paramètres optionnels (date_debut, date_fin, type, produit_id, per_page)
   */
  getAll: async (params = {}) => {
    try {
      // Par défaut, on demande 1000 éléments pour éviter la pagination back-end
      const defaultParams = { per_page: 1000, ...params };
      const response = await httpClient.get(ENDPOINTS.BASE, { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll mouvements:', error);
      throw error;
    }
  },

  /**
   * Crée un nouveau mouvement (Entrée/Sortie) – utilisé pour les réapprovisionnements/diminutions
   * @param {Object} data - { produit_id, type, quantite, date, ... }
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
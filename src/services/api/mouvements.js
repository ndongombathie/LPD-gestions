/**
 * 📦 Mouvements de Stock API
 * 
 * Endpoint réel (Laravel) : /api/mouvements-stock
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  BASE: '/mouvements-stock',
};

export const mouvementsAPI = {
  /**
   * Récupère une page de mouvements (pagination gérée par le backend)
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
   * Récupère TOUS les mouvements (parcourt automatiquement toutes les pages)
   */
  getAllPaginated: async (params = {}) => {
    let page = 1;
    let allData = [];
    let lastPage = 1;

    try {
      do {
        const response = await httpClient.get(ENDPOINTS.BASE, {
          params: { ...params, page }
        });
        const result = response.data;
        
        if (result && result.data) {
          allData = [...allData, ...result.data];
          lastPage = result.last_page || 1;
          page++;
        } else if (Array.isArray(result)) {
          allData = result;
          break;
        } else {
          break;
        }

        // Sécurité : ne pas dépasser 50 pages
        if (page > 50) break;
      } while (page <= lastPage);

      return allData;
    } catch (error) {
      console.error('❌ Erreur getAllPaginated mouvements:', error);
      throw error;
    }
  },

  /**
   * Crée un nouveau mouvement (pour les entrées/sorties manuelles)
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
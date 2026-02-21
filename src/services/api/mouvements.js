// src/services/api/mouvements.js
import httpClient from '../http/client';

const ENDPOINTS = {
  BASE: '/mouvements-stock',
  PENDING_TRANSFERS: '/produits-transfer',
  CANCEL_TRANSFER: '/annuler-produits-transfer',
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
  },

  /**
   * Récupère la liste des transferts en attente
   */
  getPendingTransfers: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.PENDING_TRANSFERS);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getPendingTransfers:', error);
      throw error;
    }
  },

  /**
   * Annule un transfert en attente
   * @param {number|string} transferId - ID du transfert à annuler
   */
  cancelTransfer: async (transferId) => {
    try {
      const response = await httpClient.put(ENDPOINTS.CANCEL_TRANSFER, { transfer_id: transferId });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cancelTransfer:', error);
      throw error;
    }
  }
};
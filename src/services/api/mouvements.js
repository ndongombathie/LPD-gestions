// src/services/api/mouvements.js
import httpClient from '../http/client';

export const mouvementsAPI = {
  // ✅ Méthodes existantes - NE PAS MODIFIER
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get('/mouvements-stock', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getAll error:', error);
      throw error;
    }
  },

  createTransfer: async (data) => {
    try {
      const response = await httpClient.post('/stocks/transfer', data);
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.createTransfer error:', error);
      throw error;
    }
  },

  cancelTransfer: async (transferId) => {
    try {
      const response = await httpClient.put('/annuler-produits-transfer', {
        transfer_id: transferId,
      });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.cancelTransfer error:', error);
      throw error;
    }
  },

  getTransfertsEnAttente: async (params = {}) => {
    try {
      const response = await httpClient.get('/produits-transfer', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getTransfertsEnAttente error:', error);
      throw error;
    }
  },

  getTransfertsAnnules: async (params = {}) => {
    try {
      const response = await httpClient.get('/liste-transfers-annuler', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getTransfertsAnnules error:', error);
      throw error;
    }
  },

  // Statistiques existantes
  getNbEntreesTotal: async () => {
    try {
      const response = await httpClient.get('/nombre-entree-stock-total');
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getNbEntreesTotal error:', error);
      throw error;
    }
  },

  getNbSortiesTotal: async () => {
    try {
      const response = await httpClient.get('/nombre-sortie-stock-total');
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getNbSortiesTotal error:', error);
      throw error;
    }
  },

  getNbTransfertsEnAttente: async () => {
    try {
      const response = await httpClient.get('/transfers-en-attente');
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getNbTransfertsEnAttente error:', error);
      throw error;
    }
  },

  getNombreAujourdhui: async () => {
    try {
      const response = await httpClient.get('/nombre-mouvements-stock-today');
      if (typeof response.data === 'number') return response.data;
      if (response.data && typeof response.data.count === 'number') return response.data.count;
      return parseInt(response.data, 10) || 0;
    } catch (error) {
      console.error('❌ mouvementsAPI.getNombreAujourdhui error:', error);
      return 0;
    }
  },

  // ✅ NOUVELLE MÉTHODE - AJOUTÉE SANS MODIFIER LES EXISTANTES
  getHistoriqueActions: async (params = {}) => {
    try {
      const response = await httpClient.get('/historique-actions', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getHistoriqueActions error:', error);
      throw error;
    }
  },
};
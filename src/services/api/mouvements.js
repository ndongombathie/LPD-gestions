// src/services/api/mouvements.js
import httpClient from '../http/client';

export const mouvementsAPI = {
  // Récupération des mouvements (historique)
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get('/mouvements-stock', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getAll error:', error);
      throw error;
    }
  },

  // Création d'un transfert
  createTransfer: async (data) => {
    try {
      const response = await httpClient.post('/stocks/transfer', data);
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.createTransfer error:', error);
      throw error;
    }
  },

  // Annulation d'un transfert
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

  // Liste des transferts en attente (pour l'onglet)
  getTransfertsEnAttente: async (params = {}) => {
    try {
      const response = await httpClient.get('/produits-transfer', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getTransfertsEnAttente error:', error);
      throw error;
    }
  },

  // Liste des transferts annulés
  getTransfertsAnnules: async (params = {}) => {
    try {
      const response = await httpClient.get('/liste-transfers-annuler', { params });
      return response.data;
    } catch (error) {
      console.error('❌ mouvementsAPI.getTransfertsAnnules error:', error);
      throw error;
    }
  },

  // Statistiques
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

  // Nombre de mouvements aujourd'hui (méthode spécifique)
  getNombreAujourdhui: async () => {
    try {
      const response = await httpClient.get('/nombre-mouvements-stock-today');
      // La réponse peut être un nombre ou un objet { count: ... }
      if (typeof response.data === 'number') return response.data;
      if (response.data && typeof response.data.count === 'number') return response.data.count;
      return parseInt(response.data, 10) || 0;
    } catch (error) {
      console.error('❌ mouvementsAPI.getNombreAujourdhui error:', error);
      return 0;
    }
  },
};
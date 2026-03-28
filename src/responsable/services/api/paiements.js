/**
 * 💳 Paiements API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_BY_COMMANDE: '/commandes/:id/paiements',
  CREATE: '/commandes/:id/paiements',
  HISTORIQUE_ENCAISSEMENTS_CLIENT: '/clients/:client_id/encaissements',
};

export const paiementsAPI = {

  getByCommande: async (commandeId) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_COMMANDE.replace(':id', commandeId)
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByCommande paiements:', error.message);
      throw error;
    }
  },
  getHistoriqueEncaissementsClient: async (clientId, params = {}) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.HISTORIQUE_ENCAISSEMENTS_CLIENT.replace(':client_id', clientId),
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(
        '❌ Erreur getHistoriqueEncaissementsClient:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
  create: async (commandeId, data) => {
    try {
      const response = await httpClient.post(
        ENDPOINTS.CREATE.replace(':id', commandeId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create paiement:', error.response?.data || error.message);
      throw error;
    }
  },
};
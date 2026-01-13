/**
 * 💳 Paiements API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_BY_COMMANDE: '/commandes/:id/paiements',
  GET_BY_CLIENT: '/clients/:id/paiements',
  CREATE: '/commandes/:id/paiements',
  UPDATE: '/paiements/:id',
  DELETE: '/paiements/:id',
};

export const paiementsAPI = {
  getByCommande: async (commandeId) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_COMMANDE.replace(':id', commandeId));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByCommande paiements:', error.message);
      throw error;
    }
  },

  getByClient: async (clientId) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_CLIENT.replace(':id', clientId));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByClient paiements:', error.message);
      throw error;
    }
  },

  create: async (commandeId, data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE.replace(':id', commandeId), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create paiement:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update paiement:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete paiement:', error.response?.data || error.message);
      throw error;
    }
  },
};

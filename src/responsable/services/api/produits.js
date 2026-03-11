/**
 * 🛒 Produits API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/produits',
  GET_BY_ID: '/produits/:id',
  CREATE: '/produits',
  UPDATE: '/produits/:id',
  DELETE: '/produits/:id',
  GET_ALL_FULL: '/produits-disponibles-boutique',
};

export const produitsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll produits:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById produit:', error.message);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create produit:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update produit:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete produit:', error.response?.data || error.message);
      throw error;
    }
  },
  // ✅ Liste complète SANS pagination (pour la barre recherche commande)
  getAllProduits: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL_FULL);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllProduits:', error.message);
      throw error;
    }
  },
};

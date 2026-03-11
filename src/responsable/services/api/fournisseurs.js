/**
 * 🏪 Fournisseurs API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/fournisseurs',
  GET_BY_ID: '/fournisseurs/:id',
  CREATE: '/fournisseurs',
  UPDATE: '/fournisseurs/:id',
  DELETE: '/fournisseurs/:id',
};

export const fournisseursAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll fournisseurs:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById fournisseur:', error.message);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create fournisseur:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update fournisseur:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete fournisseur:', error.response?.data || error.message);
      throw error;
    }
  },
};

/**
 * 👤 Utilisateurs API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/utilisateurs',
  GET_BY_ID: '/utilisateurs/:id',
  CREATE: '/utilisateurs',
  UPDATE: '/utilisateurs/:id',
  DELETE: '/utilisateurs/:id',
};

export const utilisateursAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll utilisateurs:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById utilisateur:', error.message);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create utilisateur:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update utilisateur:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete utilisateur:', error.response?.data || error.message);
      throw error;
    }
  },
};

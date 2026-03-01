/**
 * 💸 Décaissements API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/decaissements',
  GET_BY_ID: '/decaissements/:id',
  CREATE: '/decaissements',
  UPDATE: '/decaissements/:id',
  DELETE: '/decaissements/:id',
  VALIDATE: '/decaissements/:id/valider',
  EXPORT_ALL: '/decaissements/export',
  GET_ALL_CAISSIERS: '/caissiers/all',
};

export const decaissementsAPI = {
  list: (params = {}) => decaissementsAPI.getAll(params),
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll décaissements:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById décaissement:', error.message);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create décaissement:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update décaissement:', error.response?.data || error.message);
      throw error;
    }
  },

  validate: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.VALIDATE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validate décaissement:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete décaissement:', error.response?.data || error.message);
      throw error;
    }
  },
  exportAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.EXPORT_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur exportAll décaissements:', error.response?.data || error.message);
      throw error;
    }
  },
  getAllCaissiers: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL_CAISSIERS);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllCaissiers:', error.response?.data || error.message);
      throw error;
    }
  },

};

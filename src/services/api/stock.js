/**
 * 📦 Stock API
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/stocks',
  GET_BY_ID: '/stocks/:id',
  TRANSFER: '/stocks/transfer',
  UPDATE: '/stocks/:id',
};

export const stockAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll stocks:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById stock:', error.message);
      throw error;
    }
  },

  transfer: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.TRANSFER, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur transfer stock:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update stock:', error.response?.data || error.message);
      throw error;
    }
  },
};

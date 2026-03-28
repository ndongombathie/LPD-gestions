// src/services/api/categories.js
import httpClient from '../http/client';

export const categoriesAPI = {
  getAll: async (params = {}) => {
    try {
      console.log("📡 Appel API categories avec params:", params);
      const response = await httpClient.get('/categories', { params });
      console.log("📦 Réponse API categories:", response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll categories:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post('/categories', data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create category:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update category:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete category:', error);
      throw error;
    }
  },
};
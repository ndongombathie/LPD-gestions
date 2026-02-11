import httpClient from '../http/client';

const BASE = '/categories';

export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await httpClient.get(BASE);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll categories:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const payload = {
        nom: data.nom || data.name
      };
      
      const response = await httpClient.post(BASE, payload);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création catégorie:', error.response?.data || error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const payload = {
        nom: data.nom || data.name
      };
      
      const response = await httpClient.put(`${BASE}/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur modification catégorie:', error.response?.data || error);
      throw error;
    }
  },

  // SUPPRESSION FORCÉE POUR LES CATÉGORIES AUSSI
  delete: async (id) => {
    try {
      const response = await httpClient.delete(`${BASE}/${id}`, {
        params: { force: true }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression catégorie:', error.response?.data || error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(`${BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById catégorie:', error);
      throw error;
    }
  }
};
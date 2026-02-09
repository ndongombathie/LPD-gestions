import httpClient from '../http/client';

const BASE = '/categories';

export const categoriesAPI = {

  /**
   * Liste des catégories
   */
  getAll: async () => {
    try {
      const response = await httpClient.get(BASE);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll categories', error);
      throw error;
    }
  },

  /**
   * Créer une catégorie
   */
  create: async (data) => {
    try {
      const response = await httpClient.post(BASE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création catégorie', error.response?.data || error);
      throw error;
    }
  },

  /**
   * Modifier une catégorie
   */
  update: async (id, data) => {
    try {
      const response = await httpClient.put(`${BASE}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur modification catégorie', error.response?.data || error);
      throw error;
    }
  },

  /**
   * Supprimer une catégorie
   */
  delete: async (id) => {
    try {
      const response = await httpClient.delete(`${BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression catégorie', error.response?.data || error);
      throw error;
    }
  },
};

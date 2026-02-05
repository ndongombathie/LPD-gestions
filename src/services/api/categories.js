import httpClient from '../http/client';

const ENDPOINT = '/categories';

export const categoriesAPI = {
  // Récupérer toutes les catégories (pour le select)
  getAll: async () => {
    const response = await httpClient.get(ENDPOINT);
    return response.data;
  },

  // Créer une catégorie (si tu fais le modal "Gérer les catégories")
  create: async (data) => {
    const response = await httpClient.post(ENDPOINT, data);
    return response.data;
  },

  // Modifier
  update: async (id, data) => {
    const response = await httpClient.put(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  // Supprimer
  delete: async (id) => {
    const response = await httpClient.delete(`${ENDPOINT}/${id}`);
    return response.data;
  }
};
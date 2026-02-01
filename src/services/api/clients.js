/**
 * 👥 Clients API
 * 
 * Endpoints: /api/clients
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/clients',
  GET_BY_ID: '/clients/:id',
  CREATE: '/clients',
  UPDATE: '/clients/:id',
  DELETE: '/clients/:id',
  GET_SPECIAL: '/clients?type_client=special',
};

export const clientsAPI = {
  /**
   * Récupérer tous les clients
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll clients:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les clients spéciaux
   */
  getSpecial: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_SPECIAL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getSpecial clients:', error.message);
      throw error;
    }
  },

  /**
   * Obtenir un client par ID
   */
  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById client:', error.message);
      throw error;
    }
  },

  /**
   * Créer un client
   */
  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create client:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mettre à jour un client
   */
  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update client:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Supprimer un client
   */
  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete client:', error.response?.data || error.message);
      throw error;
    }
  },
};

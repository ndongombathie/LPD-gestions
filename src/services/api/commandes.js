/**
 * 📦 Commandes API
 * 
 * Endpoints: /api/commandes
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/commandes',
  GET_PENDING: '/commandes/pending',
  GET_BY_ID: '/commandes/:id',
  CREATE: '/commandes',
  VALIDATE: '/commandes/:id/valider',
  CANCEL: '/commandes/:id/annuler',
  UPDATE: '/commandes/:id',
  DELETE: '/commandes/:id',
};

export const commandesAPI = {
  /**
   * Récupérer toutes les commandes avec pagination/filtres
   * @param {object} params - {page, perPage, status, search}
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll commandes:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les commandes en attente
   */
  getPending: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_PENDING);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getPending commandes:', error.message);
      throw error;
    }
  },

  /**
   * Obtenir une commande par ID
   * @param {number} id - ID commande
   */
  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById commande:', error.message);
      throw error;
    }
  },

  /**
   * Créer une commande
   * @param {object} data - Données commande
   */
  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mettre à jour une commande
   * @param {number} id - ID commande
   * @param {object} data - Données à modifier
   */
  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Valider une commande
   * @param {number} id - ID commande
   */
  validate: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.VALIDATE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validate commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Annuler une commande
   * @param {number} id - ID commande
   */
  cancel: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CANCEL.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cancel commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Supprimer une commande
   * @param {number} id - ID commande
   */
  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete commande:', error.response?.data || error.message);
      throw error;
    }
  },
};

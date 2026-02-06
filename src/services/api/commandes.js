/**
 * 📦 Commandes API
 * 
 * Endpoints: /api/commandes
 */

import httpClient from '../http/client';

// ======================================================
// 🔹 Commandes (entête)
// ======================================================
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
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll commandes:', error.message);
      throw error;
    }
  },

  getPending: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_PENDING);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getPending commandes:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_ID.replace(':id', id)
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById commande:', error.message);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create commande:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(
        ENDPOINTS.UPDATE.replace(':id', id),
        data
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update commande:', error.response?.data || error.message);
      throw error;
    }
  },

  validate: async (id) => {
    try {
      const response = await httpClient.post(
        ENDPOINTS.VALIDATE.replace(':id', id)
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validate commande:', error.response?.data || error.message);
      throw error;
    }
  },

  cancel: async (id) => {
    try {
      const response = await httpClient.post(
        ENDPOINTS.CANCEL.replace(':id', id)
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cancel commande:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(
        ENDPOINTS.DELETE.replace(':id', id)
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete commande:', error.response?.data || error.message);
      throw error;
    }
  },
};

// ======================================================
// 🔹 Lignes spéciales de commande (commande_lignes)
// (utilisées par les Clients Spéciaux / Responsable)
// ======================================================
const LIGNES_ENDPOINTS = {
  GET_BY_COMMANDE: '/commandes/:id/lignes',
  CREATE: '/commandes/:id/lignes',
  UPDATE: '/commandes/lignes/:ligneId',
  DELETE: '/commandes/lignes/:ligneId',
};

export const lignesCommandeAPI = {
  /**
   * Récupérer les lignes spéciales d'une commande
   */
  getByCommande: async (commandeId) => {
    try {
      const res = await httpClient.get(
        LIGNES_ENDPOINTS.GET_BY_COMMANDE.replace(':id', commandeId)
      );
      return res.data;
    } catch (error) {
      console.error('❌ Erreur getByCommande lignes:', error.message);
      throw error;
    }
  },

  /**
   * Ajouter une ligne spéciale à une commande
   */
  create: async (commandeId, data) => {
    try {
      const res = await httpClient.post(
        LIGNES_ENDPOINTS.CREATE.replace(':id', commandeId),
        data
      );
      return res.data;
    } catch (error) {
      console.error('❌ Erreur create ligne:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mettre à jour une ligne spéciale
   */
  update: async (ligneId, data) => {
    try {
      const res = await httpClient.put(
        LIGNES_ENDPOINTS.UPDATE.replace(':ligneId', ligneId),
        data
      );
      return res.data;
    } catch (error) {
      console.error('❌ Erreur update ligne:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Supprimer une ligne spéciale
   */
  delete: async (ligneId) => {
    try {
      const res = await httpClient.delete(
        LIGNES_ENDPOINTS.DELETE.replace(':ligneId', ligneId)
      );
      return res.data;
    } catch (error) {
      console.error('❌ Erreur delete ligne:', error.response?.data || error.message);
      throw error;
    }
  },
};

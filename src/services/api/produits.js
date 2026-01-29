import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/produits',
  GET_BY_ID: '/produits/:id',
  CREATE: '/produits',
  UPDATE: '/produits/:id',
  DELETE: '/produits/:id',
  RUPTURES: '/produits-ruptures',
  REAPPRO: '/stocks/reapprovisionner',
  TRANSFER: '/stocks/transfer',
};

export const produitsAPI = {
  // --- GESTION CRUD PRODUITS ---

  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll produits:', error.message);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById produit:', error.message);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create produit:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update produit:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete produit:', error.response?.data || error.message);
      throw error;
    }
  },

  // --- GESTION DES STOCKS ---

  /**
   * Récupère la liste des produits en rupture de stock
   */
  getRuptures: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.RUPTURES);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getRuptures:', error.message);
      throw error;
    }
  },

  /**
   * Réapprovisionner un produit (Augmenter le stock)
   * @param {Object} data - { produit_id: number, quantite: number }
   */
  reapprovisionner: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.REAPPRO, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur reapprovisionner stock:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Transférer du stock vers une boutique
   * @param {Object} data - { produit_id: number, quantite_transfert: number, boutique_id: number }
   */
  transferToBoutique: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.TRANSFER, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur transferToBoutique:', error.response?.data || error.message);
      throw error;
    }
  }
};
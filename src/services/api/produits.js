import httpClient from '../http/client';

const BASE = '/produits';

export const produitsAPI = {

  // =====================
  // PRODUITS (CRUD)
  // =====================

  /**
   * Récupérer la liste des produits (pagination Laravel)
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll produits', error);
      throw error;
    }
  },

  /**
   * Récupérer un produit précis
   */
  getById: async (id) => {
    try {
      const response = await httpClient.get(`${BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById produit', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau produit
   */
  create: async (data) => {
    try {
      const response = await httpClient.post(BASE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création produit', error.response?.data || error);
      throw error;
    }
  },

  /**
   * Modifier un produit existant
   */
  update: async (id, data) => {
    try {
      const response = await httpClient.put(`${BASE}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur modification produit', error.response?.data || error);
      throw error;
    }
  },

  /**
   * Supprimer un produit
   */
  delete: async (id) => {
    try {
      const response = await httpClient.delete(`${BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression produit', error.response?.data || error);
      throw error;
    }
  },

  // =====================
  // STOCK
  // =====================

  /**
   * Produits en rupture de stock
   */
  getProduitsEnRupture: async () => {
    try {
      const response = await httpClient.get('/produits_en_rupture');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur produits en rupture', error);
      throw error;
    }
  },

  /**
   * Réapprovisionner un produit
   * (appelé depuis un bouton, le produit est déjà connu)
   */
  reapprovisionner: async ({ produit_id, quantite }) => {
    try {
      const response = await httpClient.post('/stocks/reapprovisionner', {
        produit_id,
        quantite,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur réapprovisionnement', error.response?.data || error);
      throw error;
    }
  },

  /**
   * Diminuer le stock d’un produit
   * (endpoint à venir côté backend)
   */
  diminuerStock: async ({ produit_id, quantite, raison }) => {
    try {
      const response = await httpClient.post('/stocks/diminuer', {
        produit_id,
        quantite,
        raison,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Endpoint diminuer non disponible ou erreur', error);
      throw error;
    }
  },

  /**
   * Transférer du stock vers une boutique
   */
  transferer: async ({ produit_id, quantite, boutique_id }) => {
    try {
      const response = await httpClient.post('/stocks/transfer', {
        produit_id,
        quantite,
        boutique_id,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur transfert stock', error.response?.data || error);
      throw error;
    }
  },
};

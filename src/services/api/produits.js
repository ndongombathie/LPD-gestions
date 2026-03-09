// src/services/api/produits.js
import httpClient from '../http/client';

const BASE = '/produits';
const STOCKS_BASE = '/stocks';

export const produitsAPI = {
  // ------------------------------------------------------------
  // CRUD PRODUIT
  // ------------------------------------------------------------
  getAll: async (params = {}) => {
    const response = await httpClient.get(BASE, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await httpClient.get(`${BASE}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const payload = {
      nom: data.nom,
      code: data.code || '',
      categorie_id: data.categorie_id,
      fournisseur_id: data.fournisseur_id || null,
      nombre_carton: parseInt(data.nombre_carton || 0),
      unite_carton: String(data.unite_carton || "1"),
      prix_unite_carton: parseFloat(data.prix_unite_carton || 0),
      stock_seuil: parseInt(data.stock_seuil || 5),
      stock_ideal: parseInt(data.stock_ideal || 20),
    };
    const response = await httpClient.post(BASE, payload);
    return response.data;
  },

  update: async (id, data) => {
    const existing = await produitsAPI.getById(id);
    
    const payload = {
      nom: existing.nom,
      code: existing.code || existing.code_barre || '',
      categorie_id: existing.categorie_id,
      fournisseur_id: existing.fournisseur_id,
      nombre_carton: existing.nombre_carton,
      unite_carton: String(existing.unite_carton),
      prix_unite_carton: existing.prix_unite_carton,
      stock_seuil: existing.stock_seuil,
      stock_ideal: existing.stock_ideal,
      ...data,
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });

    const response = await httpClient.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await httpClient.delete(`${BASE}/${id}`);
    return response.data;
  },

  // ------------------------------------------------------------
  // ACTIONS SUR LE STOCK
  // ------------------------------------------------------------
  async reapprovisionner(produitId, quantite) {
    try {
      const response = await httpClient.post(`${STOCKS_BASE}/reapprovisionner`, {
        produit_id: produitId,
        quantite: parseInt(quantite),
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Route /reapprovisionner échouée, fallback update', error);
      const produit = await this.getById(produitId);
      const nouveauStock = parseInt(produit.nombre_carton || 0) + parseInt(quantite);
      return await this.update(produitId, { nombre_carton: nouveauStock });
    }
  },

  async diminuerStock(produitId, quantite) {
    try {
      const response = await httpClient.put(`${BASE}/${produitId}/reduire-stock`, {
        quantite: parseInt(quantite),
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Route /reduire-stock échouée, fallback update', error);
      const produit = await this.getById(produitId);
      const nouveauStock = Math.max(0, parseInt(produit.nombre_carton || 0) - parseInt(quantite));
      return await this.update(produitId, { nombre_carton: nouveauStock });
    }
  },

  // ------------------------------------------------------------
  // ENDPOINTS POUR LES LISTES
  // ------------------------------------------------------------
  getProduitsEnRupture: async (params = {}) => {
    try {
      const response = await httpClient.get('/produits_en_rupture', { params });
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getProduitsEnRupture error:', error);
      throw error;
    }
  },

  getProduitsSousSeuil: async (params = {}) => {
    try {
      const response = await httpClient.get('/produits-sous-seuil', { params });
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getProduitsSousSeuil error:', error);
      throw error;
    }
  },

  getProduitsNormaux: async (params = {}) => {
    try {
      const response = await httpClient.get('/produits-en-normaux', { params });
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getProduitsNormaux error:', error);
      throw error;
    }
  },

  // ------------------------------------------------------------
  // ENDPOINTS POUR LES COMPTEURS (NOUVEAUX)
  // ------------------------------------------------------------
  getNbProduits: async () => {
    try {
      const response = await httpClient.get('/nombre-produits');
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getNbProduits error:', error);
      throw error;
    }
  },

  getNbProduitsNormaux: async () => {
    try {
      const response = await httpClient.get('/nombre-produits-en-normaux');
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getNbProduitsNormaux error:', error);
      throw error;
    }
  },

  getNbProduitsSousSeuil: async () => {
    try {
      const response = await httpClient.get('/nombre-produits-sous-seuil');
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getNbProduitsSousSeuil error:', error);
      throw error;
    }
  },

  getNbProduitsEnRupture: async () => {
    try {
      const response = await httpClient.get('/nombre-produits-en-rupture');
      return response.data;
    } catch (error) {
      console.error('❌ produitsAPI.getNbProduitsEnRupture error:', error);
      throw error;
    }
  },
};
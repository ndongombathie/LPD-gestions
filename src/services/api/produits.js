import httpClient from '../http/client';

const BASE = '/produits';

export const produitsAPI = {
  // =====================
  // PRODUITS (CRUD)
  // =====================

  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll produits', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(`${BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById produit', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      console.log('📤 Envoi création produit:', data);
      
      const formattedData = {
        nom: data.nom || data.name,
        code: data.code || data.code_barre || '',
        categorie_id: data.categorie_id || data.categoryId,
        fournisseur_id: data.fournisseur_id || null,
        nombre_carton: parseInt(data.nombre_carton || data.cartons || 0),
        unite_carton: String(data.unite_carton || data.unitsPerCarton || "1"), // FORCÉ EN STRING
        prix_unite_carton: parseFloat(data.prix_unite_carton || data.pricePerCarton || 0),
        stock_seuil: parseInt(data.stock_seuil || data.stockMin || 5),
        stock_ideal: parseInt(data.stock_ideal || data.stockIdeal || 20)
      };

      const response = await httpClient.post(BASE, formattedData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création produit:', error.response?.data || error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      console.log('📤 Envoi modification produit:', id, data);
      
      const formattedData = {
        nom: data.nom || data.name,
        code: data.code || data.code_barre || '',
        categorie_id: data.categorie_id || data.categoryId,
        fournisseur_id: data.fournisseur_id || null,
        nombre_carton: parseInt(data.nombre_carton || data.cartons || 0),
        unite_carton: String(data.unite_carton || data.unitsPerCarton || "1"), // FORCÉ EN STRING
        prix_unite_carton: parseFloat(data.prix_unite_carton || data.pricePerCarton || 0),
        stock_seuil: parseInt(data.stock_seuil || data.stockMin || 5),
        stock_ideal: parseInt(data.stock_ideal || data.stockIdeal || 20)
      };

      const response = await httpClient.put(`${BASE}/${id}`, formattedData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur modification produit:', error.response?.data || error);
      throw error;
    }
  },

  // SUPPRESSION FORCÉE SANS CONTRRAINTE
  delete: async (id) => {
    try {
      console.log('🗑️ Suppression produit (forcée):', id);
      const response = await httpClient.delete(`${BASE}/${id}`, {
        params: { force: true }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression produit:', error.response?.data || error);
      throw error;
    }
  },

  // =====================
  // STOCK
  // =====================

  reapprovisionner: async (produitId, quantite) => {
    try {
      const response = await httpClient.post(`${BASE}/${produitId}/reapprovisionner`, {
        quantite: quantite
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur réapprovisionnement:', error.response?.data || error);
      
      // Fallback: mettre à jour directement le stock
      if (error.response?.status === 404 || error.response?.status === 405) {
        const produit = await produitsAPI.getById(produitId);
        const nouveauStock = (produit.nombre_carton || 0) + quantite;
        
        return await produitsAPI.update(produitId, {
          ...produit,
          nombre_carton: nouveauStock
        });
      }
      throw error;
    }
  },

  diminuerStock: async (produitId, quantite) => {
    try {
      const response = await httpClient.post(`${BASE}/${produitId}/diminuer`, {
        quantite: quantite
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur diminution stock:', error.response?.data || error);
      
      // Fallback: mettre à jour directement le stock
      if (error.response?.status === 404 || error.response?.status === 405) {
        const produit = await produitsAPI.getById(produitId);
        const nouveauStock = Math.max(0, (produit.nombre_carton || 0) - quantite);
        
        return await produitsAPI.update(produitId, {
          ...produit,
          nombre_carton: nouveauStock
        });
      }
      throw error;
    }
  },

  // =====================
  // AUTRES FONCTIONS
  // =====================

  getProduitsEnRupture: async () => {
    try {
      const response = await httpClient.get(`${BASE}/en-rupture`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur produits en rupture', error);
      throw error;
    }
  }
};
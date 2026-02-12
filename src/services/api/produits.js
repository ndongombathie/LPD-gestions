import httpClient from '../http/client';

const BASE = '/produits';
const STOCKS_BASE = '/stocks';

export const produitsAPI = {
  // ------------------------------------------------------------
  // CRUD PRODUIT – avec noms de champs exacts (API Laravel)
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
    // Payload avec les noms exacts attendus par l'API
    const payload = {
      nom: data.nom,
      code: data.code || '',              // requis ou optionnel selon backend
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
    // 1. Récupérer le produit existant
    const existing = await produitsAPI.getById(id);
    
    // 2. Fusionner : les champs fournis écrasent les existants
    const payload = {
      nom: existing.nom,
      code: existing.code || existing.code_barre || '',
      categorie_id: existing.categorie_id,
      fournisseur_id: existing.fournisseur_id,
      nombre_carton: existing.nombre_carton,
      unite_carton: String(existing.unite_carton),       // forcé en string
      prix_unite_carton: existing.prix_unite_carton,
      stock_seuil: existing.stock_seuil,
      stock_ideal: existing.stock_ideal,
      ...data,                                           // écrase avec les nouvelles valeurs
    };

    // 3. Nettoyer les champs undefined
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
  // ACTIONS SUR LE STOCK – 100% fiables (fallback update)
  // ------------------------------------------------------------
  async reapprovisionner(produitId, quantite) {
    try {
      // Tentative route dédiée (si elle fonctionne)
      const response = await httpClient.post(`${STOCKS_BASE}/reapprovisionner`, {
        produit_id: produitId,
        quantite: parseInt(quantite),
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Route /reapprovisionner échouée, fallback update', error);
      // Fallback : mise à jour directe du stock
      const produit = await this.getById(produitId);
      const nouveauStock = parseInt(produit.nombre_carton || 0) + parseInt(quantite);
      return await this.update(produitId, { nombre_carton: nouveauStock });
    }
  },

  async diminuerStock(produitId, quantite) {
    try {
      // Tentative route dédiée
      const response = await httpClient.put(`${BASE}/${produitId}/reduire-stock`, {
        quantite: parseInt(quantite),
      });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Route /reduire-stock échouée, fallback update', error);
      // Fallback
      const produit = await this.getById(produitId);
      const nouveauStock = Math.max(0, parseInt(produit.nombre_carton || 0) - parseInt(quantite));
      return await this.update(produitId, { nombre_carton: nouveauStock });
    }
  },

  // ------------------------------------------------------------
  // AUTRES
  // ------------------------------------------------------------
  getProduitsEnRupture: async () => {
    const response = await httpClient.get(`${BASE}/produits-ruptures`);
    return response.data;
  },
};
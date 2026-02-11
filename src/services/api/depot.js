/**
 * 🏭 Dépôt – Contrôle des produits
 *
 * Endpoint:
 * GET api/produits-controle-depots
 *
 * Rôle:
 * - Centraliser l’accès API
 * - Normaliser pagination Laravel
 * - Protéger Depot.jsx
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits-controle-depots";

const depotAPI = {
  /**
   * 📦 Récupérer les produits du dépôt
   */
  getProduitsControle: async (params = {}) => {
    try {
      const res = await httpClient.get(ENDPOINT, { params });
      const payload = res.data;

      return {
        data: Array.isArray(payload?.data) ? payload.data : [],
        pagination: {
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          perPage: payload?.per_page ?? 15,
          total: payload?.total ?? 0,
        },
      };
    } catch (error) {
      console.error(
        "❌ Erreur chargement produits dépôt :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default depotAPI;

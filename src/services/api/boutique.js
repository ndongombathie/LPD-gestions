/**
 * 🏪 Boutique – Contrôle des produits
 * Endpoint: GET api/produits-controle-boutique
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits-controle-boutique";

const boutiqueAPI = {
  /**
   * 🔎 Récupérer les produits du boutique
   */
  getProduitsControle: async (params = {}) => {
    try {
      const res = await httpClient.get(ENDPOINT, {
        params: {
          per_page: 25, // 🔥 pagination fixe 25
          ...params,
        },
      });

      const payload = res.data;

      return {
        data: Array.isArray(payload?.data) ? payload.data : [],
        pagination: {
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          perPage: payload?.per_page ?? 25,
          total: payload?.total ?? 0,
        },
      };
    } catch (error) {
      console.error(
        "❌ Erreur chargement produits boutique (contrôle stock) :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default boutiqueAPI;

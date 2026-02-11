/**
 * 🏪 Boutique – Contrôle des produits
 *
 * Endpoint:
 * GET api/produits-controle-boutique
 *
 * Rôle:
 * - Lister les produits du boutique
 * - Centraliser la lecture de l’API
 * - Protéger le front contre les changements backend
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits-controle-boutique";

const boutiqueAPI = {
  /**
   * 🔎 Récupérer les produits du boutique (avec pagination & filtres)
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
          perPage: payload?.per_page ?? 20,
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

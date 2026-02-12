/**
 * 🏭 Dépôt – Contrôle des produits
 *
 * 
 *
 * Endpoint:
 * GET api/produits-controle-depots
 *
 * Rôle:
 * - Centraliser l’accès API
 * - Normaliser pagination Laravel
 * - Forcer pagination 25 par défaut
 * - Protéger Depot.jsx des changements backend
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits-controle-depots";
const DEFAULT_PER_PAGE = 25;

const depotAPI = {
  /**
   * 📦 Récupérer les produits du dépôt
   *
   * @param {Object} params
   * @param {number} params.page
   * @param {number} params.per_page
   */
  getProduitsControle: async (params = {}) => {
    try {
      const {
        page = 1,
        per_page = DEFAULT_PER_PAGE,
        ...filters
      } = params;

      const res = await httpClient.get(ENDPOINT, {
        params: {
          page,
          per_page,
          ...filters,
        },
      });

      const payload = res?.data ?? {};

      const data = Array.isArray(payload?.data)
        ? payload.data
        : [];

      return {
        data,
        pagination: {
          currentPage: payload?.current_page ?? page,
          lastPage: payload?.last_page ?? 1,
          perPage: payload?.per_page ?? per_page,
          total: payload?.total ?? data.length,
          from: payload?.from ?? null,
          to: payload?.to ?? null,
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

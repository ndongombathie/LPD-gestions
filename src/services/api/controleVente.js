/**
 * ==========================================================
 * 📊 Contrôle Vente API
 * ==========================================================
 * - Historique des ventes (avec pagination + filtres)
 * - Total des ventes par jour
 */

import httpClient from "../http/client";

const BASE = "/historique-ventes";
const TOTAL_PAR_JOUR = "/total-vente-par-jour";

/* ================= HELPER ================= */
const cleanParams = (params) => {
  const cleaned = {};

  Object.keys(params).forEach((key) => {
    if (
      params[key] !== undefined &&
      params[key] !== null &&
      params[key] !== ""
    ) {
      cleaned[key] = params[key];
    }
  });

  return cleaned;
};

const controleVenteAPI = {
  /**
   * 🔹 Historique des ventes
   * Support :
   * - date_debut
   * - date_fin
   * - vendeur_id
   * - produit_id
   * - page
   * - per_page
   */
  getHistoriqueVentes: async (params = {}) => {
    try {
      const cleanedParams = cleanParams(params);

      const res = await httpClient.get(BASE, {
        params: cleanedParams,
      });

      const response = res.data || {};

      /* ========= STRUCTURE PAGINATION LARAVEL ========= */
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const pagination = {
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
        per_page: response.per_page || data.length,
        total: response.total || data.length,
        next_page_url: response.next_page_url || null,
        prev_page_url: response.prev_page_url || null,
      };

      /* ========= SECURITE FILTRAGE FRONT ========= */
      let filteredData = [...data];

      if (cleanedParams.date_debut && cleanedParams.date_fin) {
        filteredData = filteredData.filter((v) => {
          const date = v.created_at?.slice(0, 10);
          return (
            date >= cleanedParams.date_debut &&
            date <= cleanedParams.date_fin
          );
        });
      }

      if (cleanedParams.vendeur_id) {
        filteredData = filteredData.filter(
          (v) => v.vendeur_id === cleanedParams.vendeur_id
        );
      }

      if (cleanedParams.produit_id) {
        filteredData = filteredData.filter(
          (v) => v.produit_id === cleanedParams.produit_id
        );
      }

      return {
        data: filteredData,
        pagination,
      };
    } catch (error) {
      console.error(
        "❌ Erreur chargement historique ventes :",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * 🔹 Total des ventes par jour
   */
  getTotalVenteParJour: async (params = {}) => {
    try {
      const cleanedParams = cleanParams(params);

      const res = await httpClient.get(TOTAL_PAR_JOUR, {
        params: cleanedParams,
      });

      return Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
    } catch (error) {
      console.error(
        "❌ Erreur chargement ventes par jour :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default controleVenteAPI;

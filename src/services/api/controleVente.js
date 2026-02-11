/**
 * ==========================================================
 * 📊 Contrôle Vente API
 * ==========================================================
 * - Historique des ventes
 * - Total des ventes par jour
 */

import httpClient from "../http/client";

const BASE = "/historique-ventes";
const TOTAL_PAR_JOUR = "/total-vente-par-jour";

const controleVenteAPI = {
  /**
   * 🔹 Historique des ventes
   * @param {Object} params
   * @param {string} params.date_debut (YYYY-MM-DD)
   * @param {string} params.date_fin   (YYYY-MM-DD)
   * @param {number} params.produit_id
   * @param {number} params.boutique_id
   */
  getHistoriqueVentes: async (params = {}) => {
    try {
      const res = await httpClient.get(BASE, { params });

      // 🛡 Sécurité : toujours retourner un tableau
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;

      return [];
    } catch (error) {
      console.error(
        "❌ Erreur chargement historique ventes :",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * 🔹 Total des ventes par jour (graphique)
   * @param {Object} params
   * @param {string} params.date_debut
   * @param {string} params.date_fin
   */
  getTotalVenteParJour: async (params = {}) => {
    try {
      const res = await httpClient.get(TOTAL_PAR_JOUR, { params });

      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;

      return [];
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

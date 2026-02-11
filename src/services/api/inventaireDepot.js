/**
 * 📦 Inventaire Dépôt API
 * Endpoint officiel :
 * GET api/mouvements-stock/inventaire-depot
 */

import httpClient from "../http/client";

const ENDPOINT = "/mouvements-stock/inventaire-depot";

const inventaireDepotAPI = {
  async getInventaire() {
    try {
      const res = await httpClient.get(ENDPOINT);

      // Sécurité absolue
      if (Array.isArray(res?.data)) {
        return res.data;
      }

      if (Array.isArray(res?.data?.data)) {
        return res.data.data;
      }

      console.warn("⚠️ Format inventaire dépôt inattendu :", res.data);
      return [];
    } catch (error) {
      console.error(
        "❌ Erreur chargement inventaire dépôt :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default inventaireDepotAPI;

/**
 * 📦 Inventaire Dépôt API
 * Endpoint officiel chef :
 * GET api/mouvements-stock/inventaire-depot
 */

import httpClient from "../http/client";

const ENDPOINT = "/mouvements-stock/inventaire-depot";

export const inventaireDepotAPI = {
  /**
   * Récupérer l'inventaire du dépôt
   */
  getInventaire: async () => {
    try {
      const res = await httpClient.get(ENDPOINT);
      return res.data;
    } catch (error) {
      console.error(
        "❌ Erreur chargement inventaire dépôt :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

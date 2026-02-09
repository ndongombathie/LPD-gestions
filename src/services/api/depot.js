/**
 * 🏭 Dépôt API
 * Gestion des produits du dépôt et état de stock
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits";

export const depotAPI = {
  /**
   * 📦 Récupérer la liste des produits du dépôt
   * @returns {Promise<Array>}
   */
  getProduitsDepot: async () => {
    try {
      const response = await httpClient.get(ENDPOINT);

      /**
       * ⚠️ Sécurité :
       * On force toujours un tableau pour éviter
       * l'erreur "map is not a function"
       */
      const data = response?.data;

      if (Array.isArray(data)) {
        return data;
      }

      // Cas API => { data: [...] }
      if (Array.isArray(data?.data)) {
        return data.data;
      }

      console.warn("⚠️ Format inattendu API produits dépôt :", data);
      return [];
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

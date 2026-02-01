/**
 * 📦 Inventaire Boutique API
 */
import httpClient from "../http/client";

const ENDPOINT = "/inventaires-boutique";

export const inventaireBoutiqueAPI = {
  getInventaire: async (params = {}) => {
    try {
      const res = await httpClient.get(ENDPOINT, { params });
      return res.data;
    } catch (error) {
      console.error("❌ Erreur chargement inventaire boutique :", error.response?.data || error.message);
      throw error;
    }
  },
};

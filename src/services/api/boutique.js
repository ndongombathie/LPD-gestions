/**
 * 🏪 Boutique – Contrôle des produits
 *
 * Endpoint:
 * GET api/produits-controle-boutique
 *
 * Rôle:
 * - Lister les produits du boutique
 * - Afficher l’état du stock (quantité, seuil, statut)
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits-controle-boutique";

const boutiqueAPI = {
  /**
   * Récupérer les produits du boutique avec état de stock
   */
  getProduitsControle: async () => {
    try {
      const response = await httpClient.get(ENDPOINT);
      return response.data;
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

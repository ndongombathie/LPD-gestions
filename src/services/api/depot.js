/**
 * 🏭 Dépôt – Contrôle des produits
 *
 * Endpoint:
 * GET api/produits-controle-depots
 *
 * Rôle:
 * - Centraliser l’accès API
 * - Normaliser pagination Laravel
 * - Forcer pagination 25 par défaut
 * - Transformer les données pour le frontend
 */

import httpClient from "../http/client";

const ENDPOINT = "/produits-controle-depots";
const DEFAULT_PER_PAGE = 25;

/**
 * 🟢 Calcul état du stock
 */
const getEtatStock = (stockGlobal, stockSeuil) => {
  if (stockGlobal === 0) return "Rupture";
  if (stockGlobal <= stockSeuil) return "Stock faible";
  return "Disponible";
};

/**
 * 🔄 Compter les réapprovisionnements
 */
const getNombreReappro = (mouvements = []) => {
  if (!Array.isArray(mouvements)) return 0;

  // Si le backend contient seulement les entrées
  return mouvements.length;

  // ⚠️ Si plus tard il y a type: "entree" / "sortie"
  // return mouvements.filter(m => m.type === "entree").length;
};

const depotAPI = {
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

      const rawData = Array.isArray(payload?.data)
        ? payload.data
        : [];

      /**
       * 🔥 Transformation des données
       * On renvoie uniquement les champs demandés
       */
      const data = rawData.map((produit) => ({
        id: produit.id, // utile pour key React
        nom: produit.nom,
        prix_achat: produit.prix_achat,
        nombre_carton: produit.nombre_carton,
        stock_global: produit.stock_global,
        stock_seuil: produit.stock_seuil,
        etat_stock: getEtatStock(
          produit.stock_global,
          produit.stock_seuil
        ),
        nombre_reappro: getNombreReappro(
          produit.entreees_sorties
        ),
      }));

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

import httpClient from "../http/client";

const PRODUITS_ENDPOINT = "/produits-controle-depots";
const MOUVEMENTS_ENDPOINT = "/mouvements-stock";
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
  return mouvements.length;
};

const depotAPI = {
  /**
   * 📦 Produits dépôt (avec pagination)
   */
  getProduitsControle: async (params = {}) => {
    try {
      const {
        page = 1,
        per_page = DEFAULT_PER_PAGE,
        ...filters
      } = params;

      const res = await httpClient.get(PRODUITS_ENDPOINT, {
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
       * 🔥 TRANSFORMATION CORRIGÉE
       */
      const data = rawData.map((produit) => ({
        id: produit.id,
        nom: produit.nom,
        code: produit.code,

        // ✅ ON GARDE LE FOURNISSEUR
        fournisseur: {
          id: produit.fournisseur?.id ?? null,
          nom: produit.fournisseur?.nom ?? "Non défini",
          contact: produit.fournisseur?.contact ?? null,
          adresse: produit.fournisseur?.adresse ?? null,
        },

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

  /**
   * 📜 Mouvements d’un produit
   */
  getMouvementsProduit: async (produitId) => {
    try {
      if (!produitId) {
        throw new Error("produitId est requis");
      }

      const res = await httpClient.get(MOUVEMENTS_ENDPOINT, {
        params: {
          produit_id: produitId,
          per_page: 100,
        },
      });

      const payload = res?.data ?? {};
      const rawData = Array.isArray(payload?.data)
        ? payload.data
        : [];

      const data = rawData.map((mouvement) => ({
        id: mouvement.id,
        type: mouvement.type,
        source: mouvement.source,
        destination: mouvement.destination,
        quantite: mouvement.quantite,
        motif: mouvement.motif,
        date: mouvement.date,
        quantite_avant:
          mouvement.entree_sortie?.quantite_avant ?? null,
        quantite_apres:
          mouvement.entree_sortie?.quantite_apres ?? null,
      }));

      return {
        data,
        pagination: {
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? data.length,
        },
      };
    } catch (error) {
      console.error(
        "❌ Erreur chargement mouvements produit :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default depotAPI;
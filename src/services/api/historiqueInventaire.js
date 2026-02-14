import httpClient from "../http/client";

const BASE_URL = "/historique-inventaires";

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeString = (v) => (v ? String(v) : "");

const historiqueInventaireAPI = {

  async getHistorique(params = {}) {
    try {

      const response = await httpClient.get(BASE_URL, { params });

      const raw = response?.data ?? {};
      const data = Array.isArray(raw?.data) ? raw.data : [];

      const items = data.map((h) => ({
        id: safeString(h?.id),
        date: h?.date ?? h?.created_at ?? null,
        quantite: safeNumber(h?.quantite),
        prix_unitaire: safeNumber(h?.prix_unitaire),
        montant: safeNumber(h?.montant),

        vendeur: {
          id: safeString(h?.vendeur?.id),
          nom: safeString(h?.vendeur?.nom),
          prenom: safeString(h?.vendeur?.prenom),
          role: safeString(h?.vendeur?.role),
          boutique_id: h?.vendeur?.boutique_id ?? null,
        },

        produit: {
          id: safeString(h?.produit?.id),
          nom: safeString(h?.produit?.nom),
          code: safeString(h?.produit?.code),
        },
      }));

      return {
        items,
        pagination: {
          currentPage: safeNumber(raw?.current_page ?? 1),
          lastPage: safeNumber(raw?.last_page ?? 1),
          perPage: safeNumber(raw?.per_page ?? 10),
          total: safeNumber(raw?.total ?? 0),
          nextPageUrl: raw?.next_page_url ?? null,
          prevPageUrl: raw?.prev_page_url ?? null,
        },
      };

    } catch (error) {

      console.error("❌ Erreur GET historique inventaire :", error);

      return {
        items: [],
        pagination: {
          currentPage: 1,
          lastPage: 1,
          perPage: 10,
          total: 0,
        },
      };
    }
  },

};

export default historiqueInventaireAPI;

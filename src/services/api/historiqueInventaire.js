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
        type: safeString(h?.type),
        date_debut: h?.date_debut ?? null,
        date_fin: h?.date_fin ?? null,
        date: h?.date ?? null,
        prix_achat_total: safeNumber(h?.prix_achat_total),
        prix_valeur_sortie_total: safeNumber(h?.prix_valeur_sortie_total),
        valeur_estimee_total: safeNumber(h?.valeur_estimee_total),
        benefice_total: safeNumber(h?.benefice_total),
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

import httpClient from "../http/client";

const BASE_URL = "/enregistrer-versements";

/* ================= UTILITAIRES SÉCURISÉS ================= */

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeString = (v) => (v ? String(v) : "");

const safeDate = (v) => (v ? v : null);

/* ================= SERVICE ================= */

const historiqueVersementAPI = {

  /* ===== GET PAGINÉ ===== */

  async getHistorique(params = {}) {
    try {

      const response = await httpClient.get(BASE_URL, { params });

      const raw = response?.data ?? {};
      const data = Array.isArray(raw?.data) ? raw.data : [];

      const items = data.map((v) => ({
        id: safeString(v?.id),

        date: safeDate(v?.date ?? v?.created_at),
        montant: safeNumber(v?.montant),
        observation: safeString(v?.observation),

        caissier_nom: safeString(v?.caissier?.nom),
      }));

      return {
        items,
        pagination: {
          currentPage: Number(raw?.current_page ?? 1),
          lastPage: Number(raw?.last_page ?? 1),
          perPage: Number(raw?.per_page ?? 10),
          total: Number(raw?.total ?? 0),
        },
      };

    } catch (error) {

      console.error("❌ Erreur GET historique versements :", error);

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

  /* ===== GET TOUTES LES PAGES (POUR IMPRESSION GLOBALE) ===== */

  async getAllHistorique(params = {}) {
    try {

      let allItems = [];
      let currentPage = 1;
      let lastPage = 1;

      do {

        const response = await httpClient.get(BASE_URL, {
          params: {
            ...params,
            page: currentPage,
            per_page: 50,
          },
        });

        const raw = response?.data ?? {};
        const data = Array.isArray(raw?.data) ? raw.data : [];

        const mapped = data.map((v) => ({
          id: safeString(v?.id),
          date: safeDate(v?.date ?? v?.created_at),
          montant: safeNumber(v?.montant),
          observation: safeString(v?.observation),
          caissier_nom: safeString(v?.caissier?.nom),
        }));

        allItems = [...allItems, ...mapped];

        lastPage = Number(raw?.last_page ?? 1);
        currentPage++;

      } while (currentPage <= lastPage);

      return allItems;

    } catch (error) {

      console.error("❌ Erreur GET ALL historique versements :", error);
      return [];
    }
  },

};

export default historiqueVersementAPI;

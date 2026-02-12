// ==========================================================
// 📦 Inventaire Dépôt API — VERSION STABLE ENTERPRISE
// ==========================================================

import httpClient from "../http/client";

const ENDPOINT = "/mouvements-stock/inventaire-depot";
const SAVE_ENDPOINT = "/enregistrer-inventaire-depot";
const DEFAULT_PER_PAGE = 15;

/* ================= UTIL ================= */

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeDate = (d) => (d ? String(d) : undefined);

/* ================= API ================= */

const inventaireDepotAPI = {

  // 🔹 GET Produits inventaire
  async getInventaire(params = {}) {
    try {
      const {
        page = 1,
        per_page = DEFAULT_PER_PAGE,
        date_debut,
        date_fin,
      } = params;

      const res = await httpClient.get(ENDPOINT, {
        params: {
          page,
          per_page,
          date_debut: sanitizeDate(date_debut),
          date_fin: sanitizeDate(date_fin),
        },
      });

      const payload = res?.data ?? {};

      return {
        items: Array.isArray(payload?.data)
          ? payload.data.map((p) => ({
              id: p.id,
              nom: p.nom ?? "—",
              categorie: p.categorie ?? "Non classé",
              total_entree: toNumber(p.total_entree),
              total_sortie: toNumber(p.total_sortie),
              stock_restant: toNumber(p.stock_restant),
              valeur_sortie: toNumber(p.valeur_sortie),
              valeur_estimee: toNumber(p.valeur_estimee),
            }))
          : [],

        pagination: {
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? 0,
          nextPageUrl: payload?.next_page_url ?? null,
          prevPageUrl: payload?.prev_page_url ?? null,
        },
      };

    } catch (error) {
      console.error("Erreur GET inventaire:", error);
      throw error;
    }
  },

  // 🔹 POST Calcul Totaux
  async calculerTotaux({ date_debut, date_fin }) {
    try {
      const res = await httpClient.post(SAVE_ENDPOINT, {
        date_debut,
        date_fin,
      });

      return {
        prix_achat_total: toNumber(res?.data?.prix_achat_total),
        prix_valeur_sortie_total: toNumber(res?.data?.prix_valeur_sortie_total),
        valeur_estimee_total: toNumber(res?.data?.valeur_estimee_total),
        benefice_total: toNumber(res?.data?.benefice_total),
      };

    } catch (error) {
      console.error("Erreur POST totaux:", error);
      throw error;
    }
  },

};

export default inventaireDepotAPI;

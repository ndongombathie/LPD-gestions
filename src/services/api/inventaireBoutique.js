import httpClient from "../http/client";

/* ================= CONFIG ================= */
const ENDPOINT = "/inventaires-boutique";
const SAVE_ENDPOINT = "/enregistrer-inventaire-boutique";
const DEFAULT_PER_PAGE = 15;

/* ================= UTIL ================= */

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeDate = (d) => (d ? String(d) : undefined);

/* ================= API ================= */

const inventaireBoutiqueAPI = {

  /* ==========================================================
   * GET INVENTAIRE BOUTIQUE
   * ========================================================== */
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

      // ⚠️ structure backend : { produits: { data: [], current_page... } }
      const payload = res?.data?.produits ?? {};

      return {
        items: Array.isArray(payload?.data)
          ? payload.data.map((p) => ({
              id: p.produit_id,
              nom: p.produit?.nom ?? "—",
              code: p.produit?.code ?? "",
              stock_initial: toNumber(p.stock_initial),
              quantite_vendue: toNumber(p.quantite_vendue),
              ecart: toNumber(p.ecart),
              total_vendu: toNumber(p.total_vendu),
              total_resant: toNumber(p.total_resant),
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
      console.error("❌ Erreur GET inventaire boutique:", error);
      throw error;
    }
  },

  /* ==========================================================
   * POST ENREGISTRER INVENTAIRE BOUTIQUE
   * ========================================================== */
  async enregistrerInventaire({ date_debut, date_fin }) {
    try {
      if (!date_debut || !date_fin) {
        throw new Error("Intervalle de dates obligatoire");
      }

      if (date_debut > date_fin) {
        throw new Error("Date début supérieure à date fin");
      }

      const res = await httpClient.post(SAVE_ENDPOINT, {
        date_debut: sanitizeDate(date_debut),
        date_fin: sanitizeDate(date_fin),
      });

      return {
        prix_achat_total: toNumber(res?.data?.prix_achat_total),
        prix_valeur_sortie_total: toNumber(res?.data?.prix_valeur_sortie_total),
        valeur_estimee_total: toNumber(res?.data?.valeur_estimee_total),
        benefice_total: toNumber(res?.data?.benefice_total),
      };

    } catch (error) {
      console.error("❌ Erreur POST enregistrer inventaire boutique:", error);
      throw error;
    }
  },

};

export default inventaireBoutiqueAPI;

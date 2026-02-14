// ==========================================================
// 🧾 Controle Vente API — VERSION ULTRA STABLE
// Compatible pagination Laravel native
// Endpoint: GET api/commandes-payees
// ==========================================================

import httpClient from "../http/client";

const ENDPOINT = "/commandes-payees";
const DEFAULT_PER_PAGE = 15;

/* ================= UTIL ================= */

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeDate = (d) => (d ? String(d) : undefined);

/* ================= API ================= */

const controleVenteAPI = {

  /* ==========================================================
   * 🔹 GET COMMANDES PAYÉES (Paginated)
   * ========================================================== */
  async getCommandes(params = {}) {
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
        items: Array.isArray(payload.data)
          ? payload.data.map((cmd) => ({
              id: cmd.id,
              date: cmd.created_at ?? null,
              vendeur: {
                nom: cmd.vendeur?.nom ?? "",
                prenom: cmd.vendeur?.prenom ?? "",
              },
              produit: {
                nom: cmd.produit?.nom ?? "-",
              },
              quantite: toNumber(cmd.quantite),
              montant: toNumber(cmd.montant),
            }))
          : [],

        pagination: {
          currentPage: payload.current_page ?? 1,
          lastPage: payload.last_page ?? 1,
          total: payload.total ?? 0,
          perPage: payload.per_page ?? DEFAULT_PER_PAGE,
          nextPageUrl: payload.next_page_url ?? null,
          prevPageUrl: payload.prev_page_url ?? null,
        },
      };

    } catch (error) {
      console.error("❌ Erreur GET commandes payées:", error);
      throw error;
    }
  },

};

export default controleVenteAPI;

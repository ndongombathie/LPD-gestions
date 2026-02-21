// ==========================================================
// 🧾 Controle Vente API — VERSION ENTERPRISE STABLE
// Compatible Laravel pagination
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

const safeString = (v) => (v ? String(v) : "");

const fullName = (person) => {
  if (!person) return "";
  return `${safeString(person.nom)} ${safeString(person.prenom)}`.trim();
};

/* ================= API ================= */

const controleVenteAPI = {

  async getCommandes(params = {}) {
    try {

      const {
        page = 1,
        per_page = DEFAULT_PER_PAGE,
        date_debut,
        date_fin,
      } = params;

      /* ================= BUILD QUERY SAFE ================= */

      const queryParams = {
        page,
        per_page,
      };

      if (date_debut) queryParams.date_debut = date_debut;
      if (date_fin) queryParams.date_fin = date_fin;

      /* ================= REQUEST ================= */

      const res = await httpClient.get(ENDPOINT, {
        params: queryParams,
      });

      const payload = res?.data ?? {};

      /* ================= MAP DATA ================= */

      const items = Array.isArray(payload.data)
        ? payload.data.map((cmd) => {

            const total = toNumber(cmd.total);

            const totalPaye = Array.isArray(cmd.paiements)
              ? cmd.paiements.reduce(
                  (sum, p) => sum + toNumber(p.montant),
                  0
                )
              : 0;

            const reste = total - totalPaye;

            const nombreProduits = Array.isArray(cmd.details)
              ? cmd.details.reduce(
                  (sum, d) => sum + toNumber(d.quantite),
                  0
                )
              : 0;

            return {
              id: cmd.id ?? null,

              // ⚠ On garde la date brute du backend
              date: cmd.date ?? cmd.created_at ?? null,

              statut: safeString(cmd.statut),
              typeVente: safeString(cmd.type_vente),

              total,
              totalPaye,
              reste,

              nombreProduits,

              clientNom: fullName(cmd.client),
              vendeurNom: fullName(cmd.vendeur),

              paiements: Array.isArray(cmd.paiements) ? cmd.paiements : [],
              details: Array.isArray(cmd.details) ? cmd.details : [],
            };
          })
        : [];

      /* ================= RETURN ================= */

      return {
        items,
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
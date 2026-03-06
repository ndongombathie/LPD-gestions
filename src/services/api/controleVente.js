// ==========================================================
// 🧾 Controle Vente API — VERSION STABLE + FILTRE TYPE CLIENT
// ==========================================================

import httpClient from "../http/client";

const ENDPOINT = "/commandes-payees";
const DEFAULT_PER_PAGE = 10;

// ---------- helpers ----------

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeString = (v) => (v ? String(v) : "");

const fullName = (person) => {
  if (!person) return "";
  return `${safeString(person.prenom)} ${safeString(person.nom)}`.trim();
};

// ---------- API ----------

const controleVenteAPI = {

  async getCommandes(params = {}) {

    try {

      const {
        page = 1,
        per_page = DEFAULT_PER_PAGE,
        date_debut,
        date_fin,
        type_client // 🔥 filtre client
      } = params;

      const queryParams = {
        page,
        per_page,
      };

      if (date_debut) queryParams.date_debut = date_debut;
      if (date_fin) queryParams.date_fin = date_fin;

      // 🔥 filtre type client
      if (type_client) queryParams.type_client = type_client;

      const res = await httpClient.get(ENDPOINT, {
        params: queryParams,
      });

      const payload = res?.data ?? {};

      const items = Array.isArray(payload.data)
        ? payload.data.map((cmd) => {

            const total = toNumber(cmd.total);

            const paiements = Array.isArray(cmd.paiements)
              ? cmd.paiements
              : [];

            const totalPaye = paiements.reduce(
              (sum, p) => sum + toNumber(p.montant),
              0
            );

            // ---------- calcul reste ----------

            let reste = total - totalPaye;

            if (paiements.length > 0) {

              const dernierPaiement = paiements[paiements.length - 1];

              if (dernierPaiement?.reste_du !== undefined) {
                reste = toNumber(dernierPaiement.reste_du);
              }

            }

            // ---------- nombre produits ----------

            const nombreProduits = Array.isArray(cmd.details)
              ? cmd.details.reduce(
                  (sum, d) => sum + toNumber(d.quantite),
                  0
                )
              : 0;

            return {

              id: cmd.id ?? null,

              numero: cmd.numero ?? null,

              date: cmd.date ?? cmd.created_at ?? null,

              statut: safeString(cmd.statut),

              typeVente: safeString(cmd.type_vente),

              total,

              totalPaye,

              reste,

              nombreProduits,

              // ---------- client ----------

              typeClient: safeString(cmd.client?.type_client),

              clientNom: fullName(cmd.client),

              clientTelephone: safeString(cmd.client?.telephone),

              // ---------- vendeur ----------

              vendeurNom: fullName(cmd.vendeur),

              // ---------- relations ----------

              paiements,

              details: Array.isArray(cmd.details) ? cmd.details : [],

            };

          })
        : [];

      return {

        items,

        pagination: {

          currentPage: payload.current_page ?? 1,

          lastPage: payload.last_page ?? 1,

          total: payload.total ?? 0,

          perPage: payload.per_page ?? DEFAULT_PER_PAGE,

        },

      };

    } catch (error) {

      console.error("Erreur GET commandes payées:", error);

      throw error;

    }

  },

};

export default controleVenteAPI;
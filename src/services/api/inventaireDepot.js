/**
 * 📦 Inventaire Dépôt API
 * GET api/mouvements-stock/inventaire-depot
 */

import httpClient from "../http/client";

const ENDPOINT = "/mouvements-stock/inventaire-depot";

const inventaireDepotAPI = {
  async getInventaire(params = {}) {
    try {
      const res = await httpClient.get(ENDPOINT, { params });
      const payload = res?.data ?? {};

      const items = Array.isArray(payload?.data)
        ? payload.data.map((p) => ({
            id: p.id,
            nom: p.nom,
            categorie: p.categorie,
            total_entree: Number(p.total_entree ?? 0),
            total_sortie: Number(p.total_sortie ?? 0),
            stock_restant: Number(p.stock_restant ?? 0),
            valeur_sortie: Number(p.valeur_sortie ?? 0),
            valeur_estimee: Number(p.valeur_estimee ?? 0),
          }))
        : [];

      const pagination = {
        currentPage: payload.current_page ?? 1,
        lastPage: payload.last_page ?? 1,
        perPage: payload.per_page ?? 25,
        total: payload.total ?? items.length,
        nextPageUrl: payload.next_page_url ?? null,
        prevPageUrl: payload.prev_page_url ?? null,
      };

      return { items, pagination };
    } catch (error) {
      console.error("Erreur inventaire dépôt:", error);
      throw error;
    }
  },
};

export default inventaireDepotAPI;

// ==========================================================
// 🏪 Inventaire Boutique API — VERSION PRO STABLE
// ==========================================================

import httpClient from "../http/client";

const ENDPOINT = "/inventaires-boutique";

const inventaireBoutiqueAPI = {
  async getInventaire(params = {}) {
    try {
      const res = await httpClient.get(ENDPOINT, { params });
      const payload = res?.data;

      const produits = payload?.produits;

      const items = Array.isArray(produits?.data)
        ? produits.data.map((p) => ({
            id: p.produit_id,
            produit_id: p.produit_id,
            nom: p.produit?.nom ?? "—",
            code: p.produit?.code ?? "",
            prix_achat: Number(p.produit?.prix_achat ?? 0),

            stock_initial: Number(p.stock_initial ?? 0),
            quantite_vendue: Number(p.quantite_vendue ?? 0),
            ecart: Number(p.ecart ?? 0),

            total_vendu: Number(p.total_vendu ?? 0),
            total_restant: Number(p.total_resant ?? 0),
          }))
        : [];

      const pagination = {
        currentPage: produits?.current_page ?? 1,
        lastPage: produits?.last_page ?? 1,
        perPage: produits?.per_page ?? items.length,
        total: produits?.total ?? items.length,
        nextPageUrl: produits?.next_page_url ?? null,
        prevPageUrl: produits?.prev_page_url ?? null,
      };

      return {
        items,
        pagination,
        date: payload?.date ?? null,
      };
    } catch (error) {
      console.error(
        "❌ Erreur chargement inventaire boutique :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default inventaireBoutiqueAPI;

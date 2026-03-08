// ==========================================================
// 📊 Dashboard API — VERSION ULTRA ROBUSTE PRODUCTION
// ==========================================================

import httpClient from "../http/client";

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const dashboardAPI = {

  async getDashboardStats() {

    try {

      const responses = await Promise.allSettled([
        httpClient.get("/nombre-produits"),
        httpClient.get("/quantite-totale-produit"),
        httpClient.get("/nombre-versement-total"),
        httpClient.get("/somme-versement-total"),
        httpClient.get("/somme-paiements-total"),
      ]);

      const getData = (index) =>
        responses[index].status === "fulfilled"
          ? responses[index].value?.data
          : null;

      const nombreProduitsData = getData(0);
      const quantiteTotaleData = getData(1);
      const nombreVersementsData = getData(2);
      const sommeVersementsData = getData(3);
      const sommeEncaissementsData = getData(4);

      return {
        nombreProduits: safeNumber(nombreProduitsData),

        quantiteTotale: safeNumber(
          quantiteTotaleData?.total_quantity
        ),

        nombreVersements: safeNumber(nombreVersementsData),

        sommeVersements: safeNumber(sommeVersementsData),

        sommeEncaissements: safeNumber(sommeEncaissementsData),
      };

    } catch (error) {

      console.error("❌ Dashboard global error:", error);

      return {
        nombreProduits: 0,
        quantiteTotale: 0,
        nombreVersements: 0,
        sommeVersements: 0,
        sommeEncaissements: 0,
      };
    }
  },
};

export default dashboardAPI;
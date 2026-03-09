// ==========================================================
// 📘 Journal Responsable API — Version Alignée Backend
// ==========================================================

import httpClient from "../http/client";

export const journalResponsableAPI = {

  // ==========================================================
  // 🔹 VENDEURS
  // ==========================================================

  async getVendeurs(params = {}) {
    const response = await httpClient.get(
      "/total-ventes-par-vendeur",
      { params }
    );
    return response.data;
  },

  async getVendeursCount() {
    const response = await httpClient.get("/vendeurs-count");
    return response.data;
  },

  async getCommandesParVendeur(id, filters = {}) {
    const response = await httpClient.get(
      `/commandes-par-vendeur/${id}`,
      { params: filters }
    );
    return response.data;
  },

  // ==========================================================
  // 🔹 CAISSIERS
  // ==========================================================

  async getCaissiers(params = {}) {
    const response = await httpClient.get(
      "/caissier/caisses-journal",
      { params }
    );
    return response.data;
  },

  async getCaissiersCount() {
    const response = await httpClient.get("/caissiers-count");
    return response.data;
  },

  // ✅ Historique COMPLET (payee, annulee, partiellement_payee + paiements)
  async getHistoriqueCaissier(id, filters = {}) {
    const response = await httpClient.get(
      `/commandes-par-caissier/${id}`,
      { params: filters }
    );
    return response.data;
  },
// 🔹 FOND DE CAISSE
async attribuerFondCaisse(caissierId, montant) {
  const response = await httpClient.post(
    `/fond-caisse/${caissierId}`,
    { montant }
  );
  return response.data;
}

};
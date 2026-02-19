// ==========================================================
// 📘 Journal Responsable API
// ==========================================================

import httpClient from "../http/client";

const ENDPOINTS = {
  VENDEURS: "/vendeurs",
  CAISSIERS: "/caissiers",
  GESTIONNAIRES: "/gestionnaires-boutique",
};

// helper safe
const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const journalResponsableAPI = {

  async getVendeurs() {
    const response = await httpClient.get(ENDPOINTS.VENDEURS);
    return toArray(response.data);
  },

    async getCaissiers() {
    const response = await httpClient.get(ENDPOINTS.CAISSIERS);
    return response.data;
    },



  async getGestionnairesBoutique() {
    const response = await httpClient.get(ENDPOINTS.GESTIONNAIRES);
    return toArray(response.data);
  },

};

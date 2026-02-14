import httpClient from "../http/client";

const BASE_URL = "/enregistrer-versements";

const versementAPI = {

  async enregistrerVersement(payload = {}) {

    try {

      const body = {
        caissier_id: payload.caissier_id ? String(payload.caissier_id) : null,
        montant: payload.montant ? parseFloat(payload.montant) : null,
        observation: payload.observation || null,
        date: payload.date || null,
      };

      const response = await httpClient.post(BASE_URL, body);

      const raw = response?.data ?? {};

      return {
        success: true,
        message: raw?.message || "Versement enregistré avec succès",
        data: raw?.data ?? null,
      };

    } catch (error) {

      console.error("Erreur API versement:", error.response?.data);

      if (error.response?.status === 422) {
        return {
          success: false,
          validationErrors: error.response.data?.errors ?? {},
          message: "Erreur de validation",
        };
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Erreur lors de l'enregistrement du versement",
      };
    }
  },

};

export default versementAPI;

import httpClient from "../http/client";

const BASE_URL = "/enregistrer-versements";
const CAISSIERS_ENDPOINT = "/caissiers/all";

const versementAPI = {

  /* =======================================================
     🔹 ENREGISTRER VERSEMENT
  ======================================================= */
  async enregistrerVersement(payload = {}) {

    try {

      const body = {
        caissier_id: payload?.caissier_id
          ? String(payload.caissier_id)
          : null,

        montant:
          payload?.montant !== undefined && payload?.montant !== null
            ? parseFloat(payload.montant)
            : null,

        observation: payload?.observation || null,
        date: payload?.date || null,
      };

      const response = await httpClient.post(BASE_URL, body);
      const raw = response?.data ?? {};

      return {
        success: true,
        message: raw?.message || "Versement enregistré avec succès",
        data: raw?.data ?? null,
      };

    } catch (error) {

      console.error("Erreur API versement:", error?.response?.data);

      if (error?.response?.status === 422) {
        return {
          success: false,
          validationErrors: error?.response?.data?.errors ?? {},
          message: "Erreur de validation",
          data: null,
        };
      }

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "Erreur lors de l'enregistrement du versement",
        data: null,
      };
    }
  },

  /* =======================================================
     🔹 RÉCUPÉRER TOUS LES CAISSIERS
     Compatible :
     - Tableau brut []
     - { data: [] }
     - Pagination future Laravel
  ======================================================= */
  async getAllCaissiers() {

    try {

      const response = await httpClient.get(CAISSIERS_ENDPOINT);
      const payload = response?.data ?? [];

      let rawData = [];

      // Cas 1 : tableau brut
      if (Array.isArray(payload)) {
        rawData = payload;
      }

      // Cas 2 : { data: [...] }
      else if (Array.isArray(payload?.data)) {
        rawData = payload.data;
      }

      // Cas 3 : pagination Laravel future
      else if (Array.isArray(payload?.data?.data)) {
        rawData = payload.data.data;
      }

      const data = rawData.map((caissier) => ({
        id: caissier?.id ?? "",
        nom: caissier?.nom ?? "",
        prenom: caissier?.prenom ?? "",
       nom_complet: `${caissier?.prenom ?? ""} ${caissier?.nom ?? ""}`.trim(), 
        telephone: caissier?.telephone ?? "",
        numero_cni: caissier?.numero_cni ?? "",
        adresse: caissier?.adresse ?? "",
        email: caissier?.email ?? "",
        boutique_id: caissier?.boutique_id ?? "",
        role: caissier?.role ?? "",
        is_online: caissier?.is_online ?? false,
        created_at: caissier?.created_at ?? null,
      }));

      return {
        success: true,
        data,
        pagination: {
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? data.length,
        },
      };

    } catch (error) {

      console.error("Erreur API caissiers:", error?.response?.data);

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "Erreur lors du chargement des caissiers",
        data: [],
        pagination: {
          currentPage: 1,
          lastPage: 1,
          total: 0,
        },
      };
    }
  },

};

export default versementAPI;
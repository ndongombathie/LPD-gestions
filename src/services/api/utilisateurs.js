/**
 * 👤 Utilisateurs API — ALIGNÉE AVEC LARAVEL
 * CRUD + Reset mot de passe
 * ✅ Pagination 20 par page
 * ✅ Recherche par nom, prénom, email, rôle
 * ✅ Filtre par rôle — CORRECTION FORMAT
 * ✅ Gestion erreurs 422, 409
 * 🚀 VERSION ULTIME — 100 ANS
 */

import httpClient from "../http/client";

// =======================
// ENDPOINTS
// =======================
const ENDPOINTS = {
  GET_ALL: "/utilisateurs",
  GET_BY_ID: (id) => `/utilisateurs/${id}`,
  CREATE: "/utilisateurs",
  UPDATE: (id) => `/utilisateurs/${id}`,
  DELETE: (id) => `/utilisateurs/${id}`,
  RESET_PASSWORD: (id) => `/utilisateurs/${id}/reset-password`,
};

const DEFAULT_PER_PAGE = 20;

// =======================
// MAPPE DES RÔLES (Frontend -> Backend)
// =======================
const ROLE_MAPPING = {
  "Responsable": "responsable",
  "Vendeur": "vendeur",
  "Caissier": "caissier",
  "Gestionnaire Dépôt": "gestionnaire_depot",
  "Gestionnaire Boutique": "gestionnaire_boutique"
};

// =======================
// API — AVEC TOUS LES PARAMÈTRES
// =======================
const utilisateursAPI = {
  /* 📥 LISTE PAGINÉE — AVEC RECHERCHE ET FILTRES */
  async getAll(params = {}) {
    try {
      // Construction des paramètres de requête
      const queryParams = {
        page: params.page || 1,
        per_page: DEFAULT_PER_PAGE,
      };

      // 🔍 AJOUT DU TERME DE RECHERCHE
      if (params.search && params.search.trim() !== "") {
        queryParams.search = params.search.trim();
      }

      // 🎯 AJOUT DU FILTRE PAR RÔLE — AVEC CONVERSION
      if (params.role && params.role.trim() !== "") {
        // Convertir le format affichage -> format base de données
        queryParams.role = ROLE_MAPPING[params.role] || params.role.toLowerCase();
      }

      console.log("🚀 API Request params:", queryParams);

      const res = await httpClient.get(ENDPOINTS.GET_ALL, {
        params: queryParams,
      });

      return res.data;
      
    } catch (error) {
      console.error("❌ API Error getAll:", error);
      throw error;
    }
  },

  /* 🔍 DÉTAIL */
  async getById(id) {
    try {
      if (!id) throw new Error("ID utilisateur requis");
      const res = await httpClient.get(ENDPOINTS.GET_BY_ID(id));
      return res.data;
    } catch (error) {
      console.error("❌ API Error getById:", error);
      throw error;
    }
  },

  /* ➕ CRÉATION — AVEC CONVERSION DES RÔLES */
  async create(data) {
    try {
      // Convertir le rôle avant envoi
      const formattedData = {
        ...data,
        role: ROLE_MAPPING[data.role] || data.role.toLowerCase()
      };
      
      const res = await httpClient.post(ENDPOINTS.CREATE, formattedData);
      return res.data;
    } catch (error) {
      console.error("❌ API Error create:", error);
      throw error;
    }
  },

  /* ✏️ MISE À JOUR — AVEC CONVERSION DES RÔLES */
  async update(id, data) {
    try {
      if (!id) throw new Error("ID utilisateur requis");
      
      // Convertir le rôle avant envoi
      const formattedData = {
        ...data,
        role: data.role ? (ROLE_MAPPING[data.role] || data.role.toLowerCase()) : undefined
      };
      
      const res = await httpClient.put(ENDPOINTS.UPDATE(id), formattedData);
      return res.data;
    } catch (error) {
      console.error("❌ API Error update:", error);
      throw error;
    }
  },

  /* 🗑️ SUPPRESSION */
  async remove(id) {
    try {
      if (!id) throw new Error("ID utilisateur requis");
      const res = await httpClient.delete(ENDPOINTS.DELETE(id));
      return res.data;
    } catch (error) {
      console.error("❌ API Error remove:", error);
      throw error;
    }
  },

  /* 🔐 RESET MOT DE PASSE */
  async resetPassword(id) {
    try {
      if (!id) throw new Error("ID utilisateur requis");
      const res = await httpClient.post(ENDPOINTS.RESET_PASSWORD(id));
      return res.data;
    } catch (error) {
      console.error("❌ API Error resetPassword:", error);
      throw error;
    }
  },
};

export default utilisateursAPI;
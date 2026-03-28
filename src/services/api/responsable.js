/**
 * ============================================================
 * 🧑‍💼 API – Responsable Module
 *
 * APIs disponibles :
 *  - GET /api/decaissements-all
 *  - GET /api/clients-dette
 *
 * Structure :
 *  - Compatible pagination Laravel
 *  - Données normalisées pour le frontend
 *  - Extensible sans refactor
 *  - Gestion erreurs centralisée
 * ============================================================
 */

import httpClient from "../http/client";

/* ===================== ENDPOINTS ===================== */

const ENDPOINTS = {
  decaissements: "/decaissements-all",
  clientsEndettes: "/clients-dette",
};

const DEFAULT_PER_PAGE = 10;

/* ===================== UTILITAIRES ===================== */

const safeDate = (date) => (date ? new Date(date) : null);

const safeNumber = (value) => Number(value) || 0;

const formatStatut = (statut) => {
  if (!statut) return "inconnu";

  const map = {
    valide: "validé",
    en_attente: "en attente",
  };

  return map[statut] || statut;
};

const normalizePagination = (
  payload,
  fallbackPage,
  fallbackPerPage,
  dataLength
) => ({
  currentPage: payload?.current_page ?? fallbackPage,
  lastPage: payload?.last_page ?? 1,
  perPage: payload?.per_page ?? fallbackPerPage,
  total: payload?.total ?? dataLength,
  from: payload?.from ?? null,
  to: payload?.to ?? null,
});

/* ============================================================
   🧾 1️⃣ DÉCAISSEMENTS
   ============================================================ */

const getAllDecaissements = async (params = {}) => {
  try {
    const {
      page = 1,
      per_page = DEFAULT_PER_PAGE,
      statut,
    } = params;

    const response = await httpClient.get(ENDPOINTS.decaissements, {
      params: {
        page,
        per_page,
        ...(statut && { statut }),
      },
    });

    const payload = response?.data ?? {};
    const rawData = Array.isArray(payload?.data) ? payload.data : [];

    const data = rawData.map((item) => ({
      id: item?.id,
      motif: item?.motif,
      libelle: item?.libelle,
      montant: safeNumber(item?.montant),
      methode_paiement: item?.methode_paiement,
      date: safeDate(item?.date),
      created_at: safeDate(item?.created_at),

      statut: item?.statut,
      statut_label: formatStatut(item?.statut),

      responsable: item?.user
        ? {
            id: item.user?.id,
            nom: item.user?.nom,
            prenom: item.user?.prenom,
            fullName: `${item.user?.prenom ?? ""} ${item.user?.nom ?? ""}`.trim(),
            email: item.user?.email,
            role: item.user?.role,
            telephone: item.user?.telephone,
          }
        : null,

      caissier: item?.caissier
        ? {
            id: item.caissier?.id,
            nom: item.caissier?.nom,
            prenom: item.caissier?.prenom,
            fullName: `${item.caissier?.prenom ?? ""} ${item.caissier?.nom ?? ""}`.trim(),
            email: item.caissier?.email,
            role: item.caissier?.role,
            telephone: item.caissier?.telephone,
          }
        : null,
    }));

    return {
      data,
      pagination: normalizePagination(payload, page, per_page, data.length),
    };

  } catch (error) {

    console.error(
      "❌ Erreur chargement décaissements (Responsable):",
      error?.response?.data || error.message
    );

    throw error;
  }
};

/* ============================================================
   💳 2️⃣ CLIENTS ENDETTÉS
   ============================================================ */

const getClientsEndettes = async (params = {}) => {
  try {

    const {
      page = 1,
      per_page = DEFAULT_PER_PAGE,
    } = params;

    const response = await httpClient.get(ENDPOINTS.clientsEndettes, {
      params: { page, per_page },
    });

    const payload = response?.data ?? {};
    const rawData = Array.isArray(payload?.data) ? payload.data : [];

    const data = rawData.map((client) => ({
      id: client?.id,
      nom: client?.nom ?? "",
      prenom: client?.prenom ?? "",
      fullName: `${client?.prenom ?? ""} ${client?.nom ?? ""}`.trim(),
      telephone: client?.telephone ?? "",
      email: client?.email ?? "",
      dette_totale: safeNumber(client?.dette_totale),
      dernier_paiement: safeDate(client?.dernier_paiement),
      created_at: safeDate(client?.created_at),
    }));

    return {
      data,
      pagination: normalizePagination(payload, page, per_page, data.length),
    };

  } catch (error) {

    console.error(
      "❌ Erreur chargement clients endettés (Responsable):",
      error?.response?.data || error.message
    );

    throw error;
  }
};

/* ============================================================
   EXPORT GLOBAL
   ============================================================ */

const responsableAPI = {
  getAllDecaissements,
  getClientsEndettes,
};

export default responsableAPI;
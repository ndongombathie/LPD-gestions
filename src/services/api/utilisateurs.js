/**
 * 👤 Utilisateurs API — ALIGNÉE AVEC LARAVEL
 * CRUD + Reset mot de passe
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

// =======================
// API
// =======================
const utilisateursAPI = {
  /* 📥 LISTE */
  async getAll(params = {}) {
    const res = await httpClient.get(ENDPOINTS.GET_ALL, { params });
    return res.data;
  },

  /* 🔍 DÉTAIL */
  async getById(id) {
    if (!id) throw new Error("ID utilisateur requis");
    const res = await httpClient.get(ENDPOINTS.GET_BY_ID(id));
    return res.data;
  },

  /* ➕ CRÉATION
     ⚠️ Le mot de passe est généré côté BACKEND
     ⚠️ Email envoyé par Laravel
  */
  async create(data) {
    const res = await httpClient.post(ENDPOINTS.CREATE, data);
    return res.data;
  },

  /* ✏️ MISE À JOUR */
  async update(id, data) {
    if (!id) throw new Error("ID utilisateur requis");
    const res = await httpClient.put(ENDPOINTS.UPDATE(id), data);
    return res.data;
  },

  /* 🗑️ SUPPRESSION */
  async remove(id) {
    if (!id) throw new Error("ID utilisateur requis");
    const res = await httpClient.delete(ENDPOINTS.DELETE(id));
    return res.data;
  },

  /* 🔐 RESET MOT DE PASSE
     - ancien mot de passe invalidé
     - nouveau généré par Laravel
     - envoyé par email
  */
  async resetPassword(id) {
    if (!id) throw new Error("ID utilisateur requis");
    const res = await httpClient.post(ENDPOINTS.RESET_PASSWORD(id));
    return res.data;
  },
};

export default utilisateursAPI;

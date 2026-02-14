// ==========================================================
// 💰 journalCaisse.js — VERSION ULTRA STABLE 100 ANS
// Intégration API Journal Caisse
// Compatible backend Laravel (date par défaut si absente)
// ==========================================================

import httpClient from "../http/client";

/* ====================================================== */
/* UTILS SÉCURITÉ */
/* ====================================================== */

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const buildParams = (date) => {
  return date ? { date } : {};
};

/* ====================================================== */
/* API JOURNAL CAISSE */
/* ====================================================== */

const journalCaisseAPI = {

  /* ======================================================
     🔵 TOTAL CAISSE
     GET api/caissier/caisses-journal-total-caisse
  ====================================================== */
  async getTotalCaisse(date = null) {
    try {

      const response = await httpClient.get(
        "/caissier/caisses-journal-total-caisse",
        {
          params: buildParams(date),
        }
      );

      return safeNumber(response?.data);

    } catch (error) {

      console.error("❌ Erreur getTotalCaisse:", error);
      return 0;
    }
  },

  /* ======================================================
     🔵 TOTAL ENCAISSEMENT
     GET api/caissier/caisses-journal-total-encaissement
  ====================================================== */
  async getTotalEncaissement(date = null) {
    try {

      const response = await httpClient.get(
        "/caissier/caisses-journal-total-encaissement",
        {
          params: buildParams(date),
        }
      );

      return safeNumber(response?.data);

    } catch (error) {

      console.error("❌ Erreur getTotalEncaissement:", error);
      return 0;
    }
  },

  /* ======================================================
     🔵 TOTAL DÉCAISSEMENT
     GET api/caissier/caisses-journal-total_decaissement
  ====================================================== */
  async getTotalDecaissement(date = null) {
    try {

      const response = await httpClient.get(
        "/caissier/caisses-journal-total_decaissement",
        {
          params: buildParams(date),
        }
      );

      return safeNumber(response?.data);

    } catch (error) {

      console.error("❌ Erreur getTotalDecaissement:", error);
      return 0;
    }
  },

  /* ======================================================
     🔵 CHARGEMENT GLOBAL OPTIMISÉ
     (Charge les 3 totaux en parallèle)
  ====================================================== */
  async getJournalComplet(date = null) {

    try {

      const [
        totalCaisse,
        totalEncaissement,
        totalDecaissement
      ] = await Promise.all([
        this.getTotalCaisse(date),
        this.getTotalEncaissement(date),
        this.getTotalDecaissement(date),
      ]);

      return {
        totalCaisse,
        totalEncaissement,
        totalDecaissement,
      };

    } catch (error) {

      console.error("❌ Erreur getJournalComplet:", error);

      return {
        totalCaisse: 0,
        totalEncaissement: 0,
        totalDecaissement: 0,
      };
    }
  },

};

export default journalCaisseAPI;

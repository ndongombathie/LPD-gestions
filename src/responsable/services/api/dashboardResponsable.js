/**
 * 📊 Dashboard Responsable API
 * Version ÉQUIPE + ALERTES STOCK (aligné boutique) + FINANCE (aligné caisse)
 */

import httpClient from '../http/client';
import {
  getNombreProduitsTotal,
  getProduitsSousSeuil,
  getProduitsRupture
} from '@/services/api/gestionnaireBoutique';

import caissierApi from '../../../caissier/services/caissierApi';

const ENDPOINTS = {
  VENDEURS_COUNT: '/vendeurs-count',
  CAISSIERS_COUNT: '/caissiers-count',
  GESTIONNAIRES_COUNT: '/gestionnaires-count',
};

export const dashboardResponsableAPI = {
  async getDashboardData() {
    try {

      const [
        vendeursRes,
        caissiersRes,
        gestionnairesRes,

        // 📦 Stock boutique
        totalProduitsRes,
        produitsSousSeuilRes,
        produitsRuptureRes,

        // 💰 Finance caisse (nouveaux endpoints)
        totalEncaissementRes,
        totalDecaissementRes,

      ] = await Promise.all([

        // 👥 Utilisateurs
        httpClient.get(ENDPOINTS.VENDEURS_COUNT),
        httpClient.get(ENDPOINTS.CAISSIERS_COUNT),
        httpClient.get(ENDPOINTS.GESTIONNAIRES_COUNT),

        // 📦 Stock
        getNombreProduitsTotal(),
        getProduitsSousSeuil(),
        getProduitsRupture(),

        // 💰 Finance alignée Caisse
        httpClient.get('/caissier/caisses-journal-total-encaissement'),
        httpClient.get('/caissier/caisses-journal-total-decaissement'),
      ]);

      /* ============================
         👥 UTILISATEURS
      ============================ */

      const utilisateurs = {
        vendeurs: Number(vendeursRes.data?.vendeurs_count ?? 0),
        caissiers: Number(caissiersRes.data?.caissiers_count ?? 0),
        gestionnaires: Number(gestionnairesRes.data?.gestionnaires_count ?? 0),
      };

      /* ============================
         📦 ALERTES STOCK
      ============================ */

      const rupture = produitsRuptureRes?.data?.length || 0;
      const sousSeuil = produitsSousSeuilRes?.data?.length || 0;

      const totalProduits =
        typeof totalProduitsRes === "number"
          ? totalProduitsRes
          : Number(totalProduitsRes?.total ?? 0);

      const normal = Math.max(0, totalProduits - rupture - sousSeuil);

      const alertesStock = {
        rupture,
        sousSeuil,
        normal,
        totalProduits,
      };

      /* ============================
         💰 FINANCE (MIROIR CAISSE)
      ============================ */

      const totalEncaissement = Number(
        totalEncaissementRes.data?.total_encaissement ??
        totalEncaissementRes.data ??
        0
      );

      const totalDecaissement = Number(
        totalDecaissementRes.data?.total_decaissement ??
        totalDecaissementRes.data ??
        0
      );

      const finance = {
        totalEncaissement,
        totalDecaissement,
        totalFacture: totalEncaissement, // si tu veux garder la carte facturé
      };

      return {
        utilisateurs,
        alertesStock,
        finance,
      };

    } catch (error) {
      console.error(
        '❌ Erreur getDashboardData:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default dashboardResponsableAPI;
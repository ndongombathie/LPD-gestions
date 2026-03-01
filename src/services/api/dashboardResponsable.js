/**
 * 📊 Dashboard Responsable API
 * Version ÉQUIPE + ALERTES STOCK + FINANCE
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  VENDEURS_COUNT: '/vendeurs-count',
  CAISSIERS_COUNT: '/caissiers-count',
  GESTIONNAIRES_COUNT: '/gestionnaires-count',

  // ➕ Alertes Stock
  PRODUITS_RUPTURE: '/nombre-produits-en-rupture',
  PRODUITS_SOUS_SEUIL: '/nombre-produits-sous-seuil',
  PRODUITS_NORMAUX: '/nombre-produits-en-normaux',

  // ➕ Finance
  MONTANT_TOTAL_COMMANDES: '/montant-total-commandes',
  SOMME_PAIEMENTS_TOTAL: '/somme-paiements-total',
  RESTE_TOTAL_ENCAISSER: '/reste-total-encaisser',
};

export const dashboardResponsableAPI = {
  getDashboardData: async () => {
    try {

      const [
        vendeursRes,
        caissiersRes,
        gestionnairesRes,

        // Stock
        ruptureRes,
        sousSeuilRes,
        normauxRes,

        // Finance
        montantTotalRes,
        sommePaiementsRes,
        resteEncaisserRes,

      ] = await Promise.all([
        httpClient.get(ENDPOINTS.VENDEURS_COUNT),
        httpClient.get(ENDPOINTS.CAISSIERS_COUNT),
        httpClient.get(ENDPOINTS.GESTIONNAIRES_COUNT),

        httpClient.get(ENDPOINTS.PRODUITS_RUPTURE),
        httpClient.get(ENDPOINTS.PRODUITS_SOUS_SEUIL),
        httpClient.get(ENDPOINTS.PRODUITS_NORMAUX),

        httpClient.get(ENDPOINTS.MONTANT_TOTAL_COMMANDES),
        httpClient.get(ENDPOINTS.SOMME_PAIEMENTS_TOTAL),
        httpClient.get(ENDPOINTS.RESTE_TOTAL_ENCAISSER),
      ]);

      // 👥 UTILISATEURS
      const utilisateurs = {
        vendeurs: Number(vendeursRes.data?.vendeurs_count ?? 0),
        caissiers: Number(caissiersRes.data?.caissiers_count ?? 0),
        gestionnaires: Number(gestionnairesRes.data?.gestionnaires_count ?? 0),
      };

      // 📦 ALERTES STOCK
      const rupture = Number(ruptureRes.data ?? 0);
      const sousSeuil = Number(sousSeuilRes.data ?? 0);
      const normal = Number(normauxRes.data ?? 0);

      const alertesStock = {
        rupture,
        sousSeuil,
        normal,
        totalProduits: rupture + sousSeuil + normal,
      };

      // 💰 FINANCE
      const finance = {
        totalFacture: Number(montantTotalRes.data ?? 0),
        totalEncaissement: Number(sommePaiementsRes.data ?? 0),
        resteAEncaisser: Number(resteEncaisserRes.data ?? 0),
      };

      return {
        utilisateurs,
        finance,
        alertesStock,
      };

    } catch (error) {
      console.error('❌ Erreur getDashboardData:', error.response?.data || error.message);
      throw error;
    }
  },
};
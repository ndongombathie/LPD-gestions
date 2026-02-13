/**
 * ==========================================================
 * 📊 Dashboard Responsable API
 * ==========================================================
 *
 * Centralise toutes les données nécessaires au dashboard
 * responsable.
 *
 * Ce fichier agit comme un agrégateur :
 * - appelle les autres APIs
 * - regroupe les données métier
 * - retourne un objet unique exploitable par Dashboard.jsx
 *
 * ⚠️ Aucune logique UI ici.
 * Le frontend décide quoi afficher.
 */

import { clientsAPI } from "./clients";
import { commandesAPI } from "./commandes";
import { paiementsAPI } from "./paiements";
import { produitsAPI } from "./produits";
import { fournisseursAPI } from "./fournisseurs";
import { utilisateursAPI } from "./utilisateurs";
import { decaissementsAPI } from "./decaissements";
import rapportsAPI from "./rapports";


// ======================================================
// 🧠 HELPERS INTERNES
// ======================================================

const sum = (arr, key) =>
  arr.reduce((acc, item) => acc + Number(item?.[key] || 0), 0);

const todayString = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};


// ======================================================
// 📊 DASHBOARD RESPONSABLE API
// ======================================================

export const dashboardResponsableAPI = {

  /**
   * ==================================================
   * 🔥 MÉTHODE PRINCIPALE
   * ==================================================
   */
  getDashboardData: async () => {
    try {

      // ==================================================
      // ⚡ Chargement parallèle (rapide)
      // ==================================================
      const [
        clients,
        commandes,
        produits,
        fournisseurs,
        utilisateurs,
        decaissements,
        logsClients,
        logsFournisseurs
      ] = await Promise.all([
        clientsAPI.getSpecial(),
        commandesAPI.getAll(),
        produitsAPI.getAll(),
        fournisseursAPI.getAll(),
        utilisateursAPI.getAll(),
        decaissementsAPI.getAll(),
        rapportsAPI.getLogsClients(),
        rapportsAPI.getLogsFournisseurs()
      ]);

      // ==================================================
      // 🟣 VENTES & FINANCE
      // ==================================================

      const totalCommandes = commandes.length;

      const chiffreAffaireTotal = sum(commandes, "total");

      const commandesAujourdhui = commandes.filter(c =>
        c.date?.startsWith(todayString())
      );

      const caJour = sum(commandesAujourdhui, "total");

      const commandesParStatut = commandes.reduce((acc, c) => {
        acc[c.statut] = (acc[c.statut] || 0) + 1;
        return acc;
      }, {});

      // ==================================================
      // 🔵 CLIENTS SPÉCIAUX
      // ==================================================

      const clientsActifs = clients.length;

      const topClients = clients
        .map(client => {
          const commandesClient = commandes.filter(
            c => c.client_id === client.id
          );

          const totalClient = sum(commandesClient, "total");

          return {
            id: client.id,
            nom: client.nom,
            dette: totalClient,
            transactions: commandesClient.length
          };
        })
        .sort((a, b) => b.dette - a.dette)
        .slice(0, 5);

      // ==================================================
      // 🟢 PRODUITS
      // ==================================================

      const stockData = produits
        .slice(0, 5)
        .map(p => ({
          name: p.nom,
          value: Number(p.stock_global || 0)
        }));

      // ==================================================
      // 🟠 FOURNISSEURS
      // ==================================================

      const fournisseursStats = {
        total: fournisseurs.length,
        derniers: fournisseurs.slice(0, 5)
      };

      // ==================================================
      // 🔴 DÉCAISSEMENTS
      // ==================================================

      const totalDecaissements = sum(decaissements, "montant");

      // ==================================================
      // ⚫ UTILISATEURS
      // ==================================================

      const utilisateursStats = {
        total: utilisateurs.length,
        vendeurs: utilisateurs.filter(u => u.role === "vendeur").length,
        caissiers: utilisateurs.filter(u => u.role === "caissier").length,
      };

      // ==================================================
      // 🟡 ACTIVITÉS
      // ==================================================

      const activites = [
        ...(logsClients?.data || []),
        ...(logsFournisseurs?.data || [])
      ]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      // ==================================================
      // ✅ OBJET FINAL
      // ==================================================

      return {
        ventes: {
          totalCommandes,
          chiffreAffaireTotal,
          caJour,
          commandesParStatut
        },

        clients: {
          total: clientsActifs,
          topClients
        },

        produits: {
          stockData
        },

        fournisseurs: fournisseursStats,

        decaissements: {
          total: totalDecaissements
        },

        utilisateurs: utilisateursStats,

        activites
      };

    } catch (error) {
      console.error("❌ Erreur dashboardResponsable:", error);
      throw error;
    }
  }

};

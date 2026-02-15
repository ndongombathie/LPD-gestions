/**
 * ==========================================================
 * 📊 Dashboard Responsable API
 * ==========================================================
 */

import { clientsAPI } from "./clients";
import { commandesAPI } from "./commandes";
import { produitsAPI } from "./produits";
import { fournisseursAPI } from "./fournisseurs";
import { utilisateursAPI } from "./utilisateurs";
import { decaissementsAPI } from "./decaissements";
import rapportsAPI from "./rapports";

// ======================================================
// 🧠 HELPERS INTERNES
// ======================================================

// ✅ garantit toujours un tableau
const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
};

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

  getDashboardData: async () => {

    try {

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

      // ✅ NORMALISATION UNIQUE
      const clientsList = toArray(clients);
      const commandesList = toArray(commandes);
      const produitsList = toArray(produits);
      const fournisseursList = toArray(fournisseurs);
      const utilisateursList = toArray(utilisateurs);
      const decaissementsList = toArray(decaissements);

      // ==================================================
      // 🟣 VENTES
      // ==================================================

      const totalCommandes = commandesList.length;

      const chiffreAffaireTotal = sum(commandesList, "total");

      const commandesAujourdhui = commandesList.filter(c =>
        c.date?.startsWith(todayString())
      );

      const caJour = sum(commandesAujourdhui, "total");

      const commandesParStatut = commandesList.reduce((acc, c) => {
        acc[c.statut] = (acc[c.statut] || 0) + 1;
        return acc;
      }, {});

      // ==================================================
      // 🔵 CLIENTS
      // ==================================================

      const clientsActifs = clientsList.length;

      const topClients = clientsList
        .map(client => {
          const commandesClient = commandesList.filter(
            c => c.client_id === client.id
          );

          return {
            id: client.id,
            nom: client.nom,
            dette: sum(commandesClient, "total"),
            transactions: commandesClient.length
          };
        })
        .sort((a, b) => b.dette - a.dette)
        .slice(0, 5);

      // ==================================================
      // 🟢 PRODUITS
      // ==================================================

      const stockData = produitsList.map(p => ({
        id: p.id,
        nom: p.nom,
        stock: Number(p.stock_global || 0),
        seuil: Number(p.seuil || 5),
        quantiteVendue: Number(p.quantite_vendue || 0),
        chiffreAffaires: Number(p.ca_total || 0)
      }));

      // ==================================================
      // 🟠 FOURNISSEURS
      // ==================================================

      const fournisseursStats = {
        total: fournisseursList.length,
        derniers: fournisseursList.slice(0, 5)
      };

      // ==================================================
      // 🔴 DÉCAISSEMENTS
      // ==================================================

      const totalDecaissements = sum(decaissementsList, "montant");

      // ==================================================
      // ⚫ UTILISATEURS
      // ==================================================

      const utilisateursStats = {
        total: utilisateursList.length,
        vendeurs: utilisateursList.filter(u => u.role === "vendeur").length,
        caissiers: utilisateursList.filter(u => u.role === "caissier").length,
        gestionnaires: utilisateursList.filter(u => u.role === "gestionnaire_boutique").length,
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
      // ✅ RETURN FINAL
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

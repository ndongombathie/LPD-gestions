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
        clientsAPI.getAll(),        commandesAPI.getAll({
          withStats: true
        }),

        produitsAPI.getAll(),
        fournisseursAPI.getAll(),
        utilisateursAPI.getAll({ per_page: 1000 }),        decaissementsAPI.getAll(),
        rapportsAPI.getLogsClients(),
        rapportsAPI.getLogsFournisseurs()
      ]);

      // ✅ NORMALISATION SAFE DES STATS (IMPORTANT)
      const stats =
        commandes?.stats ??
        commandes?.data?.stats ??
        {};

      // ✅ NORMALISATION UNIQUE
      const clientsList = toArray(clients);
      const commandesList = toArray(commandes?.data ?? commandes);
      const produitsList = toArray(produits);

      const produitsMap = Object.fromEntries(
        produitsList.map(p => [p.id, p])
      );

      const fournisseursList = toArray(fournisseurs);
      const utilisateursList = toArray(utilisateurs);
      const decaissementsList = toArray(decaissements);

      // ==================================================
      // 🟣 VENTES
      // ==================================================

      const totalCommandes = Number(stats.nb ?? 0);      const chiffreAffaireTotal = sum(commandesList, "totalTTC");
      const commandesAujourdhui = commandesList.filter(c =>
        (c.dateCommande || c.date || c.created_at || "")
            .startsWith(todayString())
        );


      const caJour = sum(commandesAujourdhui, "totalTTC");


      // ==================================================
      // 🔵 CLIENTS
      // ==================================================

      const clientsActifs = Number(clients?.total ?? clientsList.length);
      const topClients = clientsList
        .map(client => {
          const commandesClient = commandesList.filter(
            c => c.clientId === client.id          );

          return {
            id: client.id,
            nom: client.nom,
            dette: sum(commandesClient, "totalTTC"),
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
        categorie: p.categorie?.nom || null,
        stock: Number(p.stock_global || 0),
        seuil: Number(p.stock_seuil || 0),      }));

      // ==================================================
      // 🟠 FOURNISSEURS
      // ==================================================

      const fournisseursStats = {
        total: Number(fournisseurs?.total ?? fournisseursList.length),
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

        vendeurs: utilisateursList.filter(
          u => u.role?.trim().toLowerCase() === "vendeur"
        ).length,

        caissiers: utilisateursList.filter(
          u => u.role?.trim().toLowerCase() === "caissier"
        ).length,

        gestionnaires: utilisateursList.filter(
          u => u.role?.trim().toLowerCase() === "gestionnaire_boutique"
        ).length,
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

            commandesParStatut:
            stats.commandesParStatut ?? {},
          totalTTC: Number(stats.totalTTC ?? 0),
          totalPaye: Number(stats.totalPaye ?? 0),
          detteTotale: Number(stats.dette ?? 0),    
          
        },

        clients: {
          total: clientsActifs,
          topClients
        },

        produits: {
          stockData,

          topBestSellers: (stats.topProduits ?? []).map(p => {
            const produit = produitsMap[p.produit_id];

            return {
              id: p.produit_id,
              nom: produit?.nom ?? "Produit",
              quantiteVendue: Number(p.total_vendu || 0),
              stock: Number(produit?.stock_global || 0),
              seuil: Number(produit?.seuil || 5),
              categorie: produit?.categorie?.nom || null
            };
          }),


          topLeastSold: (stats.produitsMoinsVendus ?? []).map(p => {
            const produit = produitsMap[p.produit_id];

            return {
              id: p.produit_id,
              nom: produit?.nom ?? "Produit",
              quantiteVendue: Number(p.total_vendu || 0),
              stock: Number(produit?.stock_global || 0),
              seuil: Number(produit?.seuil || 5),
              categorie: produit?.categorie?.nom || null
            };
          }),

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
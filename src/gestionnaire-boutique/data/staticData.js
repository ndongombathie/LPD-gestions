export const user = {
  firstName: "Fatou",
  lastName: "Sall",
  role: "manager_boutique",
};

export const stats = {
  ventesDuJour: 0,
  ventesTotales: 415000,
  produits: 6,
  clients: 3,
  produitsEnRupture: 2,
  produitsEnStock: 4,
  transfertsEnCours: 1,
  nbrProduits: 6,
};

export const recentActivities = [
  { type: "success", text: "Nouvelle vente complétée", time: "Il y a 5 minutes" },
  { type: "info", text: "Transfert de stock en cours", time: "Il y a 1 heure" },
  { type: "warning", text: "Stock faible détecté", time: "Il y a 2 heures" },
];

export const alerts = [
  { type: "info", text: "Système fonctionnel", subtext: "Tous les services sont opérationnels" },
];

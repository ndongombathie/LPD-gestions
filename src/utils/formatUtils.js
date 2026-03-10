// src/responsable/utils/formatUtils.js

// 🔢 Format Montants FCFA
export const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n ?? 0));

// 🎨 Couleurs pour les statuts de commandes
export const getCommandeStatusClasses = (statut) => {
  if (!statut) return "bg-gray-100 text-gray-600";

  const s = String(statut).toLowerCase();

  if (s === "annulee") return "bg-red-50 text-red-700";
  if (s === "en_attente_caisse" || s === "partiellement_payee")
    return "bg-amber-50 text-amber-700";
  if (s === "soldee")
    return "bg-emerald-50 text-emerald-700";

  return "bg-gray-100 text-gray-600";
};

// 🧠 Statut "effectif" d'un paiement
export const getPaiementEffectiveStatus = (paiement) =>
  String(paiement?.statut_paiement || "inconnu").toLowerCase();

// 🎨 Couleurs pour les statuts de paiements / tranches
export const getPaiementStatusClasses = (statut) => {
  if (!statut || statut === "inconnu") return "bg-gray-100 text-gray-600";

  const s = String(statut).toLowerCase();

  if (s === "en_attente_caisse") return "bg-amber-50 text-amber-700";
  if (s === "annulee") return "bg-red-50 text-red-700";
  if (s === "payee") return "bg-emerald-50 text-emerald-700";

  return "bg-gray-100 text-gray-600";
};
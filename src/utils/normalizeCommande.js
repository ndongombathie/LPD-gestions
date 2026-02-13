// ==========================================================
// normalizeCommande.js
// Normalisation SAFE d'une commande backend (Laravel)
// Laravel = source de vérité
// ==========================================================

export function normalizeCommande(cmd) {
  if (!cmd) return null;

  // ===============================
  // 🧾 CLIENT
  // ===============================
  const client =
    cmd.client ||
    cmd.client_special ||
    cmd.clientSpecial ||
    {};

  const clientNom = (
    cmd.client_nom ||
    cmd.nom_client ||
    client.nom ||
    client.raison_sociale ||
    ""
  ).trim();

  const rawClientId =
    cmd.clientId ??
    cmd.client_id ??
    cmd.client?.id ??
    null;

  // ✅ CORRECTION : on force toujours un string
  const clientId = rawClientId ? String(rawClientId) : null;

  // ===============================
  // 📦 LIGNES (PAS DE RECALCUL)
  // ===============================
  const lignesSource =
    cmd.details ||
    cmd.items ||
    cmd.lignes ||
    cmd.ligne_commandes ||
    [];

  const lignes = (lignesSource || []).map((l) => ({
    id: l.id,
    produitId: l.produit_id || l.produitId || null,
    libelle:
      l.libelle ||
      l.nom_produit ||
      l.designation ||
      l.produit?.nom ||
      "",
    ref: l.ref || l.code_produit || l.reference || null,
    qte: Number(l.quantite || l.qte || 0),
    prixUnitaire: Number(l.prix_unitaire || l.prix || 0),
    totalHT: Number(l.total_ht ?? l.totalHT ?? 0),
    totalTTC: Number(l.total_ttc ?? l.totalTTC ?? l.total ?? 0),
    modeVente: l.mode_vente || l.modeVente || "detail",
    quantiteUnites:
      Number(l.quantite_unites) ||
      Number(l.quantite || l.qte || 0),
  }));

  // ===============================
  // 💰 TOTAUX (BACKEND UNIQUEMENT)
  // ===============================
  const totalHT = Number(
    cmd.total_ht ?? cmd.totalHT ?? cmd.montant_ht ?? 0
  );

  const totalTTC = Number(
    cmd.total_ttc ?? cmd.totalTTC ?? cmd.montant_total ?? cmd.total ?? 0
  );

  const totalTVA = Number(
    cmd.total_tva ?? cmd.totalTVA ?? 0
  );

  // ===============================
  // 💳 PAIEMENTS
  // ===============================
  const paiements = (cmd.paiements || []).map((p) => ({
    id: p.id,
    date_paiement: p.date_paiement || p.date || null,
    montant: Number(p.montant || 0),
    mode_paiement: p.mode_paiement || p.mode || "",
    commentaire: p.commentaire || "",
    statut_paiement: p.statut_paiement || p.statut || "inconnu",
    type_paiement: p.type_paiement ?? null,  }));

  // ===============================
  // 💰 FINANCIER (BACKEND)
  // ===============================
  const montantPaye = Number(
    cmd.montant_paye ?? cmd.montantPaye ?? 0
  );

  const resteAPayer = Number(
    cmd.reste_a_payer ?? cmd.resteAPayer ?? 0
  );

  // ===============================
  // 🧠 STATUT
  // ===============================
  const statut = cmd.statut;

  const statutLabel = {
    en_attente_caisse: "En attente caisse",
    partiellement_payee: "Partiellement payée",
    soldee: "Soldée",
    annulee: "Annulée",
  }[statut] || statut;

  // ===============================
  // 🧾 DATE
  // ===============================
const dateCommande =
  cmd.dateCommande ||
  cmd.date_commande ||
  cmd.date ||
  (cmd.created_at
    ? String(cmd.created_at).slice(0, 10)
    : null);


  // ===============================
  // 📦 RETOUR FINAL
  // ===============================
  return {
    id: cmd.id,
    numero: cmd.numero || cmd.reference || `CMD-${cmd.id}`,
    clientId,
    clientNom,
    dateCommande,
    lignes,
    totalHT,
    totalTVA,
    totalTTC,
    paiements,
    montantPaye,
    resteAPayer,
    statut,
    statutLabel,
  };
}

// ==========================================================
// normalizeCommande.js
// Normalisation SAFE d'une commande backend (Laravel)
// - Laravel = source de vérité
// - React n'invente JAMAIS le statut
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

  const clientId = cmd.client_id || client.id || null;

  // ===============================
  // 📦 LIGNES
  // ===============================
  const lignesSource =
    cmd.details ||
    cmd.items ||
    cmd.lignes ||
    cmd.ligne_commandes ||
    [];

  const lignes = (lignesSource || []).map((l) => {
    const qte = Number(l.quantite || l.qte || 0);
    const pu = Number(l.prix_unitaire || l.prix || 0);
    const modeVente = l.mode_vente || l.modeVente || "detail";

    const totalHT =
      Number(l.total_ht || l.totalHT) ||
      (qte && pu ? qte * pu : 0);

    const totalTTC =
      Number(l.total_ttc || l.totalTTC || l.total) ||
      totalHT * 1.18;

    const unitesParCarton = Number(l.unites_par_carton || 1);

    const quantiteUnites =
      Number(l.quantite_unites) ||
      (modeVente === "gros" ? qte * unitesParCarton : qte);

    return {
      id: l.id,
      produitId: l.produit_id || l.produitId || null,
      libelle:
        l.libelle ||
        l.nom_produit ||
        l.designation ||
        l.produit?.nom ||
        "",
      ref: l.ref || l.code_produit || l.reference || null,
      qte,
      prixUnitaire: pu,
      totalHT,
      totalTTC,
      modeVente,
      quantiteUnites,
    };
  });

  // ===============================
  // 💰 TOTAUX (backend prioritaire)
  // ===============================
  let totalHT = Number(cmd.total_ht ?? cmd.totalHT ?? cmd.montant_ht ?? 0);
  let totalTTC = Number(cmd.total_ttc ?? cmd.totalTTC ?? cmd.montant_total ?? cmd.total ?? 0);

  if ((!totalHT || isNaN(totalHT)) && lignes.length) {
    totalHT = lignes.reduce((s, l) => s + (l.totalHT || 0), 0);
  }

  if ((!totalTTC || isNaN(totalTTC)) && lignes.length) {
    totalTTC = lignes.reduce((s, l) => s + (l.totalTTC || 0), 0);
  }

  let totalTVA = Number(cmd.total_tva ?? cmd.totalTVA ?? (totalTTC - totalHT));
  if (isNaN(totalTVA)) totalTVA = totalTTC - totalHT;

  // ===============================
  // 💳 PAIEMENTS
  // ===============================
  const paiements = (cmd.paiements || []).map((p) => ({
    id: p.id,
    date_paiement: p.date_paiement || p.date || null,
    montant: Number(p.montant || 0),
    mode_paiement: p.mode_paiement || p.mode || "",
    commentaire: p.commentaire || "",
    statut_paiement: p.statut_paiement || p.statut || "payee",
    type_paiement: p.type_paiement || "paiement",
  }));


  const montantPaye = Number(cmd.montant_paye ?? cmd.montantPaye ?? 0);

  const resteAPayer =
    Number(cmd.reste_a_payer ?? cmd.resteAPayer ?? Math.max(totalTTC - montantPaye, 0));


  // ===============================
  // 🧠 STATUT — ON FAIT CONFIANCE À LARAVEL
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
    cmd.date_commande ||
    cmd.date ||
    (cmd.created_at ? String(cmd.created_at).slice(0, 10) : null);

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

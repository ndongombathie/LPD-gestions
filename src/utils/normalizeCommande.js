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

  const clientPrenom =
    cmd.client_prenom ||
    client.prenom ||
    "";

  const clientNomSeul =
    cmd.client_nom ||
    cmd.nom_client ||
    client.nom ||
    "";

  const clientEntreprise =
    client.raison_sociale ||
    client.entreprise ||
    cmd.client_entreprise ||
    "";

  const clientContact =
    client.contact ||
    client.telephone ||
    cmd.client_contact ||
    "";

  const rawClientId =
    cmd.clientId ??
    cmd.client_id ??
    client.id ??
    null;

  const clientId = rawClientId ? String(rawClientId) : null;

  // Nom complet fallback (compatibilité ancienne logique)
  const clientNom = `${clientPrenom} ${clientNomSeul}`.trim();

  // ===============================
  // 📦 LIGNES (PAS DE RECALCUL)
  // ===============================
  const lignesSource =
    cmd.details ||
    cmd.detail_commandes ||
    cmd.items ||
    cmd.lignes ||
    cmd.ligne_commandes ||
    [];

  const lignes = (lignesSource || []).map((l) => {
    const qte = Number(l.quantite || l.qte || 0);
    const pu = Number(l.prix_unitaire || l.prix || 0);

    return {
      id: l.id,
      produitId: l.produit_id || l.produitId || null,
      libelle:
        l.libelle ||
        l.nom_produit ||
        l.designation ||
        l.produit?.nom_produit ||
        l.produit?.nom ||
        "",
      ref:
        l.ref ||
        l.code_produit ||
        l.reference ||
        l.produit?.code_produit ||
        null,
      qte,
      prixUnitaire: pu,
      produitNom:
        l.libelle ||
        l.nom_produit ||
        l.produit?.nom_produit ||
        l.produit?.nom ||
        "",

      totalHT: Number(
        l.total_ht ??
        l.totalHT ??
        qte * pu
      ),
      totalTTC: Number(
        l.total_ttc ??
        l.totalTTC ??
        l.total ??
        qte * pu
      ),

      modeVente: l.mode_vente || l.modeVente || "detail",
      quantiteUnites:
        Number(l.quantite_unites) || qte,
    };
  });

  // ===============================
  // 💰 TOTAUX (BACKEND UNIQUEMENT)
  // ===============================
  const totalHT =
    cmd.total_ht !== undefined
      ? Number(cmd.total_ht)
      : cmd.totalHT !== undefined
      ? Number(cmd.totalHT)
      : lignes.reduce((sum, l) => sum + Number(l.totalHT || 0), 0);

  const totalTTC = Number(
    cmd.total_ttc ?? cmd.totalTTC ?? cmd.montant_total ?? cmd.total ?? 0
  );

  const totalTVA =
    cmd.total_tva !== undefined
      ? Number(cmd.total_tva)
      : cmd.totalTVA !== undefined
      ? Number(cmd.totalTVA)
      : Math.max(totalTTC - totalHT, 0);

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
    type_paiement: p.type_paiement ?? null,
  }));

  // ===============================
  // 💰 FINANCIER (BACKEND)
  // ===============================

  const montantPaye =
    cmd.montant_paye !== undefined
      ? Number(cmd.montant_paye)
      : Array.isArray(cmd.paiements)
      ? cmd.paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0)
      : 0;

  const resteAPayer =
    cmd.reste_a_payer !== undefined
      ? Number(cmd.reste_a_payer)
      : cmd.resteAPayer !== undefined
      ? Number(cmd.resteAPayer)
      : cmd.dette !== undefined
      ? Number(cmd.dette)
      : Math.max(totalTTC - montantPaye, 0);

  // ===============================
  // 🧠 STATUT
  // ===============================
  const statut =
    cmd.statut ||
    cmd.statut_commande ||
    "attente";

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
    cmd.created_at?.slice(0, 10) ||
    null;

  // ===============================
  // 📦 RETOUR FINAL
  // ===============================
  return {
    id: cmd.id,
    numero:
      cmd.numero ||
      cmd.numero_commande ||
      cmd.reference ||
      cmd.code ||
      null,
    clientId,
    clientNom,
    clientPrenom,
    clientNomSeul,
    clientContact,
    clientEntreprise,
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
    montantAEncaisser:
      cmd.montant_a_encaisser !== undefined
        ? Number(cmd.montant_a_encaisser)
        : null,
  };
}
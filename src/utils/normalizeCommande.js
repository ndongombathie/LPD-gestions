// src/utils/normalizeCommande.js

export function normalizeCommande(cmd) {
  const client =
    cmd.client ||
    cmd.client_special ||
    cmd.clientSpecial ||
    cmd.client_speciale ||
    cmd.client_speciale_detail ||
    {};

  let clientNom =
    cmd.client_nom ||
    cmd.nom_client ||
    cmd.nom_client_special ||
    cmd.client_name ||
    cmd.customer_name ||
    client.nom ||
    client.nom_client ||
    client.nom_client_special ||
    client.raison_sociale ||
    client.raisonSociale ||
    client.name ||
    client.libelle ||
    client.intitule ||
    "";

  if (!clientNom && client && typeof client === "object") {
    const firstStringValue = Object.values(client).find(
      (v) => typeof v === "string" && v.trim() !== ""
    );
    if (firstStringValue) clientNom = firstStringValue;
  }

  const clientCode =
    cmd.client_code ||
    cmd.code_client ||
    client.code_client ||
    client.codeClient ||
    client.code ||
    cmd.code ||
    undefined;

  const lignesSource =
    cmd.lignes || cmd.ligne_commandes || cmd.details || cmd.items || [];

  const lignes = (lignesSource || []).map((l) => {
    const qte = Number(l.quantite || l.qte || l.qty || 0);
    const pu = Number(l.prix_unitaire || l.prix || l.price || 0);
    const modeVente = l.mode_vente || l.modeVente || l.mode || "detail";

    const totalHTLigne = Number(
      l.total_ht || l.totalHT || (qte && pu ? qte * pu : 0)
    );
    const totalTTCLigne = Number(
      l.total_ttc || l.totalTTC || l.total || totalHTLigne * 1.18 || 0
    );

    const quantiteUnites = Number(
      l.quantite_unites ||
        l.quantiteUnites ||
        (modeVente === "gros" ? qte * (l.unites_par_carton || 1) : qte)
    );

    return {
      id: l.id,
      produitId: l.produit_id || l.produitId || null,
      libelle: l.libelle || l.nom_produit || l.designation || l.nom || "",
      ref: l.ref || l.code_produit || l.reference || l.code || null,
      qte,
      prixUnitaire: pu,
      totalHT: totalHTLigne,
      totalTTC: totalTTCLigne,
      modeVente,
      quantiteUnites,
    };
  });

  let totalHT = Number(cmd.total_ht ?? cmd.totalHT ?? cmd.montant_ht ?? 0);
  let totalTTC = Number(
    cmd.total_ttc ?? cmd.totalTTC ?? cmd.montant_total ?? cmd.total ?? 0
  );

  if ((!totalHT || Number.isNaN(totalHT)) && lignes.length) {
    totalHT = lignes.reduce(
      (s, l) => s + (Number(l.totalHT) || l.qte * l.prixUnitaire || 0),
      0
    );
  }

  if ((!totalTTC || Number.isNaN(totalTTC)) && lignes.length) {
    totalTTC = lignes.reduce(
      (s, l) => s + (Number(l.totalTTC) || Number(l.totalHT) || 0),
      0
    );
  }

  let totalTVA = Number(
    cmd.total_tva ?? cmd.totalTVA ?? cmd.montant_tva ?? (totalTTC - totalHT)
  );
  if (Number.isNaN(totalTVA)) {
    totalTVA = totalTTC - totalHT;
  }

  const montantPaye = Number(
    cmd.montant_paye || cmd.montantPaye || cmd.total_paye || 0
  );
  const resteAPayer = Number(
    cmd.reste_a_payer ||
      cmd.resteAPayer ||
      cmd.montant_restant ||
      totalTTC - montantPaye
  );

  const statut = cmd.statut || "en_attente_caisse";
  const statutLabelMap = {
    en_attente_caisse: "En attente caisse",
    partiellement_payee: "Partiellement payée",
    soldee: "Soldée",
    annulee: "Annulée",
  };
  const statutLabel =
    cmd.statut_label || cmd.statutLabel || statutLabelMap[statut] || statut;

  const paiements = (cmd.paiements || []).map((p) => ({
    id: p.id,
    date: p.date_paiement || p.date || null,
    montant: Number(p.montant || p.montant_paye || 0),
    mode: p.mode_paiement || p.mode || "",
    commentaire: p.commentaire || "",
    statut:
      p.statut || p.status || p.statut_paiement || p.statutPaiement || null,
    type: p.type_paiement || p.type || p.typePaiement || null,
  }));

  return {
    id: cmd.id,
    numero: cmd.numero || cmd.reference || cmd.code || `CMD-${cmd.id}`,
    clientId: cmd.client_id || cmd.clientId || client.id || null,
    clientNom,
    clientCode,
    dateCommande:
      cmd.date_commande ||
      cmd.dateCommande ||
      (cmd.created_at ? String(cmd.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    lignes,
    totalHT,
    totalTVA,
    totalTTC,
    tauxTVA: totalHT ? totalTVA / totalHT : 0.18,
    paiements,
    montantPaye,
    resteAPayer,
    statut,
    statutLabel,
  };
}

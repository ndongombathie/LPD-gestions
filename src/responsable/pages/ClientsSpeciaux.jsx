// ==========================================================   
// 🧍‍♂️ ClientsSpeciaux.jsx — Interface Responsable (LPD Manager)
// Gestion des clients privilégiés (vente en gros + paiements par tranches)
// Version ULTRA PRO (agrégats + historique + nouvelle tranche + édition tranche)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ListChecks,
  BadgeDollarSign,
} from "lucide-react";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import VoirDetailClient from "../components/VoirDetailClient.jsx";
import { instance as axios } from "../../utils/axios.jsx";

const cls = (...a) => a.filter(Boolean).join(" ");
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);

// ==========================================================
// ✅ Toasts Premium
// ==========================================================
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[120] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cls(
              "min-w-[280px] max-w-[360px] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 backdrop-blur-sm",
              t.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
                : "bg-rose-50/95 border-rose-200 text-rose-800"
            )}
          >
            <div className="pt-0.5">
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.title}</div>
              {t.message && (
                <div className="text-xs mt-0.5 opacity-90">{t.message}</div>
              )}
            </div>
            <button
              className="opacity-60 hover:opacity-100"
              onClick={() => remove(t.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ==========================================================
// 🔧 Helper : normaliser une commande (même modèle que Commandes.jsx)
// ==========================================================
function normalizeCommande(cmd) {
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
      (cmd.created_at ? String(cmd.created_at).slice(0, 10) : todayISO()),
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

// ==========================================================
// 💸 Modal Nouvelle Tranche (côté Responsable)
//  ⚠️ Corrigée : Hooks toujours appelés, puis on retourne null si !open || !client
// ==========================================================
function NouvelleTrancheModal({
  open,
  onClose,
  client,
  commandes,
  onSubmit,
  toast,
}) {
  // ✅ Commandes éligibles = reste à payer > 0, non annulées, ET aucune tranche en attente caisse déjà enregistrée
  const commandesEligibles = useMemo(
    () =>
      (commandes || []).filter((c) => {
        if ((c.resteAPayer || 0) <= 0 || c.statut === "annulee") return false;
        const hasTrancheEnAttente = (c.paiements || []).some(
          (p) =>
            p.type === "tranche" &&
            p.statut === "en_attente_caisse" &&
            p.montant
        );
        return !hasTrancheEnAttente;
      }),
    [commandes]
  );

  const [commandeId, setCommandeId] = useState("");
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("especes");
  const [date, setDate] = useState(todayISO());
  const [commentaire, setCommentaire] = useState("");

  // 🔄 Réinitialisation propre à chaque ouverture
  useEffect(() => {
    if (!open) return;
    if (commandesEligibles.length > 0) {
      setCommandeId(String(commandesEligibles[0].id));
    } else {
      setCommandeId("");
    }
    setMontant("");
    setMode("especes");
    setDate(todayISO());
    setCommentaire("");
  }, [open, commandesEligibles]);

  const commandeSelectionnee =
    commandesEligibles.find((c) => String(c.id) === String(commandeId)) ||
    null;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commandeSelectionnee) {
      toast(
        "error",
        "Aucune commande",
        "Ce client n'a aucune commande éligible pour une nouvelle tranche."
      );
      return;
    }

    const m = Number(montant);

    if (!m || m <= 0) {
      toast(
        "error",
        "Montant invalide",
        "Veuillez saisir un montant de tranche valide."
      );
      return;
    }

    // 🔍 Calcul du reste théorique en tenant compte des tranches déjà en attente
    const totalTTCCommande = Number(commandeSelectionnee.totalTTC || 0);
    const montantDejaEncaisse = Number(commandeSelectionnee.montantPaye || 0);
    const totalTranchesEnAttente = (commandeSelectionnee.paiements || [])
      .filter(
        (p) =>
          p.type === "tranche" &&
          p.statut === "en_attente_caisse" &&
          p.montant
      )
      .reduce((s, p) => s + Number(p.montant || 0), 0);

    const resteTheorique = Math.max(
      totalTTCCommande - montantDejaEncaisse - totalTranchesEnAttente,
      0
    );

    if (resteTheorique <= 0) {
      toast(
        "error",
        "Aucun reste pour nouvelle tranche",
        "Le montant total de la commande est déjà couvert par les encaissements et tranches en attente."
      );
      return;
    }

    if (m > resteTheorique) {
      toast(
        "error",
        "Montant trop élevé",
        `La tranche ne peut pas dépasser le reste théorique disponible (${formatFCFA(
          resteTheorique
        )}) en tenant compte des autres tranches en attente.`
      );
      return;
    }

    onSubmit(commandeSelectionnee, {
      montant: m,
      mode,
      date,
      commentaire: commentaire?.trim() || "",
    });
  };

  if (!open || !client) return null;

  const baseInput =
    "w-full rounded-xl border px-3 py-2.5 text-sm bg-white shadow-sm border-gray-300 focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]";

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5" />
              Nouvelle tranche — {client.nom}
            </h2>
            <p className="text-xs text-gray-500">
              Préparation d&apos;un paiement partiel{" "}
              <span className="font-semibold">(validation en caisse)</span>.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Infos client */}
        <div className="mb-4 text-xs text-gray-600">
          <div className="font-semibold text-gray-700">{client.nom}</div>
          <div>{client.entreprise}</div>
          <div className="text-gray-500">
            {client.adresse} — {client.contact}
          </div>
        </div>

        {commandesEligibles.length === 0 ? (
          <div className="text-sm text-gray-500 mb-4">
            Ce client n&apos;a actuellement{" "}
            <span className="font-semibold">
              aucune commande éligible à une tranche
            </span>{" "}
            (soit aucune dette, soit une tranche est déjà en attente caisse).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Commande + reste */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Commande concernée
              </label>
              <select
                value={commandeId}
                onChange={(e) => setCommandeId(e.target.value)}
                className={baseInput}
              >
                {commandesEligibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} — Date : {c.dateCommande} — Reste théorique :{" "}
                    {formatFCFA(
                      Math.max(
                        (c.totalTTC || 0) -
                          (c.montantPaye || 0) -
                          (c.paiements || [])
                            .filter(
                              (p) =>
                                p.type === "tranche" &&
                                p.statut === "en_attente_caisse" &&
                                p.montant
                            )
                            .reduce(
                              (s, p) => s + Number(p.montant || 0),
                              0
                            ),
                        0
                      )
                    )}
                  </option>
                ))}
              </select>
              {commandeSelectionnee && (
                <div className="mt-1 text-[11px] text-gray-500">
                  Total TTC :{" "}
                  <span className="font-semibold">
                    {formatFCFA(commandeSelectionnee.totalTTC)}
                  </span>{" "}
                  — Payé (encaissé) :{" "}
                  <span className="font-semibold text-emerald-700">
                    {formatFCFA(commandeSelectionnee.montantPaye)}
                  </span>{" "}
                  — Reste théorique (avec tranches en attente) :{" "}
                  <span className="font-semibold text-rose-700">
                    {(() => {
                      const total = Number(
                        commandeSelectionnee.totalTTC || 0
                      );
                      const encaisse = Number(
                        commandeSelectionnee.montantPaye || 0
                      );
                      const tranchesAttente = (
                        commandeSelectionnee.paiements || []
                      )
                        .filter(
                          (p) =>
                            p.type === "tranche" &&
                            p.statut === "en_attente_caisse" &&
                            p.montant
                        )
                        .reduce(
                          (s, p) => s + Number(p.montant || 0),
                          0
                        );
                      return formatFCFA(
                        Math.max(total - encaisse - tranchesAttente, 0)
                      );
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Montant + date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Montant de la tranche
                </label>
                <input
                  type="number"
                  min="1"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className={baseInput}
                  placeholder="Ex : 30000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Date du paiement
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={baseInput}
                />
              </div>
            </div>

            {/* Mode + commentaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Mode de paiement
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className={baseInput}
                >
                  <option value="especes">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Commentaire (optionnel)
                </label>
                <input
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ex : 2ème tranche, client présent"
                  className={baseInput}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 shadow-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] hover:opacity-95 shadow-sm"
                disabled={!commandeSelectionnee}
              >
                Envoyer à la caisse
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ==========================================================
// ✏️ Modal Édition Tranche (en attente caisse)
// ==========================================================
function EditTrancheModal({
  open,
  onClose,
  client,
  commande,
  paiement,
  onSubmit,
  toast,
}) {
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("especes");
  const [date, setDate] = useState(todayISO());
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    if (open && paiement && commande) {
      setMontant(paiement.montant != null ? String(paiement.montant) : "");
      setMode(paiement.mode || "especes");
      setDate(paiement.date || todayISO());
      setCommentaire(paiement.commentaire || "");
    }
  }, [open, paiement, commande]);

  if (!open || !client || !commande || !paiement) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const m = Number(montant);

    if (!m || m <= 0) {
      toast(
        "error",
        "Montant invalide",
        "Veuillez saisir un montant de tranche valide."
      );
      return;
    }

    // 🔍 Calcul du plafond max pour CETTE tranche en tenant compte des autres tranches en attente
    const totalTTCCommande = Number(commande.totalTTC || 0);
    const montantDejaEncaisse = Number(commande.montantPaye || 0);

    const totalAutresTranchesEnAttente = (commande.paiements || [])
      .filter(
        (p) =>
          p.id !== paiement.id &&
          p.type === "tranche" &&
          p.statut === "en_attente_caisse" &&
          p.montant
      )
      .reduce((s, p) => s + Number(p.montant || 0), 0);

    const maxPourCetteTranche = Math.max(
      totalTTCCommande - montantDejaEncaisse - totalAutresTranchesEnAttente,
      0
    );

    if (maxPourCetteTranche <= 0) {
      toast(
        "error",
        "Impossible de modifier",
        "Le montant total de la commande est déjà couvert par les encaissements et les autres tranches en attente."
      );
      return;
    }

    if (m > maxPourCetteTranche) {
      toast(
        "error",
        "Montant trop élevé",
        `La tranche ne peut pas dépasser ${formatFCFA(
          maxPourCetteTranche
        )} en tenant compte des autres tranches en attente.`
      );
      return;
    }

    onSubmit(commande, paiement, {
      montant: m,
      mode,
      date,
      commentaire: commentaire?.trim() || "",
    });
  };

  const baseInput =
    "w-full rounded-xl border px-3 py-2.5 text-sm bg-white shadow-sm border-gray-300 focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]";

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5" />
              Modifier la tranche — {client.nom}
            </h2>
            <p className="text-xs text-gray-500">
              La tranche est <span className="font-semibold">en attente</span>{" "}
              de validation caisse. Vous pouvez corriger les informations avant
              encaissement.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Infos client + commande */}
        <div className="mb-4 text-xs text-gray-600 space-y-1">
          <div className="font-semibold text-gray-700">{client.nom}</div>
          <div>{client.entreprise}</div>
          <div className="text-gray-500">
            {client.adresse} — {client.contact}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Commande{" "}
            <span className="font-semibold">{commande.numero}</span> — Total
            TTC :{" "}
            <span className="font-semibold">
              {formatFCFA(commande.totalTTC)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Montant + date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Montant de la tranche
              </label>
              <input
                type="number"
                min="1"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className={baseInput}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Date du paiement
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={baseInput}
              />
            </div>
          </div>

          {/* Mode + commentaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Mode de paiement
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className={baseInput}
              >
                <option value="especes">Espèces</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Commentaire (optionnel)
              </label>
              <input
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className={baseInput}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 shadow-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] hover:opacity-95 shadow-sm"
            >
              Mettre à jour la tranche
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 🧾 Formulaire client spécial
// ==========================================================
function ClientForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial ?? { nom: "", contact: "", entreprise: "", adresse: "" }
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        nom: initial.nom || "",
        contact: initial.contact || "",
        entreprise: initial.entreprise || "",
        adresse: initial.adresse || "",
      });
    }
  }, [initial]);

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis.";
    if (!form.contact.match(/^[0-9]{9}$/))
      e.contact = "Le contact doit contenir exactement 9 chiffres.";
    if (!form.entreprise.trim()) e.entreprise = "L’entreprise est requise.";
    if (!form.adresse.trim()) e.adresse = "L’adresse est requise.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  const base = (err) =>
    `mt-1 w-full rounded-xl border px-3 py-2.5 text-sm bg-white shadow-sm focus:ring-2 transition ${
      err
        ? "border-rose-500 focus:ring-rose-200"
        : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nom complet */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom complet <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ex : DIOP Mamadou"
            className={base(errors.nom)}
            required
          />
          {errors.nom && (
            <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>
          )}
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.contact}
            onChange={(e) =>
              update("contact", e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            placeholder="Ex : 771234567"
            maxLength={9}
            className={base(errors.contact)}
            required
          />
          {errors.contact && (
            <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>
          )}
        </div>

        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Entreprise <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.entreprise}
            onChange={(e) => update("entreprise", e.target.value)}
            placeholder="Ex : Imprisol SARL"
            className={base(errors.entreprise)}
            required
          />
          {errors.entreprise && (
            <p className="text-xs text-rose-600 mt-1">{errors.entreprise}</p>
          )}
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Adresse <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex : Dakar Plateau"
            className={base(errors.adresse)}
            required
          />
          {errors.adresse && (
            <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>
          )}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 shadow-sm"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={cls(
            "px-4 py-2.5 rounded-lg text-sm text-white bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition",
            submitting && "opacity-70 cursor-not-allowed"
          )}
        >
          {submitting
            ? "Enregistrement..."
            : initial
            ? "Mettre à jour"
            : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// ==========================================================
// 📋 Page principale Clients Spéciaux
// ==========================================================
export default function ClientsSpeciaux() {
  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [historiqueClient, setHistoriqueClient] = useState(null);
  const [openHistorique, setOpenHistorique] = useState(false);
  const [trancheClient, setTrancheClient] = useState(null);
  const [openTranche, setOpenTranche] = useState(false);

  const [editTrancheData, setEditTrancheData] = useState(null);
  const [openEditTranche, setOpenEditTranche] = useState(false);

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // ======================================================
  // 🔗 Chargement des clients spéciaux + commandes
  // ======================================================
  const fetchData = async () => {
    try {
      setLoading(true);

      const [clientsRes, commandesRes] = await Promise.all([
        axios.get("/clients", { params: { type_client: "special" } }),
        axios.get("/commandes"),
      ]);

      const clientsPayload = Array.isArray(clientsRes.data?.data)
        ? clientsRes.data.data
        : clientsRes.data;

      const normalizedClients = (clientsPayload || []).map((c) => ({
        id: c.id,
        nom: c.nom || "",
        contact: c.contact || c.telephone || "",
        entreprise: c.entreprise || "",
        adresse: c.adresse || "",
      }));

      const commandesPayload = Array.isArray(commandesRes.data?.data)
        ? commandesRes.data.data
        : commandesRes.data;

      const allCommandes = (commandesPayload || []).map(normalizeCommande);

      const clientIds = new Set(normalizedClients.map((c) => c.id));
      const commandesClientsSpeciaux = allCommandes.filter((cmd) =>
        clientIds.has(cmd.clientId)
      );

      setClients(normalizedClients);
      setCommandes(commandesClientsSpeciaux);
    } catch (error) {
      console.error("Erreur chargement clients/commandes :", error);
      toast(
        "error",
        "Erreur de chargement",
        "Impossible de charger les clients spéciaux."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On ignore TOUTES les commandes annulées pour les agrégats
  const commandesActives = useMemo(
    () => commandes.filter((c) => c.statut !== "annulee"),
    [commandes]
  );

  // Agrégation : enrichir chaque client avec ses commandes actives + tranches en attente
  const clientsEnrichis = useMemo(() => {
    return clients.map((c) => {
      const cs = commandesActives.filter((cmd) => cmd.clientId === c.id);
      if (!cs.length) {
        return {
          ...c,
          nbCommandes: 0,
          totalTTC: 0,
          totalPaye: 0,
          detteTotale: 0,
          derniereActivite: null,
          nbTranchesEnAttente: 0,
          montantTranchesEnAttente: 0,
        };
      }

      const totalTTC = cs.reduce((s, x) => s + (x.totalTTC || 0), 0);
      const totalPaye = cs.reduce((s, x) => s + (x.montantPaye || 0), 0);
      const detteTotale = cs.reduce(
        (s, x) => s + Math.max(x.resteAPayer || 0, 0),
        0
      );

      const datesActivite = [
        ...cs.map((x) => x.dateCommande),
        ...cs.flatMap((x) => (x.paiements || []).map((p) => p.date)),
      ].filter(Boolean);
      const derniereActivite = datesActivite.length
        ? datesActivite.sort().slice(-1)[0]
        : null;

      const paiementsClient = cs.flatMap((cmd) => cmd.paiements || []);
      const tranchesEnAttente = paiementsClient.filter(
        (p) =>
          p.type === "tranche" &&
          p.statut === "en_attente_caisse" &&
          p.montant
      );
      const nbTranchesEnAttente = tranchesEnAttente.length;
      const montantTranchesEnAttente = tranchesEnAttente.reduce(
        (s, p) => s + Number(p.montant || 0),
        0
      );

      return {
        ...c,
        nbCommandes: cs.length,
        totalTTC,
        totalPaye,
        detteTotale,
        derniereActivite,
        nbTranchesEnAttente,
        montantTranchesEnAttente,
      };
    });
  }, [clients, commandesActives]);

  // Stats globales (basées sur clientsEnrichis donc SANS commandes annulées)
  const statsGlobales = useMemo(() => {
    const nbClients = clientsEnrichis.length;
    const totalTTC = clientsEnrichis.reduce((s, c) => s + c.totalTTC, 0);
    const totalPaye = clientsEnrichis.reduce((s, c) => s + c.totalPaye, 0);
    const detteTotale = clientsEnrichis.reduce(
      (s, c) => s + c.detteTotale,
      0
    );
    return { nbClients, totalTTC, totalPaye, detteTotale };
  }, [clientsEnrichis]);

  // ============================
  // 🔁 CRUD connecté au backend
  // ============================
  const handleAdd = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        nom: data.nom,
        prenom: null,
        entreprise: data.entreprise,
        adresse: data.adresse,
        numero_cni: null,
        telephone: null,
        type_client: "special",
        solde: 0,
        contact: data.contact,
      };

      const res = await axios.post("/clients", payload);
      const c = res.data;

      const newClient = {
        id: c.id,
        nom: c.nom || data.nom,
        contact: c.contact || c.telephone || data.contact,
        entreprise: c.entreprise || data.entreprise,
        adresse: c.adresse || data.adresse,
      };

      setClients((prev) => [newClient, ...prev]);

      toast(
        "success",
        "Client ajouté",
        `${newClient.nom} a été ajouté avec succès.`
      );
      setOpenAdd(false);
    } catch (error) {
      console.error("Erreur création client spécial :", error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 422 && data?.errors) {
          const firstError =
            Object.values(data.errors)[0]?.[0] ||
            "Vérifiez les champs obligatoires.";
          toast("error", "Impossible d'ajouter ce client spécial", firstError);
        } else {
          toast(
            "error",
            "Création impossible",
            data?.message || "Erreur lors de la création du client."
          );
        }
      } else {
        toast(
          "error",
          "Erreur réseau",
          "Impossible de contacter le serveur."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editTarget) return;
    setSubmitting(true);

    try {
      const payload = {
        nom: data.nom,
        entreprise: data.entreprise,
        adresse: data.adresse,
        contact: data.contact,
      };

      await axios.put(`/clients/${editTarget.id}`, payload);

      setClients((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                nom: data.nom,
                entreprise: data.entreprise,
                adresse: data.adresse,
                contact: data.contact,
              }
            : c
        )
      );

      toast("success", "Client modifié", `${data.nom} a été mis à jour.`);
      setEditTarget(null);
    } catch (error) {
      console.error(error);
      toast(
        "error",
        "Erreur",
        "Impossible de modifier ce client spécial pour le moment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);

    try {
      await axios.delete(`/clients/${deleteTarget.id}`);

      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));

      toast(
        "success",
        "Client supprimé",
        `${deleteTarget.nom} a été supprimé.`
      );
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      toast(
        "error",
        "Erreur",
        "Impossible de supprimer ce client spécial pour le moment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 🔄 Charge les paiements d'un client
  const loadPaiementsForClient = async (clientId) => {
    try {
      const commandesClient = commandes.filter((c) => c.clientId === clientId);
      if (!commandesClient.length) return;

      const updated = [...commandes];

      await Promise.all(
        commandesClient.map(async (cmd) => {
          try {
            const res = await axios.get(`/commandes/${cmd.id}/paiements`);
            const payload = Array.isArray(res.data?.data)
              ? res.data.data
              : res.data;

            const paiements = (payload || []).map((p) => ({
              id: p.id,
              date: p.date_paiement || p.date || "",
              montant:
                Number(
                  p.montant || p.montant_paye || p.montant_paiement || 0
                ) || 0,
              mode: p.mode_paiement || p.mode || "especes",
              commentaire: p.commentaire || "",
              statut:
                p.statut ||
                p.status ||
                p.statut_paiement ||
                p.statutPaiement ||
                null,
              type: p.type_paiement || p.type || p.typePaiement || null,
            }));

            const idx = updated.findIndex((c) => c.id === cmd.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], paiements };
            }
          } catch (e) {
            console.error("Erreur chargement paiements commande :", e);
          }
        })
      );

      setCommandes(updated);
    } catch (error) {
      console.error("Erreur chargement paiements client :", error);
      toast(
        "error",
        "Erreur",
        "Impossible de charger les paiements de ce client."
      );
    }
  };

  const openHistoriqueClient = (client) => {
    setHistoriqueClient(client);
    setOpenHistorique(true);
    loadPaiementsForClient(client.id);
  };

  const openTrancheClient = (client) => {
    setTrancheClient(client);
    setOpenTranche(true);
  };

  const openEditTrancheModal = (commande, paiement) => {
    // On ne laisse éditer que les tranches encore en attente caisse
    if (
      paiement.statut &&
      paiement.statut !== "en_attente_caisse" &&
      paiement.type === "tranche"
    ) {
      toast(
        "error",
        "Modification impossible",
        "Seules les tranches en attente caisse sont modifiables."
      );
      return;
    }

    const client = clients.find((c) => c.id === commande.clientId);
    setEditTrancheData({ commande, paiement, client });
    setOpenEditTranche(true);
  };

  // 🔗 Enregistrement d'une nouvelle tranche côté API (préparation Responsable)
  const handleTrancheSubmit = async (commande, tranche) => {
    try {
      const res = await axios.post(`/commandes/${commande.id}/paiements`, {
        montant: tranche.montant,
        mode_paiement: tranche.mode,
        date_paiement: tranche.date,
        type_paiement: "tranche",
        statut_paiement: "en_attente_caisse",
        statut: "en_attente_caisse",
        commentaire: tranche.commentaire || "",
      });

      const created = Array.isArray(res.data?.data)
        ? res.data.data[0]
        : res.data;

      const nouveauPaiement = {
        id: created?.id || Date.now(),
        date: created?.date_paiement || created?.date || tranche.date,
        montant:
          Number(
            created?.montant ||
              created?.montant_paye ||
              created?.montant_paiement ||
              tranche.montant
          ) || tranche.montant,
        mode: created?.mode_paiement || created?.mode || tranche.mode,
        commentaire: created?.commentaire || tranche.commentaire || "",
        statut:
          created?.statut ||
          created?.status ||
          created?.statut_paiement ||
          "en_attente_caisse",
        type: created?.type_paiement || created?.type || "tranche",
      };

      // ⚠️ IMPORTANT : on NE touche PAS au montant payé / reste / statut de la commande ici.
      // La commande ne sera soldée que quand la caisse encaisse réellement.
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === commande.id
            ? {
                ...c,
                paiements: [...(c.paiements || []), nouveauPaiement],
              }
            : c
        )
      );

      toast(
        "success",
        "Tranche en attente caisse",
        `${trancheClient?.nom || commande.clientNom} — ${formatFCFA(
          tranche.montant
        )}`
      );

      setOpenTranche(false);
      setTrancheClient(null);
    } catch (error) {
      console.error("Erreur enregistrement tranche :", error);

      if (error.response?.status === 422 && error.response.data?.errors) {
        const firstError =
          Object.values(error.response.data.errors)[0]?.[0] ||
          "Vérifiez les informations de la tranche.";
        toast("error", "Tranche refusée", firstError);
      } else {
        toast(
          "error",
          "Erreur",
          "Impossible d'enregistrer cette tranche pour le moment."
        );
      }
    }
  };

  // 🔄 Mise à jour d'une tranche en attente caisse
  const handleEditTrancheSubmit = async (commande, paiement, data) => {
    try {
      await axios.put(`/paiements/${paiement.id}`, {
        montant: data.montant,
        mode_paiement: data.mode,
        date_paiement: data.date,
        commentaire: data.commentaire || "",
        // On laisse le statut à "en_attente_caisse" tant que la caisse n'a pas encaissé
        statut_paiement: "en_attente_caisse",
      });

      setCommandes((prev) =>
        prev.map((c) => {
          if (c.id !== commande.id) return c;
          return {
            ...c,
            paiements: (c.paiements || []).map((p) =>
              p.id === paiement.id
                ? {
                    ...p,
                    montant: data.montant,
                    mode: data.mode,
                    date: data.date,
                    commentaire: data.commentaire,
                    statut: "en_attente_caisse",
                    type: p.type || "tranche",
                  }
                : p
            ),
          };
        })
      );

      toast(
        "success",
        "Tranche modifiée",
        `La tranche a été mise à jour (toujours en attente caisse).`
      );

      setOpenEditTranche(false);
      setEditTrancheData(null);
    } catch (error) {
      console.error("Erreur modification tranche :", error);

      if (error.response?.status === 422 && error.response.data?.errors) {
        const firstError =
          Object.values(error.response.data.errors)[0]?.[0] ||
          "Vérifiez les informations de la tranche.";
        toast("error", "Modification refusée", firstError);
      } else {
        toast(
          "error",
          "Erreur",
          "Impossible de modifier cette tranche pour le moment."
        );
      }
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return clientsEnrichis.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.contact || "").toLowerCase().includes(q) ||
        (c.entreprise || "").toLowerCase().includes(q) ||
        (c.adresse || "").toLowerCase().includes(q)
    );
  }, [clientsEnrichis, searchTerm]);

  // Loader compact aligné
  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh] overflow-x-hidden">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-xs font-medium text-[#472EAD]">
            Chargement des clients spéciaux...
          </span>
        </div>
      </div>
    );

  return (
    <div className="w-full h-full overflow-x-hidden">
      <div className="w-full h-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-3 sm:px-4 lg:px-6 py-4 sm:py-5 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                  Module Clients spéciaux — Responsable
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2F1F7A]">
                  Clients spéciaux
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
                  Gestion des clients privilégiés, commandes en gros et
                  paiements par tranches (préparation côté Responsable,{" "}
                  <span className="font-semibold">
                    encaissement côté caisse
                  </span>
                  ).
                </p>
              </div>
              <p className="text-[11px] text-gray-400">
                {statsGlobales.nbClients} client
                {statsGlobales.nbClients > 1 && "s"} spéciaux enregistrés
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <button
                onClick={() => setOpenAdd(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#472EAD] text-white rounded-lg shadow-md hover:bg-[#5A3CF5] hover:shadow-lg text-xs sm:text-sm transition"
              >
                <UserPlus size={16} />
                Nouveau client
              </button>
            </div>
          </motion.header>

          {/* CARTES STATS GLOBALES */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {/* Clients spéciaux */}
            <div className="rounded-xl border border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 px-3 py-2.5 shadow-sm">
              <div className="text-[15px] font-semibold text-yellow-800 mb-0.5">
                Clients spéciaux
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-yellow-700">
                  {statsGlobales.nbClients}
                </span>
                <BadgeDollarSign className="w-5 h-5 text-yellow-600" />
              </div>
            </div>

            {/* Total TTC commandes */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Total TTC commandes
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-lg font-extrabold text-emerald-700">
                  {formatFCFA(statsGlobales.totalTTC)}
                </span>
              </div>
            </div>

            {/* Total payé */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Total payé (encaissé)
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-lg font-extrabold text-emerald-700">
                  {formatFCFA(statsGlobales.totalPaye)}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* Dette globale */}
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Dette globale
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-lg font-extrabold text-rose-700">
                  {formatFCFA(statsGlobales.detteTotale)}
                </span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </motion.div>

          {/* RECHERCHE + TABLEAU */}
          <section className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] px-3 sm:px-4 py-3 sm:py-4 space-y-3">
            {/* RECHERCHE */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, contact, entreprise, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
              />
            </div>

            {/* TABLEAU PRINCIPAL */}
            <DataTable
              columns={[
                {
                  key: "nom",
                  label: "Client",
                  render: (_, row) => (
                    <div>
                      <div className="font-semibold text-sm">{row.nom}</div>
                      <div className="text-[11px] text-gray-500">
                        {row.entreprise}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {row.adresse}
                      </div>
                    </div>
                  ),
                },
                { key: "contact", label: "Contact" },
                {
                  key: "totalTTC",
                  label: "Total TTC",
                  render: (v) => (
                    <span className="text-xs font-semibold text-gray-700">
                      {formatFCFA(v)}
                    </span>
                  ),
                },
                {
                  key: "totalPaye",
                  label: "Total payé",
                  render: (v) => (
                    <span className="text-xs font-semibold text-emerald-700">
                      {formatFCFA(v)}
                    </span>
                  ),
                },
                {
                  key: "detteTotale",
                  label: "Dette",
                  render: (v) =>
                    v > 0 ? (
                      <span className="text-xs font-semibold text-rose-700">
                        {formatFCFA(v)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        A jour
                      </span>
                    ),
                },
                {
                  key: "tranches",
                  label: "Tranches",
                  render: (_, row) =>
                    row.nbTranchesEnAttente > 0 ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-amber-700">
                          {row.nbTranchesEnAttente} en attente
                        </span>
                        <span className="text-[11px] text-gray-600">
                          {formatFCFA(row.montantTranchesEnAttente)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Aucune tranche en attente
                      </span>
                    ),
                },
                {
                  key: "nbCommandes",
                  label: "Commandes",
                  render: (v) => (
                    <span className="text-xs font-semibold text-gray-700">
                      {v || 0}
                    </span>
                  ),
                },
              ]}
              data={filtered}
              actions={[
                {
                  icon: <BadgeDollarSign size={16} />,
                  title: "Nouvelle tranche (en attente caisse)",
                  color: "text-emerald-700",
                  hoverBg: "bg-emerald-50",
                  onClick: (row) => openTrancheClient(row),
                },
                {
                  icon: <ListChecks size={16} />,
                  title: "Historique commandes / paiements",
                  color: "text-[#472EAD]",
                  hoverBg: "bg-[#F7F5FF]",
                  onClick: (row) => openHistoriqueClient(row),
                },
                {
                  icon: <Edit2 size={16} />,
                  title: "Modifier",
                  color: "text-[#472EAD]",
                  hoverBg: "bg-[#F7F5FF]",
                  onClick: (row) => setEditTarget(row),
                },
                {
                  icon: <Trash2 size={16} />,
                  title: "Supprimer",
                  color: "text-rose-600",
                  hoverBg: "bg-rose-50",
                  onClick: (row) => setDeleteTarget(row),
                },
              ]}
            />
          </section>

          {/* MODALES CRUD */}
          <FormModal
            open={openAdd}
            onClose={() => setOpenAdd(false)}
            title="Nouveau client spécial"
          >
            <ClientForm
              onSubmit={handleAdd}
              onCancel={() => setOpenAdd(false)}
              submitting={submitting}
            />
          </FormModal>

          <FormModal
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            title={`Modifier : ${editTarget?.nom}`}
          >
            {editTarget && (
              <ClientForm
                initial={editTarget}
                onSubmit={handleEdit}
                onCancel={() => setEditTarget(null)}
                submitting={submitting}
              />
            )}
          </FormModal>

          <FormModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title="Confirmer la suppression"
            width="max-w-md"
          >
            <p className="text-sm text-gray-600 mb-4">
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold">{deleteTarget?.nom}</span> ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 shadow-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </FormModal>

          {/* MODALE HISTORIQUE CLIENT (VoirDetailClient.jsx) */}
          <VoirDetailClient
            open={openHistorique}
            onClose={() => setOpenHistorique(false)}
            client={historiqueClient}
            commandes={commandes.filter(
              (cmd) => cmd.clientId === historiqueClient?.id
            )}
            onEditTranche={openEditTrancheModal}
          />

          {/* MODALE NOUVELLE TRANCHE */}
          <NouvelleTrancheModal
            open={openTranche}
            onClose={() => {
              setOpenTranche(false);
              setTrancheClient(null);
            }}
            client={trancheClient}
            commandes={commandes.filter(
              (cmd) => cmd.clientId === trancheClient?.id
            )}
            onSubmit={handleTrancheSubmit}
            toast={toast}
          />

          {/* MODALE ÉDITION TRANCHE */}
          <EditTrancheModal
            open={openEditTranche}
            onClose={() => {
              setOpenEditTranche(false);
              setEditTrancheData(null);
            }}
            client={editTrancheData?.client}
            commande={editTrancheData?.commande}
            paiement={editTrancheData?.paiement}
            onSubmit={handleEditTrancheSubmit}
            toast={toast}
          />

          {/* TOASTS */}
          <Toasts toasts={toasts} remove={removeToast} />
        </div>
      </div>
    </div>
  );
}

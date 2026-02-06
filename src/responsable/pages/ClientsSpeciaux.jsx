// ==========================================================
// 🧍‍♂️ ClientsSpeciaux.jsx — Interface Responsable (LPD Manager)
// Gestion des clients privilégiés (vente en gros + paiements par tranches)
// Version FINALE corrigée avec backend Laravel - SYNCHRONISÉ
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
import Pagination from "../components/Pagination.jsx";
import { useClientsSpeciaux } from "@/hooks/useClientsSpeciaux";
import { usePaiementsClients } from "@/hooks/usePaiementsClients";

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
// 💸 Modal Nouvelle Tranche (côté Responsable) - CORRIGÉ AVEC STATUTS LARAVEL
// ==========================================================
function NouvelleTrancheModal({
  open,
  onClose,
  client,
  commandes,
  onSubmit,
  toast,
}) {
  // ✅ CORRECTION : Commandes éligibles - SEULEMENT les commandes avec resteAPayer > 0
  const commandesEligibles = useMemo(
    () =>
      (commandes || []).filter((c) => {
        // Exclure les commandes annulées
        if (c.statut === "annulee") return false;
        
        // ✅ CORRECTION : Utiliser resteAPayer (source de vérité Laravel)
        const reste = Number(c.resteAPayer || 0);
        return reste > 0;
      }),
    [commandes]
  );

  const [commandeId, setCommandeId] = useState("");
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("especes");
  const [date, setDate] = useState(todayISO());
  const [commentaire, setCommentaire] = useState("");

  // 🔄 Réinitialisation à chaque ouverture
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

    // ✅ CORRECTION : Utiliser resteAPayer (source de vérité Laravel)
    const resteDisponible = Number(commandeSelectionnee.resteAPayer || 0);

    if (resteDisponible <= 0) {
      toast(
        "error",
        "Aucun reste pour nouvelle tranche",
        "Le montant total de la commande est déjà couvert par les encaissements et tranches en attente."
      );
      return;
    }

    if (m > resteDisponible) {
      toast(
        "error",
        "Montant trop élevé",
        `La tranche ne peut pas dépasser le reste disponible (${formatFCFA(
          resteDisponible
        )}).`
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
            (toutes les commandes sont soldées ou annulées).
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
                {commandesEligibles.map((c) => {
                  const reste = Number(c.resteAPayer || 0);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.numero} — Date : {c.dateCommande} — Reste : {formatFCFA(reste)}
                    </option>
                  );
                })}
              </select>
              {commandeSelectionnee && (
                <div className="mt-1 text-[11px] text-gray-500 space-y-1">
                  <div>
                    Total TTC :{" "}
                    <span className="font-semibold">
                      {formatFCFA(commandeSelectionnee.totalTTC)}
                    </span>
                  </div>
                  <div>
                    Payé (encaissé) :{" "}
                    <span className="font-semibold text-emerald-700">
                      {formatFCFA(commandeSelectionnee.montantPaye || 0)}
                    </span>
                  </div>
                  <div>
                    Tranches en attente :{" "}
                    <span className="font-semibold text-amber-700">
                      {(() => {
                        const paiements = commandeSelectionnee.paiements || [];
                        // ✅ CORRECTION CRITIQUE : Utiliser les champs Laravel bruts
                        const tranchesEnAttente = paiements
                          .filter(p => p.type_paiement === "tranche" && p.statut_paiement === "en_attente_caisse")
                          .reduce((s, p) => s + Number(p.montant || 0), 0);
                        return formatFCFA(tranchesEnAttente);
                      })()}
                    </span>
                  </div>
                  <div>
                    Reste disponible :{" "}
                    <span className="font-semibold text-rose-700">
                      {formatFCFA(commandeSelectionnee.resteAPayer || 0)}
                    </span>
                  </div>
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
    if (!form.entreprise.trim()) e.entreprise = "L'entreprise est requise.";
    if (!form.adresse.trim()) e.adresse = "L'adresse est requise.";
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
// 📋 Page principale Clients Spéciaux - CORRIGÉE AVEC STATUTS LARAVEL
// ==========================================================
export default function ClientsSpeciaux() {
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

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // ✅ CORRECTION 1 : Appel complet du hook avec pagination
  const {
    clients,
    commandes,
    clientsEnrichis,
    statsGlobales,
    page,
    totalPages,
    setPage,
    loading,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useClientsSpeciaux(toast);


  const {
    loadPaiementsForClient,
    handleTrancheSubmit,
    handleVoirDetailEditTranche,
    handleVoirDetailDeleteTranche,
  } = usePaiementsClients(toast);

  // ✅ CORRECTION 3 : Réinitialiser la page quand on recherche
  useEffect(() => {
    setPage(1);
  }, [searchTerm, setPage]);

  // ✅ CORRECTION 1 : Filtre correct pour la table
  const displayedClients = useMemo(() => {
    if (!searchTerm) return clientsEnrichis;

    const q = searchTerm.toLowerCase();
    return clientsEnrichis.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.contact || "").toLowerCase().includes(q) ||
        (c.entreprise || "").toLowerCase().includes(q) ||
        (c.adresse || "").toLowerCase().includes(q)
    );
  }, [clientsEnrichis, searchTerm]);

  // ✅ Utilisation des stats globales du hook
  const statsReelles = statsGlobales;

  const openHistoriqueClient = (client) => {
    setHistoriqueClient(client);
    setOpenHistorique(true);
    loadPaiementsForClient(client.id);
  };

  const openTrancheClient = (client) => {
    setTrancheClient(client);
    setOpenTranche(true);
  };

  // ✅ CORRECTION : Désactiver le bouton "Nouvelle tranche" basé sur resteAPayer
  const isTrancheDisabled = (client) => {
    const commandesClient = commandes.filter(cmd => 
      cmd.clientId === client.id && cmd.statut !== "annulee"
    );

    if (commandesClient.length === 0) return true;

    // ✅ CORRECTION : Vérifier si au moins une commande a un resteAPayer > 0
    return !commandesClient.some(cmd => {
      const reste = Number(cmd.resteAPayer || 0);
      return reste > 0;
    });
  };

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
                {statsReelles.nbClients} client
                {statsReelles.nbClients > 1 && "s"} spéciaux enregistrés
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

          {/* CARTES STATS GLOBALES - CORRIGÉES avec données Laravel */}
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
                  {statsReelles.nbClients}
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
                  {formatFCFA(statsReelles.totalTTC)}
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
                  {formatFCFA(statsReelles.totalPaye)}
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
                  {formatFCFA(statsReelles.detteTotale)}
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

            {/* TABLEAU PRINCIPAL - CORRIGÉ */}
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
                {
                  key: "totalTTC",
                  label: "Total TTC",
                  render: (v) => (
                    <span className="text-xs font-semibold text-gray-700">
                      {formatFCFA(v || 0)}
                    </span>
                  ),
                },
                {
                  key: "totalPaye",
                  label: "Total payé",
                  render: (v) => (
                    <span className="text-xs font-semibold text-emerald-700">
                      {formatFCFA(v || 0)}
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
                  render: (_, row) => {
                    const nbTranches = row.nbTranchesEnAttente || 0;
                    const montantTranches = row.montantTranchesEnAttente || 0;
                    
                    return nbTranches > 0 ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-amber-700">
                          {nbTranches} en attente
                        </span>
                        <span className="text-[11px] text-gray-600">
                          {formatFCFA(montantTranches)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Aucune tranche en attente
                      </span>
                    );
                  },
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
              data={displayedClients}
              actions={[
                {
                  icon: <BadgeDollarSign size={16} />,
                  title: "Nouvelle tranche (en attente caisse)",
                  color: "text-emerald-700",
                  hoverBg: "bg-emerald-50",
                  onClick: (row) => !isTrancheDisabled(row) && openTrancheClient(row),
                  disabled: (row) => isTrancheDisabled(row),
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

            {/* ✅ CORRECTION 2 : Pagination cachée pendant la recherche */}
            {!searchTerm && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
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
                onClick={() => handleDelete(deleteTarget.id)}
                className="px-4 py-2 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </FormModal>

          {/* MODALE HISTORIQUE CLIENT */}
          <VoirDetailClient
            open={openHistorique}
            onClose={() => setOpenHistorique(false)}
            client={historiqueClient}
            commandes={commandes.filter(
              (cmd) => cmd.clientId === historiqueClient?.id
            )}
            onEditTranche={handleVoirDetailEditTranche}
            onDeleteTranche={handleVoirDetailDeleteTranche}
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

          {/* TOASTS */}
          <Toasts toasts={toasts} remove={removeToast} />
        </div>
      </div>
    </div>
  );
}
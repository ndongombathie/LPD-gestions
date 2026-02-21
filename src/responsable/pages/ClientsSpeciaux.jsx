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
  Phone,
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
const getPaiementEffectiveStatus = (paiement) =>
  String(paiement?.statut_paiement || "inconnu").toLowerCase();

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
  const [submitting, setSubmitting] = useState(false);

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

    const resteDisponible = Number(commandeSelectionnee.resteAPayer || 0);

    if (resteDisponible <= 0) {
      toast(
        "error",
        "Aucun reste pour nouvelle tranche",
        "Le montant total de la commande est déjà couvert."
      );
      return;
    }

    if (m > resteDisponible) {
      toast(
        "error",
        "Montant trop élevé",
        `La tranche ne peut pas dépasser (${formatFCFA(resteDisponible)}).`
      );
      return;
    }

    // ✅ ACTIVER LE LOADING
    setSubmitting(true);

    onSubmit(
      commandeSelectionnee,
      {
        montant: m,
        mode,
        date,
        commentaire: commentaire?.trim() || "",
      },
      () => setSubmitting(false) // ✅ FIN LOADING
    );
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
                          .filter(p => p.type_paiement === "tranche" && getPaiementEffectiveStatus(p) === "en_attente_caisse")
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
                disabled={submitting}
                className={cls(
                  "px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm shadow-sm",
                  submitting
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50"
                )}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={!commandeSelectionnee || submitting}
                className={cls(
                  "px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] shadow-sm flex items-center gap-2",
                  submitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:opacity-95"
                )}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Envoi..." : "Envoyer à la caisse"}
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

    if (!form.nom.trim())
      e.nom = "Le nom est requis.";

    if (!form.contact.match(/^[0-9]{9}$/))
      e.contact = "Le contact doit contenir exactement 9 chiffres.";

    if (!form.adresse.trim())
      e.adresse = "L'adresse est requise.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    console.log("CLIENT UPDATE FORM:", initial);

    if (validate()) onSubmit({
      ...form,
      id: initial?.id
    });
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
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "").slice(0, 9);
              update("contact", clean);
            }}
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
            Entreprise (optionnel)
          </label>
          <input
            value={form.entreprise}
            onChange={(e) => update("entreprise", e.target.value)}
            placeholder="Ex : Imprisol SARL (optionnel)"
            className={base(errors.entreprise)}
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
          disabled={submitting}
          className={cls(
            "px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm shadow-sm",
            submitting
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-gray-50"
          )}
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
// Version avec le même cadre visuel que Utilisateurs.jsx
// ==========================================================
export default function ClientsSpeciaux() {
  // ✅ 1️⃣ Ajouter page et searchInput
  const [page, setPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchInput, setSearchInput] = useState("");
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

  useEffect(() => {
    setPage(1);
    setSearchTerm(searchInput);
  }, [searchInput]);


  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // ✅ 3️⃣ Appel du hook (LA GROSSE CORRECTION)
  const {
    clients,
    commandes,
    clientsEnrichis,
    statsGlobales,
    totalPages,
    loading,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useClientsSpeciaux(toast, {
    page,
    search: searchTerm,
  });
  const filteredClients = useMemo(() => {
  if (!searchInput.trim()) return clientsEnrichis;

  const term = searchInput.toLowerCase();

  return clientsEnrichis.filter((c) =>
    c.nom?.toLowerCase().includes(term) ||
    c.contact?.toLowerCase().includes(term) ||
    c.entreprise?.toLowerCase().includes(term)
  );
}, [clientsEnrichis, searchInput]);

  // Gestionnaire de changement de page avec loader
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (newPage === page) return;
    if (loadingPage) return; // Éviter les clics multiples
    
    setLoadingPage(true);
    setPage(newPage);
  };

  // Désactiver le loader de page quand les données sont chargées
  useEffect(() => {
    if (!loading) {
      setLoadingPage(false);
      setInitialLoad(false);
    }
  }, [loading]);

  // Désactiver le loader de page quand les données arrivent (même si loading est encore true)
  useEffect(() => {
    if (clientsEnrichis.length > 0) {
      setLoadingPage(false);
    }
  }, [clientsEnrichis]);

  const {
    loadPaiementsForClient,
    handleTrancheSubmit,
    handleVoirDetailEditTranche,
    handleVoirDetailDeleteTranche,
  } = usePaiementsClients(toast);

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
  
  const isDeleteDisabled = (client) => {
    const dette = Number(client.detteTotale || 0);
    return dette > 0;
  };

  // Loader d'affichage initial - UNIQUEMENT au premier chargement
  if (initialLoad && loading && clientsEnrichis.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des clients spéciaux...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-3 sm:px-4 lg:px-6 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER avec badge intégré */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-8"
        >
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Clients spéciaux — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Clients spéciaux
              </h1>
              <p className="mt-1 text-sm text-gray-500">
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

          {/* BADGE TOTAL aligné à droite au même niveau */}
          <div className="flex items-center justify-end">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>

        {/* RECHERCHE + TABLEAU */}
        <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-4 sm:py-5 space-y-4">
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
            />
          </div>

          {/* Résumé affichage */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
            <span>
              Affichage :{" "}
              <span className="font-semibold">{filteredClients.length}</span> sur{" "}
              <span className="font-semibold">{statsGlobales.nbClients}</span>
            </span>
            <span>
              Page <span className="font-semibold">{page}</span> /{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
          </div>

          {/* TABLEAU PRINCIPAL */}
          <div className="mt-2 relative">
            {filteredClients.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
                <Search className="w-8 h-8 mb-3 opacity-60" />
                <p className="text-sm font-medium">
                  Aucun client spécial trouvé
                </p>
                <p className="text-xs mt-1">
                  Essayez de modifier votre recherche.
                </p>
              </div>
            ) : (
              <>
                <DataTable
                  columns={[
                    {
                      key: "nom",
                      label: "Client",
                      render: (_, row) => (
                        <div className="space-y-[2px]">
                          <div className="font-semibold text-sm text-gray-800">
                            {row.nom}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {row.entreprise
                              ? row.entreprise
                              : <span className="italic text-gray-400">Particulier</span>}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {row.adresse}
                          </div>
                          {row.contact && (
                            <div className="text-[11px] text-gray-500 flex items-center gap-1">
                              {row.contact}
                            </div>
                          )}
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
                          {v ?? 0}
                        </span>
                      ),
                    },
                  ]}
                  data={filteredClients}
                  actions={[
                    {
                      icon: <BadgeDollarSign size={16} />,
                      title: "Nouvelle tranche (en attente caisse)",
                      color: "text-emerald-700",
                      hoverBg: "bg-emerald-50",
                      onClick: (row) => {
                        if (isTrancheDisabled(row)) {
                          toast(
                            "error",
                            "Nouvelle tranche impossible",
                            "Ce client n'a aucune commande avec un reste à payer."
                          );
                          return;
                        }
                        openTrancheClient(row);
                      },
                      disabled: false,                  
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
                      onClick: (row) => {
                        if (isDeleteDisabled(row)) {
                          toast(
                            "error",
                            "Suppression impossible",
                            "Ce client possède encore une dette. Veuillez solder ses commandes avant suppression."
                          );
                          return;
                        }
                        setDeleteTarget(row);
                      },
                    },
                  ]}
                />

                
                <div className="mt-6">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                  
                  {/* Indicateur de chargement pendant le changement de page - UNIQUEMENT CELUI-CI */}
                  {loadingPage && (
                    <div className="flex justify-center py-2 text-xs text-gray-400 mt-2">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin text-[#472EAD]" />
                      Chargement de la page...
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* MODALES CRUD */}
        <FormModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          title="Nouveau client spécial"
        >
          <ClientForm
            onSubmit={(data) => {
              setSubmitting(true);
              handleAdd({
                ...data,
                onSuccess: () => {
                  setSubmitting(false);
                  setOpenAdd(false);
                },
                onError: () => setSubmitting(false),
              });
            }}
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
              onSubmit={(data) => {
                setSubmitting(true);
                handleEdit({
                  ...data,
                  onSuccess: () => {
                    setSubmitting(false);
                    setEditTarget(null);
                  },
                  onError: () => setSubmitting(false),
                });
              }}
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
              disabled={submitting}
              className={cls(
                "px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm",
                submitting
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-50"
              )}
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setSubmitting(true);
                handleDelete(deleteTarget.id, () => {
                  setSubmitting(false);
                  setDeleteTarget(null);
                });
              }}
              disabled={submitting}
              className={cls(
                "px-4 py-2 rounded-lg text-sm text-white bg-rose-600 shadow-sm",
                submitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-rose-700"
              )}
            >
              {submitting ? "Suppression en cours..." : "Supprimer"}
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
  );
}
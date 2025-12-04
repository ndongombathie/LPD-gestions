// ==========================================================
// 🧍‍♂️ ClientsSpeciaux.jsx — Interface Responsable (LPD Manager)
// Gestion des clients privilégiés (vente en gros + paiements par tranches)
// Version ULTRA PRO (agrégats + historique + nouvelle tranche + redirection Commandes)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Edit2,
  Trash2,
  Search,
  ShoppingCart,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ListChecks,
  BadgeDollarSign,
} from "lucide-react";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

const cls = (...a) => a.filter(Boolean).join(" ");
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

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
// 🧾 Modal Historique Client (commandes + paiements)
// ==========================================================
function HistoriqueClientModal({ open, onClose, client, commandes }) {
  if (!open || !client) return null;

  const commandesTriees = [...commandes].sort((a, b) =>
    a.dateCommande < b.dateCommande ? 1 : -1
  );

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Historique — {client.nom}
            </h2>
            <p className="text-xs text-gray-500">
              Suivi des commandes, paiements par tranches et dettes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Résumé global */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
          <div className="rounded-xl border border-[#E4E0FF] bg-[#F7F5FF] px-3 py-2">
            <div className="text-gray-500 mb-1">Total TTC commandes</div>
            <div className="font-semibold text-[#472EAD]">
              {formatFCFA(
                commandesTriees.reduce((s, c) => s + (c.totalTTC || 0), 0)
              )}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-gray-500 mb-1">Total payé</div>
            <div className="font-semibold text-emerald-700">
              {formatFCFA(
                commandesTriees.reduce((s, c) => s + (c.montantPaye || 0), 0)
              )}
            </div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <div className="text-gray-500 mb-1">Dette totale</div>
            <div className="font-semibold text-rose-700">
              {formatFCFA(
                commandesTriees.reduce(
                  (s, c) => s + Math.max(c.resteAPayer || 0, 0),
                  0
                )
              )}
            </div>
          </div>
        </div>

        {/* Infos client */}
        <div className="mb-3 text-xs text-gray-600">
          <div className="font-semibold text-gray-700">{client.nom}</div>
          <div>{client.entreprise}</div>
          <div className="text-gray-500">
            {client.adresse} — {client.contact}
          </div>
        </div>

        {/* Liste commandes */}
        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Total TTC</th>
                <th className="px-3 py-2 text-right">Payé</th>
                <th className="px-3 py-2 text-right">Reste</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-left">Paiements</th>
              </tr>
            </thead>
            <tbody>
              {commandesTriees.length ? (
                commandesTriees.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-gray-100 hover:bg-[#F9F9FF]"
                  >
                    <td className="px-3 py-2 font-medium">{c.numero}</td>
                    <td className="px-3 py-2">{c.dateCommande}</td>
                    <td className="px-3 py-2 text-right">
                      {formatFCFA(c.totalTTC)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700">
                      {formatFCFA(c.montantPaye)}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-700">
                      {formatFCFA(Math.max(c.resteAPayer, 0))}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cls(
                          "px-2 py-1 rounded-full inline-flex items-center gap-1 text-[11px] font-semibold border",
                          c.statut === "en_attente_caisse" &&
                            "bg-gray-100 text-gray-700 border-gray-300",
                          c.statut === "partiellement_payee" &&
                            "bg-amber-100 text-amber-700 border-amber-300",
                          c.statut === "soldee" &&
                            "bg-emerald-100 text-emerald-700 border-emerald-300",
                          c.statut === "annulee" &&
                            "bg-rose-100 text-rose-700 border-rose-300"
                        )}
                      >
                        {c.statutLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {c.paiements && c.paiements.length ? (
                        <div className="space-y-1">
                          {c.paiements.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <span className="text-gray-500">
                                {p.date} — {p.mode.toUpperCase()}
                              </span>
                              <span className="font-semibold">
                                {formatFCFA(p.montant)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          Aucun paiement
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-gray-400"
                    colSpan={7}
                  >
                    Aucune commande enregistrée pour ce client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 💸 Modal Nouvelle Tranche (côté Responsable)
// ==========================================================
function NouvelleTrancheModal({
  open,
  onClose,
  client,
  commandes,
  onSubmit,
  toast,
}) {
  if (!open || !client) return null;

  // On ne propose que les commandes avec reste > 0 et non annulées
  const commandesEligibles = commandes.filter(
    (c) => (c.resteAPayer || 0) > 0 && c.statut !== "annulee"
  );

  const [commandeId, setCommandeId] = useState(
    commandesEligibles[0]?.id || ""
  );
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("especes");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");

  const commandeSelectionnee =
    commandesEligibles.find((c) => String(c.id) === String(commandeId)) ||
    commandesEligibles[0] ||
    null;

  const resetForm = () => {
    setCommandeId(commandesEligibles[0]?.id || "");
    setMontant("");
    setMode("especes");
    setDate(new Date().toISOString().slice(0, 10));
    setCommentaire("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commandeSelectionnee) {
      toast(
        "error",
        "Aucune commande",
        "Ce client n'a aucune commande en attente."
      );
      return;
    }

    const reste = Math.max(commandeSelectionnee.resteAPayer || 0, 0);
    const m = Number(montant);

    if (!m || m <= 0) {
      toast(
        "error",
        "Montant invalide",
        "Veuillez saisir un montant de tranche valide."
      );
      return;
    }

    if (m > reste) {
      toast(
        "error",
        "Montant trop élevé",
        `La tranche ne peut pas dépasser le reste à payer (${formatFCFA(
          reste
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

    resetForm();
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
              Nouvelle tranche — {client.nom}
            </h2>
            <p className="text-xs text-gray-500">
              Préparation d&apos;un paiement partiel (validation en caisse).
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
            <span className="font-semibold">aucune commande en attente</span>{" "}
            ou avec reste à payer.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Commande + reste */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Commande à encaisser
              </label>
              <select
                value={commandeSelectionnee?.id || ""}
                onChange={(e) => setCommandeId(e.target.value)}
                className={baseInput}
              >
                {commandesEligibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} — Date : {c.dateCommande} — Reste :{" "}
                    {formatFCFA(Math.max(c.resteAPayer || 0, 0))}
                  </option>
                ))}
              </select>
              {commandeSelectionnee && (
                <div className="mt-1 text-[11px] text-gray-500">
                  Total TTC :{" "}
                  <span className="font-semibold">
                    {formatFCFA(commandeSelectionnee.totalTTC)}
                  </span>{" "}
                  — Payé :{" "}
                  <span className="font-semibold text-emerald-700">
                    {formatFCFA(commandeSelectionnee.montantPaye)}
                  </span>{" "}
                  — Reste :{" "}
                  <span className="font-semibold text-rose-700">
                    {formatFCFA(
                      Math.max(commandeSelectionnee.resteAPayer || 0, 0)
                    )}
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
// 🧾 Formulaire client spécial
// ==========================================================
function ClientForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial ?? { nom: "", contact: "", entreprise: "", adresse: "" }
  );
  const [errors, setErrors] = useState({});

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
        {/* Nom */}
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
            <p className="text-xs text-rose-600 mt-1">
              {errors.entreprise}
            </p>
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

  const navigate = useNavigate();

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Simulation initiale : clients + commandes
  useEffect(() => {
    const simulatedClients = [
      {
        id: 1,
        nom: "DIOP Mamadou",
        contact: "771234567",
        entreprise: "Bureau Afrique Service",
        adresse: "Dakar Plateau",
      },
      {
        id: 2,
        nom: "SOW Aissatou",
        contact: "781112233",
        entreprise: "Imprisol SARL",
        adresse: "Thiès",
      },
      {
        id: 3,
        nom: "NDIAYE Cheikh",
        contact: "761234555",
        entreprise: "École Al Falah",
        adresse: "Kaolack",
      },
    ];

    const total1 = 24000 * 1.18;
    const paye1 = 30000;
    const reste1 = Math.max(total1 - paye1, 0);

    const total2 = 20000 * 1.18;
    const paye2 = total2;
    const reste2 = Math.max(total2 - paye2, 0);

    const total3 = 60000 * 1.18;
    const paye3 = 30000;
    const reste3 = Math.max(total3 - paye3, 0);

    const simulatedCommandes = [
      {
        id: 1,
        numero: "CMD-2025-1001",
        clientId: 1,
        clientNom: "DIOP Mamadou",
        clientCode: "CL-DIOP-001",
        dateCommande: "2025-11-03",
        totalTTC: total1,
        montantPaye: Math.min(paye1, total1),
        resteAPayer: reste1,
        statut: reste1 === 0 ? "soldee" : "partiellement_payee",
        statutLabel: reste1 === 0 ? "Soldée" : "Partiellement payée",
        paiements: [
          {
            id: 1,
            date: "2025-11-03",
            montant: 20000,
            mode: "especes",
          },
          {
            id: 2,
            date: "2025-11-05",
            montant: 10000,
            mode: "orange_money",
          },
        ],
      },
      {
        id: 2,
        numero: "CMD-2025-1002",
        clientId: 2,
        clientNom: "SOW Aissatou",
        clientCode: "CL-SOW-002",
        dateCommande: "2025-11-02",
        totalTTC: total2,
        montantPaye: Math.min(paye2, total2),
        resteAPayer: reste2,
        statut: "soldee",
        statutLabel: "Soldée",
        paiements: [
          {
            id: 3,
            date: "2025-11-02",
            montant: total2,
            mode: "wave",
          },
        ],
      },
      {
        id: 3,
        numero: "CMD-2025-1003",
        clientId: 3,
        clientNom: "NDIAYE Cheikh",
        clientCode: "CL-NDI-003",
        dateCommande: "2025-10-30",
        totalTTC: total3,
        montantPaye: Math.min(paye3, total3),
        resteAPayer: reste3,
        statut: reste3 === 0 ? "soldee" : "partiellement_payee",
        statutLabel: reste3 === 0 ? "Soldée" : "Partiellement payée",
        paiements: [
          {
            id: 4,
            date: "2025-10-30",
            montant: 30000,
            mode: "cheque",
          },
        ],
      },
    ];

    setTimeout(() => {
      setClients(simulatedClients);
      setCommandes(simulatedCommandes);
      setLoading(false);
    }, 500);
  }, []);

  // Agrégation : enrichir chaque client avec ses commandes
  const clientsEnrichis = useMemo(() => {
    return clients.map((c) => {
      const cs = commandes.filter((cmd) => cmd.clientId === c.id);
      if (!cs.length) {
        return {
          ...c,
          nbCommandes: 0,
          totalTTC: 0,
          totalPaye: 0,
          detteTotale: 0,
          derniereActivite: null,
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

      return {
        ...c,
        nbCommandes: cs.length,
        totalTTC,
        totalPaye,
        detteTotale,
        derniereActivite,
      };
    });
  }, [clients, commandes]);

  // Stats globales
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

  const handleAdd = (data) => {
    setSubmitting(true);
    setClients((p) => [{ id: Date.now(), ...data }, ...p]);
    toast("success", "Client ajouté", `${data.nom} a été ajouté avec succès.`);
    setSubmitting(false);
    setOpenAdd(false);
  };

  const handleEdit = (data) => {
    setSubmitting(true);
    setClients((p) =>
      p.map((c) => (c.id === editTarget.id ? { ...c, ...data } : c))
    );
    toast("success", "Client modifié", `${data.nom} a été mis à jour.`);
    setSubmitting(false);
    setEditTarget(null);
  };

  const handleDelete = () => {
    setSubmitting(true);
    setClients((p) => p.filter((c) => c.id !== deleteTarget.id));
    toast("success", "Client supprimé", `${deleteTarget.nom} a été supprimé.`);
    setSubmitting(false);
    setDeleteTarget(null);
  };

  const goToCommandes = (client) => {
    navigate("/responsable/commandes", {
      state: { clientId: client.id, clientNom: client.nom },
    });
  };

  const openHistoriqueClient = (client) => {
    setHistoriqueClient(client);
    setOpenHistorique(true);
  };

  const openTrancheClient = (client) => {
    setTrancheClient(client);
    setOpenTranche(true);
  };

  const handleTrancheSubmit = (commande, tranche) => {
    setCommandes((prev) =>
      prev.map((c) => {
        if (c.id !== commande.id) return c;

        const total = c.totalTTC || 0;
        const ancienPaye = c.montantPaye || 0;
        const nouveauPaye = ancienPaye + tranche.montant;
        const montantPayeClampe = Math.min(nouveauPaye, total);
        const reste = Math.max(total - montantPayeClampe, 0);

        const nouveauPaiement = {
          id: Date.now(),
          date: tranche.date,
          montant: tranche.montant,
          mode: tranche.mode,
          commentaire: tranche.commentaire || "",
        };

        let statut = c.statut;
        let statutLabel = c.statutLabel;
        if (reste === 0) {
          statut = "soldee";
          statutLabel = "Soldée";
        } else {
          statut = "partiellement_payee";
          statutLabel = "Partiellement payée";
        }

        return {
          ...c,
          montantPaye: montantPayeClampe,
          resteAPayer: reste,
          statut,
          statutLabel,
          paiements: [...(c.paiements || []), nouveauPaiement],
        };
      })
    );

    toast(
      "success",
      "Tranche envoyée à la caisse",
      `${trancheClient?.nom || commande.clientNom} — ${formatFCFA(
        tranche.montant
      )}`
    );

    setOpenTranche(false);
    setTrancheClient(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des clients spéciaux — LPD Manager", 14, 16);
    doc.autoTable({
      startY: 24,
      head: [
        [
          "Nom",
          "Contact",
          "Entreprise",
          "Adresse",
          "Nb commandes",
          "Total TTC",
          "Total payé",
          "Dette",
        ],
      ],
      body: clientsEnrichis.map((c) => [
        c.nom,
        c.contact,
        c.entreprise,
        c.adresse,
        String(c.nbCommandes || 0),
        formatFCFA(c.totalTTC),
        formatFCFA(c.totalPaye),
        formatFCFA(c.detteTotale),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save("ClientsSpeciaux_LPD.pdf");
    toast(
      "success",
      "Export PDF",
      "Le fichier ClientsSpeciaux_LPD.pdf a été généré."
    );
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return clientsEnrichis.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.entreprise.toLowerCase().includes(q) ||
        c.adresse.toLowerCase().includes(q)
    );
  }, [clientsEnrichis, searchTerm]);

  // Loader compact aligné
  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-xs font-medium text-[#472EAD]">
            Chargement des clients spéciaux...
          </span>
        </div>
      </div>
    );

  return (
    <>
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
                  Gestion des clients privilégiés, commandes en gros et paiements
                  par tranches (préparation côté Responsable, validation en
                  caisse).
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
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] text-white rounded-lg shadow-[0_8px_20px_rgba(71,46,173,0.35)] text-xs sm:text-sm font-semibold hover:translate-y-[1px] active:scale-[0.97] transition"
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <div className="rounded-xl border bg-amber-50 border border-amber-200 px-3 py-2.5">
              <div className="text-[15px] text-rose-700 mb-0.5">
                Clients spéciaux
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-rose-700">
                  {statsGlobales.nbClients}
                </span>
                <BadgeDollarSign className="w-5 h-5 text-rose-700" />
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Total TTC commandes
              </div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-700 truncate">
                {formatFCFA(statsGlobales.totalTTC)}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Total payé
              </div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-700 truncate">
                {formatFCFA(statsGlobales.totalPaye)}
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Dette globale
              </div>
              <div className="text-xs sm:text-sm font-semibold text-rose-700 truncate">
                {formatFCFA(statsGlobales.detteTotale)}
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
                  key: "nbCommandes",
                  label: "Commandes",
                  render: (v) => (
                    <span className="text-xs font-semibold text-gray-700">
                      {v || 0}
                    </span>
                  ),
                },
                {
                  key: "derniereActivite",
                  label: "Dernière activité",
                  render: (v) =>
                    v ? (
                      <span className="text-xs text-gray-600">{v}</span>
                    ) : (
                      <span className="text-[11px] text-gray-400">
                        Aucune activité
                      </span>
                    ),
                },
              ]}
              data={filtered}
              actions={[
                {
                  icon: <BadgeDollarSign size={16} />,
                  title: "Nouvelle tranche",
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

          {/* MODALE HISTORIQUE CLIENT */}
          <HistoriqueClientModal
            open={openHistorique}
            onClose={() => setOpenHistorique(false)}
            client={historiqueClient}
            commandes={commandes.filter(
              (cmd) => cmd.clientId === historiqueClient?.id
            )}
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
    </>
  );
}

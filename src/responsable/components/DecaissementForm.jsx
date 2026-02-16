// ==========================================================
// 💸 DecaissementForm.jsx — Formulaire de Décaissement (LPD Manager)
// ✅ Pas de <form> (évite bugs si FormModal enveloppe déjà un <form>)
// ✅ Logique : EDIT → (inputs) → SAVE/CANCEL ou auto-save lors de l’envoi
// ==========================================================

import React, { useMemo, useState ,useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { utilisateursAPI } from "@/services/api";
import {
  Loader2,
  Wallet,
  Calendar,
  FileText,
  CreditCard,
  PlusCircle,
  Trash2,
  Pencil,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const cls = (...a) => a.filter(Boolean).join(" ");

// ———————————————————————————
// ✅ Composant Toasts (comme Fournisseurs.jsx)
// ———————————————————————————
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
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
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function DecaissementForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}) {
  // —————————————————————————————————————
  // 🧠 State principal (en-tête)
  // —————————————————————————————————————
  const [header, setHeader] = useState({
    motifGlobal: initial?.motifGlobal || "",
    methodePrevue: initial?.methodePrevue || "Espèces",
    datePrevue: initial?.datePrevue || new Date().toISOString().slice(0, 10),
    caissier_id: initial?.caissier_id || null
  });

  // Lignes détaillées (libellé + montant)
  const [lignes, setLignes] = useState(initial?.lignes || []);

  // Brouillon de ligne en cours (ajout)
  const [draft, setDraft] = useState({ montant: "" });  const [selectedCaissier, setSelectedCaissier] = useState(null);

  // Edition (1 ligne à la fois)
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ montant: "" });

  const [errors, setErrors] = useState({});

  // ✅ Toasts (local)
  const [toasts, setToasts] = useState([]);
  const [searchCaissier, setSearchCaissier] = useState("");
const [searchDebounced, setSearchDebounced] = useState("");
const [caissiers, setCaissiers] = useState([]);
const [loadingCaissiers, setLoadingCaissiers] = useState(false);

  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  // —————————————————————————————————————
  // Helpers
  // —————————————————————————————————————
  const updateHeader = (k, v) => setHeader((h) => ({ ...h, [k]: v }));
  const updateDraft = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const updateEditDraft = (k, v) => setEditDraft((d) => ({ ...d, [k]: v }));
  useEffect(() => {
  const timer = setTimeout(() => {
    setSearchDebounced(searchCaissier);
  }, 1000);

  return () => clearTimeout(timer);
}, [searchCaissier]);

useEffect(() => {
  if (!searchDebounced.trim()) {
    setCaissiers([]);
    setLoadingCaissiers(false);
    return;
  }

  const load = async () => {
    try {
      setLoadingCaissiers(true);

      const res = await utilisateursAPI.getAll({
        role: "caissier",
        search: searchDebounced,
      });

      setCaissiers(res.data || []);
    } finally {
      setLoadingCaissiers(false);
    }
  };

  load();
}, [searchDebounced]);

useEffect(() => {
  if (initial?.caissier) {
    setSelectedCaissier(initial.caissier);
  }
}, [initial]);

  const total = useMemo(
    () => lignes.reduce((sum, l) => sum + Number(l.montant || 0), 0),
    [lignes]
  );
const selectCaissier = (c) => {
  updateHeader("caissier_id", c.id);
  setSelectedCaissier(c);
  setSearchCaissier(`${c.nom} ${c.prenom}`);  setCaissiers([]);
};

  // —————————————————————————————————————
  // ✅ Validation
  // —————————————————————————————————————
  const validateDraft = () => {
    const e = {};
    if (!draft.montant || Number(draft.montant) <= 0)
      e.montant = "Montant invalide (> 0).";
    return e;
  };

  const validateEditDraft = () => {
    const e = {};

    if (!editDraft.montant || Number(editDraft.montant) <= 0)
      e.montant = "Montant invalide (> 0).";
    return e;
  };

  // ⬇️ On la fait dépendre d’un tableau de lignes passé en paramètre
  const validateAll = (currentLignes) => {
    const e = {};
    if (!header.caissier_id)
    e.caissier = "Veuillez sélectionner un caissier.";

    if (!header.motifGlobal.trim())
      e.motifGlobal = "Le motif global est obligatoire.";

    if (!currentLignes.length)
      e.lignes =
        "Ajoutez au moins une ligne de montant avant d’envoyer à la caisse.";

    const bad = currentLignes.find(
      (l) => Number(l.montant || 0) <= 0
    );

    if (bad) e.lignes = "Certaines lignes ont un montant invalide."
;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // —————————————————————————————————————
  // ➕ Ajout / suppression de ligne
  // —————————————————————————————————————
  const handleAddLigne = () => {
    const e = validateDraft();
    if (Object.keys(e).length) {
      setErrors((prev) => ({ ...prev, draft: e }));
      return;
    }
    setErrors((prev) => ({ ...prev, draft: {} }));

    const nouvelle = {
      id: Date.now(),
      montant: Number(draft.montant),
    };

    setLignes((prev) => [...prev, nouvelle]);
    setDraft({ montant: "" });  };

  const handleRemoveLigne = (id) => {
    if (editingId === id) {
      setEditingId(null);
      setEditDraft({ montant: "" });
      setErrors((prev) => ({
        ...prev,
        editDraft: {},
        editing: undefined,
      }));
    }
    setLignes((prev) => prev.filter((l) => l.id !== id));
  };

  // —————————————————————————————————————
  // ✏️ Edition (EDIT → SAVE/CANCEL)
  // —————————————————————————————————————
  const startEdit = (ligne) => {
    setErrors((prev) => ({ ...prev, editDraft: {}, editing: undefined }));
    setEditingId(ligne.id);
    setEditDraft({
      montant: String(ligne.montant ?? ""),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ montant: "" });
    setErrors((prev) => ({ ...prev, editDraft: {}, editing: undefined }));
  };

  const saveEdit = () => {
    const e = validateEditDraft();
    if (Object.keys(e).length) {
      setErrors((prev) => ({ ...prev, editDraft: e }));
      return;
    }
    setErrors((prev) => ({ ...prev, editDraft: {}, editing: undefined }));

    const updated = lignes.map((l) =>
      l.id === editingId
        ? {
            ...l,
            montant: Number(editDraft.montant || 0),
          }
        : l
    );

    setLignes(updated);
    setEditingId(null);
    setEditDraft({ montant: "" });

  };

  // —————————————————————————————————————
  // 📤 Submit global (Envoyer à la caisse)
  // —————————————————————————————————————
  const handleSubmit = async () => {
    if (submitting) return;

    // 🟣 1) Si une ligne est en édition, on tente de la sauver automatiquement
    let lignesToUse = lignes;

    if (editingId !== null) {
      const eEdit = validateEditDraft();
      if (Object.keys(eEdit).length) {
        setErrors((prev) => ({
          ...prev,
          editDraft: eEdit,
          editing: "Corrigez la ligne en édition avant d’envoyer à la caisse.",
        }));
        return;
      }

      lignesToUse = lignes.map((l) =>
        l.id === editingId
          ? {
              ...l,
              montant: Number(editDraft.montant || 0),
            }
          : l
      );

      setLignes(lignesToUse);
      setEditingId(null);
      setEditDraft({ montant: "" });
      setErrors((prev) => ({
        ...prev,
        editDraft: {},
        editing: undefined,
      }));
    }

    // 🟣 2) Validation globale avec les lignes définitives
    if (!validateAll(lignesToUse)) return;

    // 🟣 3) Construction du payload à envoyer au parent
    const payload = {
      motifGlobal: header.motifGlobal,
      methodePrevue: header.methodePrevue,
      datePrevue: header.datePrevue,
      caissier_id: header.caissier_id,
      lignes: lignesToUse.map((l) => ({
 
        montant: Number(l.montant || 0),
      })),
    };

    console.log("👉 Payload décaissement envoyé au parent:", payload);

if (onSubmit) {
  await onSubmit(payload);
}

  };

  // —————————————————————————————————————
  // Animation
  // —————————————————————————————————————
  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 220,
        damping: 18,
      },
    }),
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        className="flex flex-col max-h-[75vh] w-full bg-gradient-to-br from-white via-[#F8F7FF] to-[#F3F1FF] rounded-2xl p-4 sm:p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] border border-[#E9E6FF]"
      >
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* En-tête */}
          <motion.div
            custom={0}
            variants={variants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {/* Motif global */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#472EAD] mb-1">
                Motif global du décaissement
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={header.motifGlobal}
                  onChange={(e) => updateHeader("motifGlobal", e.target.value)}
                  className={`pl-9 w-full rounded-xl border px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition ${
                    errors.motifGlobal ? "border-rose-400" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.motifGlobal && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.motifGlobal}
                </p>
              )}
            </div>
            {/* Caissier */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#472EAD] mb-1">
                Caissier assigné
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={
                    selectedCaissier
                      ? `${selectedCaissier.nom} ${selectedCaissier.prenom}`
                      : searchCaissier
                  }
                  onChange={(e) => {
                    setSelectedCaissier(null);
                    updateHeader("caissier_id", null);
                    setSearchCaissier(e.target.value);
                  }}
                  placeholder="Rechercher un caissier..."
                  className={`w-full rounded-xl border px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition ${
                    errors.caissier ? "border-rose-400" : "border-gray-300"
                  }`}
                />

                {loadingCaissiers && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#472EAD]" />
                )}
              </div>

              {errors.caissier && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.caissier}
                </p>
              )}

              {/* Dropdown résultats */}
              {caissiers.length > 0 && !selectedCaissier && (
                <div className="mt-1 border border-gray-200 rounded-xl bg-white shadow-md max-h-40 overflow-y-auto">
                  {caissiers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCaissier(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F5FF]"
                    >
                      {c.nom} {c.prenom}
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Méthode prévue */}
            <div>
              <label className="block text-sm font-semibold text-[#472EAD] mb-1">
                Méthode de paiement prévue
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <select
                  value={header.methodePrevue}
                  onChange={(e) => updateHeader("methodePrevue", e.target.value)}
                  className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
                >
                  <option>Espèces</option>
                  <option>Mobile Money</option>
                  <option>Virement</option>
                  <option>Chèque</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-[#472EAD] mb-1">
                Date prévu pour le décaissement
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input
                  type="date"
                  value={header.datePrevue}
                  onChange={(e) => updateHeader("datePrevue", e.target.value)}
                  className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
                />
              </div>
            </div>
          </motion.div>

          {/* Lignes */}
          <motion.div
            custom={1}
            variants={variants}
            className="border border-[#E0DEFF] rounded-2xl bg-white/70 px-3 py-3"
          >
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-[#472EAD]">
                Lignes de décaissement
              </h3>
              <p className="text-xs text-gray-500">
                Ajoutez une ou plusieurs lignes (factures, frais, etc.).
              </p>
            </div>

            {/* Brouillon d'ajout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">


              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Montant (FCFA)
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    value={draft.montant}
                    onChange={(e) => updateDraft("montant", e.target.value)}
                    className={`pl-9 w-full rounded-xl border px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] ${
                      errors.draft?.montant
                        ? "border-rose-400"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.draft?.montant && (
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    {errors.draft.montant}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleAddLigne}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#472EAD] text-white text-xs font-semibold hover:bg-[#5A3CF5] transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Ajouter la ligne
              </button>
            </div>

            {errors.lignes && (
              <p className="text-xs text-rose-600 mb-2">{errors.lignes}</p>
            )}
            {errors.editing && (
              <p className="text-xs text-rose-600 mb-2">{errors.editing}</p>
            )}

            {/* Tableau lignes */}
            <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs">
                <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
                  <tr>
 
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.length ? (
                    lignes.map((l) => {
                      const isEditing = editingId === l.id;

                      return (
                        <tr
                          key={l.id}
                          className="border-t border-gray-100 hover:bg-[#F9F9FF]"
                        >


                          <td className="px-3 py-2 text-right font-semibold">
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  value={editDraft.montant}
                                  onChange={(e) =>
                                    updateEditDraft("montant", e.target.value)
                                  }
                                  className="w-32 text-right border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#472EAD]/40 focus:border-[#472EAD]"
                                />
                                {errors.editDraft?.montant && (
                                  <p className="text-[11px] text-rose-600 mt-0.5 text-right">
                                    {errors.editDraft.montant}
                                  </p>
                                )}
                              </>
                            ) : (
                              `${Number(l.montant).toLocaleString("fr-FR")} FCFA`
                            )}
                          </td>

                          <td className="px-3 py-2 text-center">
                            {!isEditing ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(l)}
                                  className="p-1.5 rounded-md hover:bg-indigo-50 text-[#472EAD]"
                                  title="Modifier"
                                  disabled={editingId !== null}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLigne(l.id)}
                                  className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-700"
                                  title="Enregistrer"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-3 text-center text-gray-400"
                      >
                        Aucune ligne ajoutée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-3">
              <div className="bg-[#F9FAFF] border border-[#E4E0FF] rounded-xl px-4 py-2 text-xs flex items-center gap-3">
                <span className="text-gray-600">Montant total</span>
                <span className="font-bold text-[#472EAD] text-sm">
                  {total.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Boutons */}
        <motion.div
          custom={2}
          variants={variants}
          className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-200"
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white font-semibold bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Traitement...
              </>
            ) : (
              "Envoyer à la caisse"
            )}
          </button>
        </motion.div>
      </motion.div>

      {/* TOASTS */}
      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}

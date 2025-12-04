// ==========================================================
// 💸 DecaissementForm.jsx — Formulaire de Décaissement (LPD Manager)
// Version optimisée pour modal (hauteur réduite + scroll interne)
// ==========================================================

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Wallet,
  Calendar,
  FileText,
  CreditCard,
  PlusCircle,
  Trash2,
} from "lucide-react";

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
  });

  // Lignes détaillées (libellé + montant)
  const [lignes, setLignes] = useState(initial?.lignes || []);

  // Brouillon de ligne en cours
  const [draft, setDraft] = useState({
    libelle: "",
    montant: "",
  });

  const [errors, setErrors] = useState({});

  // —————————————————————————————————————
  // 🔧 Helpers
  // —————————————————————————————————————
  const updateHeader = (k, v) =>
    setHeader((h) => ({
      ...h,
      [k]: v,
    }));

  const updateDraft = (k, v) =>
    setDraft((d) => ({
      ...d,
      [k]: v,
    }));

  const total = useMemo(
    () => lignes.reduce((sum, l) => sum + Number(l.montant || 0), 0),
    [lignes]
  );

  // —————————————————————————————————————
  // ✅ Validation
  // —————————————————————————————————————
  const validate = () => {
    const e = {};

    if (!header.motifGlobal.trim())
      e.motifGlobal = "Le motif global est obligatoire.";
    if (!lignes.length)
      e.lignes =
        "Ajoutez au moins une ligne de décaissement (libellé + montant).";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateDraft = () => {
    const e = {};
    if (!draft.libelle.trim())
      e.libelle = "Le libellé de la ligne est obligatoire.";
    if (!draft.montant || Number(draft.montant) <= 0)
      e.montant = "Saisissez un montant valide (> 0).";
    return e;
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
      libelle: draft.libelle.trim(),
      montant: Number(draft.montant),
    };

    setLignes((prev) => [...prev, nouvelle]);
    setDraft({
      libelle: "",
      montant: "",
    });
  };

  const handleRemoveLigne = (id) => {
    setLignes((prev) => prev.filter((l) => l.id !== id));
  };

  // —————————————————————————————————————
  // 📤 Submit global
  // —————————————————————————————————————
  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      motifGlobal: header.motifGlobal,
      methodePrevue: header.methodePrevue,
      datePrevue: header.datePrevue,
      lignes: lignes.map((l) => ({
        libelle: l.libelle,
        montant: l.montant,
      })),
    };

    onSubmit(payload);
  };

  // —————————————————————————————————————
  // 🎬 Animation globale
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
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      // 🔽 IMPORTANT : taille max + scroll + padding réduit
      className="flex flex-col max-h-[75vh] w-full bg-gradient-to-br from-white via-[#F8F7FF] to-[#F3F1FF] rounded-2xl p-4 sm:p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] border border-[#E9E6FF]"
    >
      {/* Zone scrollable : en-tête + lignes */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* —————————————————————————————————— */}
        {/* 🧾 En-tête du décaissement        */}
        {/* —————————————————————————————————— */}
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
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={header.motifGlobal}
                onChange={(e) =>
                  updateHeader("motifGlobal", e.target.value)
                }
                placeholder="Ex : Règlement fournisseur, achat matériel, frais déplacement..."
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

          {/* Méthode prévue */}
          <div>
            <label className="block text-sm font-semibold text-[#472EAD] mb-1">
              Méthode de paiement prévue
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={header.methodePrevue}
                onChange={(e) =>
                  updateHeader("methodePrevue", e.target.value)
                }
                className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
              >
                <option>Espèces</option>
                <option>Mobile Money</option>
                <option>Virement</option>
                <option>Chèque</option>
              </select>
            </div>
          </div>

          {/* Date prévue */}
          <div>
            <label className="block text-sm font-semibold text-[#472EAD] mb-1">
              Date du décaissement
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="date"
                value={header.datePrevue}
                onChange={(e) => updateHeader("datePrevue", e.target.value)}
                className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
              />
            </div>
          </div>
        </motion.div>

        {/* —————————————————————————————————— */}
        {/* 🧾 Lignes de décaissement         */}
        {/* —————————————————————————————————— */}
        <motion.div
          custom={1}
          variants={variants}
          className="border border-[#E0DEFF] rounded-2xl bg-white/70 px-3 py-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-[#472EAD]">
                Lignes de décaissement
              </h3>
              <p className="text-xs text-gray-500">
                Ajoutez une ou plusieurs lignes (factures, frais, etc.).
              </p>
            </div>
          </div>

          {/* Ligne en cours (brouillon) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {/* Libellé */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                Libellé
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={draft.libelle}
                  onChange={(e) => updateDraft("libelle", e.target.value)}
                  placeholder="Ex : Facture PAPDISK N°F-2025-001"
                  className={`pl-9 w-full rounded-xl border px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] ${
                    errors.draft?.libelle
                      ? "border-rose-400"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {errors.draft?.libelle && (
                <p className="text-[11px] text-rose-600 mt-0.5">
                  {errors.draft.libelle}
                </p>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                Montant (FCFA)
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={draft.montant}
                  onChange={(e) => updateDraft("montant", e.target.value)}
                  placeholder="Ex : 20 000"
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

          {/* Erreur globale lignes */}
          {errors.lignes && (
            <p className="text-xs text-rose-600 mb-2">{errors.lignes}</p>
          )}

          {/* Tableau des lignes ajoutées */}
          <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Libellé</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length ? (
                  lignes.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-gray-100 hover:bg-[#F9F9FF]"
                    >
                      <td className="px-3 py-2">{l.libelle}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {Number(l.montant).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLigne(l.id)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
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

      {/* —————————————————————————————————— */}
      {/* Boutons d’action (non scrollables) */}
      {/* —————————————————————————————————— */}
      <motion.div
        custom={2}
        variants={variants}
        className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-200"
      >
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition active:scale-[0.98]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white font-semibold bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Traitement...
            </>
          ) : (
            "Valider la demande"
          )}
        </button>
      </motion.div>
    </motion.form>
  );
}

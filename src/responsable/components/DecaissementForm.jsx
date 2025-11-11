// ==========================================================
// 💸 DecaissementForm.jsx — Formulaire Premium de Décaissement
// Design animé, élégant et ergonomique (LPD Manager)
// ==========================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Wallet, Calendar, FileText, CreditCard } from "lucide-react";

export default function DecaissementForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial ?? {
      montant: "",
      motif: "",
      methode: "Espèces",
      date: new Date().toISOString().slice(0, 10),
    }
  );
  const [errors, setErrors] = useState({});

  // ——— Helpers
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.montant || form.montant <= 0) e.montant = "Veuillez saisir un montant valide";
    if (!form.motif.trim()) e.motif = "Le motif est obligatoire";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  };

  // ——— Animation globale
  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: "spring", stiffness: 220, damping: 18 },
    }),
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      className="space-y-5 bg-gradient-to-br from-white via-[#F8F7FF] to-[#F3F1FF] rounded-2xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] border border-[#E9E6FF]"
    >
      {/* Champ Montant */}
      <motion.div custom={0} variants={variants}>
        <label className="block text-sm font-semibold text-[#472EAD] mb-1">Montant à décaisser (FCFA)</label>
        <div className="relative">
          <Wallet className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="number"
            value={form.montant}
            onChange={(e) => update("montant", e.target.value)}
            placeholder="Ex : 50 000"
            className={`pl-9 w-full rounded-xl border px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm transition focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] ${
              errors.montant ? "border-rose-400" : "border-gray-300"
            }`}
          />
        </div>
        {errors.montant && <p className="text-xs text-rose-600 mt-1">{errors.montant}</p>}
      </motion.div>

      {/* Champ Méthode */}
      <motion.div custom={1} variants={variants}>
        <label className="block text-sm font-semibold text-[#472EAD] mb-1">Méthode de paiement</label>
        <div className="relative">
          <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <select
            value={form.methode}
            onChange={(e) => update("methode", e.target.value)}
            className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
          >
            <option>Espèces</option>
            <option>Mobile Money</option>
            <option>Virement</option>
          </select>
        </div>
      </motion.div>

      {/* Champ Motif */}
      <motion.div custom={2} variants={variants}>
        <label className="block text-sm font-semibold text-[#472EAD] mb-1">Motif du décaissement</label>
        <div className="relative">
          <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={form.motif}
            onChange={(e) => update("motif", e.target.value)}
            placeholder="Ex : Règlement fournisseur, achat matériel..."
            className={`pl-9 w-full rounded-xl border px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition ${
              errors.motif ? "border-rose-400" : "border-gray-300"
            }`}
          />
        </div>
        {errors.motif && <p className="text-xs text-rose-600 mt-1">{errors.motif}</p>}
      </motion.div>

      {/* Champ Date */}
      <motion.div custom={3} variants={variants}>
        <label className="block text-sm font-semibold text-[#472EAD] mb-1">Date du décaissement</label>
        <div className="relative">
          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
          />
        </div>
      </motion.div>

      {/* Boutons d’action */}
      <motion.div custom={4} variants={variants} className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition active:scale-[0.98]"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm text-white font-semibold bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition"
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

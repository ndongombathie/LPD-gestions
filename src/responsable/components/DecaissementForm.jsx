// ==========================================================
// 💸 DecaissementForm.jsx — Formulaire de Décaissement (LPD Manager)
// ✅ Version simplifiée : 1 décaissement = 1 montant
// ✅ Dropdown avec recherche frontend sur tous les caissiers
// ✅ Click outside pour fermer le dropdown
// ✅ Motif global trim() dans le payload
// ==========================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { decaissementsAPI } from "@/services/api";
import {
  Loader2,
  Wallet,
  Calendar,
  FileText,
  CreditCard,
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
  // 🧠 State principal simplifié
  // —————————————————————————————————————
  const [form, setForm] = useState({
    motifGlobal: initial?.motifGlobal || "",
    methodePrevue: initial?.methodePrevue || "Espèces",
    datePrevue: initial?.datePrevue || new Date().toISOString().slice(0, 10),
    caissier_id: initial?.caissier_id || null,
    montant: initial?.montant || ""
  });

  const [selectedCaissier, setSelectedCaissier] = useState(null);
  const [errors, setErrors] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [allCaissiers, setAllCaissiers] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ✅ Toasts (local)
  const [toasts, setToasts] = useState([]);
  const [searchCaissier, setSearchCaissier] = useState("");
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
  const updateForm = (k, v) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ✅ Chargement unique de tous les caissiers
  const loadAllCaissiers = async () => {
    if (hasLoaded) return;

    try {
      setLoadingCaissiers(true);
      const res = await decaissementsAPI.getAllCaissiers();
      setAllCaissiers(res || []);
      setHasLoaded(true);
    } finally {
      setLoadingCaissiers(false);
    }
  };

  useEffect(() => {
    if (initial?.caissier) {
      setSelectedCaissier(initial.caissier);
    }
  }, [initial]);

  // ✅ Click outside pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".caissier-combobox")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const selectCaissier = (c) => {
    updateForm("caissier_id", c.id);
    setSelectedCaissier(c);
    setSearchCaissier(`${c.nom} ${c.prenom}`);
  };

  // ✅ Filtrage frontend des caissiers
  const filteredCaissiers = allCaissiers.filter((c) =>
    `${c.nom} ${c.prenom}`
      .toLowerCase()
      .includes(searchCaissier.toLowerCase())
  );

  // —————————————————————————————————————
  // 📤 Submit simplifié avec trim sur le motif
  // —————————————————————————————————————
  const handleSubmit = async () => {
    if (submitting) return;

    const e = {};

    if (!form.motifGlobal.trim())
      e.motifGlobal = "Motif obligatoire.";

    if (!form.caissier_id)
      e.caissier = "Sélectionnez un caissier.";

    if (!form.montant || Number(form.montant) <= 0)
      e.montant = "Montant invalide (> 0).";

    setErrors(e);

    if (Object.keys(e).length) return;

    const payload = {
      motifGlobal: form.motifGlobal.trim(),
      methodePrevue: form.methodePrevue,
      datePrevue: form.datePrevue,
      caissier_id: form.caissier_id,
      montant: Number(form.montant.trim()),
    };

    console.log("👉 Payload décaissement simplifié:", payload);

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
                  value={form.motifGlobal}
                  onChange={(e) => updateForm("motifGlobal", e.target.value)}
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
            
            {/* Caissier - Version dropdown avec recherche frontend et click outside */}
            <div className="sm:col-span-2 relative caissier-combobox">
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
                  onClick={async () => {
                    setIsOpen(true);
                    await loadAllCaissiers();
                  }}
                  onChange={(e) => {
                    setSelectedCaissier(null);
                    updateForm("caissier_id", null);
                    setSearchCaissier(e.target.value);
                    setIsOpen(true);
                  }}
                  placeholder="Rechercher un caissier..."
                  className={`w-full rounded-xl border px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition ${
                    errors.caissier ? "border-rose-400" : "border-gray-300"
                  }`}
                />

                {/* Flèche dropdown */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsOpen((prev) => !prev);
                    await loadAllCaissiers();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {loadingCaissiers && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-9 top-1/2 -translate-y-1/2 text-[#472EAD]" />
                )}
              </div>

              {errors.caissier && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.caissier}
                </p>
              )}

              {/* Dropdown avec filtrage frontend */}
              {isOpen && (
                <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
                  {filteredCaissiers.length > 0 ? (
                    filteredCaissiers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selectCaissier(c);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F5FF]"
                      >
                        {c.nom} {c.prenom}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Aucun caissier trouvé
                    </div>
                  )}
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
                  value={form.methodePrevue}
                  onChange={(e) => updateForm("methodePrevue", e.target.value)}
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
                Date prévue pour le décaissement
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input
                  type="date"
                  value={form.datePrevue}
                  onChange={(e) => updateForm("datePrevue", e.target.value)}
                  className="pl-9 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-[#472EAD]/40 focus:border-[#472EAD] transition"
                />
              </div>
            </div>

            {/* Montant unique */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#472EAD] mb-1">
                Montant du décaissement (FCFA)
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  value={form.montant}
                  onChange={(e) => updateForm("montant", e.target.value)}
                  className={`pl-9 w-full rounded-xl border px-3 py-2 text-sm bg-white/60 ${
                    errors.montant ? "border-rose-400" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.montant && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.montant}
                </p>
              )}
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
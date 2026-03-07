// ==========================================================
// 💰 FondOuvertureModal.jsx — Modal de saisie du fond d'ouverture
// Permet au responsable de définir le fond de caisse initial
// pour un caissier sélectionné
// ==========================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Wallet, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Save
} from "lucide-react";


const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function FondOuvertureModal({
  employee,
  isOpen,
  onClose,
  onToast
}) {
  const [montant, setMontant] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const date = todayISO(); // Date du jour fixe

  // Réinitialiser le formulaire quand le modal s'ouvre avec un nouvel employé
  useEffect(() => {
    if (isOpen) {
      setMontant("");
      setErrors({});
    }
  }, [isOpen, employee]);

  const validateForm = () => {
    const newErrors = {};

    if (!montant) {
      newErrors.montant = "Le montant est obligatoire";
    } else {
      const montantNum = parseFloat(montant.replace(/\s/g, ""));
      if (isNaN(montantNum) || montantNum <= 0) {
        newErrors.montant = "Le montant doit être un nombre positif";
      } else if (montantNum > 10000000) {
        newErrors.montant = "Le montant ne peut pas dépasser 10 000 000 FCFA";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMontantChange = (e) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value === "" || /^\d+$/.test(value)) {
      setMontant(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      onToast("error", "Erreur", "Veuillez corriger les erreurs du formulaire");      return;
    }

    setLoading(true);

    try {
      // Simulation d'un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 800));

      const montantNum = parseFloat(montant);
      
      // Données à envoyer au backend (plus tard)
      const fondData = {
        caissierId: employee.id,
        caissierName: employee.name,
        montant: montantNum,
        date,
        type: "fond_ouverture",
        statut: "validé",
        saisiPar: "Responsable", // À remplacer par l'utilisateur connecté plus tard
        dateSaisie: new Date().toISOString(),
      };

      // Log des données pour le développement
      console.log("💰 Fond d'ouverture saisi :", fondData);

      // Afficher un toast de succès avec les détails
onToast(
  "success",
  "Fond d'ouverture enregistré",
  `${employee.name} • ${formatFCFA(montantNum)}`
);


      // Fermer le modal
      onClose();
    } catch (error) {
      onToast(
        "error",
        "Erreur",
        "Erreur lors de l'enregistrement du fond d'ouverture"
        );
      console.error("Erreur fond ouverture:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMontantAffichage = (value) => {
    if (!value) return "";
    try {
      return formatFCFA(value).replace("XOF", "").trim();
    } catch {
      return value;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#472EAD] to-[#5A3CF5] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Fond d'ouverture</h2>
                    <p className="text-xs text-white/80">Caisse • {employee?.name}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Montant <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={montant}                      onChange={handleMontantChange}
                      placeholder="Ex: 50000"
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] transition ${
                        errors.montant ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {errors.montant && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.montant}
                    </p>
                  )}
                  {montant && !errors.montant && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Montant saisi : {formatFCFA(montant)}
                    </p>
                  )}
                </div>

                {/* Date (fixe = aujourd'hui) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={date}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled={true}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Date du jour (non modifiable)
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#472EAD] hover:bg-[#3b2790] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>En cours...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Valider</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
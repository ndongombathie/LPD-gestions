// ==========================================================
// 💰 FondOuvertureModal.jsx — Modal de saisie du fond d'ouverture
// Permet au responsable de définir le fond de caisse initial
// Mode général (tous caissiers) ou spécifique (caissier sélectionné)
// ==========================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Wallet, 
  Calendar, 
  AlertCircle,
  DollarSign,
  Save,
  Loader2
} from "lucide-react";
import { journalResponsableAPI } from "@/responsable/services/api/JournalResponsable";
import { decaissementsAPI } from "@/responsable/services/api/decaissements";

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
  const [selectedCaissier, setSelectedCaissier] = useState(null);
  const [searchCaissier, setSearchCaissier] = useState("");
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [allCaissiers, setAllCaissiers] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingCaissiers, setLoadingCaissiers] = useState(false);
  
  // ✅ Mode général ou spécifique
  const isGeneralMode = !employee;
  
  const date = todayISO(); // Date du jour fixe

  // ✅ Chargement unique de tous les caissiers (même endpoint que DecaissementForm)
  const loadAllCaissiers = async () => {
    if (hasLoaded) return;

    try {
      setLoadingCaissiers(true);
      // Utilisation du même endpoint que dans DecaissementForm
      const res = await decaissementsAPI.getAllCaissiers();
      setAllCaissiers(res || []);
      setHasLoaded(true);
    } catch (error) {
      console.error("Erreur chargement caissiers:", error);
    } finally {
      setLoadingCaissiers(false);
    }
  };

  // ✅ Click outside pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".caissier-combobox")) {
        setIsOpenDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setMontant("");
      setErrors({});
      setSelectedCaissier(null);
      setSearchCaissier("");
      setIsOpenDropdown(false);
      
      // Si un employé est fourni (mode spécifique), on le sélectionne
      if (employee) {
        const caissierData = employee.caissier || employee;
        setSelectedCaissier(caissierData);
        setSearchCaissier(`${caissierData.prenom || ""} ${caissierData.nom || ""}`.trim());
      }
    }
  }, [isOpen, employee]);

  // ✅ Filtrage frontend des caissiers (comme dans DecaissementForm)
  const filteredCaissiers = allCaissiers.filter((c) =>
    `${c.nom || ""} ${c.prenom || ""}`
      .toLowerCase()
      .includes(searchCaissier.toLowerCase())
  );

  const selectCaissier = (c) => {
    setSelectedCaissier(c);
    setSearchCaissier(`${c.nom || ""} ${c.prenom || ""}`.trim());
    setIsOpenDropdown(false);
    // Effacer l'erreur si elle existe
    if (errors.caissier) {
      setErrors(prev => ({ ...prev, caissier: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation montant
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

    // Validation caissier en mode général
    if (isGeneralMode && !selectedCaissier) {
      newErrors.caissier = "Veuillez sélectionner un caissier";
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

  // ✅ handleSubmit adapté
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      onToast("error", "Erreur", "Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);

    try {
      const montantNum = parseFloat(montant);

      // 🔥 Déterminer l'ID du caissier (employee fourni ou caissier sélectionné)
      let caissierId = null;
      
      if (employee) {
        // Mode spécifique (via le tableau)
        caissierId = employee?.caissier?.id ?? employee?.id ?? null;
      } else {
        // Mode général (via le dropdown)
        caissierId = selectedCaissier?.id ?? null;
      }

      if (!caissierId) {
        throw new Error("Aucun caissier sélectionné");
      }

      await journalResponsableAPI.attribuerFondCaisse(
        caissierId,
        montantNum
      );

      // Nom du caissier pour le toast
      const caissierName = employee 
        ? `${employee?.caissier?.prenom || ""} ${employee?.caissier?.nom || ""}`.trim()
        : `${selectedCaissier?.prenom || ""} ${selectedCaissier?.nom || ""}`.trim();

      onToast(
        "success",
        "Fond d'ouverture enregistré",
        `${caissierName || "Caissier"} • ${formatFCFA(montantNum)}`
      );

      onClose();

    } catch (error) {
      onToast(
        "error",
        "Erreur",
        error?.response?.data?.message ||
        error?.message ||
        "Erreur lors de l'enregistrement du fond d'ouverture"
      );
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
              {/* Header corrigé */}
              <div className="bg-gradient-to-r from-[#472EAD] to-[#5A3CF5] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Fond d'ouverture</h2>
                    <p className="text-xs text-white/80">
                      {employee 
                        ? `Caisse • ${employee?.caissier?.prenom || ""} ${employee?.caissier?.nom || ""}`
                        : "Sélectionner un caissier"}
                    </p>
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
                {/* Sélection du caissier (uniquement en mode général) - MÊME DESIGN QUE DecaissementForm */}
                {isGeneralMode && (
                  <div className="relative caissier-combobox">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Caissier <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={
                          selectedCaissier
                            ? `${selectedCaissier.prenom || ""} ${selectedCaissier.nom || ""}`.trim()
                            : searchCaissier
                        }
                        onClick={async () => {
                          setIsOpenDropdown(true);
                          await loadAllCaissiers();
                        }}
                        onChange={(e) => {
                          setSelectedCaissier(null);
                          setSearchCaissier(e.target.value);
                          setIsOpenDropdown(true);
                        }}
                        placeholder="Rechercher un caissier..."
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] transition ${
                          errors.caissier ? "border-red-300 bg-red-50" : "border-gray-300"
                        }`}
                        disabled={loading}
                      />

                      {/* Flèche dropdown */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsOpenDropdown((prev) => !prev);
                          await loadAllCaissiers();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isOpenDropdown ? "rotate-180" : ""
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
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.caissier}
                      </p>
                    )}

                    {/* Dropdown avec filtrage frontend - MÊME DESIGN */}
                    {isOpenDropdown && (
                      <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                        {filteredCaissiers.length > 0 ? (
                          filteredCaissiers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCaissier(c)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7F5FF] border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium">{c.prenom} {c.nom}</div>
                              <div className="text-xs text-gray-500">{c.email}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-sm text-gray-500 text-center">
                            Aucun caissier trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Montant <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={montant}
                      onChange={handleMontantChange}
                      placeholder="Ex: 50000"
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] transition ${
                        errors.montant ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                      disabled={loading}
                      autoFocus={!isGeneralMode} // AutoFocus seulement si pas de dropdown
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
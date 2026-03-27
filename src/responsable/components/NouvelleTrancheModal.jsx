import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeDollarSign, Loader2, X } from "lucide-react";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function NouvelleTrancheModal({
  open,
  onClose,
  client,
  commandes = [],
  onSubmit,
  toast,
  lockedCommande = null,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [commandeId, setCommandeId] = useState("");
  const [searchCommande, setSearchCommande] = useState("");
  const [montant, setMontant] = useState("");
  const [isCommandeOpen, setIsCommandeOpen] = useState(false);
  const commandeInputRef = useRef(null);

  const commandesEligibles = useMemo(() => {
    if (lockedCommande) return [lockedCommande];

return (commandes || [])
  .map((c) => ({
    ...c,
    totalTTC: c.total ?? c.totalTTC ?? 0,
    montantPaye: c.montant_paye ?? c.montantPaye ?? 0,
    resteAPayer: c.reste_a_payer ?? c.resteAPayer ?? 0,
    montantAEncaisser:
      c.montant_a_encaisser ?? c.montantAEncaisser ?? null,
  }))
  .filter((c) => {
    if (c.statut === "annulee") return false;
    return Number(c.resteAPayer) > 0;
  });
  }, [commandes, lockedCommande]);

  const filteredCommandes = useMemo(() => {
    if (!searchCommande) return commandesEligibles;

    return commandesEligibles.filter((c) =>
      c.numero?.toUpperCase().includes(searchCommande.toUpperCase())
    );
  }, [searchCommande, commandesEligibles]);

useEffect(() => {
  if (!open) return;
  setIsCommandeOpen(false);
  if (lockedCommande) {
    setCommandeId(String(lockedCommande.id));
    setSearchCommande(lockedCommande.numero || "");
  } else {
    // ❌ Aucune sélection automatique
    setCommandeId("");
    setSearchCommande("");
  }

  setMontant("");
}, [open, lockedCommande]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".commande-combobox")) {
        setIsCommandeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commandeSelectionnee =
    commandesEligibles.find((c) => String(c.id) === String(commandeId)) || null;

  const isLockedMode = !!lockedCommande;

  const maxAutorise = Number(
    commandeSelectionnee?.resteAPayer ??
    commandeSelectionnee?.totalTTC ??
    0
  );

  const montantNumber = Number(montant);

  const isValid =
    Number.isFinite(montantNumber) &&
    montantNumber > 0 &&
    montantNumber <= maxAutorise;

  useEffect(() => {
    if (!isLockedMode) return;

    const handleKey = (e) => {
      if (e.key === "Escape" && !isValid) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLockedMode, isValid]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!commandeSelectionnee) {
      toast("error", "Commande invalide");
      return;
    }
    if (Number(commandeSelectionnee?.montantAEncaisser) > 0) {
      toast(
        "error",
        `Une tranche de ${formatFCFA(
          commandeSelectionnee.montantAEncaisser
        )} est déjà en cours de traitement à la caisse pour cette commande.`
      );
      return;
    }
    const m = Number(montant);
    if (!Number.isFinite(m) || m <= 0) {
      toast("error", "Montant invalide");
      return;
    }

    const maxAutorise = Number(
      commandeSelectionnee?.resteAPayer ??
      commandeSelectionnee?.totalTTC ??
      0
    );

    if (m > maxAutorise) {
      toast(
        "error",
        `Le montant ne peut pas dépasser ${formatFCFA(maxAutorise)}`
      );
      return;
    }

    setSubmitting(true);

    onSubmit(
      commandeSelectionnee,
      m,
      () => setSubmitting(false)
    );
  };

  if (!open) return null;

  const clientDisplay =
    client?.nom ||
    lockedCommande?.clientNom ||
    "Client spécial";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-4"
          onClick={() => {
            if (!isLockedMode) {
              onClose();
            } else if (isValid) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#472EAD] px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="w-5 h-5 text-white" />
                  <h2 className="text-base font-semibold text-white">
                    Nouvelle tranche — {clientDisplay}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    if (!isLockedMode) {
                      onClose();
                    } else if (isValid) {
                      onClose();
                    }
                  }}
                  disabled={isLockedMode && !isValid}
                  className={`text-white/80 hover:text-white transition-colors ${
                    isLockedMode && !isValid ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              {commandesEligibles.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Aucune commande avec reste à payer.
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                  {/* BLOC COMMANDE */}
                  {!lockedCommande && (
                    <div className="relative commande-combobox">
                      <label className="block text-xs text-gray-500 mb-1">
                        Commande
                      </label>

                      <div className="relative">
                        <input
                          ref={commandeInputRef}
                          type="text"
                          value={searchCommande}
                          onClick={() => setIsCommandeOpen(true)}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setSearchCommande(value);
                            setCommandeId("");
                            setIsCommandeOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();

                              const term = searchCommande.trim().toUpperCase();
                              if (!term) return;

                              const match = commandesEligibles.find(
                                (c) => (c.numero || "").toUpperCase() === term
                              );

                              if (!match) {
                                toast("error", "Commande introuvable");
                                return;
                              }

                              setCommandeId(String(match.id));
                              setSearchCommande(match.numero);
                              setIsCommandeOpen(false);
                            }
                          }}
                          placeholder="Scanner ou rechercher une commande..."
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] outline-none text-sm"
                        />

                        {/* Chevron */}
                        <button
                          type="button"
                          onClick={() => setIsCommandeOpen(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              isCommandeOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Dropdown */}
                      {isCommandeOpen && (
                        <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
                          {filteredCommandes.length > 0 ? (
                          filteredCommandes.map((c) => {
                            const isEnCours = Number(c.montantAEncaisser || 0) > 0;

                            return (
                              <button
                                key={c.id}
                                type="button"
                                disabled={isEnCours}
                                onClick={() => {
                                  if (isEnCours) return;
                                  setCommandeId(String(c.id));
                                  setSearchCommande(c.numero);
                                  setIsCommandeOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition
                                  ${
                                    isEnCours
                                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                                      : "hover:bg-[#F7F5FF]"
                                  }
                                `}
                              >
                                <div className="flex justify-between items-center font-medium">
                                  <span>{c.numero}</span>

                                  {isEnCours && (
                                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                                      Tranche en cours
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-gray-500">
                                  Reste : {formatFCFA(c.resteAPayer)}
                                </div>
                              </button>
                            );
                          })
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Aucune commande trouvée
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bloc résumé commande */}
                  {commandeSelectionnee && (
                    <div className="bg-[#F9FAFF] border border-[#E4E0FF] rounded-xl p-3 text-xs">
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <span className="text-gray-500 block">Commande</span>
                          <span className="font-semibold text-[#472EAD] text-sm">
                            #{commandeSelectionnee.numero}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Total TTC</span>
                          <span className="font-semibold text-sm">
                            {formatFCFA(commandeSelectionnee.totalTTC)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Déjà payé</span>
                          <span className="font-semibold text-emerald-600 text-sm">
                            {formatFCFA(commandeSelectionnee.montantPaye)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-700 text-xs">Reste à payer</span>
                        <span className="font-bold text-rose-600 text-sm">
                          {formatFCFA(
                            commandeSelectionnee?.resteAPayer ??
                            commandeSelectionnee?.totalTTC ??
                            0
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Montant uniquement */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Montant à envoyer à la caisse
                      </label>
                      <input
                        type="number"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] outline-none transition-all text-sm"
                      />
                      
                      {/* Helper montant */}
                      {commandeSelectionnee && (
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="text-xs text-gray-500">
                            Maximum autorisé :{" "}
                            <span className="font-semibold">
                              {formatFCFA(
                                commandeSelectionnee?.resteAPayer ??
                                commandeSelectionnee?.totalTTC ??
                                0
                              )}
                            </span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setMontant(String(commandeSelectionnee?.resteAPayer ?? commandeSelectionnee?.totalTTC ?? 0))} 
                            className="text-xs text-[#472EAD] font-medium hover:underline text-left"
                          >
                            Saisir le montant total restant
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      Number(montant) <= 0 ||
                      Number(montant) >
                        Number(
                          commandeSelectionnee?.resteAPayer ??
                          commandeSelectionnee?.totalTTC ??
                          0
                        )
                    }
                    className="w-full bg-[#472EAD] text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#3a2590] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      "Envoyer à la caisse"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
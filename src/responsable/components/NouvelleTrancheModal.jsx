import React, { useEffect, useMemo, useState } from "react";
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
  const [montant, setMontant] = useState("");

  const commandesEligibles = useMemo(() => {
    if (lockedCommande) return [lockedCommande];

    return (commandes || []).filter((c) => {
      if (c.statut === "annulee") return false;
      return Number(c.resteAPayer || 0) > 0;
    });
  }, [commandes, lockedCommande]);

  useEffect(() => {
    if (!open) return;

    if (lockedCommande) {
      setCommandeId(String(lockedCommande.id));
    } else if (commandesEligibles.length > 0) {
      setCommandeId(String(commandesEligibles[0].id));
    } else {
      setCommandeId("");
    }

    setMontant("");
  }, [open, lockedCommande]); // ✅ commandesEligibles retiré des dépendances

  const commandeSelectionnee =
    commandesEligibles.find((c) => String(c.id) === String(commandeId)) || null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!commandeSelectionnee) {
      toast("error", "Commande invalide");
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

    // ✅ onSubmit reçoit maintenant (commande, montant, callback)
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
          onClick={onClose}
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
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
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
                  {/* Sélection commande */}
                  {!lockedCommande && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Commande
                      </label>
                      <select
                        value={commandeId}
                        onChange={(e) => setCommandeId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] outline-none transition-all text-sm"
                      >
                        {commandesEligibles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.numero} — Reste : {formatFCFA(c.resteAPayer)}
                          </option>
                        ))}
                      </select>
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
                            onClick={() =>
                              setMontant(
                                String(
                                  commandeSelectionnee?.resteAPayer ??
                                  commandeSelectionnee?.totalTTC ??
                                  0
                                )
                              )
                            }
                            className="text-xs text-[#472EAD] font-medium hover:underline text-left"
                          >
                            Saisir le montant total restant
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit - Texte modifié pour plus de clarté */}
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
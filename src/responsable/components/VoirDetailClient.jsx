// src/responsable/components/VoirDetailClient.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  BadgeDollarSign, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { useCommandesClientSpecial } from "@/hooks/useCommandesClientSpecial";
import { formatFCFA, getPaiementEffectiveStatus } from "@/utils/formatUtils";
import HistoriqueCommandes from "./HistoriqueCommandes";
import HistoriquePaiements from "./HistoriquePaiements";
import { clientsAPI } from "@/services/api/clients";
import { useHistoriqueEncaissementsClient } from "@/hooks/useHistoriqueEncaissementsClient";

// === COMPOSANTS INTERNES PREMIUM ===

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-500 rounded-full border-t-transparent animate-spin" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-sm text-gray-500">
        <span>Chargement des données</span>
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
        </span>
      </div>

      <p className="mt-1 text-xs text-gray-400">
        Préparation des informations client
      </p>
    </div>
  );
};

const StatCard = ({ value, label, icon: Icon, color = "violet" }) => {
  const colors = {
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      shadow: "shadow-violet-100/50"
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      shadow: "shadow-emerald-100/50"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      shadow: "shadow-amber-100/50"
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      shadow: "shadow-rose-100/50"
    }
  };

  const theme = colors[color];

  return (
    <div
      className={`relative bg-white border ${theme.border} rounded-xl p-4 shadow-lg ${theme.shadow} transition-all duration-200 cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1 truncate">
            {label}
          </p>
          <p className={`text-lg font-bold ${theme.text} truncate`}>
            {value}
          </p>
        </div>
        <div className={`p-2.5 ${theme.bg} rounded-xl ml-2 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${theme.text}`} />
        </div>
      </div>
      
      <div className={`absolute bottom-0 left-3 right-3 h-0.5 ${theme.bg} rounded-full opacity-50`} />
    </div>
  );
};

const ChoiceCard = ({ 
  title, 
  icon: Icon, 
  mainNumber, 
  stats, 
  color = "violet", 
  onClick 
}) => {
  const colors = {
    violet: {
      border: "border-violet-200",
      hoverBorder: "hover:border-violet-300",
      bg: "bg-violet-50",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-700",
      textColor: "text-violet-800",
      shadow: "shadow-violet-100/50"
    },
    emerald: {
      border: "border-emerald-200",
      hoverBorder: "hover:border-emerald-300",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      textColor: "text-emerald-800",
      shadow: "shadow-emerald-100/50"
    }
  };

  const theme = colors[color];

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative w-full text-left bg-white border-2 ${theme.border} ${theme.hoverBorder} rounded-xl p-4 shadow-lg ${theme.shadow} hover:shadow-xl transition-all duration-200 group cursor-pointer overflow-hidden`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 ${theme.iconBg} rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200 relative`}>
          <Icon className={`w-5 h-5 ${theme.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-base font-semibold ${theme.textColor} flex items-center gap-2`}>
              {title}
            </h3>
            <span className={`text-2xl font-bold ${theme.textColor} mr-2`}>
              {mainNumber}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">{stat.label}</span>
                <span className={`text-sm font-bold ${theme.textColor} truncate max-w-[120px]`}>
                  {stat.value}
                </span>
                {idx < stats.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <ChevronRight className={`w-5 h-5 ${theme.iconColor} opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1 flex-shrink-0 self-center`} />
      </div>

      {/* Indicateur visuel de cliquabilité */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </motion.button>
  );
};

// === COMPOSANT PRINCIPAL ===

export default function VoirDetailClient({
  open,
  onClose,
  client,
  onEditTranche,
  onDeleteTranche,
}) {
  if (!open || !client) return null;

  const safeOnEditTranche = onEditTranche || (() => {});
  const safeOnDeleteTranche = onDeleteTranche || (() => {});

  // États
  const [page, setPage] = useState(1);
  const [clientStats, setClientStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchInputCmd, setSearchInputCmd] = useState("");
  const [searchCmd, setSearchCmd] = useState("");
  const [statutCmd, setStatutCmd] = useState("tous");
  const [mode, setMode] = useState("choice");
  const [filterType, setFilterType] = useState("tous");
  const [searchDate, setSearchDate] = useState("");
  const [searchCommandePay, setSearchCommandePay] = useState("");
  const [trancheToDelete, setTrancheToDelete] = useState(null);
  const [trancheToEdit, setTrancheToEdit] = useState(null);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [editForm, setEditForm] = useState({
    montant: "",
    date: "",
    mode: "",
    commentaire: "",
  });

  // Hook des commandes
  const {
    commandes: commandesClient,
    stats,
    totalPages,
    loading: commandesLoading,
  } = useCommandesClientSpecial({
    clientId: client.id,
    page,
    per_page: 10,
    search: searchCmd,
    statut: statutCmd,
    date_debut: dateDebut,
    date_fin: dateFin,
  });

  const commandesList = commandesClient ?? [];

  const {
  encaissements,
  loading: encaissementsLoading,
} = useHistoriqueEncaissementsClient({
  clientId: client.id,
  search: searchCommandePay,
  mode: filterType,
  date_debut: dateDebut,
  date_fin: dateFin,
});
  

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearchCmd(searchInputCmd);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInputCmd]);

  // Chargement des stats avec nettoyage pour éviter les appels sur composant démonté
  useEffect(() => {
    if (!open || !client?.id) return;

    let mounted = true;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await clientsAPI.getStatsClient(client.id);

        if (mounted) {
          setClientStats(data);
        }
      } catch (error) {
        console.error("Erreur chargement stats client", error);
        if (mounted) {
          toast.error("Impossible de charger les statistiques du client");
        }
      } finally {
        if (mounted) {
          setStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [open, client?.id]);

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setMode("choice");
      setSearchInputCmd("");
      setFilterType("tous");
      setSearchDate("");
      setSearchCommandePay("");
      setTrancheToDelete(null);
      setTrancheToEdit(null);
      setEditForm({ montant: "", date: "", mode: "", commentaire: "" });
      setPage(1);
      setSearchCmd("");
      setStatutCmd("tous");

      // RESET FILTRE PÉRIODE
      setDateDebut("");
      setDateFin("");
    }
  }, [open, client]);

  // Calcul des stats résumées
  const summary = useMemo(() => {
    const totalTTC = Number(clientStats?.totalTTC ?? 0);
    const totalPaye = Number(clientStats?.totalPaye ?? 0);
    const detteTotale = Number(clientStats?.dette ?? 0);
    const nbCommandes = Number(clientStats?.nb ?? 0);

    const paiementsPage = commandesList.flatMap((cmd) => cmd.paiements || []);
    // On compte tous les paiements, pas seulement ceux payés
    const nbPaiements = paiementsPage.length;

    const tranchesEnAttente = paiementsPage.filter(
      (p) =>
        p.type_paiement === "tranche" &&
        getPaiementEffectiveStatus(p) === "en_attente_caisse"
    );

    return {
      nbCommandes,
      totalTTC,
      totalPaye,
      detteTotale,
      nbPaiements,
      totalEncaisse: totalPaye,
      nbTranchesEnAttente: tranchesEnAttente.length,
      montantTranchesEnAttente: tranchesEnAttente.reduce(
        (s, p) => s + Number(p.montant || 0),
        0
      ),
    };
  }, [clientStats, commandesList]);

  // État de chargement global pour l'UX
  const isLoading = statsLoading || commandesLoading;

  // Handlers
  const handleOpenEditTranche = useCallback((cmd, paiement) => {
    if (
      cmd.statut !== "en_attente_caisse" &&
      cmd.statut !== "partiellement_payee"
    ) {
      toast.error("Cette tranche ne peut plus être modifiée.");
      return;
    }

    const effectiveStatus = getPaiementEffectiveStatus(paiement);
    if (effectiveStatus !== "en_attente_caisse") {
      toast.error("Cette tranche ne peut plus être modifiée.");
      return;
    }

    setTrancheToEdit({ cmd, paiement });
    setEditForm({
      montant: paiement?.montant != null ? String(paiement.montant) : "",
      date: paiement?.date_paiement || "",
      mode: paiement?.mode_paiement || "",
      commentaire: paiement?.commentaire || "",
    });
  }, []);

  const handleConfirmEditTranche = useCallback(async () => {
    if (!trancheToEdit) return;
    const { cmd, paiement } = trancheToEdit;

    const effectiveStatus = getPaiementEffectiveStatus(paiement);
    if (effectiveStatus !== "en_attente_caisse") {
      toast.error("Cette tranche a déjà été traitée en caisse.");
      setTrancheToEdit(null);
      return;
    }

    const updatedPaiement = {
      ...paiement,
      montant: editForm.montant === "" ? paiement.montant : Number(editForm.montant),
      date_paiement: editForm.date || paiement.date_paiement,
      mode_paiement: editForm.mode !== "" ? editForm.mode : paiement.mode_paiement ?? "",
      commentaire: editForm.commentaire !== "" ? editForm.commentaire : paiement.commentaire || "",
    };

    try {
      await Promise.resolve(safeOnEditTranche(cmd, updatedPaiement));
      toast.success("Tranche mise à jour");
      setTrancheToEdit(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  }, [trancheToEdit, editForm, safeOnEditTranche]);

  const handleAskDeleteTranche = useCallback((cmd, paiement) => {
    setTrancheToDelete({ cmd, paiement });
  }, []);

  const handleConfirmDeleteTranche = useCallback(async () => {
    if (!trancheToDelete) return;

    const effectiveStatus = getPaiementEffectiveStatus(trancheToDelete.paiement);
    if (effectiveStatus !== "en_attente_caisse") {
      toast.error("Cette tranche ne peut plus être supprimée.");
      setTrancheToDelete(null);
      return;
    }

    try {
      await Promise.resolve(
        safeOnDeleteTranche(trancheToDelete.cmd, trancheToDelete.paiement)
      );
      toast.success("Tranche supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
    setTrancheToDelete(null);
  }, [trancheToDelete, safeOnDeleteTranche]);

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
        >
          {/* Header sticky */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-xl">
            <div className="flex items-center gap-4 min-w-0">
              {mode !== "choice" && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setMode("choice")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
              )}
              
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Client spécial</div>

                <div className="text-base font-semibold text-gray-900 truncate">
                  {client.nom} {client.prenom}
                </div>

                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 truncate">
                  Téléphone : {client.telephone || "—"}
                </div>

                <div className="text-xs text-gray-400 truncate">
                  {client.adresse || "—"}
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* ÉCRAN DE CHOIX */}
              {mode === "choice" && (
                <motion.div
                  key="choice"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      {/* Section des stats (non cliquables) */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Aperçu
                          </span>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <StatCard
                            label="Commandes"
                            value={summary.nbCommandes}
                            icon={Receipt}
                            color="violet"
                          />
                          <StatCard
                            label="Total TTC"
                            value={formatFCFA(summary.totalTTC)}
                            icon={BadgeDollarSign}
                            color="emerald"
                          />
                          <StatCard
                            label="Payé"
                            value={formatFCFA(summary.totalPaye)}
                            icon={CheckCircle2}
                            color="emerald"
                          />
                          <StatCard
                            label="Dette"
                            value={formatFCFA(summary.detteTotale)}
                            icon={AlertCircle}
                            color={summary.detteTotale > 0 ? "rose" : "emerald"}
                          />
                        </div>
                      </div>

                      {/* Section des actions (cliquables) */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Navigation
                          </span>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        
                        <div className="space-y-3">
                          <ChoiceCard
                            title="Commandes"
                            icon={Receipt}
                            mainNumber={summary.nbCommandes}
                            color="violet"
                            stats={[
                              { label: "Dette", value: formatFCFA(summary.detteTotale) },
                            ]}
                            onClick={() => {
                              setPage(1);
                              setMode("commandes");
                            }}
                          />

                          <ChoiceCard
                            title="Paiements"
                            icon={CreditCard}
                            mainNumber={summary.nbPaiements}
                            color="emerald"
                            stats={[
                              { label: "Encaissé", value: formatFCFA(summary.totalPaye) },

                            ]}
                            onClick={() => {
                              setPage(1);
                              setMode("paiements");
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* VUE COMMANDES */}
              {mode === "commandes" && (
                <motion.div
                  key="commandes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <HistoriqueCommandes
                    client={client}
                    commandes={commandesList}
                    loading={commandesLoading}
                    totalPages={totalPages}
                    page={page}
                    onPageChange={setPage}
                    searchInput={searchInputCmd}
                    onSearchChange={setSearchInputCmd}
                    statutCmd={statutCmd}
                    onStatutChange={setStatutCmd}
                    dateDebut={dateDebut}
                    dateFin={dateFin}
                    setDateDebut={setDateDebut}
                    setDateFin={setDateFin}
                  />
                </motion.div>
              )}

              {/* VUE PAIEMENTS */}
              {mode === "paiements" && (
                <motion.div
                  key="paiements"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                <HistoriquePaiements
                  encaissements={encaissements}
                  loading={encaissementsLoading}
                  filterType={filterType}
                  onFilterTypeChange={setFilterType}
                  searchInput={searchCommandePay}
                  onSearchChange={setSearchCommandePay}
                  dateDebut={dateDebut}
                  dateFin={dateFin}
                  setDateDebut={setDateDebut}
                  setDateFin={setDateFin}
                />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* MODALES DE CONFIRMATION */}
      <AnimatePresence>
        {trancheToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-base font-semibold text-gray-900">
                  Supprimer la tranche ?
                </p>
              </div>
              
              <p className="text-sm text-gray-500 mb-5">
                Cette action est irréversible.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setTrancheToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDeleteTranche}
                  className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {trancheToEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2150] flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Edit2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Modifier la tranche
                  </h3>
                  <p className="text-sm text-gray-500">
                    Commande {trancheToEdit.cmd.numero}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editForm.montant}
                    onChange={(e) =>
                      setEditForm({ ...editForm, montant: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                    placeholder="Saisir le montant"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Mode de paiement
                  </label>
                  <select
                    value={editForm.mode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, mode: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 bg-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="especes">Espèces</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setTrancheToEdit(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmEditTranche}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/30"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#1f2937",
            fontSize: "0.875rem",
            padding: "10px 16px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)",
            border: "1px solid #f0f0f0",
          },
        }}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
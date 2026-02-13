// src/responsable/components/VoirDetailClient.jsx

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ListChecks, BadgeDollarSign, Edit2, Trash2, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ✅ CORRECTION 1 — IMPORTER LE NOUVEAU HOOK
import { useCommandesClientSpecial } from "@/hooks/useCommandesClientSpecial";

// 🔢 Format Montants FCFA (sans fichier utils/format)
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n ?? 0));

// 🎨 Couleurs pour les statuts de commandes
const getCommandeStatusClasses = (statut) => {
  if (!statut) return "bg-gray-100 text-gray-600";

  const s = String(statut).toLowerCase();

  if (s === "annulee") return "bg-red-50 text-red-700";
  if (s === "en_attente_caisse" || s === "partiellement_payee")
    return "bg-amber-50 text-amber-700";
  if (s === "soldee")
    return "bg-emerald-50 text-emerald-700";

  return "bg-gray-100 text-gray-600";
};

// 🧠 Statut "effectif" d'un paiement - CORRIGÉ (lecture directe depuis Laravel)
const getPaiementEffectiveStatus = (paiement) =>
  String(paiement?.statut_paiement || "inconnu").toLowerCase();

// 🎨 Couleurs pour les statuts de paiements / tranches - CORRIGÉ
const getPaiementStatusClasses = (statut) => {
  if (!statut || statut === "inconnu") return "bg-gray-100 text-gray-600";

  const s = String(statut).toLowerCase();

  // CORRECTION : utilisation des vrais statuts Laravel
  if (s === "en_attente_caisse") return "bg-amber-50 text-amber-700"; // 🟠
  if (s === "annulee") return "bg-red-50 text-red-700"; // 🔴
  if (s === "payee") return "bg-emerald-50 text-emerald-700"; // 🟢

  return "bg-gray-100 text-gray-600";
};

export default function VoirDetailClient({
  open,
  onClose,
  client,
  commandes = [],
  onEditTranche,
  onDeleteTranche,
}) {
  if (!open || !client) return null;

  const safeOnEditTranche = onEditTranche || (() => {});
  const safeOnDeleteTranche = onDeleteTranche || (() => {});

  // ✅ CORRECTION 2 — AJOUTER LES STATES COMMANDES
  const [page, setPage] = useState(1);
  const [searchInputCmd, setSearchInputCmd] = useState("");
  const [searchCmd, setSearchCmd] = useState("");
  const [statutCmd, setStatutCmd] = useState("tous");

  // ✅ CORRECTION 4 — UTILISER LE HOOK BACKEND
  const {
    commandes: commandesClient,
    stats,
    totalPages,
    loading: commandesLoading,
  } = useCommandesClientSpecial({
    clientId: client.id,
    page,
    perPage: 10,
    search: searchCmd,
    statut: statutCmd,
    toast,
  });

  const commandesList = commandesClient || [];


  // ✅ CORRECTION 5 — REMPLACER commandesList  const commandesList = commandesClient;
  // 🧭 Mode : "choice" | "commandes" | "paiements"
  const [mode, setMode] = useState("choice");

  // 🔎 Filtres pour la vue commandes
   // toutes | payees | attente_caisse | annulees
// recherche par ID / numéro / QR dans la carte commandes

  // 🔎 Filtres pour la vue paiements
  const [filterType, setFilterType] = useState("tous"); // tous | tranches | paiements | annules
  const [searchDate, setSearchDate] = useState("");
  const [searchCommandePay, setSearchCommandePay] = useState(""); // recherche par ID / numéro / QR dans la carte paiements

  // 🗑️ Tranche sélectionnée pour confirmation de suppression
  const [trancheToDelete, setTrancheToDelete] = useState(null); // { cmd, paiement }

  // ✏️ Tranche sélectionnée pour édition
  const [trancheToEdit, setTrancheToEdit] = useState(null); // { cmd, paiement }

  // 📝 Formulaire d'édition de tranche
  const [editForm, setEditForm] = useState({
    montant: "",
    date: "",
    mode: "",
    commentaire: "",
  });

  // 👉 Est-ce qu'on a déjà au moins un paiement pour ce client ?
  const hasAtLeastOnePaiement = useMemo(
    () => commandesList.some((cmd) => (cmd.paiements || []).length > 0),
    [commandesList]
  );

  // 🌀 État de chargement pour la vue paiements & tranches
  const [paiementsLoading, setPaiementsLoading] = useState(false);

  // ✅ CORRECTION 3 — AJOUTER LE DEBOUNCE RECHERCHE
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearchCmd(searchInputCmd);
    }, 1000);

    return () => clearTimeout(t);
  }, [searchInputCmd]);

  // À chaque ouverture / changement de client → reset
  useEffect(() => {
    if (open) {
      setMode("choice");
      setSearchInputCmd("");      
      setFilterType("tous");
      setSearchDate("");
      setSearchCommandePay("");
      setTrancheToDelete(null);
      setTrancheToEdit(null);
      setEditForm({
        montant: "",
        date: "",
        mode: "",
        commentaire: "",
      });
      setPaiementsLoading(false);
      setPage(1);
      setSearchInputCmd("");
      setSearchCmd("");
      setStatutCmd("tous");
    }
  }, [open, client]);

  // 🎯 Gestion du "chargement" pour la vue paiements
  useEffect(() => {
    let timer;
    if (mode === "paiements") {
      if (!hasAtLeastOnePaiement) {
        setPaiementsLoading(true);
        timer = setTimeout(() => {
          setPaiementsLoading(false);
        }, 5000);
      } else {
        setPaiementsLoading(false);
      }
    } else {
      setPaiementsLoading(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [mode, hasAtLeastOnePaiement]);



  // 🧠 Adaptation automatique du filtre de paiements en fonction de la recherche (ID / numéro / QR)
  useEffect(() => {
    const q = (searchCommandePay || "").trim().toLowerCase();
    if (!q) return;

    const matches = commandesList.filter((cmd) => {
      const haystack = [
        cmd.id,
        cmd.numero,
        cmd.reference,
        cmd.codeCommande,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    if (matches.length === 1) {
      const cmd = matches[0];
      const paiements = cmd.paiements || [];
      if (!paiements.length) return;

      let hasPayee = false;
      let hasAttente = false;
      let hasAnnule = false;

      for (const p of paiements) {
        const status = getPaiementEffectiveStatus(p);

        if (status === "annulee") {
          hasAnnule = true;
        } else if (status === "en_attente_caisse") {
          hasAttente = true;
        } else if (status === "payee") {
          hasPayee = true;
        }
      }

      if (hasPayee && !hasAttente && !hasAnnule) {
        setFilterType("paiements");
      } else if (hasAttente && !hasPayee && !hasAnnule) {
        setFilterType("tranches");
      } else if (hasAnnule && !hasPayee && !hasAttente) {
        setFilterType("annules");
      } else {
        setFilterType("tous");
      }
    }
  }, [searchCommandePay, commandesList]);

const summary = useMemo(() => {
  const totalTTC = Number(stats?.totalTTC ?? 0);
  const totalPaye = Number(stats?.totalPaye ?? 0);
  const detteTotale = Number(stats?.dette ?? 0);

  // infos locales uniquement pour affichage UX
  const nbCommandes = Number(stats?.nb ?? 0);

  // Paiements visibles (optionnel UI)
// uniquement indicatif sur la page affichée
    const paiementsPage = commandesList.flatMap(
      (cmd) => cmd.paiements || []
    );


    const nbPaiements = paiementsPage.filter(
      (p) => getPaiementEffectiveStatus(p) === "payee"
    ).length;

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
}, [stats, commandesList]);


  // 🔧 handlers – ÉDITION
  const handleOpenEditTranche = (cmd, paiement) => {
    if (
      cmd.statut !== "en_attente_caisse" &&
      cmd.statut !== "partiellement_payee"
    ) {
      toast.error("Cette tranche ne peut plus être modifiée.");
      return;
    }

    // ✅ VÉRIFICATION DU STATUT DE LA TRANCHE ELLE-MÊME
    const effectiveStatus = getPaiementEffectiveStatus(paiement);

    if (effectiveStatus !== "en_attente_caisse") {
      toast.error("Cette tranche ne peut plus être modifiée.");
      return;
    }

    const dateValue = paiement?.date_paiement || "";
    const modeValue = paiement?.mode_paiement || "";
    const commentaireValue = paiement?.commentaire || "";

    setTrancheToEdit({ cmd, paiement });
    setEditForm({
      montant:
        paiement && paiement.montant != null ? String(paiement.montant) : "",
      date: dateValue,
      mode: modeValue,
      commentaire: commentaireValue,
    });
  };

  const handleChangeEditField = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelEditTranche = () => {
    setTrancheToEdit(null);
    setEditForm({
      montant: "",
      date: "",
      mode: "",
      commentaire: "",
    });
  };

  const handleConfirmEditTranche = async () => {
    if (!trancheToEdit) return;

    const { cmd, paiement } = trancheToEdit;

    // ✅ VÉRIFICATION DE DERNIÈRE SECONDE : statut toujours "en_attente_caisse"
    const effectiveStatus = getPaiementEffectiveStatus(paiement);

    if (effectiveStatus !== "en_attente_caisse") {
      toast.error("Cette tranche a déjà été traitée en caisse.");
      setTrancheToEdit(null);
      return;
    }

    const updatedPaiement = {
      ...paiement,
      montant:
        editForm.montant === "" ? paiement.montant : Number(editForm.montant),
      date_paiement: editForm.date || paiement.date_paiement,
      mode_paiement:
        editForm.mode !== ""
          ? editForm.mode
          : paiement.mode_paiement ?? "",
      // ✅ CORRECTION 2 : Utiliser getPaiementEffectiveStatus pour conserver le statut exact
      commentaire:
        editForm.commentaire !== ""
          ? editForm.commentaire
          : paiement.commentaire || "",
    };

    try {
      await Promise.resolve(safeOnEditTranche(cmd, updatedPaiement));
      toast.success("Tranche mise à jour (en attente caisse)");
      setTrancheToEdit(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la tranche");
    }
  };

  // 🔧 handlers – SUPPRESSION
  const handleAskDeleteTranche = (cmd, paiement) => {
    setTrancheToDelete({ cmd, paiement });
  };

  const handleConfirmDeleteTranche = async () => {
    if (!trancheToDelete) return;

    // ✅ VÉRIFICATION DE DERNIÈRE SECONDE : statut toujours "en_attente_caisse"
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
      toast.success("Tranche supprimée (en attente caisse)");
    } catch (error) {
      toast.error("Erreur lors de la suppression de la tranche");
    }

    setTrancheToDelete(null);
  };

  const handleCancelDeleteTranche = () => {
    setTrancheToDelete(null);
  };

  // ====== VUE A : HISTORIQUE DES COMMANDES (sans détails de paiements) ======
  const renderCommandesView = () => {
    // ✅ CORRECTION 9 — LOADING (optionnel mais propre)
    if (commandesLoading) {
      return (
        <div className="text-center text-xs text-gray-500 py-12">
          Chargement des commandes...
        </div>
      );
    }

    if (commandesList.length === 0) {
      return (
        <div className="text-center text-xs text-gray-500 py-12">
          Aucune commande enregistrée pour ce client.
        </div>
      );
    }


    // ✅ CORRECTION 8 — SUPPRIMER LE FILTRAGE FRONTEND
    const filteredCommandes = commandesList;

    if (filteredCommandes.length === 0) {
      return (
        <div className="text-center text-xs text-gray-500 py-12">
          Aucune commande ne correspond aux filtres sélectionnés.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredCommandes.map((cmd) => {
          const paiements = cmd.paiements || [];
          
          const tranchesEnAttente = paiements.filter((p) => {
            const type = p.type_paiement;
            const statut = getPaiementEffectiveStatus(p);
            return type === "tranche" && statut === "en_attente_caisse" && p.montant;
          });

          const statutLabel = cmd.statutLabel || cmd.statut;
          const statutClasses = getCommandeStatusClasses(cmd.statut);

          return (
            <div
              key={cmd.id}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* En-tête commande */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 border-b bg-gray-50/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-[#472EAD]" />
                    <span className="text-sm font-semibold text-[#2F1F7A]">
                      Commande {cmd.numero}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>Date : {cmd.dateCommande || "—"}</span>
                    <span className="inline-flex items-center gap-1">
                      Statut :
                      <span
                        className={
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold " +
                          statutClasses
                        }
                      >
                        {statutLabel || "—"}
                      </span>
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    Total TTC : {formatFCFA(cmd.totalTTC)}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    Payé : {formatFCFA(cmd.montantPaye)}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-full font-semibold ${
                      (cmd.resteAPayer || 0) > 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    Reste : {formatFCFA(cmd.resteAPayer)}
                  </span>
                </div>
              </div>

              {/* Lignes produits + résumé paiements */}
              <div className="px-4 sm:px-5 py-4 space-y-4">
                {/* Lignes produits */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Produits
                    </span>
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {cmd.lignes?.length || 0} ligne{cmd.lignes && cmd.lignes.length > 1 && "s"}
                    </span>
                  </div>
                  <div className="border rounded-xl overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50/80">
                        <tr className="text-left text-gray-600">
                          <th className="px-3 py-2 font-medium">Produit</th>
                          <th className="px-3 py-2 font-medium">Réf / Code</th>
                          <th className="px-3 py-2 font-medium">Qté</th>
                          <th className="px-3 py-2 font-medium">Prix U.</th>
                          <th className="px-3 py-2 font-medium">Total TTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cmd.lignes || []).map((l) => (
                          <tr
                            key={l.id || `${l.libelle}-${l.ref}`}
                            className="border-t hover:bg-gray-50/50"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-800">
                                {l.libelle}
                              </div>
                              {l.modeVente === "gros" && (
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  Vente en gros
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {l.ref || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {l.qte}{" "}
                              {l.quantiteUnites
                                ? `(${l.quantiteUnites} unités)`
                                : ""}
                            </td>
                            <td className="px-3 py-2">
                              {formatFCFA(l.prixUnitaire)}
                            </td>
                            <td className="px-3 py-2 font-semibold">
                              {formatFCFA(l.totalTTC || l.totalHT)}
                            </td>
                          </tr>
                        ))}
                        {(!cmd.lignes || cmd.lignes.length === 0) && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-4 text-center text-xs text-gray-400"
                            >
                              Aucune ligne de produit enregistrée.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Résumé paiements */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Paiements enregistrés :</span>
                    <span className="font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                      {paiements.filter(p => getPaiementEffectiveStatus(p) === "payee").length || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Tranches en attente :</span>
                    {tranchesEnAttente.length > 0 ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        {tranchesEnAttente.length} — {formatFCFA(
                          tranchesEnAttente.reduce(
                            (s, p) => s + Number(p.montant || 0),
                            0
                          )
                        )}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Aucune
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            <span className="text-xs text-gray-600">
              Page {page} sur {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    );
  };

  // ====== VUE B : HISTORIQUE DES PAIEMENTS & TRANCHES ======
  const renderPaiementsView = () => {
    // 🌀 État "chargement"
    if (paiementsLoading) {
      return (
        <div className="py-12 space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#472EAD] animate-ping" />
            <span>Chargement des paiements & tranches…</span>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 h-10 animate-pulse" />
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-6 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (commandesList.length === 0) {
      return (
        <div className="text-center text-sm text-gray-500 py-12">
          Aucune commande enregistrée pour ce client, donc aucun paiement.
        </div>
      );
    }

    const hasAtLeastOnePaiementLocal = commandesList.some(
      (cmd) => (cmd.paiements || []).length > 0
    );

    if (!hasAtLeastOnePaiementLocal) {
      return (
        <div className="text-center text-sm text-gray-500 py-12">
          Aucun paiement n&apos;est encore enregistré pour ce client.
        </div>
      );
    }

    const searchCmdPay = (searchCommandePay || "").trim().toLowerCase();
    // On prépare les commandes avec leurs paiements filtrés
    const entries = commandesList      .map((cmd) => {
        const commandeMatches =
          !searchCmdPay ||
          [cmd.id, cmd.numero, cmd.reference, cmd.codeCommande]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchCmdPay);

        if (!commandeMatches) {
          return { cmd, paiements: [] };
        }

        const paiements = (cmd.paiements || []).filter((p) => {
          const effectiveStatus = getPaiementEffectiveStatus(p);

          // 🔍 Filtre date (on compare sur AAAA-MM-JJ)
          if (searchDate) {
            const rawDate = String(p.date_paiement || "");
            const onlyDay = rawDate.slice(0, 10);
            if (onlyDay !== searchDate) return false;
          }

          // 🔎 Filtre type
          const type = p.type_paiement;

          if (filterType === "tranches") {
            return type === "tranche" && effectiveStatus === "en_attente_caisse";
          }

          if (filterType === "paiements") {
            return effectiveStatus === "payee";
          }

          if (filterType === "annules") {
            return effectiveStatus === "annulee";
          }

          // "tous"
          return true;
        });

        return { cmd, paiements };
      })
      .filter((e) => e.paiements.length > 0);

    if (entries.length === 0) {
      return (
        <div className="text-center text-sm text-gray-500 py-12">
          Aucun paiement ne correspond aux filtres sélectionnés.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {entries.map(({ cmd, paiements }) => {
          const tranchesEnAttente = paiements.filter((p) => {
            const type = p.type_paiement;
            const effectiveStatus = getPaiementEffectiveStatus(p);
            return type === "tranche" && effectiveStatus === "en_attente_caisse";
          });

          return (
            <div
              key={cmd.id}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* En-tête commande */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 border-b bg-gray-50/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-[#472EAD]" />
                    <span className="text-sm font-semibold text-[#2F1F7A]">
                      Commande {cmd.numero}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Date : {cmd.dateCommande || "—"} • Statut :{" "}
                    <span className="font-semibold">
                      {cmd.statutLabel || cmd.statut}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    Total TTC : {formatFCFA(cmd.totalTTC)}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    Payé : {formatFCFA(cmd.montantPaye)}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-full font-semibold ${
                      (cmd.resteAPayer || 0) > 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    Reste : {formatFCFA(cmd.resteAPayer)}
                  </span>
                </div>
              </div>

              {/* Tableau paiements */}
              <div className="px-4 sm:px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-700">
                    Paiements & tranches
                  </span>
                  {tranchesEnAttente.length > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full font-semibold">
                      {tranchesEnAttente.length} tranche
                      {tranchesEnAttente.length > 1 && "s"} en attente
                    </span>
                  )}
                </div>
                <div className="border rounded-xl overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50/80">
                      <tr className="text-left text-gray-600">
                        <th className="px-3 py-2.5 font-medium">Date</th>
                        <th className="px-3 py-2.5 font-medium">Montant</th>
                        <th className="px-3 py-2.5 font-medium">Mode / Type</th>
                        <th className="px-3 py-2.5 font-medium">Statut</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paiements.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-4 text-center text-xs text-gray-400"
                          >
                            Aucun paiement enregistré pour cette commande.
                          </td>
                        </tr>
                      )}
                      {paiements.map((p) => {
                        const type = p.type_paiement;
                        const isTranche = type === "tranche";
                        const effectiveStatus = getPaiementEffectiveStatus(p);
                        const statusClasses = getPaiementStatusClasses(effectiveStatus);
                        const isAttente = effectiveStatus === "en_attente_caisse";
                        const isAnnulee = effectiveStatus === "annulee";
                        const mode = p.mode_paiement;

                        return (
                          <tr
                            key={p.id || `${cmd.id}-${p.date_paiement}-${p.montant}`}
                            className="border-t hover:bg-gray-50/50"
                          >
                            <td className="px-3 py-2.5">{p.date_paiement || "—"}</td>
                            <td className="px-3 py-2.5 font-semibold">
                              {formatFCFA(p.montant)}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="text-gray-800">
                                {mode || "—"}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {isTranche ? "Tranche" : "Paiement direct"}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={
                                  "px-2 py-1 rounded-full text-[11px] font-semibold " +
                                  statusClasses
                                }
                              >
                                {effectiveStatus === "en_attente_caisse" ? "En attente" : 
                                 effectiveStatus === "payee" ? "Payée" :
                                 effectiveStatus === "annulee" ? "Annulée" :
                                 effectiveStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right space-x-2">
                              {isTranche && isAttente && !isAnnulee && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditTranche(cmd, p)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F5FF] text-[#472EAD] hover:bg-[#ECE8FF] text-xs font-semibold"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAskDeleteTranche(cmd, p)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Supprimer
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const modalContent = (
    <>
      {/* MODALE PRINCIPALE */}
      <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* HEADER - PLUS AÉRÉ */}
          <div className="flex items-start justify-between px-6 sm:px-8 py-5 border-b bg-[#F8F7FF] flex-shrink-0">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E4E0FF] shadow-sm">
                <ListChecks className="w-4 h-4 text-[#472EAD]" />
                <span className="text-xs font-semibold text-[#472EAD] uppercase tracking-wide">
                  Détails client spécial
                </span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#2F1F7A]">
                  {client.nom}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {client.entreprise} — {client.adresse} — {client.contact}
                </p>
                {mode !== "choice" && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setMode("choice")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                    >
                      <span className="text-sm">←</span>
                      <span>Retour à l&apos;accueil</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* CONTENU DÉROULANT - GRANDS ESPACEMENTS */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            <div className="space-y-8">
                            
              {/* ÉCRAN DE CHOIX */}
              {mode === "choice" && (
                <div className="space-y-8">
                  
                  {/* Résumé global client - CARTES PLUS GRANDES */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 text-xs">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm">
                      <div className="text-gray-600 mb-1">
                        Nombre de commandes
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-700">
                        {summary.nbCommandes}
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm">
                      <div className="text-gray-600 mb-1">Total TTC</div>
                      <div className="text-xl font-extrabold text-emerald-700">
                        {formatFCFA(summary.totalTTC)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm">
                      <div className="text-gray-600 mb-1">
                        Total payé (encaissé)
                      </div>
                      <div className="text-xl font-extrabold text-emerald-700">
                        {formatFCFA(summary.totalPaye)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 shadow-sm">
                      <div className="text-gray-600 mb-1">Dette totale</div>
                      <div className="text-xl font-extrabold text-rose-700">
                        {formatFCFA(summary.detteTotale)}
                      </div>
                    </div>
                  </div>

                  {/* ESPACE HORIZONTAL ENTRE LES DEUX BLOCS - SÉPARATEUR VISUEL */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-5 py-1 text-xs font-semibold text-[#472EAD] bg-gradient-to-r from-[#472EAD]/5 to-[#F58020]/5 rounded-full border border-gray-200 shadow-sm">
                        {client.nom} • Historique
                      </span>
                    </div>
                  </div>

                  {/* Cartes choix historiques - GRAND FORMAT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    
                    {/* Carte Historique des commandes */}
                    <button
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setMode("commandes");
                      }}

                      className="w-full text-left rounded-2xl border-2 border-[#E4E0FF] bg-[#F7F5FF] hover:bg-[#F0ECFF] transition-all shadow-md hover:shadow-lg px-6 py-6 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                          <ListChecks className="w-6 h-6 text-[#472EAD]" />
                        </div>
                        <span className="text-base font-semibold text-[#2F1F7A]">
                          Historique des commandes
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Voir toutes les commandes de ce client, les montants TTC,
                        le payé et le reste à payer, avec le détail des produits.
                      </p>
                      <div className="mt-2 text-sm text-gray-600 space-y-1.5 bg-white/60 p-3 rounded-xl">
                        <div className="flex justify-between">
                          <span>Commandes :</span>
                          <span className="font-semibold text-[#472EAD]">
                            {summary.nbCommandes}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total TTC :</span>
                          <span className="font-semibold text-[#472EAD]">
                            {formatFCFA(summary.totalTTC)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dette :</span>
                          <span className="font-semibold text-rose-700">
                            {formatFCFA(summary.detteTotale)}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Carte Historique des paiements & tranches */}
                    <button
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setMode("paiements");
                      }}

                      className="w-full text-left rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 transition-all shadow-md hover:shadow-lg px-6 py-6 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                          <BadgeDollarSign className="w-6 h-6 text-emerald-700" />
                        </div>
                        <span className="text-base font-semibold text-emerald-900">
                          Historique des paiements
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Voir tous les encaissements et tranches, regroupés par
                        commande. Les tranches en attente caisse sont modifiables.
                      </p>
                      <div className="mt-2 text-sm text-gray-700 space-y-1.5 bg-white/60 p-3 rounded-xl">
                        <div className="flex justify-between">
                          <span>Paiements enregistrés :</span>
                          <span className="font-semibold text-emerald-700">
                            {summary.nbPaiements}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total encaissé :</span>
                          <span className="font-semibold text-emerald-700">
                            {formatFCFA(summary.totalEncaisse)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tranches en attente :</span>
                          {summary.nbTranchesEnAttente > 0 ? (
                            <span className="font-semibold text-amber-700">
                              {summary.nbTranchesEnAttente} — {formatFCFA(summary.montantTranchesEnAttente)}
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-700">
                              Aucune
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {commandesList.length === 0 && (
                    <div className="text-center text-sm text-gray-500 pt-6 pb-4">
                      Aucune commande enregistrée pour ce client pour le moment.
                    </div>
                  )}
                </div>
              )}

              {/* VUE A : commandes */}
              {mode === "commandes" && (
                <div className="space-y-6">
                  
                  {/* HEADER FILTRES - PLUS AÉRÉ */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-bold text-[#2F1F7A]">
                      Historique des commandes
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      
                      {/* Filtres par statut */}
                      <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs">
                        {[
                          { id: "tous", label: "Toutes" },
                          { id: "soldee", label: "Payées" },
                          { id: "en_attente_caisse", label: "En attente" },
                          { id: "annulee", label: "Annulées" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            // ✅ CORRECTION 6 — FILTRES STATUT
                            onClick={() => {
                              setPage(1);
                              setStatutCmd(opt.id);
                            }}
                            className={
                              "px-4 py-1.5 rounded-lg transition font-medium " +
                              (statutCmd === opt.id
                                ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                                : "text-gray-600 hover:text-gray-900")
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Recherche commande */}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                          <Search className="w-4 h-4 text-gray-400" />
                        </span>
                        <input
                          type="text"
                          // ✅ CORRECTION 7 — RECHERCHE COMMANDE
                          value={searchInputCmd}
                          onChange={(e) => setSearchInputCmd(e.target.value)}
                          className="pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 shadow-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] placeholder:text-gray-400 w-full sm:w-64"
                          placeholder="ID, numéro ou scan ticket"
                        />
                        {searchInputCmd && (
                          <button
                            type="button"
                            onClick={() => setSearchInputCmd("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-semibold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LISTE DES COMMANDES */}
                  {renderCommandesView()}
                </div>
              )}

              {/* VUE B : paiements & tranches */}
              {mode === "paiements" && (
                <div className="space-y-6">
                  
                  {/* HEADER FILTRES - PLUS AÉRÉ */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-bold text-[#2F1F7A]">
                      Historique des paiements & tranches
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      
                      {/* Filtres par type */}
                      <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs">
                        {[
                          { id: "tous", label: "Tous" },
                          { id: "tranches", label: "Tranches" },
                          { id: "paiements", label: "Paiements" },
                          { id: "annules", label: "Annulés" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFilterType(opt.id)}
                            className={
                              "px-4 py-1.5 rounded-lg transition font-medium " +
                              (filterType === opt.id
                                ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                                : "text-gray-600 hover:text-gray-900")
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        
                        {/* Filtre date */}
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                          />
                          {searchDate && (
                            <button
                              type="button"
                              onClick={() => setSearchDate("")}
                              className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                            >
                              Réinit.
                            </button>
                          )}
                        </div>

                        {/* Recherche commande */}
                        <div className="relative">
                          <input
                            type="text"
                            value={searchCommandePay}
                            onChange={(e) => setSearchCommandePay(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] w-full sm:w-48"
                            placeholder="Commande / QR"
                          />
                          {searchCommandePay && (
                            <button
                              type="button"
                              onClick={() => setSearchCommandePay("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LISTE DES PAIEMENTS */}
                  {renderPaiementsView()}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {trancheToDelete && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-gray-900">
              Supprimer cette tranche ?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cette action est irréversible. La tranche sera définitivement
              supprimée de la commande{" "}
              <span className="font-semibold text-[#472EAD]">
                {trancheToDelete.cmd.numero}
              </span>{" "}
              pour le client{" "}
              <span className="font-semibold text-[#472EAD]">
                {client.nom}
              </span>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelDeleteTranche}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTranche}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm text-white font-semibold hover:bg-red-700"
              >
                Supprimer définitivement
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL ÉDITION TRANCHE */}
      {trancheToEdit && (
        <div className="fixed inset-0 z-[2150] flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#F7F5FF] rounded-lg">
                <Edit2 className="w-5 h-5 text-[#472EAD]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Modifier la tranche
              </h3>
            </div>
            
            <p className="text-sm text-gray-600">
              Commande{" "}
              <span className="font-semibold text-[#472EAD]">
                {trancheToEdit.cmd.numero}
              </span>{" "}
              • Client{" "}
              <span className="font-semibold text-[#472EAD]">
                {client.nom}
              </span>
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Montant de la tranche (FCFA)
                </label>
                <input
                  type="number"
                  value={editForm.montant}
                  onChange={(e) =>
                    handleChangeEditField("montant", e.target.value)
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                  placeholder="Montant"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Date du paiement
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    handleChangeEditField("date", e.target.value)
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Mode de paiement
                </label>
                <select
                  value={editForm.mode}
                  onChange={(e) => handleChangeEditField("mode", e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] bg-white"
                >
                  <option value="">Sélectionner un mode</option>
                  <option value="especes">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={editForm.commentaire}
                  onChange={(e) =>
                    handleChangeEditField("commentaire", e.target.value)
                  }
                  rows={3}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                  placeholder="Ex : Tranche payée par le gérant, justificatif en caisse..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancelEditTranche}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmEditTranche}
                className="px-4 py-2 rounded-lg bg-[#472EAD] text-sm text-white font-semibold hover:bg-[#3b2590]"
              >
                Valider les modifications
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 🔔 Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            zIndex: 2200,
            fontSize: "0.85rem",
            padding: "12px 16px",
            borderRadius: "12px",
          },
        }}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
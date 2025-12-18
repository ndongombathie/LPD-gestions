// src/responsable/components/VoirDetailClient.jsx

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ListChecks, BadgeDollarSign, Edit2, Trash2, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";


// 🔢 Format Montants FCFA (sans fichier utils/format)
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

// 🎨 Couleurs pour les statuts de commandes
const getCommandeStatusClasses = (statut) => {
  if (!statut) return "bg-gray-100 text-gray-600";

  const s = String(statut).toLowerCase();

  if (s.includes("annul")) return "bg-red-50 text-red-700";
  if (s.includes("attente") || s.includes("partiel"))
    return "bg-amber-50 text-amber-700";
  if (s.includes("sold") || s.includes("pay"))
    return "bg-emerald-50 text-emerald-700";

  return "bg-gray-100 text-gray-600";
};

// 🧠 Statut “effectif” d’un paiement
// On supporte à la fois (type, statut, mode) et (type_paiement, statut_paiement, mode_paiement)
const getPaiementEffectiveStatus = (paiement, commande) => {
  const raw =
    paiement?.statut !== undefined && paiement?.statut !== null
      ? paiement.statut
      : paiement?.statut_paiement;

  if (raw && String(raw).trim() !== "") {
    return raw; // on respecte ce que renvoie le backend
  }

  const type =
    paiement?.type !== undefined && paiement?.type !== null
      ? paiement.type
      : paiement?.type_paiement;

  // 🌙 Si pas de statut mais que c'est une tranche → en attente par défaut
  if (type === "tranche") {
    return "En attente";
  }

  // 💰 Paiement direct : on déduit par rapport au reste à payer de la commande
  const reste = Number(commande?.resteAPayer || 0);

  if (reste <= 0) return "Soldé";
  if (reste > 0) return "Paiement partiel";

  return "—";
};

// 🎨 Couleurs pour les statuts de paiements / tranches
const getPaiementStatusClasses = (statut) => {
  if (!statut || statut === "—") return "bg-gray-100 text-gray-600";

  const s = String(statut).toLowerCase();

  if (s.includes("attente")) return "bg-amber-50 text-amber-700"; // 🟠
  if (s.includes("annul")) return "bg-red-50 text-red-700"; // 🔴
  if (
    s.includes("sold") ||
    s.includes("pay") ||
    s.includes("valid") ||
    s.includes("encaisse")
  )
    return "bg-emerald-50 text-emerald-700"; // 🟢

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

  const sortedCmds = useMemo(
    () =>
      [...commandes].sort((a, b) =>
        String(a.dateCommande || "").localeCompare(
          String(b.dateCommande || "")
        )
      ),
    [commandes]
  );

  // 🧭 Mode : "choice" | "commandes" | "paiements"
  const [mode, setMode] = useState("choice");

  // 🔎 Filtres pour la vue commandes
  const [commandeFilter, setCommandeFilter] = useState("toutes"); // toutes | payees | attente_caisse | annulees
  const [searchCommandeCmd, setSearchCommandeCmd] = useState(""); // recherche par ID / numéro / QR dans la carte commandes

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
    () => sortedCmds.some((cmd) => (cmd.paiements || []).length > 0),
    [sortedCmds]
  );

  // 🌀 État de chargement pour la vue paiements & tranches
  const [paiementsLoading, setPaiementsLoading] = useState(false);

  // À chaque ouverture / changement de client → reset
  useEffect(() => {
    if (open) {
      setMode("choice");
      setCommandeFilter("toutes");
      setSearchCommandeCmd("");
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

  // 🧠 Adaptation automatique du filtre de commandes en fonction de la recherche (ID / numéro / QR)
  useEffect(() => {
    const q = (searchCommandeCmd || "").trim().toLowerCase();
    if (!q) return;

    const matches = sortedCmds.filter((cmd) => {
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
      const statutLabel = (cmd.statutLabel || cmd.statut || "").toLowerCase();

      if (statutLabel.includes("annul")) {
        setCommandeFilter("annulees");
      } else if (statutLabel.includes("attente")) {
        setCommandeFilter("attente_caisse");
      } else if (statutLabel.includes("pay") || statutLabel.includes("sold")) {
        setCommandeFilter("payees");
      } else {
        setCommandeFilter("toutes");
      }
    }
  }, [searchCommandeCmd, sortedCmds]);

  // 🧠 Adaptation automatique du filtre de paiements en fonction de la recherche (ID / numéro / QR)
  useEffect(() => {
    const q = (searchCommandePay || "").trim().toLowerCase();
    if (!q) return;

    const matches = sortedCmds.filter((cmd) => {
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

      let hasFinal = false;
      let hasAttente = false;
      let hasAnnule = false;

      for (const p of paiements) {
        const status = (
          getPaiementEffectiveStatus(p, cmd) || ""
        ).toLowerCase();

        if (status.includes("annul")) {
          hasAnnule = true;
        } else if (status.includes("attente")) {
          hasAttente = true;
        } else if (
          status.includes("sold") ||
          status.includes("pay") ||
          status.includes("encaisse") ||
          status.includes("valid")
        ) {
          hasFinal = true;
        }
      }

      if (hasFinal && !hasAttente && !hasAnnule) {
        setFilterType("paiements");
      } else if (hasAttente && !hasFinal && !hasAnnule) {
        setFilterType("tranches");
      } else if (hasAnnule && !hasFinal && !hasAttente) {
        setFilterType("annules");
      } else {
        setFilterType("tous");
      }
    }
  }, [searchCommandePay, sortedCmds]);

  // 📊 Agrégats pour le client (pour l'écran de choix)
  const summary = useMemo(() => {
    // ✅ On exclut toutes les commandes annulées pour le résumé
    const commandesActives = sortedCmds.filter(
      (c) => c.statut !== "annulee" && c.statut !== "annulée"
    );

    const nbCommandes = commandesActives.length;

    const totalTTC = commandesActives.reduce(
      (s, c) => s + (Number(c.totalTTC) || 0),
      0
    );
    const totalPaye = commandesActives.reduce(
      (s, c) => s + (Number(c.montantPaye) || 0),
      0
    );
    const detteTotale = commandesActives.reduce(
      (s, c) => s + Math.max(Number(c.resteAPayer) || 0, 0),
      0
    );

    const allPaiements = commandesActives.flatMap(
      (cmd) => cmd.paiements || []
    );
    const nbPaiements = allPaiements.length;
    const totalEncaisse = totalPaye;

    // Tranches en attente : supporte statut / statut_paiement & type / type_paiement
    const tranchesEnAttente = allPaiements.filter((p) => {
      const type =
        p.type !== undefined && p.type !== null ? p.type : p.type_paiement;
      const statut =
        p.statut !== undefined && p.statut !== null
          ? p.statut
          : p.statut_paiement;

      return (
        type === "tranche" &&
        statut === "en_attente_caisse" &&
        p.montant
      );
    });

    const nbTranchesEnAttente = tranchesEnAttente.length;
    const montantTranchesEnAttente = tranchesEnAttente.reduce(
      (s, p) => s + Number(p.montant || 0),
      0
    );

    return {
      nbCommandes,
      totalTTC,
      totalPaye,
      detteTotale,
      nbPaiements,
      totalEncaisse,
      nbTranchesEnAttente,
      montantTranchesEnAttente,
    };
  }, [sortedCmds]);

  // 🔧 handlers – ÉDITION
  const handleOpenEditTranche = (cmd, paiement) => {
    const dateValue = paiement?.date || "";
    const modeValue =
      paiement?.mode !== undefined && paiement?.mode !== null
        ? paiement.mode
        : paiement?.mode_paiement || "";
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

    const updatedPaiement = {
      ...paiement,
      montant:
        editForm.montant === "" ? paiement.montant : Number(editForm.montant),
      date: editForm.date || paiement.date,
      mode:
        editForm.mode !== ""
          ? editForm.mode
          : paiement.mode ?? paiement.mode_paiement ?? "",
      // ✅ On ne touche pas au statut ici : toujours géré côté caisse / back
      statut:
        paiement.statut !== undefined && paiement.statut !== null
          ? paiement.statut
          : paiement.statut_paiement,
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
      console.error(error);
      toast.error("Erreur lors de la mise à jour de la tranche");
    }
  };

  // 🔧 handlers – SUPPRESSION
  const handleAskDeleteTranche = (cmd, paiement) => {
    setTrancheToDelete({ cmd, paiement });
  };

  const handleConfirmDeleteTranche = async () => {
    if (!trancheToDelete) return;

    try {
      await Promise.resolve(
        safeOnDeleteTranche(trancheToDelete.cmd, trancheToDelete.paiement)
      );
      toast.success("Tranche supprimée (en attente caisse)");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression de la tranche");
    }

    setTrancheToDelete(null);
  };

  const handleCancelDeleteTranche = () => {
    setTrancheToDelete(null);
  };

  // ====== VUE A : HISTORIQUE DES COMMANDES (sans détails de paiements) ======
  const renderCommandesView = () => {
    if (sortedCmds.length === 0) {
      return (
        <div className="text-center text-xs text-gray-500 py-6">
          Aucune commande enregistrée pour ce client.
        </div>
      );
    }

    const q = (searchCommandeCmd || "").trim().toLowerCase();

    const filteredCommandes = sortedCmds.filter((cmd) => {
      const statutLabel = cmd.statutLabel || cmd.statut || "";
      const s = statutLabel.toLowerCase();

      if (commandeFilter === "payees") {
        if (!(s.includes("pay") || s.includes("sold"))) return false;
      } else if (commandeFilter === "attente_caisse") {
        if (!s.includes("attente")) return false;
      } else if (commandeFilter === "annulees") {
        if (!s.includes("annul")) return false;
      }

      if (!q) return true;

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

    if (filteredCommandes.length === 0) {
      return (
        <div className="text-center text-xs text-gray-500 py-6">
          Aucune commande ne correspond aux filtres sélectionnés.
        </div>
      );
    }

    return filteredCommandes.map((cmd) => {
      const paiements = cmd.paiements || [];
      const tranchesEnAttente = paiements.filter((p) => {
        const type =
          p.type !== undefined && p.type !== null ? p.type : p.type_paiement;
        const statut =
          p.statut !== undefined && p.statut !== null
            ? p.statut
            : p.statut_paiement;

        return type === "tranche" && statut === "en_attente_caisse" && p.montant;
      });

      const statutLabel = cmd.statutLabel || cmd.statut;
      const statutClasses = getCommandeStatusClasses(statutLabel);

      return (
        <div
          key={cmd.id}
          className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
        >
          {/* En-tête commande */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 border-b bg-gray-50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-[#472EAD]" />
                <span className="text-sm font-semibold text-[#2F1F7A]">
                  Commande {cmd.numero}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                <span>Date : {cmd.dateCommande || "—"}</span>
                <span className="inline-flex items-center gap-1">
                  Statut :
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold " +
                      statutClasses
                    }
                  >
                    {statutLabel || "—"}
                  </span>
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                Total TTC : {formatFCFA(cmd.totalTTC)}
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                Payé (encaissé) : {formatFCFA(cmd.montantPaye)}
              </span>
              <span
                className={`px-2 py-1 rounded-full font-semibold ${
                  (cmd.resteAPayer || 0) > 0
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                Reste : {formatFCFA(cmd.resteAPayer)}
              </span>
            </div>
          </div>

          {/* Lignes produits + petit résumé paiements */}
          <div className="px-3 sm:px-4 py-3 space-y-3">
            {/* Lignes produits */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  Produits
                </span>
                <span className="text-[11px] text-gray-400">
                  {cmd.lignes?.length || 0} ligne
                  {cmd.lignes && cmd.lignes.length > 1 && "s"}
                </span>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="px-2 py-1.5 font-medium">Produit</th>
                      <th className="px-2 py-1.5 font-medium">Réf / Code</th>
                      <th className="px-2 py-1.5 font-medium">Qté</th>
                      <th className="px-2 py-1.5 font-medium">Prix U.</th>
                      <th className="px-2 py-1.5 font-medium">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cmd.lignes || []).map((l) => (
                      <tr
                        key={l.id || `${l.libelle}-${l.ref}`}
                        className="border-t"
                      >
                        <td className="px-2 py-1.5">
                          <div className="font-medium text-gray-800">
                            {l.libelle}
                          </div>
                          {l.modeVente === "gros" && (
                            <div className="text-[10px] text-gray-500">
                              Vente en gros
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-gray-500">
                          {l.ref || "—"}
                        </td>
                        <td className="px-2 py-1.5">
                          {l.qte}{" "}
                          {l.quantiteUnites
                            ? `(${l.quantiteUnites} unités)`
                            : ""}
                        </td>
                        <td className="px-2 py-1.5">
                          {formatFCFA(l.prixUnitaire)}
                        </td>
                        <td className="px-2 py-1.5 font-semibold">
                          {formatFCFA(l.totalTTC || l.totalHT)}
                        </td>
                      </tr>
                    ))}
                    {(!cmd.lignes || cmd.lignes.length === 0) && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-2 text-center text-[11px] text-gray-400"
                        >
                          Aucune ligne de produit enregistrée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Résumé paiements (sans détails) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
              <div>
                Paiements enregistrés :{" "}
                <span className="font-semibold">
                  {paiements.length || 0}
                </span>
              </div>
              <div>
                Tranches en attente caisse :{" "}
                {tranchesEnAttente.length > 0 ? (
                  <span className="font-semibold text-amber-700">
                    {tranchesEnAttente.length} —{" "}
                    {formatFCFA(
                      tranchesEnAttente.reduce(
                        (s, p) => s + Number(p.montant || 0),
                        0
                      )
                    )}
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-700">
                    Aucune tranche en attente
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  // ====== VUE B : HISTORIQUE DES PAIEMENTS & TRANCHES ======
  const renderPaiementsView = () => {
    // 🌀 État "chargement"
    if (paiementsLoading) {
      return (
        <div className="py-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#472EAD] animate-ping" />
            <span>Chargement des paiements & tranches…</span>
          </div>
          {/* Petit skeleton de tableau */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 h-8 animate-pulse" />
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-5 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (sortedCmds.length === 0) {
      return (
        <div className="text-center text-xs text-gray-500 py-6">
          Aucune commande enregistrée pour ce client, donc aucun paiement.
        </div>
      );
    }

    const hasAtLeastOnePaiementLocal = sortedCmds.some(
      (cmd) => (cmd.paiements || []).length > 0
    );

    if (!hasAtLeastOnePaiementLocal) {
      return (
        <div className="text-center text-xs text-gray-500 py-6">
          Aucun paiement n&apos;est encore enregistré pour ce client.
        </div>
      );
    }

    const searchCmd = (searchCommandePay || "").trim().toLowerCase();

    // On prépare les commandes avec leurs paiements filtrés
    const entries = sortedCmds
      .map((cmd) => {
        const commandeMatches =
          !searchCmd ||
          [cmd.id, cmd.numero, cmd.reference, cmd.codeCommande]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchCmd);

        if (!commandeMatches) {
          return { cmd, paiements: [] };
        }

        const paiements = (cmd.paiements || []).filter((p) => {
          const effectiveStatus = getPaiementEffectiveStatus(p, cmd);
          const s = String(effectiveStatus || "").toLowerCase();

          // 🔍 Filtre date (on compare sur AAAA-MM-JJ)
          if (searchDate) {
            const rawDate = String(p.date || "");
            const onlyDay = rawDate.slice(0, 10); // "2025-12-11"
            if (onlyDay !== searchDate) return false;
          }

          // 🔎 Filtre type
          const type =
            p.type !== undefined && p.type !== null
              ? p.type
              : p.type_paiement;

          if (filterType === "tranches") {
            // Tranches non annulées
            return type === "tranche" && !s.includes("annul");
          }

          if (filterType === "paiements") {
            // Paiements finaux : tout ce qui est complètement encaissé
            const isTranche = type === "tranche";
            const isFinal =
              s.includes("sold") ||
              s.includes("pay") ||
              s.includes("encaisse") ||
              s.includes("valid");

            if (isTranche) {
              return isFinal;
            }

            // Paiement direct : on le considère final si statut final OU commande soldée
            if (isFinal) return true;

            const resteCmd = Number(cmd.resteAPayer || 0);
            return resteCmd <= 0;
          }

          if (filterType === "annules") {
            return s.includes("annul");
          }

          // "tous"
          return true;
        });

        return { cmd, paiements };
      })
      .filter((e) => e.paiements.length > 0);

    if (entries.length === 0) {
      return (
        <div className="text-center text-xs text-gray-500 py-6">
          Aucun paiement ne correspond aux filtres sélectionnés.
        </div>
      );
    }

    return entries.map(({ cmd, paiements }) => {
      const tranchesEnAttente = paiements.filter((p) => {
        const type =
          p.type !== undefined && p.type !== null
            ? p.type
            : p.type_paiement;
        const effectiveStatus = getPaiementEffectiveStatus(p, cmd);
        const s = String(effectiveStatus || "").toLowerCase();
        return type === "tranche" && s.includes("attente");
      });

      return (
        <div
          key={cmd.id}
          className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
        >
          {/* En-tête commande (résumé financier) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 border-b bg-gray-50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-[#472EAD]" />
                <span className="text-sm font-semibold text-[#2F1F7A]">
                  Commande {cmd.numero}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Date : {cmd.dateCommande || "—"} • Statut :{" "}
                <span className="font-semibold">
                  {cmd.statutLabel || cmd.statut}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                Total TTC : {formatFCFA(cmd.totalTTC)}
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                Payé (encaissé) : {formatFCFA(cmd.montantPaye)}
              </span>
              <span
                className={`px-2 py-1 rounded-full font-semibold ${
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
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">
                Paiements & tranches
              </span>
              {tranchesEnAttente.length > 0 && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                  {tranchesEnAttente.length} tranche
                  {tranchesEnAttente.length > 1 && "s"} en attente caisse
                </span>
              )}
            </div>
            <div className="border rounded-lg overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-2 py-1.5 font-medium">Date</th>
                    <th className="px-2 py-1.5 font-medium">Montant</th>
                    <th className="px-2 py-1.5 font-medium">Mode / Type</th>
                    <th className="px-2 py-1.5 font-medium">Statut</th>
                    <th className="px-2 py-1.5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-2 text-center text-[11px] text-gray-400"
                      >
                        Aucun paiement enregistré pour cette commande.
                      </td>
                    </tr>
                  )}
                  {paiements.map((p) => {
                    const type =
                      p.type !== undefined && p.type !== null
                        ? p.type
                        : p.type_paiement;
                    const isTranche = type === "tranche";
                    const effectiveStatus = getPaiementEffectiveStatus(p, cmd);
                    const statusClasses =
                      getPaiementStatusClasses(effectiveStatus);
                    const s = String(effectiveStatus || "").toLowerCase();
                    const isAttente = s.includes("attente");
                    const isAnnulee = s.includes("annul");
                    const mode =
                      p.mode !== undefined && p.mode !== null
                        ? p.mode
                        : p.mode_paiement;

                    return (
                      <tr
                        key={p.id || `${cmd.id}-${p.date}-${p.montant}`}
                        className="border-t"
                      >
                        <td className="px-2 py-1.5">{p.date || "—"}</td>
                        <td className="px-2 py-1.5 font-semibold">
                          {formatFCFA(p.montant)}
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="text-gray-700">
                            {mode || "—"}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {isTranche ? "Tranche" : "Paiement direct"}
                          </div>
                        </td>
                        {/* Statut coloré */}
                        <td className="px-2 py-1.5">
                          <span
                            className={
                              "px-1.5 py-0.5 rounded-full text-[10px] font-semibold " +
                              statusClasses
                            }
                          >
                            {effectiveStatus}
                          </span>
                        </td>
                        {/* Actions : uniquement pour tranches en attente */}
                        <td className="px-2 py-1.5 text-right space-x-1">
                          {isTranche && isAttente && !isAnnulee && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTranche(cmd, p)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F7F5FF] text-[#472EAD] hover:bg-[#ECE8FF] text-[10px] font-semibold"
                              >
                                <Edit2 className="w-3 h-3" />
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAskDeleteTranche(cmd, p)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-semibold"
                              >
                                <Trash2 className="w-3 h-3" />
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
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-3 border-b bg-[#F8F7FF]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-[#E4E0FF]">
              <ListChecks className="w-3.5 h-3.5 text-[#472EAD]" />
              <span className="text-[11px] font-semibold text-[#472EAD] uppercase tracking-wide">
                Détails client spécial
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2F1F7A]">
                {client.nom}
              </h2>
              <p className="text-xs text-gray-500">
                {client.entreprise} — {client.adresse} — {client.contact}
              </p>
              {mode !== "choice" && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setMode("choice")}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <span className="text-xs">←</span>
                    <span>Retour</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENU DÉROULANT */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3">
          {/* ÉCRAN DE CHOIX */}
          {mode === "choice" && (
            <div className="space-y-4">
              {/* Résumé global client */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">
                    Nombre de commandes
                  </div>
                  <div className="text-lg font-extrabold text-emerald-700">
                    {summary.nbCommandes}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Total TTC</div>
                  <div className="text-sm font-extrabold text-emerald-700">
                    {formatFCFA(summary.totalTTC)}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">
                    Total payé (encaissé)
                  </div>
                  <div className="text-sm font-extrabold text-emerald-700">
                    {formatFCFA(summary.totalPaye)}
                  </div>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Dette totale</div>
                  <div className="text-sm font-extrabold text-rose-700">
                    {formatFCFA(summary.detteTotale)}
                  </div>
                </div>
              </div>

              {/* Cartes choix historiques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Carte Historique des commandes */}
                <button
                  type="button"
                  onClick={() => setMode("commandes")}
                  className="w-full text-left rounded-2xl border border-[#E4E0FF] bg-[#F7F5FF] hover:bg-[#F0ECFF] transition shadow-sm px-4 py-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-[#472EAD]" />
                      <span className="text-sm font-semibold text-[#2F1F7A]">
                        Historique des commandes
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Voir toutes les commandes de ce client, les montants TTC,
                    le payé et le reste à payer, avec le détail des produits.
                  </p>
                  <div className="mt-1 text-[11px] text-gray-500 space-y-0.5">
                    <div>
                      Commandes :{" "}
                      <span className="font-semibold">
                        {summary.nbCommandes}
                      </span>
                    </div>
                    <div>
                      Total TTC :{" "}
                      <span className="font-semibold">
                        {formatFCFA(summary.totalTTC)}
                      </span>
                    </div>
                    <div>
                      Dette :{" "}
                      <span className="font-semibold text-rose-700">
                        {formatFCFA(summary.detteTotale)}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Carte Historique des paiements & tranches */}
                <button
                  type="button"
                  onClick={() => setMode("paiements")}
                  className="w-full text-left rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 transition shadow-sm px-4 py-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeDollarSign className="w-5 h-5 text-emerald-700" />
                      <span className="text-sm font-semibold text-emerald-900">
                        Historique des paiements & tranches
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-700">
                    Voir tous les encaissements et tranches, regroupés par
                    commande. Les tranches en attente caisse sont modifiables.
                  </p>
                  <div className="mt-1 text-[11px] text-gray-600 space-y-0.5">
                    <div>
                      Paiements enregistrés :{" "}
                      <span className="font-semibold">
                        {summary.nbPaiements}
                      </span>
                    </div>
                    <div>
                      Total encaissé (commandes) :{" "}
                      <span className="font-semibold text-emerald-700">
                        {formatFCFA(summary.totalEncaisse)}
                      </span>
                    </div>
                    <div>
                      Tranches en attente :{" "}
                      {summary.nbTranchesEnAttente > 0 ? (
                        <span className="font-semibold text-amber-700">
                          {summary.nbTranchesEnAttente} —{" "}
                          {formatFCFA(summary.montantTranchesEnAttente)}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          Aucune tranche en attente
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              {sortedCmds.length === 0 && (
                <div className="text-center text-[11px] text-gray-500 pt-2">
                  Aucune commande enregistrée pour ce client pour le moment.
                </div>
              )}
            </div>
          )}

          {/* VUE A : commandes */}
          {mode === "commandes" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#2F1F7A]">
                  Historique des commandes
                </h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {/* Filtres par statut de commande */}
                  <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 text-[11px]">
                    {[
                      { id: "toutes", label: "Toutes" },
                      { id: "payees", label: "Payées" },
                      { id: "attente_caisse", label: "En attente caisse" },
                      { id: "annulees", label: "Annulées" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCommandeFilter(opt.id)}
                        className={
                          "px-2.5 py-1 rounded-full transition " +
                          (commandeFilter === opt.id
                            ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                            : "text-gray-500 hover:text-gray-700")
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Recherche commande / QR */}
                  {/* Recherche commande / QR */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="hidden sm:inline text-gray-500">
                      Commande / QR
                    </span>

                    <div className="relative flex items-center">
                      <span className="absolute left-2 flex items-center justify-center">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                      </span>

                      <input
                        type="text"
                        value={searchCommandeCmd}
                        onChange={(e) => setSearchCommandeCmd(e.target.value)}
                        className="pl-7 pr-6 py-1.5 rounded-full border border-gray-200 bg-white/80 text-[11px] text-gray-700 shadow-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] placeholder:text-gray-400"
                        placeholder="ID, numéro ou scan ticket"
                      />

                      {searchCommandeCmd && (
                        <button
                          type="button"
                          onClick={() => setSearchCommandeCmd("")}
                          className="absolute right-2 text-gray-300 hover:text-gray-600 text-xs font-semibold"
                          aria-label="Réinitialiser la recherche"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {renderCommandesView()}
            </div>
          )}

          {/* VUE B : paiements & tranches */}
          {mode === "paiements" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#2F1F7A]">
                  Historique des paiements & tranches
                </h3>

                {/* Filtres */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 text-[11px]">
                    {[
                      { id: "tous", label: "Tous" },
                      { id: "tranches", label: "Tranches" },
                      {
                        id: "paiements",
                        label: "Paiements finaux",
                      },
                      {
                        id: "annules",
                        label: "Tranches annulées",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFilterType(opt.id)}
                        className={
                          "px-2.5 py-1 rounded-full transition " +
                          (filterType === opt.id
                            ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                            : "text-gray-500 hover:text-gray-700")
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Filtre date */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-gray-500">Date :</span>
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                      />
                      {searchDate && (
                        <button
                          type="button"
                          onClick={() => setSearchDate("")}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          Réinit.
                        </button>
                      )}
                    </div>

                    {/* Recherche commande / QR */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-gray-500">
                        Commande / QR :
                      </span>
                      <input
                        type="text"
                        value={searchCommandePay}
                        onChange={(e) => setSearchCommandePay(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                        placeholder="ID, numéro ou scan ticket"
                      />
                      {searchCommandePay && (
                        <button
                          type="button"
                          onClick={() => setSearchCommandePay("")}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          Réinit.
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {renderPaiementsView()}
            </div>
          )}
        </div>
      </motion.div>

      {/* MODAL CONFIRMATION SUPPRESSION TRANCHE */}
      {trancheToDelete && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Supprimer cette tranche ?
            </h3>
            <p className="text-xs text-gray-600">
              Cette action est irréversible. La tranche sera définitivement
              supprimée de la commande{" "}
              <span className="font-semibold text-[#472EAD]">
                {trancheToDelete.cmd.numero}
              </span>{" "}
              pour le client{" "}
              <span className="font-semibold text-[#472EAD]">
                {client.nom}
              </span>
              .
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelDeleteTranche}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTranche}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-[11px] text-white font-semibold hover:bg-red-700"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION TRANCHE (au-dessus du VoirDetailClient) */}
      {trancheToEdit && (
        <div className="fixed inset-0 z-[2150] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#472EAD]" />
              Modifier la tranche
            </h3>
            <p className="text-xs text-gray-600">
              Commande{" "}
              <span className="font-semibold text-[#472EAD]">
                {trancheToEdit.cmd.numero}
              </span>{" "}
              • Client{" "}
              <span className="font-semibold text-[#472EAD]">
                {client.nom}
              </span>
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-600">
                  Montant de la tranche (FCFA)
                </label>
                <input
                  type="number"
                  value={editForm.montant}
                  onChange={(e) =>
                    handleChangeEditField("montant", e.target.value)
                  }
                  className="border border-gray-200 rounded-lg px-2 py-1 text-[12px] focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                  placeholder="Montant"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-600">
                  Date du paiement
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    handleChangeEditField("date", e.target.value)
                  }
                  className="border border-gray-200 rounded-lg px-2 py-1 text-[12px] focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-600">
                  Mode de paiement
                </label>
                <select
                  value={editForm.mode}
                  onChange={(e) => handleChangeEditField("mode", e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-[12px] focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] bg-white"
                >
                  <option value="">Sélectionner un mode</option>
                  <option value="especes">Espèces</option>
                  <option value="wave">Wave</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-600">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={editForm.commentaire}
                  onChange={(e) =>
                    handleChangeEditField("commentaire", e.target.value)
                  }
                  rows={3}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-[12px] resize-none focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD]"
                  placeholder="Ex : Tranche payée par le gérant, justificatif en caisse..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEditTranche}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmEditTranche}
                className="px-3 py-1.5 rounded-lg bg-[#472EAD] text-[11px] text-white font-semibold hover:bg-[#3b2590]"
              >
                Valider les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toaster au même niveau (au-dessus de tous les modals) */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            zIndex: 2200, // > 2150 : au-dessus du VoirDetailClient + modals
            fontSize: "0.8rem",
          },
        }}
      />
    </div>
  );

  // 💡 On monte la modale dans body pour passer devant le sidebar
  return createPortal(modalContent, document.body);
}

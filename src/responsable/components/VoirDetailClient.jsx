// src/responsable/components/VoirDetailClient.jsx

import React from "react";
import { motion } from "framer-motion";
import { X, ListChecks, BadgeDollarSign, Edit2 } from "lucide-react";

// 🔢 Format Montants FCFA (sans fichier utils/format)
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function VoirDetailClient({
  open,
  onClose,
  client,
  commandes = [],
  onEditTranche,
}) {
  if (!open || !client) return null;

  const safeOnEditTranche = onEditTranche || (() => {});
  const sortedCmds = [...commandes].sort((a, b) =>
    String(a.dateCommande || "").localeCompare(String(b.dateCommande || ""))
  );

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center px-2 sm:px-4">
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
          {sortedCmds.length === 0 && (
            <div className="text-center text-xs text-gray-500 py-6">
              Aucune commande enregistrée pour ce client.
            </div>
          )}

          {sortedCmds.map((cmd) => {
            const paiements = cmd.paiements || [];
            const tranchesEnAttente = paiements.filter(
              (p) =>
                p.type === "tranche" &&
                p.statut === "en_attente_caisse" &&
                p.montant
            );

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

                {/* Lignes + paiements */}
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
                            <th className="px-2 py-1.5 font-medium">
                              Réf / Code
                            </th>
                            <th className="px-2 py-1.5 font-medium">Qté</th>
                            <th className="px-2 py-1.5 font-medium">
                              Prix U.
                            </th>
                            <th className="px-2 py-1.5 font-medium">
                              Total TTC
                            </th>
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

                  {/* Paiements */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600">
                        Paiements & tranches
                      </span>
                      {tranchesEnAttente.length > 0 && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                          {tranchesEnAttente.length} tranche
                          {tranchesEnAttente.length > 1 && "s"} en attente
                          caisse
                        </span>
                      )}
                    </div>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="min-w-full text-[11px]">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500">
                            <th className="px-2 py-1.5 font-medium">Date</th>
                            <th className="px-2 py-1.5 font-medium">
                              Montant
                            </th>
                            <th className="px-2 py-1.5 font-medium">
                              Mode / Type
                            </th>
                            <th className="px-2 py-1.5 font-medium">Statut</th>
                            <th className="px-2 py-1.5 font-medium">
                              Commentaire
                            </th>
                            <th className="px-2 py-1.5 font-medium text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paiements.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-2 py-2 text-center text-[11px] text-gray-400"
                              >
                                Aucun paiement enregistré pour cette commande.
                              </td>
                            </tr>
                          )}
                          {paiements.map((p) => {
                            const isTranche = p.type === "tranche";
                            const isAttente =
                              p.statut === "en_attente_caisse";

                            return (
                              <tr key={p.id} className="border-t">
                                <td className="px-2 py-1.5">
                                  {p.date || "—"}
                                </td>
                                <td className="px-2 py-1.5 font-semibold">
                                  {formatFCFA(p.montant)}
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="text-gray-700">
                                    {p.mode || "—"}
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {isTranche ? "Tranche" : "Paiement direct"}
                                  </div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <span
                                    className={
                                      "px-1.5 py-0.5 rounded-full text-[10px] font-semibold " +
                                      (isAttente
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-emerald-50 text-emerald-700")
                                    }
                                  >
                                    {p.statut || "—"}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5 text-gray-500">
                                  {p.commentaire || "—"}
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                  {isTranche && isAttente && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        safeOnEditTranche(cmd, p)
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F7F5FF] text-[#472EAD] hover:bg-[#ECE8FF] text-[10px] font-semibold"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      Modifier
                                    </button>
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
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

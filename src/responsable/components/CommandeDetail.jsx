// ==========================================================
// 🧾 CommandeDetail.jsx — Composant Détail Commande (LPD Manager)
// Affiche les produits, totaux et statut d'une commande client spécial
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import { FileDown, CheckCircle, XCircle, Clock } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

// === Helper ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function CommandeDetail({ commande }) {
  if (!commande) {
    return (
      <div className="text-center text-gray-500 py-10 italic">
        Aucune commande sélectionnée.
      </div>
    );
  }

  const { id, client, date, statut, produits, montantTotal, montantPaye } = commande;
  const reste = montantTotal - montantPaye;

  // === Couleur du statut ===
  const getStatusBadge = (statut) => {
    const map = {
      Payée: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      "Partiellement payée": "bg-amber-100 text-amber-700 border border-amber-300",
      "En attente": "bg-gray-100 text-gray-600 border border-gray-300",
      Annulée: "bg-rose-100 text-rose-700 border border-rose-300",
    };
    return map[statut] || "bg-gray-100 text-gray-600 border border-gray-300";
  };

  // === Export PDF ===
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Détail de la commande #${id}`, 14, 16);
    doc.text(`Client : ${client}`, 14, 22);
    doc.text(`Date : ${date}`, 14, 28);
    doc.text(`Statut : ${statut}`, 14, 34);
    doc.autoTable({
      startY: 42,
      head: [["Produit", "Quantité", "Prix unitaire", "Total"]],
      body: produits.map((p) => [
        p.nom,
        p.quantite,
        formatFCFA(p.prixUnitaire),
        formatFCFA(p.quantite * p.prixUnitaire),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.text(`Montant total : ${formatFCFA(montantTotal)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.text(`Montant payé : ${formatFCFA(montantPaye)}`, 14, doc.lastAutoTable.finalY + 16);
    doc.text(`Reste à payer : ${formatFCFA(reste)}`, 14, doc.lastAutoTable.finalY + 22);

    doc.save(`Commande_${id}_${client}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-md p-6"
    >
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#472EAD]">
            Détails de la commande #{id}
          </h2>
          <p className="text-sm text-gray-500">
            Client : <span className="font-medium">{client}</span> • {date}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadge(statut)}`}
          >
            {statut}
          </span>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1 bg-[#472EAD] text-white px-3 py-2 rounded-lg text-xs hover:bg-[#5A3CF5] transition"
          >
            <FileDown size={14} /> Exporter
          </button>
        </div>
      </div>

      {/* === Tableau produits === */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-2 text-left">Produit</th>
              <th className="px-4 py-2 text-center">Quantité</th>
              <th className="px-4 py-2 text-center">Prix unitaire</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-[#F9F9FF]">
                <td className="px-4 py-2 font-medium text-gray-800">{p.nom}</td>
                <td className="px-4 py-2 text-center">{p.quantite}</td>
                <td className="px-4 py-2 text-center">{formatFCFA(p.prixUnitaire)}</td>
                <td className="px-4 py-2 text-right font-semibold text-[#472EAD]">
                  {formatFCFA(p.quantite * p.prixUnitaire)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Résumé === */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {statut === "Payée" ? (
            <CheckCircle className="text-emerald-500" size={18} />
          ) : statut === "Partiellement payée" ? (
            <Clock className="text-amber-500" size={18} />
          ) : (
            <XCircle className="text-rose-500" size={18} />
          )}
          <span>
            Montant total :{" "}
            <span className="font-semibold text-gray-800">
              {formatFCFA(montantTotal)}
            </span>{" "}
            — Payé :{" "}
            <span className="font-semibold text-emerald-600">
              {formatFCFA(montantPaye)}
            </span>{" "}
            — Reste :{" "}
            <span className="font-semibold text-rose-600">
              {formatFCFA(reste)}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

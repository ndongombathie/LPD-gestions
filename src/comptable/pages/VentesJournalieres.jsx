// ==========================================================
// 📄 VentesJournalieres.jsx — Comptable LPD
// Statistiques des ventes journalières du caissier
// ==========================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Filter, Receipt } from "lucide-react";

const ventesJourMock = [
  { id: 1, heure: "08:15", produit: "Cahier 100 pages", montant: 1500, vendeur: "Mariama" },
  { id: 2, heure: "09:32", produit: "Stylos BIC (x3)", montant: 900, vendeur: "Bamba" },
  { id: 3, heure: "10:10", produit: "Boîte feuilles A4", montant: 3500, vendeur: "Mariama" },
  { id: 4, heure: "11:55", produit: "Classeur", montant: 2000, vendeur: "Bamba" },
];

export default function VentesJournalieres() {
  const [filtre, setFiltre] = useState("");

  const ventesFiltrees = ventesJourMock.filter((v) =>
    v.produit.toLowerCase().includes(filtre.toLowerCase())
  );

  const total = ventesFiltrees.reduce((sum, v) => sum + v.montant, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <Calendar size={18} /> Ventes Journalières
          </h1>
          <p className="text-sm text-gray-500">
            Résumé de toutes les ventes enregistrées aujourd’hui.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="border px-3 py-1.5 rounded-lg text-sm"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          />
          <Filter size={18} className="text-gray-600" />
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2">Heure</th>
              <th className="pb-2">Produit</th>
              <th className="pb-2">Montant</th>
              <th className="pb-2">Caissier</th>
            </tr>
          </thead>

          <tbody>
            {ventesFiltrees.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="py-2">{v.heure}</td>
                <td>{v.produit}</td>
                <td className="font-semibold text-[#472EAD]">
                  {v.montant.toLocaleString("fr-FR")} FCFA
                </td>
                <td>{v.vendeur}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="flex justify-end mt-4">
          <div className="px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2">
            <Receipt size={16} />
            Total du jour :
            <span className="font-bold">
              {total.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

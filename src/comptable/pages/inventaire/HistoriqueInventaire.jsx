// ==========================================================
// 📚 HistoriqueInventaire.jsx — Historique Global Inventaires
// DESIGN : SHADOW ONLY (SANS BORDURES)
// ==========================================================

import React, { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HistoriqueInventaire() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("tous");

  // ✅ LECTURE UNIQUE
  const historique = useMemo(() => {
    return JSON.parse(localStorage.getItem("historiqueInventaire")) || [];
  }, []);

  // 🔍 FILTRE
  const dataFiltre = historique.filter((h) => {
    const matchSource = source === "tous" || h.source === source;
    const matchSearch =
      h.periode.toLowerCase().includes(search.toLowerCase()) ||
      h.date.toLowerCase().includes(search.toLowerCase());

    return matchSource && matchSearch;
  });

  // 🖨 IMPRESSION
  const imprimer = () => {
    if (!dataFiltre.length) {
      alert("Aucun inventaire à imprimer.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Historique des Inventaires — LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [
        [
          "Date",
          "Source",
          "Période",
          "Produits",
          "Qté totale",
          "Bénéfice total",
        ],
      ],
      body: dataFiltre.map((h) => [
        h.date,
        h.source,
        h.periode,
        h.produits,
        h.quantiteTotale,
        `${h.beneficeTotal} FCFA`,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Historique_Inventaires_LPD.pdf");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Historique des Inventaires
      </h1>

      {/* FILTRES */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4 flex-wrap items-center">
        <Search className="text-[#472EAD]" />

        <input
          type="text"
          placeholder="Rechercher période ou date..."
          className="px-3 py-2 rounded-lg bg-gray-50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-3 py-2 rounded-lg bg-gray-50"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="tous">Tous</option>
          <option value="Boutique">Boutique</option>
          <option value="Dépôt">Dépôt</option>
        </select>

        <button
          onClick={imprimer}
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2 shadow"
        >
          <Printer size={18} /> Imprimer
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Période</th>
              <th className="text-center">Produits</th>
              <th className="text-center">Qté Totale</th>
              <th className="text-right">Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {dataFiltre.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td>{h.date}</td>
                <td>{h.source}</td>
                <td>{h.periode}</td>
                <td className="text-center">{h.produits}</td>
                <td className="text-center">{h.quantiteTotale}</td>
                <td className="text-right font-semibold">
                  {h.beneficeTotal} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!dataFiltre.length && (
          <p className="text-center text-gray-500 py-4">
            Aucun inventaire enregistré.
          </p>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ======================================================
   DONNÉES SIMULÉES
   (CES DONNÉES VIENDRONT DES INVENTAIRES BOUTIQUE & DEPOT)
====================================================== */

const historiquesInitiaux = [
  {
    id: 1,
    type: "boutique",
    periode: "2025.01.01 → 2025.02.13",
    dateImpression: "13/02/2025 10:30",
    totalVentes: 1600,
    totalAchats: 7500,
    resultatGlobal: -5900,
    detailsProduits: [{ produit: "Bic" }],
  },
  {
    id: 2,
    type: "depot",
    periode: "2025.01.01 → 2025.01.24",
    dateImpression: "24/01/2025 15:10",
    totalVentes: 3600,
    totalAchats: 2500,
    resultatGlobal: 1100,
    detailsProduits: [{ produit: "Bic" }],
  },
];

/* ======================================================
   UTILS
====================================================== */
const fcfa = (v) =>
  `${Number(v || 0)
    .toLocaleString("fr-FR")
    .replace(/\s/g, ".")} FCFA`;

/* ======================================================
   COMPOSANT
====================================================== */
export default function HistoriqueInventaires() {
  const [historiques, setHistoriques] = useState(historiquesInitiaux);
  const [filtreType, setFiltreType] = useState("tous");
  const [search, setSearch] = useState("");

  /* ================= FILTRAGE ================= */
  const historiquesFiltres = useMemo(() => {
    return historiques.filter((h) => {
      const matchType =
        filtreType === "tous" ? true : h.type === filtreType;

      const texte =
        `${h.type} ${h.periode} ${h.dateImpression}`.toLowerCase();
      const matchSearch = texte.includes(search.toLowerCase());

      return matchType && matchSearch;
    });
  }, [historiques, filtreType, search]);

  /* ================= IMPRESSION HISTORIQUE ================= */
  const imprimerHistorique = (liste) => {
    if (!liste.length) {
      alert("Aucun historique à imprimer");
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(14);
    doc.text("HISTORIQUE DES INVENTAIRES", 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [[
        "Type",
        "Période",
        "Date",
        "Total ventes",
        "Total achats",
        "Résultat",
      ]],
      body: liste.map((h) => [
        h.type === "boutique" ? "Boutique" : "Dépôt",
        h.periode,
        h.dateImpression,
        fcfa(h.totalVentes),
        fcfa(h.totalAchats),
        fcfa(h.resultatGlobal),
      ]),
    });

    doc.save("Historique_Inventaires.pdf");
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-indigo-700">
        Historique des Inventaires
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          className="border px-3 py-2"
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value)}
        >
          <option value="tous">Tous</option>
          <option value="boutique">Boutique</option>
          <option value="depot">Dépôt</option>
        </select>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
          <input
            className="border pl-8 px-3 py-2 w-full"
            placeholder="Recherche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => imprimerHistorique(historiquesFiltres)}
          className="bg-indigo-600 text-white px-4 py-2 flex gap-2 items-center justify-center"
        >
          <Printer size={18} /> Imprimer affichage
        </button>
      </div>

      {/* TABLEAU */}
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">Période</th>
            <th className="p-2">Date</th>
            <th className="p-2">Total ventes</th>
            <th className="p-2">Total achats</th>
            <th className="p-2">Résultat</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {historiquesFiltres.map((h) => (
            <tr key={h.id}>
              <td className="p-2 capitalize">{h.type}</td>
              <td className="p-2">{h.periode}</td>
              <td className="p-2">{h.dateImpression}</td>
              <td className="p-2 text-right">{fcfa(h.totalVentes)}</td>
              <td className="p-2 text-right">{fcfa(h.totalAchats)}</td>
              <td
                className={`p-2 text-right font-semibold ${
                  h.resultatGlobal < 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {fcfa(h.resultatGlobal)}
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => imprimerHistorique([h])}
                  className="text-indigo-600 hover:underline"
                >
                  Imprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

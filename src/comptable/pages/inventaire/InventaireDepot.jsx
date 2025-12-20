// ==========================================================
// 📦 InventaireDepot.jsx — Inventaire PRO Dépôt (CORRIGÉ)
// DESIGN : SHADOW ONLY (SANS BORDURES)
// ==========================================================

import React, { useState, useMemo } from "react";
import { Printer, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =======================
// 🔧 MOCK PRODUITS DÉPÔT
// =======================
const produitsDepot = [
  {
    id: 1,
    nom: "Ramette A4 80g",
    prixAchat: 2000,
    prixVente: 2500,
    sorties: [
      { date: "2025-02-04", quantite: 30 },
      { date: "2025-02-10", quantite: 25 },
    ],
  },
  {
    id: 2,
    nom: "Toner HP 85A",
    prixAchat: 15000,
    prixVente: 20000,
    sorties: [{ date: "2025-02-06", quantite: 3 }],
  },
  {
    id: 3,
    nom: "Stylos Bic Bleu",
    prixAchat: 100,
    prixVente: 150,
    sorties: [
      { date: "2025-02-03", quantite: 40 },
      { date: "2025-02-15", quantite: 60 },
    ],
  },
];

export default function InventaireDepot() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // =======================
  // 🔍 INVENTAIRE PAR PÉRIODE
  // =======================
  const inventaire = useMemo(() => {
    if (!dateDebut || !dateFin) return [];

    return produitsDepot
      .map((p) => {
        const sortiesPeriode = p.sorties.filter(
          (s) => s.date >= dateDebut && s.date <= dateFin
        );

        const quantiteSortie = sortiesPeriode.reduce(
          (s, v) => s + v.quantite,
          0
        );

        const benefice =
          quantiteSortie * (p.prixVente - p.prixAchat);

        return {
          id: p.id,
          nom: p.nom,
          quantiteSortie,
          benefice,
        };
      })
      .filter((p) => p.quantiteSortie > 0);
  }, [dateDebut, dateFin]);

  // =======================
  // 📊 TOTAUX
  // =======================
  const beneficeTotal = inventaire.reduce(
    (s, p) => s + p.benefice,
    0
  );

  const quantiteTotale = inventaire.reduce(
    (s, p) => s + p.quantiteSortie,
    0
  );

  // =======================
  // 🏆 TOP PRODUITS SORTIS
  // =======================
  const topProduits = [...inventaire]
    .sort((a, b) => b.quantiteSortie - a.quantiteSortie)
    .slice(0, 5);

  // =======================
  // 🖨 IMPRESSION + HISTORIQUE GLOBAL
  // =======================
  const imprimerInventaire = () => {
    if (!inventaire.length) {
      alert("Aucune donnée pour cette période.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Inventaire Dépôt — LPD Manager", 14, 16);
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} au ${dateFin}`, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [["Produit", "Quantité sortie", "Bénéfice"]],
      body: inventaire.map((p) => [
        p.nom,
        p.quantiteSortie,
        `${p.benefice} FCFA`,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    let y = doc.lastAutoTable.finalY + 10;
    doc.text(`Quantité totale sortie : ${quantiteTotale}`, 14, y);
    doc.text(`Bénéfice total : ${beneficeTotal} FCFA`, 14, y + 10);

    y += 25;
    doc.setFontSize(12);
    doc.text("Produits les plus sortis", 14, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["Rang", "Produit", "Quantité sortie"]],
      body: topProduits.map((p, i) => [
        i + 1,
        p.nom,
        p.quantiteSortie,
      ]),
      headStyles: { fillColor: [245, 128, 32] },
    });

    doc.save("Inventaire_Depot_LPD.pdf");

    // =======================
    // 📚 HISTORIQUE GLOBAL
    // =======================
    const historique =
      JSON.parse(localStorage.getItem("historiqueInventaire")) || [];

    historique.push({
      id: Date.now(),
      source: "Dépôt",
      date: new Date().toLocaleDateString(),
      periode: `${dateDebut} → ${dateFin}`,
      produits: inventaire.length,
      quantiteTotale,
      beneficeTotal,
    });

    localStorage.setItem(
      "historiqueInventaire",
      JSON.stringify(historique)
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Inventaire Dépôt
      </h1>

      {/* FILTRES */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4 flex-wrap">
        <div>
          <label>Date début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50"
          />
        </div>

        <div>
          <label>Date fin</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50"
          />
        </div>

        <button
          onClick={imprimerInventaire}
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2 shadow"
        >
          <Printer size={18} /> Imprimer inventaire
        </button>
      </div>

      {/* TABLE INVENTAIRE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th>Produit</th>
              <th className="text-center">Quantité sortie</th>
              <th className="text-right">Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {inventaire.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td>{p.nom}</td>
                <td className="text-center">{p.quantiteSortie}</td>
                <td className="text-right font-semibold">
                  {p.benefice} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOP PRODUITS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold text-[#472EAD] flex items-center gap-2">
          <TrendingUp /> Produits les plus sortis
        </h2>

        <ul className="mt-3 space-y-1">
          {topProduits.map((p, i) => (
            <li key={p.id}>
              {i + 1}. {p.nom} — {p.quantiteSortie} sorties
            </li>
          ))}
        </ul>

        <p className="mt-4 font-bold text-[#472EAD]">
          Bénéfice total : {beneficeTotal} FCFA
        </p>
      </div>
    </div>
  );
}

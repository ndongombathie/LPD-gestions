// ==========================================================
// 📦 InventaireBoutique.jsx — Inventaire PRO Boutique (CORRIGÉ)
// DESIGN : SHADOW ONLY (SANS BORDURES)
// ==========================================================

import React, { useState, useMemo } from "react";
import { Printer, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =======================
// 🔧 MOCK PRODUITS
// =======================
const produits = [
  {
    id: 1,
    nom: "Cahier 100 pages",
    prixAchat: 200,
    prixVente: 300,
    ventes: [
      { date: "2025-02-10", quantite: 20 },
      { date: "2025-02-15", quantite: 15 },
    ],
  },
  {
    id: 2,
    nom: "Bic Bleu",
    prixAchat: 100,
    prixVente: 150,
    ventes: [
      { date: "2025-02-12", quantite: 40 },
      { date: "2025-02-16", quantite: 30 },
    ],
  },
  {
    id: 3,
    nom: "Classeur A4",
    prixAchat: 1500,
    prixVente: 2000,
    ventes: [{ date: "2025-02-11", quantite: 5 }],
  },
];

export default function InventaireBoutique() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // =======================
  // 🔍 INVENTAIRE PAR PÉRIODE
  // =======================
  const inventaire = useMemo(() => {
    if (!dateDebut || !dateFin) return [];

    return produits
      .map((p) => {
        const ventesPeriode = p.ventes.filter(
          (v) => v.date >= dateDebut && v.date <= dateFin
        );

        const quantiteVendue = ventesPeriode.reduce(
          (s, v) => s + v.quantite,
          0
        );

        const benefice =
          quantiteVendue * (p.prixVente - p.prixAchat);

        return {
          ...p,
          quantiteVendue,
          benefice,
        };
      })
      .filter((p) => p.quantiteVendue > 0);
  }, [dateDebut, dateFin]);

  const beneficeTotal = inventaire.reduce(
    (s, p) => s + p.benefice,
    0
  );

  const quantiteTotale = inventaire.reduce(
    (s, p) => s + p.quantiteVendue,
    0
  );

  // =======================
  // 🏆 TOP PRODUITS
  // =======================
  const topProduits = [...inventaire]
    .sort((a, b) => b.quantiteVendue - a.quantiteVendue)
    .slice(0, 5);

  // =======================
  // 🖨 IMPRESSION + HISTORIQUE
  // =======================
  const imprimerInventaire = () => {
    if (!inventaire.length) {
      alert("Aucune donnée pour cette période.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Inventaire Boutique — LPD Manager", 14, 16);
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [["Produit", "Quantité vendue", "Bénéfice"]],
      body: inventaire.map((p) => [
        p.nom,
        p.quantiteVendue,
        `${p.benefice} FCFA`,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    let y = doc.lastAutoTable.finalY + 10;
    doc.text(`BÉNÉFICE TOTAL : ${beneficeTotal} FCFA`, 14, y);

    y += 15;
    doc.setFontSize(12);
    doc.text("Produits les plus vendus :", 14, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["Rang", "Produit", "Quantité"]],
      body: topProduits.map((p, i) => [
        i + 1,
        p.nom,
        p.quantiteVendue,
      ]),
      headStyles: { fillColor: [245, 128, 32] },
    });

    doc.save("Inventaire_Boutique_LPD.pdf");

    // =======================
    // 📚 HISTORIQUE GLOBAL
    // =======================
    const historique =
      JSON.parse(localStorage.getItem("historiqueInventaire")) || [];

    historique.push({
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      source: "Boutique",
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
        Inventaire Boutique
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

      {/* TABLE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th>Produit</th>
              <th className="text-center">Quantité vendue</th>
              <th className="text-right">Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {inventaire.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td>{p.nom}</td>
                <td className="text-center">{p.quantiteVendue}</td>
                <td className="text-right font-semibold">
                  {p.benefice} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOP */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold text-[#472EAD] flex items-center gap-2">
          <TrendingUp /> Produits les plus vendus
        </h2>

        <ul className="mt-3 space-y-1">
          {topProduits.map((p, i) => (
            <li key={p.id}>
              {i + 1}. {p.nom} — {p.quantiteVendue} ventes
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

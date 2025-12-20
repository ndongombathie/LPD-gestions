// ==========================================================
// 🏪 Boutique.jsx — Contrôle Gestionnaire (PRO)
// DESIGN SHADOW (SANS BORDURES)
// ==========================================================

import React, { useState, useMemo } from "react";
import {
  Search,
  Printer,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// === 📊 GRAPHIQUE ===
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ==========================================================
// 📦 DONNÉES STOCK
// ==========================================================
const stockBoutique = [
  {
    id: 1,
    produit: "Cahier 100 pages",
    categorie: "Papeterie",
    quantite: 14,
    minStock: 10,
    sorties: 36,
    historiqueReappro: [
      { date: "2025-02-01", avant: 5, ajout: 20 },
      { date: "2025-02-10", avant: 25, ajout: 25 },
    ],
    date: "2025-02-16",
  },
  {
    id: 2,
    produit: "Bic Bleu",
    categorie: "Papeterie",
    quantite: 2,
    minStock: 10,
    sorties: 98,
    historiqueReappro: [{ date: "2025-02-05", avant: 0, ajout: 50 }],
    date: "2025-02-16",
  },
  {
    id: 3,
    produit: "Classeur A4",
    categorie: "Bureau",
    quantite: 0,
    minStock: 5,
    sorties: 20,
    historiqueReappro: [],
    date: "2025-02-15",
  },
];

// ==========================================================
// 🔧 ÉTAT STOCK
// ==========================================================
const getEtat = (p) => {
  if (p.quantite === 0) return "rupture";
  if (p.quantite <= p.minStock) return "faible";
  return "ok";
};

// ==========================================================
// 📈 GRAPHIQUE ÉVOLUTION
// ==========================================================
function EvolutionStockGraph({ produit }) {
  if (!produit) return null;

  const historique = produit.historiqueReappro.map((h) => ({
    date: h.date,
    entrees: h.ajout,
    sorties: 0,
    stock: h.avant + h.ajout,
  }));

  historique.push({
    date: "Sorties",
    entrees: 0,
    sorties: produit.sorties,
    stock: produit.quantite,
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 mt-6">
      <h2 className="text-sm font-semibold text-[#472EAD] mb-4">
        Évolution du stock — {produit.produit}
      </h2>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={historique}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line dataKey="entrees" stroke="#22c55e" strokeWidth={3} name="Entrées" />
          <Line dataKey="sorties" stroke="#ef4444" strokeWidth={3} name="Sorties" />
          <Line dataKey="stock" stroke="#472EAD" strokeWidth={3} name="Stock restant" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================================
// 📌 PAGE
// ==========================================================
export default function Boutique() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [selectedProduitId, setSelectedProduitId] = useState("");

  // ==========================================================
  // 🔍 FILTRAGE
  // ==========================================================
  const filteredData = useMemo(() => {
    let data = [...stockBoutique];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (p) =>
          p.produit.toLowerCase().includes(q) ||
          p.categorie.toLowerCase().includes(q)
      );
    }

    if (dateDebut) data = data.filter((p) => p.date >= dateDebut);
    if (dateFin) data = data.filter((p) => p.date <= dateFin);

    return data;
  }, [searchTerm, dateDebut, dateFin]);

  // ==========================================================
  // 🖨 PDF
  // ==========================================================
  const imprimerPDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Boutique — Rapport LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Produit", "Stock", "Entrées", "Sorties", "Réappro (nb)", "Dernier"]],
      body: filteredData.map((p) => {
        const totalReappro = p.historiqueReappro.reduce((s, h) => s + h.ajout, 0);
        const nbReappro = p.historiqueReappro.length;
        const dernier = nbReappro ? p.historiqueReappro[nbReappro - 1].date : "-";
        return [p.produit, p.quantite, totalReappro, p.sorties, nbReappro, dernier];
      }),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Stock_Boutique_LPD.pdf");
  };

  return (
    <div className="space-y-8">

      {/* TITRE */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Contrôle Gestionnaire — Boutique
        </h1>
        <p className="text-sm text-gray-500">
          Suivi du stock, réapprovisionnements et évolution
        </p>
      </div>

      {/* FILTRES */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-[#472EAD]" />
          <input
            className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-[#472EAD]/30"
            placeholder="Rechercher produit ou catégorie…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedProduitId}
          onChange={(e) => setSelectedProduitId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
        >
          <option value="">Tous les produits</option>
          {stockBoutique.map((p) => (
            <option key={p.id} value={p.id}>{p.produit}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
        />

        <input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
        />

        <button
          onClick={imprimerPDF}
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-xl shadow hover:shadow-lg"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[#472EAD] bg-[#F5F3FF]">
            <tr>
              <th className="px-3 py-2 text-left">Produit</th>
              <th className="px-3 py-2 text-center">État</th>
              <th className="px-3 py-2 text-center">Stock</th>
              <th className="px-3 py-2 text-center">Entrées</th>
              <th className="px-3 py-2 text-center">Sorties</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((p) => {
              const etat = getEtat(p);
              const totalReappro = p.historiqueReappro.reduce((s, h) => s + h.ajout, 0);

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{p.produit}</td>
                  <td className="px-3 py-2 text-center">
                    {etat === "rupture" && <span className="text-red-600 flex justify-center gap-1"><AlertTriangle size={14}/>Rupture</span>}
                    {etat === "faible" && <span className="text-orange-500">Stock faible</span>}
                    {etat === "ok" && <span className="text-emerald-600 flex justify-center gap-1"><CheckCircle size={14}/>OK</span>}
                  </td>
                  <td className="px-3 py-2 text-center">{p.quantite}</td>
                  <td className="px-3 py-2 text-center">{totalReappro}</td>
                  <td className="px-3 py-2 text-center">{p.sorties}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GRAPHIQUE */}
      {selectedProduitId && (
        <EvolutionStockGraph
          produit={stockBoutique.find((p) => p.id === Number(selectedProduitId))}
        />
      )}
    </div>
  );
}

// ==========================================================
// 🏪 Depot.jsx — Contrôle Gestionnaire Dépôt (PRO)
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

// 📊 Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ==========================================================
// 📦 STOCK DÉPÔT
// ==========================================================
const stockDepot = [
  {
    id: 1,
    produit: "Ramette A4 80g",
    categorie: "Papeterie",
    quantite: 120,
    minStock: 50,
    sorties: 340,
    historiqueReappro: [
      { date: "2025-01-15", avant: 20, ajout: 100 },
      { date: "2025-02-03", avant: 80, ajout: 40 },
    ],
    date: "2025-02-16",
  },
  {
    id: 2,
    produit: "Carton Stylos Bic",
    categorie: "Papeterie",
    quantite: 15,
    minStock: 30,
    sorties: 120,
    historiqueReappro: [
      { date: "2025-01-05", avant: 5, ajout: 60 },
      { date: "2025-02-12", avant: 25, ajout: 20 },
    ],
    date: "2025-02-16",
  },
  {
    id: 3,
    produit: "Toner HP 85A",
    categorie: "Impression",
    quantite: 0,
    minStock: 2,
    sorties: 12,
    historiqueReappro: [],
    date: "2025-02-15",
  },
];

// ==========================================================
// 🔧 ÉTAT DU STOCK
// ==========================================================
const getEtat = (p) => {
  if (p.quantite === 0) return "rupture";
  if (p.quantite <= p.minStock) return "faible";
  return "ok";
};

export default function Depot() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // ==========================================================
  // 🔍 FILTRAGE
  // ==========================================================
  const filteredData = useMemo(() => {
    let data = [...stockDepot];

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
    doc.text("Stock Dépôt — Rapport LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [
        ["Produit", "Stock", "Entrées", "Sorties", "Réappro.", "Dernier"],
      ],
      body: filteredData.map((p) => {
        const totalReappro = p.historiqueReappro.reduce(
          (s, h) => s + h.ajout,
          0
        );
        const nbReappro = p.historiqueReappro.length;
        const dernier = nbReappro
          ? p.historiqueReappro[nbReappro - 1].date
          : "-";

        return [
          p.produit,
          p.quantite,
          totalReappro,
          p.sorties,
          nbReappro,
          dernier,
        ];
      }),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Stock_Depot_LPD.pdf");
  };

  return (
    <div className="space-y-8">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Contrôle Gestionnaire — Dépôt
        </h1>
        <p className="text-sm text-gray-500">
          Suivi du stock dépôt, entrées, sorties et réapprovisionnements
        </p>
      </div>

      {/* ================= FILTRES ================= */}
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

      {/* ================= GRAPHIQUE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h2 className="text-sm font-semibold text-[#472EAD] mb-4">
          Entrées & Sorties du Dépôt
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockDepot}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="produit" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sorties" fill="#ef4444" name="Sorties" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F3FF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2 text-left">Produit</th>
              <th className="px-3 py-2 text-center">État</th>
              <th className="px-3 py-2 text-center">Stock</th>
              <th className="px-3 py-2 text-center">Entrées</th>
              <th className="px-3 py-2 text-center">Sorties</th>
              <th className="px-3 py-2 text-center">Dernier réappro</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((p) => {
              const totalReappro = p.historiqueReappro.reduce(
                (s, h) => s + h.ajout,
                0
              );
              const dernier = p.historiqueReappro.length
                ? p.historiqueReappro[p.historiqueReappro.length - 1]
                : null;

              const etat = getEtat(p);

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{p.produit}</td>

                  <td className="px-3 py-2 text-center">
                    {etat === "rupture" && (
                      <span className="text-red-600 flex justify-center gap-1">
                        <AlertTriangle size={14} /> Rupture
                      </span>
                    )}
                    {etat === "faible" && (
                      <span className="text-orange-500 font-medium">
                        Stock faible
                      </span>
                    )}
                    {etat === "ok" && (
                      <span className="text-emerald-600 flex justify-center gap-1">
                        <CheckCircle size={14} /> OK
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-center">{p.quantite}</td>
                  <td className="px-3 py-2 text-center">{totalReappro}</td>
                  <td className="px-3 py-2 text-center">{p.sorties}</td>

                  <td className="px-3 py-2 text-center">
                    {dernier ? (
                      <span className="text-sm text-gray-600">
                        {dernier.date} (+{dernier.ajout})
                      </span>
                    ) : (
                      <span className="text-gray-400">Jamais</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

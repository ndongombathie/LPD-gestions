// ==========================================================
// 🏪 Depot.jsx — Contrôle Gestionnaire Dépôt (Version PRO + Graphique)
// - Suivi complet du stock dépôt
// - Historique des réapprovisionnements
// - Graphique Entrées / Sorties
// - Nombre total de réapprovisionnements
// - Stock avant/après réapprovisionnements
// - Quantité totale ayant transité dans le dépôt
// - Filtre + Impression PDF
// ==========================================================

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Printer,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 📊 Recharts (Graphique)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

// ==========================================================
// 📦 STOCK DÉPÔT AVEC HISTORIQUE COMPLET
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
  }
];

// ==========================================================
// 🔧 FONCTIONS UTILES
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
  // 🔍 FILTRAGE INTELLIGENT
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
  // 🖨 IMPRESSION PDF
  // ==========================================================
  const imprimerPDF = () => {
    const doc = new jsPDF();
    doc.text("📦 Stock Dépôt — Rapport Complet LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [
        [
          "Produit",
          "Stock Actuel",
          "Total Entré",
          "Sorties",
          "Nb Réappro.",
          "Dernier Réappro.",
        ],
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
      styles: { fontSize: 10 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Stock_Depot_LPD.pdf");
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Dépôt
      </h1>
      <p className="text-gray-600">
        État complet du dépôt + historique réapprovisionnement.
      </p>

      {/* ==========================================================
          🔧 BARRE DE RECHERCHE + FILTRES
      ========================================================== */}
      <div className="p-4 bg-white rounded-xl shadow border flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-[#472EAD]" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label>Date début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label>Date fin</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2"
          onClick={imprimerPDF}
        >
          <Printer size={18} /> Imprimer
        </button>
      </div>

      {/* ==========================================================
          📊 GRAPHIQUE — Entrées & Sorties
      ========================================================== */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-[#472EAD] mb-3">
          Graphique — Entrées & Sorties du Dépôt
        </h2>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={stockDepot}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="produit" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="entree" name="Entrées" fill="#4CAF50" />
              <Bar dataKey="sorties" name="Sorties" fill="#F44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================================
          📦 TABLEAU STOCK COMPLET
      ========================================================== */}
      <div className="bg-white rounded-xl shadow border p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2 text-left">Produit</th>
              <th className="px-3 py-2">État</th>
              <th className="px-3 py-2 text-center">Stock Actuel</th>
              <th className="px-3 py-2 text-center">Total Entré</th>
              <th className="px-3 py-2 text-center">Nb Réappro.</th>
              <th className="px-3 py-2 text-center">Sorties</th>
              <th className="px-3 py-2 text-center">Dernier Réappro.</th>
              <th className="px-3 py-2 text-center">Stock Total Historique</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((p) => {
              const nbReappro = p.historiqueReappro.length;
              const totalReappro = p.historiqueReappro.reduce(
                (s, h) => s + h.ajout,
                0
              );
              const dernier = nbReappro
                ? p.historiqueReappro[nbReappro - 1]
                : null;

              const stockHistoriqueTotal = p.quantite + p.sorties;

              const etat = getEtat(p);

              return (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2">{p.produit}</td>

                  {/* État visuel */}
                  <td className="px-3 py-2 text-center">
                    {etat === "rupture" && (
                      <span className="text-red-600 font-semibold">
                        <AlertTriangle size={12} /> Rupture
                      </span>
                    )}
                    {etat === "faible" && (
                      <span className="text-orange-500 font-semibold">
                        ⚠ Stock faible
                      </span>
                    )}
                    {etat === "ok" && (
                      <span className="text-emerald-600 font-semibold">
                        <CheckCircle size={12} /> OK
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-center">{p.quantite}</td>
                  <td className="px-3 py-2 text-center">{totalReappro}</td>
                  <td className="px-3 py-2 text-center">{nbReappro}</td>
                  <td className="px-3 py-2 text-center">{p.sorties}</td>

                  <td className="px-3 py-2 text-center">
                    {dernier ? (
                      <div className="text-blue-600 font-medium">
                        {dernier.date}
                        <br />
                        <span className="text-xs text-gray-500">
                          +{dernier.ajout} (avant: {dernier.avant})
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Jamais</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-center">
                    {stockHistoriqueTotal}
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

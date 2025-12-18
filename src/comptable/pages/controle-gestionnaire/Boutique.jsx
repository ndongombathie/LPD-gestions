// ==========================================================
// 🏪 Boutique.jsx — Contrôle Gestionnaire (Version PRO + Graphique)
// - Suivi complet du stock
// - Historique des réapprovisionnements
// - Nombre total de réapprovisionnements
// - Stock avant/après
// - Quantité totale ayant transité
// - Filtre + Impression + Graphique d’évolution
// ==========================================================

import React, { useState, useMemo } from "react";
import { Calendar, Search, Printer, AlertTriangle, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// === 📊 Recharts (GRAPHIQUE) ===
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
// 📦 STOCK AVEC HISTORIQUE COMPLET
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
// 🔧 FONCTIONS UTILES
// ==========================================================
const getEtat = (p) => {
  if (p.quantite === 0) return "rupture";
  if (p.quantite <= p.minStock) return "faible";
  return "ok";
};

// ==========================================================
// 📈 GRAPHIQUE D'ÉVOLUTION DU STOCK
// ==========================================================
function EvolutionStockGraph({ produit }) {
  if (!produit || !produit.historiqueReappro) return null;

  let historique = [];

  // Entrées (réappro)
  produit.historiqueReappro.forEach((h) => {
    historique.push({
      date: h.date,
      entrees: h.ajout,
      sorties: 0,
      stock: h.avant + h.ajout,
    });
  });

  // Sorties cumulées
  historique.push({
    date: "Sorties",
    entrees: 0,
    sorties: produit.sorties,
    stock: produit.quantite,
  });

  return (
    <div className="bg-white p-4 rounded-xl shadow border mt-5">
      <h2 className="text-lg font-semibold text-[#472EAD] mb-3">
        📈 Évolution du stock — {produit.produit}
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={historique}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey="entrees" stroke="#4CAF50" strokeWidth={3} name="Entrées" />
          <Line type="monotone" dataKey="sorties" stroke="#F44336" strokeWidth={3} name="Sorties" />
          <Line type="monotone" dataKey="stock" stroke="#3F51B5" strokeWidth={3} name="Stock restant" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Boutique() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [selectedProduitId, setSelectedProduitId] = useState("");

  // ==========================================================
  // 🔍 FILTRAGE INTELLIGENT
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
  // 🖨 IMPRESSION PDF
  // ==========================================================
  const imprimerPDF = () => {
    const doc = new jsPDF();
    doc.text("📦 Stock Boutique — Rapport Complet LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Produit", "Stock Actuel", "Entrées totales", "Sorties", "Réappro (nb)", "Dernier Réappro"]],
      body: filteredData.map((p) => {
        const totalReappro = p.historiqueReappro.reduce((s, h) => s + h.ajout, 0);
        const nbReappro = p.historiqueReappro.length;
        const dernier = nbReappro ? p.historiqueReappro[nbReappro - 1].date : "-";

        return [p.produit, p.quantite, totalReappro, p.sorties, nbReappro, dernier];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Stock_Boutique_LPD.pdf");
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold text-[#472EAD]">Contrôle Gestionnaire — Boutique</h1>
      <p className="text-gray-600">Visualisation complète du stock + historique réapprovisionnement + graphique.</p>

      {/* ======================================================
          🔧 BARRE DE RECHERCHE + FILTRES
      ====================================================== */}
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
          <label>Produit</label>
          <select
            value={selectedProduitId}
            onChange={(e) => setSelectedProduitId(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Choisir un produit</option>
            {stockBoutique.map((p) => (
              <option key={p.id} value={p.id}>{p.produit}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Date début</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="px-3 py-2 border rounded-lg" />
        </div>

        <div>
          <label>Date fin</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="px-3 py-2 border rounded-lg" />
        </div>

        <button className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2" onClick={imprimerPDF}>
          <Printer size={18} /> Imprimer
        </button>
      </div>

      {/* ======================================================
          📦 TABLEAU STOCK COMPLET
      ====================================================== */}
      <div className="bg-white rounded-xl shadow border p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2 text-left">Produit</th>
              <th className="px-3 py-2">État</th>
              <th className="px-3 py-2 text-center">Stock Actuel</th>
              <th className="px-3 py-2 text-center">Total réapprovisionné</th>
              <th className="px-3 py-2 text-center">Nombre réappro.</th>
              <th className="px-3 py-2 text-center">Sorties</th>
              <th className="px-3 py-2 text-center">Dernier réappro</th>
              <th className="px-3 py-2 text-center">Stock total historique</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((p) => {
              const totalReappro = p.historiqueReappro.reduce((s, h) => s + h.ajout, 0);
              const nbReappro = p.historiqueReappro.length;
              const dernier = nbReappro ? p.historiqueReappro[nbReappro - 1] : null;
              const stockHistoriqueTotal = p.quantite + p.sorties;
              const etat = getEtat(p);

              return (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2">{p.produit}</td>

                  <td className="px-3 py-2 text-center">
                    {etat === "rupture" && <span className="text-red-600 font-semibold"><AlertTriangle size={12}/> Rupture</span>}
                    {etat === "faible" && <span className="text-orange-500 font-semibold">⚠ Stock faible</span>}
                    {etat === "ok" && <span className="text-emerald-600 font-semibold"><CheckCircle size={12}/> OK</span>}
                  </td>

                  <td className="px-3 py-2 text-center">{p.quantite}</td>
                  <td className="px-3 py-2 text-center">{totalReappro}</td>
                  <td className="px-3 py-2 text-center">{nbReappro}</td>
                  <td className="px-3 py-2 text-center">{p.sorties}</td>

                  <td className="px-3 py-2 text-center">
                    {dernier ? (
                      <>
                        {dernier.date}
                        <div className="text-xs text-gray-500">
                          +{dernier.ajout} (avant {dernier.avant})
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">Jamais</span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-center">{stockHistoriqueTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ======================================================
          📈 GRAPHIQUE D'ÉVOLUTION (SI PRODUIT CHOISI)
      ====================================================== */}
      {selectedProduitId && (
        <EvolutionStockGraph
          produit={stockBoutique.find((p) => p.id === Number(selectedProduitId))}
        />
      )}
    </div>
  );
}

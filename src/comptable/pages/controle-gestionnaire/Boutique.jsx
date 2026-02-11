// ==========================================================
// 🏪 Boutique.jsx — Contrôle Gestionnaire / Comptable (PRO)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Search, Printer, AlertTriangle, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import boutiqueAPI from "@/services/api/boutique";

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

/* ================= ÉTAT STOCK ================= */
const getEtat = (p) => {
  if (p.quantite === 0) return "rupture";
  if (p.quantite <= p.seuil) return "faible";
  return "ok";
};

/* ================= GRAPHIQUE ================= */
function EvolutionStockGraph({ produit }) {
  if (!produit) return null;

  const data = [
    {
      date: "Actuel",
      entrees: produit.entrees,
      sorties: produit.sorties,
      stock: produit.quantite,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h2 className="text-sm font-semibold text-[#472EAD] mb-4">
        Évolution du stock — {produit.nom}
      </h2>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="entrees" stroke="#22c55e" strokeWidth={3} />
            <Line dataKey="sorties" stroke="#ef4444" strokeWidth={3} />
            <Line dataKey="stock" stroke="#472EAD" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */
export default function Boutique() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH API ================= */
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        setLoading(true);
        const res = await boutiqueAPI.getProduitsControle();
        setRows(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setError("Erreur lors du chargement des produits boutique");
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, []);

  /* ================= NORMALISATION ================= */
  const stockBoutique = useMemo(() => {
    return rows.map((row) => ({
      id: row.produit.id,
      nom: row.produit.nom,
      quantite: row.quantite ?? 0,
      seuil: row.seuil ?? 0,
      entrees: row.entrees ?? 0,
      sorties: row.sorties ?? 0,
      date: row.updated_at?.slice(0, 10),
    }));
  }, [rows]);

  /* ================= FILTRAGE ================= */
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return stockBoutique;

    const q = searchTerm.toLowerCase();
    return stockBoutique.filter((p) =>
      p.nom.toLowerCase().includes(q)
    );
  }, [stockBoutique, searchTerm]);

  /* ================= PDF ================= */
  const imprimerPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    doc.setFillColor(71, 46, 173);
    doc.roundedRect(14, 10, 180, 24, 3, 3, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 26, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 32, { align: "center" });

    doc.setTextColor(0);
    doc.text(
      `Date d'impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      42
    );

    autoTable(doc, {
      startY: 55,
      head: [["Produit", "Stock", "Seuil"]],
      body: filteredData.map((p) => [
        p.nom,
        p.quantite,
        p.seuil,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save("Stock_Boutique_LPD.pdf");
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-8">
      {/* TITRE */}
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Boutique
      </h1>

      {/* FILTRES */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex gap-4 items-center">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-[#472EAD]" />
          <input
            className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm"
            placeholder="Rechercher un produit…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={imprimerPDF}
          className="px-4 py-2 bg-[#472EAD] text-white rounded-xl flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#F5F3FF] text-[#472EAD]">
            <tr>
              <th className="px-4 py-2 text-left">Produit</th>
              <th className="px-4 py-2 text-center">État</th>
              <th className="px-4 py-2 text-center">Stock</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((p) => {
              const etat = getEtat(p);

              return (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2">{p.nom}</td>

                  {/* ✅ ÉTAT PARFAITEMENT ALIGNÉ */}
                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center">
                      {etat === "rupture" && (
                        <AlertTriangle size={16} className="text-red-600" />
                      )}
                      {etat === "faible" && (
                        <AlertTriangle size={16} className="text-orange-500" />
                      )}
                      {etat === "ok" && (
                        <CheckCircle size={16} className="text-emerald-600" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-2 text-center font-medium">
                    {p.quantite}
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

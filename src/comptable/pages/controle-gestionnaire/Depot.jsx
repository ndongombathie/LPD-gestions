// ==========================================================
// 🏪 Depot.jsx — Contrôle Gestionnaire Dépôt (STABLE + FIX)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Printer,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

import { depotAPI } from "@/services/api/depot";

// ==========================================================
// 🔧 UTILS
// ==========================================================
const getEtat = (p) => {
  if (p.quantite === 0) return "rupture";
  if (p.quantite <= p.seuil_stock) return "faible";
  return "ok";
};

// ==========================================================
// 📌 COMPOSANT
// ==========================================================
export default function Depot() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ================= FETCH API =================
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        setLoading(true);
        const data = await depotAPI.getProduitsDepot();
        setProduits(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Erreur lors du chargement du stock dépôt");
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, []);

  // ================= FILTRAGE =================
  const filteredData = useMemo(() => {
    let data = [...produits];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (p) =>
          p.nom?.toLowerCase().includes(q) ||
          p.categorie?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [produits, searchTerm]);

  // ================= PDF =================
  const imprimerPDF = () => {
    const doc = new jsPDF();
    let y = 18;

    // Bandeau logo
    doc.setFillColor(71, 46, 173);
    doc.rect(10, 8, 190, 22, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 22, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 28, { align: "center" });

    y = 42;
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("GESTION DU DÉPÔT", 14, y);

    y += 8;
    doc.setFontSize(11);
    doc.text(`Date d'impression : ${new Date().toLocaleString("fr-FR")}`, 14, y);

    autoTable(doc, {
      startY: y + 8,
      head: [["Produit", "Stock", "Entrées", "Sorties", "État"]],
      body: filteredData.map((p) => [
        p.nom,
        p.quantite,
        p.total_entrees ?? 0,
        p.total_sorties ?? 0,
        getEtat(p),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("GESTION_DEPOT_LPD.pdf");
  };

  // ================= UI =================
  if (loading) return <p className="p-6">Chargement du stock dépôt…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    // 🔑 CONTENEUR PRINCIPAL — FIX ABSOLU
    <div className="flex flex-col gap-10 w-full min-h-screen p-6 overflow-x-hidden">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Contrôle Gestionnaire — Dépôt
        </h1>
        <p className="text-sm text-gray-500">
          Suivi du stock dépôt, entrées et sorties
        </p>
      </div>

      {/* ================= FILTRES ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap gap-4 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={18} className="text-[#472EAD]" />
          <input
            className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm"
            placeholder="Rechercher produit ou catégorie…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={imprimerPDF}
          className="px-4 py-2 bg-[#472EAD] text-white rounded-xl shadow hover:shadow-lg flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* ================= GRAPHIQUE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-5 w-full relative">
        <h2 className="text-sm font-semibold text-[#472EAD] mb-4">
          Sorties par produit
        </h2>

        {filteredData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-gray-400">
            Aucune donnée disponible
          </div>
        ) : (
          // 🔑 HAUTEUR EXPLICITE = FIN DES SUPERPOSITIONS
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_sorties" fill="#ef4444" name="Sorties" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 w-full overflow-x-auto relative">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F3FF] text-[#472EAD]">
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

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{p.nom}</td>

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
                  <td className="px-3 py-2 text-center">{p.total_entrees ?? 0}</td>
                  <td className="px-3 py-2 text-center">{p.total_sorties ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

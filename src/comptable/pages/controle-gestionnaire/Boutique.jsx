// ==========================================================
// 🏪 Boutique.jsx — Contrôle Gestionnaire / Comptable (PRO MAX)
// Pagination 25 + Impression Page & Globale
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Printer, AlertTriangle, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import boutiqueAPI from "@/services/api/boutique";

/* ================= CONFIG ================= */
const PER_PAGE = 25;

const fcfa = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

/* ================= ÉTAT STOCK ================= */
const getEtat = (p) => {
  if (p.quantite === 0) return "rupture";
  if (p.quantite <= p.seuil) return "faible";
  return "ok";
};

export default function Boutique() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await boutiqueAPI.getProduitsControle({
        page,
        per_page: PER_PAGE,
      });

      setRows(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch (err) {
      setError("Erreur lors du chargement des produits boutique");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= NORMALISATION ================= */
  const stockBoutique = useMemo(() => {
    return rows.map((row) => ({
      id: row.produit?.id,
      nom: row.produit?.nom ?? "—",
      quantite: Number(row.quantite ?? 0),
      seuil: Number(row.seuil ?? 0),
      entrees: Number(row.entrees ?? 0),
      sorties: Number(row.sorties ?? 0),
    }));
  }, [rows]);

  /* ================= FILTRE LOCAL ================= */
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return stockBoutique;

    const q = searchTerm.toLowerCase();
    return stockBoutique.filter((p) =>
      p.nom.toLowerCase().includes(q)
    );
  }, [stockBoutique, searchTerm]);

  /* ================= PDF GENERATOR ================= */
  const generatePDF = (data, fileName) => {
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
      `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      42
    );

    autoTable(doc, {
      startY: 55,
      head: [["Produit", "Stock", "Seuil"]],
      body: data.map((p) => [p.nom, p.quantite, p.seuil]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save(fileName);
  };

  /* ================= IMPRESSION PAGE ================= */
  const imprimerPage = () => {
    generatePDF(filteredData, "Stock_Boutique_Page.pdf");
  };

  /* ================= IMPRESSION GLOBALE ================= */
  const imprimerGlobale = async () => {
    try {
      const res = await boutiqueAPI.getProduitsControle({
        page: 1,
        per_page: 10000, // récupère tout
      });

      const allData = (res.data ?? []).map((row) => ({
        nom: row.produit?.nom ?? "—",
        quantite: Number(row.quantite ?? 0),
        seuil: Number(row.seuil ?? 0),
      }));

      generatePDF(allData, "Stock_Boutique_Global.pdf");
    } catch {
      alert("Erreur impression globale");
    }
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-8">

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
          onClick={imprimerPage}
          className="px-4 py-2 bg-[#472EAD] text-white rounded-xl flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer page
        </button>

        <button
          onClick={imprimerGlobale}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer global
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
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{p.nom}</td>

                  <td className="px-4 py-2 text-center">
                    {etat === "rupture" && (
                      <AlertTriangle size={16} className="text-red-600 mx-auto" />
                    )}
                    {etat === "faible" && (
                      <AlertTriangle size={16} className="text-orange-500 mx-auto" />
                    )}
                    {etat === "ok" && (
                      <CheckCircle size={16} className="text-emerald-600 mx-auto" />
                    )}
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

      {/* PAGINATION */}
      {pagination && (
        <div className="flex justify-between items-center text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Précédent
          </button>

          <span>
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>

          <button
            disabled={page === pagination.lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================================
// 🏭 DepotControle.jsx — PRO MAX (Pagination 25 + Print Global)
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Printer, AlertTriangle, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import depotAPI from "@/services/api/depot";

// ==========================================================
// 🔧 ÉTAT STOCK
// ==========================================================
const getEtat = (stock, seuil) => {
  if (stock === 0) return "rupture";
  if (stock <= seuil) return "faible";
  return "ok";
};

// ==========================================================
// 📌 COMPOSANT
// ==========================================================
export default function DepotControle() {
  const [produits, setProduits] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const perPage = 25;

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await depotAPI.getProduitsControle({
        page,
        per_page: perPage,
      });

      setProduits(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch {
      setError("Erreur lors du chargement des produits dépôt");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= NORMALISATION =================
  const rows = useMemo(() => {
    return produits.map((p) => {
      let entrees = 0;
      let sorties = 0;

      if (Array.isArray(p.entreees_sorties)) {
        p.entreees_sorties.forEach((m) => {
          if (m.quantite_apres > m.quantite_avant) {
            entrees += m.quantite_apres - m.quantite_avant;
          } else if (m.quantite_avant > m.quantite_apres) {
            sorties += m.quantite_avant - m.quantite_apres;
          }
        });
      }

      return {
        id: p.id,
        nom: p.nom,
        stock: p.stock_global ?? 0,
        seuil: p.stock_seuil ?? 0,
        entrees,
        sorties,
      };
    });
  }, [produits]);

  // ================= FILTRE LOCAL =================
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    return rows.filter((p) =>
      p.nom.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  // ================= PDF PAGE =================
  const imprimerPage = () => {
    generatePDF(filtered, "Controle_Depot_Page.pdf");
  };

  // ================= PDF GLOBAL =================
  const imprimerGlobal = async () => {
    try {
      const res = await depotAPI.getProduitsControle({
        page: 1,
        per_page: 10000, // récupère tout
      });

      const allRows = res.data.map((p) => ({
        id: p.id,
        nom: p.nom,
        stock: p.stock_global ?? 0,
        seuil: p.stock_seuil ?? 0,
      }));

      generatePDF(allRows, "Controle_Depot_Global.pdf");
    } catch {
      alert("Erreur impression globale");
    }
  };

  // ================= GENERATE PDF =================
  const generatePDF = (data, filename) => {
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
    doc.setFontSize(9);
    doc.text(
      `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      42
    );

    autoTable(doc, {
      startY: 50,
      head: [["Produit", "Stock", "État"]],
      body: data.map((p) => [
        p.nom,
        p.stock,
        getEtat(p.stock, p.seuil),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save(filename);
  };

  // ================= UI =================
  if (loading) return <p className="p-6">Chargement…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 flex flex-col gap-8">

      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Dépôt
      </h1>

      {/* FILTRE + ACTIONS */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-center">

        <div className="flex items-center gap-2 flex-1">
          <Search size={18} />
          <input
            className="w-full px-3 py-2 bg-gray-50 rounded"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={imprimerPage}
          className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer Page
        </button>

        <button
          onClick={imprimerGlobal}
          className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer Global
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F3FF] text-[#472EAD]">
            <tr>
              <th className="p-3 text-left">Produit</th>
              <th className="p-3 text-center">État</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">Entrées</th>
              <th className="p-3 text-center">Sorties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const etat = getEtat(p.stock, p.seuil);

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3">{p.nom}</td>

                  <td className="p-3 text-center">
                    {etat === "rupture" && (
                      <AlertTriangle className="text-red-600 inline" />
                    )}
                    {etat === "faible" && (
                      <AlertTriangle className="text-orange-500 inline" />
                    )}
                    {etat === "ok" && (
                      <CheckCircle className="text-green-600 inline" />
                    )}
                  </td>

                  <td className="p-3 text-center">{p.stock}</td>
                  <td className="p-3 text-center">{p.entrees}</td>
                  <td className="p-3 text-center">{p.sorties}</td>
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
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Précédent
          </button>

          <span>
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>

          <button
            disabled={page >= pagination.lastPage}
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

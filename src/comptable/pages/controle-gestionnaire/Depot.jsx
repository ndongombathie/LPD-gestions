// ==========================================================
// 🏭 DepotControle.jsx — 100% aligné API produits-controle-depots
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Search, Printer, AlertTriangle, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import httpClient from "@/services/http/client";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // ================= FETCH API =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await httpClient.get("/produits-controle-depots");
        setProduits(res.data?.data ?? []);
      } catch (e) {
        setError("Erreur lors du chargement des produits dépôt");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        stock: p.stock_global,
        seuil: p.stock_seuil,
        entrees,
        sorties,
      };
    });
  }, [produits]);

  // ================= FILTRE =================
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    return rows.filter((p) =>
      p.nom.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  // ================= PDF =================
  const imprimerPDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(71, 46, 173);
    doc.rect(10, 8, 190, 22, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 22, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 28, { align: "center" });

    autoTable(doc, {
      startY: 40,
      head: [["Produit", "Stock", "Entrées", "Sorties", "État"]],
      body: filtered.map((p) => [
        p.nom,
        p.stock,
        p.entrees,
        p.sorties,
        getEtat(p.stock, p.seuil),
      ]),
    });

    doc.save("controle_depot.pdf");
  };

  // ================= UI =================
  if (loading) return <p className="p-6">Chargement…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 flex flex-col gap-8">

      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Dépôt
      </h1>

      {/* FILTRE */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4">
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
          onClick={imprimerPDF}
          className="bg-[#472EAD] text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer
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
                    {etat === "rupture" && <AlertTriangle className="text-red-600 inline" />}
                    {etat === "faible" && <AlertTriangle className="text-orange-500 inline" />}
                    {etat === "ok" && <CheckCircle className="text-green-600 inline" />}
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

    </div>
  );
}

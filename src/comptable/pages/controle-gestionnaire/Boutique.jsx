// ==========================================================
// 🏪 Boutique.jsx — Contrôle Gestionnaire / Comptable
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
  if (p.quantite <= p.min_stock) return "faible";
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
        Évolution du stock — {produit.produit}
      </h2>

      <ResponsiveContainer width="100%" height={260}>
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
  );
}

/* ================= PAGE ================= */
export default function Boutique() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [selectedProduitId, setSelectedProduitId] = useState("");

  /* ================= FETCH API ================= */
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        setLoading(true);
        const response = await boutiqueAPI.getProduitsControle();

        // ✅ Sécurité absolue
        setProduits(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        setError("Erreur lors du chargement des produits boutique");
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, []);

  /* ================= NORMALISATION ================= */
  const stockBoutique = useMemo(() => {
  return produits.map((p) => ({
    id: p.id,
    produit:
      p.nom ??
      p.produit?.nom ??
      p.produits?.nom ??
      p.libelle ??
      "—",
    categorie: p.categorie?.nom ?? "-",
    quantite: p.quantite ?? 0,
    min_stock: p.seuil_stock ?? 0,
    entrees: p.entrees ?? p.total_entrees ?? 0,
    sorties: p.sorties ?? p.total_sorties ?? 0,
    date: p.updated_at?.slice(0, 10),
  }));
}, [produits]);


  /* ================= FILTRAGE ================= */
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
  }, [stockBoutique, searchTerm, dateDebut, dateFin]);

  /* ================= PDF ================= */
  const imprimerPDF = () => {
    const doc = new jsPDF();

    // Date & heure impression
    const now = new Date();
    const dateImpression = now.toLocaleDateString("fr-FR");
    const heureImpression = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    /* ===== En-tête ===== */
    doc.setFillColor(71, 46, 173);
    doc.roundedRect(14, 10, 180, 24, 3, 3, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("LPD", 105, 26, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 32, { align: "center" });

    /* ===== Infos impression ===== */
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Date d'impression : ${dateImpression} à ${heureImpression}`, 14, 42);

    if (dateDebut || dateFin) {
      doc.text(
        `Période filtrée : ${dateDebut || "..."} → ${dateFin || "..."}`,
        14,
        47
      );
    } else {
      doc.text("Période filtrée : Toutes les dates", 14, 47);
    }

    /* ===== Tableau ===== */
    autoTable(doc, {
      startY: 55,
      head: [["Produit", "Stock", "Entrées", "Sorties", "Seuil"]],
      body: filteredData.map((p) => [
        p.produit,
        p.quantite,
        p.entrees,
        p.sorties,
        p.min_stock,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save("Stock_Boutique_LPD.pdf");
  };

  /* ================= UI ================= */
  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-8">
      {/* TITRE */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Contrôle Gestionnaire — Boutique
        </h1>
        <p className="text-sm text-gray-500">
          Suivi du stock et état des produits
        </p>
      </div>

      {/* FILTRES */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-[#472EAD]" />
          <input
            className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm"
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
            <option key={p.id} value={p.id}>
              {p.produit}
            </option>
          ))}
        </select>

        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />

        <button
          onClick={imprimerPDF}
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-xl shadow flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F3FF] text-[#472EAD]">
            <tr>
              <th>Produit</th>
              <th>État</th>
              <th>Stock</th>
              <th>Entrées</th>
              <th>Sorties</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((p) => {
              const etat = getEtat(p);
              return (
                <tr key={p.id}>
                  <td>{p.produit}</td>
                  <td className="text-center">
                    {etat === "rupture" && <span className="text-red-600">Rupture</span>}
                    {etat === "faible" && <span className="text-orange-500">Stock faible</span>}
                    {etat === "ok" && <span className="text-emerald-600">OK</span>}
                  </td>
                  <td className="text-center">{p.quantite}</td>
                  <td className="text-center">{p.entrees}</td>
                  <td className="text-center">{p.sorties}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedProduitId && (
        <EvolutionStockGraph
          produit={stockBoutique.find((p) => p.id === Number(selectedProduitId))}
        />
      )}
    </div>
  );
}

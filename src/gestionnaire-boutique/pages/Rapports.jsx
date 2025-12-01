import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import DataTable from "../components/DataTable";
import jsPDF from "jspdf";

const CardStat = ({ title, value, color, subtitle }) => (
  <div className={`rounded-lg shadow p-4 text-center ${color} text-white`}>
    <h3 className="text-sm">{title}</h3>
    <p className="text-xl font-bold">{value}</p>
    {subtitle && <p className="text-xs opacity-90 mt-1">{subtitle}</p>}
  </div>
);

const Rapports = () => {
  const [periode, setPeriode] = useState("7");
  const [typeRapport, setTypeRapport] = useState("produits");
  const [rapport, setRapport] = useState(null);

  const formatNumber = (n) => n?.toLocaleString?.() ?? n;
  // helper for number formatting

  // Load initial report when component mounts
  useEffect(() => {
    genererRapport();
  }, []);

  // Génère un rapport mocké et structure les données pour affichage
  const genererRapport = () => {
    // mock products and stock data

    // Detailed products list (mocked) — used for table + PDF export
    const products = Array.from({ length: 18 }, (_, idx) => {
      const sold = Math.floor(20 + Math.random() * 200);
      const price = Math.floor(500 + Math.random() * 50000);
      const cost = Math.floor(price * (0.6 + Math.random() * 0.2));
      const revenue = sold * price;
      const margin = revenue - sold * cost;
      return {
        id: idx + 1,
        sku: `PR${(1000 + idx).toString().padStart(4, "0")}`,
        name: [`Savon OMO`, `Riz 50kg`, `Huile 5L`, `Sucre 25kg`, `Lait UHT`][idx % 5] + ` ${idx + 1}`,
        category: ["Hygiène", "Alimentation", "Électronique"][idx % 3],
        sold,
        price,
        cost,
        revenue,
        margin,
        stock: Math.floor(Math.random() * 150),
        seuil: 10 + Math.floor(Math.random() * 30),
      };
    });

    const categoryDistribution = [
      { category: "Hygiène", value: 45 },
      { category: "Alimentation", value: 35 },
      { category: "Électronique", value: 20 },
    ];

    setRapport({
      products,
      topProducts: products.slice(0, 5),
      categoryDistribution,
      stockFaible: products.filter((p) => p.stock <= p.seuil).map((p) => p.name),
      totalDemandes: 15,
      demandesEnAttente: 5,
      demandesValidees: 7,
      demandesRejetees: 3,
      produitsEnStock: products.reduce((s, p) => s + p.stock, 0),
      produitsFaible: products.filter((p) => p.stock <= p.seuil).length,
      produitsEpuises: products.filter((p) => p.stock === 0).length,
      totalProducts: products.length,
    });
  };

  

  // per-row download removed (single export only)

  

  const exportFullPDF = () => {
    if (!rapport) return;
    const doc = new jsPDF({ unit: "pt" });
    const margin = 40;
    let y = 60;
    doc.setFontSize(18);
    doc.text("Rapport Produits & Stock — LPD Gestiones", margin, y);
    y += 24;
    doc.setFontSize(12);
    doc.text(`Total produits: ${formatNumber(rapport.totalProducts)}`, margin, y);
    y += 14;
    doc.text(`Produits en stock (total unités): ${formatNumber(rapport.produitsEnStock)}`, margin, y);
    y += 14;
    doc.text(`Produits sous seuil: ${formatNumber(rapport.produitsFaible)}`, margin, y);
    y += 18;

    // Table header
    doc.setFontSize(11);
    doc.text("#", margin, y);
    doc.text("SKU", margin + 30, y);
    doc.text("Produit", margin + 100, y);
    doc.text("Catégorie", margin + 300, y);
    doc.text("Stock", margin + 420, y);
    doc.text("Seuil", margin + 480, y);
    y += 12;

    // Rows
    const rows = rapport.products || [];
    rows.forEach((p, i) => {
      if (y > 740) {
        doc.addPage();
        y = 60;
      }
      doc.text(String(i + 1), margin, y);
      doc.text(p.sku || "", margin + 30, y);
      doc.text(p.name || "", margin + 100, y);
      doc.text(p.category || "", margin + 300, y);
      doc.text(String(p.stock || 0), margin + 420, y);
      doc.text(String(p.seuil || 0), margin + 480, y);
      y += 14;
    });

    doc.save("rapport-produits-stock.pdf");
  };


  return (
    <div className="min-h-screen bg-gray-50">

      <div className="px-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#111827]">Rapports & Statistiques</h2>

        {/* Sélection de période et type */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[160px]">
              <label className="block mb-1 text-xs text-gray-500">Période</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">3 derniers mois</option>
              </select>
            </div>

            <div className="min-w-[200px]">
              <label className="block mb-1 text-xs text-gray-500">Type de rapport</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={typeRapport}
                onChange={(e) => setTypeRapport(e.target.value)}
              >
                <option value="produits">Produits</option>
                <option value="reapprovisionnement">Réapprovisionnement</option>
                <option value="stock">Stock</option>
              </select>
            </div>

            <div className="ml-1">
              <label className="block mb-1 text-xs text-transparent">Action</label>
              <button
                onClick={genererRapport}
                className="inline-flex items-center gap-2 bg-[#472EAD] hover:bg-[#3b2594] text-white px-4 py-2 rounded-md text-sm shadow"
              >
                <FileText size={16} />
                <span>Générer</span>
              </button>
            </div>
          </div>

          <div className="ml-auto">
            {rapport && (
              <button
                onClick={() => exportFullPDF()}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm shadow"
              >
                <FileText size={14} />
                <span>Exporter PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistiques principales */}
        {rapport && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <CardStat title="Total produits" value={formatNumber(rapport.totalProducts)} color="bg-[#472EAD]" />
              <CardStat title="Total unités en stock" value={formatNumber(rapport.produitsEnStock)} color="bg-green-600" subtitle={`${formatNumber(rapport.produitsFaible)} sous seuil`} />
              <CardStat title="Produits sous seuil" value={formatNumber(rapport.produitsFaible)} color="bg-[#F58020]" />
              <CardStat title="Produits épuisés" value={formatNumber(rapport.produitsEpuises)} color="bg-red-600" />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Top catégories</h4>
                <ul className="space-y-2">
                  {rapport.categoryDistribution.map((c) => (
                    <li key={c.category} className="flex justify-between items-center">
                      <div className="text-sm">{c.category}</div>
                      <div className="text-sm font-bold">{c.value}%</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Alertes stocks</h4>
                <ul className="text-sm space-y-1">
                  {rapport.stockFaible.map((p) => (
                    <li key={p} className="flex items-center justify-between">
                      <span>{p}</span>
                      <span className="text-[#F58020] font-semibold">Reappro</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-4 rounded shadow flex items-center justify-center">
                <h4 className="font-semibold">Rapport Produits & Stock</h4>
              </div>
            </div>
          </div>
        )}

        {/* Tableau détaillé du rapport */}
        {rapport && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Détails</h3>

            <DataTable
              data={
                typeRapport === "produits"
                  ? (rapport.products || []).map((p, i) => ({
                      id: p.id,
                      rank: i + 1,
                      name: p.name,
                      sku: p.sku,
                      category: p.category,
                      ventes: p.sold,
                      ca: p.revenue,
                      coût: p.cost,
                      marge: p.margin,
                      stock: p.stock,
                      seuil: p.seuil,
                    }))
                  : typeRapport === "stock"
                  ? (rapport.products || []).filter((p) => p.stock <= p.seuil).map((p) => ({ id: p.id, name: p.name, stock: p.stock, seuil: p.seuil }))
                  : []
              }
              columns={
                typeRapport === "produits"
                  ? [
                      { label: "#", key: "rank" },
                      { label: "Produit", key: "name" },
                      { label: "SKU", key: "sku" },
                      { label: "Catégorie", key: "category" },
                      { label: "Stock", key: "stock" },
                      { label: "Seuil", key: "seuil" },
                    ]
                  : [
                      { label: "#", key: "id" },
                      { label: "Produit", key: "name" },
                      { label: "Stock", key: "stock" },
                      { label: "Seuil", key: "seuil" },
                    ]
              }
              actions={
                typeRapport === "produits"
                  ? []
                  : []
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Rapports;

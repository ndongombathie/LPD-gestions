// src/gestionnaire-depot/pages/Reports.jsx
import React, { useMemo, useState, useRef } from "react";
import { useAllProducts } from "../hooks/useAllProducts";
import "../styles/depot-fix.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Activity,
  DownloadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  Star,
  Shield,
} from "lucide-react";
import DOMPurify from "dompurify";

const PALETTE = {
  violet: "#472EAD",
  orange: "#F97316",
  blue: "#06B6D4",
  green: "#10B981",
  red: "#EF4444",
  gray50: "#F8FAFC",
  text: "#111827",
};

const formatNumber = (n) => n?.toLocaleString("fr-FR") ?? "0";

// Composant de pagination réutilisable
const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t">
      <div className="text-xs text-gray-500">
        Affichage de {startItem} à {endItem} sur {totalItems} éléments
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Afficher :</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className="border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1} className={`p-1 rounded-md ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}><ChevronsLeft size={16} /></button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={`p-1 rounded-md ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}><ChevronLeft size={16} /></button>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-700">Page</span>
            <span className="font-semibold text-[#472EAD]">{currentPage}</span>
            <span className="text-gray-700">sur</span>
            <span className="font-semibold">{totalPages}</span>
          </div>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1 rounded-md ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}><ChevronRight size={16} /></button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className={`p-1 rounded-md ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}><ChevronsRight size={16} /></button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Aller à :</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) goToPage(page);
            }}
            className="w-12 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
          />
        </div>
      </div>
    </div>
  );
};

// Composant de carte KPI moderne
const KpiCard = ({ title, value, icon: Icon, color = "violet", subtitle, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-${color}-50 to-white p-5 rounded-xl border border-${color}-100 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold" style={{ color: PALETTE[color] }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon size={20} style={{ color: PALETTE[color] }} />
        </div>
      </div>
    </div>
  );
};

// Composant de liste simple pour les tops
const SimpleList = ({ items, title, icon: Icon, color = "violet", valueLabel = "Valeur", loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center mb-3">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: PALETTE[color] }}>
        <Icon size={18} />
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: PALETTE[color] + '20', color: PALETTE[color] }}>
              {item.value} {valueLabel}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-gray-400 py-4">Aucune donnée</p>
        )}
      </div>
    </div>
  );
};

// Composant de carte d'information simple
const InfoCard = ({ title, value, icon: Icon, color = "violet", description, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: PALETTE[color] + '20' }}>
          <Icon size={20} style={{ color: PALETTE[color] }} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-semibold" style={{ color: PALETTE[color] }}>{value}</p>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  // Hook personnalisé qui charge TOUS les produits et les listes filtrées
  const { 
    products, 
    total, 
    loading, 
    stats, 
    loadingStats,
    normalProducts,
    faibleProducts,
    ruptureProducts 
  } = useAllProducts();

  const [tab, setTab] = useState("resume");
  const [alertSubTab, setAlertSubTab] = useState("rupture");

  // Pagination des alertes (rupture et faible seulement)
  const [rupturePage, setRupturePage] = useState(1);
  const [ruptureItemsPerPage, setRuptureItemsPerPage] = useState(5);
  const [faiblePage, setFaiblePage] = useState(1);
  const [faibleItemsPerPage, setFaibleItemsPerPage] = useState(5);

  const reportRef = useRef(null);

  // --- Produits enrichis (pour les tops et l'affichage) ---
  const enriched = useMemo(() => {
    if (!products.length) return [];
    return products.map((p) => {
      const cartons = p.nombre_carton ?? 0;
      const unitsPerCarton = Number(p.unite_carton) || 1;
      const stockGlobal = cartons * unitsPerCarton;
      const pricePerCarton = p.prix_unite_carton ?? 0;
      const totalPrice = pricePerCarton * cartons;
      const stockMin = p.stock_seuil ?? 5;

      return {
        id: p.id,
        name: p.nom || "Sans nom",
        barcode: p.code || p.code_barre || "",
        category: p.categorie?.nom || "Général",
        cartons,
        unitsPerCarton,
        stockGlobal,
        pricePerCarton,
        totalPrice,
        stockMin,
      };
    });
  }, [products]);

  // Pagination des alertes - UTILISE LES LISTES DU HOOK
  const paginatedRupture = ruptureProducts.slice((rupturePage - 1) * ruptureItemsPerPage, rupturePage * ruptureItemsPerPage);
  const paginatedFaible = faibleProducts.slice((faiblePage - 1) * faibleItemsPerPage, faiblePage * faibleItemsPerPage);

  // Statistiques globales (utilisant les stats du hook)
  const totalProducts = stats.totalProducts || total || products.length;
  const totalValue = stats.totalValue;
  const counts = {
    "Normal": stats.normalCount,
    "Faible": stats.faibleCount,
    "Rupture": stats.ruptureCount
  };

  // Top 5 produits par valeur (basé sur tous les produits)
  const topProductsByValue = useMemo(
    () =>
      enriched
        .slice()
        .sort((a, b) => b.totalPrice - a.totalPrice)
        .slice(0, 5)
        .map((p) => ({ label: p.name, value: formatNumber(p.totalPrice) })),
    [enriched]
  );

  // Top 5 produits par quantité (cartons)
  const topProductsByCartons = useMemo(
    () =>
      enriched
        .slice()
        .sort((a, b) => b.cartons - a.cartons)
        .slice(0, 5)
        .map((p) => ({ label: p.name, value: p.cartons })),
    [enriched]
  );

  // Top 5 produits par stock global (unités)
  const topProductsByStockGlobal = useMemo(
    () =>
      enriched
        .slice()
        .sort((a, b) => b.stockGlobal - a.stockGlobal)
        .slice(0, 5)
        .map((p) => ({ label: p.name, value: formatNumber(p.stockGlobal) })),
    [enriched]
  );

  // Total des unités en stock
  const totalUnits = enriched.reduce((sum, p) => sum + p.stockGlobal, 0);

  // --- Export PDF ---
  const exportPDF = async () => {
    try {
      const pdfContainer = document.createElement("div");
      pdfContainer.style.width = "190mm";
      pdfContainer.style.padding = "15mm";
      pdfContainer.style.backgroundColor = "white";
      pdfContainer.style.fontFamily = "Arial, Helvetica, sans-serif";
      pdfContainer.style.color = "#111827";
      pdfContainer.style.fontSize = "10pt";

      const header = `
        <div style="margin-bottom: 20px; border-bottom: 2px solid #472EAD; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 50px; height: 50px; background: #472EAD; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">LPD</div>
              <div>
                <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #111827;">Rapport du Gestionnaire de Dépôt</h1>
                <p style="font-size: 11px; color: #6B7280; margin: 5px 0 0;">LPD MANAGER — ${new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
            <div style="font-size: 9px; color: #6B7280; text-align: right;">
              <div>Gestionnaire de Dépôt</div>
            </div>
          </div>
        </div>
      `;

      const kpiCards = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; background: #F9FAFB;">
            <p style="font-size: 9px; color: #6B7280; margin: 0 0 5px;">Valeur totale du stock</p>
            <p style="font-size: 18px; font-weight: bold; color: #472EAD; margin: 0;">${formatNumber(totalValue)} F</p>
          </div>
          <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; background: #F9FAFB;">
            <p style="font-size: 9px; color: #6B7280; margin: 0 0 5px;">Nombre de produits</p>
            <p style="font-size: 18px; font-weight: bold; margin: 0;">${totalProducts}</p>
          </div>
        </div>
      `;

      const status = `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD; margin-bottom: 10px;">État du stock</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; text-align: center; background: white;">
              <p style="font-size: 8px; color: #6B7280; margin: 0 0 5px;">Normal</p>
              <p style="font-size: 16px; font-weight: bold; color: #10B981; margin: 0;">${counts["Normal"] || 0}</p>
            </div>
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; text-align: center; background: white;">
              <p style="font-size: 8px; color: #6B7280; margin: 0 0 5px;">Faible</p>
              <p style="font-size: 16px; font-weight: bold; color: #F97316; margin: 0;">${counts["Faible"] || 0}</p>
            </div>
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; text-align: center; background: white;">
              <p style="font-size: 8px; color: #6B7280; margin: 0 0 5px;">Rupture</p>
              <p style="font-size: 16px; font-weight: bold; color: #EF4444; margin: 0;">${counts["Rupture"] || 0}</p>
            </div>
          </div>
        </div>
      `;

      const leftCol = `
        <div style="margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; background: #F9FAFB;">
              <p style="font-size: 9px; color: #6B7280;">Total unités en stock</p>
              <p style="font-size: 16px; font-weight: bold; color: #472EAD;">${formatNumber(totalUnits)}</p>
            </div>
          </div>
        </div>
      `;

      const topStockGlobal = `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD; margin-bottom: 10px;">Top 5 par stock global (unités)</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #F3F4F6;"><th style="padding: 6px; text-align: left;">Produit</th><th style="padding: 6px; text-align: right;">Unités</th></tr></thead>
            <tbody>${topProductsByStockGlobal.map(p => `<tr><td style="padding: 5px;">${p.label}</td><td style="padding: 5px; text-align: right;">${p.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      `;

      const topValue = `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD; margin-bottom: 10px;">Top 5 par valeur</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #F3F4F6;"><th style="padding: 6px; text-align: left;">Produit</th><th style="padding: 6px; text-align: right;">Valeur (F)</th></tr></thead>
            <tbody>${topProductsByValue.map(p => `<tr><td style="padding: 5px;">${p.label}</td><td style="padding: 5px; text-align: right;">${p.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      `;

      const topQty = `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD; margin-bottom: 10px;">Top 5 par quantité (cartons)</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #F3F4F6;"><th style="padding: 6px; text-align: left;">Produit</th><th style="padding: 6px; text-align: right;">Cartons</th></tr></thead>
            <tbody>${topProductsByCartons.map(p => `<tr><td style="padding: 5px;">${p.label}</td><td style="padding: 5px; text-align: right;">${p.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      `;

      const footer = `
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 8px; color: #6B7280; text-align: center;">
          <p>Rapport généré par LPD MANAGER le ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      `;

      pdfContainer.innerHTML = DOMPurify.sanitize(
        header + kpiCards + status + leftCol + topStockGlobal + topValue + topQty + footer
      );

      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      document.body.appendChild(pdfContainer);

      const canvas = await html2canvas(pdfContainer, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      document.body.removeChild(pdfContainer);
      pdf.save(`rapport-gestionnaire-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  if (loading) {
    return (
      <div className="depot-page p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#472EAD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="depot-page p-6 max-w-7xl mx-auto" style={{ color: PALETTE.text }}>
      {/* En-tête moderne */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#472EAD] to-[#F97316] flex items-center justify-center text-white font-bold text-xl shadow-lg">
            LPD
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rapport du Gestionnaire de Dépôt</h1>
            <p className="text-sm text-gray-500">Analyse détaillée du stock</p>
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#472EAD] to-[#F97316] text-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 font-medium"
        >
          <DownloadCloud size={18} />
          Exporter PDF
        </button>
      </div>

      {/* Onglets : seulement Résumé et Alertes */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-2">
        {[
          { id: "resume", label: "Résumé", icon: <Activity size={16} /> },
          { id: "alerts", label: "Alertes", icon: <AlertTriangle size={16} /> },
        ].map((it) => (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              tab === it.id
                ? "border-[#472EAD] text-[#472EAD]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {it.icon}
            {it.label}
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      <div ref={reportRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        {/* Onglet Résumé */}
        {tab === "resume" && (
          <section className="space-y-8">
            {/* Cartes KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KpiCard
                title="Valeur totale du stock"
                value={`${formatNumber(totalValue)} F`}
                icon={DollarSign}
                color="violet"
                subtitle="Basée sur le prix unitaire"
                loading={loadingStats}
              />
              <KpiCard
                title="Nombre de produits"
                value={totalProducts}
                icon={Package}
                color="orange"
                subtitle="Références actives"
                loading={loadingStats}
              />
            </div>

            {/* Répartition des statuts - VENANT DES API */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-[#472EAD]">
                <Shield size={18} />
                État du stock
              </h3>
              {loadingStats ? (
                <div className="animate-pulse grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Normal</p>
                    <p className="text-2xl font-bold text-green-600">{counts.Normal}</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-yellow-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Faible</p>
                    <p className="text-2xl font-bold text-yellow-600">{counts.Faible}</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-red-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Rupture</p>
                    <p className="text-2xl font-bold text-red-600">{counts.Rupture}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Deux colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche : Total unités */}
              <div className="space-y-4">
                <InfoCard
                  title="Total unités en stock"
                  value={formatNumber(totalUnits)}
                  icon={Package}
                  color="violet"
                  description="Unités (cartons × unités par carton)"
                  loading={loadingStats}
                />
              </div>

              {/* Colonne droite : Top 5 stock global */}
              <div className="space-y-4">
                <SimpleList
                  items={topProductsByStockGlobal}
                  title="Top 5 par stock global (unités)"
                  icon={Layers}
                  color="green"
                  valueLabel="unités"
                  loading={loadingStats}
                />
              </div>
            </div>

            {/* Deux tops en bas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <SimpleList
                items={topProductsByValue}
                title="Top 5 par valeur"
                icon={Activity}
                color="violet"
                valueLabel="F"
                loading={loadingStats}
              />
              <SimpleList
                items={topProductsByCartons}
                title="Top 5 par quantité (cartons)"
                icon={Layers}
                color="blue"
                valueLabel="cartons"
                loading={loadingStats}
              />
            </div>
          </section>
        )}

        {/* Onglet Alertes */}
        {tab === "alerts" && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Alertes Stock</h2>
              <div className="flex border-b mb-4">
                {[
                  { key: "rupture", label: "Rupture", count: ruptureProducts.length, color: "red" },
                  { key: "faible", label: "Faible", count: faibleProducts.length, color: "yellow" },
                ].map((subTab) => (
                  <button
                    key={subTab.key}
                    onClick={() => setAlertSubTab(subTab.key)}
                    className={`px-4 py-2 text-sm font-medium ${
                      alertSubTab === subTab.key
                        ? `border-b-2 text-${subTab.color}-600 border-${subTab.color}-500`
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {subTab.label} ({subTab.count})
                  </button>
                ))}
              </div>

              {alertSubTab === "rupture" && (
                <div>
                  <div className="mb-4 p-4 border rounded-lg bg-red-50">
                    <h3 className="text-sm font-semibold text-red-700 mb-2">Produits en Rupture de Stock</h3>
                    <p className="text-xs text-red-600">Ces produits sont complètement épuisés. Action requise immédiatement.</p>
                  </div>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 text-left">Produit</th>
                          <th className="p-3 text-center">Code-barre</th>
                          <th className="p-3 text-center">Catégorie</th>
                          <th className="p-3 text-center">Stock Minimum</th>
                          <th className="p-3 text-center">Prix/Carton</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRupture.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{p.nom || "Sans nom"}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.code_barre || p.code || ""}</td>
                            <td className="p-3 text-center">{p.categorie?.nom || "Général"}</td>
                            <td className="p-3 text-center">{p.stock_seuil || 5} cartons</td>
                            <td className="p-3 text-center">{formatNumber(p.prix_unite_carton || 0)} F</td>
                          </tr>
                        ))}
                        {paginatedRupture.length === 0 && (
                          <tr><td colSpan={5} className="p-6 text-center text-gray-500">Aucun produit en rupture</td></tr>
                        )}
                      </tbody>
                    </table>
                    {ruptureProducts.length > 0 && (
                      <Pagination
                        currentPage={rupturePage}
                        totalPages={Math.ceil(ruptureProducts.length / ruptureItemsPerPage)}
                        totalItems={ruptureProducts.length}
                        itemsPerPage={ruptureItemsPerPage}
                        onPageChange={setRupturePage}
                        onItemsPerPageChange={setRuptureItemsPerPage}
                      />
                    )}
                  </div>
                </div>
              )}

              {alertSubTab === "faible" && (
                <div>
                  <div className="mb-4 p-4 border rounded-lg bg-yellow-50">
                    <h3 className="text-sm font-semibold text-yellow-700 mb-2">Produits en Stock Faible</h3>
                    <p className="text-xs text-yellow-600">Ces produits approchent du seuil minimum. Surveillance recommandée.</p>
                  </div>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 text-left">Produit</th>
                          <th className="p-3 text-center">Code-barre</th>
                          <th className="p-3 text-center">Stock Actuel</th>
                          <th className="p-3 text-center">Stock Minimum</th>
                          <th className="p-3 text-center">Marge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFaible.map((p) => {
                          const stockActuel = p.nombre_carton || 0;
                          const stockMin = p.stock_seuil || 5;
                          return (
                            <tr key={p.id} className="border-t hover:bg-gray-50">
                              <td className="p-3 font-medium">{p.nom || "Sans nom"}</td>
                              <td className="p-3 text-center font-mono text-xs">{p.code_barre || p.code || ""}</td>
                              <td className="p-3 text-center">{stockActuel} cartons</td>
                              <td className="p-3 text-center">{stockMin} cartons</td>
                              <td className="p-3 text-center">
                                <span className="text-yellow-600">{stockActuel - stockMin} cartons</span>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedFaible.length === 0 && (
                          <tr><td colSpan={5} className="p-6 text-center text-gray-500">Aucun produit faible</td></tr>
                        )}
                      </tbody>
                    </table>
                    {faibleProducts.length > 0 && (
                      <Pagination
                        currentPage={faiblePage}
                        totalPages={Math.ceil(faibleProducts.length / faibleItemsPerPage)}
                        totalItems={faibleProducts.length}
                        itemsPerPage={faibleItemsPerPage}
                        onPageChange={setFaiblePage}
                        onItemsPerPageChange={setFaibleItemsPerPage}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400 text-right">Généré par LPD MANAGER le {new Date().toLocaleDateString("fr-FR")}</p>
    </div>
  );
}
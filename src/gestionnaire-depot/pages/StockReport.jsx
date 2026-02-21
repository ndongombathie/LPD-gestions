// src/gestionnaire-depot/pages/Reports.jsx
import React, { useMemo, useRef, useState } from "react";
import "../styles/depot-fix.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Activity,
  DownloadCloud,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Clock,
  BarChart3,
  Layers,
  Star,
  Zap,
  Shield,
} from "lucide-react";
import DOMPurify from "dompurify";
import { useStock } from "./StockContext";

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

// Composant de pagination (réutilisable)
const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
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
          <span className="text-gray-500">par page</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={`p-1 rounded-md ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-1 rounded-md ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-700">Page</span>
            <span className="font-semibold text-[#472EAD]">{currentPage}</span>
            <span className="text-gray-700">sur</span>
            <span className="font-semibold">{totalPages}</span>
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded-md ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded-md ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <ChevronsRight size={16} />
          </button>
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
const KpiCard = ({ title, value, icon: Icon, color = "violet", trend, subtitle }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-white p-5 rounded-xl border border-${color}-100 shadow-sm hover:shadow-md transition-all duration-200`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold" style={{ color: PALETTE[color] }}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </div>
      <div className={`p-2 bg-${color}-100 rounded-lg`}>
        <Icon size={20} style={{ color: PALETTE[color] }} />
      </div>
    </div>
  </div>
);

// Composant de liste simple pour les tops
const SimpleList = ({ items, title, icon: Icon, color = "violet", valueLabel = "Valeur" }) => (
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

// Composant de carte d'information simple
const InfoCard = ({ title, value, icon: Icon, color = "violet", description }) => (
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

export default function Reports() {
  const { products, movements } = useStock();
  const [tab, setTab] = useState("resume");
  const [alertSubTab, setAlertSubTab] = useState("rupture");

  // Pagination des alertes
  const [rupturePage, setRupturePage] = useState(1);
  const [ruptureItemsPerPage, setRuptureItemsPerPage] = useState(5);
  const [critiquePage, setCritiquePage] = useState(1);
  const [critiqueItemsPerPage, setCritiqueItemsPerPage] = useState(5);
  const [faiblePage, setFaiblePage] = useState(1);
  const [faibleItemsPerPage, setFaibleItemsPerPage] = useState(5);

  const reportRef = useRef(null);

  // Produits enrichis (gère le cas où products est vide)
  const enriched = useMemo(() => {
    return products.map((p) => {
      const stockGlobal = p.cartons * p.unitsPerCarton;
      const totalPrice = p.cartons * p.pricePerCarton;
      let status = "Normal";
      if (p.cartons === 0) status = "Rupture";
      else if (p.cartons < 10) status = "Critique";
      else if (p.cartons <= p.stockMin) status = "Faible";
      return { ...p, stockGlobal, totalPrice, status };
    });
  }, [products]);

  // Alertes
  const ruptureProducts = useMemo(() => enriched.filter((p) => p.status === "Rupture"), [enriched]);
  const critiqueProducts = useMemo(() => enriched.filter((p) => p.status === "Critique"), [enriched]);
  const faibleProducts = useMemo(() => enriched.filter((p) => p.status === "Faible"), [enriched]);

  const paginatedRupture = ruptureProducts.slice((rupturePage - 1) * ruptureItemsPerPage, rupturePage * ruptureItemsPerPage);
  const paginatedCritique = critiqueProducts.slice((critiquePage - 1) * critiqueItemsPerPage, critiquePage * critiqueItemsPerPage);
  const paginatedFaible = faibleProducts.slice((faiblePage - 1) * faibleItemsPerPage, faiblePage * faibleItemsPerPage);

  const totalValue = enriched.reduce((s, p) => s + p.totalPrice, 0);
  const totalProducts = enriched.length;
  const counts = enriched.reduce((o, p) => {
    o[p.status] = (o[p.status] || 0) + 1;
    return o;
  }, {});

  // Top 5 produits par valeur
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

  // Top 5 produits par prix unitaire (prix par carton)
  const topProductsByUnitPrice = useMemo(
    () =>
      enriched
        .slice()
        .sort((a, b) => b.pricePerCarton - a.pricePerCarton)
        .slice(0, 5)
        .map((p) => ({ label: p.name, value: formatNumber(p.pricePerCarton) + ' F' })),
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

  // Mouvements des 30 derniers jours (nombre d'opérations)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentMovements = movements.filter((m) => new Date(m.date) >= thirtyDaysAgo);
  const entriesCount30 = recentMovements.filter((m) => m.type === "Entrée").length;
  const exitsCount30 = recentMovements.filter((m) => m.type === "Sortie").length;
  const netVariationCount = entriesCount30 - exitsCount30;

  const totalUnits = enriched.reduce((sum, p) => sum + p.stockGlobal, 0);
  const avgValue = totalProducts > 0 ? Math.round(totalValue / totalProducts) : 0;

  // Produits les plus mouvementés
  const productMovementCount = useMemo(() => {
    const countMap = {};
    movements.forEach((m) => {
      const productId = m.produit_id;
      const product = enriched.find(p => p.id === productId);
      if (product) {
        countMap[product.name] = (countMap[product.name] || 0) + 1;
      }
    });
    return Object.entries(countMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [movements, enriched]);

  const rotationRate = totalProducts > 0 ? ((entriesCount30 + exitsCount30) / totalProducts).toFixed(2) : "0";

  // Export PDF
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

      const summary = `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 14px; font-weight: bold; color: #472EAD; margin-bottom: 10px;">Résumé</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; background: #F9FAFB;">
              <p style="font-size: 9px; color: #6B7280;">Valeur totale</p>
              <p style="font-size: 18px; font-weight: bold; color: #472EAD; margin: 5px 0;">${formatNumber(totalValue)} F</p>
            </div>
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; background: #F9FAFB;">
              <p style="font-size: 9px; color: #6B7280;">Produits</p>
              <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${totalProducts}</p>
            </div>
          </div>
        </div>
      `;

      const top5value = `
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD;">Top 5 produits par valeur</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
            <thead><tr style="background: #F3F4F6;"><th style="padding: 6px; text-align: left;">Produit</th><th style="padding: 6px; text-align: right;">Valeur (F)</th></tr></thead>
            <tbody>${topProductsByValue.map(p => `<tr><td style="padding: 5px;">${p.label}</td><td style="padding: 5px; text-align: right;">${p.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      `;

      const top5qty = `
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD;">Top 5 produits par quantité (cartons)</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
            <thead><tr style="background: #F3F4F6;"><th style="padding: 6px; text-align: left;">Produit</th><th style="padding: 6px; text-align: right;">Cartons</th></tr></thead>
            <tbody>${topProductsByCartons.map(p => `<tr><td style="padding: 5px;">${p.label}</td><td style="padding: 5px; text-align: right;">${p.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      `;

      const movements30 = `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; color: #472EAD;">Mouvements (30 derniers jours)</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; text-align: center;">
              <p style="font-size: 8px; color: #6B7280;">Entrées</p>
              <p style="font-size: 16px; font-weight: bold; color: #06B6D4;">${entriesCount30}</p>
            </div>
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; text-align: center;">
              <p style="font-size: 8px; color: #6B7280;">Sorties</p>
              <p style="font-size: 16px; font-weight: bold; color: #F97316;">${exitsCount30}</p>
            </div>
            <div style="border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; text-align: center;">
              <p style="font-size: 8px; color: #6B7280;">Variation</p>
              <p style="font-size: 16px; font-weight: bold; color: #472EAD;">${netVariationCount > 0 ? "+" : ""}${netVariationCount}</p>
            </div>
          </div>
        </div>
      `;

      const footer = `
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 8px; color: #6B7280; text-align: center;">
          <p>Rapport généré par LPD MANAGER le ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      `;

      pdfContainer.innerHTML = DOMPurify.sanitize(header + summary + top5value + top5qty + movements30 + footer);

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
            <p className="text-sm text-gray-500">Analyse détaillée du stock et des mouvements</p>
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

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-2">
        {[
          { id: "resume", label: "Résumé", icon: <Activity size={16} /> },
          { id: "analyse", label: "Analyse", icon: <BarChart3 size={16} /> },
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
          <section className="space-y-6">
            {/* Cartes KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KpiCard title="Valeur totale du stock" value={`${formatNumber(totalValue)} F`} icon={DollarSign} color="violet" />
              <KpiCard title="Nombre de produits" value={totalProducts} icon={Package} color="orange" />
            </div>

            {/* Deux tops */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleList items={topProductsByValue} title="Top 5 par valeur" icon={TrendingUp} color="violet" valueLabel="F" />
              <SimpleList items={topProductsByCartons} title="Top 5 par quantité (cartons)" icon={Layers} color="blue" valueLabel="cartons" />
            </div>

            {/* Mouvements récents */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
                <Activity size={16} />
                Mouvements (30 derniers jours)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <InfoCard title="Entrées" value={entriesCount30} icon={ArrowUp} color="blue" />
                <InfoCard title="Sorties" value={exitsCount30} icon={ArrowDown} color="red" />
                <InfoCard title="Variation" value={netVariationCount > 0 ? `+${netVariationCount}` : netVariationCount} icon={TrendingUp} color="violet" />
              </div>
              <p className="text-xs text-gray-400 mt-3">* Nombre d'opérations sur les 30 derniers jours</p>
            </div>
          </section>
        )}

        {/* Onglet "Analyse" */}
        {tab === "analyse" && (
          <section className="space-y-6">
            {/* Répartition des statuts */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
                <Shield size={16} />
                État du stock
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                  <p className="text-xs text-gray-500">Normal</p>
                  <p className="text-xl font-semibold text-green-600">{counts["Normal"] || 0}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                  <p className="text-xs text-gray-500">Faible</p>
                  <p className="text-xl font-semibold text-yellow-600">{counts["Faible"] || 0}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
                  <p className="text-xs text-gray-500">Critique</p>
                  <p className="text-xl font-semibold text-orange-600">{counts["Critique"] || 0}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                  <p className="text-xs text-gray-500">Rupture</p>
                  <p className="text-xl font-semibold text-red-600">{counts["Rupture"] || 0}</p>
                </div>
              </div>
            </div>

            {/* Deux colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche : indicateurs généraux */}
              <div className="space-y-4">
                <InfoCard title="Total unités en stock" value={formatNumber(totalUnits)} icon={Package} color="violet" description="Unités (cartons × unités)" />
                <InfoCard title="Valeur moyenne / produit" value={`${formatNumber(avgValue)} F`} icon={DollarSign} color="orange" />
                <InfoCard title="Taux de rotation (30j)" value={rotationRate} icon={Zap} color="blue" description="Mouvements par produit" />
              </div>

              {/* Colonne droite : tops */}
              <div className="space-y-4">
                <SimpleList items={topProductsByUnitPrice} title="Top 5 par prix unitaire" icon={Star} color="orange" valueLabel="F" />
                <SimpleList items={productMovementCount} title="Produits les plus mouvementés" icon={Activity} color="violet" valueLabel="mouv." />
              </div>
            </div>

            {/* Ligne supplémentaire : top par stock global */}
            <div className="mt-4">
              <SimpleList items={topProductsByStockGlobal} title="Top 5 par stock global (unités)" icon={Layers} color="green" valueLabel="unités" />
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
                  { key: "critique", label: "Critique", count: critiqueProducts.length, color: "orange" },
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
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                            <td className="p-3 text-center">{p.category}</td>
                            <td className="p-3 text-center">{p.stockMin} cartons</td>
                            <td className="p-3 text-center">{formatNumber(p.pricePerCarton)} F</td>
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

              {alertSubTab === "critique" && (
                <div>
                  <div className="mb-4 p-4 border rounded-lg bg-orange-50">
                    <h3 className="text-sm font-semibold text-orange-700 mb-2">Produits en Stock Critique</h3>
                    <p className="text-xs text-orange-600">Ces produits sont en dessous du seuil critique. Réapprovisionnement urgent recommandé.</p>
                  </div>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 text-left">Produit</th>
                          <th className="p-3 text-center">Code-barre</th>
                          <th className="p-3 text-center">Stock Actuel</th>
                          <th className="p-3 text-center">Stock Minimum</th>
                          <th className="p-3 text-center">Déficit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCritique.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                            <td className="p-3 text-center">{p.cartons} cartons</td>
                            <td className="p-3 text-center">{p.stockMin} cartons</td>
                            <td className="p-3 text-center"><span className="text-orange-600 font-semibold">{p.stockMin - p.cartons} cartons</span></td>
                          </tr>
                        ))}
                        {paginatedCritique.length === 0 && (
                          <tr><td colSpan={5} className="p-6 text-center text-gray-500">Aucun produit critique</td></tr>
                        )}
                      </tbody>
                    </table>
                    {critiqueProducts.length > 0 && (
                      <Pagination
                        currentPage={critiquePage}
                        totalPages={Math.ceil(critiqueProducts.length / critiqueItemsPerPage)}
                        totalItems={critiqueProducts.length}
                        itemsPerPage={critiqueItemsPerPage}
                        onPageChange={setCritiquePage}
                        onItemsPerPageChange={setCritiqueItemsPerPage}
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
                        {paginatedFaible.map((p) => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                            <td className="p-3 text-center">{p.cartons} cartons</td>
                            <td className="p-3 text-center">{p.stockMin} cartons</td>
                            <td className="p-3 text-center"><span className="text-yellow-600">{p.cartons - p.stockMin} cartons</span></td>
                          </tr>
                        ))}
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
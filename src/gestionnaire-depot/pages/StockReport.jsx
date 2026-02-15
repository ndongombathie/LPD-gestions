// src/gestionnaire-depot/pages/Reports.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import "../styles/depot-fix.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Activity, FileText, DownloadCloud, PieChart, BarChart2, TrendingUp, Search, Filter, BarChart3, LineChart, TrendingDown, TrendingUp as TrendUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import DOMPurify from 'dompurify';

// MODIFICATION: import du contexte
import { useStock } from "./StockContext";

/**
 * Rapport fusionné
 * Palette LPD: violet #472EAD, orange #F97316, blue #06B6D4
 */

const PALETTE = {
  violet: "#472EAD",
  orange: "#F97316",
  blue: "#06B6D4",
  green: "#10B981",
  red: "#EF4444",
  gray50: "#F8FAFC",
  text: "#111827",
};

const formatNumber = (n) => n.toLocaleString("fr-FR");

// Composant de pagination réutilisable (inchangé)
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
        {/* Sélecteur d'éléments par page */}
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
        
        {/* Boutons de navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className={`p-1 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Première page"
          >
            <ChevronsLeft size={16} />
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-1 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Page précédente"
          >
            <ChevronLeft size={16} />
          </button>
          
          {/* Indicateur de page */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-700">Page</span>
            <span className="font-semibold text-[#472EAD]">{currentPage}</span>
            <span className="text-gray-700">sur</span>
            <span className="font-semibold">{totalPages}</span>
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Page suivante"
          >
            <ChevronRight size={16} />
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-1 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Dernière page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        
        {/* Sélecteur de page directe */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Aller à :</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                goToPage(page);
              }
            }}
            className="w-12 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
          />
        </div>
      </div>
    </div>
  );
};

// Nouveaux composants de graphiques professionnels (inchangés)
const ProfessionalLineChart = ({ data, title, color = PALETTE.violet, height = 200 }) => {
  const width = 400;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  const xScale = (index) => padding.left + (index * chartWidth) / (data.length - 1);
  const yScale = (value) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  
  const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ');
  
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <LineChart size={16} />
        {title}
      </h3>
      <div className="relative">
        <svg width={width} height={height} className="w-full">
          {/* Grille */}
          <g stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3,3">
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={`h-grid-${i}`}
                x1={padding.left}
                y1={padding.top + (i * chartHeight / 4)}
                x2={width - padding.right}
                y2={padding.top + (i * chartHeight / 4)}
              />
            ))}
          </g>
          
          {/* Axe Y */}
          <g fontSize="10" fill="#6B7280">
            {[0, 1, 2, 3, 4].map(i => {
              const value = minValue + (maxValue - minValue) * (4 - i) / 4;
              return (
                <g key={`y-label-${i}`}>
                  <text x={padding.left - 10} y={padding.top + (i * chartHeight / 4) + 3} textAnchor="end">
                    {formatNumber(Math.round(value))}
                  </text>
                  <line
                    x1={padding.left - 5}
                    y1={padding.top + (i * chartHeight / 4)}
                    x2={padding.left}
                    y2={padding.top + (i * chartHeight / 4)}
                    stroke="#6B7280"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
          
          {/* Axe X */}
          <g fontSize="10" fill="#6B7280" textAnchor="middle">
            {data.map((d, i) => (
              <text
                key={`x-label-${i}`}
                x={xScale(i)}
                y={height - 5}
              >
                {d.label}
              </text>
            ))}
          </g>
          
          {/* Ligne */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {data.map((d, i) => (
            <circle
              key={`point-${i}`}
              cx={xScale(i)}
              cy={yScale(d.value)}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          ))}
          
          {/* Zone sous la ligne */}
          <path
            d={`M ${padding.left},${yScale(data[0].value)} ${points} L ${width - padding.right},${height - padding.bottom} L ${padding.left},${height - padding.bottom} Z`}
            fill={`url(#gradient-${color.replace('#', '')})`}
            fillOpacity="0.1"
          />
          
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Légende */}
        <div className="absolute top-0 right-0 bg-white/80 backdrop-blur-sm p-2 rounded text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="font-medium">Évolution</span>
          </div>
          <div className="mt-1 text-gray-600">
            Max: {formatNumber(maxValue)} • Min: {formatNumber(minValue)}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfessionalBarChart = ({ data, title, color = PALETTE.orange, height = 200 }) => {
  const width = 400;
  const padding = { top: 20, right: 20, bottom: 40, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <BarChart3 size={16} />
        {title}
      </h3>
      <div className="relative">
        <svg width={width} height={height} className="w-full">
          {/* Grille */}
          <g stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3,3">
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={`h-grid-${i}`}
                x1={padding.left}
                y1={padding.top + (i * chartHeight / 4)}
                x2={width - padding.right}
                y2={padding.top + (i * chartHeight / 4)}
              />
            ))}
          </g>
          
          {/* Axe Y */}
          <g fontSize="10" fill="#6B7280" textAnchor="end">
            {[0, 1, 2, 3, 4].map(i => {
              const value = (maxValue * (4 - i) / 4);
              return (
                <g key={`y-label-${i}`}>
                  <text x={padding.left - 10} y={padding.top + (i * chartHeight / 4) + 3}>
                    {formatNumber(Math.round(value))}
                  </text>
                  <line
                    x1={padding.left - 5}
                    y1={padding.top + (i * chartHeight / 4)}
                    x2={padding.left}
                    y2={padding.top + (i * chartHeight / 4)}
                    stroke="#6B7280"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
          
          {/* Barres */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const barWidth = chartWidth / data.length * 0.7;
            const barX = padding.left + (i * chartWidth / data.length) + (chartWidth / data.length * 0.15);
            const barY = padding.top + chartHeight - barHeight;
            
            return (
              <g key={`bar-${i}`}>
                {/* Barre */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx="3"
                  className="hover:opacity-80 transition-opacity"
                />
                
                {/* Étiquette de valeur */}
                <text
                  x={barX + barWidth / 2}
                  y={barY - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={color}
                >
                  {formatNumber(d.value)}
                </text>
                
                {/* Étiquette de catégorie */}
                <text
                  x={barX + barWidth / 2}
                  y={height - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                  className="truncate"
                >
                  {d.label.length > 12 ? d.label.substring(0, 12) + '...' : d.label}
                </text>
              </g>
            );
          })}
          
          {/* Ligne de tendance */}
          {data.length > 1 && (
            <polyline
              points={data.map((d, i) => {
                const barHeight = (d.value / maxValue) * chartHeight;
                const barWidth = chartWidth / data.length * 0.7;
                const barX = padding.left + (i * chartWidth / data.length) + (chartWidth / data.length * 0.15);
                const barY = padding.top + chartHeight - barHeight;
                return `${barX + barWidth / 2},${barY}`;
              }).join(' ')}
              fill="none"
              stroke={PALETTE.violet}
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          )}
        </svg>
        
        {/* Légende */}
        <div className="absolute top-0 right-0 bg-white/80 backdrop-blur-sm p-2 rounded text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
            <span className="font-medium">{title}</span>
          </div>
          <div className="mt-1 text-gray-600">
            Total: {formatNumber(data.reduce((sum, d) => sum + d.value, 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PieChartComponent = ({ data, title, height = 200 }) => {
  const width = 300;
  const radius = Math.min(width, height) / 2 - 20;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = -Math.PI / 2;
  
  const colors = [PALETTE.violet, PALETTE.orange, PALETTE.blue, PALETTE.green, PALETTE.red];
  
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <PieChart size={16} />
        {title}
      </h3>
      <div className="relative">
        <svg width={width} height={height} className="mx-auto">
          {data.map((item, i) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + angle);
            const y2 = centerY + radius * Math.sin(currentAngle + angle);
            
            const largeArc = angle > Math.PI ? 1 : 0;
            const path = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');
            
            const segment = (
              <g key={`segment-${i}`}>
                <path
                  d={path}
                  fill={colors[i % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity"
                />
                {/* Étiquette extérieure */}
                <text
                  x={centerX + (radius + 15) * Math.cos(currentAngle + angle / 2)}
                  y={centerY + (radius + 15) * Math.sin(currentAngle + angle / 2)}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#374151"
                >
                  {Math.round((item.value / total) * 100)}%
                </text>
              </g>
            );
            
            currentAngle += angle;
            return segment;
          })}
          
          {/* Centre du camembert */}
          <circle cx={centerX} cy={centerY} r={radius * 0.4} fill="white" />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="bold"
            fill={PALETTE.violet}
          >
            {data.length} catégories
          </text>
        </svg>
        
        {/* Légende */}
        <div className="mt-4 space-y-2">
          {data.map((item, i) => (
            <div key={`legend-${i}`} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[i % colors.length] }}></div>
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="text-gray-600">
                {formatNumber(item.value)} ({Math.round((item.value / total) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  // MODIFICATION: récupération des données du contexte
  const { products, movements, loading } = useStock();

  const [tab, setTab] = useState("resume");
  
  // Nouvel état pour les sous-onglets d'alertes
  const [alertSubTab, setAlertSubTab] = useState("rupture");
  
  // États de pagination
  const [productPage, setProductPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(10);
  
  const [movementPage, setMovementPage] = useState(1);
  const [movementItemsPerPage, setMovementItemsPerPage] = useState(10);
  
  // États de pagination pour chaque sous-onglet d'alertes
  const [rupturePage, setRupturePage] = useState(1);
  const [ruptureItemsPerPage, setRuptureItemsPerPage] = useState(5);
  
  const [critiquePage, setCritiquePage] = useState(1);
  const [critiqueItemsPerPage, setCritiqueItemsPerPage] = useState(5);
  
  const [faiblePage, setFaiblePage] = useState(1);
  const [faibleItemsPerPage, setFaibleItemsPerPage] = useState(5);
  
  const reportRef = useRef(null);
  
  const [productFilters, setProductFilters] = useState({
    search: "",
    category: "all",
    status: "all"
  });
  
  const [movementFilters, setMovementFilters] = useState({
    search: "",
    type: "all",
    startDate: "",
    endDate: ""
  });

  // MODIFICATION: suppression des états et fonctions liés aux données fictives

  // MODIFICATION: calcul des produits enrichis (avec statut et prix total)
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

  // Filtrage des produits (inchangé)
  const filteredProducts = useMemo(() => {
    return enriched.filter(product => {
      if (productFilters.search) {
        const searchLower = productFilters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.barcode.includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (productFilters.category !== "all" && product.category !== productFilters.category) {
        return false;
      }
      
      if (productFilters.status !== "all" && product.status !== productFilters.status) {
        return false;
      }
      
      return true;
    });
  }, [enriched, productFilters]);

  // Filtrage des mouvements (inchangé)
  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      if (movementFilters.search) {
        const searchLower = movementFilters.search.toLowerCase();
        const matchesSearch = 
          movement.productName.toLowerCase().includes(searchLower) ||
          movement.barcode.includes(searchLower) ||
          movement.manager.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (movementFilters.type !== "all" && movement.type !== movementFilters.type) {
        return false;
      }
      
      if (movementFilters.startDate) {
        const movementDate = new Date(movement.date).toISOString().split('T')[0];
        if (movementDate < movementFilters.startDate) return false;
      }
      
      if (movementFilters.endDate) {
        const movementDate = new Date(movement.date).toISOString().split('T')[0];
        if (movementDate > movementFilters.endDate) return false;
      }
      
      return true;
    });
  }, [movements, movementFilters]);

  // Données paginées pour les produits
  const productStartIndex = (productPage - 1) * productItemsPerPage;
  const productEndIndex = productStartIndex + productItemsPerPage;
  const paginatedProducts = filteredProducts.slice(productStartIndex, productEndIndex);
  const productTotalPages = Math.ceil(filteredProducts.length / productItemsPerPage);

  // Données paginées pour les mouvements
  const movementStartIndex = (movementPage - 1) * movementItemsPerPage;
  const movementEndIndex = movementStartIndex + movementItemsPerPage;
  const paginatedMovements = filteredMovements.slice(movementStartIndex, movementEndIndex);
  const movementTotalPages = Math.ceil(filteredMovements.length / movementItemsPerPage);

  // Données filtrées par statut pour les alertes
  const ruptureProducts = useMemo(() => 
    enriched.filter(p => p.status === "Rupture"), [enriched]);
  
  const critiqueProducts = useMemo(() => 
    enriched.filter(p => p.status === "Critique"), [enriched]);
  
  const faibleProducts = useMemo(() => 
    enriched.filter(p => p.status === "Faible"), [enriched]);

  // Données paginées pour chaque sous-onglet d'alertes
  const ruptureStartIndex = (rupturePage - 1) * ruptureItemsPerPage;
  const ruptureEndIndex = ruptureStartIndex + ruptureItemsPerPage;
  const paginatedRupture = ruptureProducts.slice(ruptureStartIndex, ruptureEndIndex);
  const ruptureTotalPages = Math.ceil(ruptureProducts.length / ruptureItemsPerPage);

  const critiqueStartIndex = (critiquePage - 1) * critiqueItemsPerPage;
  const critiqueEndIndex = critiqueStartIndex + critiqueItemsPerPage;
  const paginatedCritique = critiqueProducts.slice(critiqueStartIndex, critiqueEndIndex);
  const critiqueTotalPages = Math.ceil(critiqueProducts.length / critiqueItemsPerPage);

  const faibleStartIndex = (faiblePage - 1) * faibleItemsPerPage;
  const faibleEndIndex = faibleStartIndex + faibleItemsPerPage;
  const paginatedFaible = faibleProducts.slice(faibleStartIndex, faibleEndIndex);
  const faibleTotalPages = Math.ceil(faibleProducts.length / faibleItemsPerPage);

  // Réinitialiser la pagination lorsque les filtres changent
  useEffect(() => {
    setProductPage(1);
  }, [productFilters]);

  useEffect(() => {
    setMovementPage(1);
  }, [movementFilters]);

  const totalValue = enriched.reduce((s, p) => s + p.totalPrice, 0);
  const totalProducts = enriched.length;
  const counts = enriched.reduce((o, p) => {
    o[p.status] = (o[p.status] || 0) + 1;
    return o;
  }, {});

  // Données pour les graphiques (conservées fictives ou à calculer plus tard)
  const stockEvolutionData = [
    { label: "Lun", value: 120 },
    { label: "Mar", value: 115 },
    { label: "Mer", value: 118 },
    { label: "Jeu", value: 110 },
    { label: "Ven", value: 125 },
    { label: "Sam", value: 130 },
    { label: "Dim", value: 128 }
  ];

  const topProductsData = enriched
    .slice()
    .sort((a, b) => b.totalPrice - a.totalPrice)
    .slice(0, 5)
    .map(p => ({
      label: p.name,
      value: p.totalPrice
    }));

  const categoryData = enriched.reduce((acc, product) => {
    const existing = acc.find(item => item.label === product.category);
    if (existing) {
      existing.value += product.totalPrice;
    } else {
      acc.push({ label: product.category, value: product.totalPrice });
    }
    return acc;
  }, []);

  const movementTrendData = [
    { label: "Sem 1", entrées: 27, sorties: 15 },
    { label: "Sem 2", entrées: 32, sorties: 28 },
    { label: "Sem 3", entrées: 25, sorties: 22 },
    { label: "Sem 4", entrées: 38, sorties: 35 }
  ];

  // MODIFICATION: fonction exportPDF déplacée à l'intérieur pour utiliser les données réelles
  const exportPDF = async () => {
    try {
      const pdfContainer = document.createElement('div');
      pdfContainer.style.width = '190mm';
      pdfContainer.style.padding = '15mm';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
      pdfContainer.style.color = '#111827';
      pdfContainer.style.fontSize = '9pt';
      
      const header = `
        <div style="margin-bottom: 15px; border-bottom: 1px solid #472EAD; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 40px; height: 40px; background: #472EAD; border-radius: 6px; display:flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                LPD
              </div>
              <div>
                <h1 style="font-size: 16px; font-weight: bold; margin: 0; color: #111827; line-height: 1.2;">Rapport d'Inventaire</h1>
                <p style="font-size: 9px; color: #6B7280; margin: 3px 0 0 0;">LPD CONSULTING — ${new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
            <div style="font-size: 8px; color: #6B7280; text-align: right;">
              <div>LPD Manager</div>
              <div>Gestionnaire de Dépôt</div>
            </div>
          </div>
        </div>
      `;
      
      pdfContainer.innerHTML =  DOMPurify.sanitize(header);
      
      // MODIFICATION: utiliser les données réelles (enriched, totalValue, counts, topProducts)
      const createPDFContent = () => {
        const topProducts = enriched.slice().sort((a, b) => b.totalPrice - a.totalPrice).slice(0, 3);
        
        return `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #472EAD; margin-bottom: 10px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">1. Résumé Exécutif</h2>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 12px; background: #F9FAFB;">
                <p style="font-size: 9px; color: #6B7280; margin: 0 0 6px 0; font-weight: 500;">Valeur stock</p>
                <p style="font-size: 18px; font-weight: bold; color: #472EAD; margin: 0;">${formatNumber(totalValue)} F</p>
                <p style="font-size: 8px; color: #9CA3AF; margin: 4px 0 0 0;">valeur actuelle</p>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 12px; background: #F9FAFB;">
                <p style="font-size: 9px; color: #6B7280; margin: 0 0 6px 0; font-weight: 500;">Produits</p>
                <p style="font-size: 18px; font-weight: bold; color: #111827; margin: 0;">${enriched.length}</p>
                <p style="font-size: 8px; color: #9CA3AF; margin: 4px 0 0 0;">références</p>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 12px; background: #F9FAFB;">
                <p style="font-size: 9px; color: #6B7280; margin: 0 0 6px 0; font-weight: 500;">Alertes</p>
                <p style="font-size: 18px; font-weight: bold; color: #F97316; margin: 0;">${counts["Rupture"] || 0} / ${counts["Critique"] || 0}</p>
                <p style="font-size: 8px; color: #9CA3AF; margin: 4px 0 0 0;">rupture/critique</p>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px;">
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 12px; background: white;">
                <h3 style="font-size: 11px; font-weight: 600; margin: 0 0 8px 0; color: #111827;">Vue d'ensemble</h3>
                <ul style="font-size: 9px; color: #374151; margin: 0; padding-left: 12px; line-height: 1.4;">
                  <li style="margin-bottom: 4px;">Top produit: <strong>${topProducts[0]?.name?.substring(0, 15) || "—"}</strong></li>
                  <li style="margin-bottom: 4px;">Catégorie: <strong>Papeterie</strong></li>
                  <li style="margin-bottom: 0;">Statut: <strong style="color: ${counts["Rupture"] > 0 ? "#F97316" : "#16A34A"}">${counts["Rupture"] > 0 ? "Attention" : "Stable"}</strong></li>
                </ul>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 12px; background: white;">
                <h3 style="font-size: 11px; font-weight: 600; margin: 0 0 8px 0; color: #111827;">Recommandations</h3>
                <ol style="font-size: 9px; color: #374151; margin: 0; padding-left: 12px; line-height: 1.4;">
                  <li style="margin-bottom: 4px;">Réappro. ruptures</li>
                  <li style="margin-bottom: 4px;">Surveiller critiques</li>
                  <li style="margin-bottom: 0;">Planifier commandes</li>
                </ol>
              </div>
            </div>
            
            <div style="margin-top: 12px; padding: 10px; background: #F9FAFB; border-radius: 4px; border: 1px solid #E5E7EB;">
              <p style="font-size: 9px; color: #6B7280; margin: 0; line-height: 1.4;">
                Stock total: <strong>${formatNumber(totalValue)} F</strong> • Produits: <strong>${enriched.length}</strong> • 
                Alertes: <strong>${counts["Rupture"] || 0}</strong> ruptures, <strong>${counts["Critique"] || 0}</strong> critiques.
                ${counts["Rupture"] > 0 ? 'Action requise.' : 'Situation stable.'}
              </p>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #472EAD; margin-bottom: 10px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">2. Indicateurs Clés</h2>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;">
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 10px; text-align: center; background: #F0F9FF;">
                <p style="font-size: 8px; color: #6B7280; margin: 0 0 6px 0; font-weight: 500;">Entrées (30j)</p>
                <p style="font-size: 20px; font-weight: bold; color: #06B6D4; margin: 0;">+${formatNumber(27)}</p>
                <p style="font-size: 8px; color: #9CA3AF; margin: 4px 0 0 0;">cartons</p>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 10px; text-align: center; background: #FEF2F2;">
                <p style="font-size: 8px; color: #6B7280; margin: 0 0 6px 0; font-weight: 500;">Sorties (30j)</p>
                <p style="font-size: 20px; font-weight: bold; color: #F97316; margin: 0;">-${formatNumber(45)}</p>
                <p style="font-size: 8px; color: #9CA3AF; margin: 4px 0 0 0;">cartons</p>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 10px; text-align: center; background: #F5F3FF;">
                <p style="font-size: 8px; color: #6B7280; margin: 0 0 6px 0; font-weight: 500;">Balance</p>
                <p style="font-size: 20px; font-weight: bold; color: #472EAD; margin: 0;">${formatNumber(27 - 45)}</p>
                <p style="font-size: 8px; color: #9CA3AF; margin: 4px 0 0 0;">${27 - 45 > 0 ? 'hausse' : 'baisse'}</p>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;">
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 8px; text-align: center; background: #F9FAFB;">
                <p style="font-size: 8px; color: #6B7280; margin: 0 0 4px 0;">Valeur stock</p>
                <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 0;">${formatNumber(totalValue)} F</p>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 8px; text-align: center; background: #F9FAFB;">
                <p style="font-size: 8px; color: #6B7280; margin: 0 0 4px 0;">Produits</p>
                <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 0;">${enriched.length}</p>
              </div>
              
              <div style="border: 1px solid #E5E7EB; border-radius: 4px; padding: 8px; text-align: center; background: #F9FAFB;">
                <p style="font-size: 8px; color: #6B7280; margin: 0 0 4px 0;">Rotation</p>
                <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 0;">1.8</p>
              </div>
            </div>
            
            <div style="padding: 10px; background: #F9FAFB; border-radius: 4px; border: 1px solid #E5E7EB;">
              <h4 style="font-size: 11px; font-weight: 600; color: #374151; margin: 0 0 8px 0;">Analyse</h4>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 9px;">
                <div>
                  <div style="color: #6B7280;">Tendance</div>
                  <div style="font-weight: 600; color: #111827;">
                    ${27 - 45 > 0 ? 'Hausse' : 'Baisse'} ${Math.abs(27 - 45)} cartons
                  </div>
                </div>
                <div>
                  <div style="color: #6B7280;">Efficacité</div>
                  <div style="font-weight: 600; color: ${counts["Rupture"] > 0 ? "#F97316" : "#16A34A"}">
                    ${counts["Rupture"] > 0 ? 'À améliorer' : 'Acceptable'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 7px; color: #6B7280; text-align: center;">
            <p style="margin: 0; font-weight: 600; color: #374151; font-size: 8px;">Rapport Exécutif LPD CONSULTING</p>
            <p style="margin: 4px 0 0 0;">Document confidentiel • Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
            <p style="margin: 4px 0 0 0; font-size: 6px;">© ${new Date().getFullYear()} LPD CONSULTING • Page 1/1</p>
          </div>
        `;
      };
      
      pdfContainer.innerHTML += DOMPurify.sanitize(createPDFContent());
      
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      document.body.appendChild(pdfContainer);
      
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      document.body.removeChild(pdfContainer);
      
      pdf.save(`rapport-stock-${new Date().toISOString().slice(0,10)}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const resetProductFilters = () => {
    setProductFilters({
      search: "",
      category: "all",
      status: "all"
    });
    setProductPage(1);
  };

  const resetMovementFilters = () => {
    setMovementFilters({
      search: "",
      type: "all",
      startDate: "",
      endDate: ""
    });
    setMovementPage(1);
  };

  // MODIFICATION: affichage d'un indicateur de chargement si les données ne sont pas encore prêtes
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
    <div className="depot-page p-6" style={{ color: PALETTE.text }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div style={{ width: 56, height: 56, borderRadius: 8, background: PALETTE.violet }} className="flex items-center justify-center text-white font-bold">
              LPD
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Rapport Global d'Inventaire & Mouvements</h1>
              <p className="text-sm text-gray-600">LPD MANAGER — Aujourd'hui le {new Date().toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-[#472EAD] to-[#F97316] text-white shadow hover:opacity-90 transition-opacity"
            title="Exporter PDF"
          >
            <DownloadCloud size={16} />
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 items-center flex-wrap">
        {[
          { k: "resume", t: "Résumé", icon: <Activity size={14} /> },
          { k: "kpis", t: "KPIs", icon: <TrendingUp size={14} /> },
          { k: "charts", t: "Graphiques", icon: <BarChart2 size={14} /> },
          { k: "alerts", t: "Alertes", icon: <PieChart size={14} /> },
          { k: "products", t: "Produits", icon: <FileText size={14} /> },
          { k: "movements", t: "Mouvements", icon: <Activity size={14} /> },
        ].map((it) => (
          <button
            key={it.k}
            onClick={() => setTab(it.k)}
            className={`px-3 py-2 text-sm rounded transition-colors ${tab === it.k ? "bg-white border shadow" : "bg-gray-50 hover:bg-gray-100"} flex items-center gap-2`}
          >
            {it.icon} <span>{it.t}</span>
          </button>
        ))}
      </div>

      <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-lg border">
        {tab === "resume" && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Résumé Exécutif</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Valeur totale du stock</p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.violet }}>{formatNumber(totalValue)} F</p>
                <p className="text-xs text-gray-500 mt-2">(approximation à partir du stock actuel)</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Nombre de produits</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-gray-500 mt-2">Produits référencés</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Alertes</p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.orange }}>{counts["Rupture"] || 0} ruptures — {counts["Critique"] || 0} critiques</p>
                <p className="text-xs text-gray-500 mt-2">Agir rapidement sur les ruptures</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Résumé rapide</h3>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li>Top produit (valeur) : <strong>{topProductsData[0]?.label || "—"}</strong></li>
                  <li>Fournisseur le plus récent : <strong>Papeterie Plus</strong></li>
                  <li>Recommandation : <strong style={{ color: PALETTE.orange }}>Réapprovisionner Cahier 96 pages</strong></li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Actions proposées</h3>
                <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-1">
                  <li>Prioriser les réapprovisionnements en rupture.</li>
                  <li>Vérifier les écarts inventaire pour produits critiques.</li>
                  <li>Considérer promotions sur produits sur-stockés.</li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {tab === "kpis" && (
          <section>
            <h2 className="text-lg font-semibold mb-3">KPIs</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Entrées (30j)</p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.blue }}>+{formatNumber(27)}</p>
                <p className="text-xs text-gray-500 mt-1">cartons</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Sorties (30j)</p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.orange }}>-{formatNumber(45)}</p>
                <p className="text-xs text-gray-500 mt-1">cartons</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Variation nette</p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.violet }}>{formatNumber(27 - 45)}</p>
                <p className="text-xs text-gray-500 mt-1">cartons</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Valeur du stock</p>
                <p className="text-2xl font-bold">{formatNumber(totalValue)} F</p>
                <p className="text-xs text-gray-500 mt-1">estimation</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Produits actifs</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-gray-500 mt-1">référencés</p>
              </div>

              <div className="p-4 rounded-lg border">
                <p className="text-xs text-gray-500">Taux de rotation</p>
                <p className="text-2xl font-bold">1.8</p>
                <p className="text-xs text-gray-500 mt-1">(exemple)</p>
              </div>
            </div>
          </section>
        )}

        {tab === "charts" && (
          <section>
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart2 size={20} />
              Tableaux de Bord Avancés
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="border rounded-xl p-5 bg-white shadow-sm">
                <ProfessionalLineChart 
                  data={stockEvolutionData}
                  title="Évolution de la Valeur du Stock (7 jours)"
                  color={PALETTE.violet}
                  height={250}
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendUp size={16} className="text-green-500" />
                      <span>Tendance : <strong className="text-green-600">+6.7%</strong></span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Moyenne : {formatNumber(stockEvolutionData.reduce((sum, d) => sum + d.value, 0) / stockEvolutionData.length)} F
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-5 bg-white shadow-sm">
                <ProfessionalBarChart 
                  data={topProductsData}
                  title="Top 5 Produits par Valeur"
                  color={PALETTE.orange}
                  height={250}
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Valeur totale</div>
                      <div className="font-semibold">
                        {formatNumber(topProductsData.reduce((sum, d) => sum + d.value, 0))} F
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Part du total</div>
                      <div className="font-semibold">
                        {Math.round((topProductsData.reduce((sum, d) => sum + d.value, 0) / totalValue) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border rounded-xl p-5 bg-white shadow-sm">
                <PieChartComponent 
                  data={categoryData}
                  title="Répartition par Catégorie"
                  height={250}
                />
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs mb-1">Analyse catégorielle</div>
                    <div className="font-semibold">
                      {categoryData[0]?.label || "—"} : {categoryData[0] ? Math.round((categoryData[0].value / totalValue) * 100) : 0}% du total
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-5 bg-white shadow-sm">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Tendances des Mouvements
                </h3>
                <div className="space-y-4">
                  {movementTrendData.map((week, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{week.label}</span>
                        <span className="text-gray-600">
                          Balance : <strong style={{ color: week.entrées > week.sorties ? PALETTE.green : PALETTE.red }}>
                            {week.entrées - week.sorties > 0 ? '+' : ''}{week.entrées - week.sorties}
                          </strong>
                        </span>
                      </div>
                      <div className="flex space-x-1 h-6">
                        <div 
                          className="rounded-l bg-blue-500 flex items-center justify-end pr-2 text-xs text-white font-semibold"
                          style={{ width: `${(week.entrées / 40) * 100}%` }}
                        >
                          +{week.entrées}
                        </div>
                        <div 
                          className="rounded-r bg-red-500 flex items-center pl-2 text-xs text-white font-semibold"
                          style={{ width: `${(week.sorties / 40) * 100}%` }}
                        >
                          -{week.sorties}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                        <span className="text-xs">Entrées</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-xs">Sorties</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Période : 4 semaines
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <BarChart2 size={24} className="text-violet-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-violet-800">Analyse des Graphiques</h4>
                  <p className="text-sm text-violet-600">
                    Les visualisations montrent une croissance positive de la valeur du stock (+6.7% sur 7 jours) avec une forte concentration sur les produits de papeterie (80% de la valeur totale).
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "alerts" && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Alertes Stock</h2>
              
              {/* Sous-onglets pour les alertes */}
              <div className="flex border-b mb-4">
                {[
                  { key: "rupture", label: "Rupture", count: ruptureProducts.length, color: "red" },
                  { key: "critique", label: "Critique", count: critiqueProducts.length, color: "orange" },
                  { key: "faible", label: "Faible", count: faibleProducts.length, color: "yellow" }
                ].map((subTab) => (
                  <button
                    key={subTab.key}
                    onClick={() => setAlertSubTab(subTab.key)}
                    className={`px-4 py-2 text-sm font-medium ${
                      alertSubTab === subTab.key 
                        ? `border-b-2 text-${subTab.color}-600 border-${subTab.color}-500` 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {subTab.label} ({subTab.count})
                  </button>
                ))}
              </div>

              {/* Contenu des sous-onglets */}
              {alertSubTab === "rupture" && (
                <div>
                  <div className="mb-4 p-4 border rounded-lg bg-red-50">
                    <h3 className="text-sm font-semibold text-red-700 mb-2">Produits en Rupture de Stock</h3>
                    <p className="text-xs text-red-600">
                      Ces produits sont complètement épuisés. Action requise immédiatement.
                    </p>
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
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRupture.map(p => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                            <td className="p-3 text-center">{p.category}</td>
                            <td className="p-3 text-center">{p.stockMin} cartons</td>
                            <td className="p-3 text-center">{formatNumber(p.pricePerCarton)} F</td>
                            <td className="p-3 text-center">
                              <button className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">
                                Commander
                              </button>
                            </td>
                          </tr>
                        ))}
                        {paginatedRupture.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500">
                              Aucun produit en rupture de stock
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    
                    {/* Pagination pour rupture */}
                    {ruptureProducts.length > 0 && (
                      <Pagination
                        currentPage={rupturePage}
                        totalPages={ruptureTotalPages}
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
                    <p className="text-xs text-orange-600">
                      Ces produits sont en dessous du seuil critique. Réapprovisionnement urgent recommandé.
                    </p>
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
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCritique.map(p => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                            <td className="p-3 text-center">{p.cartons} cartons</td>
                            <td className="p-3 text-center">{p.stockMin} cartons</td>
                            <td className="p-3 text-center">
                              <span className="text-orange-600 font-semibold">
                                {p.stockMin - p.cartons} cartons
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200">
                                Planifier
                              </button>
                            </td>
                          </tr>
                        ))}
                        {paginatedCritique.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500">
                              Aucun produit en stock critique
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    
                    {/* Pagination pour critique */}
                    {critiqueProducts.length > 0 && (
                      <Pagination
                        currentPage={critiquePage}
                        totalPages={critiqueTotalPages}
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
                    <p className="text-xs text-yellow-600">
                      Ces produits approchent du seuil minimum. Surveillance recommandée.
                    </p>
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
                          <th className="p-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFaible.map(p => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                            <td className="p-3 text-center">{p.cartons} cartons</td>
                            <td className="p-3 text-center">{p.stockMin} cartons</td>
                            <td className="p-3 text-center">
                              <span className="text-yellow-600">
                                {p.cartons - p.stockMin} cartons
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                À surveiller
                              </span>
                            </td>
                          </tr>
                        ))}
                        {paginatedFaible.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500">
                              Aucun produit en stock faible
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    
                    {/* Pagination pour faible */}
                    {faibleProducts.length > 0 && (
                      <Pagination
                        currentPage={faiblePage}
                        totalPages={faibleTotalPages}
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

        {tab === "products" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Tableau Produits</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter size={14} />
                <span>{filteredProducts.length} produit(s) trouvé(s)</span>
              </div>
            </div>
            
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <Search size={16} />
                <h3 className="text-sm font-medium">Filtres de recherche</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rechercher</label>
                  <input
                    type="text"
                    placeholder="Nom, code-barre, catégorie..."
                    value={productFilters.search}
                    onChange={(e) => setProductFilters({...productFilters, search: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={productFilters.category}
                    onChange={(e) => setProductFilters({...productFilters, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="Papeterie">Papeterie</option>
                    <option value="Fournitures">Fournitures</option>
                    <option value="Bureau">Bureau</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Statut de stock</label>
                  <select
                    value={productFilters.status}
                    onChange={(e) => setProductFilters({...productFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="Normal">Normal</option>
                    <option value="Faible">Faible</option>
                    <option value="Critique">Critique</option>
                    <option value="Rupture">Rupture</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3 flex justify-between">
                <button
                  onClick={resetProductFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
                <div className="text-xs text-gray-500">
                  {filteredProducts.length} sur {enriched.length} produit(s)
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Produit</th>
                    <th className="p-3 text-center">Code-barre</th>
                    <th className="p-3 text-center">Catégorie</th>
                    <th className="p-3 text-center">Cartons</th>
                    <th className="p-3 text-center">Unités/Carton</th>
                    <th className="p-3 text-center">Prix/Carton</th>
                    <th className="p-3 text-center">Prix Total</th>
                    <th className="p-3 text-center">Stock Min.</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3 text-center font-mono text-xs">{p.barcode}</td>
                      <td className="p-3 text-center">{p.category}</td>
                      <td className="p-3 text-center">{p.cartons}</td>
                      <td className="p-3 text-center">{p.unitsPerCarton}</td>
                      <td className="p-3 text-center">{formatNumber(p.pricePerCarton)} F</td>
                      <td className="p-3 text-center">{formatNumber(p.totalPrice)} F</td>
                      <td className="p-3 text-center">{p.stockMin}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${p.status === "Rupture" ? "bg-red-100 text-red-700" : p.status === "Critique" ? "bg-orange-100 text-orange-700" : p.status === "Faible" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedProducts.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  Aucun produit ne correspond aux critères de recherche
                </div>
              )}
              
              {/* Pagination pour les produits */}
              {filteredProducts.length > 0 && (
                <Pagination
                  currentPage={productPage}
                  totalPages={productTotalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={productItemsPerPage}
                  onPageChange={setProductPage}
                  onItemsPerPageChange={setProductItemsPerPage}
                />
              )}
            </div>
          </section>
        )}

        {tab === "movements" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Historique des Mouvements</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter size={14} />
                <span>{filteredMovements.length} mouvement(s) trouvé(s)</span>
              </div>
            </div>
            
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <Search size={16} />
                <h3 className="text-sm font-medium">Filtres de recherche</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rechercher</label>
                  <input
                    type="text"
                    placeholder="Produit, code-barre, gestionnaire..."
                    value={movementFilters.search}
                    onChange={(e) => setMovementFilters({...movementFilters, search: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={movementFilters.type}
                    onChange={(e) => setMovementFilters({...movementFilters, type: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Tous les types</option>
                    <option value="Entrée">Entrée</option>
                    <option value="Sortie">Sortie</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={movementFilters.startDate}
                    onChange={(e) => setMovementFilters({...movementFilters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={movementFilters.endDate}
                    onChange={(e) => setMovementFilters({...movementFilters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-3 flex justify-between">
                <button
                  onClick={resetMovementFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
                <div className="text-xs text-gray-500">
                  {filteredMovements.length} sur {movements.length} mouvement(s)
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Produit</th>
                    <th className="p-3 text-left">Code-barre</th>
                    <th className="p-3 text-center">Quantité</th>
                    <th className="p-3 text-center">Avant → Après</th>
                    <th className="p-3 text-center">Coût</th>
                    <th className="p-3 text-center">Date</th>
                    <th className="p-3 text-center">Gestionnaire</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMovements.map(m => (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs ${m.type === "Entrée" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{m.type}</span>
                      </td>
                      <td className="p-3">{m.productName}</td>
                      <td className="p-3 font-mono text-xs">{m.barcode}</td>
                      <td className="p-3 text-center">{m.qty} cartons</td>
                      <td className="p-3 text-center">{m.before} → {m.after}</td>
                      <td className="p-3 text-center">{m.cost ? `${formatNumber(m.cost)} F` : "-"}</td>
                      <td className="p-3 text-center">{new Date(m.date).toLocaleString("fr-FR")}</td>
                      <td className="p-3 text-center">{m.manager}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedMovements.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  Aucun mouvement ne correspond aux critères de recherche
                </div>
              )}
              
              {/* Pagination pour les mouvements */}
              {filteredMovements.length > 0 && (
                <Pagination
                  currentPage={movementPage}
                  totalPages={movementTotalPages}
                  totalItems={filteredMovements.length}
                  itemsPerPage={movementItemsPerPage}
                  onPageChange={setMovementPage}
                  onItemsPerPageChange={setMovementItemsPerPage}
                />
              )}
            </div>
          </section>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">Report generated by LPD  — Données réelles du système</p>
    </div>
  );
}
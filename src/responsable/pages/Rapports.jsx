// ==========================================================
// 📊 Rapports.jsx — Interface Responsable (LPD Manager)
// Version Premium — Filtres dynamiques + KPI + Graphiques + Export
// Style harmonisé avec Utilisateurs / Inventaire / Journal
// ==========================================================

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  FileDown,
  FileSpreadsheet,
  Calendar,
  RefreshCw,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import KpiCard from "../components/KpiCard";
import ChartBox from "../components/ChartBox";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);
const COLORS = ["#472EAD", "#F58020", "#10B981", "#EF4444", "#3B82F6", "#F59E0B"];

export default function Rapports() {
  // -------------------- États & filtres --------------------
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());
  const [categorie, setCategorie] = useState("Toutes");
  const [client, setClient] = useState("Tous");
  const [fournisseur, setFournisseur] = useState("Tous");

  // -------------------- Données --------------------
  const [loading, setLoading] = useState(true);
  const [ventes, setVentes] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [kpi, setKpi] = useState({
    totalVentes: 0,
    entrees: 0,
    sorties: 0,
    alertes: 0,
    benefice: 0,
  });

  // -------------------- Simulation temporaire --------------------
  const loadData = async () => {
    setLoading(true);
    try {
      // 🔗 Quand ton backend sera prêt, tu remplaces ici par des appels axios + filtres
      const ventesSimu = [
        { date: "2025-10-01", total: 145000, benefice: 35000 },
        { date: "2025-10-02", total: 180000, benefice: 40000 },
        { date: "2025-10-03", total: 120000, benefice: 25000 },
        { date: "2025-10-04", total: 200000, benefice: 50000 },
        { date: "2025-10-05", total: 160000, benefice: 42000 },
      ];
      const stocksSimu = [
        { type: "Entrées", valeur: 300000 },
        { type: "Sorties", valeur: 220000 },
      ];
      const alertesSimu = [
        { produit: "Cahier 200p", type: "Rupture", niveau: "Critique" },
        { produit: "Stylo bleu x50", type: "Seuil bas", niveau: "Moyen" },
      ];

      setVentes(ventesSimu);
      setStocks(stocksSimu);
      setAlertes(alertesSimu);
      setKpi({
        totalVentes: ventesSimu.reduce((s, v) => s + v.total, 0),
        entrees: 300000,
        sorties: 220000,
        alertes: alertesSimu.length,
        benefice: ventesSimu.reduce((s, v) => s + v.benefice, 0),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebut, dateFin, categorie, client, fournisseur]);

  // -------------------- Données pour ChartBox global --------------------
  const ventesChart = ventes.map((v) => ({
    name: v.date,
    total: v.total,
    benefice: v.benefice,
  }));

  const stocksChart = stocks.map((s) => ({
    name: s.type,
    valeur: s.valeur,
  }));

  const alertesPie = (() => {
    const counts = alertes.reduce((acc, a) => {
      const key = a.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // -------------------- Exports PDF / Excel --------------------
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport global — Ventes & Stocks", 14, 16);
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 22);
    doc.autoTable({
      startY: 28,
      head: [["Total Ventes", "Entrées", "Sorties", "Alertes", "Bénéfice"]],
      body: [
        [
          formatFCFA(kpi.totalVentes),
          formatFCFA(kpi.entrees),
          formatFCFA(kpi.sorties),
          kpi.alertes,
          formatFCFA(kpi.benefice),
        ],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save(`Rapport_${dateDebut}_au_${dateFin}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        ventes.map((v) => ({
          Date: v.date,
          Total: v.total,
          Benefice: v.benefice,
        }))
      ),
      "Ventes"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(stocks),
      "Stocks"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(alertes),
      "Alertes"
    );

    XLSX.writeFile(wb, `Rapport_${dateDebut}_au_${dateFin}.xlsx`);
  };

  // -------------------- Loader harmonisé --------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <RefreshCw className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des rapports…
          </span>
        </div>
      </div>
    );
  }

  // -------------------- Rendu principal --------------------
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Rapports — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Rapports & supervision
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Vue consolidée des ventes, stocks, bénéfices et alertes critiques.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période analysée : {dateDebut} → {dateFin}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-white border border-[#E3E0FF] text-[#472EAD] px-4 py-2 rounded-lg shadow-sm hover:bg-[#F7F5FF] hover:shadow-md transition text-sm"
            >
              <FileDown size={16} /> PDF
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 bg-[#472EAD] text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition text-sm"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        </motion.header>

        {/* FILTRES */}
        <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 text-[#472EAD] font-semibold mb-1">
            <Filter size={16} /> Filtres
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* Période */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Période
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
                  <input
                    type="date"
                    value={dateDebut}
                    max={dateFin}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                  />
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
                  <input
                    type="date"
                    value={dateFin}
                    min={dateDebut}
                    max={todayISO()}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="pl-7 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                  />
                </div>
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Catégorie
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
              >
                <option>Toutes</option>
                <option>Papeterie</option>
                <option>Fournitures</option>
                <option>Informatique</option>
              </select>
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Client
              </label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
              >
                <option>Tous</option>
                <option>Client A</option>
                <option>Client B</option>
              </select>
            </div>

            {/* Fournisseur */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Fournisseur
              </label>
              <select
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
              >
                <option>Tous</option>
                <option>SEN Distribution</option>
                <option>Imprisol</option>
              </select>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <KpiCard
            label="Total ventes"
            value={formatFCFA(kpi.totalVentes)}
            icon={<ShoppingCart className="w-6 h-6" />}
            trend="Depuis 30 jours"
            trendValue={8}
            gradient="from-[#472EAD] to-[#7A5BF5]"
          />
          <KpiCard
            label="Entrées stock"
            value={formatFCFA(kpi.entrees)}
            icon={<Package className="w-6 h-6" />}
            trend="Par rapport au mois dernier"
            trendValue={3}
            gradient="from-[#34D399] to-[#10B981]"
          />
          <KpiCard
            label="Sorties stock"
            value={formatFCFA(kpi.sorties)}
            icon={<Package className="w-6 h-6" />}
            trend="Flux sortants"
            trendValue={6}
            gradient="from-[#F58020] to-[#FF995A]"
          />
          <KpiCard
            label="Alertes"
            value={kpi.alertes}
            icon={<AlertTriangle className="w-6 h-6" />}
            trend="Produits critiques"
            trendValue={-2}
            gradient="from-[#EF4444] to-[#FB7185]"
          />
          <KpiCard
            label="Bénéfice net"
            value={formatFCFA(kpi.benefice)}
            icon={
              kpi.benefice >= 0 ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )
            }
            trend="Performance globale"
            trendValue={12}
            gradient="from-[#10B981] to-[#34D399]"
          />
        </section>

        {/* GRAPHIQUES PRINCIPAUX */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartBox
            title="Évolution des ventes (Total & bénéfice)"
            icon={<ShoppingCart size={18} />}
            data={ventesChart}
            dataKey1="total"
            dataKey2="benefice"
            type="line"
          />

          <ChartBox
            title="Entrées / Sorties de stock"
            icon={<Package size={18} />}
            data={stocksChart}
            dataKey1="valeur"
            type="bar"
          />
        </section>

        {/* RÉPARTITION DES ALERTES */}
        {alertesPie.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E4E0FF] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <h3 className="text-[#472EAD] font-semibold mb-3">
              Répartition des alertes (par type)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertesPie}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {alertesPie.map((a, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

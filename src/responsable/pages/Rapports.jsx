// ==========================================================
// 📊 Rapports.jsx — Interface Responsable (LPD Manager)
// Version Premium — Filtres dynamiques + KPI + Graphiques + Export
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
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import KpiCard from "../components/KpiCard";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(
    Number(n || 0)
  );

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
  }, [dateDebut, dateFin, categorie, client, fournisseur]);

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
        ventes.map((v) => ({ Date: v.date, Total: v.total, Bénéfice: v.benefice }))
      ),
      "Ventes"
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stocks), "Stocks");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alertes), "Alertes");
    XLSX.writeFile(wb, `Rapport_${dateDebut}_au_${dateFin}.xlsx`);
  };

  // -------------------- Chargement --------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-[#472EAD]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Chargement des rapports…
      </div>
    );
  }

  // -------------------- Rendu principal --------------------
  return (
    <div className="min-h-screen bg-[#F9F9FB] px-6 py-8 overflow-y-auto">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">Rapports & Supervision</h1>
          <p className="text-sm text-gray-500">
            Vue consolidée des ventes, stocks, bénéfices et alertes critiques.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-white border border-[#E3E0FF] text-[#472EAD] px-4 py-2 rounded-lg hover:bg-[#F7F5FF] transition"
          >
            <FileDown size={16} /> PDF
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-[#472EAD] text-white px-4 py-2 rounded-lg hover:scale-[1.02] transition"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </motion.header>

      {/* FILTRES */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-8">
        <div className="flex items-center gap-2 text-[#472EAD] font-semibold mb-3">
          <Filter size={16} /> Filtres
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Période</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateDebut}
                max={dateFin}
                onChange={(e) => setDateDebut(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateFin}
                min={dateDebut}
                onChange={(e) => setDateFin(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option>Toutes</option>
              <option>Papeterie</option>
              <option>Fournitures</option>
              <option>Informatique</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Client</label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option>Tous</option>
              <option>Client A</option>
              <option>Client B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fournisseur</label>
            <select
              value={fournisseur}
              onChange={(e) => setFournisseur(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option>Tous</option>
              <option>SEN Distribution</option>
              <option>Imprisol</option>
            </select>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <KpiCard
          label="Total Ventes"
          value={formatFCFA(kpi.totalVentes)}
          icon={<ShoppingCart className="w-6 h-6" />}
          trend="Depuis 30 jours"
          trendValue={+8}
          gradient="from-[#472EAD] to-[#7A5BF5]"
        />
        <KpiCard
          label="Entrées Stock"
          value={formatFCFA(kpi.entrees)}
          icon={<Package className="w-6 h-6" />}
          trend="Par rapport au mois dernier"
          trendValue={+3}
          gradient="from-[#34D399] to-[#10B981]"
        />
        <KpiCard
          label="Sorties Stock"
          value={formatFCFA(kpi.sorties)}
          icon={<Package className="w-6 h-6" />}
          trend="Flux sortants"
          trendValue={+6}
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
          trendValue={+12}
          gradient="from-[#10B981] to-[#34D399]"
        />
      </section>

      {/* GRAPHIQUES */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ChartBox title="Évolution des ventes" data={ventes} type="line" />
        <ChartBox title="Entrées / Sorties de stock" data={stocks} type="bar" />
      </section>

      {alertes.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
          <h3 className="text-[#472EAD] font-semibold mb-3">Répartition des alertes</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={alertes} dataKey="niveau" nameKey="type" outerRadius={90}>
                  {alertes.map((a, i) => (
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
  );
}

// —————————————————————————————
// Composant local ChartBox
// —————————————————————————————
function ChartBox({ title, data, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
    >
      <h3 className="text-[#472EAD] font-semibold mb-3">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === "line" ? (
            <LineChart data={data}>
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Legend />
              <Line dataKey="total" stroke="#472EAD" name="Total" />
              <Line dataKey="benefice" stroke="#10B981" name="Bénéfice" />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="type" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Legend />
              <Bar dataKey="valeur" fill="#F58020" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

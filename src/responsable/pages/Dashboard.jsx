// ==========================================================
// 📊 Dashboard.jsx — Interface Responsable PREMIUM (LPD Manager)
// Édition 2025 : design glassmorphique, fluide, élégant et animé
// ==========================================================

import React from "react";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  FileDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";

// === Components réutilisables ===
import Card from "../components/Card";
import ChartBox from "../components/ChartBox";
import TableWidget from "../components/TableWidget";
import TopProductsWidget from "../components/TopProductsWidget";

// === Données simulées (à remplacer plus tard par API) ===
const salesData = [
  { name: "Lun", ventes: 320, revenus: 65000 },
  { name: "Mar", ventes: 410, revenus: 82000 },
  { name: "Mer", ventes: 380, revenus: 76000 },
  { name: "Jeu", ventes: 470, revenus: 92000 },
  { name: "Ven", ventes: 520, revenus: 98000 },
  { name: "Sam", ventes: 390, revenus: 71000 },
  { name: "Dim", ventes: 260, revenus: 52000 },
];

const stockData = [
  { name: "Rupture", value: 14 },
  { name: "Sous le seuil", value: 36 },
  { name: "Stock normal", value: 847 },
];

const stats = [
  {
    label: "Ventes totales",
    value: "1 245 000 FCFA",
    icon: <ShoppingBag size={22} />,
    trend: "+12 %",
    gradient: "from-[#472EAD] to-[#7A5BF5]",
  },
  {
    label: "Bénéfices nets",
    value: "425 000 FCFA",
    icon: <DollarSign size={22} />,
    trend: "+8 %",
    gradient: "from-[#F58020] to-[#FF995A]",
  },
  {
    label: "Produits en stock",
    value: "847",
    icon: <Package size={22} />,
    trend: "Stable",
    gradient: "from-[#34D399] to-[#10B981]",
  },
  {
    label: "Alertes stock bas",
    value: "14",
    icon: <AlertCircle size={22} />,
    trend: "−2 %",
    gradient: "from-[#EF4444] to-[#FB7185]",
  },
];

const topProducts = [
  { rank: 1, name: "Cahier 200 p", sales: 120, revenue: 250000 },
  { rank: 2, name: "Stylo Bleu", sales: 95, revenue: 80000 },
  { rank: 3, name: "Crayon HB", sales: 78, revenue: 56000 },
  { rank: 4, name: "Classeur A4", sales: 60, revenue: 90000 },
  { rank: 5, name: "Feutres Couleur", sales: 55, revenue: 75000 },
];

const activities = [
  { action: "Nouvelle commande validée", user: "Vendeur #23", time: "Il y a 3 min" },
  { action: "Stock réapprovisionné", user: "Gestionnaire #7", time: "Il y a 27 min" },
  { action: "Rapport PDF exporté", user: "Admin Responsable", time: "Il y a 2 h" },
  { action: "Ajout d’un fournisseur", user: "Admin Responsable", time: "Hier" },
];

export default function Dashboard() {
  // === Export PDF des activités ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport d’Activité — LPD Manager", 14, 20);
    doc.autoTable({
      head: [["Action", "Utilisateur", "Horodatage"]],
      body: activities.map((a) => [a.action, a.user, a.time]),
      startY: 30,
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save("Rapport_LPD_Manager.pdf");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* === HEADER === */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Tableau de bord — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2F1F7A] tracking-tight">
                Tableau de bord du Responsable
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Vue consolidée des performances, stocks et activités récentes.
              </p>
            </div>
          </div>

          <div className="flex gap-3">

          </div>
        </motion.header>

        {/* === KPI CARDS (2x2 pour alignement) === */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6"
        >
          {stats.map((s, i) => (
            <Card
              key={i}
              label={s.label}
              value={s.value}
              icon={s.icon}
              trend={s.trend}
              gradient={s.gradient}
            />
          ))}
        </motion.section>

        {/* === ALERTES CRITIQUES === */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
            <XCircle size={18} /> <span>3 produits en rupture</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl">
            <AlertCircle size={18} /> <span>5 produits sous le seuil</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
            <CheckCircle size={18} /> <span>Stock global stable</span>
          </div>
        </motion.section>

        {/* === GRAPHIQUES PRINCIPAUX === */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-8"
        >
          <ChartBox
            title="Évolution des ventes et revenus"
            icon={<TrendingUp size={18} />}
            data={salesData}
            dataKey1="ventes"
            dataKey2="revenus"
            type="line"
          />

          <ChartBox
            title="Répartition du stock global"
            icon={<Package size={18} />}
            data={stockData}
            dataKey1="value"
            type="pie"
          />
        </motion.section>

        {/* === COURBE DES BÉNÉFICES === */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <ChartBox
            title="Progression mensuelle des bénéfices"
            icon={<DollarSign size={18} />}
            data={salesData}
            dataKey1="revenus"
            type="area"
          />
        </motion.section>

        {/* === TOP 5 PRODUITS BEST-SELLERS === */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <TopProductsWidget data={topProducts} />
        </motion.section>

        {/* === ACTIVITÉS RÉCENTES === */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1 }}
        >
          <TableWidget
            title="Activités récentes"
            color="#472EAD"
            columns={[
              { label: "Action", key: "action" },
              { label: "Utilisateur", key: "user" },
              { label: "Horodatage", key: "time" },
            ]}
            data={activities}
          />
        </motion.section>

        {/* === FOOTER === */}

      </motion.div>
    </div>
  );
}

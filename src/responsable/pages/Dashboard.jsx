// ==========================================================
// 📊 Dashboard.jsx — Interface Responsable (LPD Manager)
// Version Premium LPD : analytique, animée, élégante et complète
// ==========================================================

import React from "react";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";

// === Données simulées ===
const salesData = [
  { jour: "Lun", ventes: 320, revenus: 65000 },
  { jour: "Mar", ventes: 410, revenus: 82000 },
  { jour: "Mer", ventes: 380, revenus: 76000 },
  { jour: "Jeu", ventes: 470, revenus: 92000 },
  { jour: "Ven", ventes: 520, revenus: 98000 },
  { jour: "Sam", ventes: 390, revenus: 71000 },
  { jour: "Dim", ventes: 260, revenus: 52000 },
];

const stockData = [
  { name: "Produits disponibles", value: 847, color: "#472EAD" },
  { name: "Produits vendus", value: 320, color: "#F58020" },
  { name: "Ruptures", value: 14, color: "#EF4444" },
];

const stats = [
  { label: "Ventes totales", value: "1 245 000 FCFA", icon: <ShoppingBag />, trend: "+12 %", color: "from-[#472EAD] to-[#7A5BF5]" },
  { label: "Bénéfices nets", value: "425 000 FCFA", icon: <DollarSign />, trend: "+8 %", color: "from-[#F58020] to-[#FF995A]" },
  { label: "Produits en stock", value: "847", icon: <Package />, trend: "Stable", color: "from-[#34D399] to-[#10B981]" },
  { label: "Alertes stock bas", value: "14", icon: <AlertCircle />, trend: "−2 %", color: "from-[#EF4444] to-[#FB7185]" },
];

const activities = [
  { action: "Nouvelle commande validée", user: "Vendeur #23", time: "Il y a 3 min" },
  { action: "Stock réapprovisionné", user: "Gestionnaire #7", time: "Il y a 27 min" },
  { action: "Rapport PDF exporté", user: "Admin Responsable", time: "Il y a 2 h" },
  { action: "Ajout d’un nouveau fournisseur", user: "Admin Responsable", time: "Hier" },
];

export default function Dashboard() {
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Rapport d’Activité — LPD Manager", 14, 20);
    const tableData = activities.map((a) => [a.action, a.user, a.time]);
    doc.autoTable({
      head: [["Action", "Utilisateur", "Horodatage"]],
      body: tableData,
      startY: 30,
    });
    doc.save("Rapport_LPD_Manager.pdf");
  };

  return (
    <div className="min-h-screen w-full bg-[#F9F9FB] px-6 py-8 overflow-y-auto">
      {/* === Header global === */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">Tableau de bord du Responsable</h1>
          <p className="text-sm text-gray-500">Vue consolidée des activités locales et performances globales.</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-[#472EAD] hover:bg-[#5A3CF5] text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200"
        >
          <FileDown size={18} />
          Exporter en PDF
        </button>
      </motion.header>

      {/* === Statistiques principales === */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl p-5 transition-all`}
          >
            <div className={`absolute inset-0 opacity-0 hover:opacity-10 bg-gradient-to-br ${stat.color} transition-all duration-500`} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <h3 className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</h3>
                <p
                  className={`text-xs font-semibold mt-1 ${
                    stat.trend.startsWith("+") ? "text-emerald-600" : stat.trend.startsWith("−") ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {stat.trend} ce mois
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 text-[#472EAD] shadow-inner">
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* === Visualisations === */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        {/* Ventes hebdomadaires */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-[#472EAD] mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Évolution des ventes & revenus
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <XAxis dataKey="jour" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ventes" stroke="#472EAD" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="revenus" stroke="#F58020" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Répartition du stock */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-[#472EAD] mb-4 flex items-center gap-2">
            <Package size={18} /> Répartition du stock
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {stockData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* === Courbe des bénéfices === */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-10"
      >
        <h2 className="text-lg font-semibold text-[#472EAD] mb-4 flex items-center gap-2">
          <DollarSign size={18} /> Progression des bénéfices mensuels
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#472EAD" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#472EAD" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="jour" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Area type="monotone" dataKey="revenus" stroke="#472EAD" fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* === Journal d’activités === */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <Users size={18} /> Activités récentes
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {activities.map((a, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center justify-between py-3 px-1 hover:bg-[#F9F9FF] rounded-md transition"
            >
              <div>
                <p className="text-sm text-gray-700 font-medium">{a.action}</p>
                <p className="text-xs text-gray-500">{a.user}</p>
              </div>
              <span className="text-xs font-semibold text-[#F58020]">{a.time}</span>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {/* === Footer === */}
      <div className="text-center text-xs text-gray-500 mt-8 pb-4">
        © 2025 <span className="text-[#472EAD] font-semibold">LPD Consulting</span> — Interface Responsable v2.0
      </div>
    </div>
  );
}

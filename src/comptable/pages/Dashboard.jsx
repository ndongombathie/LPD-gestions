// ==========================================================
// 📊 Dashboard.jsx — Interface Comptable Premium (LPD)
// Version améliorée : StatCards CLIQUABLES 🔥
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  CalendarRange,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import { useNavigate } from "react-router-dom";

import {
  statsComptable,
  evolutionVentes,
  dernieresActivites,
} from "../../data/mockComptable";

// Variants pour les animations des cartes
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// Tooltip Recharts custom
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-white/95 border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-[11px] text-gray-500 mb-1">{label}</div>
      <div className="text-[13px] font-bold text-[#472EAD]">
        {value.toLocaleString("fr-FR")} FCFA
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-4">

      {/* ======================================================
          EN-TÊTE DU DASHBOARD
      ====================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#472EAD]">
            Tableau de bord comptable
          </h1>
          <p className="text-sm text-gray-500">
            Vue globale sur les ventes, encaissements et activités financières.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 bg-white shadow-sm">
            <CalendarRange size={14} />
            Période : <span className="font-semibold">Janv – Déc 2025</span>
          </button>
        </div>
      </div>

      {/* ======================================================
          CARTES STATISTIQUES — maintenant CLIQUABLES 🔥
      ====================================================== */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-5"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.08 }}
      >
        <StatCard
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          title="Chiffre d'affaires du jour"
          value={`${statsComptable.chiffreAffairesJour.toLocaleString("fr-FR")} FCFA`}
          trend="+8,5 % vs hier"
          onClick={() => navigate("/comptable/ventes-journalieres")}
        />

        <StatCard
          icon={TrendingUp}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
          title="Chiffre d'affaires du mois"
          value={`${statsComptable.chiffreAffairesMois.toLocaleString("fr-FR")} FCFA`}
          trend="+12,3 % vs mois dernier"
          onClick={() => navigate("/comptable/ventes-mensuelles")}
        />

        <StatCard
          icon={ShoppingBag}
          iconBg="bg-sky-50"
          iconColor="text-sky-500"
          title="Nombre total de ventes"
          value={statsComptable.totalVentes.toLocaleString("fr-FR")}
          trend="Ventes validées"
          onClick={() => navigate("/comptable/ventes")}
        />

        <StatCard
          icon={AlertTriangle}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          title="Produits en rupture"
          value={statsComptable.produitsRupture}
          trend="À surveiller rapidement"
          onClick={() => navigate("/comptable/ruptures-stock")}
        />
      </motion.div>

      {/* ======================================================
          GRAPHIQUES
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courbe des ventes */}
        <motion.div
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Évolution du chiffre d'affaires
              </h2>
              <p className="text-xs text-gray-500">
                Suivi mensuel des ventes globales (dépôt + boutique)
              </p>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionVentes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#472EAD"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Histogramme simple */}
        <motion.div
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Ventes par mois (aperçu)
              </h2>
              <p className="text-xs text-gray-500">
                Comparaison rapide des volumes par mois.
              </p>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionVentes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#F58020" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          ACTIVITÉS RÉCENTES
      ====================================================== */}
      <motion.div
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#472EAD]/10 flex items-center justify-center">
            <Activity size={16} className="text-[#472EAD]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Dernières activités</h2>
            <p className="text-xs text-gray-500">
              Ventes, versements, anomalies remontées par le système.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {dernieresActivites.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
            >
              <div className="mt-1 w-2 h-2 rounded-full bg-[#472EAD]" />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{act.message}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{act.date}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ==========================================================
   Carte Statistique — maintenant CLIQUABLE 🟣
========================================================== */
function StatCard({ icon: Icon, iconBg, iconColor, title, value, trend, onClick }) {
  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md border border-gray-100 px-4 py-4 flex flex-col gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
            {title}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>

      <p className="text-[11px] text-gray-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {trend}
      </p>
    </motion.div>
  );
}

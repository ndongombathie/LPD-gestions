// ==========================================================
// 📊 TableauDeBord.jsx — Vendeur PREMIUM (LPD Manager)
// Design moderne + logique EXISTANTE conservée
// ==========================================================

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const TableauDeBord = () => {
  /* =============================
     LOGIQUE EXISTANTE (INCHANGÉE)
  ============================= */
  const [stats, setStats] = useState({
    ventesAujourdhui: 0,
    commandesTraitees: 0,
    produitsVendus: 0,
  });

  const [produitsPopulaires, setProduitsPopulaires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      setStats({
        ventesAujourdhui: 125420,
        commandesTraitees: 24,
        produitsVendus: 42,
      });

      setProduitsPopulaires([
        {
          id: 1,
          nom: "Sac à Main Cuir Noir",
          reference: "SAC-CUIR-001",
          ventes: 28,
          revenu: 420000,
          tendance: "up",
        },
        {
          id: 2,
          nom: "Chemise Homme Blanche",
          reference: "CHM-BLANC-001",
          ventes: 19,
          revenu: 285000,
          tendance: "up",
        },
        {
          id: 3,
          nom: "Parfum Luxury 100ml",
          reference: "PARF-LUX-001",
          ventes: 15,
          revenu: 675000,
          tendance: "stable",
        },
        {
          id: 4,
          nom: "Montre Sport Étanche",
          reference: "MONT-SPORT-002",
          ventes: 12,
          revenu: 360000,
          tendance: "down",
        },
      ]);

      setLoading(false);
    }, 800);

    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        ventesAujourdhui: prev.ventesAujourdhui + Math.floor(Math.random() * 500),
        commandesTraitees: prev.commandesTraitees + 1,
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* =============================
     HELPERS
  ============================= */
  const getTendanceIcon = (tendance) => {
    if (tendance === "up") return <ArrowUp className="text-emerald-500" />;
    if (tendance === "down") return <ArrowDown className="text-rose-500" />;
    return <Minus className="text-gray-400" />;
  };

  /* =============================
     LOADING
  ============================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-[#472EAD]" size={36} />
      </div>
    );
  }

  /* =============================
     RENDER PREMIUM
  ============================= */
  return (
    <div className="space-y-10">
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F1F7A] flex items-center gap-2">
            <TrendingUp /> Tableau de bord vendeur
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aperçu de votre activité en temps réel
          </p>
        </div>

        <div className="flex gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {new Date().toLocaleDateString("fr-FR")}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </motion.div>

      {/* ===== KPI CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
      >
        <KpiCard
          label="Ventes du jour"
          value={`${stats.ventesAujourdhui.toLocaleString()} FCFA`}
          icon={<DollarSign />}
          gradient="from-[#472EAD] to-[#7A5BF5]"
        />
        <KpiCard
          label="Commandes traitées"
          value={stats.commandesTraitees}
          icon={<ShoppingCart />}
          gradient="from-[#F58020] to-[#FF9F66]"
        />
        <KpiCard
          label="Produits vendus"
          value={stats.produitsVendus}
          icon={<Package />}
          gradient="from-[#10B981] to-[#34D399]"
        />
      </motion.div>

      {/* ===== PRODUITS POPULAIRES ===== */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-xl border border-[#E4E0FF] rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Flame className="text-orange-500" />
          <h2 className="text-lg font-bold text-[#2F1F7A]">
            Produits populaires
          </h2>
        </div>

        <div className="space-y-3">
          {produitsPopulaires.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F5FF] transition"
            >
              <div>
                <p className="font-semibold text-gray-800">{p.nom}</p>
                <p className="text-xs text-gray-500">{p.reference}</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium">
                  {p.revenu.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-gray-500">{p.ventes} ventes</p>
              </div>

              {getTendanceIcon(p.tendance)}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* =============================
   SOUS-COMPONENT
============================= */
const KpiCard = ({ label, value, icon, gradient }) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${gradient}`}
  >
    <div className="absolute top-4 right-4 opacity-20">{icon}</div>
    <p className="text-sm opacity-90">{label}</p>
    <p className="text-2xl font-extrabold mt-1">{value}</p>
  </div>
);

export default TableauDeBord;

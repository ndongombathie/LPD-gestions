// ==========================================================
// 📊 TableauDeBord.jsx — Vendeur PREMIUM (LPD Manager)
// Design moderne + aperçus en blanc - Version simplifiée
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
          variation: "+12%",
        },
        {
          id: 2,
          nom: "Chemise Homme Blanche",
          reference: "CHM-BLANC-001",
          ventes: 19,
          revenu: 285000,
          tendance: "up",
          variation: "+8%",
        },
        {
          id: 3,
          nom: "Parfum Luxury 100ml",
          reference: "PARF-LUX-001",
          ventes: 15,
          revenu: 675000,
          tendance: "stable",
          variation: "0%",
        },
        {
          id: 4,
          nom: "Montre Sport Étanche",
          reference: "MONT-SPORT-002",
          ventes: 12,
          revenu: 360000,
          tendance: "down",
          variation: "-5%",
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

  const getTendanceIcon = (tendance) => {
    if (tendance === "up") return <ArrowUp className="text-emerald-500" size={16} />;
    if (tendance === "down") return <ArrowDown className="text-rose-500" size={16} />;
    return <Minus className="text-gray-400" size={16} />;
  };

  const getVariationStyle = (variation) => {
    if (variation.startsWith("+")) return "text-emerald-600 bg-emerald-50";
    if (variation.startsWith("-")) return "text-rose-600 bg-rose-50";
    return "text-gray-600 bg-gray-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-[#472EAD]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F1F7A] flex items-center gap-2">
            <TrendingUp size={24} /> Tableau de bord vendeur
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aperçu de votre activité en temps réel
          </p>
        </div>

        <div className="flex gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <Calendar size={16} />
            {new Date().toLocaleDateString("fr-FR")}
          </span>
          <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <Clock size={16} />
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </motion.div>

      {/* ===== KPI CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Ventes du jour */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Ventes du jour</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.ventesAujourdhui.toLocaleString()} FCFA
              </h3>
            </div>
            <div className="bg-[#472EAD]/10 p-3 rounded-xl">
              <DollarSign className="text-[#472EAD]" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUp size={14} />
              +12% vs hier
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">Objectif: 150K FCFA</span>
          </div>
        </div>

        {/* Commandes traitées */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Commandes traitées</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.commandesTraitees}
              </h3>
            </div>
            <div className="bg-[#F58020]/10 p-3 rounded-xl">
              <ShoppingCart className="text-[#F58020]" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUp size={14} />
              +3 aujourd'hui
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">En attente: 2</span>
          </div>
        </div>

        {/* Produits vendus */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Produits vendus</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.produitsVendus}
              </h3>
            </div>
            <div className="bg-[#10B981]/10 p-3 rounded-xl">
              <Package className="text-[#10B981]" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUp size={14} />
              +8 unités
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">Stock disponible: 156</span>
          </div>
        </div>
      </motion.div>

      {/* ===== PRODUITS POPULAIRES ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Flame className="text-orange-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Produits populaires
              </h2>
              <p className="text-sm text-gray-500">Top 4 du mois</p>
            </div>
          </div>
          <button className="text-sm font-medium text-[#472EAD] hover:text-[#3B21A8]">
            Voir tout →
          </button>
        </div>

        <div className="space-y-4">
          {produitsPopulaires.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{p.nom}</p>
                  <p className="text-xs text-gray-500">{p.reference}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {p.revenu.toLocaleString()} FCFA
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getVariationStyle(p.variation)}`}>
                    {p.variation}
                  </span>
                  <span className="text-xs text-gray-500">{p.ventes} ventes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TableauDeBord;
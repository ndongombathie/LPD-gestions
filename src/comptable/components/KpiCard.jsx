// ==========================================================
// 💎 KpiCard.jsx — Carte KPI (Statistique) réutilisable
// Pour Inventaire, Dashboard, Rapports, etc.
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KpiCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  gradient = "from-[#472EAD] to-[#7A5BF5]",
  description,
}) {
  const isPositive = trendValue >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl shadow-md border border-gray-200 bg-white hover:shadow-lg cursor-default"
    >
      {/* Dégradé décoratif */}
      <div
        className={`absolute inset-0 opacity-10 bg-gradient-to-br ${gradient}`}
      />

      <div className="relative flex items-center gap-4 p-5">
        {/* Icône */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl text-white bg-gradient-to-br ${gradient} shadow-md`}
        >
          {icon}
        </div>

        {/* Données principales */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </h4>
          <div className="text-2xl font-extrabold text-gray-800 mt-1">
            {value}
          </div>

          {/* Description optionnelle */}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>

        {/* Tendance */}
        {trend && (
          <div className="flex flex-col items-end">
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(trendValue)}%
            </div>
            <span className="text-xs text-gray-400">{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

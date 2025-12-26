// ==========================================================
// 💎 KpiCard.jsx — Carte KPI (Statistique) réutilisable
// Pour Inventaire, Dashboard, Rapports, etc.
// Design harmonisé : border-black + halo gradient + hover smooth
// Version XL (plus grande & plus lisible)
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
  const numericTrend =
    trendValue === undefined || trendValue === null
      ? null
      : Number(trendValue);

  const hasTrend =
    !!trend && numericTrend !== null && !Number.isNaN(numericTrend);

  const isPositive = hasTrend ? numericTrend >= 0 : true;

  const trendDisplay = hasTrend
    ? Math.abs(numericTrend).toString().replace(/\.0+$/, "")
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, translateY: -3 }}
      transition={{ duration: 0.35 }}
      className="group relative overflow-hidden rounded-2xl border border-black bg-white/90 shadow-md hover:shadow-2xl cursor-default transition-all min-h-[140px]"
    >
      {/* Halo dégradé subtil */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
      />

      <div className="relative flex items-center gap-6 px-6 py-5">
        {/* Icône */}
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md border border-black/10`}
        >
          {icon}
        </div>

        {/* Bloc central : label + valeur + description */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </h4>
          <div className="mt-1 text-3xl sm:text-4xl leading-tight font-extrabold text-gray-900 truncate drop-shadow-sm">
            {value}
          </div>

          {description && (
            <p className="mt-1 text-xs text-gray-500 leading-snug line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Tendance (agrandie) */}
        {hasTrend && (
          <div className="flex flex-col items-end gap-1 text-right">
            <div
              className={`flex items-center gap-1.5 text-sm font-semibold ${
                isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{trendDisplay}%</span>
            </div>
            <span className="text-[11px] text-gray-400 max-w-[130px] leading-snug">
              {trend}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==========================================================
// 📈 StatCard.jsx — Carte Statistique Premium (LPD Manager)
// Version améliorée : bordure visible, halo coloré, animations fluides
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// === Utilitaires ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const cls = (...a) => a.filter(Boolean).join(" ");

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = "#472EAD",
  format = "number", // "number" | "fcfa" | "percent"
}) {
  const displayValue =
    format === "fcfa"
      ? formatFCFA(value)
      : format === "percent"
      ? `${value}%`
      : new Intl.NumberFormat("fr-FR").format(value);

  const isPositive = trend?.startsWith("+");
  const isNegative = trend?.startsWith("-");

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-white border border-black rounded-2xl p-5 shadow-md hover:shadow-xl transition-all overflow-hidden"
    >
      {/* Halo coloré subtil */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-10 transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}40, white)`,
        }}
      />

      {/* Contenu principal */}
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{displayValue}</h3>

          {trend && (
            <div
              className={cls(
                "flex items-center gap-1 mt-1 text-xs font-semibold",
                isPositive
                  ? "text-emerald-600"
                  : isNegative
                  ? "text-rose-600"
                  : "text-gray-400"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : isNegative ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : null}
              <span>{trend} ce mois</span>
            </div>
          )}
        </div>

        {/* Icône circulaire */}
        <div
          className="p-3 rounded-full shadow-inner flex items-center justify-center"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

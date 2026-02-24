// ==========================================================
// 💠 Card.jsx — Composant Statistique Ultra Premium (LPD Manager)
// ==========================================================

import React from "react";
import { motion } from "framer-motion";

// ==========================================================
// 🟣 VERSION PRINCIPALE — Dashboard
// ==========================================================
export default function Card({
  label,
  value,
  icon,
  trend,
  gradient = "from-[#472EAD] via-[#6B4CF5] to-[#F58020]",
}) {
  const isPositive = typeof trend === "string" && trend.startsWith("+");
  const isNegative = typeof trend === "string" && trend.startsWith("−");

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 0.3 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative overflow-hidden rounded-2xl border border-black shadow-md bg-white/70 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
    >
      {/* Halo lumineux */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 hover:opacity-20 transition-all duration-700`}
      />

      <div className="relative z-10 flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-gray-600 font-medium tracking-wide">
            {label}
          </p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
            {value}
          </h3>

          {trend && (
            <p
              className={`text-xs font-semibold mt-1 ${
                isPositive
                  ? "text-emerald-600"
                  : isNegative
                  ? "text-rose-600"
                  : "text-gray-400"
              }`}
            >
              {trend} ce mois
            </p>
          )}
        </div>

        <motion.div
          whileHover={{ rotate: 10, scale: 1.15 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 text-[#472EAD] shadow-inner border border-gray-200"
        >
          {icon}
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${gradient.replace(" ", ", ")})`,
        }}
      />
    </motion.div>
  );
}

// ==========================================================
// 🟠 VERSION COMPACTE — Inventaire / Rapports
// ==========================================================
export function CardCompact({
  title,
  value,
  icon,
  color = "#472EAD",
  trend,
}) {
  const isPositive = typeof trend === "string" && trend.startsWith("+");
  const isNegative = typeof trend === "string" && trend.startsWith("−");

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-white/90 border border-black rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-400 backdrop-blur-md"
    >
      <div
        className="absolute inset-0 opacity-0 hover:opacity-10 transition-all duration-700 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${color}33, white)`,
        }}
      />

      <div className="relative z-10">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {title}
        </p>
        <h4 className="text-xl font-bold text-gray-900">{value}</h4>

        {trend && (
          <p
            className={`text-xs font-semibold mt-0.5 ${
              isPositive
                ? "text-emerald-600"
                : isNegative
                ? "text-rose-600"
                : "text-gray-400"
            }`}
          >
            {trend}
          </p>
        )}
      </div>

      <div
        className="p-2.5 rounded-lg shadow-inner"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
    </motion.div>
  );
}

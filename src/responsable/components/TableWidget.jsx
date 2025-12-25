// ========================================================== 
// 📋 TableWidget.jsx — Tableau Réutilisable Premium (LPD Manager)
// Design harmonisé avec Card, ChartBox, Clients & Utilisateurs
// ==========================================================

import React from "react";
import { motion } from "framer-motion";

// ———————————————————————————————
// 💰 Format FCFA
// ———————————————————————————————
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function TableWidget({
  title = "Tableau de données",
  columns = [],
  data = [],
  color = "#472EAD",
  currencyColumns = [],
  onRowClick,
}) {
  const clickable = !!onRowClick;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] overflow-hidden backdrop-blur-sm hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)] transition-all"
    >
      {/* === HEADER === */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E4E0FF] bg-gradient-to-r from-[#F7F5FF] via-white to-[#FDFBFF]">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="text-sm sm:text-base font-semibold text-[#2F1F7A]">
            {title}
          </h2>
        </div>
        <span className="hidden sm:inline-flex text-[11px] text-gray-400 uppercase tracking-wide">
          Vue synthétique
        </span>
      </div>

      {/* === TABLE === */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left whitespace-nowrap border-b border-[#E4E0FF]"
                >
                  {col.label || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.035 }}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-gray-100 ${
                    clickable
                      ? "hover:bg-[#F9F9FF] cursor-pointer transition-colors"
                      : "hover:bg-[#FAFAFF]"
                  }`}
                >
                  {columns.map((col, j) => {
                    const key = col.key || col;
                    const val = row[key];

                    const displayValue = currencyColumns.includes(key)
                      ? formatFCFA(val)
                      : val;

                    return (
                      <td
                        key={j}
                        className={`px-4 py-3 align-middle ${
                          j === 0
                            ? "font-medium text-gray-800"
                            : "text-gray-600"
                        }`}
                      >
                        {displayValue ?? "—"}
                      </td>
                    );
                  })}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                >
                  Aucune donnée disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

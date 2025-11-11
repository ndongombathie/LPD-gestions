// ==========================================================
// 📋 TableWidget.jsx — Tableau Réutilisable Premium (LPD Manager)
// Design harmonisé avec StatCard & ChartBox
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
      className="bg-white border border-black rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all"
    >
      {/* === HEADER === */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-black bg-gradient-to-r from-[#F7F5FF] to-white">
        <h2 className="text-lg font-bold text-[#472EAD]">{title}</h2>
        <div
          className="w-3 h-3 rounded-full border border-black"
          style={{ backgroundColor: color }}
        ></div>
      </div>

      {/* === TABLE === */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left whitespace-nowrap border-b border-gray-200"
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
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-gray-100 ${
                    clickable
                      ? "hover:bg-[#F9F9FF] cursor-pointer transition-colors"
                      : ""
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
                        className={`px-4 py-3 ${
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
                  className="text-center text-gray-400 py-6"
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

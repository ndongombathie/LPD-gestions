// ==========================================================
// 🏆 TopProductsWidget.jsx — Interface Responsable (LPD Manager)
// Composant : Top 5 produits best-sellers
// Design harmonisé avec Card, ChartBox & TableWidget
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";

// 💰 Format FCFA cohérent
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function TopProductsWidget({ data = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm overflow-hidden hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)] transition-all"
    >
      {/* === HEADER === */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E4E0FF] bg-gradient-to-r from-[#F7F5FF] via-white to-[#FDFBFF]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFF4E5] border border-[#FFE0B8]">
            <Trophy className="w-4 h-4 text-[#F58020]" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#2F1F7A]">
              Top 5 produits best-sellers
            </h2>
            <p className="text-[11px] text-gray-400">
              Classement basé sur les ventes & revenus récents
            </p>
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-700 font-semibold">
          <TrendingUp className="w-3 h-3" />
          <span>Tendance positive</span>
        </div>
      </div>

      {/* === TABLE === */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3 text-left w-12 border-b border-[#E4E0FF]">
                #
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Produit
              </th>
              <th className="px-4 py-3 text-center border-b border-[#E4E0FF]">
                Ventes
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Revenus
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((p, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F7F5FF] border border-[#E4E0FF] text-[11px] font-semibold text-[#472EAD]">
                      #{p.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-center text-[#F58020] font-semibold">
                    {p.sales}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">
                    {formatFCFA(p.revenue)}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                >
                  Aucun produit enregistré pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

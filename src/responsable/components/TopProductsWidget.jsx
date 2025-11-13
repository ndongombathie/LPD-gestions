// ==========================================================
// 🏆 TopProductsWidget.jsx — Interface Responsable (LPD Manager)
// Composant : Top 5 produits best-sellers
// Design : clair, moderne, animé avec Framer Motion
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";

export default function TopProductsWidget({ data = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white/70 backdrop-blur-md border border-[#E5E7EB] rounded-2xl shadow-lg p-6"
    >
      {/* === En-tête === */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#F58020]" />
          Top 5 produits best-sellers
        </h2>
        <TrendingUp className="text-[#34D399]" size={18} />
      </div>

      {/* === Tableau des produits === */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-gray-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Produit</th>
              <th className="px-3 py-2 text-center">Ventes</th>
              <th className="px-3 py-2 text-right">Revenus</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((p, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#F9F9FF] hover:bg-[#F3F0FF] transition-all duration-200 rounded-lg"
                >
                  <td className="px-3 py-2 font-semibold text-[#472EAD]">#{p.rank}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-center text-[#F58020] font-semibold">{p.sales}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-700">
                    {p.revenue.toLocaleString("fr-FR")} FCFA
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-gray-400 py-4">
                  Aucun produit enregistré pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

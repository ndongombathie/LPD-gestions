// ==========================================================
// 🕒 TimelineActivity.jsx — Composant timeline pour JournalActivites
// Design élégant, réactif et animé (Framer Motion)
// ==========================================================

import React from "react";
import { motion } from "framer-motion";
import {
  User,
  ShoppingBag,
  Settings,
  LogIn,
  ClipboardList,
  Package,
  Edit3,
  Trash2,
  Wallet,
} from "lucide-react";

const icons = {
  connexion: <LogIn className="w-4 h-4 text-[#472EAD]" />,
  creation: <User className="w-4 h-4 text-[#10B981]" />,
  modification: <Edit3 className="w-4 h-4 text-[#F59E0B]" />,
  suppression: <Trash2 className="w-4 h-4 text-[#EF4444]" />,
  vente: <ShoppingBag className="w-4 h-4 text-[#472EAD]" />,
  encaissement: <Wallet className="w-4 h-4 text-[#34D399]" />,
  decaissement: <Wallet className="w-4 h-4 text-[#F58020]" />,
  inventaire: <ClipboardList className="w-4 h-4 text-[#7A5BF5]" />,
  ajustement: <Settings className="w-4 h-4 text-[#6B7280]" />,
  stock: <Package className="w-4 h-4 text-[#10B981]" />,
};

export default function TimelineActivity({ data = [] }) {
  if (!data.length)
    return (
      <div className="text-center text-gray-400 py-6 italic">
        Aucune activité récente à afficher.
      </div>
    );

  return (
    <div className="relative pl-6 border-l-2 border-[#E5E7EB] space-y-4">
      {data.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="relative"
        >
          {/* Point sur la ligne */}
          <span className="absolute -left-[9px] top-1.5 w-3 h-3 rounded-full bg-[#472EAD]/80 ring-4 ring-white"></span>

          {/* Carte activité */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {icons[item.type] || icons.connexion}
                <span className="font-semibold text-gray-800 text-sm capitalize">
                  {item.type}
                </span>
              </div>
              <span className="text-xs text-gray-400">{item.date}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            <div className="mt-2 text-xs text-gray-500 italic">
              — {item.acteur}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

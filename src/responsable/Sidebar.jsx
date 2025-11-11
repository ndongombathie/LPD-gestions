// ==========================================================
// 🧭 Sidebar.jsx — Interface Responsable (LPD Manager)
// Version Ultra Premium : design réactif + animations fluides
// - Icônes toujours visibles
// - Survol animé (scale + lueur)
// - Indicateur animé pour la page active
// ==========================================================

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Truck,
  ShoppingCart,
  BarChart2,
  ClipboardList,
  FileText,
  Clock,
  Banknote, // 💵 ajout pour Décaissements
} from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, path: "/responsable/dashboard" },
    { name: "Utilisateurs", icon: Users, path: "/responsable/utilisateurs" },
    { name: "Fournisseurs", icon: Truck, path: "/responsable/fournisseurs" },
    { name: "Clients spéciaux", icon: ClipboardList, path: "/responsable/clients-speciaux" },
    { name: "Commandes", icon: ShoppingCart, path: "/responsable/commandes" },
    { name: "Inventaire", icon: BarChart2, path: "/responsable/inventaire" },
    { name: "Rapports", icon: FileText, path: "/responsable/rapports" },
    { name: "Décaissements", icon: Banknote, path: "/responsable/decaissements" }, // 💵 nouvelle entrée
    { name: "Journal d’activités", icon: Clock, path: "/responsable/journal-activites" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex flex-col z-40">
      {/* === Logo LPD === */}
      <div className="h-20 flex flex-col items-center justify-center border-b border-gray-200 bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white shadow-md">
        <div className="flex flex-col items-center justify-center -mt-1">
          <div className="flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="60"
              height="38"
              viewBox="0 0 200 120"
              fill="none"
            >
              <ellipse cx="100" cy="60" rx="90" ry="45" fill="#472EAD" />
              <text
                x="50%"
                y="66%"
                textAnchor="middle"
                fill="#F58020"
                fontFamily="Arial Black, sans-serif"
                fontSize="60"
                fontWeight="900"
                dy=".1em"
              >
                LPD
              </text>
            </svg>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
            Librairie Papeterie Daradji
          </p>
        </div>
      </div>

      {/* === Menu principal === */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 scrollbar-thin scrollbar-thumb-[#472EAD]/30 scrollbar-track-transparent">
        <ul className="space-y-1 relative">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path} className="relative">
                {/* Indicateur animé à gauche */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 w-1 h-full rounded-r-full bg-[#F58020]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}

                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-4 py-2.5 rounded-md text-[15px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#472EAD] text-white shadow-md"
                        : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                    }`
                  }
                >
                  {/* Icône avec animation subtile */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex items-center justify-center"
                  >
                    <Icon
                      size={18}
                      className={`transition-colors duration-300 ${
                        isActive ? "text-white" : "text-[#472EAD]"
                      }`}
                    />
                  </motion.div>

                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? "text-white" : "text-[#472EAD]"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Effet de halo lumineux sur survol */}
                  <motion.div
                    className="absolute inset-0 rounded-md bg-[#472EAD]/5 opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* === Footer version info === */}
      <motion.div
        className="text-center text-xs text-gray-500 py-3 border-t border-gray-200 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        © 2025 <span className="text-[#472EAD] font-semibold">LPD Consulting</span>
        <br />
        <span className="text-[#F58020] font-semibold">v1.0.0</span>
      </motion.div>
    </aside>
  );
}

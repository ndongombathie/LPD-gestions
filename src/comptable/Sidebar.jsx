// ==========================================================
// 🧭 SidebarComptable.jsx — Interface Comptable (LPD Manager)
// Version Ultra Premium (identique responsable, adaptée comptable)
// ==========================================================

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  ShieldCheck,
  PackageSearch,
  ClipboardCheck,
  History,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SidebarComptable() {
  const location = useLocation();

  // 📌 MENU SPÉCIAL COMPTABLE
  const menuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, path: "/comptable/dashboard" },
    { name: "Finances", icon: DollarSign, path: "/comptable/finances" },
    { name: "Contrôle Vendeur", icon: Users, path: "/comptable/controle-vendeur" },
    { name: "Contrôle Caissier", icon: ShieldCheck, path: "/comptable/controle-caissier" },
    { name: "Contrôle Gestionnaire", icon: PackageSearch, path: "/comptable/controle-gestionnaire" },
    { name: "Inventaire", icon: ClipboardCheck, path: "/comptable/inventaire" },
    { name: "Inventaires Historiques", icon: History, path: "/comptable/inventaires-historiques" },
    { name: "Gestion utilisateurs", icon: Users, path: "/comptable/utilisateurs" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex flex-col z-40">

      {/* === Logo === */}
      {/* === Logo LPD + Titre exact comme l’image === */}
<div className="h-24 flex flex-col items-center justify-center border-b border-gray-200 
bg-gradient-to-r from-[#472EAD] to-[#5A3BE6] text-white shadow-md">

  {/* LPD */}
  <div className="text-4xl font-extrabold tracking-wide">
    <span className="text-[#F58020]">LPD</span>
  </div>

  {/* LIBRAIRIE PAPETERIE DARADJI */}
  <p className="text-[11px] mt-1 uppercase tracking-widest font-semibold text-white/90">
    LIBRAIRIE PAPETERIE DARADJI
  </p>
</div>


      {/* === MENU === */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 scrollbar-thin scrollbar-thumb-[#472EAD]/30 scrollbar-track-transparent">
        <ul className="space-y-1 relative">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path} className="relative">

                {/* Barre active animée */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicatorComptable"
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
                  {/* Icone animée */}
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

                  {/* Titre */}
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? "text-white" : "text-[#472EAD]"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Halo survol */}
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
    </aside>
  );
}

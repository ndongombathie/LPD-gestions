import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdLayers,
  MdPeople,
  MdAssessment,
} from "react-icons/md";
import { motion } from "framer-motion";

import Logo from "/lpd-logo.png";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    // ✅ DASHBOARD = /depot (route index)
    { name: "Tableau de bord", icon: MdDashboard, path: "/gestionnaire_depot" },
    { name: "Produits", icon: MdInventory, path: "/gestionnaire_depot/products" },
    { name: "Mouvements", icon: MdLayers, path: "/gestionnaire_depot/movementStock" },
    { name: "Fournisseurs", icon: MdPeople, path: "/gestionnaire_depot/suppliers" },
    { name: "Rapport stock", icon: MdAssessment, path: "/gestionnaire_depot/rapports" },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex-col z-40">

      {/* LOGO */}
      <div className="h-20 flex flex-col items-center justify-center border-b bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white shadow">
        <img
          src={Logo}
          alt="LPD"
          className="w-12 h-12 rounded-full shadow mb-1"
        />
        <p className="text-[11px] uppercase tracking-wider opacity-90">
          Gestionnaire Dépôt
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <ul className="space-y-1 relative">
          {menuItems.map((item) => {
            const isDashboard = item.path === "/depot";
            const isActive = isDashboard
              ? location.pathname === "/depot"
              : location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);

            const Icon = item.icon;

            return (
              <li key={item.path} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 w-1 h-full rounded-r-full bg-[#472EAD]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}

                <NavLink
                  to={item.path}
                  className={`relative flex items-center gap-3 px-4 py-2.5 rounded-md text-[14px] font-medium transition-all ${
                    isActive
                      ? "bg-[#472EAD] text-white shadow-md"
                      : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center"
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : "text-[#472EAD]"}
                    />
                  </motion.div>

                  <span className={isActive ? "text-white" : "text-[#472EAD]"}>
                    {item.name}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="text-center text-xs text-gray-400 py-4 border-t">
        © {new Date().getFullYear()} SSD CONSULTING
      </div>
    </aside>
  );
}

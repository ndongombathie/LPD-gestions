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
    { name: "Tableau de bord", icon: MdDashboard, path: "/gestionnaire_depot" },
    { name: "Produits", icon: MdInventory, path: "/gestionnaire_depot/products" },
    { name: "Mouvements", icon: MdLayers, path: "/gestionnaire_depot/movementStock" },
    { name: "Fournisseurs", icon: MdPeople, path: "/gestionnaire_depot/suppliers" },
    { name: "Rapport stock", icon: MdAssessment, path: "/gestionnaire_depot/rapports" },
  ];

  // Fonction pour déterminer si un élément est actif
  const isItemActive = (itemPath) => {
    // Pour le tableau de bord, vérifier si on est sur la route exacte
    if (itemPath === "/gestionnaire_depot") {
      return (
        location.pathname === "/gestionnaire_depot" ||
        location.pathname === "/gestionnaire_depot/" ||
        location.pathname === "/gestionnaire_depot/dashboard" || // Si vous avez une sous-route
        location.pathname === "/gestionnaire_depot/home" // Autres routes possibles
      );
    }
    
    // Pour les autres pages
    return (
      location.pathname === itemPath ||
      location.pathname.startsWith(itemPath + "/")
    );
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex-col z-40">

      {/* LOGO */}
      <div className="h-20 flex flex-col items-center justify-center border-b bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white shadow">
        <img
          src={Logo}
          alt="LPD"
          className="w-12 h-12 rounded-full shadow mb-1"
        />
        <p className="text-[11px] uppercase tracking-wider text-white">
          LIBRERIE PAPETERIE DARADJI
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <ul className="space-y-1 relative">
          {menuItems.map((item) => {
            const isActive = isItemActive(item.path);
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
                  end={item.path === "/gestionnaire_depot"} // 'end' pour que le tableau de bord soit exact
                  className={({ isActive: navLinkIsActive }) => {
                    // Utilisez navLinkIsActive directement
                    return `relative flex items-center gap-3 px-4 py-2.5 rounded-md text-[14px] font-medium transition-all ${
                      navLinkIsActive || isActive
                        ? "bg-[#472EAD] text-white shadow-md"
                        : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                    }`;
                  }}
                >
                  {({ isActive: navLinkIsActive }) => (
                    <>
                      {(navLinkIsActive || isActive) && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 w-1 h-full rounded-r-full bg-[#472EAD]"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center"
                      >
                        <Icon
                          size={18}
                          className={navLinkIsActive || isActive ? "text-white" : "text-[#472EAD]"}
                        />
                      </motion.div>
                      
                      <span className={navLinkIsActive || isActive ? "text-white" : "text-[#472EAD]"}>
                        {item.name}
                      </span>
                    </>
                  )}
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
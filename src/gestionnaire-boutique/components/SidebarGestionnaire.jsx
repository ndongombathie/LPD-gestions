// ==========================================================
// 🧭 SidebarGestionnaire.jsx — Version SANS Framer Motion
// ==========================================================

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  FileText,
} from "lucide-react";

export default function SidebarGestionnaire() {
  const location = useLocation();

  const menuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, path: "/gestionnaire-boutique/dashboard" },
    { name: "Produits", icon: Package, path: "/gestionnaire-boutique/produits" },
    { name: "Stock", icon: ClipboardList, path: "/gestionnaire-boutique/stock" },
    { name: "Alertes", icon: AlertTriangle, path: "/gestionnaire-boutique/alertes" },
    { name: "Rapports", icon: FileText, path: "/gestionnaire-boutique/rapports" },
    { name: "Historiques", icon: RefreshCw, path: "/gestionnaire-boutique/historique" },

  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex flex-col z-40">
      
      {/* === Logo Gestionnaire === */}
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
            Gestionnaire Boutique
          </p>
        </div>
      </div>

      {/* === Menu === */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 scrollbar-thin scrollbar-thumb-[#472EAD]/30 scrollbar-track-transparent">
        <ul className="space-y-1 relative">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path} className="relative">
                
                {/* Indicateur simple (sans animation) */}
                {isActive && (
                  <div className="absolute left-0 top-0 w-1 h-full rounded-r-full bg-[#F58020]" />
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
                  {/* Icône */}
                  <Icon
                    size={18}
                    className={`transition-colors duration-300 ${
                      isActive ? "text-white" : "text-[#472EAD]"
                    }`}
                  />

                  {/* Texte */}
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? "text-white" : "text-[#472EAD]"
                    }`}
                  >
                    {item.name}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* === Footer === */}
      <div className="text-center text-xs text-gray-500 py-3 border-t border-gray-200 bg-white">
        © 2025 <span className="text-[#472EAD] font-semibold">LPD Boutique</span>
        <br />
        <span className="text-[#F58020] font-semibold">v1.0.0</span>
      </div>
    </aside>
  );
}
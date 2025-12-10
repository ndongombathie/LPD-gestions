// ==========================================================
// 🧭 SidebarComptable.jsx — Interface Comptable (LPD Manager)
// Version Ultra Premium + Sous-menus Gestionnaire, Inventaire & Caissier
// ==========================================================

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  ShieldCheck,
  PackageSearch,
  ClipboardCheck,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SidebarComptable() {
  const location = useLocation();

  const [openGestionnaire, setOpenGestionnaire] = useState(false);
  const [openInventaire, setOpenInventaire] = useState(false);
  const [openCaissier, setOpenCaissier] = useState(false);

  const menuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, path: "/comptable/dashboard" },
    { name: "Finances", icon: DollarSign, path: "/comptable/finances" },
    { name: "Contrôle Vendeur", icon: Users, path: "/comptable/controle-vendeur" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex flex-col z-40">
      
      {/* LOGO */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-gray-200 
        bg-gradient-to-r from-[#472EAD] to-[#5A3BE6] text-white shadow-md">
        <div className="text-4xl font-extrabold">
          <span className="text-[#F58020]">LPD</span>
        </div>
        <p className="text-[11px] uppercase tracking-widest font-semibold">
          LIBRAIRIE PAPETERIE DARADJI
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <ul className="space-y-1 relative">

          {/* BOUTONS SIMPLES */}
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.path} className="relative">

                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-md text-[15px] font-medium transition-all ${
                      isActive
                        ? "bg-[#472EAD] text-white"
                        : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                    }`
                  }
                >
                  <Icon
                    size={18}
                    className="text-[#472EAD]"
                  />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}

          {/* --------------------------- */}
          {/* CONTRÔLE CAISSIER */}
          {/* --------------------------- */}
          <li>
            <button
              onClick={() => setOpenCaissier((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 rounded-md text-[15px] font-medium text-[#472EAD] hover:bg-[#F7F5FF]"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-[#472EAD]" />
                Contrôle Caissier
              </span>
              {openCaissier ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openCaissier && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10 mt-1 space-y-1">
                <SubLink label="Caisse (journalier / mensuel)" to="/comptable/controle-caissier/caisse" />
                <SubLink label="Enregistrer Versement" to="/comptable/controle-caissier/enregistrer-versement" />
                <SubLink label="Historique des Versements" to="/comptable/controle-caissier/historique-versements" />
              </motion.ul>
            )}
          </li>

          {/* --------------------------- */}
          {/* CONTRÔLE GESTIONNAIRE */}
          {/* --------------------------- */}
          <li>
            <button
              onClick={() => setOpenGestionnaire((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 rounded-md text-[15px] font-medium text-[#472EAD] hover:bg-[#F7F5FF]"
            >
              <span className="flex items-center gap-3">
                <PackageSearch size={18} className="text-[#472EAD]" />
                Contrôle Gestionnaire
              </span>
              {openGestionnaire ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openGestionnaire && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10 mt-1 space-y-1">
                <SubLink label="Dépôt" to="/comptable/controle-gestionnaire/depot" />
                <SubLink label="Boutique" to="/comptable/controle-gestionnaire/boutique" />
                <SubLink label="Responsable" to="/comptable/controle-gestionnaire/responsable" />
              </motion.ul>
            )}
          </li>

          {/* --------------------------- */}
          {/* INVENTAIRE */}
          {/* --------------------------- */}
          <li>
            <button
              onClick={() => setOpenInventaire((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 rounded-md text-[15px] font-medium text-[#472EAD] hover:bg-[#F7F5FF]"
            >
              <span className="flex items-center gap-3">
                <ClipboardCheck size={18} className="text-[#472EAD]" />
                Inventaire
              </span>
              {openInventaire ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openInventaire && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10 mt-1 space-y-1">
                <SubLink label="Inventaire Dépôt" to="/comptable/inventaire/depot" />
                <SubLink label="Inventaire Boutique" to="/comptable/inventaire/boutique" />
              </motion.ul>
            )}
          </li>

          {/* AUTRES */}
          <li>
            <NavLink
              to="/comptable/inventaires-historiques"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
            >
              <History size={18} className="text-[#472EAD]" />
              Inventaires Historiques
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/comptable/utilisateurs"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
            >
              <Users size={18} className="text-[#472EAD]" />
              Gestion utilisateurs
            </NavLink>
          </li>

        </ul>
      </nav>
    </aside>
  );
}

/* --------------------------
   Sous-lien réutilisable
-------------------------- */
function SubLink({ label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-1.5 rounded-md text-[14px] ${
          isActive
            ? "bg-[#472EAD] text-white"
            : "text-gray-600 hover:bg-[#EFEAFF] hover:text-[#472EAD]"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

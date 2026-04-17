// ==========================================================
// 🧭 SidebarComptable.jsx — VERSION RESPONSIVE + TOGGLE 🔥
// ==========================================================

import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  PackageSearch,
  ClipboardCheck,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const BLUE = "#472EAD";

export default function SidebarComptable() {
  const [openGestionnaire, setOpenGestionnaire] = useState(false);
  const [openInventaire, setOpenInventaire] = useState(false);
  const [openCaissier, setOpenCaissier] = useState(false);

  // 🔥 NOUVEAU
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* OVERLAY MOBILE */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen bg-white shadow-md flex flex-col z-50
          transition-all duration-300
          ${
            isMobile
              ? isSidebarOpen
                ? "translate-x-0 w-64"
                : "-translate-x-full w-64"
              : isSidebarOpen
              ? "w-64"
              : "w-20"
          }
        `}
      >
        {/* LOGO */}
        <div className="h-24 flex flex-col items-center justify-center relative
                        bg-gradient-to-r from-[#472EAD] to-[#5A3BE6]">
          
          {/* TOGGLE BUTTON */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-3 right-3 text-white text-lg"
          >
            ☰
          </button>

          <div className="text-4xl font-extrabold text-[#F58020] leading-none">
            LPD
          </div>

          {isSidebarOpen && (
            <p className="text-[11px] uppercase tracking-widest font-semibold text-white">
              LIBRAIRIE PAPETERIE DARADJI
            </p>
          )}
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto py-5 px-2">
          <ul className="space-y-1">

            <MainLink to="/comptable/dashboard" icon={LayoutDashboard} label="Tableau de bord" isSidebarOpen={isSidebarOpen} />
            <MainLink to="/comptable/controle-vendeur" icon={Users} label="Contrôle Vendeur" isSidebarOpen={isSidebarOpen} />

            {/* CONTRÔLE CAISSIER */}
            <li>
              <MenuButton
                label="Contrôle Caissier"
                icon={ShieldCheck}
                open={openCaissier}
                toggle={() => setOpenCaissier(v => !v)}
                isSidebarOpen={isSidebarOpen}
              />
              {openCaissier && isSidebarOpen && (
                <motion.ul className="ml-10 mt-1 space-y-1">
                  <SubLink to="/comptable/controle-caissier/caisse" label="Journal de caisse" />
                  <SubLink to="/comptable/controle-caissier/enregistrer-versement" label="Enregistrer versement" />
                  <SubLink to="/comptable/controle-caissier/historique-versements" label="Historique versements" />
                </motion.ul>
              )}
            </li>

            {/* CONTRÔLE GESTIONNAIRE */}
            <li>
              <MenuButton
                label="Contrôle Gestionnaire"
                icon={PackageSearch}
                open={openGestionnaire}
                toggle={() => setOpenGestionnaire(v => !v)}
                isSidebarOpen={isSidebarOpen}
              />
              {openGestionnaire && isSidebarOpen && (
                <motion.ul className="ml-10 mt-1 space-y-1">
                  <SubLink to="/comptable/controle-gestionnaire/depot" label="Dépôt" />
                  <SubLink to="/comptable/controle-gestionnaire/boutique" label="Boutique" />
                  <SubLink to="/comptable/controle-gestionnaire/responsable" label="Responsable" />
                </motion.ul>
              )}
            </li>

            {/* INVENTAIRE */}
            <li>
              <MenuButton
                label="Inventaire"
                icon={ClipboardCheck}
                open={openInventaire}
                toggle={() => setOpenInventaire(v => !v)}
                isSidebarOpen={isSidebarOpen}
              />
              {openInventaire && isSidebarOpen && (
                <motion.ul className="ml-10 mt-1 space-y-1">
                  <SubLink to="/comptable/inventaire/depot" label="Inventaire Dépôt" />
                  <SubLink to="/comptable/inventaire/boutique" label="Inventaire Boutique" />
                </motion.ul>
              )}
            </li>

            <MainLink to="/comptable/inventaire/historique" icon={History} label="Inventaires historiques" isSidebarOpen={isSidebarOpen} />
            <MainLink to="/comptable/utilisateurs" icon={Users} label="Gestion des utilisateurs" isSidebarOpen={isSidebarOpen} />

          </ul>
        </nav>
      </aside>
    </>
  );
}

/* ===================== COMPOSANTS ===================== */

function MainLink({ to, icon: Icon, label, isSidebarOpen }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center ${isSidebarOpen ? "gap-3 px-4" : "justify-center"} py-2.5 rounded-md text-[15px] font-medium transition
          ${isActive ? "bg-[#EFEAFF]" : "hover:bg-[#F7F5FF]"}`
        }
        style={({ isActive }) => ({
          color: "#472EAD",
          fontWeight: isActive ? "600" : "500",
        })}
      >
        <Icon size={18} color="#472EAD" />
        {isSidebarOpen && <span>{label}</span>}
      </NavLink>
    </li>
  );
}

function MenuButton({ label, icon: Icon, open, toggle, isSidebarOpen }) {
  return (
    <button
      onClick={toggle}
      className={`flex w-full items-center ${isSidebarOpen ? "justify-between px-4" : "justify-center"} py-2.5 rounded-md
                 text-[15px] font-medium hover:bg-[#F7F5FF]`}
      style={{ color: "#472EAD" }}
    >
      <span className={`flex items-center ${isSidebarOpen ? "gap-3" : "justify-center w-full"}`}>
        <Icon size={18} color="#472EAD" />
        {isSidebarOpen && <span>{label}</span>}
      </span>

      {isSidebarOpen &&
        (open ? <ChevronDown size={16} color="#472EAD" /> : <ChevronRight size={16} color="#472EAD" />)}
    </button>
  );
}

function SubLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-1.5 rounded-md text-sm transition
         ${isActive ? "bg-[#EFEAFF]" : "hover:bg-[#F7F5FF]"}`
      }
      style={{ color: "#472EAD" }}
    >
      {label}
    </NavLink>
  );
}
// ==========================================================
// 🧭 SidebarComptable.jsx — VERSION STABLE AVEC UTILISATEURS
// ==========================================================

import React, { useState } from "react";
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

export default function SidebarComptable() {
  const [openGestionnaire, setOpenGestionnaire] = useState(false);
  const [openInventaire, setOpenInventaire] = useState(false);
  const [openCaissier, setOpenCaissier] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-md flex flex-col z-40">

      {/* LOGO */}
      <div className="h-24 flex flex-col items-center justify-center border-b
                      bg-gradient-to-r from-[#472EAD] to-[#5A3BE6]">
        <div className="text-4xl font-extrabold text-[#F58020]">LPD</div>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-white">
          LIBRAIRIE PAPETERIE DARADJI
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <ul className="space-y-1">

          {/* TABLEAU DE BORD */}
          <MainLink
            to="/comptable/dashboard"
            icon={LayoutDashboard}
            label="Tableau de bord"
          />

          {/* CONTRÔLE VENDEUR */}
          <MainLink
            to="/comptable/controle-vendeur"
            icon={Users}
            label="Contrôle Vendeur"
          />

          {/* CONTRÔLE CAISSIER */}
          <li>
            <MenuButton
              label="Contrôle Caissier"
              icon={ShieldCheck}
              open={openCaissier}
              toggle={() => setOpenCaissier(v => !v)}
            />

            {openCaissier && (
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
            />

            {openGestionnaire && (
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
            />

            {openInventaire && (
              <motion.ul className="ml-10 mt-1 space-y-1">
                <SubLink to="/comptable/inventaire/depot" label="Inventaire Dépôt" />
                <SubLink to="/comptable/inventaire/boutique" label="Inventaire Boutique" />
              </motion.ul>
            )}
          </li>

          {/* HISTORIQUE INVENTAIRES */}
          <MainLink
            to="/comptable/inventaire/historique"
            icon={History}
            label="Inventaires historiques"
          />

          {/* ✅ GESTION DES UTILISATEURS (AJOUTÉ) */}
          <MainLink
            to="/comptable/utilisateurs"
            icon={Users}
            label="Gestion des utilisateurs"
          />

        </ul>
      </nav>
    </aside>
  );
}

/* ===== COMPOSANTS ===== */

function MainLink({ to, icon: Icon, label }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-md text-[15px] font-medium transition ${
            isActive
              ? "bg-[#472EAD] text-white"
              : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
          }`
        }
      >
        <Icon size={18} />
        {label}
      </NavLink>
    </li>
  );
}

function MenuButton({ label, icon: Icon, open, toggle }) {
  return (
    <button
      onClick={toggle}
      className="flex w-full items-center justify-between px-4 py-2.5 rounded-md
                 text-[15px] font-medium text-[#472EAD] hover:bg-[#F7F5FF]"
    >
      <span className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </span>
      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

function SubLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-1.5 rounded-md text-sm ${
          isActive
            ? "bg-[#472EAD] text-white"
            : "text-gray-600 hover:bg-[#EFEAFF]"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

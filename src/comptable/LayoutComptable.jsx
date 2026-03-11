// ==========================================================
// 🧭 LayoutComptable.jsx — Interface Comptable (LPD Manager)
// Version corrigée (plus aucun espace entre header et dashboard)
// ==========================================================

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutComptable() {
  return (
    <div className="flex h-screen bg-lpd-light text-lpd-text overflow-hidden">

      {/* === Barre latérale fixe === */}
      <Sidebar />

      {/* === Contenu principal === */}
      <div className="flex flex-col flex-1 ml-64 relative z-10">

        {/* === Header === */}
        <Header />

        {/* === Contenu principal - full width, marges réduites === */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light px-2 sm:px-4 md:px-6 pt-0 pb-0 w-full">
          <div className="w-full">
            <Outlet />
          </div>
        </main>


        {/* === Pied de page === */}
        <footer className="bg-white border-t border-lpd-border shadow-inner text-sm text-gray-500 text-center py-4">
          <span className="block">
            © {new Date().getFullYear()}{" "}
            <strong className="text-lpd-header font-semibold">SSD Consulting</strong> —
            Interface Comptable <span className="text-lpd-accent font-semibold">v1.0.0</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

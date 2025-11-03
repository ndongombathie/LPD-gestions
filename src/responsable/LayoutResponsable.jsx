// ==========================================================
// 🧭 LayoutResponsable.jsx
// Structure principale — Interface Responsable (LPD Manager)
// Design pro, fluide et cohérent (Header + Sidebar + Contenu)
// ==========================================================

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutResponsable() {
  return (
    <div className="flex h-screen bg-lpd-light text-lpd-text overflow-hidden">
      {/* === Barre latérale fixe === */}
      <Sidebar />

      {/* === Contenu principal === */}
      <div className="flex flex-col flex-1 ml-64 relative z-10">
        {/* === Header === */}
        <Header />

        {/* === Contenu principal (scrollable) === */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light px-8 py-6 transition-all duration-300 ease-in-out">
          <div className="max-w-7xl mx-auto fade-in">
            <Outlet />
          </div>
        </main>

        {/* === Pied de page === */}
        <footer className="bg-white border-t border-lpd-border shadow-inner text-sm text-gray-500 text-center py-4">
          <span className="block">
            © {new Date().getFullYear()}{" "}
            <strong className="text-lpd-header font-semibold">LPD Consulting</strong> —
            Interface Responsable <span className="text-lpd-accent font-semibold">v1.0.0</span>
          </span>
        </footer>
      </div>
    </div>
  );
}

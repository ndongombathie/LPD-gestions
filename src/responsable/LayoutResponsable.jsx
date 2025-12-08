// LayoutResponsable.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutResponsable() {
  return (
    <div className="flex min-h-screen bg-lpd-light text-lpd-text">
      {/* === Sidebar === */}
      {/* À l’intérieur de Sidebar, idéalement : hidden sur mobile, visible à partir de md */}
      <Sidebar />

      {/* === Contenu principal === */}
      <div className="flex flex-col flex-1 md:ml-64 relative z-10">
        {/* Header */}
        <Header />

        {/* Contenu principal (scrollable) */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light px-4 sm:px-6 lg:px-8 py-4 sm:py-6 transition-all duration-300 ease-in-out">
          <div className="max-w-7xl mx-auto fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-4 sm:mt-6 border-t border-lpd-border/80 bg-white/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lpd-accent" />
              <span>
                © {new Date().getFullYear()}{" "}
                <span className="font-semibold text-lpd-header">
                  SSD Consulting
                </span>
                {" · "}
                <span className="text-gray-400">Tous droits réservés.</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs">
              <span className="hidden sm:inline-block h-3 w-px bg-gray-200" />
              <span className="text-gray-400">LPD Manager</span>
              <span className="text-gray-300">•</span>
              <span>Interface Responsable</span>
              <span className="text-gray-300">•</span>
              <span className="font-semibold text-lpd-accent">v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

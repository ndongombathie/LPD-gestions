// LayoutResponsable.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutResponsable() {
  return (
    <div className="flex bg-lpd-light text-lpd-text min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 md:ml-64 relative z-10">
        {/* Header (tu gardes ta logique actuelle dedans) */}
        <Header />

        {/* Contenu principal - full width, marges réduites */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light px-2 sm:px-4 md:px-6 py-3 sm:py-5 pb-20 transition-all duration-300 ease-in-out w-full">
          <div className="w-full max-w-[1600px] mx-auto fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer FIXE en bas de l'écran */}
        <footer
          className="
            fixed 
            bottom-0 
            left-0 
            right-0 
            md:left-64   /* pour laisser la place au sidebar en desktop */
            border-t border-lpd-border/80 
            bg-white/90 backdrop-blur-sm 
            z-30
          "
        >
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

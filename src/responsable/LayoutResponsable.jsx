// ==========================================================
// LayoutResponsable.jsx — Scroll garanti
// ==========================================================

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutResponsable() {
  return (
    <div className="h-screen flex bg-lpd-light text-lpd-text overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Header */}
        <Header />

        {/* Zone scrollable */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light">
          <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
            <Outlet />
          </div>
        </div>

        {/* Footer FIXE */}
        <footer
          className="
            fixed
            bottom-0
            left-0
            right-0
            md:left-64
            border-t border-lpd-border/80
            bg-white/95
            backdrop-blur-sm
            z-20
          "
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between text-xs text-gray-500">
            <span>
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-lpd-header">
                SSD Consulting
              </span>
            </span>
            <span className="text-lpd-accent font-semibold">
              LPD Manager v1.0.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
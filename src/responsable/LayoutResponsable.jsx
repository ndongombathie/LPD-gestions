// ==========================================================
// LayoutResponsable.jsx — Scroll garanti
// ==========================================================

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutResponsable() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="h-screen flex bg-lpd-light text-lpd-text overflow-hidden relative">
      {/* Overlay pour mobile quand sidebar est ouverte */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - toujours en fixed */}
      <div className={`
        fixed
        h-full z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Contenu principal - avec padding-left au lieu de margin-left */}
      <div className={`
        flex flex-col flex-1
        transition-all duration-300
        w-full
        ${sidebarOpen && !isMobile ? 'md:pl-64' : 'pl-0'}
      `}>
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />

        {/* Zone scrollable - contenu principal en full width */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light">
          <div className="w-full px-4 py-6 pb-28">
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
            border-t border-lpd-border/80
            bg-white/95
            backdrop-blur-sm
            z-20
            transition-all duration-300
          "
          style={{
            left: sidebarOpen && !isMobile ? '16rem' : '0' // 16rem = 64 (w-64)
          }}
        >
          <div className="w-full px-4 py-3 flex justify-between text-xs text-gray-500">
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
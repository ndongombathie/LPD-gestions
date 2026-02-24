import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SidebarGestionnaire from "./SidebarGestionnaire"; // ✅ Nom correct

export default function LayoutGestionnaire({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <SidebarGestionnaire />

      {/* Contenu */}
      <div className="flex flex-col flex-1 ml-64">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {children ?? <Outlet />}
          </div>
        </main>
        
        <footer className="bg-white border-t border-gray-200 shadow-inner text-sm text-gray-500 text-center py-4">
          © {new Date().getFullYear()} <strong className="text-[#472EAD] font-semibold">SSD Consulting</strong> — Interface Gestionnaire <span className="text-[#F58020] font-semibold">v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
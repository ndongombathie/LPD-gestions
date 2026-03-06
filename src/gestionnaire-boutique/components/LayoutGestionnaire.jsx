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
      <div className="flex flex-col flex-1 min-h-0 ml-64">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-2 sm:px-4 md:px-6 py-4 sm:py-5 pb-20 w-full">
          <div className="w-full max-w-[1600px] mx-auto">
            {children ?? <Outlet />}
          </div>
        </main>
        
        <footer className="flex-shrink-0 fixed bottom-0 left-64 right-0 z-20 bg-white border-t border-gray-200 shadow-inner text-sm text-gray-500 text-center py-4">
          © {new Date().getFullYear()} <strong className="text-[#472EAD] font-semibold">SSD Consulting</strong> — Interface Gestionnaire <span className="text-[#F58020] font-semibold">v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
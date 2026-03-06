// src/gestionnaire-depot/layout/DepotLayout.jsx

import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

export default function DepotLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar Fixe */}
      <aside className="w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Header Fixe */}
        <Header />

        {/* Contenu dynamique - full width, marges réduites */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-4 w-full">
          <div className="w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

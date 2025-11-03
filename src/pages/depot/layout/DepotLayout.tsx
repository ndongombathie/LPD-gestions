import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom'; // ← AJOUT IMPORT

const DepotLayout: React.FC = () => { // ← SUPPRIMEZ l'interface
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F3FAF6]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-[#111827] hover:bg-[#F3FAF6] transition-colors"
              >
                ☰
              </button>
              
              {/* Logo LPD Manager à côté du bouton */}
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-[#472EAD]">LPD</h1>
                  <p className="text-xs text-[#F58020] font-semibold -mt-1">
                    LPD Manager
                  </p>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  Gestionnaire de Dépôt
                </h2>
              </div>
            </div>
            
            {/* Menu utilisateur avec dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#F3FAF6] transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-[#111827]">Modou Ndiaye</p>
                  <p className="text-xs text-[#111827] opacity-70">Gestionnaire Depôt</p>
                </div>
                <div className="w-10 h-10 bg-[#472EAD] rounded-full flex items-center justify-center text-white font-semibold">
                  MN
                </div>
              </button>

              {/* Menu déroulant */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-[#111827]">Modou Ndiaye</p>
                    <p className="text-xs text-[#111827] opacity-70">Gestionnaire Depôt</p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-[#111827] hover:bg-[#F3FAF6] transition-colors">
                    👤 Mon profil
                  </button>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    🚪 Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content - REMPLACEZ children par Outlet */}
        <main className="flex-1 overflow-auto">
          <Outlet /> {/* ← REMPLACÉ */}
        </main>
      </div>

      {/* Overlay pour fermer le menu en cliquant ailleurs */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default DepotLayout;
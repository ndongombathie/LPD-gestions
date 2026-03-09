// src/gestionnaire-depot/layout/DepotLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./footer";
import { Outlet } from "react-router-dom";
import { Toaster } from 'react-hot-toast'; // IMPORTANT : ajouter cet import

export default function DepotLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Toaster - notifications globales */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Durée par défaut
          duration: 4000,
          // Styles par défaut
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 9999,
          },
          // Styles personnalisés pour les succès
          success: {
            duration: 3000,
            icon: '✅',
            style: {
              border: '1px solid #10b981',
              background: '#f0fdf4',
              color: '#166534',
            },
          },
          // Styles personnalisés pour les erreurs
          error: {
            duration: 4000,
            icon: '❌',
            style: {
              border: '1px solid #ef4444',
              background: '#fef2f2',
              color: '#991b1b',
            },
          },
          // Styles pour les messages de chargement
          loading: {
            icon: '⏳',
            style: {
              border: '1px solid #f59e0b',
              background: '#fffbeb',
              color: '#92400e',
            },
          },
        }}
      />

      {/* Sidebar Fixe */}
      <aside className="w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Contenu principal avec header, contenu scrollable et footer fixe */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header Fixe */}
        <Header />

        {/* Contenu scrollable - prend tout l'espace disponible et défile */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>

        {/* Footer fixe en bas */}
        <Footer />
      </div>
    </div>
  );
}
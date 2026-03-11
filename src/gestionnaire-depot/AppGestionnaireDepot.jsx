import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DepotRoutes from "./DepotRoutes";
import { Toaster } from 'react-hot-toast'; // Import du Toaster

export default function AppGestionnaireDepot() {
  return (
    <BrowserRouter>
      {/* Toaster doit être placé ici, en dehors des Routes pour être accessible partout */}
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
          // Styles pour les messages d'info
          info: {
            icon: 'ℹ️',
            style: {
              border: '1px solid #3b82f6',
              background: '#eff6ff',
              color: '#1e40af',
            },
          },
        }}
      />
      
      <Routes>
        {/* Redirection vers /depot */}
        {/* <Route path="/" element={<Navigate to="/depot" replace />} /> */}

        {/* Module gestionnaire de dépôt */}
        <Route path="/gestionnaire_depot/*" element={<DepotRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
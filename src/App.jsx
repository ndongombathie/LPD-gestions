// ==========================================================
// ⚙️ App.jsx — Interface Comptable LPD
// ==========================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ✅ Layout Comptable
import LayoutComptable from "./comptable/LayoutComptable.jsx";

// ✅ Pages Comptable
import DashboardComptable from "./comptable/pages/Dashboard.jsx";
import UtilisateursComptable from "./comptable/pages/Utilisateurs.jsx";
import FournisseursComptable from "./comptable/pages/Fournisseurs.jsx";
import CommandesComptable from "./comptable/pages/Commandes.jsx";
import InventaireComptable from "./comptable/pages/Inventaire.jsx";
import RapportsComptable from "./comptable/pages/Rapports.jsx";
import JournalActivitesComptable from "./comptable/pages/JournalActivites.jsx";
import ClientsSpeciauxComptable from "./comptable/pages/ClientsSpeciaux.jsx";
import VentesJournalieres from "./comptable/pages/VentesJournalieres.jsx"; // ⚠️ assure-toi que ce fichier existe !

// ✅ Page Auth
import Connexion from "./authentification/login/Connexion.jsx";

// ==========================================================
// 🔐 Middleware — Protection de route
// ==========================================================
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// ==========================================================
// 🚀 APP PRINCIPALE — Comptable
// ==========================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* === Connexion === */}
        <Route path="/login" element={<Connexion />} />

        {/* === Routes protégées Comptable === */}
        <Route
          path="/comptable"
          element={
            <PrivateRoute>
              <LayoutComptable />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardComptable />} />
          <Route path="dashboard" element={<DashboardComptable />} />
          <Route path="utilisateurs" element={<UtilisateursComptable />} />
          <Route path="fournisseurs" element={<FournisseursComptable />} />
          <Route path="clients-speciaux" element={<ClientsSpeciauxComptable />} />
          <Route path="commandes" element={<CommandesComptable />} />
          <Route path="inventaire" element={<InventaireComptable />} />
          <Route path="rapports" element={<RapportsComptable />} />
          <Route path="journal-activites" element={<JournalActivitesComptable />} />
          <Route path="ventes-journalieres" element={<VentesJournalieres />} />

          {/* Fallback interne Comptable */}
          <Route path="*" element={<Navigate to="/comptable/dashboard" replace />} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

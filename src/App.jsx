// ==========================================================
// ⚙️ App.jsx — Interface Responsable LPD
// ==========================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ✅ Layout
import LayoutResponsable from "./responsable/LayoutResponsable.jsx";

// ✅ Pages principales
import Dashboard from "./responsable/pages/Dashboard.jsx";
import Utilisateurs from "./responsable/pages/Utilisateurs.jsx";
import Fournisseurs from "./responsable/pages/Fournisseurs.jsx";
import Commandes from "./responsable/pages/Commandes.jsx";
import Inventaire from "./responsable/pages/Inventaire.jsx";
import Rapports from "./responsable/pages/Rapports.jsx";
import JournalActivites from "./responsable/pages/JournalActivites.jsx";
import ClientsSpeciaux from "./responsable/pages/ClientsSpeciaux.jsx";
import Decaissements from "./responsable/pages/Decaissements.jsx";

// ✅ Page Authentification
import Connexion from "./authentification/login/Connexion.jsx";

// ✅ Middleware — protection de route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route de connexion */}
        <Route path="/login" element={<Connexion />} />

        {/* Routes protégées du Responsable */}
        <Route
          path="/responsable"
          element={
            <PrivateRoute>
              <LayoutResponsable />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="fournisseurs" element={<Fournisseurs />} />
          <Route path="clients-speciaux" element={<ClientsSpeciaux />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="inventaire" element={<Inventaire />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="decaissements" element={<Decaissements />} />
          <Route path="journal-activites" element={<JournalActivites />} />

          {/* Fallback interne */}
          <Route path="*" element={<Navigate to="/responsable/dashboard" replace />} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

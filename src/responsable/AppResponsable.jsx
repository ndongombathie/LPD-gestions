// ==========================================================
// ⚙️ AppResponsable.jsx — Interface Responsable LPD
// ==========================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout
import LayoutResponsable from "./LayoutResponsable.jsx";

// Pages principales
import Dashboard from "./pages/Dashboard.jsx";
import Utilisateurs from "./pages/Utilisateurs.jsx";
import Fournisseurs from "./pages/Fournisseurs.jsx";
import Commandes from "./pages/Commandes.jsx";
import Inventaire from "./pages/Inventaire.jsx";
import Rapports from "./pages/Rapports.jsx";
import JournalActivites from "./pages/JournalActivites.jsx";
import ClientsSpeciaux from "./pages/ClientsSpeciaux.jsx";
import Decaissements from "./pages/Decaissements.jsx";

// Auth
import Connexion from "../authentification/login/Connexion.jsx";

// Protection de routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export default function AppResponsable() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Connexion />} />

        {/* Zone Responsable */}
        <Route
          path="/responsable"
          element={
            <PrivateRoute>
              <LayoutResponsable />
            </PrivateRoute>
          }
        >
          {/* Pages principales */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="fournisseurs" element={<Fournisseurs />} />
          <Route path="clients-speciaux" element={<ClientsSpeciaux />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="inventaire" element={<Inventaire />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="decaissements" element={<Decaissements />} />

          {/* Journal = HUB des rôles */}
          <Route path="journal-activites" element={<JournalActivites />} />

          {/* Fallback interne */}
          <Route path="*" element={<Navigate to="/responsable/dashboard" replace />} />
        </Route>

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

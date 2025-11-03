// ==========================================================
// ⚙️ App.jsx — Interface Responsable LPD
// ==========================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ✅ Layout
import LayoutResponsable from "./responsable/LayoutResponsable.jsx";

// ✅ Pages
import Dashboard from "./responsable/pages/Dashboard.jsx";
import Utilisateurs from "./responsable/pages/Utilisateurs.jsx";
import Fournisseurs from "./responsable/pages/Fournisseurs.jsx";
import Commandes from "./responsable/pages/Commandes.jsx";
import Inventaire from "./responsable/pages/Inventaire.jsx";
import Rapports from "./responsable/pages/Rapports.jsx";
import JournalActivites from "./responsable/pages/JournalActivites.jsx";
import ClientsSpeciaux from "./responsable/pages/ClientsSpeciaux.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection par défaut vers le Dashboard */}
        <Route path="/" element={<Navigate to="/responsable/dashboard" replace />} />

        {/* Layout principal du Responsable */}
        <Route path="/responsable" element={<LayoutResponsable />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="fournisseurs" element={<Fournisseurs />} />
          <Route path="clients-speciaux" element={<ClientsSpeciaux />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="inventaire" element={<Inventaire />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="journal-activites" element={<JournalActivites />} />

          {/* Fallback interne */}
          <Route path="*" element={<Navigate to="/responsable/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

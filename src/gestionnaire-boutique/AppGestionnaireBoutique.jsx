
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LayoutGestionnaire from "./components/LayoutGestionnaire";

// Pages du gestionnaire
import Dashboard from "./pages/Dashboard";
import Produits from "./pages/Produits";
import Stock from "./pages/Stock";
import Historique from "./pages/Historique";
import Alertes from "./pages/Alertes";
import Rapports from "./pages/Rapports";  

export default function AppGestionnaireBoutique() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gestionnaire" element={<LayoutGestionnaire />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="produits" element={<Produits />} />
          <Route path="stock" element={<Stock />} />
          <Route path="historique" element={<Historique />} />
          {/* Compat: ancien chemin transferts redirige vers historique */}
          <Route path="transferts" element={<Historique />} />
          <Route path="alertes" element={<Alertes />} />
          <Route path="rapports" element={<Rapports />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/gestionnaire/dashboard" />} />
        </Route>

        {/* Redirect root → dashboard */}
        <Route path="/" element={<Navigate to="/gestionnaire/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LayoutGestionnaire from "./gestionnaire-boutique/components/LayoutGestionnaire";

// Pages du gestionnaire
import Dashboard from "./gestionnaire-boutique/pages/Dashboard";
import Produits from "./gestionnaire-boutique/pages/Produits";
import Stock from "./gestionnaire-boutique/pages/Stock";
import Transferts from "./gestionnaire-boutique/pages/Transferts";
import Alertes from "./gestionnaire-boutique/pages/Alertes";
import Rapports from "./gestionnaire-boutique/pages/Rapports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gestionnaire" element={<LayoutGestionnaire />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="produits" element={<Produits />} />
          <Route path="stock" element={<Stock />} />
          <Route path="transferts" element={<Transferts />} />
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

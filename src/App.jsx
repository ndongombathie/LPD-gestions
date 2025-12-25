
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LayoutGestionnaire from "./gestionnaire-boutique/components/LayoutGestionnaire";

// Pages du gestionnaire
import Dashboard from "./gestionnaire-boutique/pages/Dashboard";
import Produits from "./gestionnaire-boutique/pages/Produits";
import Stock from "./gestionnaire-boutique/pages/Stock";
import Historique from "./gestionnaire-boutique/pages/Historique";
import Alertes from "./gestionnaire-boutique/pages/Alertes";
import Rapports from "./gestionnaire-boutique/pages/Rapports";
import AppGestionnaireBoutique from "./gestionnaire-boutique/AppGestionnaireBoutique";

export default function App() {
  return (
    <>
      <AppGestionnaireBoutique />
    </>
  );
}

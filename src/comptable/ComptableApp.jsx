// ==========================================================
// ⚙️ ComptableApp.jsx — Interface Comptable LPD (SECURE)
// ==========================================================

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ================= LAYOUT =================
import LayoutComptable from "./LayoutComptable.jsx";

// ================= PAGES =================
import DashboardComptable from "./pages/Dashboard.jsx";
import UtilisateursComptable from "./pages/Utilisateurs.jsx";

// ================= CONTRÔLE CAISSIER =================
import JournalCaisse from "./pages/controle-caissier/JournalCaisse.jsx";
import EnregistrerVersement from "./pages/controle-caissier/EnregistrerVersement.jsx";
import HistoriqueVersements from "./pages/controle-caissier/HistoriqueVersements.jsx";

// ================= CONTRÔLE GESTIONNAIRE =================
import GestionnaireBoutique from "./pages/controle-gestionnaire/Boutique.jsx";
import GestionnaireDepot from "./pages/controle-gestionnaire/Depot.jsx";
import Responsable from "./pages/controle-gestionnaire/Responsable.jsx";

// ================= INVENTAIRES =================
import InventaireDepot from "./pages/inventaire/InventaireDepot.jsx";
import InventaireBoutique from "./pages/inventaire/InventaireBoutique.jsx";
import HistoriqueInventaire from "./pages/inventaire/HistoriqueInventaire.jsx";

// ================= VENTES =================
import VentesControle from "./pages/VentesControle.jsx";

// ================= AUTH =================
import Connexion from "../authentification/login/Connexion.jsx";


// ==========================================================
// 🔐 ROUTE PROTECTION ROBUSTE
// ==========================================================
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// ==========================================================
// 🚀 APP COMPTABLE
// ==========================================================
export default function ComptableApp() {
  return (
    <Routes>

      {/* ================= LOGIN ================= */}
      <Route path="/login" element={<Connexion />} />

      {/* ================= ZONE COMPTABLE PROTÉGÉE ================= */}
      <Route
        path="/comptable/*"
        element={
          <PrivateRoute>
            <LayoutComptable />
          </PrivateRoute>
        }
      >
        {/* Redirection interne sécurisée */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<DashboardComptable />} />
        <Route path="utilisateurs" element={<UtilisateursComptable />} />

        {/* ===== Contrôle caissier ===== */}
        <Route path="controle-caissier/caisse" element={<JournalCaisse />} />
        <Route
          path="controle-caissier/enregistrer-versement"
          element={<EnregistrerVersement />}
        />
        <Route
          path="controle-caissier/historique-versements"
          element={<HistoriqueVersements />}
        />

        {/* ===== Contrôle gestionnaire ===== */}
        <Route
          path="controle-gestionnaire/boutique"
          element={<GestionnaireBoutique />}
        />
        <Route
          path="controle-gestionnaire/depot"
          element={<GestionnaireDepot />}
        />
        <Route
          path="controle-gestionnaire/responsable"
          element={<Responsable />}
        />

        {/* ===== Inventaires ===== */}
        <Route path="inventaire/depot" element={<InventaireDepot />} />
        <Route path="inventaire/boutique" element={<InventaireBoutique />} />
        <Route
          path="inventaire/historique"
          element={<HistoriqueInventaire />}
        />

        {/* ===== Ventes ===== */}
        <Route path="controle-vendeur" element={<VentesControle />} />

        {/* Fallback interne */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Fallback global */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

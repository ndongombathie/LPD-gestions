// ==========================================================
// ⚙️ App.jsx — Interface Comptable LPD (VERSION FINALE STABLE)
// ==========================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout
import LayoutComptable from "./comptable/LayoutComptable.jsx";

// Pages principales
import DashboardComptable from "./comptable/pages/Dashboard.jsx";
import UtilisateursComptable from "./comptable/pages/Utilisateurs.jsx";
import FournisseursComptable from "./comptable/pages/Fournisseurs.jsx";
import CommandesComptable from "./comptable/pages/Commandes.jsx";
import InventaireComptable from "./comptable/pages/Inventaire.jsx";
import RapportsComptable from "./comptable/pages/Rapports.jsx";
import JournalActivitesComptable from "./comptable/pages/JournalActivites.jsx";
import ClientsSpeciauxComptable from "./comptable/pages/ClientsSpeciaux.jsx";

// Contrôle caissier
import JournalCaisse from "./comptable/pages/controle-caissier/JournalCaisse.jsx";
import EnregistrerVersement from "./comptable/pages/controle-caissier/EnregistrerVersement.jsx";
import HistoriqueVersements from "./comptable/pages/controle-caissier/HistoriqueVersements.jsx";

// Contrôle gestionnaire
import GestionnaireBoutique from "./comptable/pages/controle-gestionnaire/Boutique.jsx";
import GestionnaireDepot from "./comptable/pages/controle-gestionnaire/Depot.jsx";
import Responsable from "./comptable/pages/controle-gestionnaire/Responsable.jsx";

// Inventaires
import InventaireDepot from "./comptable/pages/inventaire/InventaireDepot.jsx";
import InventaireBoutique from "./comptable/pages/inventaire/InventaireBoutique.jsx";
import HistoriqueInventaire from "./comptable/pages/inventaire/HistoriqueInventaire.jsx";

// Ventes
import VentesControle from "./comptable/pages/VentesControle.jsx";

// Auth
import Connexion from "./authentification/login/Connexion.jsx";

// ==========================================================
// 🔐 Protection des routes
// ==========================================================
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// ==========================================================
// 🚀 APP
// ==========================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Connexion />} />

        {/* ================= ZONE COMPTABLE ================= */}
        <Route
          path="/comptable"
          element={
            <PrivateRoute>
              <LayoutComptable />
            </PrivateRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<DashboardComptable />} />
          <Route path="dashboard" element={<DashboardComptable />} />

          {/* Pages standards */}
          <Route path="utilisateurs" element={<UtilisateursComptable />} />
          <Route path="fournisseurs" element={<FournisseursComptable />} />
          <Route path="clients-speciaux" element={<ClientsSpeciauxComptable />} />
          <Route path="commandes" element={<CommandesComptable />} />
          <Route path="inventaire" element={<InventaireComptable />} />
          <Route path="rapports" element={<RapportsComptable />} />
          <Route path="journal-activites" element={<JournalActivitesComptable />} />

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
          <Route path="*" element={<Navigate to="/comptable/dashboard" replace />} />
        </Route>

        {/* Redirection racine */}
        <Route path="/" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

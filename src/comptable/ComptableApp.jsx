// ==========================================================
// ⚙️ ComptableApp.jsx — Interface Comptable LPD (STABLE)
// ==========================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ================= LAYOUT =================
import LayoutComptable from "./LayoutComptable.jsx";


// ================= PAGES PRINCIPALES =================
import DashboardComptable from "./pages/Dashboard.jsx";
import UtilisateursComptable from "./pages/Utilisateurs.jsx";
import FournisseursComptable from "./pages/Fournisseurs.jsx";
import CommandesComptable from "./pages/Commandes.jsx";
import InventaireComptable from "./pages/Inventaire.jsx";
import RapportsComptable from "./pages/Rapports.jsx";
import JournalActivitesComptable from "./pages/JournalActivites.jsx";
import ClientsSpeciauxComptable from "./pages/ClientsSpeciaux.jsx";

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
// 🔐 Protection des routes
// ==========================================================
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// ==========================================================
// 🚀 APP COMPTABLE
// ==========================================================
export default function ComptableApp() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Connexion />} />

        {/* ================= ZONE COMPTABLE ================= */}
        <Route
          path="/comptable"
          element={
            // <PrivateRoute>
              <LayoutComptable />
            // </PrivateRoute>
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
          <Route
            path="*"
            element={<Navigate to="/comptable/dashboard" replace />}
          /> 
        </Route>

        {/* Redirection racine */}
        {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}

      </Routes>
    </BrowserRouter>
  );
}

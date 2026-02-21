// ==========================================================
// 🗺️ Routes.jsx — Configuration centralisée des routes LPD
// ==========================================================

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// =================== AUTHENTIFICATION ===================
import Connexion from "./authentification/login/Connexion";

// =================== RESPONSABLE ===================
import LayoutResponsable from "./responsable/LayoutResponsable";
import DashboardResponsable from "./responsable/pages/Dashboard";
import UtilisateursResponsable from "./responsable/pages/Utilisateurs";
import FournisseursResponsable from "./responsable/pages/Fournisseurs";
import CommandesResponsable from "./responsable/pages/Commandes";
import InventaireResponsable from "./responsable/pages/Inventaire";
import RapportsResponsable from "./responsable/pages/Rapports";
import JournalActivitesResponsable from "./responsable/pages/JournalActivites";
import ClientsSpeciauxResponsable from "./responsable/pages/ClientsSpeciaux";
import DecaissementsResponsable from "./responsable/pages/Decaissements";

// =================== COMPTABLE ===================
import LayoutComptable from "./comptable/LayoutComptable";
import DashboardComptable from "./comptable/pages/Dashboard";
import UtilisateursComptable from "./comptable/pages/Utilisateurs";

import VentesControle from "./comptable/pages/VentesControle";

// Contrôle caissier (Comptable)
import JournalCaisse from "./comptable/pages/controle-caissier/JournalCaisse";
import EnregistrerVersement from "./comptable/pages/controle-caissier/EnregistrerVersement";
import HistoriqueVersements from "./comptable/pages/controle-caissier/HistoriqueVersements";

// Contrôle gestionnaire (Comptable)
import GestionnaireBoutique from "./comptable/pages/controle-gestionnaire/Boutique";
import GestionnaireDepot from "./comptable/pages/controle-gestionnaire/Depot";
import ResponsableControle from "./comptable/pages/controle-gestionnaire/Responsable";

// Inventaires (Comptable)
import InventaireDepot from "./comptable/pages/inventaire/InventaireDepot";
import InventaireBoutique from "./comptable/pages/inventaire/InventaireBoutique";
import HistoriqueInventaire from "./comptable/pages/inventaire/HistoriqueInventaire";

// =================== GESTIONNAIRE BOUTIQUE ===================
import LayoutGestionnaire  from "./gestionnaire-boutique/components/LayoutGestionnaire";
import Dashboard from "./gestionnaire-boutique/pages/Dashboard";
import Produits from "./gestionnaire-boutique/pages/Produits";
import Stock from "./gestionnaire-boutique/pages/Stock";
import Historique from "./gestionnaire-boutique/pages/Historique";
import Alertes from "./gestionnaire-boutique/pages/Alertes";
import Rapports from "./gestionnaire-boutique/pages/Rapports";

// =================== GESTIONNAIRE DÉPÔT ===================
import DepotLayout from "./gestionnaire-depot/layout/DepotLayout";
import DashboardDepot from "./gestionnaire-depot/pages/Dashboard";
import ProductsDepot from "./gestionnaire-depot/pages/Products";
import StockMovementsDepot from "./gestionnaire-depot/pages/StockMovements";
import SuppliersDepot from "./gestionnaire-depot/pages/Suppliers";
import StockReportDepot from "./gestionnaire-depot/pages/StockReport";

// =================== CAISSIER ===================
import CaissierLayout from "./caissier/layouts/CaissierLayout";
import DashboardCaissier from "./caissier/pages/DashboardPage";
import CaissePage from "./caissier/pages/CaissePage";
import DecaissementsPageCaissier from "./caissier/pages/DecaissementsPage";
import HistoriquePageCaissier from "./caissier/pages/HistoriquePage";
import RapportCaissePage from "./caissier/pages/RapportCaissePage";

// =================== VENDEUR ===================
import VendeurInterface from "./vendeur/VendeurInterface";

// ==========================================================
// 📋 Configuration des routes
// ==========================================================
export default function AppRoutes() {
  return (
    <Routes>
      {/* =================== AUTHENTIFICATION =================== */}
      <Route path="/login" element={<Connexion />} />

      {/* =================== RESPONSABLE =================== */}
      <Route
        path="/responsable"
        element={
          <ProtectedRoute allowedRoles={["responsable"]}>
            <LayoutResponsable />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/responsable/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardResponsable />} />
        <Route path="utilisateurs" element={<UtilisateursResponsable />} />
        <Route path="fournisseurs" element={<FournisseursResponsable />} />
        <Route path="clients-speciaux" element={<ClientsSpeciauxResponsable />} />
        <Route path="commandes" element={<CommandesResponsable />} />
        <Route path="inventaire" element={<InventaireResponsable />} />
        <Route path="rapports" element={<RapportsResponsable />} />
        <Route path="decaissements" element={<DecaissementsResponsable />} />
        <Route path="journal-activites" element={<JournalActivitesResponsable />} />
        <Route path="*" element={<Navigate to="/responsable/dashboard" replace />} />
      </Route>

      {/* =================== COMPTABLE =================== */}
      <Route
        path="/comptable"
        element={
          <ProtectedRoute allowedRoles={["comptable"]}>
            <LayoutComptable />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/comptable/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardComptable />} />
        <Route path="utilisateurs" element={<UtilisateursComptable />} />
       
        
        {/* Contrôle caissier */}
        <Route path="controle-caissier/caisse" element={<JournalCaisse />} />
        <Route path="controle-caissier/enregistrer-versement" element={<EnregistrerVersement />} />
        <Route path="controle-caissier/historique-versements" element={<HistoriqueVersements />} />
        
        {/* Contrôle gestionnaire */}
        <Route path="controle-gestionnaire/boutique" element={<GestionnaireBoutique />} />
        <Route path="controle-gestionnaire/depot" element={<GestionnaireDepot />} />
        <Route path="controle-gestionnaire/responsable" element={<ResponsableControle />} />
        
        {/* Inventaires */}
        <Route path="inventaire/depot" element={<InventaireDepot />} />
        <Route path="inventaire/boutique" element={<InventaireBoutique />} />
        <Route path="inventaire/historique" element={<HistoriqueInventaire />} />
        
        {/* Ventes */}
        <Route path="controle-vendeur" element={<VentesControle />} />
        
        <Route path="*" element={<Navigate to="/comptable/dashboard" replace />} />
      </Route>

      {/* =================== GESTIONNAIRE BOUTIQUE =================== */}
      <Route
        path="/gestionnaire_boutique"
        element={
          <ProtectedRoute allowedRoles={["gestionnaire_boutique"]}>
            <LayoutGestionnaire />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/gestionnaire_boutique/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="produits" element={<Produits />} />
        <Route path="stock" element={<Stock />} />
        <Route path="historique" element={<Historique />} />
        <Route path="transferts" element={<Historique />} />
        <Route path="alertes" element={<Alertes />} />
        <Route path="rapports" element={<Rapports />} />
        <Route path="*" element={<Navigate to="/gestionnaire_boutique/dashboard" replace />} />
      </Route>

      {/* =================== GESTIONNAIRE DÉPÔT =================== */}
      <Route
        path="/gestionnaire_depot"
        element={
          <ProtectedRoute allowedRoles={["gestionnaire_depot"]}>
            <DepotLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/gestionnaire_depot/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardDepot />} />
        <Route path="products" element={<ProductsDepot />} />
        <Route path="movementStock" element={<StockMovementsDepot />} />
        <Route path="suppliers" element={<SuppliersDepot />} />
        <Route path="rapports" element={<StockReportDepot />} />
        <Route path="*" element={<Navigate to="/gestionnaire_depot/dashboard" replace />} />
      </Route>

      {/* =================== CAISSIER =================== */}
      <Route
        path="/caissier"
        element={
          <ProtectedRoute allowedRoles={["caissier"]}>
            <CaissierLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/caissier/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardCaissier />} />
        <Route path="caisse" element={<CaissePage />} />
        <Route path="decaissements" element={<DecaissementsPageCaissier />} />
        <Route path="historique" element={<HistoriquePageCaissier />} />
        <Route path="rapport" element={<RapportCaissePage />} />
        <Route path="*" element={<Navigate to="/caissier/dashboard" replace />} />
      </Route>

      {/* =================== Vendeur =================== */}
      <Route
        path="/vendeur"
        element={
          <ProtectedRoute allowedRoles={["vendeur"]}>
            <VendeurInterface />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/*" replace />} />
        <Route path="*" element={<Navigate to="/vendeur" replace />} />
      </Route>

      {/* =================== REDIRECTION PAR DÉFAUT =================== */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

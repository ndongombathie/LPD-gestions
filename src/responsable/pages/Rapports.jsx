// ==========================================================
// 📊 Rapports.jsx — Version 4 (Améliorée avec Données Réelles)
// Rapports d'activités du Responsable par module
// - Cartes cliquables avec navigation
// - Filtres dynamiques par période
// - Recherche adaptative par module
// - Actions spécifiques du responsable
// - Données cohérentes avec chaque module
// ==========================================================

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  CalendarDays,
  Search,
  DollarSign,
  Truck,
  ShoppingCart,
  Star,
  Layers,
  BarChart3,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  Percent,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FilePieChart,
  FileBarChart,
  Info,
  PlusCircle,
  Edit,
  Trash2,
  Check,
  X as Close,
  Users,
  Package,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ==========================================================
// 📦 Import des services API (uniquement les 4 modules réels)
// ==========================================================
import { 
  decaissementsAPI, 
  fournisseursAPI, 
  commandesAPI, 
  clientsAPI
  // PAS d'inventaireAPI car pas encore d'endpoints
} from '@/services/api';

// ==========================================================
// 📦 DONNÉES SIMULÉES POUR L'INVENTAIRE (seulement)
// ==========================================================
const mockInventaire = [
  {
    id: 1,
    produit: 'Ordinateur portable',
    categorie: 'Informatique',
    libelle: 'HP EliteBook 840 G9',
    qteTheorique: 10,
    qteReelle: 8,
    prixUnitaire: 650000,
    date: '2024-01-15',
    reference: 'INV-001',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    produit: 'Imprimante laser',
    categorie: 'Bureau',
    libelle: 'Canon MF644Cdw',
    qteTheorique: 5,
    qteReelle: 5,
    prixUnitaire: 350000,
    date: '2024-01-15',
    reference: 'INV-002',
    created_at: '2024-01-15T14:20:00Z'
  },
  {
    id: 3,
    produit: 'Smartphone',
    categorie: 'Téléphonie',
    libelle: 'Samsung Galaxy S23',
    qteTheorique: 15,
    qteReelle: 12,
    prixUnitaire: 450000,
    date: '2024-01-16',
    reference: 'INV-003',
    created_at: '2024-01-16T09:15:00Z'
  },
  {
    id: 4,
    produit: 'Tablette',
    categorie: 'Informatique',
    libelle: 'iPad Air 5',
    qteTheorique: 8,
    qteReelle: 10,
    prixUnitaire: 550000,
    date: '2024-01-16',
    reference: 'INV-004',
    created_at: '2024-01-16T11:45:00Z'
  },
  {
    id: 5,
    produit: 'Écran 24"',
    categorie: 'Périphériques',
    libelle: 'Dell UltraSharp U2422H',
    qteTheorique: 12,
    qteReelle: 12,
    prixUnitaire: 250000,
    date: '2024-01-17',
    reference: 'INV-005',
    created_at: '2024-01-17T16:30:00Z'
  }
];

// ==========================================================
// 🧮 Helpers
// ==========================================================
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const formatPercent = (value) => {
  if (!isFinite(value) || isNaN(value)) return "0,0 %";
  const v = value * 100;
  return `${v.toFixed(1).replace(".", ",")} %`;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// ==========================================================
// 📊 Fonctions de récupération des données réelles
// ==========================================================

// 🔹 Récupérer les décaissements (API RÉELLE)
const fetchDecaissements = async (params = {}) => {
  try {
    const res = await decaissementsAPI.list(params);
    return res.data.data || [];
  } catch (error) {
    console.error("Erreur fetch décaissements:", error);
    return [];
  }
};

// 🔹 Récupérer les fournisseurs (API RÉELLE)
const fetchFournisseurs = async () => {
  try {
    const data = await fournisseursAPI.getAll();
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error("Erreur fetch fournisseurs:", error);
    return [];
  }
};

// 🔹 Récupérer les commandes clients spéciaux (API RÉELLE)
const fetchCommandes = async (params = {}) => {
  try {
    const res = await commandesAPI.getAll({
      ...params,
      type_client: "special"
    });
    return res.data || [];
  } catch (error) {
    console.error("Erreur fetch commandes:", error);
    return [];
  }
};

// 🔹 Récupérer les clients spéciaux (API RÉELLE)
const fetchClientsSpeciaux = async () => {
  try {
    const res = await clientsAPI.getAll({ type_client: "special" });
    const data = Array.isArray(res.data?.data) ? res.data.data : res.data || [];
    return data;
  } catch (error) {
    console.error("Erreur fetch clients spéciaux:", error);
    return [];
  }
};

// 🔹 Récupérer les données d'inventaire (SIMULÉES)
const fetchInventaire = async () => {
  try {
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retourne les données simulées
    return mockInventaire;
  } catch (error) {
    console.error("Erreur fetch inventaire (simulé):", error);
    return [];
  }
};

// ==========================================================
// 🧠 Fonctions de calcul des statistiques par module
// ==========================================================

// 🔹 Statistiques pour Décaissements
const computeStatsDecaissements = (decaissements) => {
  const total = decaissements.length;
  const enAttente = decaissements.filter(d => d.statut === 'en attente').length;
  const valides = decaissements.filter(d => d.statut === 'validé').length;
  const annules = decaissements.filter(d => d.statut === 'refusé').length;
  
  const montantTotal = decaissements.reduce((sum, d) => 
    sum + Number(d.montantTotal || 0), 0);
  const montantValide = decaissements
    .filter(d => d.statut === 'validé')
    .reduce((sum, d) => sum + Number(d.montantTotal || 0), 0);
  const montantEnAttente = decaissements
    .filter(d => d.statut === 'en attente')
    .reduce((sum, d) => sum + Number(d.montantTotal || 0), 0);

  return {
    total,
    enAttente,
    valides,
    annules,
    montantTotal,
    montantValide,
    montantEnAttente,
    tauxValidation: total > 0 ? (valides / total) * 100 : 0
  };
};

// 🔹 Statistiques pour Fournisseurs
const computeStatsFournisseurs = (fournisseurs) => {
  const total = fournisseurs.length;
  const avecLivraison = fournisseurs.filter(f => !!f.derniere_livraison).length;
  const sansLivraison = total - avecLivraison;
  
  return {
    total,
    avecLivraison,
    sansLivraison,
    pourcentageAvecLivraison: total > 0 ? (avecLivraison / total) * 100 : 0
  };
};

// 🔹 Statistiques pour Commandes
const computeStatsCommandes = (commandes) => {
  const actives = commandes.filter(c => c.statut !== 'annulee');
  const total = actives.length;
  const enAttente = actives.filter(c => c.statut === 'en_attente_caisse').length;
  const partiellementPayees = actives.filter(c => c.statut === 'partiellement_payee').length;
  const soldees = actives.filter(c => c.statut === 'soldee').length;
  
  const totalTTC = actives.reduce((sum, c) => sum + Number(c.totalTTC || 0), 0);
  const totalPaye = actives.reduce((sum, c) => sum + Number(c.montantPaye || 0), 0);
  const detteTotale = actives.reduce((sum, c) => 
    sum + Math.max(Number(c.resteAPayer || 0), 0), 0);

  return {
    total,
    enAttente,
    partiellementPayees,
    soldees,
    totalTTC,
    totalPaye,
    detteTotale,
    tauxEncaisse: totalTTC > 0 ? (totalPaye / totalTTC) * 100 : 0
  };
};

// 🔹 Statistiques pour Clients Spéciaux
const computeStatsClients = (clients, commandes) => {
  const total = clients.length;
  
  // Calculer les dettes et paiements par client
  const clientsAvecDette = clients.filter(client => {
    const commandesClient = commandes.filter(cmd => 
      String(cmd.clientId) === String(client.id) && cmd.statut !== 'annulee'
    );
    const dette = commandesClient.reduce((sum, cmd) => 
      sum + Math.max(Number(cmd.resteAPayer || 0), 0), 0);
    return dette > 0;
  });

  const totalTTC = commandes
    .filter(cmd => cmd.statut !== 'annulee')
    .reduce((sum, cmd) => sum + Number(cmd.totalTTC || 0), 0);
    
  const totalPaye = commandes
    .filter(cmd => cmd.statut !== 'annulee')
    .reduce((sum, cmd) => sum + Number(cmd.montantPaye || 0), 0);

  const detteTotale = totalTTC - totalPaye;

  return {
    total,
    avecDette: clientsAvecDette.length,
    sansDette: total - clientsAvecDette.length,
    totalTTC,
    totalPaye,
    detteTotale: Math.max(detteTotale, 0),
    tauxDette: total > 0 ? (clientsAvecDette.length / total) * 100 : 0
  };
};

// 🔹 Statistiques pour Inventaire
const computeStatsInventaire = (inventaireData) => {
  const totalArticles = inventaireData.length;
  const avecEcart = inventaireData.filter(item => {
    const ecart = Number(item.qteReelle || 0) - Number(item.qteTheorique || 0);
    return ecart !== 0;
  }).length;
  
  const sansEcart = totalArticles - avecEcart;
  
  const valeurTheorique = inventaireData.reduce((sum, item) => 
    sum + (Number(item.qteTheorique || 0) * Number(item.prixUnitaire || 0)), 0);
    
  const valeurReelle = inventaireData.reduce((sum, item) => 
    sum + (Number(item.qteReelle || 0) * Number(item.prixUnitaire || 0)), 0);
  
  const ecartGlobal = valeurReelle - valeurTheorique;
  const tauxEcart = valeurTheorique ? (ecartGlobal / valeurTheorique) * 100 : 0;

  return {
    totalArticles,
    avecEcart,
    sansEcart,
    valeurTheorique,
    valeurReelle,
    ecartGlobal,
    tauxEcart,
    tauxPrecision: 100 - Math.abs(tauxEcart)
  };
};

// ==========================================================
// 🧪 Fonctions pour générer les actions
// ==========================================================

// Actions DÉCAISSEMENTS
const getActionsDecaissements = (decaissements) => {
  return decaissements.slice(0, 5).map(d => ({
    id: d.id,
    date: d.datePrevue || d.created_at?.slice(0, 10),
    type: d.statut === 'validé' ? 'validation' : 
           d.statut === 'refusé' ? 'refus' : 
           d.statut === 'en attente' ? 'creation' : 'modification',
    description: `${d.statut === 'validé' ? 'Validation' : 
                  d.statut === 'refusé' ? 'Refus' : 
                  d.statut === 'en attente' ? 'Création' : 'Modification'} décaissement #${d.numero || d.id}`,
    reference: d.numero || `DEC-${d.id}`,
    montant: d.montantTotal,
    beneficiaire: d.motifGlobal?.split('-')[1]?.trim() || "Non spécifié",
    motif: d.motifGlobal,
    statut: d.statut,
    user: "Responsable"
  }));
};

// Actions FOURNISSEURS
const getActionsFournisseurs = (fournisseurs) => {
  return fournisseurs.slice(0, 5).map(f => ({
    id: f.id,
    date: f.created_at?.slice(0, 10) || todayISO(),
    type: 'creation',
    description: `Création fournisseur "${f.nom}"`,
    reference: `FOUR-${String(f.id).padStart(4, '0')}`,
    details: `${f.type_produit || f.typeProduit} - ${f.adresse}`,
    statut: f.actif ? 'actif' : 'inactif',
    user: "Responsable"
  }));
};

// Actions COMMANDES
const getActionsCommandes = (commandes) => {
  return commandes.slice(0, 5).map(c => ({
    id: c.id,
    date: c.dateCommande || c.created_at?.slice(0, 10),
    type: c.statut === 'en_attente_caisse' ? 'creation' : 
           c.statut === 'partiellement_payee' ? 'modification' :
           c.statut === 'soldee' ? 'validation_reception' : 'annulation',
    description: `Commande #${c.numero} - ${c.clientNom || 'Client spécial'}`,
    reference: c.numero,
    fournisseur: "Client spécial",
    montant: c.totalTTC,
    statut: c.statutLabel || c.statut,
    user: "Responsable"
  }));
};

// Actions CLIENTS SPÉCIAUX
const getActionsClientsSpeciaux = (clients) => {
  return clients.slice(0, 5).map(c => ({
    id: c.id,
    date: c.created_at?.slice(0, 10) || todayISO(),
    type: 'creation',
    description: `Création client spécial "${c.nom || c.raison_sociale}"`,
    reference: `CLI-${String(c.id).padStart(4, '0')}`,
    typeClient: "Spécial",
    remise: "15%",
    statut: 'actif',
    user: "Responsable"
  }));
};

// Actions INVENTAIRE
const getActionsInventaire = (inventaireData) => {
  return inventaireData.slice(0, 5).map((item, idx) => ({
    id: item.id || idx + 1,
    date: item.date || todayISO(),
    type: 'ajustement',
    description: `Ajustement stock ${item.produit || item.libelle}`,
    reference: item.reference || `AJU-${String(item.id || idx + 1).padStart(4, '0')}`,
    categorie: item.categorie || "Divers",
    quantite: Number(item.qteReelle || 0) - Number(item.qteTheorique || 0),
    valeur: Math.abs((Number(item.qteReelle || 0) - Number(item.qteTheorique || 0)) * Number(item.prixUnitaire || 0)),
    statut: 'validé',
    user: "Responsable"
  }));
};

// Cartes de navigation
const MODULE_CARDS = [
  { 
    id: "decaissements", 
    label: "Décaissements", 
    description: "Gestion des sorties de caisse", 
    icon: DollarSign, 
    color: "blue"
  },
  { 
    id: "fournisseurs", 
    label: "Fournisseurs", 
    description: "Gestion des partenaires", 
    icon: Truck, 
    color: "green"
  },
  { 
    id: "commandes", 
    label: "Commandes", 
    description: "Gestion des achats", 
    icon: ShoppingCart, 
    color: "purple"
  },
  { 
    id: "clients", 
    label: "Clients spéciaux", 
    description: "Gestion des clients privilégiés", 
    icon: Star, 
    color: "amber"
  },
  { 
    id: "inventaire", 
    label: "Inventaire", 
    description: "Gestion des stocks", 
    icon: Layers, 
    color: "indigo"
  },
];

// ==========================================================
// 📊 Composant principal — RAPPORTS VERSION 4
// ==========================================================
export default function Rapports() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());
  
  const [recherche, setRecherche] = useState("");
  const [moduleActif, setModuleActif] = useState("decaissements");
  const [typeActionFiltre, setTypeActionFiltre] = useState("tous");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("actions");
  
  // États pour les données
  const [decaissements, setDecaissements] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [clientsSpeciaux, setClientsSpeciaux] = useState([]);
  const [inventaireData, setInventaireData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Options pour le module actif
  const moduleActifData = MODULE_CARDS.find(m => m.id === moduleActif);

  // Charger les données au montage
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Charger les 4 modules réels en parallèle
        const [decaissementsRes, fournisseursRes, commandesRes, clientsRes] = await Promise.all([
          fetchDecaissements(),
          fetchFournisseurs(),
          fetchCommandes(),
          fetchClientsSpeciaux()
        ]);
        
        setDecaissements(decaissementsRes);
        setFournisseurs(fournisseursRes);
        setCommandes(commandesRes);
        setClientsSpeciaux(clientsRes);
        
        // Charger l'inventaire (simulé) séparément
        const inventaireRes = await fetchInventaire();
        setInventaireData(inventaireRes);
        
      } catch (error) {
        console.error("Erreur chargement données:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Récupérer les actions pour le module actif
  const getActionsForModule = useMemo(() => {
    switch (moduleActif) {
      case "decaissements":
        return getActionsDecaissements(decaissements);
      case "fournisseurs":
        return getActionsFournisseurs(fournisseurs);
      case "commandes":
        return getActionsCommandes(commandes);
      case "clients":
        return getActionsClientsSpeciaux(clientsSpeciaux);
      case "inventaire":
        return getActionsInventaire(inventaireData);
      default:
        return [];
    }
  }, [moduleActif, decaissements, fournisseurs, commandes, clientsSpeciaux, inventaireData]);

  // Calculer les stats pour le module actif
  const getStatsForModule = useMemo(() => {
    switch (moduleActif) {
      case "decaissements":
        return computeStatsDecaissements(decaissements);
      case "fournisseurs":
        return computeStatsFournisseurs(fournisseurs);
      case "commandes":
        return computeStatsCommandes(commandes);
      case "clients":
        return computeStatsClients(clientsSpeciaux, commandes);
      case "inventaire":
        return computeStatsInventaire(inventaireData);
      default:
        return {};
    }
  }, [moduleActif, decaissements, fournisseurs, commandes, clientsSpeciaux, inventaireData]);

  // Types d'action disponibles pour le module actif
  const typesActionDisponibles = useMemo(() => {
    const actions = getActionsForModule;
    const types = new Set(actions.map(a => a.type));
    return ["tous", ...Array.from(types)];
  }, [getActionsForModule]);

  // 🔎 Filtrage des actions du module actif
  const actionsFiltrees = useMemo(() => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);
    
    const q = (recherche || "").toLowerCase();
    
    return getActionsForModule.filter(action => {
      // Filtre par période
      const actionDate = new Date(action.date);
      if (isNaN(actionDate.getTime())) return false;
      if (actionDate < start || actionDate > end) return false;
      
      // Filtre par type d'action
      if (typeActionFiltre !== "tous" && action.type !== typeActionFiltre) return false;
      
      // Filtre par recherche
      if (q) {
        const searchable = [
          action.description,
          action.reference,
          action.user,
          action.statut,
          action.type,
          ...(action.beneficiaire ? [action.beneficiaire] : []),
          ...(action.fournisseur ? [action.fournisseur] : []),
          ...(action.categorie ? [action.categorie] : []),
          ...(action.motif ? [action.motif] : []),
          ...(action.details ? [action.details] : []),
        ].filter(Boolean).join(" ").toLowerCase();
        
        if (!searchable.includes(q)) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [getActionsForModule, dateDebut, dateFin, typeActionFiltre, recherche]);

  // Statistiques pour le module actif
  const statsModule = useMemo(() => {
    const totalActions = actionsFiltrees.length;
    const actionsParType = actionsFiltrees.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {});
    
    const montantTotal = actionsFiltrees.reduce((sum, action) => 
      sum + (action.montant || action.valeur || 0), 0
    );
    
    const actionsValidees = actionsFiltrees.filter(a => 
      ["validé", "terminé", "livrée", "actif", "modifié"].includes(a.statut)
    ).length;
    
    return {
      totalActions,
      actionsParType,
      montantTotal,
      actionsValidees,
      tauxValidation: totalActions > 0 ? (actionsValidees / totalActions) * 100 : 0,
      // Stats spécifiques au module
      moduleStats: getStatsForModule
    };
  }, [actionsFiltrees, getStatsForModule]);

  // Placeholder text pour la recherche dynamique
  const placeholderRecherche = useMemo(() => {
    switch (moduleActif) {
      case "decaissements":
        return "Rechercher référence, bénéficiaire, motif...";
      case "fournisseurs":
        return "Rechercher nom, contact, type produit...";
      case "commandes":
        return "Rechercher numéro, client, statut...";
      case "clients":
        return "Rechercher nom, entreprise, adresse...";
      case "inventaire":
        return "Rechercher produit, catégorie, référence...";
      default:
        return "Rechercher dans les actions...";
    }
  }, [moduleActif]);

  // 📤 Export PDF pour le module actif
  const exportPDF = () => {
    const doc = new jsPDF();
    const moduleLabel = moduleActifData?.label || "Rapports";
    
    doc.text(`Rapport des actions du Responsable — Module ${moduleLabel}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 22);
    doc.text(`Filtre type : ${typeActionFiltre === "tous" ? "Tous les types" : typeActionFiltre}`, 14, 27);
    doc.text(`Total actions : ${actionsFiltrees.length}`, 14, 32);
    
    // Déterminer les colonnes selon le module
    const colonnes = getColonnesPDF(moduleActif);
    const donnees = actionsFiltrees.map(action => getLignePDF(action, moduleActif));
    
    doc.autoTable({
      startY: 38,
      head: [colonnes],
      body: donnees,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    
    doc.save(`Rapport_${moduleLabel}_${dateDebut}_au_${dateFin}.pdf`);
    toast.success(`Rapport ${moduleLabel} exporté en PDF avec succès.`);
  };

  // Helper pour les colonnes PDF
  const getColonnesPDF = (moduleId) => {
    const base = ["Date", "Type", "Description", "Référence", "Statut"];
    
    switch (moduleId) {
      case "decaissements":
        return [...base, "Bénéficiaire", "Motif", "Montant"];
      case "fournisseurs":
        return [...base, "Détails", "Type"];
      case "commandes":
        return [...base, "Client", "Montant", "Statut paiement"];
      case "clients":
        return [...base, "Entreprise", "Type", "Remise"];
      case "inventaire":
        return [...base, "Catégorie", "Quantité", "Valeur"];
      default:
        return base;
    }
  };

  // Helper pour les lignes PDF
  const getLignePDF = (action, moduleId) => {
    const base = [
      action.date,
      action.type,
      action.description,
      action.reference,
      action.statut
    ];
    
    switch (moduleId) {
      case "decaissements":
        return [...base, action.beneficiaire || "-", action.motif || "-", action.montant ? formatFCFA(action.montant) : "-"];
      case "fournisseurs":
        return [...base, action.details || "-", "Fournisseur"];
      case "commandes":
        return [...base, action.fournisseur || "-", action.montant ? formatFCFA(action.montant) : "-", action.statut];
      case "clients":
        return [...base, action.details?.split(' - ')[0] || "-", action.typeClient || "-", action.remise || "-"];
      case "inventaire":
        return [...base, action.categorie || "-", action.quantite || "-", action.valeur ? formatFCFA(action.valeur) : "-"];
      default:
        return base;
    }
  };

  const resetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setDateDebut(d.toISOString().slice(0, 10));
    setDateFin(todayISO());
    setRecherche("");
    setTypeActionFiltre("tous");
    setShowAdvancedFilters(false);
    toast.info("Filtres réinitialisés");
  };

  // Compteur de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (recherche) count++;
    if (typeActionFiltre !== "tous") count++;
    return count;
  }, [recherche, typeActionFiltre]);

  // Icône et couleur pour les stats du module
  const getModuleStatsConfig = () => {
    const stats = getStatsForModule;
    
    switch (moduleActif) {
      case "decaissements":
        return {
          primaryIcon: DollarSign,
          primaryLabel: "Montant total",
          primaryValue: formatFCFA(stats.montantTotal),
          primaryColor: "text-blue-600",
          secondaryIcon: CheckCircle,
          secondaryLabel: "Validés",
          secondaryValue: stats.valides,
          secondaryColor: "text-emerald-600"
        };
      case "fournisseurs":
        return {
          primaryIcon: Users,
          primaryLabel: "Fournisseurs",
          primaryValue: stats.total,
          primaryColor: "text-green-600",
          secondaryIcon: Truck,
          secondaryLabel: "Avec livraison",
          secondaryValue: stats.avecLivraison,
          secondaryColor: "text-green-600"
        };
      case "commandes":
        return {
          primaryIcon: ShoppingCart,
          primaryLabel: "Total TTC",
          primaryValue: formatFCFA(stats.totalTTC),
          primaryColor: "text-purple-600",
          secondaryIcon: CreditCard,
          secondaryLabel: "Montant payé",
          secondaryValue: formatFCFA(stats.totalPaye),
          secondaryColor: "text-emerald-600"
        };
      case "clients":
        return {
          primaryIcon: Star,
          primaryLabel: "Clients",
          primaryValue: stats.total,
          primaryColor: "text-amber-600",
          secondaryIcon: AlertTriangle,
          secondaryLabel: "Avec dette",
          secondaryValue: stats.avecDette,
          secondaryColor: "text-rose-600"
        };
      case "inventaire":
        return {
          primaryIcon: Package,
          primaryLabel: "Valeur théorique",
          primaryValue: formatFCFA(stats.valeurTheorique),
          primaryColor: "text-indigo-600",
          secondaryIcon: BarChart3,
          secondaryLabel: "Écart global",
          secondaryValue: formatFCFA(stats.ecartGlobal),
          secondaryColor: stats.ecartGlobal < 0 ? "text-red-600" : "text-emerald-600"
        };
      default:
        return {
          primaryIcon: BarChart3,
          primaryLabel: "Actions",
          primaryValue: statsModule.totalActions,
          primaryColor: "text-gray-600",
          secondaryIcon: CheckCircle,
          secondaryLabel: "Validées",
          secondaryValue: statsModule.actionsValidees,
          secondaryColor: "text-emerald-600"
        };
    }
  };

  const statsConfig = getModuleStatsConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/50 to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <RefreshCw className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des rapports...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-50/50 to-white px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Rapports — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Rapports d'activités du Responsable
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Suivi détaillé de toutes vos actions : décaissements, fournisseurs, commandes, clients spéciaux et inventaire.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période du{" "}
              <span className="font-semibold">{dateDebut}</span> au{" "}
              <span className="font-semibold">{dateFin}</span> •{" "}
              Module actif : <span className="font-semibold">{moduleActifData?.label}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition"
            >
              <FileText className="w-4 h-4" />
              Exporter rapport {moduleActifData?.label}
            </button>
          </div>
        </motion.header>

        {/* BARRE DE FILTRES HORIZONTALE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Recherche dynamique */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder={placeholderRecherche}
                      className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Période */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateDebut}
                      max={dateFin}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                    />
                    <span className="text-gray-400 self-center">→</span>
                    <input
                      type="date"
                      value={dateFin}
                      min={dateDebut}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Type d'action */}
                <div className="min-w-[160px]">
                  <select
                    value={typeActionFiltre}
                    onChange={(e) => setTypeActionFiltre(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                  >
                    {typesActionDisponibles.map((type) => (
                      <option key={type} value={type}>
                        {type === "tous" ? "Tous les types" : type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bouton filtres avancés */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  <Filter className="w-4 h-4" />
                  Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filtres avancés (toggle) */}
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Trier par
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "date_desc", label: "Date (récent)" },
                          { value: "date_asc", label: "Date (ancien)" },
                          { value: "montant_desc", label: "Montant (haut)" },
                          { value: "montant_asc", label: "Montant (bas)" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition"
                            onClick={() => {
                              // Implémenter le tri ici
                              toast.info(`Tri par ${option.label} - À implémenter`);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end gap-2 ml-auto">
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Réinitialiser
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CARTES DE NAVIGATION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MODULE_CARDS.map((module) => {
            const Icon = module.icon;
            const isActive = moduleActif === module.id;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600 border-blue-200',
              green: 'bg-green-50 text-green-600 border-green-200',
              purple: 'bg-purple-50 text-purple-600 border-purple-200',
              amber: 'bg-amber-50 text-amber-600 border-amber-200',
              indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            };
            
            // Calculer le nombre d'actions pour chaque module
            let actionCount = 0;
            switch (module.id) {
              case "decaissements": actionCount = decaissements.length; break;
              case "fournisseurs": actionCount = fournisseurs.length; break;
              case "commandes": actionCount = commandes.length; break;
              case "clients": actionCount = clientsSpeciaux.length; break;
              case "inventaire": actionCount = inventaireData.length; break;
            }
            
            return (
              <button
                key={module.id}
                onClick={() => setModuleActif(module.id)}
                className={`relative text-left rounded-xl border px-4 py-4 transition-all duration-300 shadow-sm hover:shadow-md ${
                  isActive 
                    ? `${colorClasses[module.color]} ring-2 ring-opacity-50 ring-current transform scale-[1.02]`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? colorClasses[module.color].split(' ')[0] : 'bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? colorClasses[module.color].split(' ')[1] : 'text-gray-500'}`} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-sm font-semibold ${isActive ? colorClasses[module.color].split(' ')[1] : 'text-gray-700'}`}>
                      {module.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {module.description}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full bg-${module.color}-500`} />
                      <span className="text-xs font-medium text-gray-600">
                        {actionCount} actions
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* STATISTIQUES DU MODULE ACTIF */}
        <motion.div
          key={moduleActif}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                moduleActif === "decaissements" ? "bg-blue-50 text-blue-600" :
                moduleActif === "fournisseurs" ? "bg-green-50 text-green-600" :
                moduleActif === "commandes" ? "bg-purple-50 text-purple-600" :
                moduleActif === "clients" ? "bg-amber-50 text-amber-600" :
                "bg-indigo-50 text-indigo-600"
              }`}>
                {moduleActifData ? <moduleActifData.icon className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Module : {moduleActifData?.label}</h2>
                <p className="text-sm text-gray-500">Actions du responsable sur la période sélectionnée</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">Actions trouvées</p>
                <p className="text-lg font-bold text-gray-800">{actionsFiltrees.length}</p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="text-right">
                <p className="text-xs text-gray-500">Taux de validation</p>
                <p className="text-lg font-bold text-emerald-600">{statsModule.tauxValidation.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Carte 1 : Actions filtrées */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Actions filtrées</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{actionsFiltrees.length}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Sur {getActionsForModule.length} actions totales
              </p>
            </div>

            {/* Carte 2 : Statistique principale du module */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {statsConfig.primaryLabel}
                  </p>
                  <p className={`text-xl font-bold mt-1 ${statsConfig.primaryColor}`}>
                    {statsConfig.primaryValue}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  moduleActif === "decaissements" ? "bg-blue-50" :
                  moduleActif === "fournisseurs" ? "bg-green-50" :
                  moduleActif === "commandes" ? "bg-purple-50" :
                  moduleActif === "clients" ? "bg-amber-50" :
                  "bg-indigo-50"
                }`}>
                  <statsConfig.primaryIcon className={`w-5 h-5 ${statsConfig.primaryColor}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {moduleActif === "decaissements" ? "Total des décaissements" :
                 moduleActif === "fournisseurs" ? "Fournisseurs enregistrés" :
                 moduleActif === "commandes" ? "Valeur totale des commandes" :
                 moduleActif === "clients" ? "Clients spéciaux enregistrés" :
                 "Valeur théorique du stock"}
              </p>
            </div>

            {/* Carte 3 : Statistique secondaire du module */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {statsConfig.secondaryLabel}
                  </p>
                  <p className={`text-xl font-bold mt-1 ${statsConfig.secondaryColor}`}>
                    {statsConfig.secondaryValue}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  statsConfig.secondaryColor.includes('emerald') ? "bg-emerald-50" :
                  statsConfig.secondaryColor.includes('red') ? "bg-red-50" :
                  statsConfig.secondaryColor.includes('green') ? "bg-green-50" :
                  "bg-gray-100"
                }`}>
                  <statsConfig.secondaryIcon className={`w-5 h-5 ${statsConfig.secondaryColor}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {moduleActif === "decaissements" ? "Décaissements validés" :
                 moduleActif === "fournisseurs" ? "Avec livraison renseignée" :
                 moduleActif === "commandes" ? "Montant encaissé" :
                 moduleActif === "clients" ? "Clients avec dette active" :
                 "Différence valeur réelle"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: "actions", label: "Liste des actions", icon: <FileText className="w-4 h-4" /> },
                { id: "timeline", label: "Chronologie", icon: <Clock className="w-4 h-4" /> },
                { id: "analytics", label: "Analyses", icon: <BarChart3 className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENU DES ONGLETS */}
          <div className="p-6">
            {activeTab === "actions" && (
              <div className="space-y-4">
                {/* EN-TÊTE TABLEAU */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">Actions du responsable</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                      {actionsFiltrees.length} action{actionsFiltrees.length > 1 && 's'}
                    </span>
                  </div>
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Exporter
                  </button>
                </div>

                {/* TABLEAU DES ACTIONS */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Heure
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Référence
                        </th>
                        
                        {/* Colonnes spécifiques selon le module */}
                        {moduleActif === "decaissements" && (
                          <>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bénéficiaire
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Montant
                            </th>
                          </>
                        )}
                        
                        {moduleActif === "fournisseurs" && (
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Détails
                          </th>
                        )}
                        
                        {moduleActif === "commandes" && (
                          <>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Client
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Montant
                            </th>
                          </>
                        )}
                        
                        {moduleActif === "clients" && (
                          <>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type Client
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remise
                            </th>
                          </>
                        )}
                        
                        {moduleActif === "inventaire" && (
                          <>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Catégorie
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantité
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Valeur
                            </th>
                          </>
                        )}
                        
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {actionsFiltrees.length ? (
                        actionsFiltrees.map((action) => (
                          <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {action.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                                {action.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {action.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {action.reference}
                            </td>
                            
                            {/* Données spécifiques selon le module */}
                            {moduleActif === "decaissements" && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.beneficiaire}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.montant ? formatFCFA(action.montant) : "-"}
                                </td>
                              </>
                            )}
                            
                            {moduleActif === "fournisseurs" && (
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {action.details}
                              </td>
                            )}
                            
                            {moduleActif === "commandes" && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.fournisseur}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.montant ? formatFCFA(action.montant) : "-"}
                                </td>
                              </>
                            )}
                            
                            {moduleActif === "clients" && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.typeClient}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.remise}
                                </td>
                              </>
                            )}
                            
                            {moduleActif === "inventaire" && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.categorie}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.quantite}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {action.valeur ? formatFCFA(action.valeur) : "-"}
                                </td>
                              </>
                            )}
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                ["validé", "terminé", "livrée", "actif", "modifié"].includes(action.statut)
                                  ? "bg-emerald-100 text-emerald-700"
                                  : ["refusé", "annulé", "inactif"].includes(action.statut)
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {action.statut}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={
                            moduleActif === "decaissements" ? 8 :
                            moduleActif === "commandes" ? 8 :
                            moduleActif === "clients" ? 8 :
                            moduleActif === "inventaire" ? 9 :
                            moduleActif === "fournisseurs" ? 6 : 5
                          } className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FileText className="w-12 h-12 mb-3 opacity-30" />
                              <p className="text-sm">Aucune action trouvée avec les filtres actuels</p>
                              <button
                                onClick={resetFilters}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                              >
                                Réinitialiser les filtres
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {actionsFiltrees.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">1</span> à{" "}
                        <span className="font-medium">{actionsFiltrees.length}</span> actions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                        disabled
                      >
                        Précédent
                      </button>
                      <button 
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                        disabled
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Chronologie des actions</h3>
                    </div>
                  </div>
                  
                  <div className="relative pl-8">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    {actionsFiltrees.slice(0, 10).map((action, index) => (
                      <div key={action.id} className="relative mb-6 last:mb-0">
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                          ["validé", "terminé", "livrée", "actif", "modifié"].includes(action.statut)
                            ? 'bg-emerald-500'
                            : ["refusé", "annulé", "inactif"].includes(action.statut)
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`} />
                        
                        <div className="ml-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800 capitalize">{action.type}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {typeof action.date === 'string' && action.date.includes(' ') 
                                  ? action.date.slice(11, 16) 
                                  : "00:00"}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {typeof action.date === 'string' 
                                ? action.date.slice(0, 10) 
                                : action.date}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{action.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs font-medium text-gray-700">Ref: {action.reference}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ["validé", "terminé", "livrée", "actif", "modifié"].includes(action.statut)
                                ? "bg-emerald-100 text-emerald-700"
                                : ["refusé", "annulé", "inactif"].includes(action.statut)
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {action.statut}
                            </span>
                            {(action.montant || action.valeur) && (
                              <span className="text-xs font-medium text-emerald-600 ml-auto">
                                {formatFCFA(action.montant || action.valeur)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-50 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Analyses du module {moduleActifData?.label}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Répartition par type d'action */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Répartition par type</h4>
                      <div className="space-y-2">
                        {Object.entries(statsModule.actionsParType).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">{count}</span>
                              <span className="text-xs text-gray-500">
                                ({((count / statsModule.totalActions) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Répartition par statut */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Répartition par statut</h4>
                      <div className="space-y-2">
                        {Object.entries(
                          actionsFiltrees.reduce((acc, action) => {
                            acc[action.statut] = (acc[action.statut] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([statut, count]) => (
                          <div key={statut} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 capitalize">{statut}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">{count}</span>
                              <span className="text-xs text-gray-500">
                                ({((count / statsModule.totalActions) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Périodicité */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Périodicité</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Actions/jour moyen</span>
                          <span className="text-sm font-bold text-gray-800">
                            {(statsModule.totalActions / 30).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Période couverte</span>
                          <span className="text-sm font-bold text-gray-800">
                            {actionsFiltrees.length > 0 ? 
                              Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24)) : 0} jours
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Dernière action</span>
                          <span className="text-sm font-bold text-gray-800">
                            {actionsFiltrees[0]?.date?.slice(0, 10) || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFORMATIF */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Système de traçabilité des actions du responsable - Export PDF disponible pour chaque module</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}</span>
              <button onClick={resetFilters} className="text-indigo-600 hover:text-indigo-700">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
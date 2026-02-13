// ==========================================================
// 🌟 Dashboard.jsx — VERSION OPTIMISÉE
// Design adapté à votre palette de couleurs
// ==========================================================

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  Banknote,
  Shield,
  Crown,
  Activity,
  BarChart3,
  Trophy,
  Bell,
  Zap,
  Star,
  Download,
  Eye,
  AlertTriangle,
  UserCog,
  UserCheck,
  CreditCard,
  Truck,
  PieChart,
  Clock,
  Wallet,
  Repeat,
  Layers,
  ArrowUpDown,
  Smartphone,
  Landmark,
  CircleDollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

// === Components réutilisables ===
import ChartBox from "../components/ChartBox";
import TableWidget from "../components/TableWidget";

// === Helper functions ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

// ==========================================================
// 📊 DONNÉES BUSINESS AMÉLIORÉES
// ==========================================================

// 📦 Données commandes enrichies
const commandesData = {
  journalieres: [
    { date: "2024-01-08", nbCommandes: 24, montant: 650000, statut: "soldée" },
    { date: "2024-01-09", nbCommandes: 31, montant: 820000, statut: "soldée" },
    { date: "2024-01-10", nbCommandes: 28, montant: 760000, statut: "partielle" },
    { date: "2024-01-11", nbCommandes: 35, montant: 920000, statut: "soldée" },
    { date: "2024-01-12", nbCommandes: 42, montant: 1250000, statut: "soldée" },
    { date: "2024-01-13", nbCommandes: 38, montant: 980000, statut: "en attente" },
    { date: "2024-01-14", nbCommandes: 29, montant: 710000, statut: "soldée" },
    { date: "2024-01-15", nbCommandes: 33, montant: 890000, statut: "partielle" },
    { date: "2024-01-16", nbCommandes: 45, montant: 1350000, statut: "soldée" },
    { date: "2024-01-17", nbCommandes: 39, montant: 1020000, statut: "soldée" },
    { date: "2024-01-18", nbCommandes: 27, montant: 680000, statut: "annulée" },
    { date: "2024-01-19", nbCommandes: 34, montant: 880000, statut: "soldée" },
    { date: "2024-01-20", nbCommandes: 41, montant: 1150000, statut: "en attente" },
    { date: "2024-01-21", nbCommandes: 36, montant: 930000, statut: "soldée" },
  ],
  parStatut: [
    { name: "Soldée", value: 187, color: "#10B981" },
    { name: "Partiellement payée", value: 54, color: "#F59E0B" },
    { name: "En attente", value: 41, color: "#3B82F6" },
    { name: "Annulée", value: 18, color: "#EF4444" },
  ],
  evolution: [
    { name: "Lun", commandes: 24, montant: 650000 },
    { name: "Mar", commandes: 31, montant: 820000 },
    { name: "Mer", commandes: 28, montant: 760000 },
    { name: "Jeu", commandes: 35, montant: 920000 },
    { name: "Ven", commandes: 42, montant: 1250000 },
    { name: "Sam", commandes: 38, montant: 980000 },
    { name: "Dim", commandes: 29, montant: 710000 },
  ]
};

// 💰 Données paiements enrichies
const paiementsData = {
  totalFacture: 8970000,
  totalEncaissement: 6840000,
  resteAEncaisser: 2130000,
  parType: [
    { name: "Espèces", value: 3240000, pourcentage: 47.4, color: "#10B981" },
    { name: "Mobile Money", value: 2150000, pourcentage: 31.4, color: "#3B82F6" },
    { name: "Virement", value: 980000, pourcentage: 14.3, color: "#8B5CF6" },
    { name: "Autres", value: 470000, pourcentage: 6.9, color: "#F59E0B" },
  ],
  journaliers: [
    { name: "Lun", encaisse: 485000, facture: 650000 },
    { name: "Mar", encaisse: 612000, facture: 820000 },
    { name: "Mer", encaisse: 548000, facture: 760000 },
    { name: "Jeu", encaisse: 723000, facture: 920000 },
    { name: "Ven", encaisse: 892000, facture: 1250000 },
    { name: "Sam", encaisse: 745000, facture: 980000 },
    { name: "Dim", encaisse: 534000, facture: 710000 },
  ]
};

// 📊 Données produits avancées
const produitsData = {
  topVentes: [
    { id: 1, nom: "Produit Premium", quantite: 145, ca: 3250000, stock: 42, seuil: 20 },
    { id: 2, nom: "Solution Pro", quantite: 128, ca: 2840000, stock: 38, seuil: 15 },
    { id: 3, nom: "Package Standard", quantite: 112, ca: 2150000, stock: 56, seuil: 25 },
    { id: 4, nom: "Kit Démarrage", quantite: 98, ca: 1680000, stock: 23, seuil: 10 },
    { id: 5, nom: "Abonnement", quantite: 87, ca: 1950000, stock: 0, seuil: 5 },
  ],
  faibleRotation: [
    { id: 6, nom: "Produit A", stock: 124, ventes: 8, rotation: 6.5, seuil: 30 },
    { id: 7, nom: "Produit B", stock: 98, ventes: 12, rotation: 12.2, seuil: 20 },
    { id: 8, nom: "Produit C", stock: 87, ventes: 9, rotation: 10.3, seuil: 25 },
    { id: 9, nom: "Produit D", stock: 76, ventes: 7, rotation: 9.2, seuil: 15 },
    { id: 10, nom: "Produit E", stock: 65, ventes: 5, rotation: 7.7, seuil: 20 },
  ],
  repartitionCA: [
    { name: "Premium", value: 42, color: "#472EAD" },
    { name: "Standard", value: 28, color: "#F58020" },
    { name: "Basique", value: 18, color: "#10B981" },
    { name: "Autres", value: 12, color: "#3B82F6" },
  ],
  // Données pour rotation produits
  rotationData: [
    { name: "Produit A", rotation: 6.5, color: "#EF4444" },
    { name: "Produit B", rotation: 12.2, color: "#F59E0B" },
    { name: "Produit C", rotation: 10.3, color: "#F59E0B" },
    { name: "Produit D", rotation: 9.2, color: "#F59E0B" },
    { name: "Produit E", rotation: 7.7, color: "#EF4444" },
  ]
};

// 👥 Données clients enrichies
const clientsData = {
  stats: {
    actifs: 142,
    nouveaux: 18,
    fideles: 67,
    aRisque: 12
  },
  topClients: [
    { id: 1, nom: "Entreprise Alpha", type: "Enterprise", dette: 245000, transactions: 12, rating: 9.8, ca: 1250000 },
    { id: 2, nom: "Startup Beta", type: "Startup", dette: 187500, transactions: 8, rating: 9.2, ca: 890000 },
    { id: 3, nom: "Corp Gamma", type: "Corporate", dette: 312000, transactions: 15, rating: 8.7, ca: 2100000 },
    { id: 4, nom: "Group Delta", type: "PME", dette: 129000, transactions: 6, rating: 9.5, ca: 980000 },
    { id: 5, nom: "Company Epsilon", type: "Enterprise", dette: 298000, transactions: 11, rating: 8.9, ca: 1650000 },
  ],
  parSegment: [
    { name: "Enterprise", value: 38, color: "#472EAD" },
    { name: "Startup", value: 42, color: "#F58020" },
    { name: "PME", value: 28, color: "#10B981" },
    { name: "Particulier", value: 34, color: "#3B82F6" },
  ]
};

// 💼 Données fournisseurs
const fournisseursData = {
  actifs: 28,
  enAttente: 5,
  totalCommandes: 156,
  derniersAchats: 2840000,
  topFournisseurs: [
    { id: 1, nom: "Fournitures Pro", commandes: 24, montant: 845000, statut: "actif" },
    { id: 2, nom: "Distrib Express", commandes: 18, montant: 672000, statut: "actif" },
    { id: 3, nom: "Matériaux Plus", commandes: 15, montant: 548000, statut: "actif" },
    { id: 4, nom: "Services Généraux", commandes: 9, montant: 298000, statut: "en attente" },
    { id: 5, nom: "Equipements SA", commandes: 7, montant: 214000, statut: "actif" }
  ],
  dernieresCommandes: [
    { id: 101, fournisseur: "Fournitures Pro", date: "2024-01-15", montant: 145000, statut: "livrée" },
    { id: 102, fournisseur: "Distrib Express", date: "2024-01-14", montant: 89000, statut: "en cours" },
    { id: 103, fournisseur: "Matériaux Plus", date: "2024-01-12", montant: 234000, statut: "livrée" },
    { id: 104, fournisseur: "Services Généraux", date: "2024-01-10", montant: 67000, statut: "en attente" },
    { id: 105, fournisseur: "Equipements SA", date: "2024-01-08", montant: 156000, statut: "livrée" }
  ]
};

// 📈 Données activité globale
const activiteGlobale = [
  { name: "Ventes", value: 156, color: "#472EAD" },
  { name: "Paiements", value: 312, color: "#10B981" },
  { name: "Clients", value: 89, color: "#3B82F6" },
  { name: "Fournisseurs", value: 45, color: "#F58020" },
];

// 🚨 NOUVELLE SECTION : Alertes Stock uniquement
const alertesStock = {
  rupture: produitsData.topVentes.filter(p => p.stock === 0).length + produitsData.faibleRotation.filter(p => p.stock === 0).length,
  sousSeuil: [...produitsData.topVentes, ...produitsData.faibleRotation].filter(p => p.stock > 0 && p.stock < p.seuil).length,
  normal: [...produitsData.topVentes, ...produitsData.faibleRotation].filter(p => p.stock >= p.seuil).length,
  totalProduits: produitsData.topVentes.length + produitsData.faibleRotation.length
};

// 📊 Données stock (conservées)
const stockData = [
  { name: "Produit A", value: 42, color: "#472EAD" },
  { name: "Produit B", value: 36, color: "#F58020" },
  { name: "Produit C", value: 28, color: "#10B981" },
  { name: "Produit D", value: 14, color: "#3B82F6" },
];

// 👥 Stats utilisateurs
const statsUtilisateurs = {
  vendeurs: 24,
  caissiers: 12,
  admins: 3,
  performance: {
    vendeurs: 92,
    caissiers: 88,
    global: 91
  }
};

// ==========================================================
// 🏢 COMPOSANT PRINCIPAL — DASHBOARD
// ==========================================================

export default function Dashboard() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
    hover: { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } },
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="p-4 lg:p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* === HEADER === */}
          <motion.header variants={itemVariants} className="mb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Tableau de bord
                </h1>
                <p className="text-gray-600 max-w-2xl">
                  Aperçu global de votre activité. Données mises à jour en temps réel.
                </p>
              </div>

              <button className="btn btn-primary flex items-center gap-2">
                <Download size={16} />
                <span>Exporter les données</span>
              </button>
            </div>

            {/* Stats rapides améliorées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm text-gray-500">CA du jour</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{formatFCFA(paiementsData.journaliers[6].facture)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+8.5%</span>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-500">Nouv. commandes</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{commandesData.evolution[6].commandes}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">+3 aujourd'hui</span>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-500">Clients actifs</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{clientsData.stats.actifs}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+5 cette semaine</span>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-500">Encaissement</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{((paiementsData.totalEncaissement / paiementsData.totalFacture) * 100).toFixed(0)}%</div>
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">Taux encaissement</span>
                </div>
              </div>
            </div>
          </motion.header>

          {/* === KPI CARDS === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Indicateurs Clés
              </h2>
              <div className="text-sm text-gray-500">
                Mis à jour à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Carte Ventes */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -translate-y-6 translate-x-6" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <ShoppingBag className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                      MOIS
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-gray-900">{formatFCFA(paiementsData.totalFacture)}</div>
                    <div className="text-gray-500 text-sm">Chiffre d'affaires</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm font-medium">+24.7%</span>
                    <span className="text-gray-400 text-sm ml-auto">vs mois dernier</span>
                  </div>
                </div>
              </motion.div>

              {/* Carte Clients */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-6 translate-x-6" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      VIP
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-gray-900">{clientsData.stats.fideles}</div>
                    <div className="text-gray-500 text-sm">Clients fidèles</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 text-sm font-medium">{clientsData.stats.nouveaux} nouveaux</span>
                    <span className="text-gray-400 text-sm ml-auto">ce mois</span>
                  </div>
                </div>
              </motion.div>

              {/* Carte Trésorerie */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-6 translate-x-6" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                      NET
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-gray-900">{formatFCFA(paiementsData.totalEncaissement)}</div>
                    <div className="text-gray-500 text-sm">Encaissements</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm font-medium">-{formatFCFA(paiementsData.resteAEncaisser)}</span>
                    <span className="text-gray-400 text-sm ml-auto">à encaisser</span>
                  </div>
                </div>
              </motion.div>

              {/* Carte Stock */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -translate-y-6 translate-x-6" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                      ROTATION
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-gray-900">847</div>
                    <div className="text-gray-500 text-sm">Unités en stock</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 text-sm font-medium">{alertesStock.sousSeuil} sous seuil</span>
                    <span className="text-gray-400 text-sm ml-auto">{alertesStock.rupture} rupture</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* === STATS UTILISATEURS === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <UserCog className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Équipe commerciale</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{statsUtilisateurs.vendeurs}</div>
                    <div className="text-sm text-gray-500">Vendeurs actifs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">{statsUtilisateurs.performance.vendeurs}%</div>
                    <div className="text-xs text-gray-400">performance</div>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Équipe caisse</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{statsUtilisateurs.caissiers}</div>
                    <div className="text-sm text-gray-500">Caissiers actifs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">{statsUtilisateurs.performance.caissiers}%</div>
                    <div className="text-xs text-gray-400">performance</div>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-amber-50 to-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Performance globale</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{statsUtilisateurs.performance.global}%</div>
                    <div className="text-sm text-gray-500">Efficacité équipe</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-600">+{statsUtilisateurs.admins} admins</div>
                    <div className="text-xs text-gray-400">supervision</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* === NOUVELLE SECTION : ALERTES STOCK UNIQUEMENT === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-red-100">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Alertes Stock</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Produits en rupture */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden border-l-4 border-red-500"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -translate-y-6 translate-x-6 opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-red-100">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                      CRITIQUE
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-gray-900">{alertesStock.rupture}</div>
                    <div className="text-gray-500 text-sm">Produits en rupture</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Stock = 0 - Réapprovisionnement urgent
                  </div>
                </div>
              </motion.div>

              {/* Produits sous seuil */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden border-l-4 border-orange-500"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -translate-y-6 translate-x-6 opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Bell className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                      ATTENTION
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-gray-900">{alertesStock.sousSeuil}</div>
                    <div className="text-gray-500 text-sm">Produits sous seuil</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Stock &lt; seuil minimum - À surveiller
                  </div>
                </div>
              </motion.div>

              {/* Produits en stock normal */}
              <motion.div
                variants={itemVariants}
                whileHover="hover"
                className="card relative overflow-hidden border-l-4 border-green-500"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-6 translate-x-6 opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                      OK
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-gray-900">{alertesStock.normal}</div>
                    <div className="text-gray-500 text-sm">Produits en stock normal</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Stock &gt; seuil - Situation stable
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* === GRAPHIQUES PRINCIPAUX === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Évolution des commandes */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Évolution des commandes</h3>
                  </div>
                  <div className="text-sm text-gray-500">7 derniers jours</div>
                </div>
                <ChartBox
                  title=""
                  icon={<TrendingUp size={18} />}
                  data={commandesData.evolution}
                  dataKey1="commandes"
                  dataKey2="montant"
                  type="line"
                  color1="#472EAD"
                  color2="#F58020"
                  theme="light"
                />
              </div>

              {/* Commandes par statut */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Commandes par statut</h3>
                  </div>
                  <div className="text-sm text-gray-500">Total: {commandesData.parStatut.reduce((acc, curr) => acc + curr.value, 0)}</div>
                </div>
                <ChartBox
                  title=""
                  icon={<ShoppingBag size={18} />}
                  data={commandesData.parStatut}
                  dataKey1="value"
                  type="pie"
                  colors={["#10B981", "#F59E0B", "#3B82F6", "#EF4444"]}
                  theme="light"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {commandesData.parStatut.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* === FLUX FINANCIER RÉEL === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-100">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Flux financier réel</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="card bg-gradient-to-br from-purple-50 to-white">
                <div className="text-sm text-gray-500 mb-1">Total facturé</div>
                <div className="text-2xl font-bold text-gray-900">{formatFCFA(paiementsData.totalFacture)}</div>
                <div className="text-xs text-gray-400 mt-1">Somme des commandes</div>
              </div>
              <div className="card bg-gradient-to-br from-green-50 to-white">
                <div className="text-sm text-gray-500 mb-1">Total encaissé</div>
                <div className="text-2xl font-bold text-green-600">{formatFCFA(paiementsData.totalEncaissement)}</div>
                <div className="text-xs text-gray-400 mt-1">Paiements reçus</div>
              </div>
              <div className="card bg-gradient-to-br from-amber-50 to-white">
                <div className="text-sm text-gray-500 mb-1">Reste à encaisser</div>
                <div className="text-2xl font-bold text-amber-600">{formatFCFA(paiementsData.resteAEncaisser)}</div>
                <div className="text-xs text-gray-400 mt-1">{(paiementsData.resteAEncaisser / paiementsData.totalFacture * 100).toFixed(1)}% du total</div>
              </div>
            </div>
          </motion.section>

          {/* === NOUVEAUX GRAPHIQUES === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ✅ A. Performance d'encaissement */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Performance d'encaissement</h3>
                      <p className="text-sm text-gray-500">Écart facturé vs encaissé</p>
                    </div>
                  </div>
                </div>
                <ChartBox
                  title=""
                  icon={<ArrowUpDown size={18} />}
                  data={paiementsData.journaliers}
                  dataKey1="facture"
                  dataKey2="encaisse"
                  type="line"
                  color1="#472EAD"
                  color2="#10B981"
                  theme="light"
                />
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600" />
                    <span className="text-xs text-gray-600">Facturé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-xs text-gray-600">Encaissé</span>
                  </div>
                </div>
              </div>

              {/* ✅ B. Rotation des produits */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <RefreshCw className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Rotation des produits</h3>
                    <p className="text-sm text-gray-500">Produits à faible rotation</p>
                  </div>
                </div>
                <ChartBox
                  title=""
                  icon={<Package size={18} />}
                  data={produitsData.rotationData}
                  dataKey1="rotation"
                  type="bar"
                  color1="#F59E0B"
                  theme="light"
                />
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Seuil critique &lt; 10% de rotation
                </div>
              </div>
            </div>
          </motion.section>

          {/* === RÉPARTITION DES PAIEMENTS & ANALYSE PRODUITS === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition des paiements */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CircleDollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Répartition des paiements</h3>
                      <p className="text-sm text-gray-500">Par mode de règlement</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Total: {formatFCFA(paiementsData.totalEncaissement)}</div>
                </div>
                <ChartBox
                  title=""
                  icon={<CreditCard size={18} />}
                  data={paiementsData.parType}
                  dataKey1="value"
                  type="pie"
                  colors={["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"]}
                  theme="light"
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {paiementsData.parType.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{item.pourcentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ✅ C. Répartition des clients par segment */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Répartition des clients</h3>
                    <p className="text-sm text-gray-500">Par segment</p>
                  </div>
                </div>
                <ChartBox
                  title=""
                  icon={<Users size={18} />}
                  data={clientsData.parSegment}
                  dataKey1="value"
                  type="pie"
                  colors={["#472EAD", "#F58020", "#10B981", "#3B82F6"]}
                  theme="light"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {clientsData.parSegment.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* === TOP PRODUITS & FOURNISSEURS === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top produits vendus */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Top produits vendus</h3>
                      <p className="text-sm text-gray-500">Classement par chiffre d'affaires</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {produitsData.topVentes.slice(0, 5).map((produit, index) => (
                    <div key={produit.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{produit.nom}</div>
                          <div className="text-xs text-gray-500">{produit.quantite} ventes</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatFCFA(produit.ca)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fournisseurs */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <Truck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Fournisseurs</h3>
                      <p className="text-sm text-gray-500">Aperçu des approvisionnements</p>
                    </div>
                  </div>
                  <div className="text-sm text-indigo-600 font-medium">MOIS</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="text-2xl font-bold text-gray-900">{fournisseursData.actifs}</div>
                    <div className="text-sm text-gray-500">Fournisseurs actifs</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="text-2xl font-bold text-gray-900">{fournisseursData.enAttente}</div>
                    <div className="text-sm text-gray-500">En attente</div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-3">Dernières commandes</h4>
                <div className="space-y-3">
                  {fournisseursData.dernieresCommandes.slice(0, 3).map((cmd) => (
                    <div key={cmd.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{cmd.fournisseur}</div>
                        <div className="text-xs text-gray-500">{cmd.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatFCFA(cmd.montant)}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                          cmd.statut === 'livrée' ? 'bg-green-100 text-green-700' :
                          cmd.statut === 'en cours' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {cmd.statut}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* === TABLEAU PRODUITS PERFORMANTS === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Produits performants</h3>
                </div>
                <div className="text-sm text-gray-500">Mois en cours</div>
              </div>

              <TableWidget
                title=""
                color="#472EAD"
                theme="light"
                columns={[
                  { label: "Rang", key: "rank", render: (v) => (
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      v === 1 ? 'bg-amber-100 text-amber-700' :
                      v === 2 ? 'bg-gray-100 text-gray-700' :
                      v === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {v}
                    </div>
                  )},
                  { label: "Produit", key: "name" },
                  { label: "Ventes", key: "sales", render: (v) => <span className="font-medium">{v} unités</span> },
                  { label: "Revenus", key: "revenue", render: (v) => formatFCFA(v) },
                  { label: "Croissance", key: "growth", render: (v) => (
                    <span className={`font-medium ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {v >= 0 ? '+' : ''}{v}%
                    </span>
                  )},
                ]}
                data={produitsData.topVentes.map((p, index) => ({
                  rank: index + 1,
                  name: p.nom,
                  sales: p.quantite,
                  revenue: p.ca,
                  growth: [42, 28, -5, 67, 33][index]
                }))}
              />
            </div>
          </motion.section>

          {/* === FOOTER === */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-6 border-t border-gray-200"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Système opérationnel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Données en temps réel</span>
                </div>
              </div>
            </div>
          </motion.footer>
        </motion.div>
      </div>
    </div>
  );
}
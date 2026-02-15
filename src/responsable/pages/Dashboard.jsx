// ==========================================================
// 🌟 Dashboard.jsx — VERSION AVEC ANALYSE PRODUITS AVANCÉE
// Design adapté à votre palette de couleurs
// UI/UX améliorée avec skeleton loading et réorganisation
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  Banknote,
  Shield,
  Activity,
  Bell,
  Zap,
  Star,
  Download,
  AlertTriangle,
  UserCog,
  UserCheck,
  Truck,
  PieChart,
  Wallet,
  Layers,
  RefreshCw,
  TrendingDown,
  Award,
  Sparkles,
  User,
  Store,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// === Components réutilisables ===
import ChartBox from "../components/ChartBox";

// === Hooks ===
import useDashboardResponsable from "@/hooks/useDashboardResponsable";

// === Helper functions ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

// ==========================================================
// 🎨 COMPOSANTS SKELETON
// ==========================================================

const SkeletonStat = () => (
  <div className="card bg-white p-4 rounded-xl shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
      <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
    </div>
    <div className="h-7 w-28 bg-gray-200 animate-pulse rounded mb-2" />
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />
      <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
    </div>
  </div>
);

const SkeletonProductItem = () => (
  <div className="flex items-center justify-between p-3 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-lg" />
      <div>
        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-1" />
        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
    <div className="text-right">
      <div className="h-5 w-20 bg-gray-200 animate-pulse rounded mb-1" />
      <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
    </div>
  </div>
);

const SkeletonFournisseurItem = () => (
  <div className="flex items-center justify-between p-3 rounded-lg">
    <div>
      <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-1" />
      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
    </div>
    <div className="text-right">
      <div className="h-5 w-20 bg-gray-200 animate-pulse rounded mb-1" />
      <div className="h-4 w-16 bg-gray-200 animate-pulse rounded ml-auto" />
    </div>
  </div>
);

// ==========================================================
// 🎨 STYLES STATIQUES POUR LES ALERTES (évite les classes dynamiques)
// ==========================================================

const alertStyles = {
  red: {
    border: "border-red-500",
    bg: "bg-red-100",
    text: "text-red-600",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    iconBg: "bg-red-100",
    iconColor: "text-red-600"
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-100",
    text: "text-orange-600",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600"
  },
  green: {
    border: "border-green-500",
    bg: "bg-green-100",
    text: "text-green-600",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    iconBg: "bg-green-100",
    iconColor: "text-green-600"
  }
};

// ==========================================================
// 🏢 COMPOSANT PRINCIPAL — DASHBOARD
// ==========================================================

export default function Dashboard() {
  const {
    loading,
    isRefreshing,
    ventes,
    finance,
    clients,
    produits,
    alertesStock,
    utilisateurs,
    fournisseurs,
    activiteGlobale
  } = useDashboardResponsable();
  
  const [firstLoad, setFirstLoad] = useState(
    !sessionStorage.getItem("dashboard_welcome_seen")
  );

  // Animation variants pour les sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const sectionVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
    hover: { 
      scale: 1.02, 
      transition: { type: "spring", stiffness: 400, damping: 25 },
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
  };

  // Déterminer si on a des données
  const hasData =
    !!ventes ||
    !!finance ||
    !!clients ||
    !!produits ||
    !!alertesStock;

  // Skeleton uniquement au premier chargement sans aucune donnée
  const showSkeletons = loading && !hasData;

  // Calcul sécurisé du stock total
  const stockTotal = (produits?.stockData ?? []).reduce((acc, p) => acc + (p.stock || 0), 0);
  
  // Welcome loading uniquement au premier chargement
  const showWelcomeLoading = firstLoad && loading;

  // Mettre à jour firstLoad quand les données sont chargées
  useEffect(() => {
    if (!loading && hasData && firstLoad) {
      sessionStorage.setItem("dashboard_welcome_seen", "true");
      setFirstLoad(false);
    }
  }, [loading, hasData, firstLoad]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="p-4 lg:p-6">
        {/* Container principal */}
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {showWelcomeLoading ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center h-[70vh]"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    delay: 0.1 
                  }}
                  className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/50 backdrop-blur-sm shadow-xl"
                >
                  {/* Logo LPD avec animation de pulse */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    {/* Cercle de fond animé */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-[#472EAD]/20 rounded-full blur-xl"
                    />
                    
                    {/* Logo SVG avec ombre */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="70"
                      height="45"
                      viewBox="0 0 200 120"
                      fill="none"
                      className="relative drop-shadow-2xl"
                    >
                      <ellipse cx="100" cy="60" rx="90" ry="45" fill="#472EAD" />
                      <text
                        x="50%"
                        y="66%"
                        textAnchor="middle"
                        fill="#F58020"
                        fontFamily="Arial Black, sans-serif"
                        fontSize="60"
                        fontWeight="900"
                        dy=".1em"
                      >
                        LPD
                      </text>
                    </svg>
                  </motion.div>

                  {/* Message avec effet de fade */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-gray-700 font-medium text-lg mb-1">
                      Tableau de bord
                    </p>
                    <p className="text-gray-500 text-sm">
                      Chargement de vos données...
                    </p>
                  </motion.div>

                  {/* Barre de progression améliorée */}
                  <div className="w-48 space-y-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="h-full bg-gradient-to-r from-[#472EAD] to-[#F58020] rounded-full"
                      />
                    </div>
                    
                    {/* Points de progression animés */}
                    <div className="flex justify-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-[#472EAD]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Message de statut dynamique */}
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-xs text-gray-400 mt-2"
                  >
                    Préparation de votre espace...
                  </motion.p>
                </motion.div>
              </motion.div>
            ) : (
              /* Contenu du dashboard - toujours visible */
              <motion.div
                key="dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* === HEADER === */}
                <motion.section variants={sectionVariants} className="space-y-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 mb-2"
                      >
                        <Sparkles className="w-6 h-6 text-[#472EAD]" />
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                          Tableau de bord
                        </h1>
                      </motion.div>
                      <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 max-w-2xl"
                      >
                        Aperçu global de votre activité. Données mises à jour en temps réel.
                      </motion.p>
                      <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xs text-gray-400 mt-1"
                      >
                        
                      </motion.p>
                    </div>

                  </div>
                </motion.section>

                {/* === CARTES ÉQUIPE === */}
                <motion.section variants={sectionVariants}>
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {/* Carte Vendeurs */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="card relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#472EAD]"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-[#472EAD]/10 rounded-full -translate-y-6 translate-x-6 opacity-50" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg bg-[#472EAD]/10">
                            <User className="w-6 h-6 text-[#472EAD]" />
                          </div>
                          <div className="px-3 py-1 rounded-full bg-[#472EAD]/10 text-[#472EAD] text-xs font-medium">
                            COMMERCIAL
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="text-3xl font-bold text-gray-900">
                            {showSkeletons ? (
                              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              utilisateurs?.vendeurs ?? 0
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">Vendeurs actifs</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <UserCheck size={14} className="text-green-600" />
                          <span>Équipe commerciale</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Carte Caissiers */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="card relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-6 translate-x-6 opacity-50" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                            CAISSE
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="text-3xl font-bold text-gray-900">
                            {showSkeletons ? (
                              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              utilisateurs?.caissiers ?? 0
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">Caissiers actifs</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Banknote size={14} className="text-green-600" />
                          <span>Équipe caisse</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Carte Gestionnaires boutique */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="card relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-full -translate-y-6 translate-x-6 opacity-50" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-lg bg-amber-100">
                            <Store className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                            MANAGEMENT
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="text-3xl font-bold text-gray-900">
                            {showSkeletons ? (
                              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              utilisateurs?.gestionnaires ?? 0
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">Gestionnaires boutique</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Settings size={14} className="text-green-600" />
                          <span>Supervision</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.section>

                {/* === FLUX FINANCIER RÉEL === */}
                <motion.section variants={sectionVariants}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-50">
                      <Wallet className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Flux financier réel</h2>
                  </div>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {showSkeletons ? (
                      <>
                        <div className="card bg-white p-6 rounded-xl shadow-sm h-24 animate-pulse" />
                        <div className="card bg-white p-6 rounded-xl shadow-sm h-24 animate-pulse" />
                        <div className="card bg-white p-6 rounded-xl shadow-sm h-24 animate-pulse" />
                      </>
                    ) : (
                      [
                        {
                          bg: "from-[#472EAD]/5 to-white",
                          label: "Total facturé",
                          value: formatFCFA(finance?.totalFacture ?? 0),
                          suffix: "Somme des commandes",
                          valueColor: "text-gray-900"
                        },
                        {
                          bg: "from-green-50 to-white",
                          label: "Total encaissé",
                          value: formatFCFA(finance?.totalEncaissement ?? 0),
                          suffix: "Paiements reçus",
                          valueColor: "text-green-600"
                        },
                        {
                          bg: "from-amber-50 to-white",
                          label: "Reste à encaisser",
                          value: formatFCFA(finance?.resteAEncaisser ?? 0),
                          suffix: finance?.totalFacture
                            ? `${((finance.resteAEncaisser / finance.totalFacture) * 100).toFixed(1)}% du total`
                            : "0% du total",
                          valueColor: "text-amber-600"
                        }
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          variants={cardVariants}
                          whileHover="hover"
                          className={`card bg-gradient-to-br ${item.bg} p-6 rounded-xl shadow-sm`}
                        >
                          <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                          <div className={`text-2xl font-bold ${item.valueColor}`}>{item.value}</div>
                          <div className="text-xs text-gray-400 mt-1">{item.suffix}</div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                </motion.section>

                {/* === ALERTES STOCK === */}
                <motion.section variants={sectionVariants}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-50">
                      <Bell className="w-5 h-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Alertes Stock</h2>
                    <span className="text-xs text-gray-400 ml-2">Basé sur {alertesStock?.totalProduits ?? 0} produits actifs</span>
                  </div>

                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {showSkeletons ? (
                      <>
                        <div className="card bg-white p-6 rounded-xl shadow-sm h-32 animate-pulse" />
                        <div className="card bg-white p-6 rounded-xl shadow-sm h-32 animate-pulse" />
                        <div className="card bg-white p-6 rounded-xl shadow-sm h-32 animate-pulse" />
                      </>
                    ) : (
                      [
                        {
                          color: "red",
                          icon: AlertTriangle,
                          title: "Produits en rupture",
                          value: alertesStock?.rupture ?? 0,
                          badge: "CRITIQUE",
                          description: "Stock = 0 - Réapprovisionnement urgent"
                        },
                        {
                          color: "orange",
                          icon: Bell,
                          title: "Produits sous seuil",
                          value: alertesStock?.sousSeuil ?? 0,
                          badge: "ATTENTION",
                          description: "Stock < seuil minimum - À surveiller"
                        },
                        {
                          color: "green",
                          icon: Shield,
                          title: "Produits en stock normal",
                          value: alertesStock?.normal ?? 0,
                          badge: "OK",
                          description: "Stock > seuil - Situation stable"
                        }
                      ].map((alerte, index) => {
                        const styles = alertStyles[alerte.color];
                        const IconComponent = alerte.icon;
                        
                        return (
                          <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover="hover"
                            className={`card relative overflow-hidden border-l-4 ${styles.border} bg-white p-6 rounded-xl shadow-sm`}
                          >
                            <div className={`absolute top-0 right-0 w-20 h-20 ${styles.bg} rounded-full -translate-y-6 translate-x-6 opacity-50`} />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                                  <IconComponent className={`w-6 h-6 ${styles.iconColor}`} />
                                </div>
                                <div className={`px-2 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText} text-xs font-medium`}>
                                  {alerte.badge}
                                </div>
                              </div>
                              <div className="mb-2">
                                <div className="text-3xl font-bold text-gray-900">{alerte.value}</div>
                                <div className="text-gray-500 text-sm">{alerte.title}</div>
                              </div>
                              <div className="text-xs text-gray-400 mt-2">
                                {alerte.description}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                </motion.section>

                {/* === GRAPHIQUES CÔTE À CÔTE === */}
                <motion.section variants={sectionVariants}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Commandes par statut */}
                    <motion.div 
                      variants={cardVariants}
                      whileHover="hover"
                      className="card bg-white p-6 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-[#472EAD]/10">
                            <PieChart className="w-5 h-5 text-[#472EAD]" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Commandes par statut</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {(ventes?.commandesParStatut ?? []).reduce((acc, curr) => acc + curr.value, 0) || 0}
                        </div>
                      </div>
                      {showSkeletons ? (
                        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
                      ) : (
                        <ChartBox
                          title=""
                          icon={<ShoppingBag size={18} />}
                          data={ventes?.commandesParStatut ?? []}
                          dataKey1="value"
                          type="pie"
                          colors={["#10B981", "#F59E0B", "#3B82F6", "#EF4444"]}
                          theme="light"
                        />
                      )}
                    </motion.div>

                    {/* Activité business globale - maintenant côte à côte avec Commandes par statut */}
                    <motion.div 
                      variants={cardVariants}
                      whileHover="hover"
                      className="card bg-white p-6 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50">
                          <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Activité business globale</h3>
                          <p className="text-sm text-gray-500">Vue d'ensemble des transactions</p>
                        </div>
                      </div>
                      
                      {showSkeletons ? (
                        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
                      ) : (
                        <ChartBox
                          title=""
                          icon={<Activity size={18} />}
                          data={activiteGlobale ?? []}
                          dataKey1="value"
                          type="pie"
                          colors={["#472EAD", "#10B981", "#3B82F6", "#F58020"]}
                          theme="light"
                        />
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {showSkeletons ? (
                          <>
                            <div className="h-6 bg-gray-200 animate-pulse rounded" />
                            <div className="h-6 bg-gray-200 animate-pulse rounded" />
                            <div className="h-6 bg-gray-200 animate-pulse rounded" />
                            <div className="h-6 bg-gray-200 animate-pulse rounded" />
                          </>
                        ) : (
                          (activiteGlobale ?? []).map((item, index) => (
                            <motion.div
                              key={item.name ?? index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: ["#472EAD", "#10B981", "#3B82F6", "#F58020"][index % 4] }} 
                                />
                                <span className="text-sm text-gray-600">{item.name}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{item.value}</span>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.section>

                {/* === ANALYSE PRODUITS === */}
                <motion.section variants={sectionVariants}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* TOP 5 BEST SELLERS */}
                    <motion.div 
                      variants={cardVariants}
                      whileHover="hover"
                      className="card bg-white p-6 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#472EAD]/10 to-[#472EAD]/5">
                            <Award className="w-5 h-5 text-[#472EAD]" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Top 5 Best Sellers</h3>
                            <p className="text-sm text-gray-500">Produits les plus vendus (par CA)</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {showSkeletons ? (
                          <>
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                          </>
                        ) : (
                          (produits?.topBestSellers ?? []).map((produit, index) => (
                            <motion.div
                              key={produit.id ?? index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, backgroundColor: "#F9FAFB" }}
                              className="flex items-center justify-between p-3 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                  index === 0 ? 'bg-amber-100 text-amber-700' :
                                  index === 1 ? 'bg-gray-100 text-gray-700' :
                                  index === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{produit.nom}</div>
                                  <div className="text-xs text-gray-500">{produit.categorie || "-"} • {produit.quantiteVendue ?? 0} ventes</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">{formatFCFA(produit.chiffreAffaires ?? 0)}</div>
                                <div className="text-xs text-gray-500">Stock: {produit.stock ?? 0}</div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>

                    {/* PRODUITS LES MOINS VENDUS */}
                    <motion.div 
                      variants={cardVariants}
                      whileHover="hover"
                      className="card bg-white p-6 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-50">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Produits les moins vendus</h3>
                            <p className="text-sm text-gray-500">À surveiller (faible rotation)</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {showSkeletons ? (
                          <>
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                            <SkeletonProductItem />
                          </>
                        ) : (
                          (produits?.topLeastSold ?? []).map((produit, index) => (
                            <motion.div
                              key={produit.id ?? index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, backgroundColor: "#F9FAFB" }}
                              className="flex items-center justify-between p-3 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  produit.indicateur === 'danger' ? 'bg-red-100 text-red-700' :
                                  produit.indicateur === 'warning' ? 'bg-orange-100 text-orange-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{produit.nom}</div>
                                  <div className="text-xs text-gray-500">{produit.categorie || "-"}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">{produit.quantiteVendue ?? 0} ventes</div>
                                <div className={`text-xs flex items-center gap-1 ${
                                  (produit.stock ?? 0) > (produit.seuil ?? 0) * 2 ? 'text-red-600' :
                                  (produit.stock ?? 0) > (produit.seuil ?? 0) ? 'text-orange-600' :
                                  'text-green-600'
                                }`}>
                                  <Package size={12} />
                                  Stock: {produit.stock ?? 0}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.section>


              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
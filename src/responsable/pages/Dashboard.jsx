// ==========================================================
// 🌟 Dashboard.jsx — VERSION ÉLÉGANTE & RAFFINÉE
// Design minimaliste et professionnel
// Police : Inter (optimisée pour dashboards)
// Alertes : couleurs renforcées pour plus d'impact visuel
// Sections alignées sur la même charte colorée
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  Users,
  Banknote,
  Store,
  UserCheck,
  Wallet,
  Bell,
  AlertTriangle,
  Shield,
  Sparkles,
  TrendingUp,
  CreditCard,
  Clock,
  AlertOctagon,
  PackageX,
  PackageMinus,
  PackageCheck,
  ShoppingBag,
  Receipt,
  Building2,
  LineChart,
  DollarSign,
  Hourglass,
  ArrowDownCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// === Hooks ===
import useDashboardResponsable from "@/hooks/useDashboardResponsable";

// === Helper functions ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

// Formatage de la date en français
const formatDate = (date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// ==========================================================
// 🎨 STYLES - CHARTE COLORÉE UNIFIÉE
// ==========================================================

const alertStyles = {
  red: {
    border: "border-red-500",
    bg: "bg-gradient-to-br from-red-50 to-red-100/50",
    text: "text-red-800",
    icon: "text-red-600",
    badge: "bg-red-600 text-white font-semibold shadow-sm",
    iconBg: "bg-red-100",
    lightBg: "bg-red-50",
    hover: "hover:shadow-red-100/50",
    gradient: "from-red-500 to-red-600",
    number: "text-red-700"
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-gradient-to-br from-orange-50 to-amber-100/50",
    text: "text-orange-800",
    icon: "text-orange-600",
    badge: "bg-orange-600 text-white font-semibold shadow-sm",
    iconBg: "bg-orange-100",
    lightBg: "bg-orange-50",
    hover: "hover:shadow-orange-100/50",
    gradient: "from-orange-500 to-amber-600",
    number: "text-orange-700"
  },
  green: {
    border: "border-green-500",
    bg: "bg-gradient-to-br from-green-50 to-emerald-100/50",
    text: "text-green-800",
    icon: "text-green-600",
    badge: "bg-green-600 text-white font-semibold shadow-sm",
    iconBg: "bg-green-100",
    lightBg: "bg-green-50",
    hover: "hover:shadow-green-100/50",
    gradient: "from-green-500 to-emerald-600",
    number: "text-green-700"
  },
  purple: {
    border: "border-[#472EAD]",
    bg: "bg-gradient-to-br from-[#472EAD]/5 to-[#472EAD]/10",
    text: "text-[#472EAD]",
    icon: "text-[#472EAD]",
    badge: "bg-[#472EAD] text-white font-semibold shadow-sm",
    iconBg: "bg-[#472EAD]/10",
    lightBg: "bg-[#472EAD]/5",
    hover: "hover:shadow-[#472EAD]/20",
    gradient: "from-[#472EAD] to-[#6D4FC7]",
    number: "text-[#472EAD]"
  },
  blue: {
    border: "border-blue-500",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    text: "text-blue-800",
    icon: "text-blue-600",
    badge: "bg-blue-600 text-white font-semibold shadow-sm",
    iconBg: "bg-blue-100",
    lightBg: "bg-blue-50",
    hover: "hover:shadow-blue-100/50",
    gradient: "from-blue-500 to-blue-600",
    number: "text-blue-700"
  },
  amber: {
    border: "border-amber-500",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
    text: "text-amber-800",
    icon: "text-amber-600",
    badge: "bg-amber-600 text-white font-semibold shadow-sm",
    iconBg: "bg-amber-100",
    lightBg: "bg-amber-50",
    hover: "hover:shadow-amber-100/50",
    gradient: "from-amber-500 to-amber-600",
    number: "text-amber-700"
  },
  emerald: {
    border: "border-emerald-500",
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
    text: "text-emerald-800",
    icon: "text-emerald-600",
    badge: "bg-emerald-600 text-white font-semibold shadow-sm",
    iconBg: "bg-emerald-100",
    lightBg: "bg-emerald-50",
    hover: "hover:shadow-emerald-100/50",
    gradient: "from-emerald-500 to-emerald-600",
    number: "text-emerald-700"
  },
  // Nouveau style pour les décaissements
  rose: {
    border: "border-rose-500",
    bg: "bg-gradient-to-br from-rose-50 to-rose-100/50",
    text: "text-rose-800",
    icon: "text-rose-600",
    badge: "bg-rose-600 text-white font-semibold shadow-sm",
    iconBg: "bg-rose-100",
    lightBg: "bg-rose-50",
    hover: "hover:shadow-rose-100/50",
    gradient: "from-rose-500 to-rose-600",
    number: "text-rose-700"
  }
};

// ==========================================================
// 🌀 Mini Loader LPD (Top Right)
// ==========================================================

const LPDLoader = ({ visible }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="fixed top-20 right-8 z-50"
    >
      <div className="relative w-14 h-14">
        {/* Cercle animé externe */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
          }}
          className="absolute inset-0 rounded-full border-2 border-t-[#F58020] border-r-transparent border-b-[#472EAD] border-l-transparent"
        />

        {/* Cercle interne */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
          className="absolute inset-2 rounded-full bg-[#472EAD] flex items-center justify-center shadow-lg"
        >
          <span className="text-[11px] font-black text-[#F58020] tracking-wider">
            LPD
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ==========================================================
// 🏢 COMPOSANT PRINCIPAL
// ==========================================================

export default function Dashboard() {
  const {
    loading,
    finance,
    alertesStock,
    utilisateurs,
  } = useDashboardResponsable();
  
  const [firstLoad, setFirstLoad] = useState(
    !sessionStorage.getItem("dashboard_welcome_seen")
  );

  // Date courante
  const [currentDate] = useState(new Date());

  const hasData = !!finance || !!alertesStock || !!utilisateurs;
  const showSkeletons = loading && !hasData;
  const showWelcomeLoading = firstLoad && loading;

  useEffect(() => {
    if (!loading && hasData && firstLoad) {
      sessionStorage.setItem("dashboard_welcome_seen", "true");
      setFirstLoad(false);
    }
  }, [loading, hasData, firstLoad]);

  // Animations subtiles
  const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]" style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Mini loader LPD en haut à droite */}
      <AnimatePresence>
        <LPDLoader visible={loading} />
      </AnimatePresence>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {showWelcomeLoading ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-[70vh]"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-[#472EAD]/20 border-t-[#472EAD] rounded-full animate-spin" />
                </div>
                <p className="text-sm text-gray-500 font-medium tracking-wide">Chargement du tableau de bord</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-10"
            >
              {/* === HEADER RAFFINÉ AVEC DATE === */}
              <motion.div variants={fadeUp} className="mb-8">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#472EAD] tracking-wider uppercase">
                      <div className="w-1 h-4 bg-[#472EAD] rounded-full" />
                      <span>Responsable</span>
                    </div>
                    <div className="flex items-end gap-4">
                      <h1 className="text-3xl font-medium tracking-tight text-gray-900">
                        Tableau de bord
                      </h1>
                      {/* Date courante ajoutée ici */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-200/60 shadow-sm">
                        <Clock className="w-4 h-4 text-[#472EAD]" />
                        <span className="font-medium capitalize">
                          {formatDate(currentDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block">
                    {/* Espace réservé pour d'éventuels actions */}
                  </div>
                </div>
              </motion.div>

              {/* === SECTION ÉQUIPE - VERSION COLORÉE === */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-5 bg-gradient-to-b from-[#472EAD] to-[#6D4FC7] rounded-full" />
                  <h2 className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                    Équipe
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Vendeurs - Style Violet */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.purple.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#472EAD]/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 ${alertStyles.purple.iconBg} rounded-xl`}>
                          <ShoppingBag className={`w-5 h-5 ${alertStyles.purple.icon}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${alertStyles.purple.badge}`}>
                          COMMERCIAL
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-3xl font-bold ${alertStyles.purple.number}`}>
                          {showSkeletons ? <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" /> : utilisateurs?.vendeurs ?? 0}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Vendeurs actifs</div>
                      </div>
                      {utilisateurs?.vendeurs > 0 && (
                        <div className="mt-3 w-full bg-[#472EAD]/10 rounded-full h-1.5">
                          <div 
                            className="bg-[#472EAD] h-1.5 rounded-full" 
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Caissiers - Style Bleu */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.blue.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 ${alertStyles.blue.iconBg} rounded-xl`}>
                          <Receipt className={`w-5 h-5 ${alertStyles.blue.icon}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${alertStyles.blue.badge}`}>
                          CAISSE
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-3xl font-bold ${alertStyles.blue.number}`}>
                          {showSkeletons ? <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" /> : utilisateurs?.caissiers ?? 0}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Caissiers actifs</div>
                      </div>
                      {utilisateurs?.caissiers > 0 && (
                        <div className="mt-3 w-full bg-blue-100 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Gestionnaires - Style Ambre */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.amber.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 ${alertStyles.amber.iconBg} rounded-xl`}>
                          <Building2 className={`w-5 h-5 ${alertStyles.amber.icon}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${alertStyles.amber.badge}`}>
                          MANAGEMENT
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-3xl font-bold ${alertStyles.amber.number}`}>
                          {showSkeletons ? <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" /> : utilisateurs?.gestionnaires ?? 0}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Gestionnaires boutique</div>
                      </div>
                      {utilisateurs?.gestionnaires > 0 && (
                        <div className="mt-3 w-full bg-amber-100 rounded-full h-1.5">
                          <div 
                            className="bg-amber-600 h-1.5 rounded-full" 
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* === SECTION FLUX FINANCIER - VERSION COLORÉE === */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" />
                  <h2 className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                    Flux financier
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {showSkeletons ? (
                    <>
                      <div className="bg-white rounded-2xl p-6 h-24 animate-pulse" />
                      <div className="bg-white rounded-2xl p-6 h-24 animate-pulse" />
                      <div className="bg-white rounded-2xl p-6 h-24 animate-pulse" />
                    </>
                  ) : (
                    <>
                      {/* Total facturé - Style Violet */}
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.purple.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#472EAD]/5 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${alertStyles.purple.iconBg} rounded-xl`}>
                              <LineChart className={`w-4 h-4 ${alertStyles.purple.icon}`} />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">FACTURÉ</span>
                          </div>
                          <div className={`text-2xl font-bold ${alertStyles.purple.number} tracking-tight`}>
                            {formatFCFA(Number(finance?.totalFacture || 0))}
                          </div>
                          {finance?.totalFacture > 0 && (
                            <div className="mt-2 text-[10px] text-gray-400 font-medium">
                              Total des ventes
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Total encaissé - Style Emerald */}
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.emerald.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${alertStyles.emerald.iconBg} rounded-xl`}>
                              <DollarSign className={`w-4 h-4 ${alertStyles.emerald.icon}`} />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">ENCAISSÉ</span>
                          </div>
                          <div className={`text-2xl font-bold ${alertStyles.emerald.number} tracking-tight`}>
                            {formatFCFA(Number(finance?.totalEncaissement || 0))}
                          </div>
                          {finance?.totalEncaissement > 0 && (
                            <div className="mt-2 w-full bg-emerald-100 rounded-full h-1.5">
                              <div 
                                className="bg-emerald-600 h-1.5 rounded-full" 
                                style={{
                                    width: finance?.totalFacture
                                      ? `${(finance.totalEncaissement / finance.totalFacture) * 100}%`
                                      : "0%"
                                  }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Total décaissé - NOUVELLE CARTE (remplace "À encaisser") */}
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.rose.border} shadow-lg hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 ${alertStyles.rose.iconBg} rounded-xl`}>
                              <ArrowDownCircle className={`w-4 h-4 ${alertStyles.rose.icon}`} />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">DÉCAISSÉ</span>
                          </div>
                          <div className={`text-2xl font-bold ${alertStyles.rose.number} tracking-tight`}>
                            {formatFCFA(Number(finance?.totalDecaissement || 0))}
                          </div>
                          {finance?.totalDecaissement > 0 && (
                            <>
                              <div className="text-[10px] text-gray-400 mt-2 font-medium">
                                Total des dépenses
                              </div>
                              <div className="mt-2 w-full bg-rose-100 rounded-full h-1.5">
                                <div 
                                  className="bg-rose-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, (finance.totalDecaissement / finance.totalFacture) * 100)}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* === SECTION ALERTES STOCK - VERSION RENFORCÉE === */}
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-rose-500 to-red-500 rounded-full" />
                    <h2 className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                      Alertes stock
                    </h2>
                  </div>
                  {!showSkeletons && alertesStock?.totalProduits > 0 && (
                    <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 bg-white/80 backdrop-blur-sm border border-gray-200/60 px-3 py-1.5 rounded-full shadow-sm">
                      <span className="text-[#472EAD] font-bold">{alertesStock?.totalProduits ?? 0}</span> produits actifs
                    </span>

                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {showSkeletons ? (
                    <>
                      <div className="bg-white rounded-2xl p-6 h-28 animate-pulse" />
                      <div className="bg-white rounded-2xl p-6 h-28 animate-pulse" />
                      <div className="bg-white rounded-2xl p-6 h-28 animate-pulse" />
                    </>
                  ) : (
                    <>
                      {/* Rupture - Version alarmante */}
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.red.border} shadow-lg hover:shadow-xl transition-all duration-300 ${alertStyles.hover}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 ${alertStyles.red.iconBg} rounded-xl`}>
                              <PackageX className={`w-5 h-5 ${alertStyles.red.icon}`} />
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${alertStyles.red.badge} flex items-center gap-1`}>
                              <AlertOctagon className="w-3 h-3" />
                              URGENT
                            </span>
                          </div>
                          <div className={`text-3xl font-bold ${alertStyles.red.number} mb-1`}>
                            {alertesStock?.rupture ?? 0}
                          </div>
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            <span>Produits en rupture</span>
                            {alertesStock?.rupture > 0 && (
                              <span className="text-red-500 text-[10px] font-bold">• Action requise</span>
                            )}
                          </div>
                          {alertesStock?.rupture > 0 && (
                            <div className="mt-3 w-full bg-red-100 rounded-full h-1.5">
                              <div 
                                className="bg-red-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, (alertesStock.rupture / alertesStock.totalProduits) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Sous seuil - Version attention */}
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.orange.border} shadow-lg hover:shadow-xl transition-all duration-300 ${alertStyles.hover}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 ${alertStyles.orange.iconBg} rounded-xl`}>
                              <PackageMinus className={`w-5 h-5 ${alertStyles.orange.icon}`} />
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${alertStyles.orange.badge} flex items-center gap-1`}>
                              <AlertTriangle className="w-3 h-3" />
                              ATTENTION
                            </span>
                          </div>
                          <div className={`text-3xl font-bold ${alertStyles.orange.number} mb-1`}>
                            {alertesStock?.sousSeuil ?? 0}
                          </div>
                          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
                            <span>Produits sous seuil</span>
                            {alertesStock?.sousSeuil > 0 && (
                              <span className="text-orange-500 text-[10px] font-bold">• À réapprovisionner</span>
                            )}
                          </div>
                          {alertesStock?.sousSeuil > 0 && (
                            <div className="mt-3 w-full bg-orange-100 rounded-full h-1.5">
                              <div 
                                className="bg-orange-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, (alertesStock.sousSeuil / alertesStock.totalProduits) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Stock normal - Version rassurante */}
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`relative overflow-hidden bg-white rounded-2xl p-6 border-l-4 ${alertStyles.green.border} shadow-lg hover:shadow-xl transition-all duration-300 ${alertStyles.hover}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 ${alertStyles.green.iconBg} rounded-xl`}>
                              <PackageCheck className={`w-5 h-5 ${alertStyles.green.icon}`} />
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${alertStyles.green.badge} flex items-center gap-1`}>
                              <Shield className="w-3 h-3" />
                              STABLE
                            </span>
                          </div>
                          <div className={`text-3xl font-bold ${alertStyles.green.number} mb-1`}>
                            {alertesStock?.normal ?? 0}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            Produits en stock normal
                          </div>
                          {alertesStock?.normal > 0 && (
                            <div className="mt-3 w-full bg-green-100 rounded-full h-1.5">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, (alertesStock.normal / alertesStock.totalProduits) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Message d'alerte global si nécessaire */}
                {!showSkeletons && (alertesStock?.rupture > 0 || alertesStock?.sousSeuil > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl mt-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          {alertesStock?.rupture > 0 
                            ? `${alertesStock.rupture} produit(s) en rupture immédiate` 
                            : `${alertesStock?.sousSeuil} produit(s) sous seuil critique`}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {alertesStock?.rupture > 0 
                            ? "Réapprovisionnement requis en urgence pour éviter les ruptures de vente."
                            : "Prévoyez un réapprovisionnement dans les plus brefs délais."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// ==========================================================
// 🌟 Dashboard.jsx — VERSION SIMPLIFIÉE
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
// 📊 DONNÉES BUSINESS
// ==========================================================

// Données ventes
const salesData = [
  { name: "Lun", ventes: 320, revenus: 65000, croissance: 12.5 },
  { name: "Mar", ventes: 410, revenus: 82000, croissance: 8.3 },
  { name: "Mer", ventes: 380, revenus: 76000, croissance: 15.2 },
  { name: "Jeu", ventes: 470, revenus: 92000, croissance: 24.7 },
  { name: "Ven", ventes: 520, revenus: 98000, croissance: 18.6 },
  { name: "Sam", ventes: 390, revenus: 71000, croissance: 9.8 },
  { name: "Dim", ventes: 260, revenus: 52000, croissance: 3.2 },
];

// Données stock
const stockData = [
  { name: "Produit A", value: 42, color: "#472EAD" },
  { name: "Produit B", value: 36, color: "#F58020" },
  { name: "Produit C", value: 28, color: "#10B981" },
  { name: "Produit D", value: 14, color: "#3B82F6" },
];

// Clients VIP
const clients = [
  { id: 1, nom: "Entreprise Alpha", type: "Entreprise", dette: 245000, transactions: 12, rating: 9.8 },
  { id: 2, nom: "Startup Beta", type: "Startup", dette: 187500, transactions: 8, rating: 9.2 },
  { id: 3, nom: "Corp Gamma", type: "Corporate", dette: 312000, transactions: 15, rating: 8.7 },
  { id: 4, nom: "Group Delta", type: "Multinational", dette: 129000, transactions: 6, rating: 9.5 },
  { id: 5, nom: "Company Epsilon", type: "Enterprise", dette: 298000, transactions: 11, rating: 8.9 },
];

// Alertes
const alerts = [
  { id: 1, type: "danger", message: "Stock critique détecté", time: "Il y a 2 min", produit: "Produit A" },
  { id: 2, type: "warning", message: "Paiement en retard", time: "Il y a 15 min", client: "Client X" },
  { id: 3, type: "info", message: "Nouvelle commande importante", time: "Il y a 1 h", montant: "450 000 FCFA" },
  { id: 4, type: "success", message: "Objectif mensuel atteint", time: "Il y a 3 h", details: "+15%" },
];

// Activités récentes
const activities = [
  { action: "Nouvelle vente enregistrée", user: "Vendeur #42", time: "Il y a 3 min", module: "Ventes" },
  { action: "Paiement reçu", user: "Caissier #7", time: "Il y a 27 min", module: "Trésorerie" },
  { action: "Nouveau client ajouté", user: "Responsable", time: "Il y a 2 h", module: "Clients" },
  { action: "Commande fournisseur validée", user: "Acheteur", time: "Hier", module: "Fournisseurs" },
  { action: "Mise à jour système", user: "Admin", time: "Il y a 2 jours", module: "Système" },
];

// Top produits
const topProducts = [
  { rank: 1, name: "Produit Premium", sales: 120, revenue: 2500000, growth: 42 },
  { rank: 2, name: "Solution Entreprise", sales: 95, revenue: 1890000, growth: 28 },
  { rank: 3, name: "Service Standard", sales: 78, revenue: 1560000, growth: -5 },
  { rank: 4, name: "Kit Démarrage", sales: 60, revenue: 1200000, growth: 67 },
  { rank: 5, name: "Abonnement Mensuel", sales: 55, revenue: 1100000, growth: 33 },
];

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

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm text-gray-500">CA du jour</span>
                </div>
                <div className="text-xl font-bold text-gray-900">850 000 FCFA</div>
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
                <div className="text-xl font-bold text-gray-900">24</div>
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
                <div className="text-xl font-bold text-gray-900">142</div>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+5 cette semaine</span>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-500">Performance</span>
                </div>
                <div className="text-xl font-bold text-gray-900">94%</div>
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">Optimale</span>
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
                    <div className="text-2xl font-bold text-gray-900">12.4M</div>
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
                    <div className="text-2xl font-bold text-gray-900">48</div>
                    <div className="text-gray-500 text-sm">Clients actifs</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-600 text-sm font-medium">+18.3%</span>
                    <span className="text-gray-400 text-sm ml-auto">croissance</span>
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
                    <div className="text-2xl font-bold text-gray-900">3.2M</div>
                    <div className="text-gray-500 text-sm">Trésorerie nette</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-600" />
                    <span className="text-cyan-600 text-sm font-medium">+12.5%</span>
                    <span className="text-gray-400 text-sm ml-auto">stabilisé</span>
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
                      NIVEAU
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-gray-900">847</div>
                    <div className="text-gray-500 text-sm">Unités en stock</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm font-medium">94%</span>
                    <span className="text-gray-400 text-sm ml-auto">optimal</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* === GRAPHIQUES === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique Ventes */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Évolution des ventes</h3>
                </div>
                <ChartBox
                  title=""
                  icon={<TrendingUp size={18} />}
                  data={salesData}
                  dataKey1="ventes"
                  dataKey2="revenus"
                  type="line"
                  color1="#472EAD"
                  color2="#F58020"
                  theme="light"
                />
              </div>

              {/* Graphique Stock */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Répartition du stock</h3>
                  <div className="text-sm text-gray-500">Total: 120 unités</div>
                </div>
                <ChartBox
                  title=""
                  icon={<Package size={18} />}
                  data={stockData}
                  dataKey1="value"
                  type="pie"
                  colors={["#472EAD", "#F58020", "#10B981", "#3B82F6"]}
                  theme="light"
                />
              </div>
            </div>
          </motion.section>

          {/* === ALERTES === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Bell className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Alertes récentes</h3>
                    <p className="text-sm text-gray-500">Actions requises</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {alerts.length} non lues
                </div>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`p-4 rounded-lg border ${
                      alert.type === 'danger' ? 'bg-red-50 border-red-200' :
                      alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                      alert.type === 'info' ? 'bg-blue-50 border-blue-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        alert.type === 'danger' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-amber-500' :
                        alert.type === 'info' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{alert.message}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-500">{alert.time}</span>
                          {alert.produit && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {alert.produit}
                            </span>
                          )}
                          {alert.client && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {alert.client}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="p-1 hover:bg-white rounded">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* === CLIENTS & ACTIVITÉS === */}
          <motion.section variants={itemVariants} className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clients VIP */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-gray-900">Top Clients</h3>
                  </div>
                  <div className="text-sm text-amber-600 font-medium">VIP</div>
                </div>

                <div className="space-y-4">
                  {clients.map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          <span className="font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{client.nom}</div>
                          <div className="text-sm text-gray-500">{client.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatFCFA(client.dette)}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-3 h-3 text-amber-500" />
                          {client.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activités récentes */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Activités récentes</h3>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">EN DIRECT</div>
                </div>

                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                      <div className={`p-2 rounded-lg ${
                        activity.module === 'Ventes' ? 'bg-purple-100 text-purple-600' :
                        activity.module === 'Trésorerie' ? 'bg-green-100 text-green-600' :
                        activity.module === 'Clients' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.module === 'Ventes' && <ShoppingBag className="w-4 h-4" />}
                        {activity.module === 'Trésorerie' && <Banknote className="w-4 h-4" />}
                        {activity.module === 'Clients' && <Users className="w-4 h-4" />}
                        {activity.module === 'Fournisseurs' && <Package className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.action}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">{activity.user}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {activity.module}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* === TABLEAU PRODUITS === */}
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
                data={topProducts}
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
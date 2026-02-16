// src/gestionnaire-depot/pages/Dashboard.jsx
import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import "../styles/depot-fix.css";

import {
  MdShoppingCart,
  MdCompareArrows,
  MdLocalShipping,
  MdWarning,
  MdCheckCircle,
  MdArrowDownward,
  MdArrowUpward
} from "react-icons/md";

import {
  HiArrowTrendingUp,
  HiBellAlert,
} from "react-icons/hi2";

import { useStock } from "./StockContext";
import useAuth from "../../hooks/useAuth";

const Dashboard = () => {
  const { products, movements, fournisseurs, loading } = useStock();
  const { user } = useAuth();

  const userName = useMemo(() => {
    if (!user) return "Gestionnaire";
    if (user.prenom && user.nom) return `${user.prenom} ${user.nom}`;
    if (user.name) return user.name;
    if (user.nom) return user.nom;
    return "Gestionnaire";
  }, [user]);

  const stats = useMemo(() => {
    const totalProduits = products.length;

    const produitsAvecStockGlobal = products.map(p => ({
      ...p,
      stockGlobal: (p.nombre_carton || 0) * (p.unite_carton || 1)
    }));

    const produitsSains = produitsAvecStockGlobal.filter(
      p => p.stockGlobal > (p.stock_seuil || 0)
    ).length;

    const pourcentageSain = totalProduits > 0
      ? Math.round((produitsSains / totalProduits) * 100)
      : 0;

    const ruptureStricte = produitsAvecStockGlobal.filter(
      p => p.stockGlobal === 0
    ).length;

    const stockFaible = produitsAvecStockGlobal.filter(
      p => p.stockGlobal > 0 && p.stockGlobal < (p.stock_seuil || 0)
    ).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const mouvementsDuJour = movements.filter(m => {
      const dateStr = m.date ? new Date(m.date).toISOString().split('T')[0] : '';
      return dateStr === todayStr;
    }).length;

    const nbFournisseurs = fournisseurs.length;

    return {
      totalProduits,
      ruptureStricte,
      stockFaible,
      pourcentageSain,
      mouvements: mouvementsDuJour,
      fournisseurs: nbFournisseurs,
    };
  }, [products, movements, fournisseurs]);

  const recentActivity = useMemo(() => {
    const sorted = [...movements].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0);
      const dateB = new Date(b.date || b.created_at || 0);
      return dateB - dateA;
    });
    return sorted.slice(0, 3);
  }, [movements]);

  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const dateFormatted = today.toLocaleDateString("fr-FR", options);

  const formatDateRelative = (dateString) => {
    if (!dateString) return "Récemment";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="depot-page flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#472EAD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="depot-page space-y-8 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-[#472EAD] to-[#F97316] rounded-full"></span>
            Tableau de bord Dépôt
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenue, <span className="font-semibold text-[#472EAD]">{userName}</span> – Gestionnaire Dépôt
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-gray-600 font-medium">{dateFormatted}</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Produits en Stock</p>
            <div className="p-2 bg-purple-100 rounded-xl">
              <MdShoppingCart className="text-purple-700" size={22} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProduits}</p>
          <p className="text-xs text-gray-400 mt-2">Total référencé</p>
          <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-purple-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Stock Optimal</p>
            <div className="p-2 bg-green-100 rounded-xl">
              <HiArrowTrendingUp className="text-green-600" size={22} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pourcentageSain}%</p>
          <p className="text-xs text-green-600 mt-2">Produits en bonne santé</p>
          <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-[68%] bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Mouvements Aujourd'hui</p>
            <div className="p-2 bg-blue-100 rounded-xl">
              <MdCompareArrows className="text-blue-500" size={22} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.mouvements}</p>
          <p className="text-xs text-gray-400 mt-2">Entrées & sorties</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-blue-600">+{Math.floor(stats.mouvements * 0.6)} entrées</span>
            <span className="text-xs text-orange-600">-{Math.floor(stats.mouvements * 0.4)} sorties</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Fournisseurs</p>
            <div className="p-2 bg-green-100 rounded-xl">
              <MdLocalShipping className="text-green-600" size={22} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.fournisseurs}</p>
          <p className="text-xs text-gray-400 mt-2">Partenaires actifs</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
            {stats.fournisseurs} fournisseurs
          </div>
        </div>
      </div>

      {/* ACTIVITÉ + ALERTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-[#472EAD] rounded-full"></div>
            Activité Récente
          </h2>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Aucun mouvement récent.</p>
            ) : (
              recentActivity.map((mouv, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      mouv.type === 'Entrée' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {mouv.type === 'Entrée' ? (
                        <MdArrowUpward className="text-green-600" size={18} />
                      ) : (
                        <MdArrowDownward className="text-orange-600" size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {mouv.type === 'Entrée' ? "Réception" : "Sortie"} de Stock
                      </p>
                      <p className="text-xs text-gray-500">
                        {mouv.quantite} unités — {mouv.motif || `Produit #${mouv.produit_id}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
                    {formatDateRelative(mouv.date || mouv.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
            Alertes & Notifications
          </h2>
          <div className="space-y-3">
            {stats.ruptureStricte > 0 && (
              <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <HiBellAlert className="text-red-700" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-red-700">Produits en rupture</p>
                    <p className="text-sm text-red-600 mt-1">
                      <strong>{stats.ruptureStricte}</strong> produit(s) à 0 stock
                    </p>
                  </div>
                </div>
              </div>
            )}
            {stats.stockFaible > 0 && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <MdWarning className="text-orange-700" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-700">Produits sous seuil</p>
                    <p className="text-sm text-orange-600 mt-1">
                      <strong>{stats.stockFaible}</strong> produit(s) atteignent la limite
                    </p>
                  </div>
                </div>
              </div>
            )}
            {stats.ruptureStricte === 0 && stats.stockFaible === 0 && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <MdCheckCircle className="text-green-700" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700">Stock OK</p>
                    <p className="text-sm text-green-600 mt-1">Tous les niveaux sont bons</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
          Actions Rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <NavLink
            to="/gestionnaire_depot/products"
            className="group flex items-center justify-between p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 hover:border-purple-400 transition-all hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition">Gestion des Produits</p>
              <p className="text-xs text-gray-500 mt-1">Gérer inventaire & stocks</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition flex items-center justify-center">
              <MdShoppingCart className="text-purple-700" size={24} />
            </div>
          </NavLink>

          <NavLink
            to="/gestionnaire_depot/movementStock"
            className="group flex items-center justify-between p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 hover:border-orange-400 transition-all hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition">Mouvements de Stock</p>
              <p className="text-xs text-gray-500 mt-1">Entrées & sorties</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition flex items-center justify-center">
              <MdCompareArrows className="text-orange-500" size={24} />
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
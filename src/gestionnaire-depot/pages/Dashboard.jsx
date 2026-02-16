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

const Dashboard = () => {
  const { products, movements, fournisseurs, loading } = useStock();

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
    <div className="depot-page space-y-6">
      {/* HEADER */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Tableau de bord Dépôt
          </h1>
          <p className="text-xs text-gray-500">
            Bienvenue, Modou Ndiaye – Gestionnaire Dépôt
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Aujourd'hui · {dateFormatted}
        </p>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Produits en Stock</p>
            <MdShoppingCart className="text-purple-700" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalProduits}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total référencé</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Stock Optimal</p>
            <HiArrowTrendingUp className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.pourcentageSain}%
          </p>
          <p className="text-xs text-green-600 mt-1">Produits en bonne santé</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Mouvements Aujourd'hui</p>
            <MdCompareArrows className="text-blue-500" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.mouvements}</p>
          <p className="text-xs text-gray-500 mt-1">Entrées & sorties</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Fournisseurs</p>
            <MdLocalShipping className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.fournisseurs}</p>
          <p className="text-xs text-gray-500 mt-1">Partenaires actifs</p>
        </div>
      </div>

      {/* ACTIVITÉ + ALERTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Activité Récente</h2>
          <div className="space-y-4 text-sm">
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-xs italic">Aucun mouvement récent.</p>
            ) : (
              recentActivity.map((mouv, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0">
                  <div className="flex gap-3">
                    {mouv.type === 'Entrée' ? (
                      <MdArrowUpward className="text-green-600 mt-1" size={18} />
                    ) : (
                      <MdArrowDownward className="text-orange-600 mt-1" size={18} />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {mouv.type === 'Entrée' ? "Réception" : "Sortie"} de Stock
                      </p>
                      <p className="text-xs text-gray-500">
                        {mouv.quantite} unités — {mouv.motif || `Produit #${mouv.produit_id}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDateRelative(mouv.date || mouv.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Alertes & Notifications</h2>
          <div className="space-y-3 text-xs">
            {stats.ruptureStricte > 0 && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-3">
                <div className="flex items-center gap-2">
                  <HiBellAlert className="text-red-700" size={18} />
                  <p className="font-semibold text-red-700">Produits en rupture</p>
                </div>
                <p className="text-red-600 mt-1">
                  <strong>{stats.ruptureStricte}</strong> produit(s) à 0 stock
                </p>
              </div>
            )}
            {stats.stockFaible > 0 && (
              <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-3">
                <div className="flex items-center gap-2">
                  <MdWarning className="text-orange-700" size={18} />
                  <p className="font-semibold text-orange-700">Produits sous seuil</p>
                </div>
                <p className="text-orange-600 mt-1">
                  <strong>{stats.stockFaible}</strong> produit(s) atteignent la limite
                </p>
              </div>
            )}
            {stats.ruptureStricte === 0 && stats.stockFaible === 0 && (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-3">
                <div className="flex items-center gap-2">
                  <MdCheckCircle className="text-green-700" size={18} />
                  <p className="font-semibold text-green-700">Stock OK</p>
                </div>
                <p className="text-green-600 mt-1">Tous les niveaux sont bons</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <NavLink
            to="/gestionnaire_depot/products"
            className="flex items-center justify-between border rounded-lg px-6 py-4 text-left 
              transition hover:bg-purple-100 hover:border-purple-400"
          >
            <div>
              <p className="font-medium text-gray-900">Gestion des Produits</p>
              <p className="text-xs text-gray-500">Gérer inventaire & stocks</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <MdShoppingCart className="text-purple-700" size={22} />
            </div>
          </NavLink>

          <NavLink
            to="/gestionnaire_depot/movementStock"
            className="flex items-center justify-between border rounded-lg px-6 py-4 text-left 
              transition hover:bg-orange-100 hover:border-orange-400"
          >
            <div>
              <p className="font-medium text-gray-900">Mouvements de Stock</p>
              <p className="text-xs text-gray-500">Entrées & sorties</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <MdCompareArrows className="text-orange-500" size={22} />
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
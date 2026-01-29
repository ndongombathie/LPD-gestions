// src/gestionnaire-depot/pages/Dashboard.jsx

import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../styles/depot-fix.css";
// 👇 IMPORT DE L'API
import { produitsAPI } from "../../services/api/produits"; 

import {
  MdShoppingCart,
  MdCompareArrows,
  MdLocalShipping,
  MdWarning,
  MdCheckCircle,
} from "react-icons/md";

import {
  HiArrowTrendingUp,
  HiBellAlert,
  HiClock,
} from "react-icons/hi2";

const Dashboard = () => {
  // --- ÉTATS (Données dynamiques) ---
  const [stats, setStats] = useState({
    totalProduits: 0,
    ruptureStricte: 0, // Stock = 0
    stockFaible: 0,    // 0 < Stock <= Seuil
    pourcentageSain: 0,
    livraisons: 8,      // Statique (Fournisseurs)
    mouvements: 23      // Statique
  });
  
  const [loading, setLoading] = useState(true);

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. On lance les requêtes
        const [allProductsData, rupturesData] = await Promise.all([
          produitsAPI.getAll(),
          produitsAPI.getRuptures()
        ]);

        // 2. Traitement des listes
        const productsList = Array.isArray(allProductsData) ? allProductsData : allProductsData.data || [];
        const rupturesList = Array.isArray(rupturesData) ? rupturesData : rupturesData.data || [];

        // 3. Gestion du Total (Fix Pagination)
        const vraiTotal = allProductsData.meta?.total || allProductsData.total || productsList.length;

        // 4. Calculs "Stock Optimal" (Temporaire avant API backend)
        const totalEchantillon = productsList.length;
        const produitsSains = productsList.filter(p => p.stock_global > p.stock_seuil).length;
        const pourcentageSain = totalEchantillon > 0 
          ? Math.round((produitsSains / totalEchantillon) * 100) 
          : 0;

        // 5. Distinction Rupture vs Sous Seuil
        const nbRuptureStricte = rupturesList.filter(p => p.stock_global <= 0).length;
        const nbStockFaible = rupturesList.filter(p => p.stock_global > 0).length; 

        // 6. Mise à jour de l'état
        setStats(prev => ({
          ...prev,
          totalProduits: vraiTotal,
          ruptureStricte: nbRuptureStricte,
          stockFaible: nbStockFaible,
          pourcentageSain: pourcentageSain
        }));

      } catch (error) {
        console.error("❌ Erreur chargement dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // --- Date dynamique ---
  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const dateFormatted = today.toLocaleDateString("fr-FR", options);

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
          Aujourd&apos;hui · {dateFormatted}
        </p>
      </div>

      {/* QUICK STATS (Cartes du haut) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* 1. Produits en Stock */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Produits en Stock</p>
            <MdShoppingCart className="text-purple-700" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.totalProduits}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total référencé
          </p>
        </div>

        {/* 2. Stock Optimal */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Stock Optimal</p>
            <HiArrowTrendingUp className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.pourcentageSain}%
          </p>
          <p className="text-xs text-green-600 mt-1">
            Produits en bonne santé
          </p>
        </div>

        {/* 3. Mouvements */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Mouvements Aujourd&apos;hui</p>
            <MdCompareArrows className="text-blue-500" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.mouvements}</p>
          <p className="text-xs text-gray-500 mt-1">Entrées & sorties</p>
        </div>

        {/* 4. Fournisseurs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Fournisseurs</p>
            <MdLocalShipping className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.livraisons}</p>
          <p className="text-xs text-gray-500 mt-1">15 livraisons ce mois</p>
        </div>
      </div>

      {/* --- ACTIVITÉ + ALERTES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVITÉ (Filtrée : Que Entrées / Sorties) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Activité Récente
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-start border-b pb-3">
              <div className="flex gap-3">
                <HiClock className="text-purple-600 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Réception de marchandise</p>
                  <p className="text-xs text-gray-500">50 cartons – Papeterie Plus</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Il y a 2 heures</p>
            </div>

            <div className="flex justify-between items-start border-b pb-3">
              <div className="flex gap-3">
                <MdShoppingCart className="text-blue-600 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Sortie vers Boutique</p>
                  <p className="text-xs text-gray-500">30 stylos – Dakar Centre</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Il y a 4 heures</p>
            </div>
            
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <MdShoppingCart className="text-blue-600 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Sortie vers Boutique</p>
                  <p className="text-xs text-gray-500">10 Caisses Papier A4</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Hier</p>
            </div>

          </div>
        </div>

        {/* ALERTES & NOTIFICATIONS (Simplifié) */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Alertes & Notifications
          </h2>

          <div className="space-y-3 text-xs">

            {/* CAS 1 : RUPTURE STRICTE (Rouge) */}
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

            {/* CAS 2 : SOUS SEUIL (Orange) */}
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

            {/* CAS 3 : TOUT EST OK (Vert) - Seulement si aucune alerte */}
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
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Actions Rapides
        </h2>

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
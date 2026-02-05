// src/gestionnaire-depot/pages/Dashboard.jsx

import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../styles/depot-fix.css";

// 👇 IMPORT DES API
import { produitsAPI } from "../../services/api/produits"; 
import { mouvementsAPI } from "../../services/api/mouvements"; // 🆕 NOUVEAU

import {
  MdShoppingCart,
  MdCompareArrows,
  MdLocalShipping,
  MdWarning,
  MdCheckCircle,
  MdArrowDownward, // Pour Sortie
  MdArrowUpward    // Pour Entrée
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
    ruptureStricte: 0, 
    stockFaible: 0,    
    pourcentageSain: 0,
    livraisons: 0,      
    mouvements: 0      // 🆕 Deviendra dynamique
  });
  
  const [recentActivity, setRecentActivity] = useState([]); // 🆕 Pour la liste
  const [loading, setLoading] = useState(true);

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. On lance les requêtes (Produits ET Mouvements)
        const [allProductsData, rupturesData, mouvementsData] = await Promise.all([
          produitsAPI.getAll(),
          produitsAPI.getRuptures(),
          mouvementsAPI.getAll() // 🆕 Appel API Mouvements
        ]);

        // 2. Traitement des listes Produits
        const productsList = Array.isArray(allProductsData) ? allProductsData : allProductsData.data || [];
        const rupturesList = Array.isArray(rupturesData) ? rupturesData : rupturesData.data || [];
        
        // 3. Traitement des Mouvements 🆕
        // L'API renvoie souvent { data: [...], meta: ... } ou directement [...]
        const rawMouvements = mouvementsData.data?.data || mouvementsData.data || [];
        
        // Calcul : Mouvements du jour (comparaison de date simple)
        const todayStr = new Date().toISOString().split('T')[0]; // "2024-01-30"
        const mouvementsDuJour = rawMouvements.filter(m => m.date_mouvement && m.date_mouvement.startsWith(todayStr)).length;

        // On garde les 3 derniers pour l'affichage
        const derniersMouvements = rawMouvements.slice(0, 3);


        // --- LOGIQUE EXISTANTE ---
        const vraiTotal = allProductsData.meta?.total || allProductsData.total || productsList.length;

        const totalEchantillon = productsList.length;
        const produitsSains = productsList.filter(p => p.stock_global > p.stock_seuil).length;
        const pourcentageSain = totalEchantillon > 0 
          ? Math.round((produitsSains / totalEchantillon) * 100) 
          : 0;

        const nbRuptureStricte = rupturesList.filter(p => p.stock_global <= 0).length;
        const nbStockFaible = rupturesList.filter(p => p.stock_global > 0).length; 

        // 6. Mise à jour de l'état
        setStats(prev => ({
          ...prev,
          totalProduits: vraiTotal,
          ruptureStricte: nbRuptureStricte,
          stockFaible: nbStockFaible,
          pourcentageSain: pourcentageSain,
          mouvements: mouvementsDuJour // 🆕 Mis à jour
        }));

        setRecentActivity(derniersMouvements); // 🆕 Stockage pour l'affichage

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

  // Fonction utilitaire pour formater la date relative (ex: "Il y a 2h")
  const formatDateRelative = (dateString) => {
    if (!dateString) return "Récemment";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="depot-page space-y-6">

      {/* HEADER */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Tableau de bord Dépôt
          </h1>
          <p className="text-xs text-gray-500">
            Bienvenue, Modou Ndiaye et – Gestionnaire Dépôt
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

        {/* 3. Mouvements (DYNAMIQUE 🆕) */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Mouvements Aujourd&apos;hui</p>
            <MdCompareArrows className="text-blue-500" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.mouvements}</p>
          <p className="text-xs text-gray-500 mt-1">Entrées & sorties</p>
        </div>

        {/* 4. Fournisseurs (Statique pour l'instant) */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Fournisseurs</p>
            <MdLocalShipping className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
          <p className="text-xs text-gray-500 mt-1">Partenaires actifs</p>
        </div>
      </div>

      {/* --- ACTIVITÉ + ALERTES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVITÉ (DYNAMIQUE 🆕) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Activité Récente
          </h2>

          <div className="space-y-4 text-sm">
            
            {/* Si chargement ou vide */}
            {!loading && recentActivity.length === 0 && (
                <p className="text-gray-400 text-xs italic">Aucun mouvement récent.</p>
            )}

            {/* LISTE DYNAMIQUE */}
            {recentActivity.map((mouv, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0">
                    <div className="flex gap-3">
                        {/* Icône change selon Entrée ou Sortie */}
                        {mouv.type === 'entree' ? (
                            <MdArrowUpward className="text-green-600 mt-1" size={18} />
                        ) : (
                            <MdArrowDownward className="text-orange-600 mt-1" size={18} />
                        )}
                        
                        <div>
                            <p className="font-medium text-gray-900">
                                {mouv.type === 'entree' ? "Réception" : "Sortie"} de Stock
                            </p>
                            <p className="text-xs text-gray-500">
                                {/* Affiche le nom du produit s'il est dispo, sinon l'ID */}
                                {mouv.quantite} unités — {mouv.motif || `Produit #${mouv.produit_id}`}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        {formatDateRelative(mouv.date_mouvement)}
                    </p>
                </div>
            ))}

          </div>
        </div>

        {/* ALERTES & NOTIFICATIONS (Déjà dynamique) */}
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

            {/* CAS 3 : TOUT EST OK (Vert) */}
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
// src/gestionnaire-depot/pages/Dashboard.jsx

import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/depot-fix.css";  // <-- IMPORT AJOUTÉ

import {
  MdShoppingCart,
  MdTrendingUp,
  MdCompareArrows,
  MdLocalShipping,
  MdWarning,
  MdInventory,
} from "react-icons/md";

import {
  HiArrowTrendingUp,
  HiBellAlert,
  HiClock,
} from "react-icons/hi2";

const Dashboard = () => {
  // --- Date dynamique ---
  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const dateFormatted = today.toLocaleDateString("fr-FR", options);

  return (
    <div className="depot-page space-y-6">  {/* <-- CLASSE AJOUTÉE */}

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

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Produit */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Produits en Stock</p>
            <MdShoppingCart className="text-purple-700" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">150</p>
          <p className="text-xs text-red-500 mt-1">12 en stock faible</p>
        </div>

        {/* Niveau Stock */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Niveau Stock Moyen</p>
            <HiArrowTrendingUp className="text-orange-500" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">72%</p>
          <p className="text-xs text-orange-500 mt-1">3 produits critiques</p>
        </div>

        {/* Mouvements */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Mouvements Aujourd&apos;hui</p>
            <MdCompareArrows className="text-blue-500" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">23</p>
          <p className="text-xs text-gray-500 mt-1">Entrées & sorties</p>
        </div>

        {/* Fournisseurs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Fournisseurs</p>
            <MdLocalShipping className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
          <p className="text-xs text-gray-500 mt-1">15 livraisons ce mois</p>
        </div>
      </div>

      {/* --- ACTIVITÉ + ALERTES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVITÉ */}
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

            <div className="flex justify-between items-start border-b pb-3">
              <div className="flex gap-3">
                <MdWarning className="text-red-500 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Stock faible détecté</p>
                  <p className="text-xs text-gray-500">Classeurs (moins de 5)</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Il y a 1 jour</p>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <MdInventory className="text-orange-500 mt-1" size={18} />
                <div>
                  <p className="font-medium text-gray-900">Inventaire planifié</p>
                  <p className="text-xs text-gray-500">
                    Prévu vendredi
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Il y a 3 jours</p>
            </div>

          </div>
        </div>

        {/* ALERTES */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Alertes & Notifications
          </h2>

          <div className="space-y-3 text-xs">

            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-3">
              <div className="flex items-center gap-2">
                <HiBellAlert className="text-red-700" size={18} />
                <p className="font-semibold text-red-700">Rupture de stock</p>
              </div>
              <p className="text-red-600 mt-1">3 produits à réapprovisionner</p>
            </div>

            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-3">
              <div className="flex items-center gap-2">
                <MdLocalShipping className="text-blue-700" size={18} />
                <p className="font-semibold text-blue-700">Livraisons attendues</p>
              </div>
              <p className="text-blue-600 mt-1">2 cette semaine</p>
            </div>

            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-3">
              <div className="flex items-center gap-2">
                <HiArrowTrendingUp className="text-green-700" size={18} />
                <p className="font-semibold text-green-700">Stock optimal</p>
              </div>
              <p className="text-green-600 mt-1">85% des produits OK</p>
            </div>

          </div>
        </div>
      </div>

      {/* 🔥 ACTIONS RAPIDES AVEC REDIRECTION */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Actions Rapides
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

          {/* ➤ Redirection vers Produits */}
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

          {/* ➤ Redirection vers Mouvements */}
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
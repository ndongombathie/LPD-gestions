// src/gestionnaire-depot/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../styles/depot-fix.css";
import { produitsAPI } from "../../services/api/produits";
import { fournisseursAPI } from "../../services/api/fournisseurs";
import {
  MdShoppingCart,
  MdLocalShipping,
  // MdCompareArrows a été supprimé
} from "react-icons/md";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProduits: 0,
    fournisseurs: 0,
    produitsRupture: 0,
    produitsFaible: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger toutes les statistiques en parallèle
        const [
          nbProduits,
          nbFournisseurs,
          nbRupture,
          nbFaible
        ] = await Promise.allSettled([
          produitsAPI.getNbProduits(),
          fournisseursAPI.getNombre(),
          produitsAPI.getNbProduitsEnRupture(),
          produitsAPI.getNbProduitsSousSeuil()
        ]);

        // Fonction pour extraire les valeurs
        const extractValue = (result, defaultValue = 0) => {
          if (result.status === 'fulfilled' && result.value !== undefined) {
            const data = result.value;
            if (typeof data === 'number') return data;
            if (data?.count !== undefined) return data.count;
            if (data?.data !== undefined) return data.data;
            return data ?? defaultValue;
          }
          return defaultValue;
        };

        setStats({
          totalProduits: extractValue(nbProduits),
          fournisseurs: extractValue(nbFournisseurs),
          produitsRupture: extractValue(nbRupture),
          produitsFaible: extractValue(nbFaible)
        });

      } catch (err) {
      
        setError("Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  const dateFormatted = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (error) {
    return (
      <div className="depot-page p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
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
            Bienvenue, Gestionnaire Dépôt
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Aujourd'hui · {dateFormatted}
        </p>
      </div>

      {/* STATISTIQUES PRINCIPALES - 2 CARTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Produits */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Produits en Stock</p>
            <MdShoppingCart className="text-purple-700" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.totalProduits}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total référencé</p>
        </div>

        {/* Fournisseurs */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Fournisseurs</p>
            <MdLocalShipping className="text-green-600" size={22} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? "..." : stats.fournisseurs}
          </p>
          <p className="text-xs text-gray-500 mt-1">Partenaires actifs</p>
        </div>
      </div>

      {/* ALERTES STOCK */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Alertes Stock
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rupture */}
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <p className="font-semibold text-red-700">Produits en rupture</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {loading ? "..." : stats.produitsRupture}
            </p>
            <p className="text-xs text-red-600 mt-1">Stock épuisé</p>
          </div>

          {/* Faible */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <p className="font-semibold text-yellow-700">Stock faible</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {loading ? "..." : stats.produitsFaible}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Sous le seuil minimum</p>
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
            className="flex items-center justify-between border rounded-lg px-6 py-4 text-left transition hover:bg-purple-100 hover:border-purple-400"
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
            className="flex items-center justify-between border rounded-lg px-6 py-4 text-left transition hover:bg-orange-100 hover:border-orange-400"
          >
            <div>
              <p className="font-medium text-gray-900">Mouvements de Stock</p>
              <p className="text-xs text-gray-500">Entrées & sorties</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              {/* Remplacé par une alternative sans icône ou avec une autre icône */}
              <span className="text-orange-500 font-bold">↔️</span>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
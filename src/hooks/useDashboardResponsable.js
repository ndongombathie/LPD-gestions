// ==========================================================
// 📊 useDashboardResponsable.js
// ==========================================================
//
// Hook central du dashboard Responsable
//
// RESPONSABILITÉS :
// ✅ appeler dashboardResponsableAPI
// ✅ transformer les données backend
// ✅ produire KPI, stats et datasets graphiques
// ✅ refresh automatique silencieux
// ✅ refresh intelligent (update seulement si data change)
//
// ❌ aucune logique UI ici
//
// Dashboard.jsx = affichage uniquement
// ==========================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { dashboardResponsableAPI } from "@/services/api/dashboardResponsable";

// ======================================================
// 🧠 HELPERS
// ======================================================

const createSignature = (data) => JSON.stringify(data);

// ======================================================
// 🚀 HOOK PRINCIPAL
// ======================================================

export default function useDashboardResponsable() {

  // ✅ loading = UNIQUEMENT premier chargement
  const [loading, setLoading] = useState(true);

  // ✅ refresh API silencieux (skeleton cards)
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);

  const lastSignatureRef = useRef(null);

  // ==================================================
  // 📥 FETCH + REFRESH AUTOMATIQUE INTELLIGENT
  // ==================================================

  useEffect(() => {
    let intervalId;

    const load = async (isRefresh = false) => {
      try {

        // ✅ premier chargement
        if (!isRefresh && !rawData) {
          setLoading(true);
        }

        // ✅ refresh silencieux
        if (isRefresh) {
          setIsRefreshing(true);
        }

        const data = await dashboardResponsableAPI.getDashboardData();

        const newSignature = createSignature(data);

        // si aucune modification → on ne rerender pas
        if (lastSignatureRef.current === newSignature) {
          return;
        }

        lastSignatureRef.current = newSignature;
        setRawData(data);

      } catch (e) {
        console.error("Erreur dashboard hook:", e);
        setError(e);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    // premier chargement
    load(false);

    // refresh automatique toutes les 30s
    intervalId = setInterval(() => {
      load(true);
    }, 30000);

    return () => clearInterval(intervalId);

  }, []);

  // ==================================================
  // 🟣 VENTES / COMMANDES
  // ==================================================

  const ventes = useMemo(() => {
    if (!rawData) return null;

    const parStatut = Object.entries(
      rawData.ventes.commandesParStatut || {}
    ).map(([name, value]) => ({
      name,
      value
    }));

    return {
      total: rawData.ventes.chiffreAffaireTotal,
      caJour: rawData.ventes.caJour,
      totalCommandes: rawData.ventes.totalCommandes,
      commandesParStatut: parStatut
    };

  }, [rawData]);

  // ==================================================
  // 💰 FINANCE
  // ==================================================

  const finance = useMemo(() => {
    if (!rawData) return null;

    const totalFacture = rawData.ventes.chiffreAffaireTotal;
    const totalDecaissements = rawData.decaissements.total;

    return {
      totalFacture,
      totalEncaissement: totalFacture - totalDecaissements,
      resteAEncaisser: totalDecaissements
    };

  }, [rawData]);

  // ==================================================
  // 👥 CLIENTS
  // ==================================================

  const clients = useMemo(() => {
    if (!rawData) return null;

    return {
      total: rawData.clients.total,
      topClients: rawData.clients.topClients
    };

  }, [rawData]);

  // ==================================================
  // 📦 STOCK & ALERTES
  // ==================================================

  const alertesStock = useMemo(() => {
    if (!rawData) return null;

    const produits = rawData.produits.stockData || [];

    const rupture = produits.filter(p => p.stock === 0).length;

    const sousSeuil = produits.filter(
      p => p.stock > 0 && p.stock < p.seuil
    ).length;

    const normal = produits.filter(
      p => p.stock >= p.seuil
    ).length;

    return {
      rupture,
      sousSeuil,
      normal,
      totalProduits: produits.length
    };

  }, [rawData]);

  // ==================================================
  // 🏆 PRODUITS
  // ==================================================

  const produits = useMemo(() => {
    if (!rawData) return null;

    const data = rawData.produits.stockData || [];

    const topBestSellers = [...data]
      .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires)
      .slice(0, 5);

    const topLeastSold = [...data]
      .sort((a, b) => a.chiffreAffaires - b.chiffreAffaires)
      .slice(0, 5);

    return {
      stockData: data,
      topBestSellers,
      topLeastSold
    };

  }, [rawData]);

  // ==================================================
  // 🧑‍💼 UTILISATEURS
  // ==================================================

  const utilisateurs = useMemo(() => {
    if (!rawData) return null;
    return rawData.utilisateurs;
  }, [rawData]);

  // ==================================================
  // 🚚 FOURNISSEURS
  // ==================================================

  const fournisseurs = useMemo(() => {
    if (!rawData) return null;
    return rawData.fournisseurs;
  }, [rawData]);

  // ==================================================
  // 📊 ACTIVITÉ GLOBALE
  // ==================================================

  const activiteGlobale = useMemo(() => {
    if (!rawData) return [];

    return [
      { name: "Ventes", value: rawData.ventes.totalCommandes },
      { name: "Clients", value: rawData.clients.total },
      { name: "Produits", value: rawData.produits.stockData.length },
      { name: "Fournisseurs", value: rawData.fournisseurs.total }
    ];

  }, [rawData]);

  // ==================================================
  // ✅ RETURN FINAL
  // ==================================================

  return {
    loading,        // premier chargement uniquement
    isRefreshing,   // refresh API silencieux
    error,
    ventes,
    finance,
    clients,
    produits,
    alertesStock,
    utilisateurs,
    fournisseurs,
    activiteGlobale
  };
}

// ==========================================================
// 📊 Dashboard.jsx — ERP STABLE CLEAN VERSION
// Sans graphique — Architecture durable production
// ==========================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowDownUp,
  Store,
  Warehouse,
} from "lucide-react";

import dashboardAPI from "@/services/api/dashboard";

/* ================= SAFE UTILS ================= */

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fcfa = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(toNumber(n));

/* ========================================================== */

export default function DashboardComptable() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    nombreProduits: 0,
    quantiteTotale: 0,
    nombreVersements: 0,
    sommeVersements: 0,
    sommeEncaissements: 0,
  });

  const [loading, setLoading] = useState(true);

  /* ================= FETCH API ================= */

  useEffect(() => {

    let mounted = true;

    const fetchDashboard = async () => {
      try {

        const data = await dashboardAPI.getDashboardStats();

        if (!mounted) return;

        setStats({
          nombreProduits: toNumber(data?.nombreProduits),
          quantiteTotale: toNumber(data?.quantiteTotale),
          nombreVersements: toNumber(data?.nombreVersements),
          sommeVersements: toNumber(data?.sommeVersements),
          sommeEncaissements: toNumber(data?.sommeEncaissements),
        });

      } catch (error) {
        console.error("Erreur dashboard:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };

  }, []);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Chargement du tableau de bord...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-8 w-full min-w-0">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Tableau de bord comptable
        </h1>
        <p className="text-sm text-gray-500">
          Vue stratégique des flux financiers
        </p>
      </div>

      {/* ================= CARTES ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <DashboardCard
          title="Encaissements"
          value={fcfa(stats.sommeEncaissements)}
          subtitle="Total des paiements"
          icon={Wallet}
          color="bg-emerald-50 text-emerald-600"
        />

        <DashboardCard
          title="Versements"
          value={fcfa(stats.sommeVersements)}
          subtitle={`Nombre : ${stats.nombreVersements}`}
          icon={ArrowDownUp}
          color="bg-indigo-50 text-indigo-600"
          onClick={() =>
            navigate("/comptable/controle-caissier/historique-versements")
          }
        />

        <DashboardCard
          title="Produits Dépôt"
          value={stats.nombreProduits}
          subtitle={`Quantité totale : ${stats.quantiteTotale}`}
          icon={Warehouse}
          color="bg-orange-50 text-orange-600"
        />

        <DashboardCard
          title="Produits Boutique"
          value={stats.quantiteTotale}
          subtitle="Stock global"
          icon={Store}
          color="bg-sky-50 text-sky-600"
        />

      </div>

      {/* ================= BLOC ANALYSE ================= */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">

        <h2 className="text-sm font-semibold text-[#472EAD] mb-2">
          Analyse financière
        </h2>

        <p className="text-sm text-gray-600">
          Les encaissements s’élèvent à{" "}
          <span className="font-semibold">
            {fcfa(stats.sommeEncaissements)}
          </span>{" "}
          pour un total de{" "}
          <span className="font-semibold">
            {stats.nombreVersements}
          </span>{" "}
          versement(s) enregistré(s).
        </p>

      </div>

    </div>
  );
}

/* ================= CARD ================= */

function DashboardCard({ title, value, subtitle, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        cursor-pointer
        bg-white
        rounded-2xl
        shadow-md
        p-5
        transition-all
        hover:shadow-lg
        hover:-translate-y-1
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase">
            {title}
          </p>
          <p className="text-lg font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>

        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center ${color}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
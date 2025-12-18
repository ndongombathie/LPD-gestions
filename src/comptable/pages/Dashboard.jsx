// ==========================================================
// 📊 Dashboard.jsx — Comptable (REDIRECTIONS OK + GRAPHE)
// ==========================================================

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowDownUp,
  Store,
  Warehouse,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// ===============================
// 🔧 MOCK (remplacé plus tard par API)
// ===============================
const stats = {
  caisseJour: 325000,
  actionsBoutique: 12,
  actionsDepot: 7,
};

// ===============================
// 🔧 FORMAT FCFA
// ===============================
const fcfa = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(n || 0);

export default function DashboardComptable() {
  const navigate = useNavigate();

  // ===============================
  // 🔁 LECTURE DES VERSEMENTS
  // ===============================
  const versements = useMemo(() => {
    return JSON.parse(localStorage.getItem("versements")) || [];
  }, []);

  // ===============================
  // 📊 AGRÉGATION PAR DATE
  // ===============================
  const versementsParJour = useMemo(() => {
    const map = {};

    versements.forEach((v) => {
      map[v.date] = (map[v.date] || 0) + Number(v.montant);
    });

    return Object.keys(map).map((date) => ({
      date,
      montant: map[date],
    }));
  }, [versements]);

  // ===============================
  // 📊 TOTAL VERSEMENTS
  // ===============================
  const totalVersements = versements.reduce(
    (s, v) => s + Number(v.montant),
    0
  );

  return (
    <div className="space-y-8">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Tableau de bord comptable
        </h1>
        <p className="text-sm text-gray-500">
          Vue rapide sur la caisse, les versements et la gestion
        </p>
      </div>

      {/* ================= CARTES (2 x 2) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* JOURNAL CAISSE */}
        <DashboardCard
          title="Caisse du jour"
          value={fcfa(stats.caisseJour)}
          subtitle="Total journalier"
          icon={Wallet}
          color="bg-emerald-50 text-emerald-600"
          onClick={() =>
            navigate("/comptable/controle-caissier/caisse")
          }
        />

        {/* VERSEMENTS */}
        <DashboardCard
          title="Versements"
          value={fcfa(totalVersements)}
          subtitle="Total enregistré"
          icon={ArrowDownUp}
          color="bg-indigo-50 text-indigo-600"
          onClick={() =>
            navigate("/comptable/controle-caissier/historique-versements")
          }
        />

        {/* BOUTIQUE */}
        <DashboardCard
          title="Gestion Boutique"
          value={stats.actionsBoutique}
          subtitle="Actions enregistrées"
          icon={Store}
          color="bg-sky-50 text-sky-600"
          onClick={() =>
            navigate("/comptable/controle-gestionnaire/boutique")
          }
        />

        {/* DEPOT */}
        <DashboardCard
          title="Gestion Dépôt"
          value={stats.actionsDepot}
          subtitle="Actions enregistrées"
          icon={Warehouse}
          color="bg-orange-50 text-orange-600"
          onClick={() =>
            navigate("/comptable/controle-gestionnaire/depot")
          }
        />
      </div>

      {/* ================= GRAPHE DES VERSEMENTS ================= */}
      <div className="bg-white rounded-xl shadow border p-5">
        <h2 className="text-sm font-semibold text-[#472EAD] mb-1">
          Évolution des versements
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Total des versements enregistrés par jour
        </p>

        {versementsParJour.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={versementsParJour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v) => fcfa(v)} />
                <Line
                  type="monotone"
                  dataKey="montant"
                  stroke="#472EAD"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-10">
            Aucun versement enregistré
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= CARTE ================= */
function DashboardCard({ title, value, subtitle, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl shadow border p-4
                 hover:shadow-lg hover:-translate-y-1 transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase">
            {title}
          </p>
          <p className="text-lg font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>

        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

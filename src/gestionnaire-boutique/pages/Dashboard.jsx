import React from "react";
import { stats, recentActivities, alerts } from "../data/staticData";
import CardStat from "../components/CardStat";

const Dashboard = () => {
  return (
    <div>
      {/* ❌ ENLEVER : h-screen overflow-hidden et pt-[100px] */}
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Tableau de bord boutique</h2>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <CardStat title="Produits en stock" value={stats.produitsEnStock} color="bg-[#472EAD]" />
        <CardStat title="Produits en rupture" value={stats.produitsEnRupture} color="bg-[#F58020]" />
        <CardStat title="Demandes en cours" value={stats.transfertsEnCours} color="bg-[#472EAD]" />
        <CardStat title="Nombre total de produits" value={stats.nbrProduits} color="bg-[#F58020]" />
      </div>

      {/* Activités et alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activité récente */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
          <ul className="space-y-3">
            {recentActivities.map((act, idx) => (
              <li key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <span className="text-gray-900">{act.text}</span>
                <span className="text-sm text-gray-500">{act.time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alertes */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alertes & Notifications</h3>
            <button
              onClick={() => window.location.href = "/gestionnaire/alertes"}
              className="text-sm px-3 py-1 bg-[#472EAD] text-white rounded hover:bg-[#331f7a] transition"
            >
              Voir alertes
            </button>
          </div>

          <p className="text-sm text-red-600 font-medium mb-3">7 produits sont en alerte</p>

          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-3 border-l-4 border-[#472EAD] bg-gray-50 rounded">
                <div className="text-gray-900 font-medium">{alert.text}</div>
                <div className="text-sm text-gray-500">{alert.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
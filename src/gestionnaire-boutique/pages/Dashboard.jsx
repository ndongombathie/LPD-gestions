import React from "react";
import { stats, recentActivities, alerts } from "../data/staticData";
import CardStat from "../components/CardStat";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <div className="h-screen overflow-hidden">
      {/* Navbar intégrée */}
      <div className="fixed top-0 left-64 right-0 h-16 bg-white z-50 shadow">
        <Navbar />
      </div>

      {/* Contenu sous la navbar */}
      <div className="pt-[100px] px-6 h-full">
        <h2 className="text-3xl font-bold text-[#111827] mb-6">Tableau de bord boutique</h2>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <CardStat title="Produits en stock" value={stats.produitsEnStock} color="bg-[#472EAD]" />
          <CardStat title="Produits en rupture" value={stats.produitsEnRupture} color="bg-[#F58020]" />
          <CardStat title="Demandes en cours" value={stats.transfertsEnCours} color="bg-[#472EAD]" />
          <CardStat title="Nombre total de produits" value={stats.nbrProduits} color="bg-[#F58020]" />
        </div>

        {/* Activités et alertes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Activité récente</h3>
            <ul className="space-y-3">
              {recentActivities.map((act, idx) => (
                <li key={idx} className="p-3 bg-[#F3F4F6] rounded-lg flex justify-between items-center">
                  <span className="text-[#111827]">{act.text}</span>
                  <span className="text-sm text-gray-500">{act.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Alertes & Notifications</h3>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="p-3 border-l-4 border-[#472EAD] bg-[#F3F4F6] rounded">
                  <div className="text-[#111827] font-medium">{alert.text}</div>
                  <div className="text-sm text-gray-500">{alert.subtext}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

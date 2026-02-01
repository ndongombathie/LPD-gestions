import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, TrendingUp, Package, CheckCircle, BarChart3 } from "lucide-react";
import CardStat from "../components/CardStat";
import * as api from "../services/apiMock";

const Dashboard = () => {
  const [transferts, setTransferts] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      api.fetchTransferts(),
      api.fetchHistorique(),
      api.fetchStocks(),
    ]).then(([t, h, s]) => {
      if (!mounted) return;
      setTransferts(t);
      setHistorique(h);
      setStocks(s);
      setLoading(false);
    });
    return () => (mounted = false);
  }, []);

  // Calculer les stats dynamiques (totaux cohérents)
  const transfertsTotal = transferts.length;
  const transfertsEnAttente = transferts.filter(t => t.statut === "en_attente").length;
  const transfertsValides = transfertsTotal - transfertsEnAttente; // complément pour rester logique

  const stats = {
    produitsEnStock: stocks.filter(s => s.quantite > s.seuil).length,
    produitsEnRupture: stocks.filter(s => s.quantite === 0).length,
    transfertsEnCours: transfertsEnAttente,
    transfertsValides,
    transfertsTotal,
    nbrProduits: stocks.length,
    quantiteTotale: stocks.reduce((sum, s) => sum + (s.quantite * s.nbr_pieces), 0),
    valeurStock: stocks.reduce((sum, s) => sum + (s.quantite * s.nbr_pieces * (s.prix_gros || 0)), 0),
  };

  // Récentes activités
  const recentActivities = historique.slice(0, 5).map(h => ({
    text: `${h.action} - ${h.produit}`,
    time: new Date(h.date).toLocaleDateString("fr-FR"),
    statut: h.statut,
  }));

  // Alertes
  const alertes = stocks
    .filter(s => s.quantite <= s.seuil)
    .slice(0, 5)
    .map(s => ({
      text: s.nom,
      subtext: `Quantité: ${s.quantite * s.nbr_pieces} (Seuil: ${s.seuil})`,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
              <TrendingUp size={32} className="text-[#472EAD]" />
              Tableau de bord boutique
            </h2>
            <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (window.location.href = "/gestionnaire_boutique/historique")}
              className="px-4 py-2 bg-white text-[#472EAD] border border-[#472EAD] rounded-lg hover:bg-[#F7F5FF] font-medium shadow-sm"
            >
              Voir l'historique
            </button>
            <button
              onClick={() => (window.location.href = "/gestionnaire_boutique/alertes")}
              className="px-4 py-2 bg-[#F58020] text-white rounded-lg hover:bg-[#e67e1a] font-medium shadow-sm"
            >
              Voir les alertes
            </button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 my-4 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardStat title="En stock" value={stats.produitsEnStock} color="bg-green-600" icon={CheckCircle} />
          <CardStat title="Rupture" value={stats.produitsEnRupture} color="bg-red-600" icon={AlertTriangle} />
          <CardStat title="À compléter" value={stats.transfertsEnCours} color="bg-[#F58020]" icon={Package} subtitle={`${stats.transfertsTotal} transferts reçus`} />
          <CardStat title="Complétés" value={stats.transfertsValides} color="bg-[#472EAD]" icon={TrendingUp} />
        </div>


        {/* Activités et alertes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activité récente */}
          <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <Activity size={20} className="text-[#472EAD]" />
              Activité récente
            </h3>
            {loading ? (
              <p className="text-gray-600 text-sm">Chargement...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-gray-600 text-sm">Aucune activité</p>
            ) : (
              <ul className="space-y-3">
                {recentActivities.map((act, idx) => (
                  <li key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start border-l-4 border-[#472EAD]">
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm font-medium">{act.text}</p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                        act.statut === "validé" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {act.statut}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">{act.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Alertes */}
          <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#F58020]" />
                Alertes & Notifications
              </h3>
              <button
                onClick={() => (window.location.href = "/gestionnaire_boutique/alertes")}
                className="text-sm px-3 py-1 bg-[#F58020] text-white rounded hover:bg-[#e67e1a] transition"
              >
                Ouvrir
              </button>
            </div>

            {loading ? (
              <p className="text-gray-600 text-sm">Chargement...</p>
            ) : alertes.length === 0 ? (
              <p className="text-green-600 text-sm font-medium">✓ Aucune alerte de stock</p>
            ) : (
              <>
                <p className="text-sm text-red-600 font-medium mb-3">{alertes.length} produit(s) en alerte</p>
                <div className="space-y-2">
                  {alertes.map((alert, idx) => (
                    <button
                      key={idx}
                      onClick={() => (window.location.href = "/gestionnaire_boutique/alertes")}
                      className="w-full text-left p-3 border-l-4 border-[#F58020] bg-orange-50 rounded hover:bg-orange-100 transition"
                    >
                      <div className="text-gray-900 font-medium text-sm flex items-center gap-2">
                        <AlertTriangle size={16} className="text-[#F58020]" />
                        {alert.text}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{alert.subtext}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transferts en attente */}
        {!loading && stats.transfertsEnCours > 0 && (
          <div className="bg-white p-5 rounded-lg shadow border border-[#F58020]">
            <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <Package size={20} className="text-[#F58020]" />
              Transferts en attente de complétion
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Vous avez <span className="font-bold text-[#F58020]">{stats.transfertsEnCours}</span> transfert(s) à compléter sur {stats.transfertsTotal}
            </p>
            <button
              onClick={() => window.location.href = "/gestionnaire/produits"}
              className="px-4 py-2 bg-[#F58020] text-white rounded-lg hover:bg-[#e67e1a] transition font-medium"
            >
              Aller aux transferts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

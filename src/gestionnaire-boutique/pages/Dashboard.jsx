import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, TrendingUp, Package, CheckCircle, BarChart3 } from "lucide-react";
import CardStat from "../components/CardStat";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState({
    nombreProduits: 0,
    quantiteTotale: 0,
    produitsSousSeuil: 0,
    transfertsEnAttente: 0,
    transfertsValides: 0
  });
  const [alertes, setAlertes] = useState([]);
  const [transfertsPending, setTransfertsPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Charger les statistiques
        const [statsData, produitsTransfer, transfertsValides, produitsSousSeuil] = await Promise.all([
          gestionnaireBoutiqueAPI.getStatistiquesBoutique(),
          gestionnaireBoutiqueAPI.getProduitsTransfer(),
          gestionnaireBoutiqueAPI.getTransfertsValides(),
          gestionnaireBoutiqueAPI.getProduitsSousSeuil()
        ]);
        
        if (!mounted) return;
        
        setStats({
          nombreProduits: statsData.nombreProduits || 0,
          quantiteTotale: statsData.quantiteTotale || 0,
          produitsSousSeuil: statsData.produitsSousSeuil || 0,
          transfertsEnAttente: produitsTransfer?.data?.length || 0,
          transfertsValides: transfertsValides?.total || 0
        });
        
        setAlertes(Array.isArray(produitsSousSeuil) ? produitsSousSeuil.slice(0, 5) : []);
        setTransfertsPending(produitsTransfer?.data || []);
        
      } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
        if (mounted) {
          toast.error('Erreur de chargement', {
            description: 'Impossible de charger les données du tableau de bord'
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadDashboardData();
    return () => { mounted = false; };
  }, []);

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
              onClick={() => (window.location.href = "/gestionnaire-boutique/historique")}
              className="px-4 py-2 bg-white text-[#472EAD] border border-[#472EAD] rounded-lg hover:bg-[#F7F5FF] font-medium shadow-sm"
            >
              Voir l'historique
            </button>
            <button
              onClick={() => (window.location.href = "/gestionnaire-boutique/alertes")}
              className="px-4 py-2 bg-[#F58020] text-white rounded-lg hover:bg-[#e67e1a] font-medium shadow-sm"
            >
              Voir les alertes
            </button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 my-4 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardStat 
            title="Produits Total" 
            value={stats.nombreProduits} 
            color="bg-[#472EAD]" 
            icon={Package} 
          />
          <CardStat 
            title="Quantité Totale" 
            value={stats.quantiteTotale} 
            color="bg-green-600" 
            icon={CheckCircle} 
          />
          <CardStat 
            title="Sous Seuil" 
            value={stats.produitsSousSeuil} 
            color="bg-red-600" 
            icon={AlertTriangle} 
          />
          <CardStat 
            title="À Compléter" 
            value={stats.transfertsEnAttente} 
            color="bg-[#F58020]" 
            icon={TrendingUp} 
            subtitle={`${stats.transfertsValides} validés`} 
          />
        </div>


        {/* Activités et alertes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transferts récents */}
          <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <Activity size={20} className="text-[#472EAD]" />
              Transferts en attente
            </h3>
            {loading ? (
              <p className="text-gray-600 text-sm">Chargement...</p>
            ) : transfertsPending.length === 0 ? (
              <p className="text-gray-600 text-sm">Aucun transfert en attente</p>
            ) : (
              <ul className="space-y-3">
                {transfertsPending.slice(0, 5).map((transfert, idx) => (
                  <li key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-[#472EAD]">
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm font-medium">
                        {transfert.nom || `Produit #${transfert.id}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Quantité: {transfert.quantite || 0}
                      </p>
                    </div>
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
                onClick={() => (window.location.href = "/gestionnaire-boutique/alertes")}
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
                      onClick={() => (window.location.href = "/gestionnaire-boutique/alertes")}
                      className="w-full text-left p-3 border-l-4 border-[#F58020] bg-orange-50 rounded hover:bg-orange-100 transition"
                    >
                      <div className="text-gray-900 font-medium text-sm flex items-center gap-2">
                        <AlertTriangle size={16} className="text-[#F58020]" />
                        {alert.nom || alert.text || 'Produit'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Quantité: {alert.quantite || 0} / Seuil: {alert.seuil || 0}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transferts en attente */}
        {!loading && stats.transfertsEnAttente > 0 && (
          <div className="bg-white p-5 rounded-lg shadow border border-[#F58020]">
            <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <Package size={20} className="text-[#F58020]" />
              Transferts en attente de complétion
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Vous avez <span className="font-bold text-[#F58020]">{stats.transfertsEnAttente}</span> transfert(s) à compléter
            </p>
            <button
              onClick={() => window.location.href = "/gestionnaire-boutique/produits"}
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

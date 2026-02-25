import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, TrendingUp, Package, CheckCircle } from "lucide-react";
import CardStat from "../components/CardStat";
import LoadingSpinner from "../components/LoadingSpinner";
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
        
        // Charger les statistiques avec Promise.allSettled pour une meilleure gestion d'erreurs
        const results = await Promise.allSettled([
          gestionnaireBoutiqueAPI.getStatistiquesBoutique(),
          gestionnaireBoutiqueAPI.getProduitsTransfer(),
          gestionnaireBoutiqueAPI.getTransfertsValides(),
          gestionnaireBoutiqueAPI.getProduitsSousSeuil(),
          gestionnaireBoutiqueAPI.getNombreProduitsTotal()
        ]);
        
        if (!mounted) return;
        
        const [statsResult, produitsTransferResult, transfertsValidesResult, produitsSousSeuilResult, nombreProduitsTotalResult] = results;
        
        const statsData = statsResult.status === 'fulfilled' ? statsResult.value : {
          nombreProduits: 0,
          quantiteTotale: 0,
          produitsSousSeuil: 0,
          alertes: []
        };
        
        const produitsTransferData = produitsTransferResult.status === 'fulfilled' ? produitsTransferResult.value : { data: [], total: 0 };
        const transfertsValidesData = transfertsValidesResult.status === 'fulfilled' ? transfertsValidesResult.value : { data: [], total: 0 };
        const produitsSousSeuilData = produitsSousSeuilResult.status === 'fulfilled' ? produitsSousSeuilResult.value : { data: [] };
        const nombreProduitsTotal = nombreProduitsTotalResult.status === 'fulfilled' ? nombreProduitsTotalResult.value : { total: 0 };
        
        setStats({
          nombreProduits: parseInt(nombreProduitsTotal.total) || 0,
          quantiteTotale: parseInt(statsData.quantiteTotale) || 0,
          produitsSousSeuil: parseInt(statsData.produitsSousSeuil) || 0,
          transfertsEnAttente: produitsTransferData?.total || produitsTransferData?.data?.length || 0,
          transfertsValides: transfertsValidesData?.total || transfertsValidesData?.data?.length || 0
        });
        
        setAlertes(produitsSousSeuilData?.data?.slice(0, 3) || []);
        setTransfertsPending((produitsTransferData?.data || []).slice(0, 3));
        
      } catch {
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
              3 derniers transferts en attente
            </h3>
            {loading ? (
              <LoadingSpinner />
            ) : transfertsPending.length === 0 ? (
              <p className="text-gray-600 text-sm">Aucun transfert en attente</p>
            ) : (
              <ul className="space-y-3">
                {transfertsPending.map((transfert, idx) => (
                  <li key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-[#472EAD]">
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm font-medium">
                        {transfert.produit?.nom || transfert.nom || 'Produit sans nom'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Code: {transfert.produit?.code || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Quantité: {transfert.quantite} | Cartons: {transfert.nombre_carton}
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
                3 dernières alertes
              </h3>
              <button
                onClick={() => (window.location.href = "/gestionnaire_boutique/alertes")}
                className="text-sm px-3 py-1 bg-[#F58020] text-white rounded hover:bg-[#e67e1a] transition"
              >
                Ouvrir
              </button>
            </div>

            {loading ? (
              <LoadingSpinner />
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
                        {alert.produit?.nom || alert.nom || 'Produit'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Code: {alert.produit?.code || 'N/A'} | Qté: {alert.quantite || 0} / Seuil: {alert.seuil || 0}
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
              onClick={() => window.location.href = "/gestionnaire_boutique/produits"}
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

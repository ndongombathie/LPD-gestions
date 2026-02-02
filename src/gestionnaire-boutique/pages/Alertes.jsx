import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Eye } from "lucide-react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Alertes = () => {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [produitDetail, setProduitDetail] = useState(null);

  const loadAlertes = async () => {
    try {
      setLoading(true);
      const produitsSousSeuilData = await gestionnaireBoutiqueAPI.getProduitsSousSeuil();
      const produits = produitsSousSeuilData?.data || [];
      setAlertes(Array.isArray(produits) ? produits : []);
    } catch (error) {
      console.error('❌ Erreur chargement alertes:', error);
      toast.error('Erreur de chargement', {
        description: 'Impossible de charger les produits en alerte'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertes();
  }, []);

  const handleView = (row) => setProduitDetail(row);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
          <AlertTriangle className="text-[#F58020]" />
          Produits en alerte
        </h2>

        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
              {loading ? (
            <LoadingSpinner />
          ) : alertes.length === 0 ? (
            <EmptyState message="Aucun produit en alerte" />
          ) : (
            <DataTable
              columns={[
                { label: 'Produit', key: 'produit', render: (p) => p?.nom || 'N/A' },
                { label: 'Code', key: 'produit', render: (p) => p?.code || 'N/A' },
                { label: 'Quantité', key: 'quantite' },
                { label: 'Seuil', key: 'seuil' },
                { label: 'Cartons', key: 'nombre_carton' },
                { label: 'Statut', key: 'status', render: (s) => <span className={`px-2 py-1 rounded text-xs font-medium ${s === 'en_attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{s || 'N/A'}</span> },
              ]}
              data={alertes}
              actions={[
                { title: 'Voir', icon: <Eye size={16} />, color: 'text-blue-600', hoverBg: 'bg-blue-50', onClick: handleView },
              ]}
            />
          )}
        </div>

        {/* Modal création supprimé (non supporté via API) */}

        {/* Modal détails produit */}
        {produitDetail && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails du produit</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Produit :</span> {produitDetail.produit?.nom || produitDetail.nom || 'N/A'}</p>
                <p><span className="font-medium">Code :</span> {produitDetail.produit?.code || produitDetail.code || 'N/A'}</p>
                <p><span className="font-medium">Quantité :</span> {produitDetail.quantite}</p>
                <p><span className="font-medium">Seuil :</span> {produitDetail.seuil}</p>
                <p><span className="font-medium">Cartons :</span> {produitDetail.nombre_carton || 'N/A'}</p>
                <p><span className="font-medium">Statut :</span> {produitDetail.status || 'N/A'}</p>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setProduitDetail(null)} className="px-4 py-2 bg-[#472EAD] text-white rounded">Fermer</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Alertes;

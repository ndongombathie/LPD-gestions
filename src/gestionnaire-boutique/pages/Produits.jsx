import React, { useState, useEffect } from "react";
import { Eye, Check, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Produits = () => {
  const [transferts, setTransferts] = useState([]);
  const [transfertsValides, setTransfertsValides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  
  const [selectedTransfert, setSelectedTransfert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    prix_vente_detail: "",
    prix_vente_gros: "",
    prix_seuil_detail: "",
    prix_seuil_gros: "",
  });

  const loadTransferts = async () => {
    try {
      setLoading(true);
      const [produitsTransfer, transfertsValidesData] = await Promise.all([
        gestionnaireBoutiqueAPI.getProduitsTransfer(),
        gestionnaireBoutiqueAPI.getTransfertsValides()
      ]);
      
      setTransferts(produitsTransfer?.data || []);
      setTransfertsValides(transfertsValidesData?.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement transferts:', error);
      toast.error('Erreur de chargement', {
        description: 'Impossible de charger les transferts'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransferts();
  }, []);

  const openCompletionModal = (transfert) => {
    setSelectedTransfert(transfert);
    setFormData({
      prix_vente_detail: "",
      prix_vente_gros: "",
      prix_seuil_detail: "5",
      prix_seuil_gros: "3",
    });
    setShowModal(true);
  };

  const completeTransfert = async () => {
    if (!formData.prix_vente_detail || !formData.prix_vente_gros) {
      toast.error('Champs manquants', {
        description: 'Les prix de vente sont requis'
      });
      return;
    }

    const payload = {
      produit_id: selectedTransfert.id,
      prix_vente_detail: parseFloat(formData.prix_vente_detail),
      prix_vente_gros: parseFloat(formData.prix_vente_gros),
      prix_seuil_detail: parseFloat(formData.prix_seuil_detail || 0),
      prix_seuil_gros: parseFloat(formData.prix_seuil_gros || 0),
    };

    setValidating(true);
    try {
      await gestionnaireBoutiqueAPI.validerProduitTransfer(payload);
      
      toast.success('Produit validé', {
        description: `${selectedTransfert.nom || 'Produit'} a été validé et ajouté au stock`
      });
      
      setShowModal(false);
      setSelectedTransfert(null);
      
      // Recharger les données
      await loadTransferts();
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      toast.error('Erreur de validation', {
        description: error.response?.data?.message || 'Impossible de valider le transfert'
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6 py-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-[#111827]">Réception et Complétion des Produits</h2>
        </div>

        {/* Transferts en attente */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-[#F58020]" size={24} />
            <h3 className="text-xl font-semibold text-[#111827]">En attente de complétion ({transferts.length})</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {loading ? (
              <LoadingSpinner />
            ) : transferts.length === 0 ? (
              <EmptyState message="Aucun transfert en attente" />
            ) : (
              <DataTable
                columns={[
                  { label: "Produit", key: "nom" },
                  { label: "Code", key: "code" },
                  { label: "Catégorie", key: "categorie" },
                  { label: "Quantité reçue", key: "quantite" },
                  { label: "Source", key: "source" },
                  { label: "Date réception", key: "created_at", render: (d) => d ? new Date(d).toLocaleDateString("fr-FR") : '-' },
                ]}
                data={transferts}
                actions={[
                  {
                    title: "Compléter",
                    icon: <Check size={16} />,
                    color: "text-green-600",
                    hoverBg: "bg-green-50",
                    onClick: openCompletionModal,
                  },
                ]}
              />
            )}
          </div>
        </div>

        {/* Transferts validés */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-green-600" size={24} />
            <h3 className="text-xl font-semibold text-[#111827]">Complétés et validés ({transfertsValides.length})</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {transfertsValides.length === 0 ? (
              <EmptyState message="Aucun produit complété" />
            ) : (
              <DataTable
                columns={[
                  { label: "Produit", key: "nom" },
                  { label: "Code", key: "code" },
                  { label: "Catégorie", key: "categorie" },
                  { label: "Quantité", key: "quantite" },
                  { label: "Date validation", key: "updated_at", render: (d, row) => new Date(d || row.created_at).toLocaleDateString("fr-FR") },
                ]}
                data={transfertsValides}
                actions={[
                  {
                    title: "Voir détails",
                    icon: <Eye size={16} />,
                    color: "text-blue-600",
                    hoverBg: "bg-blue-50",
                    onClick: (row) => {},
                  },
                ]}
              />
            )}
          </div>
        </div>

        {/* Modal de complétion */}
        {showModal && selectedTransfert && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex items-center justify-center">
            <div className="relative z-50 bg-white p-6 rounded-lg w-[600px] shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-[#111827]">Compléter le produit</h3>
              
              {/* Infos pré-remplies du transfert */}
              <div className="bg-gray-50 rounded p-4 space-y-2 border-l-4 border-[#472EAD]">
                <p><span className="font-semibold">Produit:</span> {selectedTransfert.nom}</p>
                <p><span className="font-semibold">Code:</span> {selectedTransfert.code}</p>
                <p><span className="font-semibold">Catégorie:</span> {selectedTransfert.categorie}</p>
                <p><span className="font-semibold">Quantité reçue:</span> {selectedTransfert.quantite} unités</p>
                <p><span className="font-semibold">Source:</span> {selectedTransfert.source}</p>
              </div>

              {/* Formulaire de complétion */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Prix Vente Détail (FCFA) *</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_vente_detail}
                      onChange={(e) => setFormData({ ...formData, prix_vente_detail: e.target.value })}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Prix Vente Gros (FCFA) *</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_vente_gros}
                      onChange={(e) => setFormData({ ...formData, prix_vente_gros: e.target.value })}
                      placeholder="900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Seuil Détail</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_seuil_detail}
                      onChange={(e) => setFormData({ ...formData, prix_seuil_detail: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Seuil Gros</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_seuil_gros}
                      onChange={(e) => setFormData({ ...formData, prix_seuil_gros: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTransfert(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={validating}
                >
                  Annuler
                </button>
                <button
                  onClick={completeTransfert}
                  disabled={validating}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {validating ? 'Validation...' : 'Valider et ajouter au stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Produits;

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
  const [detailTransfert, setDetailTransfert] = useState(null);
  const [formData, setFormData] = useState({
    prix_vente_detail: "",
    prix_vente_gros: "",
    prix_seuil_detail: "",
    prix_seuil_gros: "",
    seuil: "",
  });

  const loadTransferts = async () => {
    try {
      setLoading(true);
      const [produitsTransferData, transfertsValidesData, produitsDispoData] = await Promise.all([
        gestionnaireBoutiqueAPI.getProduitsTransfer(),
        gestionnaireBoutiqueAPI.getTransfertsValides(),
        gestionnaireBoutiqueAPI.getProduitsDisponiblesBoutique()
      ]);

      const produitsList = Array.isArray(produitsDispoData) ? produitsDispoData : (produitsDispoData?.data || []);
      const map = produitsList.reduce((acc, produit) => {
        if (produit?.id) acc[produit.id] = produit;
        return acc;
      }, {});

      const enrich = (t) => ({
        ...t,
        produit: map[t.produit_id] || t.produit
      });

      setTransferts((produitsTransferData?.data || []).map(enrich));
      setTransfertsValides((transfertsValidesData?.data || []).map(enrich));
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
      prix_seuil_detail: "",
      prix_seuil_gros: "",
      seuil: transfert.seuil || "",
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
      id: selectedTransfert.id,
      seuil: parseFloat(formData.seuil || selectedTransfert.seuil || 0),
      prix_vente_detail: parseFloat(formData.prix_vente_detail),
      prix_vente_gros: parseFloat(formData.prix_vente_gros),
      prix_seuil_detail: parseFloat(formData.prix_seuil_detail || 0),
      prix_seuil_gros: parseFloat(formData.prix_seuil_gros || 0),
    };

    console.log('📤 Payload envoyé au backend:', payload);
    setValidating(true);
    try {
      const response = await gestionnaireBoutiqueAPI.validerProduitTransfer(payload);
      console.log('✅ Réponse du backend:', response);
      
      toast.success('Produit validé', {
        description: `${selectedTransfert.produit?.nom || 'Produit'} a été validé et ajouté au stock`
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
                  { label: "Produit", key: "produit", render: (p) => p?.nom || 'N/A' },
                  { label: "Code", key: "produit", render: (p) => p?.code || 'N/A' },
                  { label: "Quantité reçue", key: "quantite" },
                  { label: "Cartons", key: "nombre_carton" },
                  { label: "Seuil", key: "seuil" },
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

        {/* Derniers transferts validés */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-green-600" size={24} />
            <h3 className="text-xl font-semibold text-[#111827]">5 derniers transferts validés</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {transfertsValides.length === 0 ? (
              <EmptyState message="Aucun produit complété" />
            ) : (
              <DataTable
                columns={[
                  { label: "Produit", key: "produit", render: (p) => p?.nom || 'N/A' },
                  { label: "Code", key: "produit", render: (p) => p?.code || 'N/A' },
                  { label: "Quantité", key: "quantite" },
                  { label: "Cartons", key: "nombre_carton" },
                  { label: "Seuil", key: "seuil" },
                  { label: "Date validation", key: "updated_at", render: (d, row) => new Date(d || row.created_at).toLocaleDateString("fr-FR") },
                ]}
                data={transfertsValides.slice(0, 5)}
                actions={[
                  {
                    title: "Voir détails",
                    icon: <Eye size={16} />,
                    color: "text-blue-600",
                    hoverBg: "bg-blue-50",
                    onClick: (row) => setDetailTransfert(row),
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
                <p><span className="font-semibold">Produit:</span> {selectedTransfert.produit?.nom || 'N/A'}</p>
                <p><span className="font-semibold">Code:</span> {selectedTransfert.produit?.code || 'N/A'}</p>
                <p><span className="font-semibold">Quantité reçue:</span> {selectedTransfert.quantite} unités</p>
                <p><span className="font-semibold">Cartons:</span> {selectedTransfert.nombre_carton}</p>
                <p><span className="font-semibold">Seuil:</span> {selectedTransfert.seuil}</p>
              </div>

              {/* Formulaire de complétion */}
              <div className="space-y-4">
                {/* Ligne 1: Seuil de stock */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Seuil de Stock Minimum *</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.seuil}
                      onChange={(e) => setFormData({ ...formData, seuil: e.target.value })}
                      placeholder={selectedTransfert.seuil || "10"}
                    />
                    <p className="text-xs text-gray-500 mt-1">Seuil actuel: {selectedTransfert.seuil} unités</p>
                  </div>
                </div>

                {/* Ligne 2: Prix de vente */}
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
                </div>

                {/* Ligne 3: Seuils de prix */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Seuil Prix Détail (FCFA)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_seuil_detail}
                      onChange={(e) => setFormData({ ...formData, prix_seuil_detail: e.target.value })}
                      placeholder="Prix minimum détail"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Seuil Prix Gros (FCFA)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_seuil_gros}
                      onChange={(e) => setFormData({ ...formData, prix_seuil_gros: e.target.value })}
                      placeholder="Prix minimum gros"
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

        {/* Modal détails transfert validé */}
        {detailTransfert && (
          <div className="fixed inset-0 z-200 bg-black/40 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails du transfert validé</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Produit</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.produit?.nom || 'N/A'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Code</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.produit?.code || 'N/A'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Catégorie</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.produit?.categorie_id || 'N/A'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Unité par carton</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.produit?.unite_carton ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Quantité</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.quantite} unités</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Cartons</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.nombre_carton}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Seuil</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.seuil}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Stock global</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.produit?.stock_global ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Stock seuil</p>
                  <p className="text-[#111827] font-semibold mt-1">{detailTransfert.produit?.stock_seuil ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Prix achat</p>
                  <p className="text-[#111827] font-semibold mt-1">{Number(detailTransfert.produit?.prix_achat || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Prix unité carton</p>
                  <p className="text-[#111827] font-semibold mt-1">{Number(detailTransfert.produit?.prix_unite_carton || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Prix vente détail</p>
                  <p className="text-[#111827] font-semibold mt-1">{Number(detailTransfert.produit?.prix_vente_detail || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Prix vente gros</p>
                  <p className="text-[#111827] font-semibold mt-1">{Number(detailTransfert.produit?.prix_vente_gros || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Seuil prix détail</p>
                  <p className="text-[#111827] font-semibold mt-1">{Number(detailTransfert.produit?.prix_seuil_detail || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Seuil prix gros</p>
                  <p className="text-[#111827] font-semibold mt-1">{Number(detailTransfert.produit?.prix_seuil_gros || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Date validation</p>
                  <p className="text-[#111827] font-semibold mt-1">{new Date(detailTransfert.updated_at || detailTransfert.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Date réception</p>
                  <p className="text-[#111827] font-semibold mt-1">{new Date(detailTransfert.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Statut</p>
                  <p className="text-green-600 font-semibold mt-1">Validé</p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setDetailTransfert(null)} className="px-4 py-2 bg-[#472EAD] text-white rounded hover:bg-[#3b2594]">
                  Fermer
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

import React, { useState, useEffect } from "react";
import { Eye, Check, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import * as api from "../services/apiMock";

const Produits = () => {
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  const [selectedTransfert, setSelectedTransfert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code_barre: "",
    prix_vente: "",
    prix_gros: "",
    prix_detail: "",
  });

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.fetchTransferts()
      .then((res) => {
        if (!mounted) return;
        setTransferts(res || []);
      })
      .catch((err) => {
        console.error(err);
        addToast("error", "Erreur", "Impossible de charger les transferts.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const transfertsPending = transferts.filter((t) => t.statut === "en_attente");
  const transfertsValidated = transferts.filter((t) => t.statut === "validé");

  const openCompletionModal = (transfert) => {
    setSelectedTransfert(transfert);
    setFormData({
      code_barre: "",
      prix_vente: "",
      prix_gros: "900",
      prix_detail: "1000",
    });
    setShowModal(true);
  };

  const completeTransfert = async () => {
    if (!formData.code_barre || !formData.prix_vente) {
      addToast("error", "Champs manquants", "Le code barre et les prix sont requis.");
      return;
    }

    const payload = {
      code_barre: formData.code_barre,
      prix_vente: parseInt(formData.prix_vente || 0, 10),
      prix_gros: parseInt(formData.prix_gros || 0, 10),
      prix_detail: parseInt(formData.prix_detail || 0, 10),
      seuil: 5,
    };

    setLoading(true);
    try {
      const result = await api.validateTransfert(selectedTransfert.id, payload);
      if (result.ok) {
        // Update local state
        setTransferts((prev) =>
          prev.map((t) => (t.id === selectedTransfert.id ? { ...t, statut: "validé", dateValidation: new Date().toISOString() } : t))
        );
        addToast("success", "Produit complété", `${selectedTransfert.nom} a été validé et ajouté au stock.`);
        setShowModal(false);
        setSelectedTransfert(null);
      } else {
        addToast("error", "Erreur", result.error || "Impossible de valider le transfert.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erreur", "Une erreur est survenue.");
    } finally {
      setLoading(false);
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
            <h3 className="text-xl font-semibold text-[#111827]">En attente de complétion ({transfertsPending.length})</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {loading ? (
              <LoadingSpinner />
            ) : transfertsPending.length === 0 ? (
              <EmptyState message="Aucun transfert en attente" />
            ) : (
              <DataTable
                columns={[
                  { label: "Produit", key: "nom" },
                  { label: "Code", key: "code" },
                  { label: "Catégorie", key: "categorie" },
                  { label: "Quantité reçue", key: "quantite" },
                  { label: "Source", key: "source" },
                  { label: "Date réception", key: "dateCreation", render: (d) => new Date(d).toLocaleDateString("fr-FR") },
                ]}
                data={transfertsPending}
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
            <h3 className="text-xl font-semibold text-[#111827]">Complétés et validés ({transfertsValidated.length})</h3>
          </div>
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {transfertsValidated.length === 0 ? (
              <EmptyState message="Aucun produit complété" />
            ) : (
              <DataTable
                columns={[
                  { label: "Produit", key: "nom" },
                  { label: "Code", key: "code" },
                  { label: "Catégorie", key: "categorie" },
                  { label: "Quantité", key: "quantite" },
                  { label: "Date validation", key: "dateValidation", render: (d) => new Date(d).toLocaleDateString("fr-FR") },
                ]}
                data={transfertsValidated}
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
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Code Barre *</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                    value={formData.code_barre}
                    onChange={(e) => setFormData({ ...formData, code_barre: e.target.value })}
                    placeholder="Ex: 123456789"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Prix de vente (FCFA) *</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_vente}
                      onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Prix gros (FCFA)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_gros}
                      onChange={(e) => setFormData({ ...formData, prix_gros: e.target.value })}
                      placeholder="900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Prix détail (FCFA)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                      value={formData.prix_detail}
                      onChange={(e) => setFormData({ ...formData, prix_detail: e.target.value })}
                      placeholder="1000"
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
                >
                  Annuler
                </button>
                <button
                  onClick={completeTransfert}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Valider et ajouter au stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-9999 space-y-3">
          {toasts.map((t) => {
            const border = t.type === "success" ? "border-l-4 border-emerald-500" : "border-l-4 border-rose-500";
            const Icon = t.type === "success" ? CheckCircle2 : AlertCircle;
            return (
              <div key={t.id} className={`${border} bg-white text-gray-900 px-4 py-3 rounded-lg shadow-md w-80 flex gap-3 items-start`}>
                <Icon size={18} className={t.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{t.title}</div>
                  {t.message && <div className="text-xs opacity-90 mt-0.5">{t.message}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Produits;

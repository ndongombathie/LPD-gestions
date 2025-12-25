import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Eye } from "lucide-react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import * as api from "../services/apiMock";

const Alertes = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nouveau, setNouveau] = useState({ produit: "", source: "", destination: "", quantite: "" });
  const [produitDetail, setProduitDetail] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.fetchStocks().then((res) => {
      if (!mounted) return;
      setStocks(res);
      setLoading(false);
    });
    return () => (mounted = false);
  }, []);

  const alertes = stocks.filter((p) => p.quantite <= p.seuil);

  const handleReappro = (row) => {
    // Préremplir le modal de demande à partir du produit en alerte
    const qtyNeeded = Math.max(1, (row.seuil || 0) - (row.quantite || 0));
    setNouveau({
      produit: row.nom || "",
      source: "Magasin",
      destination: "Entrepôt",
      quantite: String(qtyNeeded),
    });
    setShowModal(true);
  };

  const ajouterTransfert = async () => {
    try {
      // Si l'API mock propose addTransfert, on l'appelle, sinon on simule
      if (api.addTransfert) {
        await api.addTransfert({ ...nouveau, statut: "en_attente" });
      }
      // Fermeture et feedback simplifié
      alert("Demande de réapprovisionnement créée.");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la demande.");
    }
  };

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
                { label: 'Nom', key: 'nom' },
                { label: 'Catégorie', key: 'categorie' },
                { label: 'Quantité', key: 'quantite' },
                { label: 'Seuil', key: 'seuil' },
              ]}
              data={alertes}
              actions={[
                { title: 'Voir', icon: <Eye size={16} />, color: 'text-blue-600', hoverBg: 'bg-blue-50', onClick: handleView },
                { title: 'Réapprovisionner', icon: <RefreshCw />, color: 'text-[#472EAD]', hoverBg: 'bg-[#F7F5FF]', onClick: handleReappro },
              ]}
            />
          )}
        </div>

        {/* Modal création (préremplie depuis un produit en alerte) */}
        {showModal && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative bg-white w-[95%] sm:w-[420px]  rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Nouvelle demande</h3>
              <div className="grid grid-cols-2 gap-4">
                {['produit', 'source', 'destination', 'quantite'].map(f => (
                  <input
                    key={f}
                    type="text"
                    placeholder={f}
                    className="border p-2 rounded"
                    value={nouveau[f]}
                    onChange={(e) => setNouveau({ ...nouveau, [f]: e.target.value })}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Annuler</button>
                <button onClick={ajouterTransfert} className="px-4 py-2 bg-[#472EAD] text-white rounded">Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal détails produit */}
        {produitDetail && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails du produit</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Nom :</span> {produitDetail.nom}</p>
                <p><span className="font-medium">Code :</span> {produitDetail.code}</p>
                <p><span className="font-medium">Catégorie :</span> {produitDetail.categorie}</p>
                <p><span className="font-medium">Quantité :</span> {produitDetail.quantite}</p>
                <p><span className="font-medium">Seuil :</span> {produitDetail.seuil}</p>
                <p><span className="font-medium">Fournisseur :</span> {produitDetail.fournisseur}</p>
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

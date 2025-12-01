import React, { useEffect, useState } from "react";
import { Plus, Search, FileText, Trash2, X, Eye } from "lucide-react";
import CardStat from "../components/CardStat";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import * as api from "../services/apiMock";

const Transferts = () => {
  const [transferts, setTransferts] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [nouveau, setNouveau] = useState({ produit: "", source: "", destination: "", quantite: "" });
  const [detailTransfert, setDetailTransfert] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.fetchTransferts().then((res) => {
      if (!mounted) return;
      setTransferts(res);
      setLoading(false);
    });
    return () => (mounted = false);
  }, []);

  const transfertsFiltres = transferts.filter(
    (t) => {
      const q = recherche.trim().toLowerCase();
      return (
        !q ||
        t.produit.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
      );
    }
  );

  const stats = {
    total: transferts.length,
    en_attente: transferts.filter(t => t.statut === "en_attente").length,
    valide: transferts.filter(t => t.statut === "validé").length,
    rejete: transferts.filter(t => t.statut === "rejeté").length,
  };

  const ajouterTransfert = () => {
    if (!nouveau.produit || !nouveau.source || !nouveau.destination) return;
    setTransferts(prev => [...prev, { id: Date.now(), ...nouveau, statut: "en_attente" }]);
    setNouveau({ produit: "", source: "", destination: "", quantite: "" });
    setShowModal(false);
  };

  const supprimerTransfert = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    const res = await api.deleteTransfert(id);
    if (res && res.ok) setTransferts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#111827]">Demandes de Reprovisionnement</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <CardStat title="Total demandes" value={stats.total} color="bg-[#472EAD]" />
          <CardStat title="En attente" value={stats.en_attente} color="bg-[#F58020]" />
          <CardStat title="Validé" value={stats.valide} color="bg-green-600" />
          <CardStat title="Rejeté" value={stats.rejete} color="bg-red-600" />
        </div>

        {/* Recherche et action */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#472EAD] text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner />
          ) : transfertsFiltres.length === 0 ? (
            <EmptyState message="Aucune demande trouvée" />
          ) : (
            <DataTable
              columns={[
                { label: 'Produit', key: 'produit' },
                { label: 'Source', key: 'source' },
                { label: 'Destination', key: 'destination' },
                { label: 'Quantité', key: 'quantite' },
                { label: 'Statut', key: 'statut', render: (_, row) => (
                    <span className={row.statut === 'validé' ? 'text-green-600' : row.statut === 'rejeté' ? 'text-red-600' : 'text-[#F58020]'}>{row.statut}</span>
                  )
                },
              ]}
              data={transfertsFiltres}
              actions={[
                { title: 'Voir', icon: <Eye size={16} />, color: 'text-blue-600', hoverBg: 'bg-blue-50', onClick: (row) => setDetailTransfert(row) },
                { title: 'Supprimer', icon: <Trash2 size={16} />, color: 'text-red-600', hoverBg: 'bg-red-50', onClick: (row) => setConfirmDelete(row.id) },
              ]}
              onRowClick={(row) => setDetailTransfert(row)}
            />
          )}
        </div>

        {/* Modal création */}
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

        {/* Modal détails */}
        {detailTransfert && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Produit :</span> {detailTransfert.produit}</p>
                <p><span className="font-medium">Source :</span> {detailTransfert.source}</p>
                <p><span className="font-medium">Destination :</span> {detailTransfert.destination}</p>
                <p><span className="font-medium">Quantité :</span> {detailTransfert.quantite}</p>
                <p><span className="font-medium">Statut :</span> {detailTransfert.statut}</p>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setDetailTransfert(null)} className="px-4 py-2 bg-[#472EAD] text-white rounded">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmation suppression */}
        {confirmDelete && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[400px] rounded-lg shadow-lg p-6 space-y-4 text-center">
              <p className="text-lg">Voulez-vous vraiment supprimer cette demande ?</p>
              <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded">Annuler</button>
                <button onClick={supprimerTransfert} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transferts;

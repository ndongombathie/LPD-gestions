import React, { useEffect, useState } from "react";
import { Search, Eye } from "lucide-react";
import CardStat from "../components/CardStat";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Transferts = () => {
  const [transferts, setTransferts] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [detailTransfert, setDetailTransfert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const debouncedRecherche = useDebouncedValue(recherche);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const [pending, valides] = await Promise.all([
          gestionnaireBoutiqueAPI.getProduitsTransfer(page, debouncedRecherche, { signal: controller.signal }),
          gestionnaireBoutiqueAPI.getTransfertsValides(page, debouncedRecherche, { signal: controller.signal }),
        ]);
        if (!mounted) return;
        // Harmoniser structure pour l'affichage
        const mapItem = (it) => ({
          id: it.id,
          produit: it.produit?.nom || it.nom || it.designation || `#${it.id}`,
          code: it.produit?.code || it.code || 'N/A',
          quantite: it.quantite || it.qty || 0,
          nombre_carton: it.nombre_carton || 0,
          seuil: it.seuil || 0,
          source: it.source || it.origine || 'Dépôt',
          destination: it.destination || 'Boutique',
          statut: it.statut || it.status || 'en_attente',
          created_at: it.created_at || new Date().toISOString(),
        });
        const pendingRows = Array.isArray(pending?.data) ? pending.data.map(mapItem) : [];
        const validesRows = Array.isArray(valides?.data) ? valides.data.map((x) => ({ ...mapItem(x), statut: 'validé' })) : [];
        setTransferts([...pendingRows, ...validesRows]);
        setPagination(pending);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return;
        }
        toast.error('Erreur de chargement', { description: 'Impossible de charger les transferts' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, debouncedRecherche]);

  const handlePageChange = (nextPage) => {
    if (nextPage && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const stats = {
    total: transferts.length,
    en_attente: transferts.filter(t => t.statut === "en_attente").length,
    valide: transferts.filter(t => t.statut === "validé").length,
    rejete: transferts.filter(t => t.statut === "rejeté").length,
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

        {/* Recherche */}
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
        </div>

        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner />
          ) : transferts.length === 0 ? (
            <EmptyState message="Aucune demande trouvée" />
          ) : (
            <DataTable
              columns={[
                { label: 'Produit', key: 'produit' },
                { label: 'Code', key: 'code' },
                { label: 'Quantité', key: 'quantite' },
                { label: 'Cartons', key: 'nombre_carton' },
                { label: 'Seuil', key: 'seuil' },
                { label: 'Statut', key: 'statut', render: (_, row) => (
                    <span className={row.statut === 'validé' ? 'text-green-600 font-medium' : row.statut === 'rejeté' ? 'text-red-600 font-medium' : 'text-[#F58020] font-medium'}>{row.statut}</span>
                  )
                },
              ]}
              data={transferts}
              actions={[
                { title: 'Voir', icon: <Eye size={16} />, color: 'text-blue-600', hoverBg: 'bg-blue-50', onClick: (row) => setDetailTransfert(row) },
              ]}
              onRowClick={(row) => setDetailTransfert(row)}
            />
          )}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>

        {/* Modal détails */}
        {detailTransfert && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white  rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Produit :</span> {detailTransfert.produit}</p>
                <p><span className="font-medium">Code :</span> {detailTransfert.code}</p>
                <p><span className="font-medium">Quantité :</span> {detailTransfert.quantite} unités</p>
                <p><span className="font-medium">Cartons :</span> {detailTransfert.nombre_carton}</p>
                <p><span className="font-medium">Seuil :</span> {detailTransfert.seuil}</p>
                <p><span className="font-medium">Statut :</span> <span className={detailTransfert.statut === 'validé' ? 'text-green-600 font-medium' : 'text-[#F58020] font-medium'}>{detailTransfert.statut}</span></p>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setDetailTransfert(null)} className="px-4 py-2 bg-[#472EAD] text-white rounded">Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transferts;

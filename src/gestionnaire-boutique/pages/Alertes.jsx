import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Eye, Search } from "lucide-react";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Alertes = () => {
  const [alertes, setAlertes] = useState([]);
  const [produitsRupture, setProduitsRupture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRupture, setLoadingRupture] = useState(true);
  const [page, setPage] = useState(1);
  const [pageRupture, setPageRupture] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [paginationRupture, setPaginationRupture] = useState(null);
  const [produitDetail, setProduitDetail] = useState(null);
  const [recherche, setRecherche] = useState("");
  const debouncedRecherche = useDebouncedValue(recherche);

  const loadAlertes = useCallback(async (pageNumber = page, search = debouncedRecherche, options = {}) => {
    try {
      setLoading(true);
      const produitsSousSeuilData = await gestionnaireBoutiqueAPI.getProduitsSousSeuil(pageNumber, search, options);
      const produits = produitsSousSeuilData?.data || [];
      setAlertes(Array.isArray(produits) ? produits : []);
      setPagination(produitsSousSeuilData);
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return;
      }
      toast.error('Erreur de chargement', {
        description: 'Impossible de charger les produits en alerte'
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedRecherche]);

  const loadProduitsRupture = useCallback(async (pageNumber = pageRupture, search = debouncedRecherche, options = {}) => {
    try {
      setLoadingRupture(true);
      const produitsRuptureData = await gestionnaireBoutiqueAPI.getProduitsRupture(pageNumber, search, options);
      const produits = produitsRuptureData?.data || [];
      setProduitsRupture(Array.isArray(produits) ? produits : []);
      setPaginationRupture(produitsRuptureData);
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return;
      }
      toast.error('Erreur de chargement', {
        description: 'Impossible de charger les produits en rupture'
      });
    } finally {
      setLoadingRupture(false);
    }
  }, [pageRupture, debouncedRecherche]);


  useEffect(() => {
    const controller = new AbortController();
    loadAlertes(page, debouncedRecherche, { signal: controller.signal });
    return () => controller.abort();
  }, [loadAlertes, page, debouncedRecherche]);

  useEffect(() => {
    const controller = new AbortController();
    loadProduitsRupture(pageRupture, debouncedRecherche, { signal: controller.signal });
    return () => controller.abort();
  }, [loadProduitsRupture, pageRupture, debouncedRecherche]);

  useEffect(() => {
    loadProduitsRupture(pageRupture);
  }, [pageRupture]);

  const handlePageChange = (nextPage) => {
    if (nextPage && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const handlePageChangeRupture = (nextPage) => {
    if (nextPage && nextPage !== pageRupture) {
      setPageRupture(nextPage);
    }
  };

  const handleRechercheChange = (event) => {
    const value = event.target.value;
    setRecherche(value);
    if (page !== 1) {
      setPage(1);
    }
    if (pageRupture !== 1) {
      setPageRupture(1);
    }
  };

  const handleClearRecherche = () => {
    setRecherche("");
    if (page !== 1) {
      setPage(1);
    }
    if (pageRupture !== 1) {
      setPageRupture(1);
    }
  };

  const handleView = (row) => setProduitDetail(row);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6 py-6">
        {/* En-tête principal */}
        <div>
          <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
            <AlertTriangle className="text-[#F58020]" size={32} />
            Gestion des Alertes
          </h2>
          <p className="text-gray-600 mt-1">Produits nécessitant une attention particulière</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit, un code..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={recherche}
                onChange={handleRechercheChange}
              />
            </div>
            {recherche && (
              <button
                type="button"
                onClick={handleClearRecherche}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Produits sous seuil d'alerte */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-[#F58020]" size={24} />
            <h3 className="text-xl font-bold text-[#111827]">
              Produits sous seuil d'alerte
            </h3>
            <span className="ml-2 px-3 py-1 bg-[#F58020] text-white text-sm font-semibold rounded-full">
              {pagination?.total || alertes.length}
            </span>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {loading ? (
              <LoadingSpinner />
            ) : alertes.length === 0 ? (
              <EmptyState message="Aucun produit sous seuil d'alerte" />
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
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </div>
        </div>

        {/* Section 2: Produits en rupture de stock */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="text-xl font-bold text-[#111827]">
              Produits en rupture de stock
            </h3>
            <span className="ml-2 px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
              {paginationRupture?.total || produitsRupture.length}
            </span>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            {loadingRupture ? (
              <LoadingSpinner />
            ) : produitsRupture.length === 0 ? (
              <EmptyState message="Aucun produit en rupture de stock" />
            ) : (
              <DataTable
                columns={[
                  { label: 'Produit', key: 'produit', render: (p, row) => p?.nom || row?.nom || 'N/A' },
                  { label: 'Code', key: 'produit', render: (p, row) => p?.code || row?.code || 'N/A' },
                  { label: 'Quantité', key: 'quantite', render: (v) => <span className="text-red-600 font-bold">{v || 0}</span> },
                  { label: 'Seuil', key: 'seuil' },
                  { label: 'Cartons', key: 'nombre_carton', render: (v) => v || 'N/A' },
                  { label: 'Statut', key: 'status', render: () => <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Rupture</span> },
                ]}
                data={produitsRupture}
                actions={[
                  { title: 'Voir', icon: <Eye size={16} />, color: 'text-blue-600', hoverBg: 'bg-blue-50', onClick: handleView },
                ]}
              />
            )}
            <Pagination pagination={paginationRupture} onPageChange={handlePageChangeRupture} />
          </div>
        </div>

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

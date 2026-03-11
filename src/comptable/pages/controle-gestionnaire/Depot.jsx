// ==========================================================
// 🏭 DepotControle.jsx — VERSION SANS FILTRE PAR ÉTAT
// RECHERCHE UNIQUEMENT AU CLIC SUR BOUTON RECHERCHER
// PERSISTANCE DE LA RECHERCHE
// PAGINATION DYNAMIQUE
// ==========================================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search, Eye, X, ChevronLeft, ChevronRight, Package } from "lucide-react";
import depotAPI from "@/services/api/depot";

const DEFAULT_PER_PAGE = 15;

/* ================== FONCTION DE FORMATAGE ================= */
const formatFCFA = (value = 0) => {
  return Number(value).toLocaleString("fr-FR") + " FCFA";
};

const getEtatStock = (stockGlobal, stockSeuil) => {
  if (stockGlobal === 0) return "Rupture";
  if (stockGlobal <= stockSeuil) return "Stock faible";
  return "Disponible";
};

/* ================== PAGINATION ================= */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        <Package size={14} className="inline mr-1" />
        {totalItems} produit{totalItems > 1 ? 's' : ''}
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Première page"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-[#472EAD] text-white"
                : page === '...'
                ? "cursor-default"
                : "hover:bg-gray-50 border"
            }`}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Dernière page"
        >
          <ChevronRight size={16} className="rotate-180" />
        </button>
      </div>
    </div>
  );
};

/* ================== FICHE PRODUIT ================= */
const FicheProduit = ({ produit, mouvements, loading, onClose }) => {
  if (!produit) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[#472EAD]">
          Fiche Produit
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">{produit.nom}</h3>

        <div>
          <p className="text-gray-500 text-sm">Fournisseur</p>
          <p className="font-medium">{produit.fournisseur_nom}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-gray-500 text-sm">Prix</p>
            <p className="font-medium">{formatFCFA(produit.prix_achat)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Cartons</p>
            <p className="font-medium">{produit.nombre_carton}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Seuil</p>
            <p className="font-medium">{produit.stock_seuil || 0}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">État</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1
              ${produit.etat_stock === 'Rupture' ? 'bg-red-100 text-red-700' : 
                produit.etat_stock === 'Stock faible' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'}`}>
              {produit.etat_stock}
            </span>
          </div>
        </div>

        {/* Mouvements */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Mouvements</h4>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#472EAD] border-t-transparent"></div>
            </div>
          ) : mouvements.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun mouvement</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mouvements.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded text-sm ${
                    m.type === "entree"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="font-medium">
                    {m.type === "entree" ? "📥" : "📤"} {m.quantite}
                  </div>
                  <div className="text-xs text-gray-600">
                    {m.source} → {m.destination}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(m.date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================== PAGE PRINCIPALE ================= */
export default function DepotControle() {
  // États des données
  const [produits, setProduits] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Fiche produit
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loadingMouvements, setLoadingMouvements] = useState(false);
  
  // Refs
  const loadingRef = useRef(false);
  const previousParamsRef = useRef('');

  /* ============= GÉNÉRATION DES PARAMÈTRES API ============= */
  const getApiParams = useCallback((page = currentPage) => {
    const params = { page };
    
    if (activeSearch?.trim()) {
      params.search = activeSearch.trim();
    }
    
    return params;
  }, [activeSearch, currentPage]);

  /* ============= CHARGEMENT DES DONNÉES ============= */
  const loadProduits = useCallback(async (page = 1) => {
    if (loadingRef.current) {
      console.log("⏳ Chargement déjà en cours, ignoré");
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const params = getApiParams(page);
      const paramsKey = JSON.stringify(params);
      
      if (paramsKey === previousParamsRef.current && initialLoadDone) {
        console.log("📦 Paramètres identiques, chargement ignoré");
        return;
      }
      
      console.log("📡 Chargement avec params:", params);
      previousParamsRef.current = paramsKey;
      
      const res = await depotAPI.getProduitsControle({
        ...params,
        per_page: DEFAULT_PER_PAGE
      });
      
      console.log("📡 Réponse API:", res);
      
      setProduits(res.data || []);
      setTotalPages(res.pagination?.lastPage || 1);
      setTotalItems(res.pagination?.total || 0);
      setCurrentPage(res.pagination?.currentPage || page);
      
      setInitialLoadDone(true);
      
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      setProduits([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [getApiParams, initialLoadDone]);

  /* ============= EFFET DE CHARGEMENT UNIQUE ============= */
  useEffect(() => {
    loadProduits(1);
  }, []);

  /* ============= EFFET POUR LES FILTRES ============= */
  useEffect(() => {
    if (initialLoadDone) {
      loadProduits(1);
    }
  }, [activeSearch]);

  /* ============= CHANGEMENT DE PAGE ============= */
  const handlePageChange = useCallback((page) => {
    if (page !== currentPage && initialLoadDone) {
      loadProduits(page);
    }
  }, [currentPage, loadProduits, initialLoadDone]);

  /* ============= RECHERCHE MANUELLE ============= */
  const handleSearch = useCallback(() => {
    setActiveSearch(searchTerm);
  }, [searchTerm]);

  /* ============= RÉINITIALISATION DES FILTRES ============= */
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setActiveSearch("");
  }, []);

  /* ============= GESTION DE LA TOUCHE ENTRÉE ============= */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  /* ============= CHARGEMENT DES MOUVEMENTS ============= */
  const chargerMouvements = useCallback(async (produit) => {
    try {
      setSelectedProduit(produit);
      setLoadingMouvements(true);
      const res = await depotAPI.getMouvementsProduit(produit.id);
      setMouvements(res.data || []);
    } catch (error) {
      console.error("Erreur mouvements:", error);
    } finally {
      setLoadingMouvements(false);
    }
  }, []);

  /* ============= PRODUITS AVEC ÉTAT CALCULÉ ============= */
  const produitsAvecEtat = useMemo(() => {
    return produits.map(p => ({
      ...p,
      etat_stock: getEtatStock(p.stock_global || 0, p.stock_seuil || 0)
    }));
  }, [produits]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#472EAD]">
                Contrôle Gestionnaire — Dépôt
              </h1>
              <div className="text-sm bg-indigo-50 text-[#472EAD] px-4 py-2 rounded-xl font-medium">
                {!isLoading && totalItems > 0 && (
                  <span>{totalItems} produit{totalItems > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RECHERCHE */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Rechercher un produit par son nom... (Appuyez sur Entrée)"
                  className="w-full pl-9 pr-24 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1.5 flex gap-1">
                  {searchTerm && searchTerm !== activeSearch && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Effacer"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || searchTerm === activeSearch}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      searchTerm !== activeSearch
                        ? "bg-[#472EAD] text-white hover:bg-[#3a2590]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </div>

            {/* FILTRES ACTIFS */}
            {activeSearch && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">Filtres actifs :</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeSearch && (
                    <span className="bg-indigo-50 text-[#472EAD] px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                      <Search size={12} />
                      "{activeSearch}"
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setActiveSearch("");
                        }}
                        className="ml-1 hover:text-[#3a2590]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    Tout effacer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABLEAU DES PRODUITS */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Liste des produits
              </h2>
            </div>
            
            {!isLoading && produitsAvecEtat.length === 0 ? (
              <div className="text-center py-16">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {activeSearch
                    ? "Aucun produit ne correspond à vos critères"
                    : "Aucun produit trouvé"}
                </p>
                {activeSearch && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 text-[#472EAD] hover:underline text-sm font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
                {/* Liste des produits */}
                <div className={`${selectedProduit ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left text-gray-600 font-semibold">Produit</th>
                          <th className="p-3 text-left text-gray-600 font-semibold">Fournisseur</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Prix</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Cartons</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Seuil</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">État</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produitsAvecEtat.map((p) => (
                          <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium">{p.nom}</td>
                            <td className="p-3">{p.fournisseur_nom}</td>
                            <td className="p-3 text-center">{formatFCFA(p.prix_achat)}</td>
                            <td className="p-3 text-center">{p.nombre_carton}</td>
                            <td className="p-3 text-center">{p.stock_seuil || 0}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${p.etat_stock === 'Rupture' ? 'bg-red-100 text-red-700' : 
                                  p.etat_stock === 'Stock faible' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-green-100 text-green-700'}`}>
                                {p.etat_stock}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => chargerMouvements(p)}
                                className="p-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#36238b] transition-colors"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION */}
                  {totalPages > 1 && (
                    <div className="mt-6 pt-4 border-t">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={totalItems}
                      />
                    </div>
                  )}
                </div>

                {/* FICHE PRODUIT */}
                {selectedProduit && (
                  <div className="lg:col-span-1">
                    <FicheProduit
                      produit={selectedProduit}
                      mouvements={mouvements}
                      loading={loadingMouvements}
                      onClose={() => {
                        setSelectedProduit(null);
                        setMouvements([]);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CHARGEMENT */}
        {isLoading && (
          <div className="mb-8">
            <div className="bg-white p-8 rounded-2xl shadow-md flex justify-center items-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-[#472EAD] border-t-transparent"></div>
                <p className="text-gray-700 font-medium">Chargement des produits...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
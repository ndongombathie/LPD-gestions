// ==========================================================
// 🏪 Boutique.jsx — RECHERCHE PAR NOM UNIQUEMENT (BACKEND)
// ==========================================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search, Eye, X, ChevronLeft, ChevronRight, Package, AlertTriangle, CheckCircle } from "lucide-react";
import boutiqueAPI from "@/services/api/boutique";
import useDebouncedValue from "@/hooks/useDebouncedValue";

const DEFAULT_PER_PAGE = 25;

/* ================= FORMAT PRIX ================= */
const formatFCFA = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

/* ================= ÉTAT STOCK ================= */
const getEtat = (quantite, seuil) => {
  if (quantite === 0) return "rupture";
  if (quantite <= seuil) return "faible";
  return "ok";
};

export default function Boutique() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  
  // État pour la fiche sélectionnée
  const [selectedProduit, setSelectedProduit] = useState(null);

  /* ================= FETCH PAGINÉ ================= */
  const fetchPaginated = useCallback(async () => {
    try {
      setLoading(true);

      const res = await boutiqueAPI.getProduitsControle({
        page,
        per_page: PER_PAGE,
        search: debouncedSearchTerm,
      });

      setRows(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch {
      setError("Erreur lors du chargement des produits boutique");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    fetchPaginated();
  }, [fetchPaginated]);

  /* ================= NORMALISATION + REGROUPEMENT ================= */
  const normalizeAndGroup = (data) => {
    const map = new Map();

    data.forEach((row) => {
      const produit = row.produit ?? {};
      
      // Utilisation de l'ID du produit comme clé pour le regroupement
      // (plus fiable que nom + catégorie_id)
      const key = produit.id || `${produit.nom}-${produit.categorie_id}`;

      const quantite = Number(row.quantite ?? 0);
      const seuil = Number(row.seuil ?? 0);
      const nombre_carton = Number(row.nombre_carton ?? 0);
      
      // Récupérer la catégorie depuis produit.categorie (structure JSON correcte)
      const categorie = produit.categorie ?? {};
      const nom_categorie = categorie.nom ?? "Non catégorisé";

      if (!map.has(key)) {
        map.set(key, {
          id: produit.id ?? key,
          nom: produit.nom ?? "—",
          categorie_id: produit.categorie_id,
          categorie_nom: nom_categorie,
          prix_achat: produit.prix_achat ?? 0,
          nombre_carton,
          quantite,
          seuil,
          // Informations supplémentaires pour la fiche
          description: produit.description ?? "Aucune description",
          code_barre: produit.code_barre ?? "N/A",
          date_creation: produit.created_at ?? null,
          date_modification: produit.updated_at ?? null,
          fournisseur: produit.fournisseur?.nom ?? "Non spécifié"
        });
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

    return Array.from(map.values());
  };

  const pageData = useMemo(() => normalizeAndGroup(rows), [rows]);

  /* ================= RECHERCHE GLOBALE ================= */
  // Désormais gérée par l'API, pageData contient déjà les bons résultats
  const filteredData = pageData;


  // Fonction pour afficher la fiche produit
  const afficherFiche = (produit) => {
    setSelectedProduit(produit);
  };

  // Fonction pour fermer la fiche
  const fermerFiche = () => {
    setSelectedProduit(null);
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

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

/* ================= FICHE PRODUIT ================= */
const FicheProduit = ({ produit, onClose }) => {
  if (!produit) return null;

  const etat = getEtat(produit.quantite, produit.seuil);
  const badge = getEtatBadge(etat);
  const Icon = badge.icon;

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
        {/* En-tête avec catégorie */}
        <div className="bg-gradient-to-r from-[#472EAD] to-[#5a3bc9] text-white p-4 rounded-xl">
          <h3 className="text-xl font-bold mb-2">{produit.nom}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-90">Catégorie:</span>
            <span className="px-3 py-1 bg-white text-[#472EAD] rounded-full text-xs font-semibold">
              {produit.categorie_nom}
            </span>
          </div>
        </div>

        {/* Informations générales */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Informations générales</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Code barre:</span>
              <span className="font-medium">{produit.code_barre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fournisseur:</span>
              <span className="font-medium">{produit.fournisseur}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prix d'achat:</span>
              <span className="font-medium text-[#472EAD]">
                {formatFCFA(produit.prix_achat)}
              </span>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Stock</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Quantité:</span>
              <span className="font-bold text-lg">{produit.quantite}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cartons:</span>
              <span>{produit.nombre_carton}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Seuil d'alerte:</span>
              <span>{produit.seuil}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">État:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                <Icon size={12} />
                {badge.text}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-3">Description</h4>
          <p className="text-gray-600 text-sm">
            {produit.description}
          </p>
        </div>

        {/* Dates */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-1 text-xs text-gray-500">
            {produit.date_creation && (
              <div className="flex justify-between">
                <span>Créé le:</span>
                <span>{new Date(produit.date_creation).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            {produit.date_modification && (
              <div className="flex justify-between">
                <span>Modifié le:</span>
                <span>{new Date(produit.date_modification).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= PAGE PRINCIPALE ================= */
export default function Boutique() {
  // États des données
  const [produits, setProduits] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Recherche - UNIQUEMENT par nom
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Fiche produit
  const [selectedProduit, setSelectedProduit] = useState(null);
  
  // Refs
  const loadingRef = useRef(false);
  const previousParamsRef = useRef('');
  const abortControllerRef = useRef(null);

  /* ============= NORMALISATION ============= */
  const normalizeProduit = useCallback((row) => {
    const produit = row.produit ?? {};
    const categorie = produit.categorie ?? {};
    
    return {
      id: produit.id,
      nom: produit.nom ?? "—",
      categorie_id: produit.categorie_id,
      categorie_nom: categorie.nom ?? "Non catégorisé",
      prix_achat: produit.prix_achat ?? 0,
      nombre_carton: Number(row.nombre_carton ?? 0),
      quantite: Number(row.quantite ?? 0),
      seuil: Number(row.seuil ?? 0),
      description: produit.description ?? "Aucune description",
      code_barre: produit.code_barre ?? "N/A",
      date_creation: produit.created_at ?? null,
      date_modification: produit.updated_at ?? null,
      fournisseur: produit.fournisseur?.nom ?? "Non spécifié"
    };
  }, []);

  /* ============= GÉNÉRATION DES PARAMÈTRES API ============= */
  const getApiParams = useCallback((page = currentPage) => {
    const params = { page };
    
    // ✅ RECHERCHE UNIQUEMENT PAR NOM (côté backend)
    if (activeSearch?.trim()) {
      params.search = activeSearch.trim(); // Le backend doit filtrer par nom
    }
    
    return params;
  }, [activeSearch, currentPage]);

  /* ============= CHARGEMENT DES DONNÉES ============= */
  const loadProduits = useCallback(async (page = 1) => {
    if (loadingRef.current) {
      console.log("⏳ Chargement déjà en cours, ignoré");
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
      
      const res = await boutiqueAPI.getProduitsControle({
        ...params,
        per_page: DEFAULT_PER_PAGE
      });
      
      console.log("📡 Réponse API:", res);
      
      // Normaliser les données
      const produitsData = (res.data || []).map(normalizeProduit);
      
      setProduits(produitsData);
      setTotalPages(res.pagination?.lastPage || 1);
      setTotalItems(res.pagination?.total || 0);
      setCurrentPage(res.pagination?.currentPage || page);
      
      setInitialLoadDone(true);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("❌ Erreur chargement:", error);
        setProduits([]);
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [getApiParams, initialLoadDone, normalizeProduit]);

  /* ============= EFFET DE CHARGEMENT UNIQUE ============= */
  useEffect(() => {
    loadProduits(1);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /* ============= EFFET POUR LA RECHERCHE ============= */
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

  /* ============= RÉINITIALISATION ============= */
  const handleReset = useCallback(() => {
    setSearchTerm("");
    setActiveSearch("");
    setCurrentPage(1);
    loadProduits(1);
  }, [loadProduits]);

  /* ============= GESTION DE LA TOUCHE ENTRÉE ============= */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#472EAD]">
                Contrôle Gestionnaire — Boutique
              </h1>
              <div className="text-sm bg-indigo-50 text-[#472EAD] px-4 py-2 rounded-xl font-medium">
                {!isLoading && totalItems > 0 && (
                  <span>{totalItems} produit{totalItems > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RECHERCHE PAR NOM UNIQUEMENT */}
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

            {/* RECHERCHE ACTIVE */}
            {activeSearch && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">Recherche active :</span>
                <div className="flex items-center gap-2 flex-wrap">
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
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    Voir tous les produits
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABLEAU */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Liste des produits
              </h2>
            </div>
            
            {!isLoading && produits.length === 0 ? (
              <div className="text-center py-16">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {activeSearch
                    ? "Aucun produit ne correspond à votre recherche"
                    : "Aucun produit trouvé"}
                </p>
                {activeSearch && (
                  <button
                    onClick={handleReset}
                    className="mt-2 text-[#472EAD] hover:underline text-sm font-medium"
                  >
                    Voir tous les produits
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
                          <th className="p-3 text-left text-gray-600 font-semibold">Catégorie</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Prix</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Cartons</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Seuil</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">État</th>
                          <th className="p-3 text-center text-gray-600 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produits.map((p) => {
                          const etat = getEtat(p.quantite, p.seuil);
                          const badge = getEtatBadge(etat);
                          const Icon = badge.icon;

                          return (
                            <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="p-3 font-medium">{p.nom}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  {p.categorie_nom}
                                </span>
                              </td>
                              <td className="p-3 text-center">{formatFCFA(p.prix_achat)}</td>
                              <td className="p-3 text-center">{p.nombre_carton}</td>
                              <td className="p-3 text-center">{p.seuil}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                  <Icon size={12} />
                                  {badge.text}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setSelectedProduit(p)}
                                  className="p-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#36238b] transition-colors"
                                  title="Voir la fiche"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
                      onClose={() => setSelectedProduit(null)}
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

      {/* PAGINATION */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-between items-center text-sm bg-white rounded-2xl shadow-md p-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Précédent
          </button>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#472EAD]">
              Page {pagination.currentPage} / {pagination.lastPage}
            </span>
          </div>

          <button
            disabled={page === pagination.lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
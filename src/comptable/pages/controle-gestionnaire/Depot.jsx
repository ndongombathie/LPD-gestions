// ==========================================================
// 🏭 DepotControle.jsx — API À LA DEMANDE
// Comportement :
//   • Un appel API à chaque changement de page
//   • Un appel API à chaque recherche (debounced)
//   • Cache pour les mouvements uniquement
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Search, Eye, X, Package, TrendingUp, TrendingDown,
  Layers, AlertCircle, Activity,
  RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import depotAPI from "@/services/api/depot";

const DEFAULT_PER_PAGE = 20;

/* ================= FORMAT PRIX ================= */
const formatFCFA = (v = 0) =>
  Number(v).toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";

/* ================= COMPOSANT PAGINATION ================= */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between w-full">
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
                ? "bg-violet-600 text-white"
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

export default function DepotControle() {
  // ── Data
  const [produits, setProduits] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── UI state
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduit, setSelectedProduit] = useState(null);

  // ── Mouvements avec cache
  const [mouvements, setMouvements] = useState([]);
  const [loadingMvt, setLoadingMvt] = useState(false);
  const mvtCache = useRef(new Map());

  // ── Debounce timer
  const debounceTimer = useRef(null);
  
  // ── AbortController pour annuler les requêtes
  const abortControllerRef = useRef(null);

  /* ═══════════════════════════════════════════════════════
     CHARGEMENT DES PRODUITS (page courante + recherche)
  ═══════════════════════════════════════════════════════ */
  const fetchProduits = useCallback(async (pageNum = page, searchTerm = search) => {
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        per_page: DEFAULT_PER_PAGE
      };

      // Ajouter la recherche si elle existe
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log("📡 Chargement page:", pageNum, "recherche:", searchTerm);
      
      const response = await depotAPI.getProduitsControle(params);
      
      setProduits(response?.data || []);
      setPagination(response?.pagination || null);
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Erreur fetchProduits:", err);
        setError("Erreur lors du chargement des produits");
        setProduits([]);
        setPagination(null);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]); // Dépend de page et search

  // Chargement initial et quand page ou search change
  useEffect(() => {
    fetchProduits(page, search);
    
    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, search, fetchProduits]);

  /* ═══════════════════════════════════════════════════════
     DEBOUNCE RECHERCHE
  ═══════════════════════════════════════════════════════ */
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setSearch(value);
      setPage(1); // Reset à la première page pour la nouvelle recherche
    }, 500); // 500ms de debounce
  }, []);

  /* ═══════════════════════════════════════════════════════
     CHANGEMENT DE PAGE
  ═══════════════════════════════════════════════════════ */
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.lastPage || 1) && !loading) {
      setPage(newPage);
    }
  }, [pagination?.lastPage, loading]);

  /* ═══════════════════════════════════════════════════════
     STATISTIQUES (calculées sur la page courante uniquement)
  ═══════════════════════════════════════════════════════ */
  const stats = useMemo(() => {
    const totalCartons = produits.reduce(
      (acc, p) => acc + (p.nombre_carton || 0), 
      0
    );
    
    const alertCount = produits.filter(
      p => (p.nombre_carton || 0) <= (p.stock_seuil || 0)
    ).length;
    
    return { totalCartons, alertCount };
  }, [produits]);

  /* ═══════════════════════════════════════════════════════
     MOUVEMENTS AVEC CACHE
  ═══════════════════════════════════════════════════════ */
  const afficherFiche = useCallback(async (produit) => {
    setSelectedProduit(produit);

    // Vérifier le cache
    if (mvtCache.current.has(produit.id)) {
      setMouvements(mvtCache.current.get(produit.id));
      return;
    }

    try {
      setLoadingMvt(true);
      setMouvements([]);
      
      const response = await depotAPI.getMouvementsProduit(produit.id);
      const data = response?.data || [];
      
      // Mettre en cache
      mvtCache.current.set(produit.id, data);
      setMouvements(data);
    } catch (err) {
      console.error("Erreur chargement mouvements:", err);
    } finally {
      setLoadingMvt(false);
    }
  }, []);

  const fermerFiche = useCallback(() => {
    setSelectedProduit(null);
    setMouvements([]);
  }, []);

  /* ═══════════════════════════════════════════════════════
     RÉINITIALISATION
  ═══════════════════════════════════════════════════════ */
  const handleRefresh = useCallback(() => {
    mvtCache.current.clear(); // Vider le cache des mouvements
    fetchProduits(page, search); // Recharger la page courante
  }, [page, search, fetchProduits]);

  /* ═══════════════════════════════════════════════════════
     EFFACER RECHERCHE
  ═══════════════════════════════════════════════════════ */
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  /* ═══════════════════════════════════════════════════════
     EARLY RETURNS
  ═══════════════════════════════════════════════════════ */
  if (loading && produits.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Chargement des produits…</p>
        </div>
      </div>
    );
  }

  if (error && produits.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER PRINCIPAL
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 lg:p-8">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-500 mb-1">
            Gestionnaire · Dépôt
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            Contrôle{" "}
            <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
              Stock
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Layers size={12} /> {pagination?.total || 0} total
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Package size={12} /> {stats.totalCartons} cartons
          </span>
          {stats.alertCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-500 text-xs font-semibold px-3 py-1.5 rounded-full">
              <AlertCircle size={12} /> {stats.alertCount} alerte{stats.alertCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Rafraîchir"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              loading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-50 border border-slate-200 text-slate-400 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-500"
            }`}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={searchInput}
          onChange={handleSearchChange}
          disabled={loading}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── INDICATEUR DE CHARGEMENT (overlay léger) ── */}
      {loading && (
        <div className="mb-4 flex justify-center">
          <div className="bg-violet-50 text-violet-600 text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
            Chargement...
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className={`grid gap-5 ${selectedProduit ? "grid-cols-1 lg:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>

        {/* ── TABLE ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-slate-400">Produit</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-slate-400">Fournisseur</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-slate-400">Prix Achat</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-slate-400">Cartons</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-slate-400">Seuil</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-slate-400">Fiche</th>
                </tr>
              </thead>
              <tbody>
                {produits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Package size={32} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 text-sm">
                        {search ? "Aucun produit trouvé" : "Aucun produit disponible"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  produits.map((p) => {
                    const belowSeuil = (p.nombre_carton || 0) <= (p.stock_seuil || 0);
                    const isActive = selectedProduit?.id === p.id;
                    
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-100 last:border-b-0 transition-colors ${
                          isActive
                            ? "bg-violet-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isActive
                                ? "bg-violet-600"
                                : "bg-gradient-to-br from-violet-400 to-purple-500"
                            }`} />
                            <span className="font-semibold text-slate-800">{p.nom}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-block bg-slate-100 rounded-md px-2.5 py-1 text-xs text-slate-500 font-medium">
                            {p.fournisseur_nom || p.fournisseur?.nom || "Non défini"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="font-bold text-xs text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md whitespace-nowrap border border-violet-100">
                            {formatFCFA(p.prix_achat)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="font-black text-lg text-slate-800">{p.nombre_carton}</span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            belowSeuil
                              ? "bg-rose-50 border-rose-200 text-rose-500"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600"
                          }`}>
                            {belowSeuil ? <TrendingUp size={11} className="rotate-180" /> : <TrendingUp size={11} />}
                            {p.stock_seuil || 0}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => afficherFiche(p)}
                            disabled={loadingMvt}
                            className={`w-8 h-8 rounded-lg text-white flex items-center justify-center mx-auto shadow-sm hover:-translate-y-px active:scale-95 transition-all ${
                              isActive
                                ? "bg-violet-700 shadow-violet-200"
                                : "bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-violet-100 hover:shadow-violet-200"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.lastPage > 1 && (
            <div className="px-5 py-4 border-t border-slate-200">
              <Pagination
                currentPage={pagination.currentPage || page}
                totalPages={pagination.lastPage || 1}
                onPageChange={handlePageChange}
                totalItems={pagination.total || 0}
              />
            </div>
          )}
        </div>

        {/* ── FICHE PRODUIT ── */}
        {selectedProduit && (
          <div className="bg-white border border-violet-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-fit sticky top-4">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-600 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-violet-200 mb-1">
                  Fiche Produit
                </p>
                <h2 className="font-black text-white text-lg leading-tight">
                  {selectedProduit.nom}
                </h2>
              </div>
              <button
                onClick={fermerFiche}
                className="w-7 h-7 rounded-lg bg-white/20 text-white/80 hover:bg-white/30 hover:text-white flex items-center justify-center flex-shrink-0 transition-all mt-0.5"
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Fournisseur</p>
                  <p className="font-semibold text-slate-700 text-sm">
                    {selectedProduit.fournisseur_nom || selectedProduit.fournisseur?.nom || "Non défini"}
                  </p>
                </div>
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-violet-400 mb-1">Prix Achat</p>
                  <p className="font-bold text-violet-700 text-xs leading-snug">
                    {formatFCFA(selectedProduit.prix_achat)}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Seuil</p>
                  <p className="font-black text-slate-800 text-2xl">{selectedProduit.stock_seuil || 0}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Cartons</p>
                  <p className="font-black text-slate-800 text-2xl">{selectedProduit.nombre_carton || 0}</p>
                </div>
              </div>

              {/* Mouvements */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold tracking-widest uppercase text-violet-500">
                  Mouvements
                </p>
                {mvtCache.current.has(selectedProduit.id) && (
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    cache
                  </span>
                )}
              </div>

              {loadingMvt ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : mouvements.length === 0 ? (
                <div className="text-center py-10">
                  <Activity size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-400 text-xs">Aucun mouvement enregistré</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {mouvements.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                        m.type === "entree"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-rose-50 border-rose-200"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        m.type === "entree"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-500"
                      }`}>
                        {m.type === "entree" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold mb-0.5 ${m.type === "entree" ? "text-emerald-700" : "text-rose-600"}`}>
                          {m.type === "entree" ? "Entrée" : "Sortie"} — {m.quantite}
                        </p>
                        <p className="text-slate-500 truncate">{m.source} → {m.destination}</p>
                        <p className="text-slate-400 mt-0.5">
                          {new Date(m.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
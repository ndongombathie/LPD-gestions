// ==========================================================
// 🏭 DepotControle.jsx — FOND BLANC + API OPTIMISÉE
// Optimisations :
//   ① Un seul fetch initial (per_page=200, toutes pages en parallèle)
//   ② Pagination côté client — plus de re-fetch au changement de page
//   ③ Cache mouvements (Map) — pas de re-fetch si déjà chargé
//   ④ Debounce recherche (300ms) — pas de recalcul à chaque frappe
//   ⑤ useMemo sur filtrage/tri — recalcul uniquement si données changent
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Search, Eye, X, Package, TrendingUp, TrendingDown,
  ArrowLeft, ArrowRight, Layers, AlertCircle, Activity,
  RefreshCw
} from "lucide-react";
import depotAPI from "@/services/api/depot";

const PER_PAGE = 20;

export default function DepotControle() {
  // ── Data
  const [allProduits, setAllProduits]       = useState([]);       // source unique de vérité
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  // ── UI state
  const [page, setPage]                     = useState(1);
  const [searchInput, setSearchInput]       = useState("");        // valeur brute du champ
  const [search, setSearch]                 = useState("");        // valeur debouncée
  const [selectedProduit, setSelectedProduit] = useState(null);

  // ── Mouvements avec cache
  const [mouvements, setMouvements]         = useState([]);
  const [loadingMvt, setLoadingMvt]         = useState(false);
  const mvtCache                            = useRef(new Map());   // ③ cache par produit.id

  // ── Debounce ref
  const debounceRef = useRef(null);

  /* ═══════════════════════════════════════════════════════
     ① FETCH UNIQUE — toutes pages en parallèle
     On récupère d'abord la page 1 pour connaître lastPage,
     puis on fetch les pages restantes en Promise.all
  ═══════════════════════════════════════════════════════ */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Page 1 — donne lastPage
      const first = await depotAPI.getProduitsControle({ page: 1, per_page: 100 });
      const lastPage = first?.pagination?.lastPage || 1;
      let data = first?.data || [];

      // Pages restantes en parallèle
      if (lastPage > 1) {
        const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
        const results = await Promise.all(
          pages.map(p => depotAPI.getProduitsControle({ page: p, per_page: 100 }))
        );
        results.forEach(r => { data = [...data, ...(r?.data || [])]; });
      }

      setAllProduits(data);
    } catch {
      setError("Erreur lors du chargement des produits dépôt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ═══════════════════════════════════════════════════════
     ④ DEBOUNCE recherche — 300 ms
  ═══════════════════════════════════════════════════════ */
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  /* ═══════════════════════════════════════════════════════
     ⑤ GROUPEMENT + FILTRE — mémoïsé
  ═══════════════════════════════════════════════════════ */
  const groupedProduits = useMemo(() => {
    const map = new Map();
    allProduits.forEach((p) => {
      const key = `${p.nom}-${p.categorie_id}`;
      if (!map.has(key)) map.set(key, { ...p });
      else map.get(key).nombre_carton += p.nombre_carton || 0;
    });
    return Array.from(map.values());
  }, [allProduits]);

  const filteredProduits = useMemo(() => {
    if (!search.trim()) return groupedProduits;
    const q = search.toLowerCase();
    return groupedProduits.filter(p => p.nom?.toLowerCase().includes(q));
  }, [search, groupedProduits]);

  // ② Pagination 100% client
  const totalPages    = Math.max(1, Math.ceil(filteredProduits.length / PER_PAGE));
  const displayedProduits = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredProduits.slice(start, start + PER_PAGE);
  }, [filteredProduits, page]);

  /* ═══════════════════════════════════════════════════════
     ③ MOUVEMENTS avec cache
  ═══════════════════════════════════════════════════════ */
  const afficherFiche = async (produit) => {
    setSelectedProduit(produit);

    if (mvtCache.current.has(produit.id)) {
      setMouvements(mvtCache.current.get(produit.id));
      return;
    }

    try {
      setLoadingMvt(true);
      setMouvements([]);
      const res = await depotAPI.getMouvementsProduit(produit.id);
      const data = res?.data || [];
      mvtCache.current.set(produit.id, data);
      setMouvements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMvt(false);
    }
  };

  const fermerFiche = () => { setSelectedProduit(null); setMouvements([]); };

  /* ═══════════════════════════════════════════════════════
     UTILS
  ═══════════════════════════════════════════════════════ */
  const formatFCFA = (v = 0) =>
    Number(v).toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";

  const totalCartons = useMemo(
    () => filteredProduits.reduce((a, p) => a + (p.nombre_carton || 0), 0),
    [filteredProduits]
  );
  const alertCount = useMemo(
    () => filteredProduits.filter(p => (p.nombre_carton || 0) <= (p.stock_seuil || 0)).length,
    [filteredProduits]
  );

  /* ═══════════════════════════════════════════════════════
     EARLY RETURNS
  ═══════════════════════════════════════════════════════ */
  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Chargement des produits…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      </div>
    );

  /* ═══════════════════════════════════════════════════════
     RENDER
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
            <Layers size={12} /> {filteredProduits.length} produits
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Package size={12} /> {totalCartons} cartons
          </span>
          {alertCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-500 text-xs font-semibold px-3 py-1.5 rounded-full">
              <AlertCircle size={12} /> {alertCount} alerte{alertCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={fetchAll}
            title="Rafraîchir"
            className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-violet-50 hover:border-violet-200 hover:text-violet-500 transition-colors"
          >
            <RefreshCw size={12} />
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
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
        />
      </div>

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
                {displayedProduits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Package size={32} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 text-sm">Aucun produit trouvé</p>
                    </td>
                  </tr>
                ) : (
                  displayedProduits.map((p) => {
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
                        {/* Produit */}
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

                        {/* Fournisseur */}
                        <td className="px-5 py-3.5">
                          <span className="inline-block bg-slate-100 rounded-md px-2.5 py-1 text-xs text-slate-500 font-medium">
                            {p.fournisseur_nom || p.fournisseur?.nom || "Non défini"}
                          </span>
                        </td>

                        {/* Prix */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-bold text-xs text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md whitespace-nowrap border border-violet-100">
                            {formatFCFA(p.prix_achat)}
                          </span>
                        </td>

                        {/* Cartons */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-black text-lg text-slate-800">{p.nombre_carton}</span>
                        </td>

                        {/* Seuil */}
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            belowSeuil
                              ? "bg-rose-50 border-rose-200 text-rose-500"
                              : "bg-emerald-50 border-emerald-200 text-emerald-600"
                          }`}>
                            {belowSeuil ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                            {p.stock_seuil || 0}
                          </span>
                        </td>

                        {/* Fiche */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => afficherFiche(p)}
                            className={`w-8 h-8 rounded-lg text-white flex items-center justify-center mx-auto shadow-sm hover:-translate-y-px active:scale-95 transition-all ${
                              isActive
                                ? "bg-violet-700 shadow-violet-200"
                                : "bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-violet-100 hover:shadow-violet-200"
                            }`}
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
        </div>

        {/* ── FICHE PRODUIT ── */}
        {selectedProduit && (
          <div className="bg-white border border-violet-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">

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
            <div className="p-5 flex-1 overflow-y-auto">

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

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft size={14} /> Précédent
          </button>

          <span className="font-black text-sm text-violet-600 bg-violet-50 border border-violet-200 px-4 py-2 rounded-xl">
            {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Suivant <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
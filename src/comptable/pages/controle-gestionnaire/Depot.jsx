// ==========================================================
// 🏭 DepotControle.jsx — VERSION TAILWIND STYLÉE
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search, Eye, X, Package, TrendingUp, TrendingDown,
  ArrowLeft, ArrowRight, Layers, AlertCircle, Activity
} from "lucide-react";
import depotAPI from "@/services/api/depot";

export default function DepotControle() {
  const [produits, setProduits] = useState([]);
  const [allProduits, setAllProduits] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filteredResults, setFilteredResults] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loadingMouvements, setLoadingMouvements] = useState(false);

  /* ================= FETCH ================= */

  const fetchPaginated = useCallback(async () => {
    try {
      setLoading(true);
      const res = await depotAPI.getProduitsControle({ page, per_page: perPage });
      setProduits(res?.data || []);
      setPagination(res?.pagination || null);
    } catch {
      setError("Erreur lors du chargement des produits dépôt");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchAllProduits = useCallback(async () => {
    try {
      let allData = [], currentPage = 1, lastPage = 1;
      do {
        const res = await depotAPI.getProduitsControle({ page: currentPage, per_page: 100 });
        allData = [...allData, ...(res?.data || [])];
        lastPage = res?.pagination?.lastPage || 1;
        currentPage++;
      } while (currentPage <= lastPage);
      setAllProduits(allData);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchPaginated();
    fetchAllProduits();
  }, [fetchPaginated, fetchAllProduits]);

  /* ================= SEARCH ================= */

  const globalGroupedProduits = useMemo(() => {
    const map = new Map();
    allProduits.forEach((p) => {
      const key = `${p.nom}-${p.categorie_id}`;
      if (!map.has(key)) map.set(key, { ...p });
      else map.get(key).nombre_carton += p.nombre_carton || 0;
    });
    return Array.from(map.values());
  }, [allProduits]);

  useEffect(() => {
    if (search.trim()) {
      setIsSearching(true);
      setFilteredResults(globalGroupedProduits.filter(p =>
        p.nom?.toLowerCase().includes(search.toLowerCase())
      ));
      setPage(1);
    } else {
      setIsSearching(false);
      setFilteredResults([]);
    }
  }, [search, globalGroupedProduits]);

  const displayedProduits = useMemo(() => {
    if (isSearching) {
      const start = (page - 1) * perPage;
      return filteredResults.slice(start, start + perPage);
    }
    return produits;
  }, [isSearching, filteredResults, produits, page]);

  const totalPages = useMemo(() => {
    if (isSearching) return Math.ceil(filteredResults.length / perPage);
    return pagination?.lastPage || 1;
  }, [isSearching, filteredResults.length, pagination?.lastPage]);

  /* ================= UTILS ================= */

  const formatFCFA = (v = 0) =>
    Number(v).toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";

  /* ================= MOUVEMENTS ================= */

  const afficherFiche = async (produit) => {
    try {
      setSelectedProduit(produit);
      setLoadingMouvements(true);
      setMouvements([]);
      const res = await depotAPI.getMouvementsProduit(produit.id);
      setMouvements(res?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMouvements(false);
    }
  };

  const fermerFiche = () => { setSelectedProduit(null); setMouvements([]); };

  const handlePageChange = (n) => {
    if (n >= 1 && n <= totalPages) {
      setPage(n);
      if (!isSearching) fetchPaginated();
    }
  };

  /* ================= STATS ================= */

  const totalCartons = displayedProduits.reduce((a, p) => a + (p.nombre_carton || 0), 0);
  const alertCount = displayedProduits.filter(p => (p.nombre_carton || 0) <= (p.stock_seuil || 0)).length;

  /* ================= EARLY RETURNS ================= */

  if (loading && !produits.length)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-violet-400 flex items-center gap-3 text-sm font-medium">
          <Activity size={18} className="animate-pulse" />
          Chargement…
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 lg:p-8">

      {/* BG GLOW */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-800/15 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-1">
            Gestionnaire · Dépôt
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            Contrôle{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              Stock
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full">
            <Layers size={12} />
            {displayedProduits.length} produits
          </span>
          <span className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full">
            <Package size={12} />
            {totalCartons} cartons
          </span>
          {alertCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium px-3 py-1.5 rounded-full">
              <AlertCircle size={12} />
              {alertCount} alerte{alertCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/60 focus:bg-violet-500/[0.06] focus:ring-2 focus:ring-violet-500/10 transition-all"
        />
      </div>

      {/* MAIN GRID */}
      <div className={`grid gap-5 ${selectedProduit ? "grid-cols-1 lg:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>

        {/* TABLE */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-500/[0.08] border-b border-violet-500/20">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-violet-400">Produit</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-violet-400">Fournisseur</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-violet-400">Prix Achat</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-violet-400">Cartons</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-violet-400">Seuil</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-widest uppercase text-violet-400">Fiche</th>
                </tr>
              </thead>
              <tbody>
                {displayedProduits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Package size={32} className="mx-auto mb-3 text-slate-700" />
                      <p className="text-slate-600 text-sm">Aucun produit trouvé</p>
                    </td>
                  </tr>
                ) : (
                  displayedProduits.map((p) => {
                    const belowSeuil = (p.nombre_carton || 0) <= (p.stock_seuil || 0);
                    return (
                      <tr key={p.id} className="border-b border-white/[0.04] hover:bg-violet-500/[0.05] transition-colors last:border-b-0">

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex-shrink-0" />
                            <span className="font-semibold text-white">{p.nom}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-block bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-400 font-medium">
                            {p.fournisseur_nom || p.fournisseur?.nom || "Non défini"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="font-bold text-xs text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">
                            {formatFCFA(p.prix_achat)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className="font-black text-lg text-white">{p.nombre_carton}</span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            belowSeuil
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          }`}>
                            {belowSeuil ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                            {p.stock_seuil || 0}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => afficherFiche(p)}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-px active:scale-95 transition-all"
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

        {/* FICHE PRODUIT */}
        {selectedProduit && (
          <div className="bg-white/[0.03] border border-violet-500/20 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col">

            {/* Fiche Header */}
            <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/10 border-b border-violet-500/20 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-violet-400 mb-1">
                  Fiche Produit
                </p>
                <h2 className="font-black text-white text-lg leading-tight">
                  {selectedProduit.nom}
                </h2>
              </div>
              <button
                onClick={fermerFiche}
                className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/10 text-slate-400 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300 flex items-center justify-center flex-shrink-0 transition-all mt-0.5"
              >
                <X size={13} />
              </button>
            </div>

            {/* Fiche Body */}
            <div className="p-5 flex-1 overflow-y-auto">

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="col-span-2 bg-white/[0.04] border border-white/[0.07] rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Fournisseur</p>
                  <p className="font-semibold text-slate-200 text-sm">
                    {selectedProduit.fournisseur_nom || selectedProduit.fournisseur?.nom || "Non défini"}
                  </p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Prix Achat</p>
                  <p className="font-bold text-violet-300 text-xs">{formatFCFA(selectedProduit.prix_achat)}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3.5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Seuil</p>
                  <p className="font-black text-white text-xl">{selectedProduit.stock_seuil || 0}</p>
                </div>
              </div>

              {/* Mouvements */}
              <p className="text-[10px] font-bold tracking-widest uppercase text-violet-400 mb-3">
                Mouvements
              </p>

              {loadingMouvements ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
                  ))}
                </div>
              ) : mouvements.length === 0 ? (
                <div className="text-center py-10">
                  <Package size={28} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-slate-600 text-xs">Aucun mouvement enregistré</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {mouvements.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                        m.type === "entree"
                          ? "bg-emerald-500/[0.06] border-emerald-500/15"
                          : "bg-rose-500/[0.06] border-rose-500/15"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        m.type === "entree"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}>
                        {m.type === "entree" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold mb-0.5 ${m.type === "entree" ? "text-emerald-300" : "text-rose-300"}`}>
                          {m.type === "entree" ? "Entrée" : "Sortie"} — {m.quantite}
                        </p>
                        <p className="text-slate-500 truncate">{m.source} → {m.destination}</p>
                        <p className="text-slate-600 mt-0.5">
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-400 text-sm font-medium hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 hover:-translate-y-px disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft size={14} /> Précédent
          </button>

          <span className="font-black text-sm text-violet-400 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl">
            {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-slate-400 text-sm font-medium hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 hover:-translate-y-px disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Suivant <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
// Products.jsx (version finale avec modifications)
import React, { useState, useMemo, useEffect } from "react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useFournisseurs } from "../hooks/useFournisseurs";
import { useHistorique } from "../hooks/useHistorique";
import "../styles/depot-fix.css";

// Icônes (gardez les mêmes)
import {
  FaSearch, FaPlus, FaBoxOpen, FaBarcode, FaTags, FaBoxes, FaCubes,
  FaMoneyBillWave, FaCoins, FaBalanceScale, FaExclamationTriangle,
  FaCheckCircle, FaArrowDown, FaFire, FaTimesCircle, FaEdit, FaTrashAlt,
  FaArrowUp, FaClock, FaUserTie, FaRegStickyNote, FaList, FaSlidersH,
  FaHistory, FaWarehouse, FaSortAlphaDown, FaTools, FaCheck, FaFolder,
  FaFolderPlus, FaFilter, FaSortAmountDown, FaChevronDown, FaAngleLeft,
  FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaTruck, FaBuilding,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaSave, FaTimes, FaEye, FaUndoAlt
} from "react-icons/fa";

// Fonction utilitaire getStatus
const getStatus = (stockActuel, stockMinimum) => {
  const cartons = Number(stockActuel) || 0;
  const stockMin = Number(stockMinimum) || 0;
  if (cartons === 0) return { label: "Rupture", className: "bg-gray-200 text-gray-700" };
  if (cartons < 10 || cartons < stockMin * 0.3) return { label: "Critique", className: "bg-red-100 text-red-700" };
  if (cartons <= stockMin) return { label: "Faible", className: "bg-yellow-100 text-yellow-700" };
  return { label: "Normal", className: "bg-green-100 text-green-700" };
};

// Composant StatusBadge
const StatusBadge = ({ status }) => {
  const { label, className } = status;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label === "Normal" && <FaCheckCircle className="text-green-700" />}
      {label === "Faible" && <FaArrowDown className="text-yellow-600" />}
      {label === "Critique" && <FaFire className="text-red-600" />}
      {label === "Rupture" && <FaTimesCircle className="text-gray-600" />}
      <span>{label}</span>
    </span>
  );
};

// Composant Pagination
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-slate-200">
      <div className="text-sm text-slate-600">
        Affichage <span className="font-bold text-slate-800">{startItem}</span> à <span className="font-bold text-slate-800">{endItem}</span> sur <span className="font-bold text-blue-600">{totalItems}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded border bg-white hover:bg-slate-100 disabled:opacity-50">
          <FaAngleLeft />
        </button>
        
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, idx) => (
            page === '...' ? <span key={idx} className="px-1 text-slate-400">...</span> :
            <button key={idx} onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded border flex items-center justify-center text-sm font-medium transition-colors ${
                currentPage === page ? 'bg-[#472EAD] text-white border-[#472EAD]' : 'bg-white hover:bg-slate-50'
              }`}>
              {page}
            </button>
          ))}
        </div>
        
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border bg-white hover:bg-slate-100 disabled:opacity-50">
          <FaAngleRight />
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// SOUS-COMPOSANTS
// =========================================================================

// ProductListTab (onglet Liste)
const ProductListTab = ({
  products,
  categories,
  fournisseurs,
  total,
  currentPage,
  totalPages,
  goToPage,
  onEdit,
  onDelete,
  loading,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  sortMode,
  setSortMode,
  pageSize
}) => {
  // Calculs des stats (filtrées localement)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm || 
        p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "Toutes" || p.categorie_nom === categoryFilter;
      const status = getStatus(p.nombre_carton, p.stock_seuil);
      const matchesStatus = statusFilter === "Tous" || status.label === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      if (sortMode === "name-asc") return a.nom?.localeCompare(b.nom);
      if (sortMode === "name-desc") return b.nom?.localeCompare(a.nom);
      if (sortMode === "stock-asc") return (a.nombre_carton || 0) - (b.nombre_carton || 0);
      if (sortMode === "stock-desc") return (b.nombre_carton || 0) - (a.nombre_carton || 0);
      return 0;
    });
  }, [products, searchTerm, categoryFilter, statusFilter, sortMode]);

  const totalValue = filteredProducts.reduce((acc, p) => acc + (p.prix_unite_carton * p.nombre_carton), 0);
  const nbFaible = filteredProducts.filter(p => getStatus(p.nombre_carton, p.stock_seuil).label === "Faible").length;
  const nbRupture = filteredProducts.filter(p => getStatus(p.nombre_carton, p.stock_seuil).label === "Rupture").length;

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="text-sm text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">
              <span className="font-bold text-[#472EAD]">{total}</span> produits au total
            </div>
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
            >
              <option value="Toutes">Toutes catégories</option>
              {Array.from(new Set(products.map(p => p.categorie_nom).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Normal">Normal</option>
              <option value="Faible">Faible</option>
              <option value="Rupture">Rupture</option>
            </select>

            <div className="flex items-center border border-slate-300 rounded-lg bg-white px-3 py-2 gap-2">
              <FaSortAlphaDown className="text-slate-400" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="bg-transparent outline-none text-sm cursor-pointer focus:ring-2 focus:ring-[#472EAD]"
              >
                <option value="name-asc">Nom (A-Z)</option>
                <option value="name-desc">Nom (Z-A)</option>
                <option value="stock-asc">Stock (Croissant)</option>
                <option value="stock-desc">Stock (Décroissant)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes Stats - modifiées : suppression de Critique */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 text-white rounded-lg"><FaCoins size={20}/></div>
          <div><p className="text-xs text-white/90 uppercase font-bold">Valeur Stock</p><p className="text-xl font-bold text-white">{totalValue.toLocaleString("fr-FR")} F</p></div>
        </div>
        <div className="bg-gradient-to-r from-[#F58020] to-[#FFA94D] rounded-xl shadow-sm p-4 flex items-center gap-4">
           <div className="p-3 bg-white/20 text-white rounded-lg"><FaExclamationTriangle size={20}/></div>
           <div><p className="text-xs text-white/90 uppercase font-bold">Faible</p><p className="text-xl font-bold text-white">{nbFaible}</p></div>
        </div>
        <div className="bg-gradient-to-r from-[#6B7280] to-[#9CA3AF] rounded-xl shadow-sm p-4 flex items-center gap-4">
           <div className="p-3 bg-white/20 text-white rounded-lg"><FaTimesCircle size={20}/></div>
           <div><p className="text-xs text-white/90 uppercase font-bold">Rupture</p><p className="text-xl font-bold text-white">{nbRupture}</p></div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Produit</th>
                <th className="p-4 text-center">Code-barre</th>
                <th className="p-4 text-center">Catégorie</th>
                <th className="p-4 text-center">Fournisseur</th>
                <th className="p-4 text-center">Cartons</th>
                <th className="p-4 text-center">Unités/Ctn</th>
                <th className="p-4 text-right">Prix/Ctn</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Min.</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const status = getStatus(p.nombre_carton, p.stock_seuil);
                const totalPrice = p.nombre_carton * p.prix_unite_carton;
                const fournisseur = fournisseurs.find(f => f.id === p.fournisseur_id);
                return (
                  <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{p.nom}</td>
                    <td className="p-4 text-center font-mono text-slate-500 text-xs">{p.code || "-"}</td>
                    <td className="p-4 text-center"><span className="inline-block bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] px-2 py-1 rounded text-xs font-medium">{p.categorie_nom}</span></td>
                    <td className="p-4 text-center">
                      {fournisseur ? <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F0F9FF] to-[#F0FDF4] text-[#472EAD] px-2 py-1 rounded text-xs"><FaTruck className="text-[10px]" /> {fournisseur.nom}</span> : <span className="text-slate-300 text-xs">-</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">{p.nombre_carton}</td>
                    <td className="p-4 text-center text-slate-500">{p.unite_carton}</td>
                    <td className="p-4 text-right font-mono text-slate-600">{Number(p.prix_unite_carton).toLocaleString("fr-FR")}</td>
                    <td className="p-4 text-right font-mono font-bold text-[#472EAD]">{Number(totalPrice).toLocaleString("fr-FR")}</td>
                    <td className="p-4 text-center text-[#F58020] font-medium">{p.stock_seuil}</td>
                    <td className="p-4 text-center"><StatusBadge status={status} /></td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEdit(p)} className="p-1.5 text-[#472EAD] hover:bg-[#F7F5FF] rounded transition-colors" title="Modifier">
                          <FaEdit />
                        </button>
                        <button onClick={() => onDelete(p.id)} className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded transition-colors" title="Supprimer">
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={11} className="p-8 text-center text-slate-400 italic">
                  {loading ? "Chargement en cours..." : "Aucun produit trouvé."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={total}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Nouvel onglet Ajustement avec sous-onglets Rupture/Faible
const AdjustmentTab = ({ products, onAdjust }) => {
  const [subTab, setSubTab] = useState("rupture"); // 'rupture' ou 'faible'
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer selon le statut
  const filteredByStatus = products.filter(p => {
    const status = getStatus(p.nombre_carton, p.stock_seuil).label;
    if (subTab === "rupture") return status === "Rupture";
    if (subTab === "faible") return status === "Faible";
    return false;
  });

  // Filtrer par recherche
  const displayedProducts = filteredByStatus.filter(p =>
    !searchTerm || p.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sous-onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setSubTab("rupture")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === "rupture"
              ? "border-b-2 border-[#472EAD] text-[#472EAD]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Produits en rupture
        </button>
        <button
          onClick={() => setSubTab("faible")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === "faible"
              ? "border-b-2 border-[#472EAD] text-[#472EAD]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Produits faibles
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3">
        <FaSearch className="text-[#472EAD]" />
        <input
          type="text"
          placeholder={`Rechercher dans les produits ${subTab === "rupture" ? "en rupture" : "faibles"}...`}
          className="flex-1 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#472EAD]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Liste des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]">
          <h3 className="font-bold text-[#472EAD] flex items-center gap-2">
            <FaList className="text-[#472EAD]"/> 
            {displayedProducts.length} produit(s) {subTab === "rupture" ? "en rupture" : "faibles"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-slate-600 font-semibold uppercase text-xs">
              <tr>
                <th className="p-3 pl-4">Produit</th>
                <th className="p-3 text-center">Stock Actuel</th>
                <th className="p-3 text-center">Statut</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProducts.map(p => {
                const status = getStatus(p.nombre_carton, p.stock_seuil);
                return (
                  <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition">
                    <td className="p-3 pl-4">
                      <div className="font-medium text-slate-800">{p.nom}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <FaBarcode size={10}/> {p.code || "N/A"}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{p.nombre_carton} <span className="text-xs font-normal text-slate-400">ctn</span></td>
                    <td className="p-3 text-center"><StatusBadge status={status} /></td>
                    <td className="p-3 text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onAdjust(p, 'reappro')} className="p-2 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white rounded hover:opacity-90" title="Réapprovisionner">
                          <FaPlus size={12} />
                        </button>
                        <button onClick={() => onAdjust(p, 'diminue')} className="p-2 bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white rounded hover:opacity-90" title="Diminuer">
                          <FaArrowDown size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayedProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                    Aucun produit {subTab === "rupture" ? "en rupture" : "faible"} trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Onglet Historique (sans les cartes)
const HistoryTab = ({ history, loading, total, currentPage, totalPages, fetchHistorique, setCurrentPage, pageSize }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = !searchTerm || item.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "Tous" || item.type === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      if (sortBy === "date-desc") return dateB - dateA;
      if (sortBy === "date-asc") return dateA - dateB;
      return 0;
    });
  }, [history, searchTerm, typeFilter, sortBy]);

  const openDetail = (item) => {
    setSelectedHistoryItem(item);
    setDetailModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-[#472EAD]" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#472EAD] mb-1">
              <FaFilter className="inline mr-1" />Type d'action
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="Tous">Tous</option>
              <option value="Modification">Modifications</option>
              <option value="Suppression">Suppressions</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#472EAD] mb-1">
              <FaSortAmountDown className="inline mr-1" />Trier par
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            >
              <option value="date-desc">Date (récent → ancien)</option>
              <option value="date-asc">Date (ancien → récent)</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-[#472EAD] font-semibold">
          {filteredHistory.length} action(s) trouvée(s)
        </div>
      </div>

      {/* Suppression des trois cartes */}

      <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] border-b text-[#472EAD]">
            <tr>
              <th className="p-3 text-left">Date & Heure</th>
              <th className="p-3 text-left">Produit</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Détails</th>
              <th className="p-3 text-left">Gestionnaire</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? filteredHistory.map((item, index) => (
              <tr key={item.id || index} className="border-t hover:bg-[#F7F5FF]/30 transition-colors">
                <td className="p-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-[#472EAD]" />{item.date || "N/A"}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-[#472EAD] flex items-center gap-2">
                    <FaBoxOpen />{item.productName}
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                    item.type === "Modification" ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200" : 
                    item.type === "Suppression" ? "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200" : 
                    "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200"
                  }`}>
                    {item.type === "Modification" ? <FaEdit /> : item.type === "Suppression" ? <FaTrashAlt /> : <FaHistory />}
                    {item.type}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => openDetail(item)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#472EAD] text-white text-xs rounded hover:bg-[#3a2590] transition"
                  >
                    <FaEye size={12} />
                    Détails
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-[#472EAD]" />
                    <span className="font-medium text-[#472EAD]">{item.manager || "Gestionnaire Dépôt"}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="text-gray-400">
                    <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium text-[#472EAD]">Aucun historique</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={total}
          pageSize={pageSize}
        />
      )}

      {/* Modal de détail historique (identique) */}
      {detailModalOpen && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaHistory className="text-[#472EAD]" />
              Détails de l'action
            </h3>
            <div className="space-y-3">
              <p><span className="font-bold">Produit :</span> {selectedHistoryItem.productName}</p>
              <p><span className="font-bold">Type :</span> {selectedHistoryItem.type}</p>
              <p><span className="font-bold">Date :</span> {selectedHistoryItem.date}</p>
              
              {selectedHistoryItem.type === "Suppression" && (
                <div>
                  <p className="font-bold">Détails de la suppression :</p>
                  <div className="bg-red-50 p-3 rounded border border-red-200 mt-1">
                    <p className="text-sm">
                      Produit supprimé : <span className="font-semibold">{selectedHistoryItem.productName}</span>
                    </p>
                    <p className="text-sm">
                      Stock avant suppression : <span className="font-semibold">{selectedHistoryItem.changes?.stock_avant || 0}</span> cartons
                    </p>
                  </div>
                </div>
              )}

              {selectedHistoryItem.type === "Modification" && (
                <div>
                  <p className="font-bold">Modifications effectuées :</p>
                  {selectedHistoryItem.changes && Object.keys(selectedHistoryItem.changes).length > 0 ? (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-1 space-y-2">
                      {Object.entries(selectedHistoryItem.changes).map(([field, value]) => {
                        let fieldName = field;
                        if (field === 'nom') fieldName = 'Nom';
                        if (field === 'categorie_id') fieldName = 'Catégorie';
                        if (field === 'fournisseur_id') fieldName = 'Fournisseur';
                        if (field === 'unite_carton') fieldName = 'Unités par carton';
                        if (field === 'prix_unite_carton') fieldName = 'Prix par carton';
                        if (field === 'stock_seuil') fieldName = 'Stock minimum';
                        if (field === 'code') fieldName = 'Code-barre';

                        return (
                          <div key={field} className="text-sm border-b border-blue-100 pb-1 last:border-0">
                            <span className="font-medium">{fieldName} :</span>
                            <div className="ml-2 text-gray-700">
                              <span className="text-red-600 line-through mr-2">{value.from}</span>
                              <span className="text-green-600">→ {value.to}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune modification de champ enregistrée</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-sm bg-[#472EAD] text-white rounded hover:bg-[#3a2590]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Onglet Catégories (inchangé)
const CategoriesTab = ({ categories, onEditCategory, onDeleteCategory, onAddCategory }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filtered = categories.filter(cat =>
    !searchTerm || cat.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginated = filtered.slice((page-1)*pageSize, page*pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm bg-slate-50 px-3 py-1 rounded-lg">
              <span className="font-bold text-[#472EAD]">{filtered.length}</span> catégories
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#472EAD]" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] w-full md:w-64"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <button onClick={onAddCategory} className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-all">
            <FaFolderPlus className="text-white"/> Nouvelle Catégorie
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] border-b text-[#472EAD]">
            <tr>
              <th className="p-3 text-left">
                <div className="flex items-center gap-1">
                  <FaFolder className="text-[#472EAD]" />
                  <span>Nom</span>
                </div>
              </th>
              <th className="p-3 text-center">
                <div className="flex items-center gap-1 justify-center">
                  <FaTools className="text-[#472EAD]" />
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((cat) => (
              <tr key={cat.id} className="border-t hover:bg-[#F7F5FF]/30 transition-colors">
                <td className="p-3 font-medium text-[#472EAD]">{cat.nom}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => onEditCategory(cat)} className="inline-flex items-center gap-1 text-[#472EAD] hover:text-[#3a2590] hover:underline text-xs">
                      <FaEdit /><span>Modifier</span>
                    </button>
                    <button onClick={() => onDeleteCategory(cat.id)} className="inline-flex items-center gap-1 text-xs text-[#F58020] hover:text-red-600 hover:underline">
                      <FaTrashAlt /><span>Supprimer</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center">
                  <div className="text-gray-400">
                    <FaFolder className="text-4xl mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium text-[#472EAD]">
                      {filtered.length === 0 ? "Aucune catégorie trouvée" : "Aucune catégorie sur cette page."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 border rounded text-xs disabled:opacity-50 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] hover:opacity-90">Précédent</button>
          <span className="text-xs flex items-center text-[#472EAD] font-bold">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded text-xs disabled:opacity-50 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] hover:opacity-90">Suivant</button>
        </div>
      )}
    </>
  );
};

// =========================================================================
// COMPOSANT PRINCIPAL
// =========================================================================
export default function Products() {
  const [activeTab, setActiveTab] = useState("liste");
  const pageSize = 20;

  // Hooks
  const {
    products,
    total,
    currentPage,
    totalPages,
    loading: productsLoading,
    goToPage,
    addProduct,
    updateProduct,
    deleteProduct,
    reapprovisionner,
    diminuerStock,
    refetch: refetchProducts
  } = useProducts(1, pageSize);

  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory, refetch: refetchCategories } = useCategories();
  const { fournisseurs, loading: fournisseursLoading } = useFournisseurs();

  // Historique
  const {
    history,
    loading: historyLoading,
    total: historyTotal,
    currentPage: historyPage,
    totalPages: historyTotalPages,
    fetchHistorique,
    setCurrentPage: setHistoryPage
  } = useHistorique();

  useEffect(() => {
    if (activeTab === "historique") {
      fetchHistorique(1);
    }
  }, [activeTab, fetchHistorique]);

  // États pour les modales
  const [modalType, setModalType] = useState(null); // 'add', 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // États pour ajustement
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAction, setAdjustAction] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");

  // États pour catégories
  const [categoryModal, setCategoryModal] = useState(null); // 'add', 'edit'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);

  // États pour filtres de l'onglet liste
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortMode, setSortMode] = useState("name-asc");

  // États pour recherche dans les sélecteurs de la modale produit
  const [categoryFilterTerm, setCategoryFilterTerm] = useState("");
  const [fournisseurFilterTerm, setFournisseurFilterTerm] = useState("");

  // ==================== GESTION PRODUITS ====================
  const handleEdit = (product) => {
    setModalType("edit");
    setCurrentProduct(product);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      setDeleteId(null);
    } catch (error) {
      console.error("Erreur suppression", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!currentProduct.nom?.trim()) {
      alert("Le nom du produit est obligatoire.");
      return;
    }

    if (!currentProduct.categorie_id) {
      alert("La catégorie est obligatoire.");
      return;
    }

    const apiPayload = {
      nom: currentProduct.nom.trim(),
      categorie_id: currentProduct.categorie_id,
      nombre_carton: parseInt(currentProduct.nombre_carton) || 0,
      unite_carton: String(parseInt(currentProduct.unite_carton) || 1),
      prix_unite_carton: parseFloat(currentProduct.prix_unite_carton) || 0,
      stock_seuil: parseInt(currentProduct.stock_seuil) || 5,
      code: currentProduct.code?.trim() || '',
      fournisseur_id: currentProduct.fournisseur_id || null
    };

    try {
      if (modalType === "add") {
        await addProduct(apiPayload);
        alert("✅ Produit ajouté avec succès !");
      } else {
        await updateProduct(currentProduct.id, apiPayload);
        alert("✅ Produit modifié avec succès !");
      }
      closeProductModal();
    } catch (error) {
      console.error("❌ Erreur:", error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        let errorMsg = "Erreurs de validation:\n";
        Object.entries(errors).forEach(([field, messages]) => {
          errorMsg += `• ${field}: ${messages.join(', ')}\n`;
        });
        alert(errorMsg);
      } else if (error.response?.data?.message) {
        alert(`❌ ${error.response.data.message}`);
      } else {
        alert("❌ Une erreur est survenue.");
      }
    }
  };

  const closeProductModal = () => {
    setModalType(null);
    setCurrentProduct(null);
    setCategoryFilterTerm("");
    setFournisseurFilterTerm("");
  };

  const handleProductFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  // ==================== GESTION AJUSTEMENT ====================
  const handleAdjust = (product, action) => {
    setAdjustProduct(product);
    setAdjustAction(action);
    setAdjustQuantity("");
    setAdjustModalOpen(true);
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    if (!adjustProduct || !adjustAction) return;
    const qty = parseInt(adjustQuantity);
    if (!qty || qty <= 0) return alert("Quantité invalide");

    try {
      if (adjustAction === "reappro") {
        await reapprovisionner(adjustProduct.id, qty);
        alert("✅ Stock réapprovisionné !");
      } else {
        await diminuerStock(adjustProduct.id, qty);
        alert("✅ Stock diminué !");
      }
      closeAdjustModal();
    } catch (error) {
      console.error("❌ Erreur ajustement:", error);
      alert("❌ Erreur lors de l'ajustement.");
    }
  };

  const closeAdjustModal = () => {
    setAdjustModalOpen(false);
    setAdjustProduct(null);
    setAdjustAction(null);
    setAdjustQuantity("");
  };

  // ==================== GESTION CATÉGORIES ====================
  const handleAddCategory = () => {
    setCategoryModal("add");
    setCurrentCategory({ id: null, nom: "" });
  };

  const handleEditCategory = (cat) => {
    setCategoryModal("edit");
    setCurrentCategory(cat);
  };

  const handleDeleteCategory = (id) => {
    setDeleteCategoryId(id);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!currentCategory?.nom?.trim()) {
      alert("Le nom de la catégorie est obligatoire.");
      return;
    }

    try {
      if (categoryModal === "add") {
        await addCategory(currentCategory.nom);
        alert("✅ Catégorie créée !");
      } else {
        await updateCategory(currentCategory.id, currentCategory.nom);
        alert("✅ Catégorie modifiée !");
      }
      closeCategoryModal();
    } catch (error) {
      console.error("❌ Erreur catégorie:", error);
      alert("❌ Erreur lors de l'enregistrement.");
    }
  };

  const closeCategoryModal = () => {
    setCategoryModal(null);
    setCurrentCategory(null);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    try {
      await deleteCategory(deleteCategoryId);
      setDeleteCategoryId(null);
    } catch (error) {
      console.error("❌ Erreur suppression catégorie:", error);
      alert("❌ Erreur lors de la suppression.");
    }
  };

  const handleCategoryFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory(prev => ({ ...prev, [name]: value }));
  };

  // Filtres pour les options dans la modale produit
  const filteredCategoriesOptions = categories.filter(cat =>
    cat.nom?.toLowerCase().includes(categoryFilterTerm.toLowerCase())
  );

  const filteredFournisseursOptions = fournisseurs.filter(f =>
    f.nom?.toLowerCase().includes(fournisseurFilterTerm.toLowerCase())
  );

  const loading = productsLoading || categoriesLoading || fournisseursLoading;

  return (
    <div className="depot-page space-y-6 font-sans text-slate-800 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FaWarehouse className="text-[#472EAD]" />
            Gestion Avancée des Produits
          </h1>
          {!loading && (
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FaBoxOpen /> {total} produits
              </span>
              {/* Suppression du badge catégories */}
              <span className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FaTruck /> {fournisseurs.length} fournisseurs
              </span>
            </div>
          )}
        </div>

        {activeTab === "liste" && (
          <button onClick={() => { setModalType("add"); setCurrentProduct({}); }} className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-transform active:scale-95">
            <FaPlus /> Nouveau Produit
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto">
        {["liste", "ajustement", "historique", "categories"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg border-b-2 ${
              activeTab === tab
                ? "border-[#472EAD] text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {tab === "liste" && <><FaList /> Liste des Produits</>}
              {tab === "ajustement" && <><FaSlidersH /> Ajustement de Stock</>}
              {tab === "historique" && <><FaHistory /> Historique</>}
              {tab === "categories" && <><FaFolder /> Catégories</>}
            </span>
          </button>
        ))}
      </div>

      {/* Affichage conditionnel des onglets */}
      {loading && activeTab !== "historique" ? (
        <div className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] p-4 rounded-lg border border-[#472EAD]">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#472EAD]"></div>
            <div>
              <p className="font-semibold text-[#472EAD]">Chargement en cours...</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "liste" && (
            <ProductListTab
              products={products}
              categories={categories}
              fournisseurs={fournisseurs}
              total={total}
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={productsLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
              pageSize={pageSize}
            />
          )}
          {activeTab === "ajustement" && (
            <AdjustmentTab
              products={products}
              onAdjust={handleAdjust}
            />
          )}
          {activeTab === "historique" && (
            <HistoryTab
              history={history}
              loading={historyLoading}
              total={historyTotal}
              currentPage={historyPage}
              totalPages={historyTotalPages}
              fetchHistorique={fetchHistorique}
              setCurrentPage={setHistoryPage}
              pageSize={pageSize}
            />
          )}
          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddCategory={handleAddCategory}
            />
          )}
        </>
      )}

      {/* ========== MODALES (inchangées) ========== */}

      {/* MODALE PRODUIT (Ajout/Modification) */}
      {modalType && currentProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaBoxOpen className="text-[#472EAD]" />
              {modalType === "add" ? "Nouveau Produit" : "Modifier le Produit"}
            </h2>
            <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Nom du produit *</label>
                <input
                  type="text"
                  name="nom"
                  value={currentProduct.nom || ""}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  required
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Catégorie *</label>
                <div className="space-y-2">
                  <select
                    name="categorie_id"
                    value={currentProduct.categorie_id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedCat = categories.find(c => c.id === selectedId);
                      setCurrentProduct(prev => ({
                        ...prev,
                        categorie_id: selectedId,
                        categorie_nom: selectedCat?.nom || ""
                      }));
                    }}
                    className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                    required
                  >
                    <option value="">-- Sélectionnez une catégorie --</option>
                    {filteredCategoriesOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nom}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#472EAD]">Filtrer :</span>
                    <input
                      type="text"
                      placeholder="Rechercher une catégorie..."
                      value={categoryFilterTerm}
                      onChange={(e) => setCategoryFilterTerm(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Fournisseur</label>
                <div className="space-y-2">
                  <select
                    name="fournisseur_id"
                    value={currentProduct.fournisseur_id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedFour = fournisseurs.find(f => f.id === selectedId);
                      setCurrentProduct(prev => ({
                        ...prev,
                        fournisseur_id: selectedId,
                        fournisseur_nom: selectedFour?.nom || ""
                      }));
                    }}
                    className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  >
                    <option value="">-- Aucun fournisseur --</option>
                    {filteredFournisseursOptions.map((four) => (
                      <option key={four.id} value={four.id}>{four.nom}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#472EAD]">Filtrer :</span>
                    <input
                      type="text"
                      placeholder="Rechercher un fournisseur..."
                      value={fournisseurFilterTerm}
                      onChange={(e) => setFournisseurFilterTerm(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Code-barre */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Code-barre</label>
                <input
                  type="text"
                  name="code"
                  value={currentProduct.code || ""}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  placeholder="Code unique (facultatif)"
                />
              </div>

              {/* Prix par carton */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Prix par carton (F)</label>
                <input
                  type="number"
                  name="prix_unite_carton"
                  value={currentProduct.prix_unite_carton || ""}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Cartons en stock */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Cartons en stock</label>
                <input
                  type="number"
                  name="nombre_carton"
                  value={currentProduct.nombre_carton || ""}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-100 text-gray-700 outline-none"
                  min="0"
                  readOnly={modalType === "edit"}
                  disabled={modalType === "edit"}
                />
                {modalType === "edit" && (
                  <p className="text-xs text-[#F58020] mt-1">
                    ⚠️ Le stock ne peut être modifié que par réapprovisionnement/diminution.
                  </p>
                )}
              </div>

              {/* Unités par carton */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Unités par carton *</label>
                <input
                  type="number"
                  name="unite_carton"
                  value={currentProduct.unite_carton || "1"}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="1"
                  required
                />
              </div>

              {/* Stock minimum */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Stock minimum (cartons)</label>
                <input
                  type="number"
                  name="stock_seuil"
                  value={currentProduct.stock_seuil || "5"}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="0"
                  placeholder="Ex: 5"
                />
              </div>

              {/* Info stock global */}
              <div className="col-span-full text-sm text-[#472EAD] font-semibold mt-2 flex items-center gap-2 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] p-3 rounded-lg">
                <FaBoxes />
                <span>Stock global estimé : {Number(currentProduct.nombre_carton || 0) * Number(currentProduct.unite_carton || 1)} unités</span>
              </div>

              {/* Boutons */}
              <div className="col-span-full flex justify-end gap-3 mt-4">
                <button type="button" onClick={closeProductModal} className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white hover:opacity-90 inline-flex items-center gap-2">
                  <FaCheck />
                  {modalType === "add" ? "Créer le produit" : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE AJUSTEMENT */}
      {adjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaSlidersH className="text-[#472EAD]" />
              {adjustAction === "reappro" ? "Réapprovisionner le stock" : "Diminuer le stock"}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Produit : <span className="font-semibold text-[#472EAD]">{adjustProduct.nom}</span> ({adjustProduct.categorie_nom})<br />
              Stock actuel : <span className="font-semibold text-[#F58020]">{adjustProduct.nombre_carton}</span> cartons
            </p>
            <form onSubmit={handleSubmitAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Quantité (en cartons) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={adjustAction === "diminue" ? adjustProduct.nombre_carton : undefined} 
                  value={adjustQuantity} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (adjustAction === "diminue" && val > adjustProduct.nombre_carton) {
                      alert(`Vous ne pouvez pas diminuer plus de ${adjustProduct.nombre_carton} cartons.`);
                      return;
                    }
                    setAdjustQuantity(e.target.value);
                  }} 
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeAdjustModal} className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]">Annuler</button>
                <button type="submit" className={`px-4 py-2 text-sm rounded text-white inline-flex items-center gap-2 ${
                  adjustAction === "reappro" ? "bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] hover:opacity-90" : "bg-gradient-to-r from-[#F58020] to-[#FFA94D] hover:opacity-90"
                }`}>
                  {adjustAction === "reappro" ? (
                    <>
                      <FaArrowUp /><span>Réapprovisionner</span>
                    </>
                  ) : (
                    <>
                      <FaArrowDown /><span>Diminuer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION PRODUIT */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-[#472EAD]">
              <FaTrashAlt className="text-[#F58020]" />Supprimer le produit
            </h3>
            <p className="text-sm text-gray-600 mb-4">Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]">Annuler</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white hover:opacity-90 inline-flex items-center gap-2">
                <FaTrashAlt /><span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CATÉGORIE (Ajout/Modification) */}
      {categoryModal && currentCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaFolder className="text-[#472EAD]" />
              {categoryModal === "add" ? "Nouvelle Catégorie" : "Modifier la Catégorie"}
            </h2>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Nom de la catégorie *</label>
                <input
                  type="text"
                  name="nom"
                  value={currentCategory.nom || ""}
                  onChange={handleCategoryFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  required
                  placeholder="Ex: Papeterie..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeCategoryModal} className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white hover:opacity-90 inline-flex items-center gap-2">
                  <FaCheck />
                  {categoryModal === "add" ? "Créer la catégorie" : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION CATÉGORIE */}
      {deleteCategoryId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-[#472EAD]">
              <FaTrashAlt className="text-[#F58020]" />Supprimer la catégorie
            </h3>
            <p className="text-sm text-gray-600 mb-4">Voulez-vous vraiment supprimer cette catégorie ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDeleteCategoryId(null)} className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]">Annuler</button>
              <button onClick={handleConfirmDeleteCategory} className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white hover:opacity-90 inline-flex items-center gap-2">
                <FaTrashAlt /><span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
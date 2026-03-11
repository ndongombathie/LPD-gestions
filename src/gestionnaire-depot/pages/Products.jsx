// src/gestionnaire-depot/pages/Products.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useAllFournisseurs } from "../hooks/useAllFournisseurs";
import { useHistoriqueProduits } from "../hooks/useHistoriqueProduits";
import { useProduitsParStatut } from "../hooks/useProduitsParStatut";
import { useProduitsParStatutAvecPagination } from "../hooks/useProduitsParStatutAvecPagination";
import { produitsAPI } from "../../services/api/produits";
import toast from 'react-hot-toast';

import "../styles/depot-fix.css";

// Icônes
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

// =========================================================================
// FONCTIONS UTILITAIRES
// =========================================================================
const getStatus = (stockActuel, stockMinimum) => {
  const cartons = Number(stockActuel) || 0;
  const stockMin = Number(stockMinimum) || 0;
  if (cartons === 0) return { label: "Rupture", className: "bg-gray-200 text-gray-700" };
  if (cartons < 10 || cartons < stockMin * 0.3) return { label: "Critique", className: "bg-red-100 text-red-700" };
  if (cartons <= stockMin) return { label: "Faible", className: "bg-yellow-100 text-yellow-700" };
  return { label: "Normal", className: "bg-green-100 text-green-700" };
};

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

// =========================================================================
// COMPOSANT PAGINATION SIMPLE
// =========================================================================
const SimplePagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 bg-white hover:bg-slate-50"
      >
        Précédent
      </button>
      <span className="text-sm">
        Page {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 bg-white hover:bg-slate-50"
      >
        Suivant
      </button>
    </div>
  );
};

// =========================================================================
// ONGLET LISTE DES PRODUITS
// =========================================================================
const ProductListTab = ({
  products,
  fournisseurs,
  categories,
  total,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  loading,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  nbRupture,
  nbFaible
}) => {
  const totalValue = products.reduce((acc, p) => acc + (p.prix_unite_carton * p.nombre_carton), 0);

  return (
    <div className="space-y-6">
      {/* Barre de recherche avec bouton */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="text-sm text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">
              <span className="font-bold text-[#472EAD]">{total}</span> produits au total
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-96">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code-barre..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
                />
              </div>
              <button
                onClick={onSearchSubmit}
                className="px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3a2590] transition-colors"
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 text-white rounded-lg"><FaCoins size={20}/></div>
          <div>
            <p className="text-xs text-white/90 uppercase font-bold">Valeur Stock</p>
            <p className="text-xl font-bold text-white">{totalValue.toLocaleString("fr-FR")} F</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#F58020] to-[#FFA94D] rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 text-white rounded-lg"><FaExclamationTriangle size={20}/></div>
          <div>
            <p className="text-xs text-white/90 uppercase font-bold">Faible</p>
            <p className="text-xl font-bold text-white">{nbFaible}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#6B7280] to-[#9CA3AF] rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 text-white rounded-lg"><FaTimesCircle size={20}/></div>
          <div>
            <p className="text-xs text-white/90 uppercase font-bold">Rupture</p>
            <p className="text-xl font-bold text-white">{nbRupture}</p>
          </div>
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
              {products.map((p) => {
                const status = getStatus(p.nombre_carton, p.stock_seuil);
                const totalPrice = p.nombre_carton * p.prix_unite_carton;
                const fournisseur = fournisseurs.find(f => f.id === p.fournisseur_id);
                const categorie = categories.find(c => c.id === p.categorie_id);
                const categorieNom = categorie?.nom || 'Non catégorisé';
                
                return (
                  <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{p.nom}</td>
                    <td className="p-4 text-center font-mono text-slate-500 text-xs">{p.code || "-"}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] px-2 py-1 rounded text-xs font-medium">
                        {categorieNom}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {fournisseur ? (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F0F9FF] to-[#F0FDF4] text-[#472EAD] px-2 py-1 rounded text-xs">
                          <FaTruck className="text-[10px]" /> {fournisseur.name}
                        </span>
                      ) : <span className="text-slate-300 text-xs">-</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">{p.nombre_carton}</td>
                    <td className="p-4 text-center text-slate-500">{p.unite_carton}</td>
                    <td className="p-4 text-right font-mono text-slate-600">{Number(p.prix_unite_carton).toLocaleString("fr-FR")} F</td>
                    <td className="p-4 text-right font-mono font-bold text-[#472EAD]">{Number(totalPrice).toLocaleString("fr-FR")} F</td>
                    <td className="p-4 text-center text-[#F58020] font-medium">{p.stock_seuil}</td>
                    <td className="p-4 text-center"><StatusBadge status={status} /></td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onEdit(p)} 
                          className="p-1.5 text-[#472EAD] hover:bg-[#F7F5FF] rounded transition-colors" 
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => onDelete(p.id)} 
                          className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded transition-colors" 
                          title="Supprimer"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                    {loading ? "Chargement en cours..." : "Aucun produit trouvé."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {total > 0 && (
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};

// =========================================================================
// ONGLET AJUSTEMENT
// =========================================================================
const AdjustmentTab = ({ onAdjust }) => {
  const [subTab, setSubTab] = useState("rupture");
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    produits,
    loading,
    pagination,
    fetchProduitsParStatut
  } = useProduitsParStatutAvecPagination();
  
  const {
    counts,
    fetchCounts
  } = useProduitsParStatut();

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchProduitsParStatut(subTab, currentPage, searchTerm);
  }, [subTab, currentPage, searchTerm, fetchProduitsParStatut]);

  const handleSearch = () => {
    setSearchTerm(tempSearchTerm);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setCurrentPage(newPage);
    }
  };

  const getTitle = () => {
    switch(subTab) {
      case 'rupture': return 'en rupture';
      case 'faible': return 'faibles';
      case 'normal': return 'normaux';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sous-onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setSubTab("rupture");
            setTempSearchTerm("");
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === "rupture"
              ? "border-b-2 border-[#472EAD] text-[#472EAD]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Rupture ({counts.rupture})
        </button>
        <button
          onClick={() => {
            setSubTab("faible");
            setTempSearchTerm("");
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === "faible"
              ? "border-b-2 border-[#472EAD] text-[#472EAD]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Faible ({counts.faible})
        </button>
        <button
          onClick={() => {
            setSubTab("normal");
            setTempSearchTerm("");
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === "normal"
              ? "border-b-2 border-[#472EAD] text-[#472EAD]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Normal ({counts.normal})
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex gap-2">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#472EAD]" />
          <input
            type="text"
            placeholder={`Rechercher dans les produits ${getTitle()}...`}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
            value={tempSearchTerm}
            onChange={(e) => setTempSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3a2590] transition-colors"
        >
          Rechercher
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]">
          <h3 className="font-bold text-[#472EAD] flex items-center gap-2">
            <FaList className="text-[#472EAD]"/> 
            {pagination.total} produit(s) {getTitle()}
            {pagination.lastPage > 1 && ` (page ${pagination.currentPage}/${pagination.lastPage})`}
          </h3>
          {pagination.total > 0 && (
            <p className="text-xs text-[#472EAD] mt-1">
              Affichage {pagination.from} à {pagination.to} sur {pagination.total}
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#472EAD] mx-auto"></div>
            <p className="mt-2 text-sm text-[#472EAD]">Chargement...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-3 pl-4">Produit</th>
                  <th className="p-3 text-center">Code-barre</th>
                  <th className="p-3 text-center">Stock Actuel</th>
                  <th className="p-3 text-center">Stock Min.</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produits.length > 0 ? produits.map(p => {
                  const status = getStatus(p.nombre_carton, p.stock_seuil);
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition">
                      <td className="p-3 pl-4">
                        <div className="font-medium text-slate-800">{p.nom}</div>
                        <div className="text-xs text-slate-400">
                          {p.categorie_nom || 'Non catégorisé'}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-xs text-slate-500">{p.code || "N/A"}</td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {p.nombre_carton} <span className="text-xs font-normal text-slate-400">ctn</span>
                      </td>
                      <td className="p-3 text-center text-[#F58020] font-medium">{p.stock_seuil}</td>
                      <td className="p-3 text-center"><StatusBadge status={status} /></td>
                      <td className="p-3 text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => onAdjust(p, 'reappro')} 
                            className="p-2 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white rounded hover:opacity-90" 
                            title="Réapprovisionner"
                          >
                            <FaPlus size={12} />
                          </button>
                          {subTab !== "rupture" && (
                            <button 
                              onClick={() => onAdjust(p, 'diminue')} 
                              className="p-2 bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white rounded hover:opacity-90" 
                              title="Diminuer"
                              disabled={p.nombre_carton === 0}
                            >
                              <FaArrowDown size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      Aucun produit {getTitle()} trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.lastPage > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 bg-white hover:bg-slate-50"
          >
            Précédent
          </button>
          <span className="text-sm">
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.lastPage}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 bg-white hover:bg-slate-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// ONGLET HISTORIQUE
// =========================================================================
const HistoryTab = ({ 
  history, 
  loading, 
  total, 
  currentPage, 
  totalPages, 
  onPageChange,
  searchTerm,
  onSearchChange,
  onSearchSubmit
}) => {
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const openDetail = (item) => {
    setSelectedHistoryItem(item);
    setDetailModalOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = () => {
    onSearchSubmit();
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-3 text-[#472EAD]" />
            <input
              type="text"
              placeholder="Rechercher par produit..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3a2590] transition-colors"
            >
              Rechercher
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-[#472EAD] font-semibold">
          {total} action(s) trouvée(s)
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] border-b text-[#472EAD]">
            <tr>
              <th className="p-3 text-left">Date & Heure</th>
              <th className="p-3 text-left">Produit</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Détails</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? history.map((item, index) => (
              <tr key={item.id || index} className="border-t hover:bg-[#F7F5FF]/30 transition-colors">
                <td className="p-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-[#472EAD]" />{formatDate(item.date)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-[#472EAD] flex items-center gap-2">
                    <FaBoxOpen />{item.productName}
                  </div>
                  {item.productCode && (
                    <div className="text-xs text-gray-500">{item.productCode}</div>
                  )}
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                    item.type === "Modification" 
                      ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200" 
                      : "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200"
                  }`}>
                    {item.type === "Modification" ? <FaEdit /> : <FaTrashAlt />}
                    {item.action}
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
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="text-gray-400">
                    <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium text-[#472EAD]">
                      {loading ? "Chargement..." : "Aucun historique"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {total > 0 && (
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}

      {/* Modal de détail */}
      {detailModalOpen && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaHistory className="text-[#472EAD]" />
              Détails de l'action
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Date</p>
                  <p className="text-sm">{formatDate(selectedHistoryItem.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Action</p>
                  <p className="text-sm">{selectedHistoryItem.action}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-500">Produit</p>
                <p className="text-base font-medium text-[#472EAD]">{selectedHistoryItem.productName}</p>
              </div>
              
              {selectedHistoryItem.productCode && (
                <div>
                  <p className="text-xs font-semibold text-gray-500">Code</p>
                  <p className="text-sm font-mono">{selectedHistoryItem.productCode}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-200">
                {selectedHistoryItem.type === "Suppression" ? (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Ce produit a été supprimé
                  </p>
                ) : (
                  <p className="text-sm text-blue-600">
                    ℹ️ Action enregistrée dans le système
                  </p>
                )}
              </div>
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

// =========================================================================
// ONGLET CATÉGORIES
// =========================================================================
const CategoriesTab = ({ 
  categories, 
  total,
  onEditCategory, 
  onDeleteCategory, 
  onAddCategory
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filtrer les catégories par recherche
  const filteredCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    if (searchTerm.trim() === '') return categories;
    
    const term = searchTerm.toLowerCase();
    return categories.filter(cat =>
      cat.nom?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // Pagination locale
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <FaFolder className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-lg text-gray-500">Aucune catégorie trouvée</p>
        <button 
          onClick={onAddCategory}
          className="mt-4 px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3a2590] transition-colors"
        >
          Créer une catégorie
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm bg-slate-50 px-3 py-1 rounded-lg">
              <span className="font-bold text-[#472EAD]">{filteredCategories.length}</span> / {total} catégories
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#472EAD]" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={onAddCategory} 
            className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-all"
          >
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
            {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => (
              <tr key={cat.id} className="border-t hover:bg-[#F7F5FF]/30 transition-colors">
                <td className="p-3 font-medium text-[#472EAD]">{cat.nom}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => onEditCategory(cat)} 
                      className="inline-flex items-center gap-1 text-[#472EAD] hover:text-[#3a2590] hover:underline text-xs"
                    >
                      <FaEdit /><span>Modifier</span>
                    </button>
                    <button 
                      onClick={() => onDeleteCategory(cat.id)} 
                      className="inline-flex items-center gap-1 text-xs text-[#F58020] hover:text-red-600 hover:underline"
                    >
                      <FaTrashAlt /><span>Supprimer</span>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="p-8 text-center">
                  <div className="text-gray-400">
                    <FaFolder className="text-4xl mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium text-[#472EAD]">
                      Aucune catégorie trouvée
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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

  // États pour la recherche
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  
  // États pour forcer le rechargement
  const [productFilterKey, setProductFilterKey] = useState(0);

  // États pour les compteurs
  const [nbRupture, setNbRupture] = useState(0);
  const [nbFaible, setNbFaible] = useState(0);

  // Hooks
  const {
    products,
    total,
    currentPage: productPage,
    totalPages: productTotalPages,
    loading: productsLoading,
    goToPage: goToProductPage,
    addProduct,
    updateProduct,
    deleteProduct,
    reapprovisionner,
    diminuerStock,
  } = useProducts(1, pageSize, productSearchTerm, productFilterKey);

  const { 
    categories, 
    total: categoriesTotal, 
    loading: categoriesLoading,
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = useCategories();
  
  // Hook pour charger TOUS les fournisseurs
  const { suppliers: fournisseurs, loading: fournisseursLoading } = useAllFournisseurs();

  // Hook pour l'historique des actions
  const {
    history,
    total: historyTotal,
    loading: historyLoading,
    currentPage: historyPage,
    totalPages: historyTotalPages,
    fetchHistorique,
    setCurrentPage: setHistoryPage
  } = useHistoriqueProduits();

  // Charger l'historique au changement d'onglet ou de recherche
  useEffect(() => {
    if (activeTab === "historique") {
      fetchHistorique(1, pageSize, historySearchTerm);
    }
  }, [activeTab, historySearchTerm]);

  // Charger les compteurs au montage
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [rupture, faible] = await Promise.all([
          produitsAPI.getNbProduitsEnRupture(),
          produitsAPI.getNbProduitsSousSeuil()
        ]);
        setNbRupture(rupture || 0);
        setNbFaible(faible || 0);
      } catch (error) {
        
      }
    };
    fetchCounts();
  }, []);

  // Handlers pour la recherche
  const handleProductSearch = () => {
    setProductFilterKey(prev => prev + 1);
  };

  const handleHistorySearch = () => {
    if (activeTab === "historique") {
      fetchHistorique(1, pageSize, historySearchTerm);
    }
  };

  // Handler pour le changement de page dans l'historique
  const handleHistoryPageChange = (page) => {
    setHistoryPage(page);
    fetchHistorique(page, pageSize, historySearchTerm);
  };

  // États pour les modales
  const [modalType, setModalType] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // États pour ajustement
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAction, setAdjustAction] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");

  // États pour catégories
  const [categoryModal, setCategoryModal] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);

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
      toast.success("Produit supprimé avec succès !");
      setDeleteId(null);
    } catch (error) {
      
      toast.error("Erreur lors de la suppression du produit.");
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!currentProduct.nom?.trim()) {
      toast.error("Le nom du produit est obligatoire.");
      return;
    }

    if (!currentProduct.categorie_id) {
      toast.error("La catégorie est obligatoire.");
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
        toast.success("Produit ajouté avec succès !");
      } else {
        await updateProduct(currentProduct.id, apiPayload);
        toast.success("Produit modifié avec succès !");
      }
      closeProductModal();
    } catch (error) {
      
      toast.error("Erreur lors de l'enregistrement du produit.");
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
    if (!qty || qty <= 0) {
      toast.error("Quantité invalide");
      return;
    }

    try {
      if (adjustAction === "reappro") {
        await reapprovisionner(adjustProduct.id, qty);
        toast.success("Stock réapprovisionné avec succès !");
      } else {
        await diminuerStock(adjustProduct.id, qty);
        toast.success("Stock diminué avec succès !");
      }
      closeAdjustModal();
    } catch (error) {
      
      toast.error("Erreur lors de l'ajustement du stock.");
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
      toast.error("Le nom de la catégorie est obligatoire.");
      return;
    }

    try {
      if (categoryModal === "add") {
        await addCategory(currentCategory.nom);
        toast.success("Catégorie créée avec succès !");
      } else {
        await updateCategory(currentCategory.id, currentCategory.nom);
        toast.success("Catégorie modifiée avec succès !");
      }
      closeCategoryModal();
    } catch (error) {
    
      toast.error("Erreur lors de l'enregistrement de la catégorie.");
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
      toast.success("Catégorie supprimée avec succès !");
    } catch (error) {
    
      toast.error("Erreur lors de la suppression de la catégorie.");
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
    f.name?.toLowerCase().includes(fournisseurFilterTerm.toLowerCase())
  );

  const loading = productsLoading || categoriesLoading || fournisseursLoading || (activeTab === "historique" && historyLoading);

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
              <span className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FaTruck /> {fournisseurs.length} fournisseurs
              </span>
            </div>
          )}
        </div>

        {activeTab === "liste" && (
          <button 
            onClick={() => { setModalType("add"); setCurrentProduct({}); }} 
            className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-transform active:scale-95"
          >
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
              fournisseurs={fournisseurs}
              categories={categories}
              total={total}
              currentPage={productPage}
              totalPages={productTotalPages}
              onPageChange={goToProductPage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={productsLoading}
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              onSearchSubmit={handleProductSearch}
              nbRupture={nbRupture}
              nbFaible={nbFaible}
            />
          )}
          {activeTab === "ajustement" && (
            <AdjustmentTab
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
              onPageChange={handleHistoryPageChange}
              searchTerm={historySearchTerm}
              onSearchChange={setHistorySearchTerm}
              onSearchSubmit={handleHistorySearch}
            />
          )}
          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              total={categoriesTotal}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddCategory={handleAddCategory}
            />
          )}
        </>
      )}

      {/* ========== MODALES ========== */}

      {/* MODALE PRODUIT */}
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
                        fournisseur_nom: selectedFour?.name || ""
                      }));
                    }}
                    className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  >
                    <option value="">-- Aucun fournisseur --</option>
                    {filteredFournisseursOptions.map((four) => (
                      <option key={four.id} value={four.id}>{four.name}</option>
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
              Produit : <span className="font-semibold text-[#472EAD]">{adjustProduct.nom}</span><br />
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
                      toast.error(`Vous ne pouvez pas diminuer plus de ${adjustProduct.nombre_carton} cartons.`);
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

      {/* MODALE CATÉGORIE */}
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
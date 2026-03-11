// src/gestionnaire-depot/pages/StockMovements.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import "../styles/depot-fix.css";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Search,
  Filter,
  Info,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Save,
  X,
  Building,
  ChevronDown,
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Truck,
  MinusCircle,
  Ban,
} from "lucide-react";

// ===== IMPORTS =====
import { produitsAPI } from "../../services/api/produits";
import { useMouvements } from "../hooks/useMouvements";

// ===== HELPERS =====
const formatDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function StockMovements() {
  // ===== ÉTATS POUR LES PRODUITS (pour le dropdown) =====
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ===== ÉTATS DES FILTRES =====
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("historique"); // "historique", "en-attente", "annulees"

  // ===== PAGINATION =====
  const [pageSize, setPageSize] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [cancelledPage, setCancelledPage] = useState(1);

  // ===== ÉTATS POUR MODALES =====
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    product: "",
    barcode: "",
    quantity: "",
    stockBefore: "",
    stockAfter: "",
  });
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const productDropdownRef = useRef(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [cancelPendingId, setCancelPendingId] = useState(null);

  // ===== HOOK PERSONNALISÉ =====
  const {
    movements,
    totalMovements,
    loadingMovements,
    errorMovements,
    stats,
    loadingStats,
    fetchMovements,
    fetchStats,
    createTransfer,
    cancelTransfer,
  } = useMouvements();

  // ===== CHARGEMENT DES PRODUITS POUR LE DROPDOWN =====
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await produitsAPI.getAll({ per_page: 1000 });
        const productsData = Array.isArray(res) ? res : res.data || [];
        const formatted = productsData.map(p => ({
          id: p.id,
          nom: p.nom,
          code_barre: p.code_barre || "",
          nombre_carton: p.nombre_carton || 0,
          prix_unite_carton: p.prix_unite_carton || 0,
          categorie: p.categorie || null,
        }));
        setProducts(formatted);
      } catch (err) {
        
        toast.error("Erreur lors du chargement des produits");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // ===== EFFET POUR CHARGER LES MOUVEMENTS =====
  useEffect(() => {
    let currentPage = 1;
    if (activeTab === "historique") currentPage = historyPage;
    else if (activeTab === "en-attente") currentPage = pendingPage;
    else if (activeTab === "annulees") currentPage = cancelledPage;

    const filters = { dateFrom, dateTo, activeTab };
    fetchMovements(currentPage, pageSize, filters);
  }, [activeTab, historyPage, pendingPage, cancelledPage, pageSize, dateFrom, dateTo, fetchMovements]);

  // ===== GESTION DU CHANGEMENT DE PAGE =====
  const handlePageChange = (newPage) => {
    if (activeTab === "historique") setHistoryPage(newPage);
    else if (activeTab === "en-attente") setPendingPage(newPage);
    else if (activeTab === "annulees") setCancelledPage(newPage);
  };

  // ===== RÉINITIALISATION DES FILTRES =====
  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    handlePageChange(1);
    toast.success("Filtres réinitialisés");
  };

  // ===== GESTION FORMULAIRE DE TRANSFERT =====
  const recalcAfter = (newPartial = {}) => {
    const qty = Number(newPartial.quantity ?? formData.quantity ?? 0);
    const before = Number(newPartial.stockBefore ?? formData.stockBefore ?? 0);
    const after = Math.max(0, before - qty);
    setFormData(prev => ({ ...prev, ...newPartial, stockAfter: String(after) }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const sanitized = value === "" ? "" : String(Math.max(0, Number(value)));
      setFormData(prev => ({ ...prev, quantity: sanitized }));
      recalcAfter({ quantity: sanitized });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSelect = (product) => {
    const before = Number(product.nombre_carton || 0);
    const after = Math.max(0, before - Number(formData.quantity || 0));
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      product: product.nom,
      barcode: product.code_barre || "",
      stockBefore: String(before),
      stockAfter: String(after),
    }));
    setProductSearch(product.nom);
    setProductDropdownOpen(false);
  };

  // ===== FONCTION DE CRÉATION DE TRANSFERT - PAYLOAD SIMPLIFIÉ =====
  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const { productId, quantity } = formData;
    
    if (!productId) {
      setFormError("Veuillez sélectionner un produit.");
      setIsSubmitting(false);
      return;
    }
    
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setFormError("La quantité doit être supérieure à 0.");
      setIsSubmitting(false);
      return;
    }

    // Vérification du stock disponible côté front
    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) {
      setFormError("Produit introuvable.");
      setIsSubmitting(false);
      return;
    }
    
    if (selectedProduct.nombre_carton < qtyNum) {
      setFormError(`Stock insuffisant. Disponible: ${selectedProduct.nombre_carton} cartons.`);
      setIsSubmitting(false);
      return;
    }

    // ✅ UNIQUEMENT produit_id et quantite - RIEN D'AUTRE
    const transferData = {
      produit_id: productId,
      quantite: qtyNum
    };

    

    const result = await createTransfer(transferData);

    if (result.success) {
      const currentPage = activeTab === "historique" ? historyPage : 
                         activeTab === "en-attente" ? pendingPage : cancelledPage;
      const filters = { dateFrom, dateTo, activeTab };
      
      await fetchMovements(currentPage, pageSize, filters);
      await fetchStats();
      
      toast.success("✅ Transfert créé avec succès !");
      closeModal();
    } else {
      setFormError(result.error);
      toast.error(result.error);
    }
    
    setIsSubmitting(false);
  };

  const cancelPendingSortie = async (sortieId) => {
    const loadingToast = toast.loading("Annulation en cours...");
    const result = await cancelTransfer(sortieId);
    
    if (result.success) {
      setCancelPendingId(null);
      const currentPage = activeTab === "historique" ? historyPage : activeTab === "en-attente" ? pendingPage : cancelledPage;
      const filters = { dateFrom, dateTo, activeTab };
      await fetchMovements(currentPage, pageSize, filters);
      await fetchStats();
      
      toast.dismiss(loadingToast);
      toast.success("✅ Transfert annulé avec succès !");
    } else {
      toast.dismiss(loadingToast);
      toast.error(result.error || "Erreur lors de l'annulation");
    }
  };

  // ===== DROPDOWN PRODUIT =====
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p =>
      (p.nom?.toLowerCase() || "").includes(term) ||
      (p.code_barre?.toLowerCase() || "").includes(term) ||
      (p.categorie?.nom?.toLowerCase() || "").includes(term)
    );
  }, [products, productSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ProductDropdown = () => (
    <div ref={productDropdownRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Sélectionner un produit
      </label>
      <div className="relative">
        <div
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setProductDropdownOpen(!productDropdownOpen)}
        >
          <div className="flex items-center gap-2">
            <Box size={16} className="text-gray-400" />
            <span className={formData.product ? "text-gray-800" : "text-gray-400"}>
              {formData.product || "Cliquez pour sélectionner un produit"}
            </span>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

        {productDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    formData.productId === product.id ? "bg-indigo-50" : ""
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-gray-800">{product.nom}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="font-mono">{product.code_barre}</span>
                        {product.categorie && (
                          <>
                            <span>•</span>
                            <span>{product.categorie.nom}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-indigo-600">
                      {product.nombre_carton || 0} cartons
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="p-3 text-center text-gray-400 text-sm">Aucun produit trouvé</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ===== COMPOSANT PAGINATION =====
  const Pagination = ({ currentPage, totalPages, onPageChange, filteredCount, pageSize }) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, filteredCount);

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("...");
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push("...");
          pages.push(currentPage - 1);
          pages.push(currentPage);
          pages.push(currentPage + 1);
          pages.push("...");
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          Affichage <span className="font-medium text-gray-800">{startItem}</span> à <span className="font-medium text-gray-800">{endItem}</span> sur <span className="font-medium text-indigo-600">{filteredCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <ChevronsLeft size={16} className="text-gray-600" />
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={idx} className="px-2 text-gray-400">...</span>
              ) : (
                <button key={idx} onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded border flex items-center justify-center text-sm transition-colors ${
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}>
                  {page}
                </button>
              )
            )}
          </div>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors">
            <ChevronsRight size={16} className="text-gray-600" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Lignes par page :</span>
          <select value={pageSize} onChange={(e) => { 
            setPageSize(Number(e.target.value)); 
            handlePageChange(1);
          }}
            className="text-sm border rounded px-2 py-1 bg-white border-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    );
  };

  // ===== MODALES =====
  const openModal = () => {
    setFormData({
      productId: "",
      product: "",
      barcode: "",
      quantity: "",
      stockBefore: "",
      stockAfter: "",
    });
    setFormError("");
    setProductSearch("");
    setProductDropdownOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
    setProductSearch("");
    setProductDropdownOpen(false);
    setIsSubmitting(false);
  };

  // ===== RENDU =====
  return (
    <div className="depot-page space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Gestion des Mouvements de Stock
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Suivi des entrées, sorties et transferts
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <ArrowUpRight size={18} />
          Nouveau transfert
        </button>
      </div>

      {/* STATISTIQUES - 3 cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Entrées</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{loadingStats ? '...' : stats.totalEntries}</p>
            <p className="text-xs text-gray-400 mt-1">opérations</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <ArrowDownRight className="text-green-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Sorties</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{loadingStats ? '...' : stats.totalValidated}</p>
            <p className="text-xs text-gray-400 mt-1">opérations</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <ArrowUpRight className="text-red-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">En attente</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{loadingStats ? '...' : stats.totalPending}</p>
            <p className="text-xs text-gray-400 mt-1">transferts</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="text-yellow-600" size={20} />
          </div>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => { setActiveTab("historique"); setHistoryPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "historique"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Activity size={16} className="inline mr-2" />
            Historique
          </button>
          <button
            onClick={() => { setActiveTab("en-attente"); setPendingPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "en-attente"
                ? "border-yellow-600 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock size={16} className="inline mr-2" />
            En attente
          </button>
          <button
            onClick={() => { setActiveTab("annulees"); setCancelledPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "annulees"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Ban size={16} className="inline mr-2" />
            Annulées
          </button>
        </nav>
      </div>

      {/* FILTRES SIMPLIFIÉS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Filter size={14} />
          <span className="font-medium">Filtres par date</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Date début</p>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); handlePageChange(1); }}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Date fin</p>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); handlePageChange(1); }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* TABLEAU PAR ONGLET */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {activeTab === "historique" && <Activity size={16} className="text-indigo-600" />}
            {activeTab === "en-attente" && <Clock size={16} className="text-yellow-600" />}
            {activeTab === "annulees" && <Ban size={16} className="text-red-600" />}
            {activeTab === "historique" && "Historique des mouvements"}
            {activeTab === "en-attente" && "Transferts en attente de validation"}
            {activeTab === "annulees" && "Transferts annulés"}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info size={14} />
            <span>Cliquez sur une ligne pour plus de détails</span>
          </div>
        </div>

        {loadingMovements ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des mouvements...</p>
          </div>
        ) : errorMovements ? (
          <div className="p-4 text-center text-red-600">{errorMovements}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    {activeTab !== "en-attente" && <th className="text-left px-4 py-3">Type</th>}
                    <th className="text-left px-4 py-3">Produit</th>
                    {activeTab !== "en-attente" && <th className="text-left px-4 py-3">Source / Destination</th>}
                    {activeTab === "en-attente" && <th className="text-left px-4 py-3">Destination</th>}
                    <th className="text-center px-4 py-3">Quantité</th>
                    <th className="text-center px-4 py-3">Date</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((item) => {
                    // item.sousType est déjà défini dans le hook
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedMovement(item)}
                      >
                        {activeTab !== "en-attente" && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* Pour les entrées : afficher le type principal + étiquette */}
                              {item.type === "Entrée" ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-gray-500">Entrée</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                                    item.sousType === 'creation' 
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                      : item.sousType === 'reapprovisionnement'
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : item.sousType === 'annulation'
                                      ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                                  }`}>
                                    {item.sousType === 'creation' && 'Ajout produit'}
                                    {item.sousType === 'reapprovisionnement' && 'Approvisionnement'}
                                    {item.sousType === 'annulation' && 'Annulation'}
                                  </span>
                                </div>
                              ) : (
                                /* Pour les sorties */
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  item.sousType === 'transfert'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-gray-50 text-gray-700'
                                }`}>
                                  {item.sousType === 'transfert' ? (
                                    <>
                                      <Truck size={14} />
                                      Transfert
                                    </>
                                  ) : (
                                    <>
                                      <MinusCircle size={14} />
                                      Diminution
                                    </>
                                  )}
                                </span>
                              )}
                              {activeTab === "annulees" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                                  <Ban size={10} /> Annulé
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-800 flex items-center gap-2">
                          <Package size={14} className="text-gray-400" />
                          {item.product}
                        </td>
                        {activeTab !== "en-attente" ? (
                          <td className="px-4 py-3 text-xs text-gray-700">
                            <div className="flex items-center gap-2">
                              {item.type === "Entrée" ? (
                                <>
                                  <Building size={12} className="text-green-500" />
                                  <span className="text-green-600">
                                    {item.sousType === 'creation' ? 'Ajout: ' : 
                                     item.sousType === 'reapprovisionnement' ? 'Appro: ' : 
                                     item.sousType === 'annulation' ? 'Retour: ' : ''}
                                    {item.sousType === 'annulation' ? 'Dépôt' : item.source}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {item.sousType === 'transfert' ? (
                                    <>
                                      <Store size={12} className="text-indigo-500" />
                                      <span className="text-indigo-600">Boutique Colobane</span>
                                    </>
                                  ) : (
                                    <>
                                      <MinusCircle size={12} className="text-gray-500" />
                                      <span className="text-gray-600">Fournisseur</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        ) : (
                          <td className="px-4 py-3 text-xs text-gray-700">
                            <div className="flex items-center gap-2">
                              <Store size={12} className="text-indigo-500" />
                              <span className="text-indigo-600">Boutique Colobane</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${
                            item.type === "Entrée" ? "text-green-600" : "text-red-600"
                          }`}>
                            {item.type === "Entrée" ? "+" : "-"}{item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
                          {formatDateTime(item.date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedMovement(item); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              <Info size={14} className="text-gray-500" />
                              Détails
                            </button>
                            {activeTab === "en-attente" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setCancelPendingId(item.id); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                              >
                                <XCircle size={14} />
                                Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === "en-attente" ? 5 : 6} className="px-4 py-6 text-center text-gray-400 text-sm italic">
                        Aucun élément à afficher.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalMovements > 0 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={activeTab === "historique" ? historyPage : activeTab === "en-attente" ? pendingPage : cancelledPage}
                  totalPages={Math.ceil(totalMovements / pageSize)}
                  onPageChange={handlePageChange}
                  filteredCount={totalMovements}
                  pageSize={pageSize}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== MODALE NOUVEAU TRANSFERT ===== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Nouveau transfert</h3>
                <p className="text-sm text-gray-500">Transférer des produits vers la boutique (en attente de validation)</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                  <XCircle size={16} />
                  <span className="text-sm font-medium">{formError}</span>
                </div>
              )}
              <form onSubmit={handleSubmitMovement} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Destination</label>
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <Store size={18} className="text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Boutique Colobane</span>
                  </div>
                </div>

                <ProductDropdown />

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Quantité (cartons) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      min="1"
                      max={formData.stockBefore || undefined}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={`Max: ${formData.stockBefore || '?'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cartons</span>
                  </div>
                  {formData.stockBefore && (
                    <p className="text-xs text-gray-500 mt-1">
                      Disponible: <span className="font-medium text-indigo-600">{formData.stockBefore}</span> cartons
                    </p>
                  )}
                </div>

                {formData.productId && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-medium text-gray-600">Impact sur le stock</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Avant</p>
                        <p className="text-lg font-semibold text-gray-800">{formData.stockBefore || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Après</p>
                        <p className="text-lg font-semibold text-indigo-600">{formData.stockAfter || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    {isSubmitting ? "Création..." : "Créer le transfert"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALE DÉTAILS ===== */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Détails du mouvement
              </h3>
              <button onClick={() => setSelectedMovement(null)} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedMovement.type === "Entrée" 
                    ? selectedMovement.sousType === 'creation'
                      ? "bg-purple-100"
                      : selectedMovement.sousType === 'reapprovisionnement'
                      ? "bg-green-100"
                      : selectedMovement.sousType === 'annulation'
                      ? "bg-cyan-100"
                      : "bg-green-100"
                    : selectedMovement.sousType === 'transfert'
                    ? "bg-blue-100"
                    : "bg-gray-100"
                }`}>
                  {selectedMovement.type === "Entrée" ? (
                    <ArrowDownRight className={
                      selectedMovement.sousType === 'creation' ? "text-purple-600" : 
                      selectedMovement.sousType === 'reapprovisionnement' ? "text-green-600" :
                      selectedMovement.sousType === 'annulation' ? "text-cyan-600" : "text-green-600"
                    } size={24} />
                  ) : selectedMovement.sousType === 'transfert' ? (
                    <Truck className="text-blue-600" size={24} />
                  ) : (
                    <MinusCircle className="text-gray-600" size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-semibold ${
                      selectedMovement.type === "Entrée" 
                        ? selectedMovement.sousType === 'creation'
                          ? "text-purple-600"
                          : selectedMovement.sousType === 'reapprovisionnement'
                          ? "text-green-600"
                          : selectedMovement.sousType === 'annulation'
                          ? "text-cyan-600"
                          : "text-green-600"
                        : selectedMovement.sousType === 'transfert'
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}>
                      {selectedMovement.type === "Entrée" 
                        ? selectedMovement.sousType === 'creation'
                          ? 'Ajout produit'
                          : selectedMovement.sousType === 'reapprovisionnement'
                          ? 'Approvisionnement'
                          : selectedMovement.sousType === 'annulation'
                          ? 'Annulation de transfert'
                          : 'Entrée'
                        : selectedMovement.sousType === 'transfert'
                        ? 'Transfert'
                        : 'Diminution'}
                    </p>
                    {selectedMovement.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                        <Ban size={10} /> Annulé
                      </span>
                    )}
                    {selectedMovement.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        <Clock size={10} /> En attente
                      </span>
                    )}
                    {selectedMovement.status === 'validated' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                        <CheckCircle size={10} /> Validé
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Produit</p>
                  <p className="font-medium text-gray-800">{selectedMovement.product}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantité</p>
                  <p className={`font-semibold ${
                    selectedMovement.type === "Entrée" ? "text-green-600" : "text-red-600"
                  }`}>
                    {selectedMovement.type === "Entrée" ? "+" : "-"}{selectedMovement.quantity} cartons
                  </p>
                </div>
                
                {/* SOURCE pour les entrées */}
                {selectedMovement.type === "Entrée" && (
                  <div>
                    <p className="text-xs text-gray-500">Source</p>
                    <p className="font-medium text-green-600">
                      {selectedMovement.sousType === 'annulation' 
                        ? 'Dépôt'
                        : 'Fournisseur'
                      }
                    </p>
                  </div>
                )}
                
                {/* DESTINATION pour les sorties */}
                {selectedMovement.type === "Sortie" && (
                  <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className={`font-medium ${
                      selectedMovement.sousType === 'transfert' ? "text-indigo-600" : "text-gray-600"
                    }`}>
                      {selectedMovement.sousType === 'transfert' 
                        ? 'Boutique Colobane'
                        : 'Fournisseur'
                      }
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm text-gray-700">{formatDateTime(selectedMovement.date)}</p>
                </div>
                {selectedMovement.motif && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Motif</p>
                    <p className="text-sm text-gray-700">{selectedMovement.motif}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedMovement(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALE CONFIRMATION ANNULATION ===== */}
      {cancelPendingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Annuler ce transfert ?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette action est irréversible. Le transfert sera supprimé et le stock sera remis à son niveau initial.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelPendingId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Non, garder
              </button>
              <button
                onClick={() => cancelPendingSortie(cancelPendingId)}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowRight(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
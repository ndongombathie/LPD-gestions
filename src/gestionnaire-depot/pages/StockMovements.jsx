// src/gestionnaire-depot/pages/StockMovements.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import "../styles/depot-fix.css";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Search,
  Filter,
  CalendarRange,
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

/* =========================================================================
   IMPORT DES API
   ========================================================================= */
import { mouvementsAPI } from "../../services/api/mouvements";
import { stockAPI } from "../../services/api/stock";
import { produitsAPI } from "../../services/api/produits";
import { fournisseursAPI } from "../../services/api/fournisseurs";

/* =========================================================================
   HELPERS
   ========================================================================= */
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

const todayIsSameDay = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

/* =========================================================================
   FONCTION DE MAPPAGE DES MOUVEMENTS
   ========================================================================= */
const mapMovement = (m, productsList, fournisseursList) => {
  const produit = productsList.find(p => p.id === m.produit_id) || m.produit || {};
  const stockActuel = Number(produit.nombre_carton || 0);

  let stockBefore, stockAfter;
  if (m.type === 'entree') {
    stockBefore = Math.max(0, stockActuel - (m.quantite || 0));
    stockAfter = stockActuel;
  } else {
    stockBefore = Math.max(0, stockActuel + (m.quantite || 0));
    stockAfter = stockActuel;
  }

  let source = "Boutique Colobane";
  if (m.type === 'entree') {
    const fournisseur = fournisseursList.find(f => f.id === produit.fournisseur_id);
    source = fournisseur?.nom || "Fournisseur inconnu";
  }

  const motif = m.motif || '';
  let sousType = '';
  if (m.type === 'sortie') {
    if (motif.toLowerCase().includes('transfert')) {
      sousType = 'transfert';
    } else {
      sousType = 'diminution';
    }
  }

  // Détermination du statut
  let status = m.statut?.toLowerCase() || 'completed';
  if (m.type === 'entree') status = 'completed';
  else if (status === 'en_attente') status = 'pending';
  else if (status === 'validé') status = 'validated';
  else if (status === 'annulé') status = 'cancelled';

  return {
    id: m.id,
    type: m.type === 'entree' ? 'Entrée' : 'Sortie',
    sousType,
    product: produit.nom || 'Produit inconnu',
    barcode: produit.code_barre || '',
    source,
    quantity: m.quantite || 0,
    stockBefore,
    stockAfter,
    date: m.date || m.created_at,
    status,
    motif,
    createdAt: m.created_at,
    validatedAt: m.validated_at,
  };
};

/* =========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================= */
export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [sousTypeFilter, setSousTypeFilter] = useState("Tous");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("historique");

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
    date: "",
  });

  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const productDropdownRef = useRef(null);

  const [selectedMovement, setSelectedMovement] = useState(null);
  const [cancelPendingId, setCancelPendingId] = useState(null);

  const [pageSize, setPageSize] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [cancelledPage, setCancelledPage] = useState(1);

  /* ==================== CHARGEMENT INITIAL ==================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsRes, fournisseursRes, movementsRaw] = await Promise.all([
          produitsAPI.getAll({ per_page: 1000 }),
          fournisseursAPI.getAll({ per_page: 1000 }),
          mouvementsAPI.getAllPaginated(),
        ]);

        const productsData = Array.isArray(productsRes) ? productsRes : productsRes.data || [];
        const formattedProducts = productsData.map(p => ({
          id: p.id,
          nom: p.nom,
          code_barre: p.code_barre || "",
          nombre_carton: p.nombre_carton || 0,
          prix_unite_carton: p.prix_unite_carton || 0,
          categorie: p.categorie || null,
          fournisseur_id: p.fournisseur_id,
        }));
        setProducts(formattedProducts);

        const fournisseursData = Array.isArray(fournisseursRes) ? fournisseursRes : fournisseursRes.data || [];
        const formattedFournisseurs = fournisseursData.map(f => ({
          id: f.id,
          nom: f.nom || f.name || "Inconnu",
        }));
        setFournisseurs(formattedFournisseurs);

        const formattedMovements = movementsRaw.map(m => 
          mapMovement(m, formattedProducts, formattedFournisseurs)
        );
        setMovements(formattedMovements);
      } catch (err) {
        console.error("❌ Erreur chargement:", err);
        setError("Impossible de charger les mouvements.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ==================== STATISTIQUES ==================== */
  const stats = useMemo(() => {
    let totalEntries = 0; // nombre d'opérations d'entrée
    let totalValidated = 0; // nombre de sorties validées (transferts + diminutions)
    let totalPending = 0; // nombre de transferts en attente
    let todayCount = 0; // nombre total de mouvements aujourd'hui

    movements.forEach((m) => {
      if (m.type === "Entrée") totalEntries += 1;
      if (m.type === "Sortie" && m.status === "validated") totalValidated += 1;
      if (m.type === "Sortie" && m.status === "pending") totalPending += 1;
      if (todayIsSameDay(m.date)) todayCount += 1;
    });

    return { totalEntries, totalValidated, totalPending, todayCount };
  }, [movements]);

  /* ==================== FILTRAGE PAR ONGLET ==================== */
  const filteredByTab = useMemo(() => {
    // Applique les filtres communs (recherche, dates)
    const baseFiltered = movements.filter((m) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term ||
        (m.product?.toLowerCase() || "").includes(term) ||
        (m.source?.toLowerCase() || "").includes(term);

      const d = new Date(m.date);
      if (Number.isNaN(d.getTime())) return matchesSearch;

      let matchesDate = true;
      if (dateFrom) {
        const from = new Date(dateFrom); from.setHours(0,0,0,0);
        if (d < from) matchesDate = false;
      }
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23,59,59,999);
        if (d > to) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });

    // Ensuite filtre par onglet
    if (activeTab === "historique") {
      return baseFiltered.filter(m => 
        m.type === "Entrée" || (m.type === "Sortie" && m.status === "validated")
      );
    } else if (activeTab === "en-attente") {
      return baseFiltered.filter(m => m.type === "Sortie" && m.status === "pending");
    } else if (activeTab === "annulees") {
      return baseFiltered.filter(m => m.type === "Sortie" && m.status === "cancelled");
    }
    return [];
  }, [movements, searchTerm, dateFrom, dateTo, activeTab]);

  /* ==================== PAGINATION PAR ONGLET ==================== */
  const paginationByTab = {
    historique: {
      data: filteredByTab,
      page: historyPage,
      setPage: setHistoryPage,
    },
    "en-attente": {
      data: filteredByTab,
      page: pendingPage,
      setPage: setPendingPage,
    },
    annulees: {
      data: filteredByTab,
      page: cancelledPage,
      setPage: setCancelledPage,
    },
  };

  const currentPagination = paginationByTab[activeTab];
  const totalPages = Math.max(1, Math.ceil(currentPagination.data.length / pageSize));
  const currentPage = Math.min(currentPagination.page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = currentPagination.data.slice(startIndex, startIndex + pageSize);

  /* ==================== COMPOSANT PAGINATION ==================== */
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
            currentPagination.setPage(1);
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

  /* ==================== DROPDOWN PRODUIT ==================== */
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p =>
      (p.nom?.toLowerCase() || "").includes(term) ||
      (p.code_barre?.toLowerCase() || "").includes(term) ||
      (p.categorie?.nom?.toLowerCase() || "").includes(term)
    );
  }, [products, productSearch]);

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

  /* ==================== GESTION FORMULAIRE ==================== */
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

  /* ==================== CRÉATION DE TRANSFERT ==================== */
  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const { productId, quantity, date } = formData;
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

    try {
      // Appel API pour créer un transfert en attente
      await stockAPI.transfer({
        produit_id: productId,
        quantite: qtyNum,
        from_location: "Dépôt",
        to_location: "Boutique Colobane",
        date: date || new Date().toISOString(),
      });

      // Recharger les mouvements
      const updatedRes = await mouvementsAPI.getAllPaginated();
      const updatedMovements = updatedRes.map(m => mapMovement(m, products, fournisseurs));
      setMovements(updatedMovements);

      alert("✅ Transfert créé et en attente de validation par la boutique.");
      closeModal();
    } catch (err) {
      console.error("❌ Erreur création transfert:", err);
      setFormError(err.response?.data?.message || "Erreur lors du transfert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==================== ANNULATION D'UN TRANSFERT ==================== */
  const cancelPendingSortie = async (sortieId) => {
    try {
      // ⚠️  Endpoint à implémenter côté backend
      await stockAPI.cancelTransfer(sortieId); // méthode à créer dans stockAPI
      setCancelPendingId(null);
      // Recharger les mouvements
      const updatedRes = await mouvementsAPI.getAllPaginated();
      const updatedMovements = updatedRes.map(m => mapMovement(m, products, fournisseurs));
      setMovements(updatedMovements);
      alert("✅ Transfert annulé.");
    } catch (err) {
      console.error("❌ Erreur annulation:", err);
      alert("Impossible d'annuler ce transfert. Vérifiez que l'endpoint est implémenté.");
    }
  };

  /* ==================== GESTION MODALE ==================== */
  const openModal = () => {
    setFormData({
      productId: "",
      product: "",
      barcode: "",
      quantity: "",
      stockBefore: "",
      stockAfter: "",
      date: "",
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

  /* ==================== COMPOSANT DROPDOWN ==================== */
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
                  {product.prix_unite_carton > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Prix: {product.prix_unite_carton.toLocaleString("fr-FR")} F CFA
                    </div>
                  )}
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

  /* ==================== RENDU ==================== */
  if (loading) {
    return (
      <div className="depot-page flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des mouvements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="depot-page p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-sm underline text-red-600 hover:text-red-800">
          Réessayer
        </button>
      </div>
    );
  }

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

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Entrées</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalEntries}</p>
            <p className="text-xs text-gray-400 mt-1">opérations</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <ArrowDownRight className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Sorties validées</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalValidated}</p>
            <p className="text-xs text-gray-400 mt-1">opérations</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <ArrowUpRight className="text-red-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">En attente</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPending}</p>
            <p className="text-xs text-gray-400 mt-1">transferts</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="text-yellow-600" size={20} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.todayCount}</p>
            <p className="text-xs text-gray-400 mt-1">mouvements</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Activity className="text-indigo-600" size={20} />
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
            En attente ({stats.totalPending})
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

      {/* FILTRES COMMUNS (recherche + dates) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Filter size={14} />
          <span className="font-medium">Filtres</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Recherche</p>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Produit, fournisseur..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); currentPagination.setPage(1); }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Date début</p>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); currentPagination.setPage(1); }}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Date fin</p>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); currentPagination.setPage(1); }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              setSearchTerm("");
              setDateFrom("");
              setDateTo("");
              currentPagination.setPage(1);
            }}
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
            <span className="text-xs text-gray-500 ml-2">({filteredByTab.length})</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info size={14} />
            <span>Cliquez sur une ligne pour plus de détails</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {activeTab !== "en-attente" && <th className="text-left px-4 py-3">Type</th>}
                <th className="text-left px-4 py-3">Produit</th>
                {activeTab !== "en-attente" && <th className="text-left px-4 py-3">Source / Destination</th>}
                {activeTab === "en-attente" && <th className="text-left px-4 py-3">Destination</th>}
                <th className="text-center px-4 py-3">Quantité</th>
                <th className="text-center px-4 py-3">Stock Av. / Ap.</th>
                <th className="text-center px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedMovement(item)}
                >
                  {activeTab !== "en-attente" && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          item.type === "Entrée"
                            ? "bg-green-50 text-green-700"
                            : item.sousType === 'transfert'
                            ? "bg-blue-50 text-blue-700"
                            : "bg-orange-50 text-orange-700"
                        }`}>
                          {item.type === "Entrée" ? (
                            <ArrowDownRight size={14} />
                          ) : item.sousType === 'transfert' ? (
                            <Truck size={14} />
                          ) : (
                            <MinusCircle size={14} />
                          )}
                          {item.type === "Entrée" ? 'Entrée' : (item.sousType === 'transfert' ? 'Transfert' : 'Diminution')}
                        </span>
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
                            <span className="text-green-600">{item.source}</span>
                          </>
                        ) : (
                          <>
                            <Store size={12} className="text-indigo-500" />
                            <span className="text-indigo-600">{item.source}</span>
                          </>
                        )}
                      </div>
                    </td>
                  ) : (
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Store size={12} className="text-indigo-500" />
                        <span className="text-indigo-600">{item.source}</span>
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
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-gray-600">{item.stockBefore}</span>
                      <ArrowRight className="text-gray-400" size={12} />
                      <span className={`font-bold ${
                        item.type === "Entrée" ? "text-green-600" : "text-red-600"
                      }`}>
                        {item.stockAfter}
                      </span>
                    </div>
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
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={activeTab === "en-attente" ? 6 : 7} className="px-4 py-6 text-center text-gray-400 text-sm italic">
                    Aucun élément à afficher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredByTab.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={currentPagination.setPage}
              filteredCount={filteredByTab.length}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* MODALE NOUVEAU TRANSFERT (identique) */}
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
                {/* Destination (fixe) */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Destination</label>
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <Store size={18} className="text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Boutique Colobane</span>
                  </div>
                </div>

                {/* Sélection produit */}
                <ProductDropdown />

                {/* Quantité */}
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

                {/* Impact sur le stock */}
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

                {/* Date optionnelle */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Date (optionnelle)</label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Boutons */}
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

      {/* MODALE DÉTAILS (identique) */}
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
                  selectedMovement.type === "Entrée" ? "bg-green-100" : 
                  selectedMovement.sousType === 'transfert' ? "bg-blue-100" : "bg-orange-100"
                }`}>
                  {selectedMovement.type === "Entrée" ? (
                    <ArrowDownRight className="text-green-600" size={24} />
                  ) : selectedMovement.sousType === 'transfert' ? (
                    <Truck className="text-blue-600" size={24} />
                  ) : (
                    <MinusCircle className="text-orange-600" size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-semibold ${
                      selectedMovement.type === "Entrée" ? "text-green-600" : 
                      selectedMovement.sousType === 'transfert' ? "text-blue-600" : "text-orange-600"
                    }`}>
                      {selectedMovement.type === "Entrée" ? 'Entrée' : 
                       selectedMovement.sousType === 'transfert' ? 'Transfert' : 'Diminution'}
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
                <div>
                  <p className="text-xs text-gray-500">
                    {selectedMovement.type === "Entrée" ? "Fournisseur" : "Destination"}
                  </p>
                  <p className={`font-medium ${
                    selectedMovement.type === "Entrée" ? "text-green-600" : "text-indigo-600"
                  }`}>
                    {selectedMovement.source}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm text-gray-700">{formatDateTime(selectedMovement.date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Stock avant / après</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-700 font-medium">{selectedMovement.stockBefore}</span>
                    <ArrowRight className="text-gray-400" size={14} />
                    <span className={`font-bold ${
                      selectedMovement.type === "Entrée" ? "text-green-600" : "text-red-600"
                    }`}>
                      {selectedMovement.stockAfter}
                    </span>
                    <span className="text-xs text-gray-500">cartons</span>
                  </div>
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

      {/* MODALE CONFIRMATION ANNULATION */}
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

// Composant ArrowRight
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
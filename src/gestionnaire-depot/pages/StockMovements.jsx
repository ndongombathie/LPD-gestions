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
} from "lucide-react";

/* =========================================================================
   IMPORT DES API
   ========================================================================= */
import { mouvementsAPI } from "../../services/api/mouvements";
import { stockAPI } from "../../services/api/stock";
import { produitsAPI } from "../../services/api/produits";

/* =========================================================================
   HELPERS (conservés)
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
   COMPOSANT PRINCIPAL
   ========================================================================= */
export default function StockMovements() {
  /* ------------------------- Données réelles depuis API ------------------------- */
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ------------------------- États UI ------------------------------------------ */
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("historique");

  /* ------------------------- Modal nouvelle sortie ----------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    productId: "",
    product: "",
    barcode: "",
    quantity: "",
    stockBefore: "",
    stockAfter: "",
    date: "",
  });

  /* ------------------------- Dropdown produits --------------------------------- */
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const productDropdownRef = useRef(null);

  /* ------------------------- Modales détails et annulation --------------------- */
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [cancelPendingId, setCancelPendingId] = useState(null);

  /* ------------------------- Pagination ---------------------------------------- */
  const [pageSize, setPageSize] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  /* ==================== 1. CHARGEMENT INITIAL DES DONNÉES ==================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Appels parallèles avec demande d'un grand nombre d'éléments
        const [movementsRes, productsRes] = await Promise.all([
          mouvementsAPI.getAll({ per_page: 1000 }),
          produitsAPI.getAll({ per_page: 1000 }),
        ]);

        // ---------- TRANSFORMATION DES MOUVEMENTS ----------
        // La réponse peut être soit un tableau direct, soit un objet paginé { data: [...] }
        const movementsRaw = Array.isArray(movementsRes)
          ? movementsRes
          : movementsRes.data || [];

        const formattedMovements = movementsRaw.map((m) => ({
          id: m.id,
          // Normalisation du type
          type: m.type === "entree" ? "Entrée" : "Sortie",
          // Informations produit (relation chargée)
          product: m.produit?.nom || "Produit inconnu",
          barcode: m.produit?.code_barre || "",
          // Source / destination
          source:
            m.type === "entree"
              ? m.entree_sortie?.fournisseur_nom || "Fournisseur"
              : "Boutique Colobane", // À adapter si besoin
          quantity: m.quantite || 0,
          stockBefore: m.stock_avant || 0,
          stockAfter: m.stock_apres || 0,
          date: m.date || m.created_at,
          // Statut : pour les entrées on met "completed", pour les sorties on regarde s'il y a un champ statut
          status:
            m.type === "entree"
              ? "completed"
              : m.statut?.toLowerCase() === "validé"
              ? "validated"
              : m.statut?.toLowerCase() === "en attente"
              ? "pending"
              : "validated", // Par défaut, les sorties sont validées (car mouvement enregistré)
          createdAt: m.created_at,
          validatedAt: m.validated_at,
        }));

        // ---------- TRANSFORMATION DES PRODUITS ----------
        const productsRaw = Array.isArray(productsRes)
          ? productsRes
          : productsRes.data || [];

        const formattedProducts = productsRaw.map((p) => ({
          id: p.id,
          nom: p.nom,
          code_barre: p.code_barre || "",
          nombre_carton: p.nombre_carton || 0,
          prix_unite_carton: p.prix_unite_carton || 0,
          categorie: p.categorie || null,
        }));

        setMovements(formattedMovements);
        setProducts(formattedProducts);
      } catch (err) {
        console.error("❌ Erreur chargement des données:", err);
        setError(
          "Impossible de charger les mouvements de stock. Vérifiez votre connexion au serveur."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ==================== 2. FERMETURE DROPDOWN EXTERNE ==================== */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ==================== 3. STATISTIQUES ==================== */
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let todayCount = 0;

    movements.forEach((m) => {
      if (m.type === "Entrée") totalIn += Number(m.quantity || 0);
      if (m.type === "Sortie" && m.status === "validated")
        totalOut += Number(m.quantity || 0);
      if (todayIsSameDay(m.date)) todayCount += 1;
    });

    const pendingCount = movements.filter(
      (m) => m.type === "Sortie" && m.status === "pending"
    ).length;

    return { totalIn, totalOut, todayCount, pendingCount };
  }, [movements]);

  /* ==================== 4. SORTIES EN ATTENTE (dérivées) ==================== */
  const pendingSorties = useMemo(() => {
    return movements.filter(
      (m) => m.type === "Sortie" && m.status === "pending"
    );
  }, [movements]);

  /* ==================== 5. FILTRAGE DES MOUVEMENTS (HISTORIQUE) ==================== */
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (m.product?.toLowerCase() || "").includes(term) ||
        (m.barcode?.toLowerCase() || "").includes(term) ||
        (m.source?.toLowerCase() || "").includes(term);

      const matchesType =
        typeFilter === "Tous" ||
        (m.type?.toLowerCase() || "") === typeFilter.toLowerCase();

      const d = new Date(m.date);
      if (Number.isNaN(d.getTime())) return matchesSearch && matchesType;

      let matchesDate = true;
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (d < from) matchesDate = false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) matchesDate = false;
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [movements, searchTerm, typeFilter, dateFrom, dateTo]);

  /* ==================== 6. PAGINATION ==================== */
  // Historique
  const totalHistoryPages = Math.max(
    1,
    Math.ceil(filteredMovements.length / pageSize)
  );
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const startHistoryIndex = (currentHistoryPage - 1) * pageSize;
  const paginatedHistory = filteredMovements.slice(
    startHistoryIndex,
    startHistoryIndex + pageSize
  );

  // Sorties en attente
  const totalPendingPages = Math.max(
    1,
    Math.ceil(pendingSorties.length / pageSize)
  );
  const currentPendingPage = Math.min(pendingPage, totalPendingPages);
  const startPendingIndex = (currentPendingPage - 1) * pageSize;
  const paginatedPending = pendingSorties.slice(
    startPendingIndex,
    startPendingIndex + pageSize
  );

  /* ==================== 7. COMPOSANT PAGINATION (réutilisable) ==================== */
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    filteredCount,
    pageSize,
  }) => {
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Affichage de <span className="font-semibold">{startItem}</span> à{" "}
          <span className="font-semibold">{endItem}</span> sur{" "}
          <span className="font-semibold">{filteredCount}</span> éléments
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
            title="Première page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
            title="Page précédente"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded border flex items-center justify-center text-sm ${
                    currentPage === page
                      ? "bg-[#472EAD] text-white border-[#472EAD]"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
            title="Page suivante"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
            title="Dernière page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Éléments par page :</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              if (activeTab === "historique") setHistoryPage(1);
              if (activeTab === "en-attente") setPendingPage(1);
            }}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
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

  /* ==================== 8. PRODUITS FILTRÉS POUR LE DROPDOWN ==================== */
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.nom?.toLowerCase() || "").includes(term) ||
        (p.code_barre?.toLowerCase() || "").includes(term) ||
        (p.categorie?.nom?.toLowerCase() || "").includes(term)
    );
  }, [products, productSearch]);

  /* ==================== 9. SÉLECTION D'UN PRODUIT ==================== */
  const handleProductSelect = (product) => {
    const before = Number(product.nombre_carton || 0);
    const after = Math.max(0, before - Number(formData.quantity || 0));
    setFormData((prev) => ({
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

  /* ==================== 10. RECALCUL DU STOCK APRÈS ==================== */
  const recalcAfter = (newPartial = {}) => {
    const qty = Number(newPartial.quantity ?? formData.quantity ?? 0);
    const before = Number(newPartial.stockBefore ?? formData.stockBefore ?? 0);
    const after = Math.max(0, before - qty);
    setFormData((prev) => ({ ...prev, ...newPartial, stockAfter: String(after) }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const sanitized = value === "" ? "" : String(Math.max(0, Number(value)));
      setFormData((prev) => ({ ...prev, quantity: sanitized }));
      recalcAfter({ quantity: sanitized });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ==================== 11. CRÉATION D'UNE NOUVELLE SORTIE (TRANSFERT) ==================== */
  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    setFormError("");

    const { productId, quantity, date } = formData;
    if (!productId) {
      setFormError("Veuillez sélectionner un produit.");
      return;
    }
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setFormError("La quantité doit être supérieure à 0.");
      return;
    }

    try {
      // Appel API de transfert (défini dans stockAPI)
      await stockAPI.transfer({
        product_id: productId,
        quantity: qtyNum,
        from_location: "Dépôt",
        to_location: "Boutique Colobane",
        date: date || new Date().toISOString(),
      });

      // Recharger les mouvements pour voir la nouvelle sortie en attente
      const updatedRes = await mouvementsAPI.getAll({ per_page: 1000 });
      const updatedRaw = Array.isArray(updatedRes) ? updatedRes : updatedRes.data || [];
      const updatedMovements = updatedRaw.map((m) => ({
        /* ... même mapping que dans fetchData ... */
        id: m.id,
        type: m.type === "entree" ? "Entrée" : "Sortie",
        product: m.produit?.nom || "Produit inconnu",
        barcode: m.produit?.code_barre || "",
        source: m.type === "entree"
          ? m.entree_sortie?.fournisseur_nom || "Fournisseur"
          : "Boutique Colobane",
        quantity: m.quantite || 0,
        stockBefore: m.stock_avant || 0,
        stockAfter: m.stock_apres || 0,
        date: m.date || m.created_at,
        status:
          m.type === "entree"
            ? "completed"
            : m.statut?.toLowerCase() === "validé"
            ? "validated"
            : m.statut?.toLowerCase() === "en attente"
            ? "pending"
            : "validated",
        createdAt: m.created_at,
        validatedAt: m.validated_at,
      }));
      setMovements(updatedMovements);

      alert("✅ Transfert créé avec succès ! En attente de validation par la boutique.");
      closeModal();
    } catch (err) {
      console.error("❌ Erreur création transfert:", err);
      setFormError(
        err.response?.data?.message || "Erreur lors de la création du transfert."
      );
    }
  };

  /* ==================== 12. VALIDATION D'UNE SORTIE (par la boutique) ==================== */
  const validateSortie = async (sortieId) => {
    try {
      // ⚠️  Cette méthode doit être implémentée dans stockAPI
      // Exemple : await stockAPI.validateTransfer(sortieId);
      // En attendant, on simule ou on demande au back-end de créer l'endpoint
      alert("🔧 Fonction de validation à implémenter côté back-end (PUT /stocks/transfer/{id}/validate)");
      // Rechargement après validation (à décommenter quand l'API sera prête)
      // const updatedRes = await mouvementsAPI.getAll({ per_page: 1000 });
      // ... mise à jour du state ...
    } catch (err) {
      console.error("❌ Erreur validation:", err);
      alert("Impossible de valider cette sortie.");
    }
  };

  /* ==================== 13. ANNULATION D'UNE SORTIE EN ATTENTE ==================== */
  const cancelPendingSortie = async (sortieId) => {
    try {
      // ⚠️  Cette méthode doit être implémentée dans stockAPI
      // Exemple : await stockAPI.cancelTransfer(sortieId);
      alert("🔧 Fonction d'annulation à implémenter côté back-end (DELETE /stocks/transfer/{id})");
      // Rechargement après annulation
      // const updatedRes = await mouvementsAPI.getAll({ per_page: 1000 });
      // ... mise à jour ...
      setCancelPendingId(null);
    } catch (err) {
      console.error("❌ Erreur annulation:", err);
      alert("Impossible d'annuler ce transfert.");
    }
  };

  /* ==================== 14. GESTION MODALE ==================== */
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
  };

  /* ==================== 15. COMPOSANT DROPDOWN PRODUIT ==================== */
  const ProductDropdown = () => (
    <div ref={productDropdownRef} className="relative">
      <label className="block text-xs font-semibold text-gray-700 mb-2">
        Sélectionner un produit
      </label>
      <div className="relative">
        <div
          className="w-full border rounded-lg px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => setProductDropdownOpen(!productDropdownOpen)}
        >
          <div className="flex items-center gap-2">
            <Box size={16} className="text-gray-400" />
            <span className={formData.product ? "text-gray-900" : "text-gray-400"}>
              {formData.product || "Cliquez pour sélectionner un produit"}
            </span>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

        {productDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
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
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                    formData.productId === product.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{product.nom}</div>
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
                    <div className="text-xs font-semibold text-[#472EAD]">
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
                <div className="p-3 text-center text-gray-400 text-sm">
                  Aucun produit trouvé
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ==================== 16. RENDU ==================== */
  if (loading) {
    return (
      <div className="depot-page flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#472EAD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des mouvements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="depot-page p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="depot-page space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="text-[#472EAD]" />
          Gestion des Mouvements de Stock - Dépôt
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Suivi complet des entrées et sorties. Les sorties vers la boutique sont soumises à
          validation.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Entrées Totales</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalIn}</p>
            <p className="text-xs text-gray-500 mt-1">cartons (période totale)</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <ArrowDownRight className="text-green-600" size={20} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Sorties Validées</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOut}</p>
            <p className="text-xs text-gray-500 mt-1">cartons (période totale)</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <ArrowUpRight className="text-red-600" size={20} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Sorties en Attente</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">en attente de validation</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="text-yellow-600" size={20} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Mouvements Aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayCount}</p>
            <p className="text-xs text-gray-500 mt-1">opérations enregistrées</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Activity className="text-[#472EAD]" size={20} />
          </div>
        </div>
      </div>

      {/* BOUTON NOUVELLE SORTIE */}
      <div className="flex justify-end gap-3">
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#472EAD] to-[#f97316] text-white text-sm font-medium shadow hover:shadow-md"
        >
          <ArrowUpRight size={18} />
          Nouvelle Sortie
        </button>
      </div>

      {/* ONGLETS */}
      <div className="border-b">
        <nav className="flex space-x-4">
          <button
            onClick={() => {
              setActiveTab("historique");
              setHistoryPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "historique"
                ? "border-[#472EAD] text-[#472EAD]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Activity size={16} className="inline mr-2" />
            Historique des Mouvements ({movements.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("en-attente");
              setPendingPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "en-attente"
                ? "border-[#f97316] text-[#f97316]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock size={16} className="inline mr-2" />
            Sorties en Attente ({pendingSorties.length})
          </button>
        </nav>
      </div>

      {/* CONTENU DES ONGLETS */}
      {activeTab === "historique" ? (
        <>
          {/* FILTRES */}
          <div className="bg-white border rounded-xl shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Filter size={14} />
              <span>Filtres avancés</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Recherche globale</p>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Produit, code-barre, fournisseur..."
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHistoryPage(1);
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Type</p>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                >
                  <option value="Tous">Tous les types</option>
                  <option value="Entrée">Entrée</option>
                  <option value="Sortie">Sortie</option>
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Statut</p>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  disabled
                >
                  <option>À venir (non utilisé)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Date de début</p>
                <div className="relative">
                  <CalendarRange
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setHistoryPage(1);
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Date de fin</p>
                <div className="relative">
                  <CalendarRange
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setHistoryPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("Tous");
                    setDateFrom("");
                    setDateTo("");
                    setHistoryPage(1);
                  }}
                  className="px-4 py-2 w-full md:w-auto border rounded-lg text-sm hover:bg-gray-50"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* TABLEAU HISTORIQUE */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Activity size={16} className="text-[#472EAD]" />
                Historique des Mouvements ({filteredMovements.length} mouvements trouvés)
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info size={14} />
                <span>Clique sur la ligne pour consulter rapidement les infos.</span>
              </div>
            </div>

            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Produit</th>
                  <th className="text-left px-4 py-3">Code-barre</th>
                  <th className="text-left px-4 py-3">Source / Destination</th>
                  <th className="text-center px-4 py-3">Quantité (cartons)</th>
                  <th className="text-center px-4 py-3">Stock Av. / Ap.</th>
                  <th className="text-center px-4 py-3">Date</th>
                  <th className="text-center px-4 py-3">Statut</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedHistory.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMovement(m)}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          m.type === "Entrée"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {m.type === "Entrée" ? (
                          <ArrowDownRight size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      {m.product}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {m.barcode}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        {m.type === "Entrée" ? (
                          <>
                            <Building size={12} className="text-green-400" />
                            <span className="text-green-600">{m.source}</span>
                          </>
                        ) : (
                          <>
                            <Store size={12} className="text-blue-400" />
                            <span className="text-blue-600">{m.source}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold ${
                          m.type === "Entrée" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {m.type === "Entrée" ? "+" : "-"}
                        {m.quantity} cartons
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-gray-600">{m.stockBefore}</span>
                        <ArrowRight className="text-gray-400" size={12} />
                        <span
                          className={`font-bold ${
                            m.type === "Entrée" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {m.stockAfter}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {formatDateTime(m.date)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          m.status === "validated"
                            ? "bg-green-100 text-green-800"
                            : m.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {m.status === "validated" ? (
                          <CheckCircle size={12} />
                        ) : m.status === "pending" ? (
                          <Clock size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        {m.status === "validated"
                          ? "Validée"
                          : m.status === "pending"
                          ? "En attente"
                          : "Terminé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedMovement(m)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Info size={14} />
                          Détails
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-gray-400 text-sm italic"
                    >
                      {filteredMovements.length === 0
                        ? "Aucun mouvement ne correspond à ces critères."
                        : "Aucun mouvement sur cette page."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination pour l'historique */}
          {filteredMovements.length > 0 && (
            <Pagination
              currentPage={currentHistoryPage}
              totalPages={totalHistoryPages}
              onPageChange={setHistoryPage}
              filteredCount={filteredMovements.length}
              pageSize={pageSize}
            />
          )}
        </>
      ) : (
        /* ONGLET SORTIES EN ATTENTE */
        <>
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={16} className="text-[#f97316]" />
                Sorties en Attente de Validation ({pendingSorties.length} sorties)
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info size={14} />
                <span>
                  Ces sorties attendent la validation par la Boutique Colobane.
                </span>
              </div>
            </div>

            {pendingSorties.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 mb-4">
                  <Clock className="text-yellow-500" size={24} />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Aucune sortie en attente
                </h3>
                <p className="text-xs text-gray-500">
                  Toutes les sorties ont été validées par la boutique.
                </p>
              </div>
            ) : (
              <>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-3">Produit</th>
                      <th className="text-left px-4 py-3">Code-barre</th>
                      <th className="text-left px-4 py-3">Boutique Destinataire</th>
                      <th className="text-center px-4 py-3">Quantité (cartons)</th>
                      <th className="text-center px-4 py-3">Stock Av. / Ap.</th>
                      <th className="text-center px-4 py-3">Date de Création</th>
                      <th className="text-center px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedPending.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-800 flex items-center gap-2">
                          <Package size={14} className="text-gray-400" />
                          {s.product}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {s.barcode}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          <div className="flex items-center gap-2">
                            <Store size={12} className="text-blue-400" />
                            <div>
                              <div className="text-blue-600 font-medium">{s.source}</div>
                              <div className="text-gray-500 text-xs">
                                En attente de validation...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-red-600">
                            -{s.quantity} cartons
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-gray-600">{s.stockBefore}</span>
                            <ArrowRight className="text-gray-400" size={12} />
                            <span className="font-bold text-red-600">
                              {s.stockAfter}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          {formatDateTime(s.createdAt || s.date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setSelectedMovement(s)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Info size={14} />
                              Détails
                            </button>
                            <button
                              onClick={() => setCancelPendingId(s.id)}
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                            >
                              <XCircle size={14} />
                              Annuler
                            </button>
                            <button
                              onClick={() => validateSortie(s.id)}
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline border border-green-200 px-2 py-1 rounded"
                            >
                              <CheckCircle size={14} />
                              Valider
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Pagination pour les sorties en attente */}
          {pendingSorties.length > 0 && (
            <Pagination
              currentPage={currentPendingPage}
              totalPages={totalPendingPages}
              onPageChange={setPendingPage}
              filteredCount={pendingSorties.length}
              pageSize={pageSize}
            />
          )}
        </>
      )}

      {/* MODALE NOUVELLE SORTIE */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold">Nouvelle sortie de stock</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Transférer des produits vers la Boutique Colobane
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle size={16} />
                    <span className="text-sm font-medium">{formError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitMovement} className="space-y-6">
                {/* Type (affichage) */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                      <ArrowUpRight className="text-red-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Sortie de stock</h4>
                      <p className="text-sm text-gray-500">
                        Transfert de produits vers la Boutique Colobane
                      </p>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-4">
                  <div className="border-l-4 border-[#472EAD] pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Destination</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Boutique Destinataire
                    </label>
                    <div className="w-full border bg-blue-50 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2">
                      <Store className="text-blue-500" size={16} />
                      <span className="font-medium text-blue-700">
                        Boutique Colobane
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Toutes les sorties du dépôt sont destinées à la Boutique Colobane
                    </p>
                  </div>
                </div>

                {/* Sélection du produit */}
                <div className="space-y-4">
                  <div className="border-l-4 border-amber-500 pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Sélection du produit</h4>
                  </div>
                  <ProductDropdown />
                  {formData.productId && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Code-barre</p>
                        <p className="text-sm font-mono font-medium">
                          {formData.barcode || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock actuel</p>
                        <p className="text-sm font-medium">
                          {formData.stockBefore || "0"} cartons
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantité */}
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Quantité à transférer</h4>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Nombre de cartons
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleFormChange}
                        min="1"
                        max={formData.stockBefore || 0}
                        required
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={`Ex: 5 (max: ${formData.stockBefore || 0})`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                        cartons
                      </span>
                    </div>
                    {formData.stockBefore && (
                      <p className="text-xs text-gray-500 mt-1">
                        Disponible: <span className="font-bold">{formData.stockBefore}</span>{" "}
                        cartons
                      </p>
                    )}
                  </div>
                </div>

                {/* Impact sur le stock */}
                {formData.productId && (
                  <div className="space-y-4">
                    <div className="border-l-4 border-cyan-500 pl-4 py-1">
                      <h4 className="font-medium text-gray-900 text-sm">Impact sur le stock</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Stock avant</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">
                            {formData.stockBefore || "0"}
                          </p>
                          <Package size={16} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Stock après transfert</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-red-700">
                            {formData.stockAfter || "0"}
                          </p>
                          <ArrowUpRight className="text-red-600" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-4">
                  <div className="border-l-4 border-indigo-500 pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Date du transfert</h4>
                  </div>
                  <div>
                    <input
                      type="datetime-local"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Laissez vide pour utiliser la date et l'heure actuelles
                    </p>
                  </div>
                </div>

                {/* Boutons */}
                <div className="pt-6 mt-6 border-t">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#f97316] hover:from-[#3b2491] hover:to-[#ea580c]"
                    >
                      <Save size={16} />
                      Envoyer à la boutique
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DÉTAILS */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="text-[#472EAD]" />
                Détails du mouvement
              </h3>
              <button
                onClick={() => setSelectedMovement(null)}
                className="text-xl text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type :</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    selectedMovement.type === "Entrée"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {selectedMovement.type}
                </span>
                {selectedMovement.status && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      selectedMovement.status === "validated"
                        ? "bg-green-100 text-green-800"
                        : selectedMovement.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedMovement.status === "validated"
                      ? "Validée"
                      : selectedMovement.status === "pending"
                      ? "En attente"
                      : "Terminé"}
                  </span>
                )}
              </div>
              <p>
                <span className="font-semibold">Produit :</span> {selectedMovement.product}
              </p>
              <p>
                <span className="font-semibold">Code-barre :</span>{" "}
                <span className="font-mono">{selectedMovement.barcode}</span>
              </p>
              {selectedMovement.type === "Entrée" ? (
                <p>
                  <span className="font-semibold">Fournisseur :</span>{" "}
                  <span className="text-green-600">{selectedMovement.source}</span>
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Destination :</span>{" "}
                  <span className="text-blue-600">{selectedMovement.source}</span>
                </p>
              )}
              <p>
                <span className="font-semibold">Quantité :</span>{" "}
                <span
                  className={
                    selectedMovement.type === "Entrée"
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {selectedMovement.type === "Entrée" ? "+" : "-"}
                  {selectedMovement.quantity} cartons
                </span>
              </p>
              <p>
                <span className="font-semibold">Stock :</span>{" "}
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">{selectedMovement.stockBefore}</span>
                  <ArrowRight className="text-gray-400" size={12} />
                  <span
                    className={
                      selectedMovement.type === "Entrée"
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {selectedMovement.stockAfter}
                  </span>
                </span>
              </p>
              <p>
                <span className="font-semibold">Date :</span>{" "}
                {formatDateTime(selectedMovement.date)}
              </p>
              {selectedMovement.validatedAt && (
                <p>
                  <span className="font-semibold">Validé le :</span>{" "}
                  {formatDateTime(selectedMovement.validatedAt)}
                </p>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedMovement(null)}
                className="px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3b2491]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ANNULATION */}
      {cancelPendingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Annuler cette sortie en attente ?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Cette sortie n'a pas encore été validée par la boutique. Annuler la supprimera
              définitivement.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setCancelPendingId(null)}
                className="px-4 py-2 text-sm border rounded-lg"
              >
                Non, garder
              </button>
              <button
                onClick={() => cancelPendingSortie(cancelPendingId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
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

// Composant ArrowRight manquant (pour les flèches dans le tableau)
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
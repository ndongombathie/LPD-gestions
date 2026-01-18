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
  PlusCircle,
  Info,
  Trash2,
  Package,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Save,
  X,
  Truck,
  Building,
  ChevronDown,
  User,
  Box,
} from "lucide-react";

/* =========================================================================
   CONFIG / KEYS
   ========================================================================= */
const MOVEMENTS_STORAGE_KEY = "lpd_movements";
const PENDING_SORTIES_KEY = "lpd_pending_sorties";

/* =========================================================================
   DONNÉES FIXES - Produits et Fournisseurs
   ========================================================================= */
const PRODUCTS_LIST = [
  {
    id: 1,
    name: "Cahier 96 pages",
    barcode: "5981234567890",
    category: "Papeterie",
    cartons: 15,
    price: 8000,
    description: "Cahier grand format 96 pages",
  },
  {
    id: 2,
    name: "Stylo bleu",
    barcode: "5989876543210",
    category: "Fournitures",
    cartons: 17,
    price: 6000,
    description: "Stylo à bille bleu, pack de 12",
  },
  {
    id: 3,
    name: "Règle 30cm",
    barcode: "5984567891230",
    category: "Matériel scolaire",
    cartons: 8,
    price: 4500,
    description: "Règle en plastique 30cm",
  },
  {
    id: 4,
    name: "Gomme blanche",
    barcode: "5983216549870",
    category: "Fournitures",
    cartons: 12,
    price: 3000,
    description: "Gomme blanche standard",
  },
  {
    id: 5,
    name: "Crayon HB",
    barcode: "5981472583690",
    category: "Fournitures",
    cartons: 20,
    price: 2500,
    description: "Crayon à papier HB, pack de 24",
  },
  {
    id: 6,
    name: "Classeur A4",
    barcode: "5983692581470",
    category: "Papeterie",
    cartons: 5,
    price: 12000,
    description: "Classeur rigide A4",
  },
  {
    id: 7,
    name: "Taille-crayon",
    barcode: "5982581473690",
    category: "Fournitures",
    cartons: 10,
    price: 3500,
    description: "Taille-crayon avec réservoir",
  },
  {
    id: 8,
    name: "Feutres 12 couleurs",
    barcode: "5987418529630",
    category: "Fournitures",
    cartons: 6,
    price: 15000,
    description: "Pack de feutres 12 couleurs",
  }
];

const FOURNISSEURS_LIST = [
  { id: 1, nom: "Papeterie Plus", contact: "77 123 45 67", email: "contact@papeterieplus.sn" },
  { id: 2, nom: "Fournitures Scolaires Dakar", contact: "78 234 56 78", email: "info@fsdakar.sn" },
  { id: 3, nom: "Importateur de Matériel", contact: "76 345 67 89", email: "import@matériel.sn" },
  { id: 4, nom: "Grossiste Éducatif", contact: "70 456 78 90", email: "contact@grossisteduc.sn" },
  { id: 5, nom: "Distributeur Scolaire", contact: "77 567 89 01", email: "distrib@scolaire.sn" },
];

const INITIAL_MOVEMENTS = [
  {
    id: 1,
    type: "Entrée",
    productId: 1,
    product: "Cahier 96 pages",
    barcode: "5981234567890",
    source: "Papeterie Plus",
    quantity: 5,
    stockBefore: 10,
    stockAfter: 15,
    date: "2025-01-06T14:30:00",
    status: "completed",
  },
  {
    id: 2,
    type: "Sortie",
    productId: 2,
    product: "Stylo bleu",
    barcode: "5989876543210",
    source: "Boutique Colobane",
    quantity: 3,
    stockBefore: 20,
    stockAfter: 17,
    date: "2025-01-06T11:15:00",
    status: "validated",
    validatedAt: "2025-01-06T12:00:00",
  },
  {
    id: 3,
    type: "Entrée",
    productId: 3,
    product: "Règle 30cm",
    barcode: "5984567891230",
    source: "Fournitures Scolaires Dakar",
    quantity: 10,
    stockBefore: 0,
    stockAfter: 10,
    date: "2025-01-05T09:00:00",
    status: "completed",
  },
  {
    id: 4,
    type: "Sortie",
    productId: 1,
    product: "Cahier 96 pages",
    barcode: "5981234567890",
    source: "Boutique Colobane",
    quantity: 2,
    stockBefore: 15,
    stockAfter: 13,
    date: "2025-01-07T10:00:00",
    status: "pending",
    createdAt: "2025-01-07T10:00:00",
  },
  {
    id: 5,
    type: "Entrée",
    productId: 4,
    product: "Gomme blanche",
    barcode: "5983216549870",
    source: "Grossiste Éducatif",
    quantity: 8,
    stockBefore: 4,
    stockAfter: 12,
    date: "2025-01-08T14:20:00",
    status: "completed",
  },
];

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

const loadMovementsFromStorage = () => {
  try {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (!raw) return INITIAL_MOVEMENTS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOVEMENTS;
  }
};

const saveMovementsToStorage = (list) => {
  try {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
};

const loadPendingSortiesFromStorage = () => {
  try {
    const raw = localStorage.getItem(PENDING_SORTIES_KEY);
    if (!raw) {
      // Initialiser avec les sorties en attente depuis INITIAL_MOVEMENTS
      const pendingFromInitial = INITIAL_MOVEMENTS.filter(m => m.status === "pending");
      return pendingFromInitial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/* =========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================= */
export default function StockMovements() {
  /* ------------------------- données ------------------------- */
  const [products] = useState(PRODUCTS_LIST); // Produits fixes
  const [fournisseurs] = useState(FOURNISSEURS_LIST); // Fournisseurs fixes
  const [movements, setMovements] = useState(() => loadMovementsFromStorage());
  const [pendingSorties, setPendingSorties] = useState(() => loadPendingSortiesFromStorage());

  /* filtres */
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  /* onglets */
  const [activeTab, setActiveTab] = useState("historique");

  /* modal "nouveau mouvement" */
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    type: "Entrée",
    productId: "",
    product: "",
    barcode: "",
    source: "",
    quantity: "",
    stockBefore: "",
    stockAfter: "",
    date: "",
  });

  /* dropdowns ouverts/fermés */
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [fournisseurDropdownOpen, setFournisseurDropdownOpen] = useState(false);
  
  /* termes de recherche pour les dropdowns */
  const [productSearch, setProductSearch] = useState("");
  const [fournisseurSearch, setFournisseurSearch] = useState("");

  /* refs pour fermer les dropdowns en cliquant à l'extérieur */
  const productDropdownRef = useRef(null);
  const fournisseurDropdownRef = useRef(null);

  /* modals détails */
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [cancelPendingId, setCancelPendingId] = useState(null);

  /* sauvegarde automatique */
  useEffect(() => {
    saveMovementsToStorage(movements);
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(PENDING_SORTIES_KEY, JSON.stringify(pendingSorties));
    } catch {}
  }, [pendingSorties]);

  /* fermer les dropdowns en cliquant à l'extérieur */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setProductDropdownOpen(false);
      }
      if (fournisseurDropdownRef.current && !fournisseurDropdownRef.current.contains(event.target)) {
        setFournisseurDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ================== stats ================== */
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let todayCount = 0;
    let pendingCount = pendingSorties.length;
    
    movements.forEach((m) => {
      if (m.type === "Entrée") totalIn += Number(m.quantity || 0);
      if (m.type === "Sortie" && m.status === "validated") totalOut += Number(m.quantity || 0);
      if (todayIsSameDay(m.date)) todayCount += 1;
    });
    
    return { totalIn, totalOut, todayCount, pendingCount };
  }, [movements, pendingSorties]);

  /* ================== filtered movements (historique) ================== */
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const term = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !term ||
        (m.product && m.product.toLowerCase().includes(term)) ||
        (m.barcode && m.barcode.toLowerCase().includes(term)) ||
        (m.source && m.source.toLowerCase().includes(term));

      const matchesType =
        typeFilter === "Tous" || m.type.toLowerCase() === typeFilter.toLowerCase();

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

  /* ================== filtered options ================== */
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    
    return products.filter((p) => 
      String(p.name).toLowerCase().includes(term) ||
      String(p.barcode || "").toLowerCase().includes(term) ||
      String(p.category || "").toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const filteredFournisseurs = useMemo(() => {
    const term = fournisseurSearch.trim().toLowerCase();
    if (!term) return fournisseurs;
    
    return fournisseurs.filter((f) => 
      String(f.nom).toLowerCase().includes(term) ||
      String(f.contact || "").toLowerCase().includes(term) ||
      String(f.email || "").toLowerCase().includes(term)
    );
  }, [fournisseurs, fournisseurSearch]);

  /* ================== open/close modal avec type prédéfini ================== */
  const openModal = (type = "Entrée") => {
    setFormData({
      type: type,
      productId: "",
      product: "",
      barcode: "",
      source: type === "Entrée" ? "" : "Boutique Colobane",
      quantity: "",
      stockBefore: "",
      stockAfter: "",
      date: "",
    });
    setFormError("");
    setProductSearch("");
    setFournisseurSearch("");
    setProductDropdownOpen(false);
    setFournisseurDropdownOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
    setProductSearch("");
    setFournisseurSearch("");
    setProductDropdownOpen(false);
    setFournisseurDropdownOpen(false);
  };

  /* ================== Selection produit ================== */
  const handleProductSelect = (product) => {
    const before = Number(product.cartons || 0);
    const qty = Number(formData.quantity || 0);
    const after =
      formData.type === "Sortie" ? Math.max(0, before - qty) : before + qty;

    setFormData((prev) => ({
      ...prev,
      productId: product.id,
      product: product.name,
      barcode: product.barcode || "",
      stockBefore: String(before),
      stockAfter: String(after),
    }));
    
    setProductSearch(product.name);
    setProductDropdownOpen(false);
  };

  /* ================== Selection fournisseur ================== */
  const handleFournisseurSelect = (fournisseur) => {
    setFormData((prev) => ({
      ...prev,
      source: fournisseur.nom
    }));
    
    setFournisseurSearch(fournisseur.nom);
    setFournisseurDropdownOpen(false);
  };

  /* ================== recalc stockAfter ================== */
  const recalcAfter = (newPartial = {}) => {
    const type = newPartial.type ?? formData.type;
    const qty = Number(newPartial.quantity ?? formData.quantity ?? 0);
    const before = Number(
      newPartial.stockBefore ?? formData.stockBefore ?? 0
    );
    const after = type === "Sortie" ? Math.max(0, before - qty) : before + qty;
    setFormData((prev) => ({ ...prev, ...newPartial, stockAfter: String(after) }));
  };

  /* handler général sur champs du formulaire */
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      const newType = value;
      setFormData((prev) => ({ 
        ...prev, 
        type: newType,
        source: newType === "Entrée" ? "" : "Boutique Colobane"
      }));
      recalcAfter({ type: newType });
      return;
    }
    
    if (name === "quantity") {
      const sanitized = value === "" ? "" : String(Math.max(0, Number(value)));
      setFormData((prev) => ({ ...prev, quantity: sanitized }));
      recalcAfter({ quantity: sanitized });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ================== submit movement ================== */
  const handleSubmitMovement = (e) => {
    e.preventDefault();
    setFormError("");

    const {
      type,
      productId,
      product,
      barcode,
      source,
      quantity,
      stockBefore,
      stockAfter,
      date,
    } = formData;

    if (!productId) {
      setFormError("Sélectionne un produit depuis la liste.");
      return;
    }
    
    const qtyNum = Number(quantity || 0);
    if (!qtyNum || qtyNum <= 0) {
      setFormError("Quantité invalide (> 0).");
      return;
    }
    
    const beforeNum = Number(stockBefore || 0);
    const afterNum = Number(stockAfter || 0);

    // Pour une ENTREE : traitement immédiat
    if (type === "Entrée") {
      if (!source) {
        setFormError("Sélectionne un fournisseur.");
        return;
      }

      const movement = {
        id: Date.now(),
        type,
        productId,
        product,
        barcode,
        source: source,
        quantity: qtyNum,
        stockBefore: beforeNum,
        stockAfter: afterNum,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        status: "completed",
      };

      // Mise à jour immédiate du stock
      setMovements((prev) => [movement, ...prev]);
      
      // Mettre à jour le produit dans la liste locale
      const updatedProducts = products.map((p) => {
        if (String(p.id) === String(productId)) {
          return { ...p, cartons: movement.stockAfter };
        }
        return p;
      });
      // Note: on ne sauvegarde pas dans localStorage car products est fixe
      // Mais on met à jour l'affichage
      
      // Si vous voulez persister, il faudrait un autre système
      // Pour l'instant, on met juste à jour l'affichage
    }
    
    // Pour une SORTIE : création d'une sortie en attente
    if (type === "Sortie") {
      if (qtyNum > beforeNum) {
        setFormError("Impossible : la sortie est supérieure au stock disponible.");
        return;
      }
      
      const pendingSortie = {
        id: Date.now(),
        type: "Sortie",
        productId,
        product,
        barcode,
        source: "Boutique Colobane",
        quantity: qtyNum,
        stockBefore: beforeNum,
        stockAfter: afterNum,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        status: "pending",
        createdAt: new Date().toISOString(),
        createdBy: "Dépôt",
      };

      // Ajout à la liste des sorties en attente
      setPendingSorties((prev) => [pendingSortie, ...prev]);
      
      // Afficher un message de confirmation
      alert(`Sortie créée avec succès !\n\nElle est maintenant en attente de validation par la Boutique Colobane.\n\nVous pouvez suivre son statut dans l'onglet "Sorties en attente".`);
    }

    closeModal();
  };

  /* ================== Annuler une sortie en attente ================== */
  const cancelPendingSortie = (id) => {
    setPendingSorties((prev) => prev.filter((s) => s.id !== id));
    setCancelPendingId(null);
    alert("Sortie en attente annulée avec succès.");
  };

  /* ================== Simuler la validation par la boutique (pour test) ================== */
  const simulateBoutiqueValidation = (sortieId) => {
    const sortie = pendingSorties.find(s => s.id === sortieId);
    if (!sortie) return;

    setPendingSorties((prev) => prev.filter((s) => s.id !== sortieId));

    const validatedMovement = {
      ...sortie,
      status: "validated",
      validatedAt: new Date().toISOString(),
      validatedBy: "Boutique Colobane",
    };

    setMovements((prev) => [validatedMovement, ...prev]);

    alert(`Sortie validée par la boutique !\n\nLe stock a été mis à jour.`);
  };

  /* ================== Composant Dropdown pour produits ================== */
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
            {/* Barre de recherche dans le dropdown */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
            
            {/* Liste des produits */}
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
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="font-mono">{product.barcode}</span>
                        {product.category && (
                          <>
                            <span>•</span>
                            <span>{product.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#472EAD]">
                      {product.cartons || 0} cartons
                    </div>
                  </div>
                  {product.price && (
                    <div className="text-xs text-gray-500 mt-1">
                      Prix: {product.price.toLocaleString("fr-FR")} F CFA
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ================== Composant Dropdown pour fournisseurs ================== */
  const FournisseurDropdown = () => (
    <div ref={fournisseurDropdownRef} className="relative">
      <label className="block text-xs font-semibold text-gray-700 mb-2">
        Sélectionner un fournisseur
      </label>
      <div className="relative">
        <div
          className="w-full border rounded-lg px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => setFournisseurDropdownOpen(!fournisseurDropdownOpen)}
        >
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className={formData.source ? "text-gray-900" : "text-gray-400"}>
              {formData.source || "Cliquez pour sélectionner un fournisseur"}
            </span>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
        
        {fournisseurDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
            {/* Barre de recherche dans le dropdown */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un fournisseur..."
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                  value={fournisseurSearch}
                  onChange={(e) => setFournisseurSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            
            {/* Liste des fournisseurs */}
            <div className="overflow-y-auto max-h-48">
              {filteredFournisseurs.map((fournisseur) => (
                <div
                  key={fournisseur.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                    formData.source === fournisseur.nom ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleFournisseurSelect(fournisseur)}
                >
                  <div className="font-medium text-sm">{fournisseur.nom}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-col gap-1">
                    {fournisseur.contact && (
                      <div className="flex items-center gap-1">
                        <span>📞</span>
                        <span>{fournisseur.contact}</span>
                      </div>
                    )}
                    {fournisseur.email && (
                      <div className="flex items-center gap-1">
                        <span>✉️</span>
                        <span>{fournisseur.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="depot-page space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="text-[#472EAD]" />
          Gestion des Mouvements de Stock - Dépôt
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Suivi complet des entrées et sorties. Les sorties vers la boutique sont soumises à validation.
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
            <p className="text-xs text-gray-500">Mouvements Aujourd&apos;hui</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayCount}</p>
            <p className="text-xs text-gray-500 mt-1">opérations enregistrées</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Activity className="text-[#472EAD]" size={20} />
          </div>
        </div>
      </div>

      {/* BOUTONS NOUVEAU MOUVEMENT */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => openModal("Entrée")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium shadow hover:shadow-md"
        >
          <ArrowDownRight size={18} />
          Nouvelle Entrée
        </button>
        <button
          onClick={() => openModal("Sortie")}
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
            onClick={() => setActiveTab("historique")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "historique"
                ? "border-[#472EAD] text-[#472EAD]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Activity size={16} className="inline mr-2" />
            Historique des Mouvements
          </button>
          <button
            onClick={() => setActiveTab("en-attente")}
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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Produit, code-barre, fournisseur..."
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Type</p>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="Tous">Tous les types</option>
                  <option value="Entrée">Entrée</option>
                  <option value="Sortie">Sortie</option>
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Statut</p>
                <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" disabled>
                  <option>À venir (non utilisé)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Date de début</p>
                <div className="relative">
                  <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Date de fin</p>
                <div className="relative">
                  <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
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
                Historique des Mouvements ({filteredMovements.length})
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
                {filteredMovements.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMovement(m)}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          m.type === "Entrée" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {m.type === "Entrée" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        {m.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-800 flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      {m.product}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.barcode}</td>

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
                      <span className={`font-semibold ${m.type === "Entrée" ? "text-green-600" : "text-red-600"}`}>
                        {m.type === "Entrée" ? "+" : "-"}
                        {m.quantity} cartons
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-gray-600">{m.stockBefore}</span>
                        <ArrowRight className="text-gray-400" size={12} />
                        <span className={`font-bold ${m.type === "Entrée" ? "text-green-600" : "text-red-600"}`}>
                          {m.stockAfter}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-xs">{formatDateTime(m.date)}</td>

                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        m.status === "validated" ? "bg-green-100 text-green-800" :
                        m.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {m.status === "validated" ? <CheckCircle size={12} /> : 
                         m.status === "pending" ? <Clock size={12} /> : 
                         <CheckCircle size={12} />}
                        {m.status === "validated" ? "Validée" : 
                         m.status === "pending" ? "En attente" : 
                         "Terminé"}
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

                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-gray-400 text-sm italic">
                      Aucun mouvement ne correspond à ces critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ONGLET SORTIES EN ATTENTE */
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-[#f97316]" />
              Sorties en Attente de Validation ({pendingSorties.length})
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info size={14} />
              <span>Ces sorties attendent la validation par la Boutique Colobane.</span>
            </div>
          </div>

          {pendingSorties.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 mb-4">
                <Clock className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Aucune sortie en attente</h3>
              <p className="text-xs text-gray-500">Toutes les sorties ont été validées par la boutique.</p>
            </div>
          ) : (
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
                {pendingSorties.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800 flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      {s.product}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.barcode}</td>

                    <td className="px-4 py-3 text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Store size={12} className="text-blue-400" />
                        <div>
                          <div className="text-blue-600 font-medium">{s.source}</div>
                          <div className="text-gray-500 text-xs">En attente de validation...</div>
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
                        <span className="font-bold text-red-600">{s.stockAfter}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-xs">{formatDateTime(s.createdAt)}</td>

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

                        {/* Bouton de test pour simuler la validation */}
                        <button
                          onClick={() => simulateBoutiqueValidation(s.id)}
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline border border-green-200 px-2 py-1 rounded"
                          title="Simuler la validation par la boutique (test seulement)"
                        >
                          <CheckCircle size={14} />
                          Simuler validation
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODALE NOUVEAU MOUVEMENT - AVEC DROPDOWNS AMÉLIORÉS */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-0 overflow-hidden">
            {/* Header de la modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {formData.type === "Entrée" ? "Nouvelle entrée de stock" : "Nouvelle sortie de stock"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.type === "Entrée" 
                    ? "Ajouter des produits au stock du dépôt" 
                    : "Transférer des produits vers la Boutique Colobane"}
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Contenu de la modal */}
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
                {/* Type de mouvement (affichage seulement) */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.type === "Entrée" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {formData.type === "Entrée" 
                        ? <ArrowDownRight className="text-green-600" size={20} />
                        : <ArrowUpRight className="text-red-600" size={20} />
                      }
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {formData.type === "Entrée" ? "Entrée de stock" : "Sortie de stock"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formData.type === "Entrée" 
                          ? "Produits entrants dans le dépôt"
                          : "Produits sortants vers la Boutique Colobane"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section : Source/Destination */}
                <div className="space-y-4">
                  <div className="border-l-4 border-[#472EAD] pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {formData.type === "Entrée" ? "Fournisseur" : "Destination"}
                    </h4>
                  </div>
                  
                  {formData.type === "Entrée" ? (
                    <FournisseurDropdown />
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Destination
                      </label>
                      <div className="w-full border bg-blue-50 rounded-lg px-3 py-2.5 text-sm flex items-center gap-2">
                        <Store className="text-blue-500" size={16} />
                        <span className="font-medium text-blue-700">Boutique Colobane</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Toutes les sorties du dépôt sont destinées à la Boutique Colobane
                      </p>
                    </div>
                  )}
                </div>

                {/* Section : Sélection du produit */}
                <div className="space-y-4">
                  <div className="border-l-4 border-amber-500 pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Sélection du produit</h4>
                  </div>
                  
                  <ProductDropdown />

                  {formData.productId && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Code-barre</p>
                        <p className="text-sm font-mono font-medium">{formData.barcode || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock actuel</p>
                        <p className="text-sm font-medium">{formData.stockBefore || "0"} cartons</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section : Quantité */}
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Quantité</h4>
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
                        required
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: 5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                        cartons
                      </span>
                    </div>
                    {formData.type === "Sortie" && formData.stockBefore && (
                      <p className="text-xs text-gray-500 mt-1">
                        Disponible: <span className="font-bold">{formData.stockBefore}</span> cartons
                      </p>
                    )}
                  </div>
                </div>

                {/* Section : Impact sur le stock */}
                {formData.productId && (
                  <div className="space-y-4">
                    <div className="border-l-4 border-cyan-500 pl-4 py-1">
                      <h4 className="font-medium text-gray-900 text-sm">Impact sur le stock</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Stock avant</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">{formData.stockBefore || "0"}</p>
                          <Package size={16} className="text-gray-400" />
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        formData.type === "Entrée" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        <p className="text-xs text-gray-500 mb-1">Stock après</p>
                        <div className="flex items-center justify-between">
                          <p className={`text-lg font-bold ${
                            formData.type === "Entrée" ? "text-green-700" : "text-red-700"
                          }`}>
                            {formData.stockAfter || "0"}
                          </p>
                          {formData.type === "Entrée" 
                            ? <ArrowDownRight className="text-green-600" size={16} />
                            : <ArrowUpRight className="text-red-600" size={16} />
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section : Date */}
                <div className="space-y-4">
                  <div className="border-l-4 border-indigo-500 pl-4 py-1">
                    <h4 className="font-medium text-gray-900 text-sm">Date du mouvement</h4>
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

                {/* Zone des boutons */}
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
                      className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                        formData.type === "Entrée" 
                          ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                          : "bg-gradient-to-r from-[#472EAD] to-[#f97316] hover:from-[#3b2491] hover:to-[#ea580c]"
                      }`}
                    >
                      <Save size={16} />
                      {formData.type === "Entrée" 
                        ? "Enregistrer l'entrée" 
                        : "Envoyer à la boutique"
                      }
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DETAILS */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="text-[#472EAD]" />
                Détails du mouvement
              </h3>
              <button onClick={() => setSelectedMovement(null)} className="text-xl text-gray-500 hover:text-gray-800">×</button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type :</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedMovement.type === "Entrée" 
                    ? "bg-green-50 text-green-700" 
                    : "bg-red-50 text-red-700"
                }`}>
                  {selectedMovement.type}
                </span>
                {selectedMovement.status && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedMovement.status === "validated" ? "bg-green-100 text-green-800" :
                    selectedMovement.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedMovement.status === "validated" ? "Validée" : 
                     selectedMovement.status === "pending" ? "En attente" : 
                     "Terminé"}
                  </span>
                )}
              </div>
              
              <p><span className="font-semibold">Produit :</span> {selectedMovement.product}</p>
              <p><span className="font-semibold">Code-barre :</span> <span className="font-mono">{selectedMovement.barcode}</span></p>
              
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
                <span className={selectedMovement.type === "Entrée" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {selectedMovement.type === "Entrée" ? "+" : "-"}{selectedMovement.quantity} cartons
                </span>
              </p>
              <p>
                <span className="font-semibold">Stock :</span>{" "}
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">{selectedMovement.stockBefore}</span>
                  <ArrowRight className="text-gray-400" size={12} />
                  <span className={selectedMovement.type === "Entrée" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {selectedMovement.stockAfter}
                  </span>
                </span>
              </p>
              <p><span className="font-semibold">Date :</span> {formatDateTime(selectedMovement.date)}</p>
              
              {selectedMovement.validatedAt && (
                <p><span className="font-semibold">Validé le :</span> {formatDateTime(selectedMovement.validatedAt)}</p>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setSelectedMovement(null)} className="px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3b2491]">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ANNULATION SORTIE EN ATTENTE */}
      {cancelPendingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900">Annuler cette sortie en attente ?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Cette sortie n'a pas encore été validée par la boutique. Annuler la supprimera définitivement.
            </p>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setCancelPendingId(null)} className="px-4 py-2 text-sm border rounded-lg">Non, garder</button>
              <button onClick={() => cancelPendingSortie(cancelPendingId)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant ArrowRight pour compléter les imports
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
// src/gestionnaire-depot/pages/Products.jsx
// 👇 AJOUTE CET IMPORT ICI 👇

// (Vérifie bien que le chemin vers ton fichier 'services' est correct)
import React, { useEffect, useState } from "react";
import "../styles/depot-fix.css";
import {
  FaSearch,
  FaPlus,
  FaBoxOpen,
  FaBarcode,
  FaTags,
  FaBoxes,
  FaCubes,
  FaMoneyBillWave,
  FaCoins,
  FaBalanceScale,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowDown,
  FaFire,
  FaTimesCircle,
  FaEdit,
  FaTrashAlt,
  FaArrowUp,
  FaClock,
  FaUserTie,
  FaRegStickyNote,
  FaList,
  FaSlidersH,
  FaHistory,
  FaWarehouse,
  FaSortAlphaDown,
  FaTools,
  FaCheck,
  FaFolder,
  FaFolderPlus,
  FaFilter,
  FaSortAmountDown,
  FaChevronDown,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

/* =========================================================================
   1) DONNÉES DE BASE + LOCALSTORAGE - VERSION CORRIGÉE
   ========================================================================= */

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Cahier 96 pages",
    category: "Papeterie",
    cartons: 10,
    unitsPerCarton: 45,
    barcode: "594123456789",
    pricePerCarton: 800,
    stockMin: 20,
  },
  {
    id: 2,
    name: "Classeur A4",
    category: "Papeterie",
    cartons: 5,
    unitsPerCarton: 10,
    barcode: "594555555555",
    pricePerCarton: 1500,
    stockMin: 20,
  },
  {
    id: 3,
    name: "Crayon HB",
    category: "Fournitures",
    cartons: 10,
    unitsPerCarton: 8,
    barcode: "598333333333",
    pricePerCarton: 400,
    stockMin: 20,
  },
  {
    id: 4,
    name: "Gomme blanche",
    category: "Fournitures",
    cartons: 0,
    unitsPerCarton: 20,
    barcode: "598222222222",
    pricePerCarton: 500,
    stockMin: 20,
  },
];

// Catégories initiales
const INITIAL_CATEGORIES = [
  { id: 1, name: "Papeterie", description: "Articles de papeterie", productCount: 2 },
  { id: 2, name: "Fournitures", description: "Fournitures de bureau", productCount: 2 },
  { id: 3, name: "Informatique", description: "Matériel informatique", productCount: 0 },
  { id: 4, name: "Mobilier", description: "Mobilier de bureau", productCount: 0 },
  { id: 5, name: "Nettoyage", description: "Produits d'entretien", productCount: 0 },
];

const STORAGE_KEY_PRODUCTS = "lpd_products";
const STORAGE_KEY_HISTORY = "lpd_products_history";
const STORAGE_KEY_CATEGORIES = "lpd_categories";

// Fonctions de chargement CORRIGÉES - Ne réinitialisent JAMAIS si des données existent
const loadProducts = () => {
  const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  
  // Si aucune donnée n'existe, retourner les données initiales
  if (!raw) {
    return INITIAL_PRODUCTS;
  }
  
  try {
    const parsed = JSON.parse(raw);
    
    // Vérifier que c'est un tableau non vide
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    } else {
      return INITIAL_PRODUCTS;
    }
  } catch (error) {
    return INITIAL_PRODUCTS;
  }
};

const saveProducts = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(list));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des produits:", error);
  }
};

const loadHistory = () => {
  const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveHistory = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'historique:", error);
  }
};

const loadCategories = () => {
  const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
  
  // Si aucune donnée n'existe, retourner les données initiales
  if (!raw) {
    return INITIAL_CATEGORIES;
  }
  
  try {
    const parsed = JSON.parse(raw);
    
    // Vérifier que c'est un tableau non vide
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    } else {
      return INITIAL_CATEGORIES;
    }
  } catch (error) {
    return INITIAL_CATEGORIES;
  }
};

const saveCategories = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(list));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des catégories:", error);
  }
};

/* =========================================================================
   2) CALCULS GÉNÉRAUX (STOCK, STATUTS, ETC.)
   ========================================================================= */

const computeTotalPrice = (p) => p.cartons * p.pricePerCarton;

const getStatus = (cartons, stockMin) => {
  if (cartons === 0) {
    return { label: "Rupture", className: "bg-gray-200 text-gray-700" };
  }

  if (cartons < 10 || cartons < stockMin * 0.3) {
    return { label: "Critique", className: "bg-red-100 text-red-700" };
  }

  if (cartons <= stockMin) {
    return { label: "Faible", className: "bg-yellow-100 text-yellow-700" };
  }

  return { label: "Normal", className: "bg-green-100 text-green-700" };
};

const StatusBadge = ({ status }) => {
  const { label, className } = status;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {label === "Normal" && <FaCheckCircle className="text-green-700" />}
      {label === "Faible" && <FaArrowDown className="text-yellow-600" />}
      {label === "Critique" && <FaFire className="text-red-600" />}
      {label === "Rupture" && <FaTimesCircle className="text-gray-600" />}
      <span>{label}</span>
    </span>
  );
};

const getTypeIcon = (type) => {
  const baseClass = "text-sm";
  switch (type) {
    case "Création":
      return <FaPlus className={`${baseClass} text-green-600`} />;
    case "Modification":
      return <FaEdit className={`${baseClass} text-blue-600`} />;
    case "Suppression":
      return <FaTrashAlt className={`${baseClass} text-red-600`} />;
    case "Réapprovisionnement":
      return <FaArrowUp className={`${baseClass} text-green-600`} />;
    case "Diminution":
      return <FaArrowDown className={`${baseClass} text-orange-500`} />;
    default:
      return <FaHistory className={`${baseClass} text-gray-500`} />;
  }
};

/* =========================================================================
   3) COMPOSANT PRINCIPAL
   ========================================================================= */

export default function Products() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState("liste"); // "liste" | "ajustement" | "historique" | "categories"

  // Liste des produits
  const [searchProducts, setSearchProducts] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortMode, setSortMode] = useState("name-asc");

  // Formulaire produit
  const [modalType, setModalType] = useState(null); // "add" | "edit" | null
  const [currentProduct, setCurrentProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Ajustement de stock
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAction, setAdjustAction] = useState(null); // "reappro" | "diminue"
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // Historique
  const [historySearch, setHistorySearch] = useState("");

  // Gestion des catégories
  const [categoryModal, setCategoryModal] = useState(null); // "add" | "edit" | null
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [categorySearchText, setCategorySearchText] = useState("");

  /* ==================== PAGINATION ==================== */
  const [pageSize, setPageSize] = useState(10);
  
  // Pagination pour l'onglet Liste des Produits
  const [productsPage, setProductsPage] = useState(1);
  
  // Pagination pour l'onglet Ajustement (tous les produits)
  const [adjustmentPage, setAdjustmentPage] = useState(1);
  
  // Pagination pour l'onglet Historique
  const [historyPage, setHistoryPage] = useState(1);
  
  // Pagination pour l'onglet Catégories
  const [categoriesPage, setCategoriesPage] = useState(1);

  /* ------------------ Chargement des données - CORRIGÉ ------------------ */
  useEffect(() => {
    // Charger les données depuis localStorage
    const loadedProducts = loadProducts();
    const loadedCategories = loadCategories();
    const loadedHistory = loadHistory();
    
    // Mettre à jour l'état
    setProducts(loadedProducts);
    setCategories(loadedCategories);
    setHistory(loadedHistory);
    
    // Marquer comme chargé
    setIsDataLoaded(true);
  }, []);

  /* ------------------ Sauvegarde automatique ------------------ */
  useEffect(() => {
    if (isDataLoaded) {
      saveProducts(products);
    }
  }, [products, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      saveHistory(history);
    }
  }, [history, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      saveCategories(categories);
    }
  }, [categories, isDataLoaded]);

  /* ------------------ Mise à jour du compteur de produits par catégorie ------------------ */
  useEffect(() => {
    if (isDataLoaded && products.length > 0) {
      const updatedCategories = categories.map(cat => {
        const productCount = products.filter(p => p.category === cat.name).length;
        return { ...cat, productCount };
      });
      setCategories(updatedCategories);
    }
  }, [products, isDataLoaded]);

  /* ------------------ Enrichissement produits ------------------ */

  const computedProducts = products.map((p) => {
    const totalPrice = computeTotalPrice(p);
    const status = getStatus(p.cartons, p.stockMin);
    return { ...p, totalPrice, status };
  });

  const totalValue = computedProducts.reduce(
    (sum, p) => sum + p.totalPrice,
    0
  );
  const nbFaible = computedProducts.filter(
    (p) => p.status.label === "Faible"
  ).length;
  const nbCritique = computedProducts.filter(
    (p) => p.status.label === "Critique"
  ).length;
  const nbRupture = computedProducts.filter(
    (p) => p.status.label === "Rupture"
  ).length;

  /* =========================================================================
     4) GESTION HISTORIQUE
     ========================================================================= */

  const addHistoryEntry = ({
    product,
    type,
    quantity,
    before,
    after,
    reason,
  }) => {
    const entry = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      before,
      after,
      date: new Date().toLocaleString("fr-FR"),
      reason: reason || "",
      manager: "Modou Ndiaye",
    };

    setHistory((prev) => [entry, ...prev]);
  };

  /* =========================================================================
     5) GESTION DES CATÉGORIES
     ========================================================================= */

  const openAddCategoryModal = () => {
    setCategoryModal("add");
    setCurrentCategory({
      id: null,
      name: "",
      description: "",
      productCount: 0,
    });
  };

  const openEditCategoryModal = (category) => {
    setCategoryModal("edit");
    setCurrentCategory({ ...category });
  };

  const closeCategoryModal = () => {
    setCategoryModal(null);
    setCurrentCategory(null);
  };

  const handleCategoryFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCategory = (e) => {
    e.preventDefault();
    if (!currentCategory) return;

    const { name } = currentCategory;

    if (!name.trim()) {
      alert("Le nom de la catégorie est obligatoire.");
      return;
    }

    // Vérifier si le nom existe déjà (en ignorant la casse)
    const nameExists = categories.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== currentCategory.id
    );

    if (nameExists) {
      alert("Une catégorie avec ce nom existe déjà.");
      return;
    }

    if (categoryModal === "add") {
      const newCategory = {
        ...currentCategory,
        id: Date.now(),
        productCount: 0,
      };
      setCategories((prev) => [...prev, newCategory]);
    } else if (categoryModal === "edit") {
      // Mettre à jour les produits qui utilisent l'ancien nom de catégorie
      const oldCategory = categories.find(c => c.id === currentCategory.id);
      if (oldCategory && oldCategory.name !== currentCategory.name) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.category === oldCategory.name ? { ...p, category: currentCategory.name } : p
          )
        );
      }

      setCategories((prev) =>
        prev.map((cat) => (cat.id === currentCategory.id ? currentCategory : cat))
      );
    }

    closeCategoryModal();
  };

  const handleConfirmDeleteCategory = () => {
    const category = categories.find((c) => c.id === deleteCategoryId);
    
    if (!category) {
      setDeleteCategoryId(null);
      return;
    }

    // Vérifier si la catégorie est utilisée par des produits
    const isUsed = products.some(p => p.category === category.name);
    
    if (isUsed) {
      alert(`Impossible de supprimer la catégorie "${category.name}" car elle est utilisée par des produits. Veuillez d'abord modifier les produits utilisant cette catégorie.`);
      setDeleteCategoryId(null);
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryId));
    setDeleteCategoryId(null);
  };

  /* =========================================================================
     6) ONGLET 1 : LISTE DES PRODUITS
     ========================================================================= */

  const filteredProducts = computedProducts
    .filter((p) => {
      const term = searchProducts.trim().toLowerCase();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "Tous" || p.status.label === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortMode === "name-asc")
        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      if (sortMode === "name-desc")
        return b.name.localeCompare(a.name, "fr", { sensitivity: "base" });
      return 0;
    });

  // Calculs de pagination pour les produits
  const totalProductsPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentProductsPage = Math.min(productsPage, totalProductsPages);
  const startProductsIndex = (currentProductsPage - 1) * pageSize;
  const endProductsIndex = startProductsIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startProductsIndex, endProductsIndex);

  const openAddModal = () => {
    setModalType("add");
    setCurrentProduct({
      id: null,
      name: "",
      category: "",
      cartons: "",
      unitsPerCarton: "",
      barcode: "",
      pricePerCarton: "",
      stockMin: "",
    });
    setCategorySearchText(""); // Réinitialiser la recherche de catégorie
  };

  const openEditModal = (product) => {
    setModalType("edit");
    setCurrentProduct({ ...product });
    setCategorySearchText(""); // Réinitialiser la recherche
  };

  const closeProductModal = () => {
    setModalType(null);
    setCurrentProduct(null);
    setCategorySearchText("");
  };

  const handleProductFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    const parsed = {
      ...currentProduct,
      cartons: Number(currentProduct.cartons || 0),
      unitsPerCarton: Number(currentProduct.unitsPerCarton || 0),
      pricePerCarton: Number(currentProduct.pricePerCarton || 0),
      stockMin: Number(currentProduct.stockMin || 0),
    };

    if (!parsed.name || !parsed.category) {
      alert("Nom et catégorie sont obligatoires.");
      return;
    }

    // Vérifier que la catégorie existe
    const categoryExists = categories.some(cat => cat.name === parsed.category);
    if (!categoryExists) {
      const createCategory = window.confirm(
        `La catégorie "${parsed.category}" n'existe pas. Voulez-vous la créer ?`
      );
      
      if (createCategory) {
        const newCategory = {
          id: Date.now(),
          name: parsed.category,
          description: `Catégorie créée automatiquement pour le produit ${parsed.name}`,
          productCount: 1,
        };
        setCategories((prev) => [...prev, newCategory]);
      } else {
        return;
      }
    }

    // 🔒 Contrôle unicité code-barres
    if (parsed.barcode && parsed.barcode.trim() !== "") {
      const barcodeExists = products.some(
        (p) =>
          p.barcode &&
          p.barcode.trim() !== "" &&
          p.barcode === parsed.barcode &&
          p.id !== parsed.id
      );
      if (barcodeExists) {
        alert("Ce code-barres existe déjà pour un autre produit.");
        return;
      }
    }

    if (modalType === "add") {
      const withId = { ...parsed, id: Date.now() };
      setProducts((prev) => [...prev, withId]);
      addHistoryEntry({
        product: withId,
        type: "Création",
        quantity: 0,
        before: 0,
        after: withId.cartons,
        reason: "Création du produit",
      });
    } else if (modalType === "edit") {
      setProducts((prev) =>
        prev.map((p) => (p.id === parsed.id ? parsed : p))
      );
      addHistoryEntry({
        product: parsed,
        type: "Modification",
        quantity: 0,
        before: null,
        after: parsed.cartons,
        reason: "Modification des informations du produit",
      });
    }

    closeProductModal();
  };

  const handleConfirmDeleteProduct = () => {
    const product = products.find((p) => p.id === deleteId);
    if (product) {
      addHistoryEntry({
        product,
        type: "Suppression",
        quantity: 0,
        before: product.cartons,
        after: 0,
        reason: "Suppression du produit",
      });
    }
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  /* =========================================================================
     7) ONGLET 2 : AJUSTEMENT DE STOCK (KANBAN/TRELLO)
     ========================================================================= */

  const alertProducts = computedProducts.filter((p) =>
    ["Rupture", "Critique", "Faible"].includes(p.status.label)
  );

  const termAdjust = searchProducts.trim().toLowerCase();

  const alertFiltered = alertProducts.filter((p) => {
    if (!termAdjust) return true;
    return (
      p.name.toLowerCase().includes(termAdjust) ||
      p.barcode.toLowerCase().includes(termAdjust) ||
      p.category.toLowerCase().includes(termAdjust)
    );
  });

  const allAdjustFiltered = computedProducts.filter((p) => {
    if (!termAdjust) return true;
    return (
      p.name.toLowerCase().includes(termAdjust) ||
      p.barcode.toLowerCase().includes(termAdjust) ||
      p.category.toLowerCase().includes(termAdjust)
    );
  });

  // Pagination pour l'ajustement
  const totalAdjustmentPages = Math.max(1, Math.ceil(allAdjustFiltered.length / pageSize));
  const currentAdjustmentPage = Math.min(adjustmentPage, totalAdjustmentPages);
  const startAdjustmentIndex = (currentAdjustmentPage - 1) * pageSize;
  const endAdjustmentIndex = startAdjustmentIndex + pageSize;
  const paginatedAdjustment = allAdjustFiltered.slice(startAdjustmentIndex, endAdjustmentIndex);

  const openAdjust = (product, action) => {
    setAdjustProduct(product);
    setAdjustAction(action); // "reappro" | "diminue"
    setAdjustQuantity("");
    setAdjustReason("");
    setAdjustModalOpen(true);
  };

  const closeAdjustModal = () => {
    setAdjustModalOpen(false);
    setAdjustProduct(null);
    setAdjustAction(null);
    setAdjustQuantity("");
    setAdjustReason("");
  };

  const handleSubmitAdjust = (e) => {
    e.preventDefault();
    if (!adjustProduct || !adjustAction) return;

    const qty = Number(adjustQuantity);
    if (!qty || qty <= 0) {
      alert("Quantité invalide.");
      return;
    }

    const product = products.find((p) => p.id === adjustProduct.id);
    if (!product) return;

    // 🔒 Contrôle : ne pas diminuer plus que le stock
    if (adjustAction === "diminue" && qty > product.cartons) {
      alert(
        `Impossible de diminuer de ${qty} cartons. Stock disponible : ${product.cartons}.`
      );
      return;
    }

    const before = product.cartons;
    let after = before;

    if (adjustAction === "reappro") {
      after = before + qty;
    } else if (adjustAction === "diminue") {
      after = Math.max(0, before - qty);
    }

    const updated = { ...product, cartons: after };

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? updated : p))
    );

    addHistoryEntry({
      product: updated,
      type: adjustAction === "reappro" ? "Réapprovisionnement" : "Diminution",
      quantity: qty,
      before,
      after,
      reason: adjustReason,
    });

    closeAdjustModal();
  };

  const ruptureList = alertFiltered.filter(
    (p) => p.status.label === "Rupture"
  );
  const critiqueList = alertFiltered.filter(
    (p) => p.status.label === "Critique"
  );
  const faibleList = alertFiltered.filter((p) => p.status.label === "Faible");

  /* =========================================================================
     8) ONGLET 3 : HISTORIQUE
     ========================================================================= */

  const filteredHistory = history.filter((h) => {
    const term = historySearch.trim().toLowerCase();
    if (!term) return true;

    return (
      h.productName.toLowerCase().includes(term) ||
      h.type.toLowerCase().includes(term) ||
      h.manager.toLowerCase().includes(term) ||
      (h.reason || "").toLowerCase().includes(term) ||
      h.date.toLowerCase().includes(term)
    );
  });

  // Pagination pour l'historique
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const startHistoryIndex = (currentHistoryPage - 1) * pageSize;
  const endHistoryIndex = startHistoryIndex + pageSize;
  const paginatedHistory = filteredHistory.slice(startHistoryIndex, endHistoryIndex);

  /* =========================================================================
     9) ONGLET 4 : GESTION DES CATÉGORIES
     ========================================================================= */

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchCategory.toLowerCase()))
  );

  // Pagination pour les catégories
  const totalCategoriesPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const currentCategoriesPage = Math.min(categoriesPage, totalCategoriesPages);
  const startCategoriesIndex = (currentCategoriesPage - 1) * pageSize;
  const endCategoriesIndex = startCategoriesIndex + pageSize;
  const paginatedCategories = filteredCategories.slice(startCategoriesIndex, endCategoriesIndex);

  /* =========================================================================
     10) FONCTIONS UTILES DE PAGINATION
     ========================================================================= */

  // Fonction générique pour le composant de pagination
  const Pagination = ({ currentPage, totalPages, onPageChange, itemsCount, filteredCount, pageSize }) => {
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
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          pages.push(currentPage - 1);
          pages.push(currentPage);
          pages.push(currentPage + 1);
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Affichage de <span className="font-semibold">{startItem}</span> à <span className="font-semibold">{endItem}</span> sur <span className="font-semibold">{filteredCount}</span> éléments
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Première page"
          >
            <FaAngleDoubleLeft className="text-sm" />
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Page précédente"
          >
            <FaAngleLeft className="text-sm" />
          </button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded border flex items-center justify-center text-sm ${
                    currentPage === page
                      ? 'bg-[#472EAD] text-white border-[#472EAD]'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Page suivante"
          >
            <FaAngleRight className="text-sm" />
          </button>
          
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Dernière page"
          >
            <FaAngleDoubleRight className="text-sm" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Éléments par page :</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              // Réinitialiser à la page 1 quand on change la taille
              if (activeTab === "liste") setProductsPage(1);
              if (activeTab === "ajustement") setAdjustmentPage(1);
              if (activeTab === "historique") setHistoryPage(1);
              if (activeTab === "categories") setCategoriesPage(1);
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

  /* =========================================================================
     11) RENDER
     ========================================================================= */

  return (
    <div className="depot-page space-y-6">
      {/* HEADER + ONGLETS */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-[#472EAD] flex items-center gap-2">
          <FaWarehouse className="text-[#472EAD]" />
          Gestion Avancée des Produits
        </h1>

        {activeTab === "liste" && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white px-4 py-2 rounded-lg shadow hover:shadow-md transition"
          >
            <FaPlus />
            Nouveau Produit
          </button>
        )}

        {activeTab === "categories" && (
          <button
            onClick={openAddCategoryModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white px-4 py-2 rounded-lg shadow hover:shadow-md transition"
          >
            <FaFolderPlus />
            Nouvelle Catégorie
          </button>
        )}
      </div>

      <div className="flex items-center gap-6 border-b pb-2 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("liste");
            setProductsPage(1); // Réinitialiser à la page 1
          }}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "liste"
              ? "text-[#472EAD] border-b-2 border-[#472EAD]"
              : "text-gray-500 hover:text-[#472EAD]"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <FaList />
            <span>Liste des Produits</span>
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("ajustement");
            setAdjustmentPage(1); // Réinitialiser à la page 1
          }}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "ajustement"
              ? "text-[#472EAD] border-b-2 border-[#472EAD]"
              : "text-gray-500 hover:text-[#472EAD]"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <FaSlidersH />
            <span>Ajustement de Stock</span>
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("historique");
            setHistoryPage(1); // Réinitialiser à la page 1
          }}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "historique"
              ? "text-[#472EAD] border-b-2 border-[#472EAD]"
              : "text-gray-500 hover:text-[#472EAD]"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <FaHistory />
            <span>Historique des Produits</span>
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("categories");
            setCategoriesPage(1); // Réinitialiser à la page 1
          }}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "categories"
              ? "text-[#472EAD] border-b-2 border-[#472EAD]"
              : "text-gray-500 hover:text-[#472EAD]"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <FaFolder />
            <span>Gestion des Catégories</span>
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------
          ONGLET 1 : LISTE DES PRODUITS
          ------------------------------------------------------------------ */}
      {activeTab === "liste" && (
        <>
          {/* Recherche */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
            <FaSearch className="text-[#472EAD]" />
            <input
              type="text"
              placeholder="Nom, code-barre ou catégorie..."
              className="flex-1 text-sm outline-none"
              value={searchProducts}
              onChange={(e) => {
                setSearchProducts(e.target.value);
                setProductsPage(1); // Réinitialiser à la page 1 quand on recherche
              }}
            />
          </div>

          {/* Filtres */}
          <div className="flex justify-between items-center gap-3 text-sm">
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setProductsPage(1); // Réinitialiser à la page 1 quand on change le filtre
                }}
                className="border rounded px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
              >
                <option value="Tous">Tous</option>
                <option value="Normal">Normal</option>
                <option value="Faible">Faible</option>
                <option value="Critique">Critique</option>
                <option value="Rupture">Rupture</option>
              </select>

              <div className="flex items-center border rounded px-3 py-2 bg-white shadow-sm gap-2">
                <FaSortAlphaDown className="text-[#472EAD]" />
                <select
                  value={sortMode}
                  onChange={(e) => {
                    setSortMode(e.target.value);
                    setProductsPage(1); // Réinitialiser à la page 1 quand on change le tri
                  }}
                  className="outline-none text-sm bg-transparent"
                >
                  <option value="name-asc">Nom (A-Z)</option>
                  <option value="name-desc">Nom (Z-A)</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {filteredProducts.length} produit(s) trouvé(s)
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaCoins className="text-[#472EAD]" />
                <span>Valeur Stock</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-[#472EAD]">
                {totalValue.toLocaleString("fr-FR")} F
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaExclamationTriangle className="text-[#F58020]" />
                <span>Stock Faible</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-[#F58020]">
                {nbFaible}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaFire className="text-red-500" />
                <span>Stock Critique</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-red-600">
                {nbCritique}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaTimesCircle className="text-gray-500" />
                <span>En Rupture</span>
              </p>
              <p className="text-2xl font-semibold mt-2">{nbRupture}</p>
            </div>
          </div>

          {/* Tableau produits */}
          <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F5FF] border-b text-gray-600">
                <tr>
                  <th className="p-3 text-left">
                    <div className="flex items-center gap-1">
                      <FaBoxOpen className="text-[#472EAD]" />
                      <span>Produit</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaBarcode className="text-[#472EAD]" />
                      <span>Code-barre</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaTags className="text-[#472EAD]" />
                      <span>Catégorie</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaBoxes className="text-[#472EAD]" />
                      <span>Cartons</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaCubes className="text-[#472EAD]" />
                      <span>Unités/Carton</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaMoneyBillWave className="text-[#472EAD]" />
                      <span>Prix/Carton</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaCoins className="text-[#472EAD]" />
                      <span>Prix Total</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaBalanceScale className="text-[#472EAD]" />
                      <span>Stock Min.</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaExclamationTriangle className="text-[#472EAD]" />
                      <span>Statut</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaTools className="text-[#472EAD]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedProducts.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-[#F7F5FF] transition-colors">
                    <td className="p-3 font-medium text-[#472EAD]">{p.name}</td>
                    <td className="p-3 text-center">{p.barcode}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <FaTags className="text-[#472EAD] text-xs" />
                        <span>{p.category}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold">{p.cartons}</td>
                    <td className="p-3 text-center">{p.unitsPerCarton}</td>
                    <td className="p-3 text-center font-medium text-[#472EAD]">
                      {p.pricePerCarton.toLocaleString("fr-FR")} F
                    </td>
                    <td className="p-3 text-center font-bold text-[#472EAD]">
                      {p.totalPrice.toLocaleString("fr-FR")} F
                    </td>
                    <td className="p-3 text-center text-[#F58020] font-semibold">{p.stockMin}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 text-[#472EAD] hover:text-[#3a2590] hover:underline text-xs"
                        >
                          <FaEdit />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="inline-flex items-center gap-1 text-[#F58020] hover:text-red-600 hover:underline text-xs"
                        >
                          <FaTrashAlt />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-4 text-center text-gray-400 italic"
                    >
                      {filteredProducts.length === 0 
                        ? "Aucun produit trouvé avec les filtres actuels." 
                        : "Aucun produit sur cette page."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination pour les produits */}
          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={currentProductsPage}
              totalPages={totalProductsPages}
              onPageChange={setProductsPage}
              itemsCount={filteredProducts.length}
              filteredCount={filteredProducts.length}
              pageSize={pageSize}
            />
          )}
        </>
      )}

      {/* ------------------------------------------------------------------
          ONGLET 2 : AJUSTEMENT DE STOCK (KANBAN + TABLEAU)
          ------------------------------------------------------------------ */}
      {activeTab === "ajustement" && (
        <>
          {/* Recherche ajustement */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
            <FaSearch className="text-[#472EAD]" />
            <input
              type="text"
              placeholder="Rechercher un produit (alerte / tous les produits)..."
              className="flex-1 text-sm outline-none"
              value={searchProducts}
              onChange={(e) => {
                setSearchProducts(e.target.value);
                setAdjustmentPage(1); // Réinitialiser à la page 1 quand on recherche
              }}
            />
          </div>

          {/* Vue Kanban Trello */}
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-[#472EAD] mb-2 flex items-center gap-2">
              <FaExclamationTriangle className="text-[#F58020]" />
              <span>Produits en alerte (Rupture, Critique, Faible)</span>
              <span className="text-xs text-gray-500 ml-auto">
                {alertFiltered.length} produit(s) en alerte
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rupture */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaTimesCircle className="text-gray-600" />
                    <h3 className="text-xs font-semibold uppercase text-gray-700">
                      Rupture
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {ruptureList.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {ruptureList.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/80 rounded-xl border border-gray-200 shadow-sm px-3 py-2 text-xs flex flex-col gap-1 hover:shadow-md hover:-translate-y-0.5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#472EAD] flex items-center gap-1">
                            <FaBoxOpen />
                            <span>{p.name}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <FaTags />
                            <span>{p.category}</span>
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <FaBarcode />
                          <span>{p.barcode || "-"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FaBoxes />
                          <span>{p.cartons} cartons</span>
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => openAdjust(p, "reappro")}
                          className="px-3 py-1 rounded-lg text-[11px] bg-[#472EAD] text-white hover:bg-[#3a2590] inline-flex items-center gap-1"
                        >
                          <FaArrowUp />
                          <span>Réapprovisionner</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {ruptureList.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      Aucune rupture.
                    </p>
                  )}
                </div>
              </div>

              {/* Critique */}
              <div className="bg-gradient-to-b from-red-50 to-white rounded-2xl border border-red-100 shadow-sm p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaFire className="text-red-600" />
                    <h3 className="text-xs font-semibold uppercase text-red-700">
                      Critique
                    </h3>
                  </div>
                  <span className="text-xs text-red-500">
                    {critiqueList.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {critiqueList.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/80 rounded-xl border border-red-100 shadow-sm px-3 py-2 text-xs flex flex-col gap-1 hover:shadow-md hover:-translate-y-0.5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#472EAD] flex items-center gap-1">
                            <FaBoxOpen />
                            <span>{p.name}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <FaTags />
                            <span>{p.category}</span>
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <FaBarcode />
                          <span>{p.barcode || "-"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FaBoxes />
                          <span>{p.cartons} cartons</span>
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => openAdjust(p, "reappro")}
                          className="px-3 py-1 rounded-lg text-[11px] bg-[#472EAD] text-white hover:bg-[#3a2590] inline-flex items-center gap-1"
                        >
                          <FaArrowUp />
                          <span>Réapprovisionner</span>
                        </button>
                        <button
                          onClick={() => openAdjust(p, "diminue")}
                          className="px-3 py-1 rounded-lg text-[11px] bg-[#F58020] text-white hover:bg-orange-600 inline-flex items-center gap-1"
                        >
                          <FaArrowDown />
                          <span>Diminuer</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {critiqueList.length === 0 && (
                    <p className="text-xs text-red-400 italic">
                      Aucun stock critique.
                    </p>
                  )}
                </div>
              </div>

              {/* Faible */}
              <div className="bg-gradient-to-b from-yellow-50 to-white rounded-2xl border border-yellow-100 shadow-sm p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaArrowDown className="text-yellow-500" />
                    <h3 className="text-xs font-semibold uppercase text-yellow-700">
                      Faible
                    </h3>
                  </div>
                  <span className="text-xs text-yellow-600">
                    {faibleList.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {faibleList.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/80 rounded-xl border border-yellow-100 shadow-sm px-3 py-2 text-xs flex flex-col gap-1 hover:shadow-md hover:-translate-y-0.5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-[#472EAD] flex items-center gap-1">
                            <FaBoxOpen />
                            <span>{p.name}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <FaTags />
                            <span>{p.category}</span>
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <FaBarcode />
                          <span>{p.barcode || "-"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FaBoxes />
                          <span>{p.cartons} cartons</span>
                        </span>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => openAdjust(p, "reappro")}
                          className="px-3 py-1 rounded-lg text-[11px] bg-[#472EAD] text-white hover:bg-[#3a2590] inline-flex items-center gap-1"
                        >
                          <FaArrowUp />
                          <span>Réapprovisionner</span>
                        </button>
                        <button
                          onClick={() => openAdjust(p, "diminue")}
                          className="px-3 py-1 rounded-lg text-[11px] bg-[#F58020] text-white hover:bg-orange-600 inline-flex items-center gap-1"
                        >
                          <FaArrowDown />
                          <span>Diminuer</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {faibleList.length === 0 && (
                    <p className="text-xs text-yellow-500 italic">
                      Aucun stock faible.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tableau tous les produits */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-[#472EAD] flex items-center gap-2">
                <FaBoxes className="text-[#472EAD]" />
                <span>Tous les produits</span>
              </h2>
              <div className="text-sm text-gray-600">
                {allAdjustFiltered.length} produit(s) trouvé(s)
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F5FF] border-b text-gray-600">
                  <tr>
                    <th className="p-3 text-left">
                      <div className="flex items-center gap-1">
                        <FaBoxOpen className="text-[#472EAD]" />
                        <span>Produit</span>
                      </div>
                    </th>
                    <th className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <FaBarcode className="text-[#472EAD]" />
                        <span>Code-barre</span>
                      </div>
                    </th>
                    <th className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <FaTags className="text-[#472EAD]" />
                        <span>Catégorie</span>
                      </div>
                    </th>
                    <th className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <FaBoxes className="text-[#472EAD]" />
                        <span>Cartons</span>
                      </div>
                    </th>
                    <th className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <FaExclamationTriangle className="text-[#472EAD]" />
                        <span>Statut</span>
                      </div>
                    </th>
                    <th className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <FaTools className="text-[#472EAD]" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAdjustment.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-[#F7F5FF] transition-colors">
                      <td className="p-3 font-medium text-[#472EAD]">{p.name}</td>
                      <td className="p-3 text-center">{p.barcode}</td>
                      <td className="p-3 text-center">{p.category}</td>
                      <td className="p-3 text-center font-semibold">{p.cartons}</td>
                      <td className="p-3 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <button
                            onClick={() => openAdjust(p, "reappro")}
                            className="px-3 py-1 rounded bg-[#472EAD] text-white hover:bg-[#3a2590] inline-flex items-center gap-1"
                          >
                            <FaArrowUp />
                            <span>Réapprovisionner</span>
                          </button>
                          {p.status.label !== "Rupture" && (
                            <button
                              onClick={() => openAdjust(p, "diminue")}
                              className="px-3 py-1 rounded bg-[#F58020] text-white hover:bg-orange-600 inline-flex items-center gap-1"
                            >
                              <FaArrowDown />
                              <span>Diminuer</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedAdjustment.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-4 text-center text-gray-400 italic"
                      >
                        {allAdjustFiltered.length === 0 
                          ? "Aucun produit trouvé avec les filtres actuels." 
                          : "Aucun produit sur cette page."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination pour l'ajustement */}
          {allAdjustFiltered.length > 0 && (
            <Pagination
              currentPage={currentAdjustmentPage}
              totalPages={totalAdjustmentPages}
              onPageChange={setAdjustmentPage}
              itemsCount={allAdjustFiltered.length}
              filteredCount={allAdjustFiltered.length}
              pageSize={pageSize}
            />
          )}
        </>
      )}

      {/* ------------------------------------------------------------------
          ONGLET 3 : HISTORIQUE
          ------------------------------------------------------------------ */}
      {activeTab === "historique" && (
        <>
          {/* Recherche historique */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
            <FaSearch className="text-[#472EAD]" />
            <input
              type="text"
              placeholder="Rechercher par produit, type, motif, gestionnaire, date..."
              className="flex-1 text-sm outline-none"
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setHistoryPage(1); // Réinitialiser à la page 1 quand on recherche
              }}
            />
          </div>

          {/* Statistiques historique */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaHistory className="text-[#472EAD]" />
                <span>Total Historique</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-[#472EAD]">
                {history.length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaPlus className="text-green-600" />
                <span>Créations</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-green-600">
                {history.filter(h => h.type === "Création").length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaArrowUp className="text-green-600" />
                <span>Réapprovisionnements</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-green-600">
                {history.filter(h => h.type === "Réapprovisionnement").length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaArrowDown className="text-orange-500" />
                <span>Diminutions</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-orange-500">
                {history.filter(h => h.type === "Diminution").length}
              </p>
            </div>
          </div>

          {/* Tableau historique */}
          <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F5FF] border-b text-gray-600">
                <tr>
                  <th className="p-3 text-left">
                    <div className="flex items-center gap-1">
                      <FaBoxOpen className="text-[#472EAD]" />
                      <span>Produit</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaSlidersH className="text-[#472EAD]" />
                      <span>Type</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaBoxes className="text-[#472EAD]" />
                      <span>Quantité</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaArrowDown className="text-[#472EAD]" />
                      <span>Avant</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaArrowUp className="text-[#472EAD]" />
                      <span>Après</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaClock className="text-[#472EAD]" />
                      <span>Date</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaRegStickyNote className="text-[#472EAD]" />
                      <span>Motif</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <FaUserTie className="text-[#472EAD]" />
                      <span>Gestionnaire</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((h) => (
                  <tr key={h.id} className="border-t hover:bg-[#F7F5FF] transition-colors">
                    <td className="p-3 font-medium text-[#472EAD]">{h.productName}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 justify-center">
                        {getTypeIcon(h.type)}
                        <span>{h.type}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold">{h.quantity}</td>
                    <td className="p-3 text-center">
                      {h.before !== null && h.before !== undefined
                        ? h.before
                        : "-"}
                    </td>
                    <td className="p-3 text-center font-semibold">{h.after}</td>
                    <td className="p-3 text-center text-gray-600">{h.date}</td>
                    <td className="p-3 text-center">
                      {h.reason || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-3 text-center font-medium text-[#472EAD]">{h.manager}</td>
                  </tr>
                ))}

                {paginatedHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-4 text-center text-gray-400 italic"
                    >
                      {filteredHistory.length === 0 
                        ? "Aucun historique trouvé avec les filtres actuels." 
                        : "Aucun historique sur cette page."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination historique */}
          {filteredHistory.length > 0 && (
            <Pagination
              currentPage={currentHistoryPage}
              totalPages={totalHistoryPages}
              onPageChange={setHistoryPage}
              itemsCount={filteredHistory.length}
              filteredCount={filteredHistory.length}
              pageSize={pageSize}
            />
          )}
        </>
      )}

      {/* ------------------------------------------------------------------
          ONGLET 4 : GESTION DES CATÉGORIES
          ------------------------------------------------------------------ */}
      {activeTab === "categories" && (
        <>
          {/* Recherche catégories */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
            <FaSearch className="text-[#472EAD]" />
            <input
              type="text"
              placeholder="Rechercher une catégorie par nom ou description..."
              className="flex-1 text-sm outline-none"
              value={searchCategory}
              onChange={(e) => {
                setSearchCategory(e.target.value);
                setCategoriesPage(1); // Réinitialiser à la page 1 quand on recherche
              }}
            />
            <FaFilter className="text-[#472EAD]" />
          </div>

          {/* Statistiques catégories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaFolder className="text-[#472EAD]" />
                <span>Total Catégories</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-[#472EAD]">
                {categories.length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaBoxOpen className="text-[#F58020]" />
                <span>Catégories utilisées</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-[#F58020]">
                {categories.filter(c => c.productCount > 0).length}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaSortAmountDown className="text-[#472EAD]" />
                <span>Catégorie la plus utilisée</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-[#472EAD]">
                {categories.length > 0 
                  ? categories.reduce((prev, current) => 
                      (prev.productCount > current.productCount) ? prev : current
                    ).name
                  : "Aucune"}
              </p>
            </div>
          </div>

          {/* Tableau catégories */}
          <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F5FF] border-b text-gray-600">
                <tr>
                  <th className="p-3 text-left">
                    <div className="flex items-center gap-1">
                      <FaFolder className="text-[#472EAD]" />
                      <span>Nom</span>
                    </div>
                  </th>
                  <th className="p-3 text-left">
                    <div className="flex items-center gap-1">
                      <FaRegStickyNote className="text-[#472EAD]" />
                      <span>Description</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <FaBoxOpen className="text-[#472EAD]" />
                      <span>Produits</span>
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
                {paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="border-t hover:bg-[#F7F5FF] transition-colors">
                    <td className="p-3 font-medium text-[#472EAD]">{cat.name}</td>
                    <td className="p-3 text-gray-600">
                      {cat.description || <span className="text-gray-400 italic">Aucune description</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cat.productCount > 0 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {cat.productCount} produit(s)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="inline-flex items-center gap-1 text-[#472EAD] hover:text-[#3a2590] hover:underline text-xs"
                        >
                          <FaEdit />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => setDeleteCategoryId(cat.id)}
                          disabled={cat.productCount > 0}
                          className={`inline-flex items-center gap-1 text-xs ${
                            cat.productCount > 0
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-[#F58020] hover:text-red-600 hover:underline"
                          }`}
                          title={cat.productCount > 0 ? "Impossible de supprimer : catégorie utilisée" : ""}
                        >
                          <FaTrashAlt />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-gray-400 italic"
                    >
                      {filteredCategories.length === 0 
                        ? "Aucune catégorie trouvée avec les filtres actuels." 
                        : "Aucune catégorie sur cette page."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination pour les catégories */}
          {filteredCategories.length > 0 && (
            <Pagination
              currentPage={currentCategoriesPage}
              totalPages={totalCategoriesPages}
              onPageChange={setCategoriesPage}
              itemsCount={filteredCategories.length}
              filteredCount={filteredCategories.length}
              pageSize={pageSize}
            />
          )}

          <div className="mt-4 text-sm text-gray-500">
            <p className="flex items-center gap-2">
              <FaExclamationTriangle className="text-[#F58020]" />
              <span>Astuce : Les catégories ne peuvent être supprimées que si aucun produit ne les utilise.</span>
            </p>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------
          MODALE PRODUIT (AJOUT / MODIF) AVEC SELECT DE CATÉGORIE ET RECHERCHE
          ------------------------------------------------------------------ */}
      {modalType && currentProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaBoxOpen className="text-[#472EAD]" />
              {modalType === "add" ? "Nouveau Produit" : "Modifier le Produit"}
            </h2>

            <form
              onSubmit={handleSubmitProduct}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nom du produit
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentProduct.name}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                  required
                />
              </div>

              {/* CATÉGORIE AVEC SELECT ET RECHERCHE */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <select
                      name="category"
                      value={currentProduct.category}
                      onChange={(e) => {
                        setCurrentProduct(prev => ({ ...prev, category: e.target.value }));
                        setCategorySearchText("");
                      }}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] appearance-none"
                      required
                    >
                      <option value="">-- Sélectionnez une catégorie --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="text-gray-400 pointer-events-none -ml-8" />
                  </div>
                  
                  {/* Barre de recherche pour filtrer la liste déroulante */}
                  <div className="mt-2">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Rechercher une catégorie..."
                        value={categorySearchText}
                        onChange={(e) => setCategorySearchText(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                      />
                    </div>
                    
                    {/* Liste filtrée pour aider à la recherche */}
                    {categorySearchText && (
                      <div className="mt-2 bg-white border rounded-lg shadow-md max-h-40 overflow-y-auto">
                        <div className="p-2 border-b bg-gray-50 text-xs text-gray-500">
                          Résultats de recherche ({categories.filter(cat => 
                            cat.name.toLowerCase().includes(categorySearchText.toLowerCase()) ||
                            (cat.description && cat.description.toLowerCase().includes(categorySearchText.toLowerCase()))
                          ).length})
                        </div>
                        <div className="divide-y">
                          {categories
                            .filter(cat => 
                              cat.name.toLowerCase().includes(categorySearchText.toLowerCase()) ||
                              (cat.description && cat.description.toLowerCase().includes(categorySearchText.toLowerCase()))
                            )
                            .map((cat) => (
                              <div
                                key={cat.id}
                                className="px-3 py-2 hover:bg-[#F7F5FF] cursor-pointer text-sm"
                                onClick={() => {
                                  setCurrentProduct(prev => ({ ...prev, category: cat.name }));
                                  setCategorySearchText("");
                                }}
                              >
                                <div className="font-medium text-[#472EAD]">{cat.name}</div>
                                {cat.description && (
                                  <div className="text-xs text-gray-500 truncate">{cat.description}</div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {cat.productCount} produit(s)
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                  <span>{categories.length} catégories disponibles</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setTimeout(() => {
                        setActiveTab("categories");
                      }, 100);
                    }}
                    className="text-[#472EAD] hover:underline flex items-center gap-1"
                  >
                    <FaFolderPlus className="text-xs" />
                    <span>Gérer les catégories</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Code-barre
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={currentProduct.barcode}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Prix par carton (F)
                </label>
                <input
                  type="number"
                  name="pricePerCarton"
                  value={currentProduct.pricePerCarton}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Cartons
                </label>
                <input
                  type="number"
                  name="cartons"
                  value={currentProduct.cartons}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Unités/Carton
                </label>
                <input
                  type="number"
                  name="unitsPerCarton"
                  value={currentProduct.unitsPerCarton}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Stock minimum (en cartons)
                </label>
                <input
                  type="number"
                  name="stockMin"
                  value={currentProduct.stockMin}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                />
              </div>

              <div className="col-span-full text-sm text-[#472EAD] font-semibold mt-2 flex items-center gap-2">
                <FaBoxes />
                <span>
                  Stock global estimé :{" "}
                  {Number(currentProduct.cartons || 0) *
                    Number(currentProduct.unitsPerCarton || 0)}
                </span>
              </div>

              <div className="col-span-full flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white hover:opacity-90 inline-flex items-center gap-2"
                >
                  <FaCheck />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          MODALE CATÉGORIE (AJOUT / MODIF)
          ------------------------------------------------------------------ */}
      {categoryModal && currentCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaFolder className="text-[#472EAD]" />
              {categoryModal === "add" ? "Nouvelle Catégorie" : "Modifier la Catégorie"}
            </h2>

            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentCategory.name}
                  onChange={handleCategoryFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  name="description"
                  value={currentCategory.description || ""}
                  onChange={handleCategoryFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                  rows={3}
                  placeholder="Décrivez cette catégorie..."
                />
              </div>

              {categoryModal === "edit" && (
                <div className="bg-[#F7F5FF] p-3 rounded-lg">
                  <p className="text-xs font-semibold text-[#472EAD]">
                    Informations
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Cette catégorie est utilisée par <span className="font-bold text-[#F58020]">{currentCategory.productCount}</span> produit(s).
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {currentCategory.productCount > 0 
                      ? "La modification du nom mettra à jour automatiquement tous les produits utilisant cette catégorie."
                      : "Aucun produit n'utilise cette catégorie actuellement."
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white hover:opacity-90 inline-flex items-center gap-2"
                >
                  <FaCheck />
                  {categoryModal === "add" ? "Créer la catégorie" : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          MODALE SUPPRESSION PRODUIT
          ------------------------------------------------------------------ */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-[#472EAD]">
              <FaTrashAlt className="text-[#F58020]" />
              Supprimer le produit
            </h3>
            <p className="text-sm text-gray-600">
              Voulez-vous vraiment supprimer ce produit ? Cette action est
              irréversible.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 text-sm rounded bg-[#F58020] text-white hover:bg-orange-600 inline-flex items-center gap-2"
              >
                <FaTrashAlt />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          MODALE SUPPRESSION CATÉGORIE
          ------------------------------------------------------------------ */}
      {deleteCategoryId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-[#472EAD]">
              <FaTrashAlt className="text-[#F58020]" />
              Supprimer la catégorie
            </h3>
            <p className="text-sm text-gray-600">
              Voulez-vous vraiment supprimer cette catégorie ? Cette action est
              irréversible.
            </p>
            <p className="text-xs text-red-500 mt-2">
              Note : Une catégorie ne peut être supprimée que si aucun produit ne l'utilise.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteCategoryId(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 text-sm rounded bg-[#F58020] text-white hover:bg-orange-600 inline-flex items-center gap-2"
              >
                <FaTrashAlt />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          MODALE AJUSTEMENT DE STOCK
          ------------------------------------------------------------------ */}
      {adjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaSlidersH className="text-[#472EAD]" />
              {adjustAction === "reappro"
                ? "Réapprovisionner le stock"
                : "Diminuer le stock"}
            </h3>

            <p className="text-sm text-gray-700 mb-4">
              Produit :{" "}
              <span className="font-semibold text-[#472EAD]">{adjustProduct.name}</span> (
              {adjustProduct.category})
              <br />
              Stock actuel :{" "}
              <span className="font-semibold text-[#F58020]">{adjustProduct.cartons}</span>{" "}
              cartons
            </p>

            <form onSubmit={handleSubmitAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Quantité (en cartons)
                </label>
                <input
                  type="number"
                  min="1"
                  max={adjustAction === "diminue" ? adjustProduct.cartons : undefined}
                  value={adjustQuantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (
                      adjustAction === "diminue" &&
                      val > adjustProduct.cartons
                    ) {
                      alert(
                        `Vous ne pouvez pas diminuer plus de ${adjustProduct.cartons} cartons.`
                      );
                      return;
                    }
                    setAdjustQuantity(e.target.value);
                  }}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Motif (optionnel)
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD]"
                  rows={3}
                  placeholder="Ex : livraison fournisseur, correction d'inventaire..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm rounded text-white inline-flex items-center gap-2 ${
                    adjustAction === "reappro"
                      ? "bg-[#472EAD] hover:bg-[#3a2590]"
                      : "bg-[#F58020] hover:bg-orange-600"
                  }`}
                >
                  {adjustAction === "reappro" ? (
                    <>
                      <FaArrowUp />
                      <span>Réapprovisionner</span>
                    </>
                  ) : (
                    <>
                      <FaArrowDown />
                      <span>Diminuer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
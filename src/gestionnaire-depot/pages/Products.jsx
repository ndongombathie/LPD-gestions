// src/gestionnaire-depot/pages/Products.jsx
import React, { useEffect, useState } from "react";
import "../styles/depot-fix.css";
import { produitsAPI } from '../../services/api/produits';
import { categoriesAPI } from '../../services/api/categories';

import {
  FaSearch, FaPlus, FaBoxOpen, FaBarcode, FaTags, FaBoxes, FaCubes,
  FaMoneyBillWave, FaCoins, FaBalanceScale, FaExclamationTriangle,
  FaCheckCircle, FaArrowDown, FaFire, FaTimesCircle, FaEdit, FaTrashAlt,
  FaArrowUp, FaClock, FaUserTie, FaRegStickyNote, FaList, FaSlidersH,
  FaHistory, FaWarehouse, FaSortAlphaDown, FaTools, FaCheck, FaFolder,
  FaFolderPlus, FaFilter, FaSortAmountDown, FaChevronDown, FaAngleLeft,
  FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaTruck, FaBuilding,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaSave, FaTimes 
} from "react-icons/fa";

/* =========================================================================
   2) CALCULS ET UTILITAIRES (Compatible Base de Données)
   ========================================================================= */

const computeTotalPrice = (p) => {
  const quantite = Number(p.cartons || 0);
  const prix = Number(p.pricePerCarton || 0);
  return quantite * prix;
};

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

const getTypeIcon = (type) => {
  const baseClass = "text-sm";
  switch (type) {
    case "Création": return <FaPlus className={`${baseClass} text-green-600`} />;
    case "Modification": return <FaEdit className={`${baseClass} text-blue-600`} />;
    case "Suppression": return <FaTrashAlt className={`${baseClass} text-red-600`} />;
    case "Réapprovisionnement": return <FaArrowUp className={`${baseClass} text-green-600`} />;
    case "Diminution": return <FaArrowDown className={`${baseClass} text-orange-500`} />;
    default: return <FaHistory className={`${baseClass} text-gray-500`} />;
  }
};

/* =========================================================================
   3) COMPOSANT PRINCIPAL (LOGIQUE MÉTIER)
   ========================================================================= */

export default function Products() {
  // --- ÉTATS GLOBAUX ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]); 
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("liste");

  // --- ÉTATS UI ---
  const [searchProducts, setSearchProducts] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [sortMode, setSortMode] = useState("name-asc");
  
  // --- MODALES PRODUITS ---
  const [modalType, setModalType] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // --- MODALES AJUSTEMENT ---
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAction, setAdjustAction] = useState(null);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  
  // --- MODALES CATÉGORIES ---
  const [categoryModal, setCategoryModal] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [categorySearchText, setCategorySearchText] = useState("");
  
  // --- PAGINATION ---
  const [pageSize, setPageSize] = useState(8);
  const [productsPage, setProductsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [adjustmentPage, setAdjustmentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("Tous");
  const [historySortBy, setHistorySortBy] = useState("date-desc");
  
  const [searchCategory, setSearchCategory] = useState("");

  /* ------------------ CHARGEMENT API ------------------ */
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Début du chargement des données...");
      
      // Appels API parallèles
      const [productsResponse, categoriesResponse] = await Promise.all([
        produitsAPI.getAll(),
        categoriesAPI.getAll()
      ]);

      console.log("📦 Réponse produits:", productsResponse);
      console.log("📁 Réponse catégories:", categoriesResponse);

      // Gestion des réponses API
      const safeProducts = Array.isArray(productsResponse) 
        ? productsResponse 
        : (productsResponse?.data || []);

      const safeCategories = Array.isArray(categoriesResponse) 
        ? categoriesResponse 
        : (categoriesResponse?.data || []);

      console.log(`✅ ${safeProducts.length} produits chargés`);
      console.log(`✅ ${safeCategories.length} catégories chargées`);

      // Transformation des catégories
      const transformedCategories = safeCategories.map(cat => ({
        id: cat.id || cat.uuid,
        name: cat.nom || cat.name || "Sans nom",
        nom: cat.nom || "Sans nom",
        description: cat.description || "",
        productCount: cat.product_count || cat.productCount || 0
      }));

      setProducts(safeProducts);
      setCategories(transformedCategories);
      setIsDataLoaded(true);

    } catch (error) {
      console.error("❌ Erreur détaillée chargement:", error);
      
      let errorMessage = "❌ Erreur de connexion au serveur.";
      
      if (error.response) {
        // Erreur de l'API
        if (error.response.status === 401) {
          errorMessage = "❌ Session expirée. Veuillez vous reconnecter.";
        } else if (error.response.data?.message) {
          errorMessage = `❌ ${error.response.data.message}`;
        } else if (error.response.data?.errors) {
          errorMessage = "❌ Erreurs de validation.";
        }
      } else if (error.request) {
        errorMessage = "❌ Pas de réponse du serveur. Vérifiez que Laravel est en cours d'exécution.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    console.log("🔄 useEffect - Chargement initial");
    fetchData(); 
  }, []);

  /* ------------------ TRADUCTEUR (MAPPING BDD -> REACT) ------------------ */
  const computedProducts = products.map((p) => {
    if (!p) return null;

    console.log("🔍 Traitement produit:", p);

    // Gestion de la catégorie
    let categoryName = "Non classé";
    let categoryId = null;

    if (p.categorie_nom) {
      categoryName = p.categorie_nom;
    } else if (p.categorie_id) {
      categoryId = p.categorie_id;
      const foundCat = categories.find(c => c.id === p.categorie_id);
      if (foundCat) categoryName = foundCat.name || foundCat.nom || "Sans nom";
    } else if (p.categorie) {
      // Si l'API retourne un objet catégorie
      if (typeof p.categorie === 'object') {
        categoryName = p.categorie.nom || p.categorie.name || "Non classé";
        categoryId = p.categorie.id || p.categorie.uuid;
      } else {
        categoryName = p.categorie;
      }
    }

    // Formatage des données
    const productUnified = {
        ...p,
        id: p.id || p.uuid,
        name: p.nom || "Produit sans nom",
        barcode: p.code || p.code_barre || "Inconnu",
        category: categoryName,
        categoryId: categoryId || p.categorie_id,
        cartons: parseInt(p.nombre_carton) || 0,
        stockMin: parseInt(p.stock_seuil) || 0,
        stockIdeal: parseInt(p.stock_ideal) || 0,
        pricePerCarton: parseFloat(p.prix_unite_carton) || 0,
        unitsPerCarton: parseInt(p.unite_carton) || 1,
        fournisseur: p.fournisseur || "Non spécifié",
        fournisseur_id: p.fournisseur_id || null
    };

    const totalPrice = computeTotalPrice(productUnified);
    const status = getStatus(productUnified.cartons, productUnified.stockMin);
    
    return { ...productUnified, totalPrice, status };
  }).filter(Boolean);

  /* ------------------ FONCTIONS CRUD (ACTIONS) ------------------ */

  // 1. SAUVEGARDE PRODUIT - CORRIGÉE
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!currentProduct.name.trim()) {
      alert("Le nom du produit est obligatoire.");
      return;
    }

    // Récupération de l'ID de la catégorie
    let categoryId = currentProduct.categoryId;
    if (!categoryId && currentProduct.category) {
      const selectedCat = categories.find(c => 
        (c.nom || c.name) === currentProduct.category
      );
      if (selectedCat) categoryId = selectedCat.id;
    }

    // VÉRIFICATION : La catégorie est obligatoire
    if (!categoryId) {
      alert("⚠️ La catégorie est obligatoire. Veuillez sélectionner une catégorie.");
      return;
    }

    // PRÉPARATION DU PAYLOAD CORRECT POUR L'API LARAVEL
    // Basé sur le contrôleur que vous avez montré
    const apiPayload = {
      nom: String(currentProduct.name || "").trim(),
      code: String(currentProduct.barcode || "").trim(),
      categorie_id: categoryId,
      // CORRECTION : Le contrôleur attend 'fournisseur' (nullable:string), pas 'fournisseur_id'
      fournisseur: String(currentProduct.fournisseur || "").trim(),
      nombre_carton: parseInt(currentProduct.cartons) || 0,
      unite_carton: parseInt(currentProduct.unitsPerCarton) || 1,
      prix_unite_carton: parseFloat(currentProduct.pricePerCarton) || 0,
      stock_seuil: parseInt(currentProduct.stockMin) || 5,
      stock_ideal: parseInt(currentProduct.stockIdeal) || 20
    };

    console.log("📤 Payload pour API:", apiPayload);

    try {
      if (modalType === "add") {
        // Vérification frontale du code-barre
        if (apiPayload.code && apiPayload.code.trim() !== "") {
          const codeExists = products.some(p => 
            (p.code === apiPayload.code || p.code_barre === apiPayload.code)
          );
          
          if (codeExists) {
            alert("❌ Ce code-barre est déjà utilisé par un autre produit.");
            return;
          }
        }

        // Envoi à l'API
        const response = await produitsAPI.create(apiPayload);
        console.log("✅ Produit créé:", response);
        
        addHistoryEntry({ 
          product: { name: currentProduct.name }, 
          type: "Création", 
          reason: "Nouveau produit ajouté" 
        });
        alert("✅ Produit ajouté avec succès !");
        
      } else if (modalType === "edit") {
        // Vérification pour l'édition
        const originalProduct = products.find(p => p.id === currentProduct.id);
        if (originalProduct && apiPayload.code && apiPayload.code.trim() !== "") {
          const originalCode = originalProduct.code || originalProduct.code_barre;
          const newCode = apiPayload.code;
          
          if (newCode !== originalCode) {
            const codeExists = products.some(p => 
              p.id !== currentProduct.id && 
              (p.code === newCode || p.code_barre === newCode)
            );
            
            if (codeExists) {
              alert("❌ Ce code-barre est déjà utilisé par un autre produit.");
              return;
            }
          }
        }

        const response = await produitsAPI.update(currentProduct.id, apiPayload);
        console.log("✅ Produit mis à jour:", response);
        
        addHistoryEntry({
          product: currentProduct,
          type: "Modification",
          reason: "Mise à jour fiche produit"
        });
        alert("✅ Produit modifié !");
      }
      
      closeProductModal();
      await fetchData();

    } catch (error) {
      console.error("❌ Erreur détaillée:", error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.errors) {
          // Erreurs de validation Laravel
          let errorMessage = "Erreurs de validation :\n";
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            errorMessage += `• ${field}: ${messages.join(', ')}\n`;
          });
          alert(errorMessage);
        } else if (errorData.message) {
          alert(`❌ Erreur: ${errorData.message}`);
        } else {
          alert("❌ Une erreur est survenue lors de la sauvegarde.");
        }
      } else if (error.request) {
        alert("❌ Pas de réponse du serveur. Vérifiez que Laravel est en cours d'exécution.");
      } else {
        alert("❌ Erreur: " + error.message);
      }
    }
  };

  // 2. SUPPRESSION PRODUIT - CORRIGÉE
  const handleConfirmDeleteProduct = async () => {
    if (!deleteId) return;

    try {
        const productToDelete = products.find((p) => p.id === deleteId);
        
        await produitsAPI.delete(deleteId);
        
        if (productToDelete) {
             addHistoryEntry({
                product: { name: productToDelete.nom || "Produit" },
                type: "Suppression",
                reason: "Suppression définitive du stock"
             });
        }
        
        // Mettre à jour l'état local
        setProducts(prev => prev.filter(p => p.id !== deleteId));
        setDeleteId(null);
        alert("🗑️ Produit supprimé.");

    } catch (error) {
        console.error("Erreur suppression:", error);
        
        // Gestion spécifique des contraintes de clé étrangère
        if (error.response?.status === 500 || 
            error.response?.data?.message?.includes('foreign key constraint') ||
            error.response?.data?.message?.includes('Integrity constraint violation')) {
            alert("⚠️ Impossible de supprimer ce produit car il est lié à des ventes ou d'autres enregistrements.");
        } else if (error.response?.data?.message) {
            alert(`❌ ${error.response.data.message}`);
        } else {
            alert("⚠️ Impossible de supprimer. Vérifiez si ce produit est lié à des ventes.");
        }
        setDeleteId(null);
    }
  };

  // 3. AJUSTEMENT DE STOCK - CORRIGÉE
  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    if (!adjustProduct || !adjustAction) return;

    const qty = parseInt(adjustQuantity);
    if (!qty || qty <= 0) {
      alert("Quantité invalide.");
      return;
    }

    const product = products.find((p) => p.id === adjustProduct.id);
    if (!product) return;

    const currentStock = parseInt(product.nombre_carton || product.cartons || 0);
    
    if (adjustAction === "diminue" && qty > currentStock) {
      alert(`Impossible de diminuer de ${qty}. Stock actuel : ${currentStock}.`);
      return;
    }

    try {
      if (adjustAction === "reappro") {
        // Utiliser l'endpoint spécifique de réapprovisionnement
        const response = await produitsAPI.reapprovisionner({ 
          produit_id: product.id, 
          quantite: qty 
        });
        
        console.log("✅ Réapprovisionnement réussi:", response);
        
        addHistoryEntry({
          product: { name: product.nom || product.name },
          type: "Réapprovisionnement",
          reason: adjustReason || `Réapprovisionnement de ${qty} cartons`,
          before: currentStock,
          after: currentStock + qty
        });
        
        alert("✅ Stock réapprovisionné !");
        
      } else if (adjustAction === "diminue") {
        const newQty = Math.max(0, currentStock - qty);
        
        // Pour la diminution, mettre à jour le produit directement
        const apiPayload = {
          nom: product.nom || product.name,
          code: product.code || product.code_barre || "",
          categorie_id: product.categorie_id,
          nombre_carton: newQty,
          unite_carton: parseInt(product.unite_carton || 1),
          prix_unite_carton: parseFloat(product.prix_unite_carton || 0),
          stock_seuil: parseInt(product.stock_seuil || 5),
          stock_ideal: parseInt(product.stock_ideal || 20),
          fournisseur: product.fournisseur || ""
        };

        const response = await produitsAPI.update(product.id, apiPayload);
        console.log("✅ Diminution réussie:", response);
        
        addHistoryEntry({
          product: { name: product.nom || product.name },
          type: "Diminution",
          reason: adjustReason || `Diminution de ${qty} cartons`,
          before: currentStock,
          after: newQty
        });
        
        alert("✅ Stock diminué !");
      }
      
      closeAdjustModal();
      // Recharger les données pour voir les changements
      await fetchData();

    } catch (error) {
      console.error("❌ Erreur ajustement:", error);
      
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
        alert("❌ Erreur lors de la mise à jour du stock.");
      }
    }
  };

  // 4. HISTORIQUE LOCAL
  const addHistoryEntry = ({ product, type, before, after, reason }) => {
    const entry = {
      id: Date.now(),
      productName: product?.name || "Produit",
      type,
      date: new Date().toLocaleString("fr-FR"),
      reason: reason || "",
      before: before !== undefined ? before : null,
      after: after !== undefined ? after : null,
      manager: "Utilisateur"
    };
    setHistory(prev => [entry, ...prev]);
  };

  /* ------------------ GESTION CATÉGORIES ------------------ */
  const openAddCategoryModal = () => {
    setCategoryModal("add");
    setCurrentCategory({ id: null, name: "", description: "" });
  };
  
  const openEditCategoryModal = (cat) => {
    setCategoryModal("edit");
    setCurrentCategory({ 
      ...cat, 
      name: cat.nom || cat.name || ""
    });
  };
  
  const closeCategoryModal = () => { 
    setCategoryModal(null); 
    setCurrentCategory(null); 
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!currentCategory?.name?.trim()) {
      alert("Le nom de la catégorie est obligatoire.");
      return;
    }

    const catData = { 
      nom: String(currentCategory.name).trim(),
      description: currentCategory.description || ""
    };

    try {
      if (categoryModal === "add") {
        const response = await categoriesAPI.create(catData);
        console.log("✅ Catégorie créée:", response);
        
        addHistoryEntry({
          product: { name: "Catégorie" },
          type: "Création",
          reason: `Nouvelle catégorie: ${currentCategory.name}`
        });
        alert("✅ Catégorie créée avec succès !");
      } else {
        if (!currentCategory.id) {
          alert("❌ ID de catégorie manquant.");
          return;
        }
        const response = await categoriesAPI.update(currentCategory.id, catData);
        console.log("✅ Catégorie modifiée:", response);
        
        addHistoryEntry({
          product: { name: "Catégorie" },
          type: "Modification",
          reason: `Mise à jour catégorie: ${currentCategory.name}`
        });
        alert("✅ Catégorie modifiée !");
      }
      
      closeCategoryModal();
      await fetchData();

    } catch (error) {
      console.error("❌ Erreur catégorie:", error);
      
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
        alert("❌ Erreur lors de l'enregistrement de la catégorie.");
      }
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if(!deleteCategoryId) return;
    try {
        const response = await categoriesAPI.delete(deleteCategoryId);
        console.log("✅ Catégorie supprimée:", response);
        
        addHistoryEntry({
          product: { name: "Catégorie" },
          type: "Suppression",
          reason: "Suppression d'une catégorie"
        });
        
        alert("✅ Catégorie supprimée !");
        setDeleteCategoryId(null);
        await fetchData();
        
    } catch(err) {
        console.error("Erreur suppression catégorie:", err);
        
        if (err.response?.status === 500 || 
            err.response?.data?.message?.includes('foreign key constraint')) {
            alert("⚠️ Impossible de supprimer cette catégorie car elle est utilisée par des produits.");
        } else if (err.response?.data?.message) {
            alert(`❌ ${err.response.data.message}`);
        } else {
            alert("⚠️ Impossible de supprimer cette catégorie (peut-être utilisée).");
        }
        setDeleteCategoryId(null);
    }
  };

  const handleCategoryFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => ({ ...prev, [name]: value }));
  };

  /* =========================================================================
     6) LISTE DES PRODUITS & FILTRES
     ========================================================================= */

  const filteredProducts = computedProducts
    .filter((p) => {
      if (!p) return false;
      const term = String(searchProducts || "").toLowerCase().trim();
      
      const nameSafe = String(p.name || "").toLowerCase();
      const barcodeSafe = String(p.barcode || "").toLowerCase(); 
      const categorySafe = String(p.category || "").toLowerCase();

      const matchesSearch = !term || 
        nameSafe.includes(term) || 
        barcodeSafe.includes(term) || 
        categorySafe.includes(term);

      const matchesStatus = statusFilter === "Tous" || (p.status && p.status.label === statusFilter);
      const matchesCategory = categoryFilter === "Toutes" || p.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      
      if (sortMode === "name-asc") return String(a.name).localeCompare(String(b.name));
      if (sortMode === "name-desc") return String(b.name).localeCompare(String(a.name));
      
      const stockA = Number(a.cartons || 0);
      const stockB = Number(b.cartons || 0);
      
      if (sortMode === "stock-asc") return stockA - stockB;
      if (sortMode === "stock-desc") return stockB - stockA;
      
      return 0;
    });

  const totalValue = filteredProducts.reduce((acc, p) => 
    acc + (p.pricePerCarton * p.cartons), 0
  );

  const nbFaible = filteredProducts.filter(p => p.status?.label === "Faible").length;
  const nbCritique = filteredProducts.filter(p => p.status?.label === "Critique").length;
  const nbRupture = filteredProducts.filter(p => p.status?.label === "Rupture").length;

  const totalProductsPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentProductsPage = Math.min(productsPage, totalProductsPages);
  const startProductsIndex = (currentProductsPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startProductsIndex, startProductsIndex + pageSize);

  /* =========================================================================
     7) GESTION DES MODALES
     ========================================================================= */

  const openAddModal = () => {
    setModalType("add");
    setCurrentProduct({
      id: null,
      name: "",
      category: "",
      categoryId: "",
      cartons: "",
      unitsPerCarton: "1",
      barcode: "",
      pricePerCarton: "",
      stockMin: "5",
      stockIdeal: "20",
      fournisseur: ""
    });
  };

  const openEditModal = (product) => {
    setModalType("edit");
    setCurrentProduct({ 
      ...product,
      name: product.name || product.nom || "",
      category: product.category || "Non classé",
      categoryId: product.categoryId || product.categorie_id || "",
      barcode: product.barcode || product.code || product.code_barre || "",
      cartons: product.cartons || product.nombre_carton || "",
      unitsPerCarton: product.unitsPerCarton || product.unite_carton || "1",
      pricePerCarton: product.pricePerCarton || product.prix_unite_carton || "",
      stockMin: product.stockMin || product.stock_seuil || "5",
      stockIdeal: product.stockIdeal || product.stock_ideal || "20",
      fournisseur: product.fournisseur || ""
    });
  };

  const closeProductModal = () => {
    setModalType(null);
    setCurrentProduct(null);
  };

  const handleProductFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({ ...prev, [name]: value }));
  };

  /* =========================================================================
     9) ONGLET 2 : AJUSTEMENT DE STOCK
     ========================================================================= */

  const safeProductsForAdjust = Array.isArray(computedProducts) ? computedProducts : [];
  
  const alertProducts = safeProductsForAdjust.filter((p) =>
    p && p.status && ["Rupture", "Critique", "Faible"].includes(p.status.label)
  );

  const termAdjust = (searchProducts || "").trim().toLowerCase();

  const allAdjustFiltered = safeProductsForAdjust.filter((p) => {
    if (!p) return false;
    if (!termAdjust) return true;
    
    const nameSafe = String(p.name || "").toLowerCase();
    const barcodeSafe = String(p.barcode || "").toLowerCase();
    const categorySafe = String(p.category || "").toLowerCase();

    return (
      nameSafe.includes(termAdjust) ||
      barcodeSafe.includes(termAdjust) ||
      categorySafe.includes(termAdjust)
    );
  });

  const alertFiltered = alertProducts.filter((p) => {
    if (!p) return false;
    if (!termAdjust) return true;

    const nameSafe = String(p.name || "").toLowerCase();
    const barcodeSafe = String(p.barcode || "").toLowerCase();
    
    return nameSafe.includes(termAdjust) || barcodeSafe.includes(termAdjust);
  });

  const totalAdjustmentPages = Math.max(1, Math.ceil(allAdjustFiltered.length / pageSize));
  const currentAdjustmentPage = Math.min(adjustmentPage, totalAdjustmentPages);
  const startAdjustmentIndex = (currentAdjustmentPage - 1) * pageSize;
  const paginatedAdjustment = allAdjustFiltered.slice(startAdjustmentIndex, startAdjustmentIndex + pageSize);

  const openAdjust = (product, action) => {
    setAdjustProduct(product);
    setAdjustAction(action);
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

  const ruptureList = alertFiltered.filter((p) => p.status?.label === "Rupture");
  const critiqueList = alertFiltered.filter((p) => p.status?.label === "Critique");
  const faibleList = alertFiltered.filter((p) => p.status?.label === "Faible");

  /* =========================================================================
     10) ONGLET 3 : HISTORIQUE
     ========================================================================= */
  
  const filteredHistory = history.filter(h => 
    h.type === "Modification" || h.type === "Suppression" || h.type === "Création"
  );
  
  const searchedHistory = filteredHistory.filter((h) => {
    if (!historySearch) return true;
    const term = historySearch.toLowerCase();
    return (
      (h.productName || "").toLowerCase().includes(term) ||
      (h.type || "").toLowerCase().includes(term) ||
      (h.reason || "").toLowerCase().includes(term)
    );
  });
  
  const typeFilteredHistory = searchedHistory.filter((h) => {
    if (historyTypeFilter === "Tous") return true;
    return h.type === historyTypeFilter;
  });
  
  const sortedHistory = [...typeFilteredHistory].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    if (historySortBy === "date-desc") return dateB - dateA;
    if (historySortBy === "date-asc") return dateA - dateB;
    return 0;
  });
  
  const totalHistoryPages = Math.max(1, Math.ceil(sortedHistory.length / pageSize));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const startHistoryIndex = (currentHistoryPage - 1) * pageSize;
  const paginatedHistory = sortedHistory.slice(startHistoryIndex, startHistoryIndex + pageSize);

  /* =========================================================================
     11) ONGLET 4 : CATÉGORIES
     ========================================================================= */

  const filteredCategories = categories.filter((cat) => {
      const term = (searchCategory || "").toLowerCase();
      const nameSafe = String(cat.name || cat.nom || "").toLowerCase();
      const descSafe = String(cat.description || "").toLowerCase();
      return nameSafe.includes(term) || descSafe.includes(term);
  });

  const totalCategoriesPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const currentCategoriesPage = Math.min(categoriesPage, totalCategoriesPages);
  const startCategoriesIndex = (currentCategoriesPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(startCategoriesIndex, startCategoriesIndex + pageSize);

  /* =========================================================================
     12) COMPOSANT PAGINATION (Interne)
     ========================================================================= */
  
  const Pagination = ({ currentPage, totalPages, onPageChange, filteredCount }) => {
    if (filteredCount === 0) return null;

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
    const endItem = Math.min(currentPage * pageSize, filteredCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-slate-200">
        
        <div className="text-sm text-slate-600">
          Affichage <span className="font-bold text-slate-800">{startItem}</span> à <span className="font-bold text-slate-800">{endItem}</span> sur <span className="font-bold text-blue-600">{filteredCount}</span>
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
        
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-[#472EAD]">
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>
    );
  };

  /* =========================================================================
     13) RENDU (AFFICHAGE)
     ========================================================================= */

  return (
    <div className="depot-page space-y-6 font-sans text-slate-800 bg-gray-50 min-h-screen p-6">
      
      {/* --- HEADER + BOUTONS D'ACTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <FaWarehouse className="text-[#472EAD]" />
          Gestion Avancée des Produits
        </h1>

        {activeTab === "liste" && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-transform active:scale-95"
          >
            <FaPlus /> Nouveau Produit
          </button>
        )}

        {activeTab === "categories" && (
          <button
            onClick={openAddCategoryModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-all"
          >
            <FaFolderPlus className="text-white"/> Nouvelle Catégorie
          </button>
        )}
      </div>

      {/* --- BARRE DE NAVIGATION (ONGLETS) --- */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => { setActiveTab("liste"); setProductsPage(1); }}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg border-b-2 ${
            activeTab === "liste"
              ? "border-[#472EAD] text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="inline-flex items-center gap-2"><FaList /> Liste des Produits</span>
        </button>

        <button
          onClick={() => { setActiveTab("ajustement"); setAdjustmentPage(1); }}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg border-b-2 ${
            activeTab === "ajustement"
              ? "border-[#472EAD] text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="inline-flex items-center gap-2"><FaSlidersH /> Ajustement de Stock</span>
        </button>

        <button
          onClick={() => { setActiveTab("historique"); setHistoryPage(1); }}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg border-b-2 ${
            activeTab === "historique"
              ? "border-[#472EAD] text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="inline-flex items-center gap-2"><FaHistory /> Historique</span>
        </button>

        <button
          onClick={() => { setActiveTab("categories"); setCategoriesPage(1); }}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg border-b-2 ${
            activeTab === "categories"
              ? "border-[#472EAD] text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="inline-flex items-center gap-2"><FaFolder /> Catégories</span>
        </button>
      </div>

      {/* ==================================================================
          ONGLET 1 : LISTE DES PRODUITS
          ================================================================== */}
      {activeTab === "liste" && (
        <div className="animate-fade-in space-y-6">
          
          {/* Barre d'outils (Recherche & Filtres) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between">
            {/* Recherche */}
            <div className="relative w-full md:w-96">
               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="text"
                 placeholder="Rechercher (nom, code, catégorie)..."
                 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                 value={searchProducts}
                 onChange={(e) => { setSearchProducts(e.target.value); setProductsPage(1); }}
               />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setProductsPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
              >
                <option value="Toutes">Toutes catégories</option>
                {Array.from(new Set(computedProducts.map(p => p.category).filter(Boolean))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setProductsPage(1); }}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="Normal">Normal</option>
                <option value="Faible">Faible</option>
                <option value="Critique">Critique</option>
                <option value="Rupture">Rupture</option>
              </select>

              <div className="flex items-center border border-slate-300 rounded-lg bg-white px-3 py-2 gap-2">
                <FaSortAlphaDown className="text-slate-400" />
                <select
                  value={sortMode}
                  onChange={(e) => { setSortMode(e.target.value); setProductsPage(1); }}
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

          {/* Cartes Statistiques (KPI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

            <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl shadow-sm p-4 flex items-center gap-4">
               <div className="p-3 bg-white/20 text-white rounded-lg"><FaFire size={20}/></div>
               <div>
                 <p className="text-xs text-white/90 uppercase font-bold">Critique</p>
                 <p className="text-xl font-bold text-white">{nbCritique}</p>
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

          {/* Tableau des produits */}
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
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="p-4 text-center font-mono text-slate-500 text-xs">{p.barcode || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] px-2 py-1 rounded text-xs font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {p.fournisseur ? (
                           <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F0F9FF] to-[#F0FDF4] text-[#472EAD] px-2 py-1 rounded text-xs">
                             <FaTruck className="text-[10px]" /> {p.fournisseur}
                           </span>
                        ) : (
                           <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">{p.cartons}</td>
                      <td className="p-4 text-center text-slate-500">{p.unitsPerCarton}</td>
                      <td className="p-4 text-right font-mono text-slate-600">{Number(p.pricePerCarton).toLocaleString("fr-FR")}</td>
                      <td className="p-4 text-right font-mono font-bold text-[#472EAD]">{Number(p.totalPrice).toLocaleString("fr-FR")}</td>
                      <td className="p-4 text-center text-[#F58020] font-medium">{p.stockMin}</td>
                      <td className="p-4 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-[#472EAD] hover:bg-[#F7F5FF] rounded transition-colors"
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                        {loading ? "Chargement en cours..." : "Aucun produit trouvé correspondant à vos critères."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="p-4 border-t border-slate-200">
                <Pagination
                  currentPage={currentProductsPage}
                  totalPages={totalProductsPages}
                  onPageChange={setProductsPage}
                  filteredCount={filteredProducts.length}
                />
              </div>
            )}
          </div>
        </div>
      )}
     
      {/* ------------------------------------------------------------------
          ONGLET 2 : AJUSTEMENT DE STOCK (KANBAN + TABLEAU)
          ------------------------------------------------------------------ */}
      {activeTab === "ajustement" && (
        <div className="animate-fade-in space-y-6">
          
          {/* Barre de Recherche Ajustement */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3">
            <FaSearch className="text-[#472EAD]" />
            <input
              type="text"
              placeholder="Rechercher pour ajuster (Nom, Code-barre)..."
              className="flex-1 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#472EAD]"
              value={searchProducts}
              onChange={(e) => {
                setSearchProducts(e.target.value);
                setAdjustmentPage(1);
              }}
            />
          </div>

          {/* VUE KANBAN (Alertes) */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <FaExclamationTriangle className="text-[#F58020]" />
              <span>Produits nécessitant attention</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Colonne RUPTURE */}
              <div className="bg-gradient-to-r from-[#6B7280]/10 to-[#9CA3AF]/10 rounded-xl border border-gray-200 p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-700 text-xs uppercase flex items-center gap-2">
                    <FaTimesCircle className="text-gray-600" /> Rupture
                  </span>
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {ruptureList.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {ruptureList.map((p) => (
                    <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 group hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 text-sm truncate">{p.name}</span>
                        <FaBoxOpen className="text-gray-400" />
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Stock: <span className="font-bold text-gray-600">{p.cartons} ctn</span></div>
                      <button onClick={() => openAdjust(p, 'reappro')} className="w-full py-1.5 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white text-xs font-bold rounded hover:opacity-90 transition flex items-center justify-center gap-1">
                        <FaArrowUp /> Réappro
                      </button>
                    </div>
                  ))}
                  {ruptureList.length === 0 && <p className="text-xs text-center text-slate-400 italic py-4">Aucune rupture. Bravo !</p>}
                </div>
              </div>

              {/* Colonne CRITIQUE */}
              <div className="bg-gradient-to-r from-[#DC2626]/10 to-[#EF4444]/10 rounded-xl border border-red-100 p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-red-700 text-xs uppercase flex items-center gap-2">
                    <FaFire className="text-red-600" /> Critique
                  </span>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {critiqueList.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {critiqueList.map((p) => (
                    <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-red-100 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 text-sm truncate">{p.name}</span>
                        <FaExclamationTriangle className="text-red-400" />
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Stock: <span className="font-bold text-red-600">{p.cartons} ctn</span></div>
                      <button onClick={() => openAdjust(p, 'reappro')} className="w-full py-1.5 bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white text-xs font-bold rounded hover:opacity-90 transition flex items-center justify-center gap-1">
                         <FaArrowUp /> Réappro
                      </button>
                    </div>
                  ))}
                  {critiqueList.length === 0 && <p className="text-xs text-center text-slate-400 italic py-4">Rien à signaler.</p>}
                </div>
              </div>

              {/* Colonne FAIBLE */}
              <div className="bg-gradient-to-r from-[#F58020]/10 to-[#FFA94D]/10 rounded-xl border border-orange-100 p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-[#F58020] text-xs uppercase flex items-center gap-2">
                    <FaArrowDown className="text-[#F58020]" /> Faible
                  </span>
                  <span className="bg-orange-100 text-[#F58020] text-xs font-bold px-2 py-0.5 rounded-full">
                    {faibleList.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {faibleList.map((p) => (
                    <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 text-sm truncate">{p.name}</span>
                        <FaBoxes className="text-orange-400" />
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Stock: <span className="font-bold text-[#F58020]">{p.cartons} ctn</span></div>
                      <div className="flex gap-1">
                        <button onClick={() => openAdjust(p, 'reappro')} className="flex-1 py-1.5 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white text-xs font-bold rounded hover:opacity-90 transition">
                          <FaArrowUp />
                        </button>
                         <button onClick={() => openAdjust(p, 'diminue')} className="flex-1 py-1.5 bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white text-xs font-bold rounded hover:opacity-90 transition">
                          <FaArrowDown />
                        </button>
                      </div>
                    </div>
                  ))}
                  {faibleList.length === 0 && <p className="text-xs text-center text-slate-400 italic py-4">Stock confortable.</p>}
                </div>
              </div>

            </div>
          </div>

          {/* TABLEAU TOUS LES PRODUITS (Pour ajustement manuel) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]">
              <h3 className="font-bold text-[#472EAD] flex items-center gap-2">
                <FaList className="text-[#472EAD]"/> Tous les produits
              </h3>
              <span className="text-xs text-[#472EAD] font-bold">{allAdjustFiltered.length} produits</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-slate-600 font-semibold uppercase text-xs">
                  <tr>
                    <th className="p-3 pl-4">Produit</th>
                    <th className="p-3 text-center">Stock Actuel</th>
                    <th className="p-3 text-center">Statut</th>
                    <th className="p-3 text-right pr-4">Action Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAdjustment.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition">
                      <td className="p-3 pl-4">
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <FaBarcode size={10}/> {p.barcode || "N/A"}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {p.cartons} <span className="text-xs font-normal text-slate-400">ctn</span>
                      </td>
                      <td className="p-3 text-center">
                         <StatusBadge status={p.status} />
                      </td>
                      <td className="p-3 text-right pr-4">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => openAdjust(p, 'reappro')} className="p-2 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white rounded hover:opacity-90" title="Réapprovisionner">
                                <FaPlus size={12} />
                            </button>
                            <button onClick={() => openAdjust(p, 'diminue')} className="p-2 bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white rounded hover:opacity-90" title="Ajustement négatif (perte/don)">
                                <FaArrowDown size={12} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination simple si nécessaire */}
            {totalAdjustmentPages > 1 && (
               <div className="p-3 border-t border-slate-100 flex justify-center gap-2">
                  <button 
                    disabled={currentAdjustmentPage === 1}
                    onClick={() => setAdjustmentPage(prev => prev - 1)}
                    className="px-3 py-1 border rounded text-xs disabled:opacity-50 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] hover:opacity-90"
                  >
                    Précédent
                  </button>
                  <span className="text-xs flex items-center text-[#472EAD] font-bold">
                    Page {currentAdjustmentPage} / {totalAdjustmentPages}
                  </span>
                  <button 
                    disabled={currentAdjustmentPage === totalAdjustmentPages}
                    onClick={() => setAdjustmentPage(prev => prev + 1)}
                    className="px-3 py-1 border rounded text-xs disabled:opacity-50 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] hover:opacity-90"
                  >
                    Suivant
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
     
      {/* ------------------------------------------------------------------
          ONGLET 3 : HISTORIQUE (MODIFICATIONS ET SUPPRESSIONS SEULEMENT)
          ------------------------------------------------------------------ */}
      {activeTab === "historique" && (
        <>
          {/* Recherche historique */}
          <div className="bg-white rounded-xl shadow-sm border p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-[#472EAD]" />
                <input
                  type="text"
                  placeholder="Rechercher produit, motif..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                />
              </div>
              
              {/* Filtre par type */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  <FaFilter className="inline mr-1" />
                  Type d'action
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  value={historyTypeFilter}
                  onChange={(e) => {
                    setHistoryTypeFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                >
                  <option value="Tous">Tous les types</option>
                  <option value="Modification">Modifications</option>
                  <option value="Suppression">Suppressions</option>
                </select>
              </div>
              
              {/* Tri */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  <FaSortAmountDown className="inline mr-1" />
                  Trier par
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  value={historySortBy}
                  onChange={(e) => {
                    setHistorySortBy(e.target.value);
                    setHistoryPage(1);
                  }}
                >
                  <option value="date-desc">Date (récent → ancien)</option>
                  <option value="date-asc">Date (ancien → récent)</option>
                </select>
              </div>
            </div>
            
            {/* Résumé filtres */}
            <div className="mt-3 text-sm text-[#472EAD] font-semibold">
              {sortedHistory.length} action(s) trouvée(s)
              {historySearch && ` pour "${historySearch}"`}
              {historyTypeFilter !== "Tous" && ` • Type: ${historyTypeFilter}`}
            </div>
          </div>

          {/* Statistiques historique */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1">
                <FaHistory className="text-white" />
                <span>Total Historique</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-white">
                {filteredHistory.length}
              </p>
            </div>

            <div className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1">
                <FaEdit className="text-white" />
                <span>Modifications</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-white">
                {filteredHistory.filter(h => h.type === "Modification").length}
              </p>
            </div>

            <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1">
                <FaTrashAlt className="text-white" />
                <span>Suppressions</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-white">
                {filteredHistory.filter(h => h.type === "Suppression").length}
              </p>
            </div>
          </div>

          {/* Tableau historique */}
          <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] border-b text-[#472EAD]">
                <tr>
                  <th className="p-3 text-left">Date & Heure</th>
                  <th className="p-3 text-left">Produit</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Détails stock</th>
                  <th className="p-3 text-left">Motif</th>
                  <th className="p-3 text-left">Gestionnaire</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.length > 0 ? (
                  paginatedHistory.map((item, index) => (
                    <tr 
                      key={item.id || index} 
                      className="border-t hover:bg-[#F7F5FF]/30 transition-colors"
                    >
                      <td className="p-3 text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-[#472EAD]" />
                          {item.date || "N/A"}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-[#472EAD] flex items-center gap-2">
                          <FaBoxOpen />
                          {item.productName || "Produit inconnu"}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                          item.type === "Modification" 
                            ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200" 
                            : item.type === "Suppression"
                            ? "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200"
                            : item.type === "Création"
                            ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200"
                            : item.type === "Réapprovisionnement"
                            ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200"
                            : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200"
                        }`}>
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                      </td>
                      
                      <td className="p-3">
                        <div className="space-y-1">
                          {item.before !== null && item.before !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <FaArrowDown className="text-[#472EAD] text-xs" />
                              <span>Avant: <span className="font-semibold text-[#472EAD]">{item.before}</span></span>
                            </div>
                          )}
                          {item.after !== null && item.after !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <FaArrowUp className="text-[#F58020] text-xs" />
                              <span>Après: <span className="font-semibold text-[#F58020]">{item.after}</span></span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="flex items-start gap-2">
                          <FaRegStickyNote className="text-[#472EAD] mt-1" />
                          <span className="text-gray-700">
                            {item.reason || 
                              <span className="text-gray-400 italic">Aucun motif spécifié</span>
                            }
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-[#472EAD]" />
                          <span className="font-medium text-[#472EAD]">
                            {item.manager || "Gestionnaire Dépôt"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="text-gray-400">
                        <FaHistory className="text-4xl mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-[#472EAD]">Aucun historique de modifications/suppressions</p>
                        <p className="text-sm mt-1 text-gray-600">
                          {historySearch || historyTypeFilter !== "Tous" 
                            ? "Essayez de modifier vos critères de recherche"
                            : "Les modifications et suppressions de produits apparaîtront ici"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination historique */}
          {sortedHistory.length > 0 && (
            <Pagination
              currentPage={currentHistoryPage}
              totalPages={totalHistoryPages}
              onPageChange={setHistoryPage}
              filteredCount={sortedHistory.length}
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
              className="flex-1 text-sm outline-none focus:ring-2 focus:ring-[#472EAD]"
              value={searchCategory}
              onChange={(e) => {
                setSearchCategory(e.target.value);
                setCategoriesPage(1);
              }}
            />
            <FaFilter className="text-[#472EAD]" />
          </div>

          {/* Statistiques catégories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1">
                <FaFolder className="text-white" />
                <span>Total Catégories</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-white">
                {categories.length}
              </p>
            </div>

            <div className="bg-gradient-to-r from-[#F58020] to-[#FFA94D] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1">
                <FaBoxOpen className="text-white" />
                <span>Catégories utilisées</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-white">
                {categories.filter(c => c.productCount > 0).length}
              </p>
            </div>

            <div className="bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1">
                <FaSortAmountDown className="text-white" />
                <span>Catégorie la plus utilisée</span>
              </p>
              <p className="text-2xl font-semibold mt-2 text-white">
                {categories.length > 0 
                  ? categories.reduce((prev, current) => 
                      (prev.productCount > current.productCount) ? prev : current
                    ).name || "Aucune"
                  : "Aucune"}
              </p>
            </div>
          </div>

          {/* Tableau catégories */}
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
                  <tr key={cat.id} className="border-t hover:bg-[#F7F5FF]/30 transition-colors">
                    <td className="p-3 font-medium text-[#472EAD]">{cat.name}</td>
                    <td className="p-3 text-gray-600">
                      {cat.description || <span className="text-gray-400 italic">Aucune description</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cat.productCount > 0 
                          ? "bg-gradient-to-r from-green-100 to-green-50 text-green-700" 
                          : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600"
                      }`}>
                        {cat.productCount || 0} produit(s)
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
                      className="p-8 text-center"
                    >
                      <div className="text-gray-400">
                        <FaFolder className="text-4xl mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-[#472EAD]">
                          {filteredCategories.length === 0 
                            ? "Aucune catégorie trouvée avec les filtres actuels." 
                            : "Aucune catégorie sur cette page."}
                        </p>
                      </div>
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
              filteredCount={filteredCategories.length}
            />
          )}

          <div className="mt-4 text-sm text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] p-3 rounded-lg">
            <p className="flex items-center gap-2">
              <FaExclamationTriangle className="text-[#F58020]" />
              <span>Astuce : Les catégories ne peuvent être supprimées que si aucun produit ne les utilise.</span>
            </p>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------
          MODALE PRODUIT (AJOUT / MODIF) - CORRIGÉE
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
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentProduct.name}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  required
                />
              </div>

              {/* CATÉGORIE AVEC SELECT - OBLIGATOIRE */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <select
                      name="categoryId"
                      value={currentProduct.categoryId || ""}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        setCurrentProduct(prev => ({ 
                          ...prev, 
                          categoryId: selectedValue 
                        }));
                        
                        // Trouver le nom de la catégorie sélectionnée
                        if (selectedValue) {
                          const selectedCat = categories.find(c => 
                            c.id === selectedValue
                          );
                          if (selectedCat) {
                            setCurrentProduct(prev => ({ 
                              ...prev, 
                              category: selectedCat.name 
                            }));
                          }
                        } else {
                          setCurrentProduct(prev => ({ 
                            ...prev, 
                            category: "" 
                          }));
                        }
                      }}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none appearance-none"
                      required
                    >
                      <option value="">-- Sélectionnez une catégorie (obligatoire) --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="text-[#472EAD] pointer-events-none -ml-8" />
                  </div>
                </div>
                
                <div className="mt-1 text-xs text-[#472EAD] flex items-center justify-between">
                  <span>{categories.length} catégories disponibles</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setTimeout(() => {
                        setActiveTab("categories");
                      }, 100);
                    }}
                    className="text-[#472EAD] hover:text-[#3a2590] hover:underline flex items-center gap-1"
                  >
                    <FaFolderPlus className="text-xs" />
                    <span>Gérer les catégories</span>
                  </button>
                </div>
              </div>

              {/* FOURNISSEUR */}
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Fournisseur (nom)
                </label>
                <input
                  type="text"
                  name="fournisseur"
                  value={currentProduct.fournisseur}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Code-barre
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={currentProduct.barcode}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  placeholder="Code unique"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Prix par carton (F)
                </label>
                <input
                  type="number"
                  name="pricePerCarton"
                  value={currentProduct.pricePerCarton}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Cartons en stock
                </label>
                <input
                  type="number"
                  name="cartons"
                  value={currentProduct.cartons}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Unités par carton *
                </label>
                <input
                  type="number"
                  name="unitsPerCarton"
                  value={currentProduct.unitsPerCarton}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Stock minimum (cartons)
                </label>
                <input
                  type="number"
                  name="stockMin"
                  value={currentProduct.stockMin}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Stock idéal (cartons)
                </label>
                <input
                  type="number"
                  name="stockIdeal"
                  value={currentProduct.stockIdeal}
                  onChange={handleProductFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  min="0"
                />
              </div>

              <div className="col-span-full text-sm text-[#472EAD] font-semibold mt-2 flex items-center gap-2 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] p-3 rounded-lg">
                <FaBoxes />
                <span>
                  Stock global estimé :{" "}
                  {Number(currentProduct.cartons || 0) *
                    Number(currentProduct.unitsPerCarton || 1)} unités
                </span>
              </div>

              <div className="col-span-full flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white hover:opacity-90 inline-flex items-center gap-2"
                >
                  <FaCheck />
                  {modalType === "add" ? "Créer le produit" : "Mettre à jour"}
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
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentCategory.name || ""}
                  onChange={handleCategoryFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  required
                  placeholder="Ex: Papeterie, Fournitures..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  name="description"
                  value={currentCategory.description || ""}
                  onChange={handleCategoryFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  rows={3}
                  placeholder="Décrivez cette catégorie..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]"
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
            <p className="text-xs text-[#F58020] mt-2">
              Note : Si le produit est lié à des ventes, il ne pourra pas être supprimé.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white hover:opacity-90 inline-flex items-center gap-2"
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
            <p className="text-xs text-[#F58020] mt-2">
              Note : Une catégorie ne peut être supprimée que si aucun produit ne l'utilise.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteCategoryId(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white hover:opacity-90 inline-flex items-center gap-2"
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
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Quantité (en cartons) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={adjustAction === "diminue" ? adjustProduct.cartons : undefined}
                  value={adjustQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
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
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  Motif (optionnel)
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  rows={3}
                  placeholder="Ex : livraison fournisseur, correction d'inventaire..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  className="px-4 py-2 text-sm border rounded hover:bg-slate-50 text-[#472EAD]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm rounded text-white inline-flex items-center gap-2 ${
                    adjustAction === "reappro"
                      ? "bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] hover:opacity-90"
                      : "bg-gradient-to-r from-[#F58020] to-[#FFA94D] hover:opacity-90"
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
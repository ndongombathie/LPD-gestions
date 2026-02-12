import React, { useEffect, useState } from "react";
import "../styles/depot-fix.css";
import { produitsAPI } from '../../services/api/produits';
import { categoriesAPI } from '../../services/api/categories';
import { fournisseursAPI } from '../../services/api/fournisseurs';
import httpClient from '../../services/http/client';

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
   2) CALCULS ET UTILITAIRES
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
   FONCTION POUR RÉCUPÉRER TOUTES LES PAGES
   ========================================================================= */

const fetchAllPaginatedData = async (endpoint) => {
  console.log(`🔄 Début récupération de ${endpoint}`);
  
  let allData = [];
  let page = 1;
  let hasMore = true;
  let lastPage = 1;
  
  try {
    while (hasMore) {
      try {
        console.log(`📄 Chargement page ${page} de ${endpoint}...`);
        const response = await httpClient.get(endpoint, { 
          params: { page } 
        });
        
        const result = response.data;
        
        if (result && result.data !== undefined) {
          allData = [...allData, ...result.data];
          lastPage = result.last_page || 1;
          
          console.log(`   Page ${page}/${lastPage}: ${result.data.length} éléments`);
          
          if (page >= lastPage) {
            hasMore = false;
            console.log(`✅ ${endpoint}: ${allData.length} éléments récupérés (${lastPage} pages)`);
          } else {
            page++;
          }
        } else if (Array.isArray(result)) {
          allData = result;
          hasMore = false;
          console.log(`✅ ${endpoint}: ${allData.length} éléments récupérés (format direct)`);
        } else {
          allData = result || [];
          hasMore = false;
          console.log(`⚠️ ${endpoint}: Format inattendu, ${allData.length} éléments`);
        }
        
        if (page > 50) {
          console.warn("⚠️ Limite de sécurité atteinte (50 pages)");
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Erreur page ${page} de ${endpoint}:`, error);
        hasMore = false;
      }
    }
    
    return allData;
  } catch (error) {
    console.error(`❌ Erreur majeure pour ${endpoint}:`, error);
    throw error;
  }
};

/* =========================================================================
   3) COMPOSANT PRINCIPAL
   ========================================================================= */

export default function Products() {
  // --- ÉTATS GLOBAUX ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
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
  
  // --- MODALES CATÉGORIES ---
  const [categoryModal, setCategoryModal] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [categorySearchText, setCategorySearchText] = useState("");
  
  // --- PAGINATION FRONT ---
  const [pageSize, setPageSize] = useState(20);
  const [productsPage, setProductsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [adjustmentPage, setAdjustmentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("Tous");
  const [historySortBy, setHistorySortBy] = useState("date-desc");
  
  const [searchCategory, setSearchCategory] = useState("");

  /* =========================================================================
     4) CHARGEMENT DES DONNÉES - AVEC FOURNISSEURS
     ========================================================================= */
  
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("🚀 Chargement des données...");
      
      try {
        console.log("📦 Tentative avec per_page=1000...");
        const [productsResponse, categoriesResponse, fournisseursResponse] = await Promise.all([
          produitsAPI.getAll({ per_page: 1000 }),
          categoriesAPI.getAll({ per_page: 1000 }),
          fournisseursAPI.getAll({ per_page: 1000 })
        ]);
        
        const productsData = productsResponse.data || productsResponse;
        const categoriesData = categoriesResponse.data || categoriesResponse;
        const fournisseursData = fournisseursResponse.data || fournisseursResponse;
        
        let allProducts = Array.isArray(productsData) ? productsData : (productsData?.data || []);
        let allCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
        let allFournisseurs = Array.isArray(fournisseursData) ? fournisseursData : (fournisseursData?.data || []);
        
        console.log(`✅ Récupéré: ${allProducts.length} produits, ${allCategories.length} catégories, ${allFournisseurs.length} fournisseurs`);
        
        if (allProducts.length > 20 && allCategories.length > 20) {
          const transformedCategories = allCategories.map(cat => ({
            id: cat.id || cat.uuid,
            name: cat.nom || cat.name || "Sans nom",
            nom: cat.nom || "Sans nom",
            productCount: cat.product_count || cat.productCount || 0
          }));

          setProducts(allProducts);
          setCategories(transformedCategories);
          setFournisseurs(allFournisseurs);
          setIsDataLoaded(true);
          setLoading(false);
          return;
        }
      } catch (perPageError) {
        console.log("Méthode per_page échouée, passage à la méthode paginée...");
      }
      
      console.log("📦 Récupération paginée...");
      const allProducts = await fetchAllPaginatedData('/produits');
      const allCategories = await fetchAllPaginatedData('/categories');
      const allFournisseurs = await fetchAllPaginatedData('/fournisseurs');
      
      console.log(`🎯 RÉSULTAT: ${allProducts.length} produits, ${allCategories.length} catégories, ${allFournisseurs.length} fournisseurs`);
      
      const transformedCategories = allCategories.map(cat => ({
        id: cat.id || cat.uuid,
        name: cat.nom || cat.name || "Sans nom",
        nom: cat.nom || "Sans nom",
        productCount: cat.product_count || cat.productCount || 0
      }));

      setProducts(allProducts);
      setCategories(transformedCategories);
      setFournisseurs(allFournisseurs);
      setIsDataLoaded(true);

    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      alert("Erreur de chargement des données. Vérifiez la console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      console.log(`📊 ÉTAT FINAL - Produits: ${products.length}, Catégories: ${categories.length}, Fournisseurs: ${fournisseurs.length}`);
    }
  }, [isDataLoaded, products, categories, fournisseurs]);

  /* =========================================================================
     5) TRANSFORMATION DES DONNÉES
     ========================================================================= */
  
  const computedProducts = products.map((p) => {
    if (!p) return null;

    let categoryName = "Non classé";
    let categoryId = null;

    if (p.categorie_nom) {
      categoryName = p.categorie_nom;
    } else if (p.categorie_id) {
      categoryId = p.categorie_id;
      const foundCat = categories.find(c => c.id === p.categorie_id);
      if (foundCat) categoryName = foundCat.name || foundCat.nom || "Sans nom";
    } else if (p.categorie) {
      if (typeof p.categorie === 'object') {
        categoryName = p.categorie.nom || p.categorie.name || "Non classé";
        categoryId = p.categorie.id || p.categorie.uuid;
      } else {
        categoryName = p.categorie;
      }
    }

    // Trouver le nom du fournisseur depuis l'API
    let fournisseurNom = "Non spécifié";
    let fournisseurId = p.fournisseur_id || null;
    
    if (fournisseurId) {
      const foundFournisseur = fournisseurs.find(f => f.id === fournisseurId);
      if (foundFournisseur) {
        fournisseurNom = foundFournisseur.nom || foundFournisseur.name || "Non spécifié";
      }
    }

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
        fournisseur: fournisseurNom,
        fournisseur_id: fournisseurId
    };

    const totalPrice = computeTotalPrice(productUnified);
    const status = getStatus(productUnified.cartons, productUnified.stockMin);
    
    return { ...productUnified, totalPrice, status };
  }).filter(Boolean);

  /* =========================================================================
     6) FONCTIONS CRUD CORRIGÉES
     ========================================================================= */
  
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (!currentProduct.name.trim()) {
      alert("Le nom du produit est obligatoire.");
      return;
    }

    let categoryId = currentProduct.categoryId;
    if (!categoryId && currentProduct.category) {
      const selectedCat = categories.find(c => 
        (c.nom || c.name) === currentProduct.category
      );
      if (selectedCat) categoryId = selectedCat.id;
    }

    if (!categoryId) {
      alert("⚠️ La catégorie est obligatoire. Veuillez sélectionner une catégorie.");
      return;
    }

    // PRÉPARATION DU PAYLOAD DE BASE
    const apiPayload = {
      nom: String(currentProduct.name || "").trim(),
      categorie_id: String(categoryId),
      cartons: parseInt(currentProduct.cartons) || 0,
      unitsPerCarton: parseInt(currentProduct.unitsPerCarton) || 1,
      pricePerCarton: parseFloat(currentProduct.pricePerCarton) || 0,
      stockMin: parseInt(currentProduct.stockMin) || 5,
      stockIdeal: parseInt(currentProduct.stockIdeal) || 20
    };

    // ---------- GESTION DU CODE-BARRE (ÉVITE "code field is required" et "already taken") ----------
    const barcode = currentProduct.barcode ? currentProduct.barcode.trim() : '';
    
    if (modalType === "add") {
      // Création : on envoie le code s'il est non vide, sinon on envoie une chaîne vide
      // (selon la validation backend, le code peut être requis ou non)
      if (barcode !== '') {
        // Vérification d'unicité
        const codeExists = products.some(p => 
          (p.code === barcode || p.code_barre === barcode)
        );
        if (codeExists) {
          alert("❌ Ce code-barre est déjà utilisé par un autre produit.");
          return;
        }
        apiPayload.code = barcode;
      } else {
        apiPayload.code = ''; // envoi d'une chaîne vide
      }
    } else if (modalType === "edit") {
      // Modification : on envoie TOUJOURS le code (soit le nouveau, soit l'ancien)
      const originalProduct = products.find(p => p.id === currentProduct.id);
      const originalCode = originalProduct?.code || originalProduct?.code_barre || '';
      
      if (barcode !== '') {
        // Vérifier l'unicité seulement si le code a changé
        if (barcode !== originalCode) {
          const codeExists = products.some(p => 
            p.id !== currentProduct.id && 
            (p.code === barcode || p.code_barre === barcode)
          );
          if (codeExists) {
            alert("❌ Ce code-barre est déjà utilisé par un autre produit.");
            return;
          }
        }
        apiPayload.code = barcode;
      } else {
        // Code vide : on renvoie l'ancien code (qui peut être vide ou non)
        apiPayload.code = originalCode;
      }
    }

    // ---------- GESTION DU FOURNISSEUR ----------
    if (currentProduct.fournisseur_id && 
        currentProduct.fournisseur_id.trim() !== "" &&
        currentProduct.fournisseur_id !== "null") {
      
      const fournisseurExists = fournisseurs.some(f => f.id === currentProduct.fournisseur_id);
      if (fournisseurExists) {
        apiPayload.fournisseur_id = String(currentProduct.fournisseur_id).trim();
      }
    }

    try {
      if (modalType === "add") {
        await produitsAPI.create(apiPayload);
        alert("✅ Produit ajouté avec succès !");
        addHistoryEntry({
          product: currentProduct,
          type: "Création",
          before: null,
          after: currentProduct.cartons || 0
        });
      } else if (modalType === "edit") {
        await produitsAPI.update(currentProduct.id, apiPayload);
        alert("✅ Produit modifié !");
        addHistoryEntry({
          product: currentProduct,
          type: "Modification",
          before: products.find(p => p.id === currentProduct.id)?.cartons || 0,
          after: currentProduct.cartons || 0
        });
      }
      
      closeProductModal();
      await fetchData();

    } catch (error) {
      console.error("❌ Erreur détaillée:", error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.errors) {
          let errorMessage = "Erreurs de validation :\n";
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            errorMessage += `• ${field}: ${messages.join(', ')}\n`;
          });
          alert(errorMessage);
        } else if (errorData.message) {
          if (errorData.message.includes("code has been already taken")) {
            alert("❌ Ce code-barre est déjà utilisé par un autre produit. Veuillez en choisir un autre.");
          } else if (errorData.message.includes("foreign key constraint fails")) {
            alert("❌ Erreur: Le fournisseur sélectionné n'existe pas.");
          } else {
            alert(`❌ Erreur: ${errorData.message}`);
          }
        } else {
          alert("❌ Une erreur est survenue lors de la sauvegarde.");
        }
      } else if (error.message) {
        alert("❌ Erreur: " + error.message);
      } else {
        alert("❌ Erreur inconnue lors de la sauvegarde.");
      }
    }
  };

  const addHistoryEntry = ({ product, type, before, after }) => {
    const entry = {
      id: Date.now(),
      productName: product?.name || "Produit",
      type,
      date: new Date().toLocaleString("fr-FR"),
      before: before !== undefined ? before : null,
      after: after !== undefined ? after : null,
      manager: "Utilisateur"
    };
    setHistory(prev => [entry, ...prev]);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteId) return;

    // Confirmation simple
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.");
    
    if (!confirmDelete) {
      setDeleteId(null);
      return;
    }

    try {
      await produitsAPI.delete(deleteId);
      alert("✅ Produit supprimé avec succès !");
      
      // Ajouter à l'historique
      const productToDelete = products.find(p => p.id === deleteId);
      if (productToDelete) {
        addHistoryEntry({
          product: productToDelete,
          type: "Suppression",
          before: productToDelete.cartons || 0,
          after: null
        });
      }
      
      setDeleteId(null);
      await fetchData();

    } catch (error) {
      console.error("Erreur suppression:", error);
      
      let errorMessage = "❌ Erreur lors de la suppression.";
      
      if (error.response?.data?.message) {
        const msg = error.response.data.message;
        
        if (msg.includes("associé") || msg.includes("vente") || msg.includes("1451") || 
            msg.includes("Cannot delete") || msg.includes("foreign key constraint")) {
          errorMessage = "❌ Impossible de supprimer ce produit car il est associé à des ventes.\n\n" +
                        "Solutions suggérées:\n" +
                        "1. Désactivez le produit au lieu de le supprimer\n" +
                        "2. Archivez les ventes associées d'abord\n" +
                        "3. Contactez l'administrateur si nécessaire";
        } else {
          errorMessage = `❌ ${msg}`;
        }
      }
      
      alert(errorMessage);
      setDeleteId(null);
    }
  };

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
      alert(`❌ Impossible de diminuer de ${qty}. Stock actuel : ${currentStock}.`);
      return;
    }

    try {
      // UTILISATION DES ROUTES DÉDIÉES (SANS CODE)
      if (adjustAction === "reappro") {
        await produitsAPI.reapprovisionner(product.id, qty);
        alert("✅ Stock réapprovisionné avec succès !");
      } else if (adjustAction === "diminue") {
        await produitsAPI.diminuerStock(product.id, qty);
        alert("✅ Stock diminué avec succès !");
      }
      
      // Ajouter à l'historique
      addHistoryEntry({
        product: adjustProduct,
        type: adjustAction === "reappro" ? "Réapprovisionnement" : "Diminution",
        before: currentStock,
        after: adjustAction === "reappro" ? currentStock + qty : currentStock - qty
      });
      
      closeAdjustModal();
      await fetchData();

    } catch (error) {
      console.error("❌ Erreur ajustement:", error);
      
      if (error.response?.data?.message) {
        alert(`❌ ${error.response.data.message}`);
      } else {
        alert("❌ Erreur lors de la mise à jour du stock.");
      }
    }
  };

  /* =========================================================================
     7) GESTION CATÉGORIES
     ========================================================================= */
  const openAddCategoryModal = () => {
    setCategoryModal("add");
    setCurrentCategory({ id: null, name: "" });
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
      nom: String(currentCategory.name).trim()
    };

    try {
      if (categoryModal === "add") {
        await categoriesAPI.create(catData);
        alert("✅ Catégorie créée avec succès !");
      } else {
        if (!currentCategory.id) {
          alert("❌ ID de catégorie manquant.");
          return;
        }
        await categoriesAPI.update(currentCategory.id, catData);
        alert("✅ Catégorie modifiée avec succès !");
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
        await categoriesAPI.delete(deleteCategoryId);
        alert("✅ Catégorie supprimée avec succès !");
        setDeleteCategoryId(null);
        await fetchData();
        
    } catch(err) {
        console.error("Erreur suppression catégorie:", err);
        
        if (err.response?.data?.message) {
            alert(`❌ ${err.response.data.message}`);
        } else {
            alert("❌ Erreur lors de la suppression.");
        }
        setDeleteCategoryId(null);
    }
  };

  const handleCategoryFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory((prev) => ({ ...prev, [name]: value }));
  };

  /* =========================================================================
     8) FILTRES ET PAGINATION FRONTEND
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
     9) GESTION MODALES
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
      fournisseur: "",
      fournisseur_id: ""
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
      fournisseur: product.fournisseur || "",
      fournisseur_id: product.fournisseur_id || ""
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
     10) AJUSTEMENT DE STOCK
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
    setAdjustModalOpen(true);
  };

  const closeAdjustModal = () => {
    setAdjustModalOpen(false);
    setAdjustProduct(null);
    setAdjustAction(null);
    setAdjustQuantity("");
  };

  const ruptureList = alertFiltered.filter((p) => p.status?.label === "Rupture");
  const critiqueList = alertFiltered.filter((p) => p.status?.label === "Critique");
  const faibleList = alertFiltered.filter((p) => p.status?.label === "Faible");

  /* =========================================================================
     11) HISTORIQUE
     ========================================================================= */
  const filteredHistory = history.filter(h => 
    h.type === "Modification" || h.type === "Suppression" || h.type === "Création"
  );
  
  const searchedHistory = filteredHistory.filter((h) => {
    if (!historySearch) return true;
    const term = historySearch.toLowerCase();
    return (
      (h.productName || "").toLowerCase().includes(term) ||
      (h.type || "").toLowerCase().includes(term)
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
     12) CATÉGORIES
     ========================================================================= */
  const filteredCategories = categories.filter((cat) => {
      const term = (searchCategory || "").toLowerCase();
      const nameSafe = String(cat.name || cat.nom || "").toLowerCase();
      return nameSafe.includes(term);
  });

  const totalCategoriesPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const currentCategoriesPage = Math.min(categoriesPage, totalCategoriesPages);
  const startCategoriesIndex = (currentCategoriesPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(startCategoriesIndex, startCategoriesIndex + pageSize);

  /* =========================================================================
     13) COMPOSANT PAGINATION
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
     14) RENDU
     ========================================================================= */
  return (
    <div className="depot-page space-y-6 font-sans text-slate-800 bg-gray-50 min-h-screen p-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FaWarehouse className="text-[#472EAD]" />
            Gestion Avancée des Produits
          </h1>
          {isDataLoaded && (
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FaBoxOpen /> {products.length} produits
              </span>
              <span className="bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FaFolder /> {categories.length} catégories
              </span>
              <span className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
                <FaTruck /> {fournisseurs.length} fournisseurs
              </span>
            </div>
          )}
        </div>

        {activeTab === "liste" && (
          <button onClick={openAddModal} className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-transform active:scale-95">
            <FaPlus /> Nouveau Produit
          </button>
        )}

        {activeTab === "categories" && (
          <button onClick={openAddCategoryModal} className="flex items-center gap-2 bg-gradient-to-r from-[#472EAD] to-[#F58020] hover:from-[#3a2590] hover:to-[#e06b00] text-white px-5 py-2.5 rounded-lg shadow-md transition-all">
            <FaFolderPlus className="text-white"/> Nouvelle Catégorie
          </button>
        )}
      </div>

      {/* ONGLETS */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto">
        {["liste", "ajustement", "historique", "categories"].map((tab) => (
          <button key={tab} onClick={() => { 
            setActiveTab(tab); 
            if (tab === "liste") setProductsPage(1);
            if (tab === "ajustement") setAdjustmentPage(1);
            if (tab === "historique") setHistoryPage(1);
            if (tab === "categories") setCategoriesPage(1);
          }}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg border-b-2 ${
            activeTab === tab
              ? "border-[#472EAD] text-[#472EAD] bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}>
            <span className="inline-flex items-center gap-2">
              {tab === "liste" && <><FaList /> Liste des Produits</>}
              {tab === "ajustement" && <><FaSlidersH /> Ajustement de Stock</>}
              {tab === "historique" && <><FaHistory /> Historique</>}
              {tab === "categories" && <><FaFolder /> Catégories</>}
            </span>
          </button>
        ))}
      </div>

      {/* CHARGEMENT */}
      {loading && (
        <div className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] p-4 rounded-lg border border-[#472EAD]">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#472EAD]"></div>
            <div>
              <p className="font-semibold text-[#472EAD]">Chargement en cours...</p>
              <p className="text-sm text-slate-600">Récupération de tous les produits, catégories et fournisseurs</p>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET LISTE */}
      {activeTab === "liste" && (
        <div className="animate-fade-in space-y-6">
          {/* Barre d'outils */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="text-sm text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">
                  <span className="font-bold text-[#472EAD]">{computedProducts.length}</span> produits au total
                </div>
                <div className="relative w-full md:w-96">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                    value={searchProducts} onChange={(e) => { setSearchProducts(e.target.value); setProductsPage(1); }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setProductsPage(1); }}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none">
                  <option value="Toutes">Toutes catégories</option>
                  {Array.from(new Set(computedProducts.map(p => p.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setProductsPage(1); }}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none">
                  <option value="Tous">Tous les statuts</option>
                  <option value="Normal">Normal</option>
                  <option value="Faible">Faible</option>
                  <option value="Critique">Critique</option>
                  <option value="Rupture">Rupture</option>
                </select>

                <div className="flex items-center border border-slate-300 rounded-lg bg-white px-3 py-2 gap-2">
                  <FaSortAlphaDown className="text-slate-400" />
                  <select value={sortMode} onChange={(e) => { setSortMode(e.target.value); setProductsPage(1); }}
                    className="bg-transparent outline-none text-sm cursor-pointer focus:ring-2 focus:ring-[#472EAD]">
                    <option value="name-asc">Nom (A-Z)</option>
                    <option value="name-desc">Nom (Z-A)</option>
                    <option value="stock-asc">Stock (Croissant)</option>
                    <option value="stock-desc">Stock (Décroissant)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Cartes Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="p-3 bg-white/20 text-white rounded-lg"><FaCoins size={20}/></div>
              <div><p className="text-xs text-white/90 uppercase font-bold">Valeur Stock</p><p className="text-xl font-bold text-white">{totalValue.toLocaleString("fr-FR")} F</p></div>
            </div>
            <div className="bg-gradient-to-r from-[#F58020] to-[#FFA94D] rounded-xl shadow-sm p-4 flex items-center gap-4">
               <div className="p-3 bg-white/20 text-white rounded-lg"><FaExclamationTriangle size={20}/></div>
               <div><p className="text-xs text-white/90 uppercase font-bold">Faible</p><p className="text-xl font-bold text-white">{nbFaible}</p></div>
            </div>
            <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl shadow-sm p-4 flex items-center gap-4">
               <div className="p-3 bg-white/20 text-white rounded-lg"><FaFire size={20}/></div>
               <div><p className="text-xs text-white/90 uppercase font-bold">Critique</p><p className="text-xl font-bold text-white">{nbCritique}</p></div>
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
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F7F5FF]/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="p-4 text-center font-mono text-slate-500 text-xs">{p.barcode || "-"}</td>
                      <td className="p-4 text-center"><span className="inline-block bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] px-2 py-1 rounded text-xs font-medium">{p.category}</span></td>
                      <td className="p-4 text-center">
                        {p.fournisseur ? <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F0F9FF] to-[#F0FDF4] text-[#472EAD] px-2 py-1 rounded text-xs"><FaTruck className="text-[10px]" /> {p.fournisseur}</span> : <span className="text-slate-300 text-xs">-</span>}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">{p.cartons}</td>
                      <td className="p-4 text-center text-slate-500">{p.unitsPerCarton}</td>
                      <td className="p-4 text-right font-mono text-slate-600">{Number(p.pricePerCarton).toLocaleString("fr-FR")}</td>
                      <td className="p-4 text-right font-mono font-bold text-[#472EAD]">{Number(p.totalPrice).toLocaleString("fr-FR")}</td>
                      <td className="p-4 text-center text-[#F58020] font-medium">{p.stockMin}</td>
                      <td className="p-4 text-center"><StatusBadge status={p.status} /></td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(p)} className="p-1.5 text-[#472EAD] hover:bg-[#F7F5FF] rounded transition-colors" title="Modifier">
                            <FaEdit />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-[#DC2626] hover:bg-red-50 rounded transition-colors" title="Supprimer">
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedProducts.length === 0 && (
                    <tr><td colSpan={11} className="p-8 text-center text-slate-400 italic">
                      {loading ? "Chargement en cours..." : "Aucun produit trouvé."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredProducts.length > 0 && (
              <div className="p-4 border-t border-slate-200">
                <Pagination currentPage={currentProductsPage} totalPages={totalProductsPages} onPageChange={setProductsPage} filteredCount={filteredProducts.length} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET AJUSTEMENT */}
      {activeTab === "ajustement" && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3">
            <FaSearch className="text-[#472EAD]" />
            <input type="text" placeholder="Rechercher pour ajuster..." className="flex-1 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#472EAD]"
              value={searchProducts} onChange={(e) => { setSearchProducts(e.target.value); setAdjustmentPage(1); }} />
          </div>

          {/* Kanban Alertes */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><FaExclamationTriangle className="text-[#F58020]" />Produits nécessitant attention</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[["Rupture", ruptureList, "bg-gradient-to-r from-[#6B7280]/10 to-[#9CA3AF]/10", "gray", <FaTimesCircle />],
                ["Critique", critiqueList, "bg-gradient-to-r from-[#DC2626]/10 to-[#EF4444]/10", "red", <FaFire />],
                ["Faible", faibleList, "bg-gradient-to-r from-[#F58020]/10 to-[#FFA94D]/10", "[#F58020]", <FaArrowDown />]].map(([title, list, bgColor, color, icon]) => (
                <div key={title} className={`${bgColor} rounded-xl border p-3`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`font-bold text-${color}-700 text-xs uppercase flex items-center gap-2`}>{icon} {title}</span>
                    <span className={`bg-${color}-100 text-${color}-700 text-xs font-bold px-2 py-0.5 rounded-full`}>{list.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {list.map((p) => (
                      <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-700 text-sm truncate">{p.name}</span>
                          <FaBoxOpen className="text-gray-400" />
                        </div>
                        <div className="text-xs text-slate-500 mb-2">Stock: <span className={`font-bold text-${color}-600`}>{p.cartons} ctn</span></div>
                        <button onClick={() => openAdjust(p, 'reappro')} className="w-full py-1.5 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white text-xs font-bold rounded hover:opacity-90 transition flex items-center justify-center gap-1">
                          <FaArrowUp /> Réappro
                        </button>
                      </div>
                    ))}
                    {list.length === 0 && <p className="text-xs text-center text-slate-400 italic py-4">Aucun produit.</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau tous produits */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0]">
              <h3 className="font-bold text-[#472EAD] flex items-center gap-2"><FaList className="text-[#472EAD]"/> Tous les produits ({allAdjustFiltered.length})</h3>
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
                      <td className="p-3 text-center font-bold text-slate-700">{p.cartons} <span className="text-xs font-normal text-slate-400">ctn</span></td>
                      <td className="p-3 text-center"><StatusBadge status={p.status} /></td>
                      <td className="p-3 text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openAdjust(p, 'reappro')} className="p-2 bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] text-white rounded hover:opacity-90" title="Réapprovisionner">
                            <FaPlus size={12} />
                          </button>
                          <button onClick={() => openAdjust(p, 'diminue')} className="p-2 bg-gradient-to-r from-[#F58020] to-[#FFA94D] text-white rounded hover:opacity-90" title="Diminuer">
                            <FaArrowDown size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalAdjustmentPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex justify-center gap-2">
                <button disabled={currentAdjustmentPage === 1} onClick={() => setAdjustmentPage(prev => prev - 1)} className="px-3 py-1 border rounded text-xs disabled:opacity-50 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] hover:opacity-90">Précédent</button>
                <span className="text-xs flex items-center text-[#472EAD] font-bold">Page {currentAdjustmentPage} / {totalAdjustmentPages}</span>
                <button disabled={currentAdjustmentPage === totalAdjustmentPages} onClick={() => setAdjustmentPage(prev => prev + 1)} className="px-3 py-1 border rounded text-xs disabled:opacity-50 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] text-[#472EAD] hover:opacity-90">Suivant</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET HISTORIQUE */}
      {activeTab === "historique" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-[#472EAD]" />
                <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none"
                  value={historySearch} onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  <FaFilter className="inline mr-1" />Type d'action
                </label>
                <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" value={historyTypeFilter} onChange={(e) => { setHistoryTypeFilter(e.target.value); setHistoryPage(1); }}>
                  <option value="Tous">Tous les types</option>
                  <option value="Modification">Modifications</option>
                  <option value="Suppression">Suppressions</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">
                  <FaSortAmountDown className="inline mr-1" />Trier par
                </label>
                <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" value={historySortBy} onChange={(e) => { setHistorySortBy(e.target.value); setHistoryPage(1); }}>
                  <option value="date-desc">Date (récent → ancien)</option>
                  <option value="date-asc">Date (ancien → récent)</option>
                </select>
              </div>
            </div>
            <div className="mt-3 text-sm text-[#472EAD] font-semibold">
              {sortedHistory.length} action(s) trouvée(s){historySearch && ` pour "${historySearch}"`}{historyTypeFilter !== "Tous" && ` • Type: ${historyTypeFilter}`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1"><FaHistory className="text-white" /><span>Total Historique</span></p>
              <p className="text-2xl font-semibold mt-2 text-white">{filteredHistory.length}</p>
            </div>
            <div className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1"><FaEdit className="text-white" /><span>Modifications</span></p>
              <p className="text-2xl font-semibold mt-2 text-white">{filteredHistory.filter(h => h.type === "Modification").length}</p>
            </div>
            <div className="bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1"><FaTrashAlt className="text-white" /><span>Suppressions</span></p>
              <p className="text-2xl font-semibold mt-2 text-white">{filteredHistory.filter(h => h.type === "Suppression").length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] border-b text-[#472EAD]">
                <tr>
                  <th className="p-3 text-left">Date & Heure</th>
                  <th className="p-3 text-left">Produit</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Détails stock</th>
                  <th className="p-3 text-left">Gestionnaire</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.length > 0 ? paginatedHistory.map((item, index) => (
                  <tr key={item.id || index} className="border-t hover:bg-[#F7F5FF]/30 transition-colors">
                    <td className="p-3 text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-[#472EAD]" />{item.date || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-[#472EAD] flex items-center gap-2">
                        <FaBoxOpen />{item.productName || "Produit inconnu"}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                        item.type === "Modification" ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200" : 
                        item.type === "Suppression" ? "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200" : 
                        item.type === "Création" ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200" : 
                        item.type === "Réapprovisionnement" ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200" : 
                        "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200"
                      }`}>
                        {getTypeIcon(item.type)}{item.type}
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
          {sortedHistory.length > 0 && (
            <Pagination currentPage={currentHistoryPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} filteredCount={sortedHistory.length} />
          )}
        </>
      )}

      {/* ONGLET CATÉGORIES */}
      {activeTab === "categories" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-3">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm bg-slate-50 px-3 py-1 rounded-lg">
                  <span className="font-bold text-[#472EAD]">{filteredCategories.length}</span> catégories
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#472EAD]" />
                  <input type="text" placeholder="Rechercher..." className="pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] w-full md:w-64"
                    value={searchCategory} onChange={(e) => { setSearchCategory(e.target.value); setCategoriesPage(1); }} />
                </div>
              </div>
              <FaFilter className="text-[#472EAD]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-[#472EAD] to-[#6D5BD0] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1"><FaFolder className="text-white" /><span>Total Catégories</span></p>
              <p className="text-2xl font-semibold mt-2 text-white">{categories.length}</p>
            </div>
            <div className="bg-gradient-to-r from-[#F58020] to-[#FFA94D] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1"><FaBoxOpen className="text-white" /><span>Catégories utilisées</span></p>
              <p className="text-2xl font-semibold mt-2 text-white">{categories.filter(c => c.productCount > 0).length}</p>
            </div>
            <div className="bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-xl shadow-sm p-4">
              <p className="text-xs text-white/90 flex items-center gap-1"><FaSortAmountDown className="text-white" /><span>Catégorie la plus utilisée</span></p>
              <p className="text-2xl font-semibold mt-2 text-white">{categories.length > 0 ? categories.reduce((prev, current) => (prev.productCount > current.productCount) ? prev : current).name || "Aucune" : "Aucune"}</p>
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
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cat.productCount > 0 ? "bg-gradient-to-r from-green-100 to-green-50 text-green-700" : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600"
                      }`}>
                        {cat.productCount || 0} produit(s)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openEditCategoryModal(cat)} className="inline-flex items-center gap-1 text-[#472EAD] hover:text-[#3a2590] hover:underline text-xs">
                          <FaEdit /><span>Modifier</span>
                        </button>
                        <button onClick={() => setDeleteCategoryId(cat.id)} className="inline-flex items-center gap-1 text-xs text-[#F58020] hover:text-red-600 hover:underline">
                          <FaTrashAlt /><span>Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedCategories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <div className="text-gray-400">
                        <FaFolder className="text-4xl mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-[#472EAD]">
                          {filteredCategories.length === 0 ? "Aucune catégorie trouvée" : "Aucune catégorie sur cette page."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredCategories.length > 0 && (
            <Pagination currentPage={currentCategoriesPage} totalPages={totalCategoriesPages} onPageChange={setCategoriesPage} filteredCount={filteredCategories.length} />
          )}
        </>
      )}

      {/* MODALES PRODUITS */}
      {modalType && currentProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaBoxOpen className="text-[#472EAD]" />
              {modalType === "add" ? "Nouveau Produit" : "Modifier le Produit"}
            </h2>
            <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Nom du produit *</label>
                <input type="text" name="name" value={currentProduct.name} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Catégorie <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <select name="categoryId" value={currentProduct.categoryId || ""} onChange={(e) => {
                      const selectedValue = e.target.value;
                      setCurrentProduct(prev => ({ ...prev, categoryId: selectedValue }));
                      if (selectedValue) {
                        const selectedCat = categories.find(c => c.id === selectedValue);
                        if (selectedCat) setCurrentProduct(prev => ({ ...prev, category: selectedCat.name }));
                      } else setCurrentProduct(prev => ({ ...prev, category: "" }));
                    }} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none appearance-none" required>
                      <option value="">-- Sélectionnez une catégorie --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <FaChevronDown className="text-[#472EAD] pointer-events-none -ml-8" />
                  </div>
                  <div className="mt-1 text-xs text-[#472EAD] flex items-center justify-between">
                    <span>{categories.length} catégories</span>
                    <button type="button" onClick={() => { setModalType(null); setTimeout(() => setActiveTab("categories"), 100); }} className="text-[#472EAD] hover:text-[#3a2590] hover:underline flex items-center gap-1">
                      <FaFolderPlus className="text-xs" /><span>Gérer les catégories</span>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Fournisseur</label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <select 
                      name="fournisseur_id" 
                      value={currentProduct.fournisseur_id || ""} 
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        setCurrentProduct(prev => ({ 
                          ...prev, 
                          fournisseur_id: selectedValue,
                          fournisseur: selectedValue ? 
                            fournisseurs.find(f => f.id === selectedValue)?.nom || "" 
                            : ""
                        }));
                      }} 
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none appearance-none"
                    >
                      <option value="">-- Aucun fournisseur --</option>
                      {fournisseurs.map(fournisseur => (
                        <option key={fournisseur.id} value={fournisseur.id}>
                          {fournisseur.nom}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="text-[#472EAD] pointer-events-none -ml-8" />
                  </div>
                  <div className="mt-1 text-xs text-[#472EAD]">
                    <span>{fournisseurs.length} fournisseurs disponibles</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Code-barre</label>
                <input type="text" name="barcode" value={currentProduct.barcode} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" placeholder="Code unique (facultatif)" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Prix par carton (F)</label>
                <input type="number" name="pricePerCarton" value={currentProduct.pricePerCarton} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Cartons en stock</label>
                <input type="number" name="cartons" value={currentProduct.cartons} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" min="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Unités par carton *</label>
                <input type="number" name="unitsPerCarton" value={currentProduct.unitsPerCarton} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" min="1" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Stock minimum (cartons)</label>
                <input type="number" name="stockMin" value={currentProduct.stockMin} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" min="0" placeholder="Ex: 5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Stock idéal (cartons)</label>
                <input type="number" name="stockIdeal" value={currentProduct.stockIdeal} onChange={handleProductFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" min="0" />
              </div>
              <div className="col-span-full text-sm text-[#472EAD] font-semibold mt-2 flex items-center gap-2 bg-gradient-to-r from-[#F7F5FF] to-[#FFF5F0] p-3 rounded-lg">
                <FaBoxes />
                <span>Stock global estimé : {Number(currentProduct.cartons || 0) * Number(currentProduct.unitsPerCarton || 1)} unités</span>
              </div>
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

      {/* MODALES CATÉGORIES */}
      {categoryModal && currentCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaFolder className="text-[#472EAD]" />
              {categoryModal === "add" ? "Nouvelle Catégorie" : "Modifier la Catégorie"}
            </h2>
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Nom de la catégorie <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={currentCategory.name || ""} onChange={handleCategoryFieldChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#472EAD] focus:border-[#472EAD] outline-none" required placeholder="Ex: Papeterie..." />
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
              <button onClick={handleConfirmDeleteProduct} className="px-4 py-2 text-sm rounded bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white hover:opacity-90 inline-flex items-center gap-2">
                <FaTrashAlt /><span>Supprimer</span>
              </button>
            </div>
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

      {/* MODALE AJUSTEMENT STOCK */}
      {adjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#472EAD]">
              <FaSlidersH className="text-[#472EAD]" />
              {adjustAction === "reappro" ? "Réapprovisionner le stock" : "Diminuer le stock"}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Produit : <span className="font-semibold text-[#472EAD]">{adjustProduct.name}</span> ({adjustProduct.category})<br />
              Stock actuel : <span className="font-semibold text-[#F58020]">{adjustProduct.cartons}</span> cartons
            </p>
            <form onSubmit={handleSubmitAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#472EAD] mb-1">Quantité (en cartons) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={adjustAction === "diminue" ? adjustProduct.cartons : undefined} 
                  value={adjustQuantity} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (adjustAction === "diminue" && val > adjustProduct.cartons) {
                      alert(`Vous ne pouvez pas diminuer plus de ${adjustProduct.cartons} cartons.`);
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
    </div>
  );
}
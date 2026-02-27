// src/gestionnaire-depot/hooks/useProducts.js
import { useState, useCallback, useEffect } from 'react';
import { produitsAPI } from '../../services/api/produits';

export function useProducts(initialPage = 1, perPage = 20) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (page = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`📦 Fetching products page ${page}, per_page=${perPage}`);
      const result = await produitsAPI.getAll({ page, per_page: perPage });
      console.log("🔍 Réponse brute de l'API produits :", result);

      // Analyse de la structure de la réponse
      if (Array.isArray(result)) {
        console.log("✅ La réponse est un tableau de", result.length, "produits");
        setProducts(result);
        setTotal(result.length);
        setTotalPages(1);
      } 
      else if (result && typeof result === 'object' && result.data !== undefined) {
        console.log("✅ Réponse paginée :", result.data.length, "produits sur", result.total, "total");
        setProducts(result.data || []);
        setTotal(result.total || 0);
        setTotalPages(result.last_page || 1);
      }
      else {
        console.warn("⚠️ Format de réponse non reconnu :", result);
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("❌ Erreur lors de l'appel API produits :", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  // Charger la première page au montage du hook
  useEffect(() => {
    fetchProducts(initialPage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recharger la page courante
  const refetch = useCallback(() => {
    return fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  // Aller à une page spécifique - CORRIGÉ
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchProducts(page); // ✅ AJOUTÉ
    }
  }, [totalPages, fetchProducts]);

  // Ajouter un produit
  const addProduct = useCallback(async (productData) => {
    try {
      const newProduct = await produitsAPI.create(productData);
      // Revenir à la première page
      setCurrentPage(1);
      await fetchProducts(1);
      return newProduct;
    } catch (error) {
      throw error;
    }
  }, [fetchProducts]);

  // Mettre à jour un produit
  const updateProduct = useCallback(async (id, productData) => {
    try {
      const updated = await produitsAPI.update(id, productData);
      setProducts(prev =>
        prev.map(p => p.id === id ? { ...p, ...updated } : p)
      );
      return updated;
    } catch (error) {
      throw error;
    }
  }, []);

  // Supprimer un produit
  const deleteProduct = useCallback(async (id) => {
    try {
      await produitsAPI.delete(id);
      setProducts(prev => {
        const newProducts = prev.filter(p => p.id !== id);
        if (newProducts.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        return newProducts;
      });
      setTotal(prev => prev - 1);
    } catch (error) {
      throw error;
    }
  }, [currentPage]);

  // Réapprovisionner
  const reapprovisionner = useCallback(async (produitId, quantite) => {
    try {
      const result = await produitsAPI.reapprovisionner(produitId, quantite);
      setProducts(prev =>
        prev.map(p => p.id === produitId
          ? { ...p, nombre_carton: (p.nombre_carton || 0) + quantite }
          : p
        )
      );
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Diminuer le stock
  const diminuerStock = useCallback(async (produitId, quantite) => {
    try {
      const result = await produitsAPI.diminuerStock(produitId, quantite);
      setProducts(prev =>
        prev.map(p => p.id === produitId
          ? { ...p, nombre_carton: Math.max(0, (p.nombre_carton || 0) - quantite) }
          : p
        )
      );
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    products,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    fetchProducts,
    goToPage,
    addProduct,
    updateProduct,
    deleteProduct,
    reapprovisionner,
    diminuerStock,
    refetch,
  };
}
// src/gestionnaire-depot/hooks/useProducts.js
import { useState, useCallback, useEffect } from 'react';
import { produitsAPI } from '../../services/api/produits';
import toast from 'react-hot-toast';

export function useProducts(initialPage = 1, perPage = 20, searchTerm = '', filterKey = 0) {
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
      // Paramètres avec recherche
      const params = { 
        page, 
        per_page: perPage
      };
      
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      
      console.log(`📦 Fetching products page ${page} avec recherche:`, params);
      const result = await produitsAPI.getAll(params);

      if (Array.isArray(result)) {
        setProducts(result);
        setTotal(result.length);
        setTotalPages(1);
      } 
      else if (result && typeof result === 'object' && result.data !== undefined) {
        setProducts(result.data || []);
        setTotal(result.total || 0);
        setTotalPages(result.last_page || 1);
      }
      else {
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("❌ Erreur lors de l'appel API produits :", err);
      setError(err);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [filterKey]);

  const refetch = useCallback(() => {
    return fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchProducts(page);
    }
  }, [totalPages, fetchProducts]);

  const addProduct = useCallback(async (productData) => {
    try {
      const newProduct = await produitsAPI.create(productData);
      toast.success("✅ Produit ajouté avec succès !");
      setCurrentPage(1);
      await fetchProducts(1);
      return newProduct;
    } catch (error) {
      console.error("❌ Erreur addProduct:", error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        let errorMsg = "Erreurs de validation:\n";
        Object.entries(errors).forEach(([field, messages]) => {
          errorMsg += `• ${field}: ${messages.join(', ')}\n`;
        });
        toast.error(errorMsg);
      } else if (error.response?.data?.message) {
        toast.error(`❌ ${error.response.data.message}`);
      } else {
        toast.error("❌ Une erreur est survenue.");
      }
      throw error;
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id, productData) => {
    try {
      const updated = await produitsAPI.update(id, productData);
      setProducts(prev =>
        prev.map(p => p.id === id ? { ...p, ...updated } : p)
      );
      toast.success("✅ Produit modifié avec succès !");
      return updated;
    } catch (error) {
      console.error("❌ Erreur updateProduct:", error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        let errorMsg = "Erreurs de validation:\n";
        Object.entries(errors).forEach(([field, messages]) => {
          errorMsg += `• ${field}: ${messages.join(', ')}\n`;
        });
        toast.error(errorMsg);
      } else if (error.response?.data?.message) {
        toast.error(`❌ ${error.response.data.message}`);
      } else {
        toast.error("❌ Une erreur est survenue.");
      }
      throw error;
    }
  }, []);

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
      toast.success("✅ Produit supprimé avec succès !");
    } catch (error) {
      console.error("❌ Erreur deleteProduct:", error);
      toast.error("❌ Erreur lors de la suppression");
      throw error;
    }
  }, [currentPage]);

  const reapprovisionner = useCallback(async (produitId, quantite) => {
    try {
      const result = await produitsAPI.reapprovisionner(produitId, quantite);
      setProducts(prev =>
        prev.map(p => p.id === produitId
          ? { ...p, nombre_carton: (p.nombre_carton || 0) + quantite }
          : p
        )
      );
      toast.success("✅ Stock réapprovisionné !");
      return result;
    } catch (error) {
      console.error("❌ Erreur reapprovisionner:", error);
      toast.error("❌ Erreur lors du réapprovisionnement");
      throw error;
    }
  }, []);

  const diminuerStock = useCallback(async (produitId, quantite) => {
    try {
      const result = await produitsAPI.diminuerStock(produitId, quantite);
      setProducts(prev =>
        prev.map(p => p.id === produitId
          ? { ...p, nombre_carton: Math.max(0, (p.nombre_carton || 0) - quantite) }
          : p
        )
      );
      toast.success("✅ Stock diminué !");
      return result;
    } catch (error) {
      console.error("❌ Erreur diminuerStock:", error);
      toast.error("❌ Erreur lors de la diminution du stock");
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
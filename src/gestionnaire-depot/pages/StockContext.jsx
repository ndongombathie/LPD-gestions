import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { produitsAPI } from '../../services/api/produits';
import { categoriesAPI } from '../../services/api/categories';
import { fournisseursAPI } from '../../services/api/fournisseurs';
import { mouvementsAPI } from '../../services/api/mouvements';

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  };

  const loadProducts = useCallback(async () => {
    try {
      const response = await produitsAPI.getAll({ per_page: 1000 });
      const productsData = normalizeArray(response);
      setProducts(productsData);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll({ per_page: 1000 });
      const categoriesData = normalizeArray(response);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setCategories([]);
    }
  }, []);

  const loadFournisseurs = useCallback(async () => {
    try {
      const response = await fournisseursAPI.getAll({ per_page: 1000 });
      const fournisseursData = normalizeArray(response);
      setFournisseurs(fournisseursData);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
      setFournisseurs([]);
    }
  }, []);

  const loadMovements = useCallback(async () => {
    try {
      const response = await mouvementsAPI.getAllPaginated();
      const movementsData = normalizeArray(response);
      setMovements(movementsData);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
      setMovements([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadFournisseurs(),
        loadMovements(),
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadCategories, loadFournisseurs, loadMovements]);

  useEffect(() => {
    refreshAll();
  }, []);

  const value = {
    products,
    categories,
    fournisseurs,
    movements,
    loading,
    refreshAll,
    refreshProducts: loadProducts,
    refreshCategories: loadCategories,
    refreshFournisseurs: loadFournisseurs,
    refreshMovements: loadMovements,
  };

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
};
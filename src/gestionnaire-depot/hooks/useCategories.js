// src/gestionnaire-depot/hooks/useCategories.js
import { useState, useEffect, useCallback } from 'react';
import { categoriesAPI } from '../../services/api/categories';
import toast from 'react-hot-toast';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("📦 Récupération de toutes les catégories...");
      
      const firstPage = await categoriesAPI.getAll({ page: 1, per_page: 10 });
      
      let allCategories = [];
      let totalCount = 0;
      const perPage = 10;
      
      if (Array.isArray(firstPage)) {
        allCategories = firstPage;
        totalCount = firstPage.length;
      } else if (firstPage?.data) {
        allCategories = firstPage.data;
        totalCount = firstPage.total || firstPage.data.length;
      }
      
      const totalPages = Math.ceil(totalCount / perPage);
      
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(categoriesAPI.getAll({ page, per_page: perPage }));
        }
        
        const otherPages = await Promise.all(promises);
        
        otherPages.forEach(pageData => {
          if (Array.isArray(pageData)) {
            allCategories = allCategories.concat(pageData);
          } else if (pageData?.data) {
            allCategories = allCategories.concat(pageData.data);
          }
        });
      }
      
      const normalized = allCategories.map(cat => ({
        id: cat.id || cat.uuid,
        nom: cat.nom || cat.name || 'Sans nom',
        name: cat.nom || cat.name || 'Sans nom',
        ...cat
      }));
      
      console.log(`✅ ${normalized.length} catégories chargées`);
      setCategories(normalized);
      setTotal(normalized.length);
      
    } catch (err) {
      console.error("❌ Erreur fetchCategories", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (nom) => {
    try {
      const newCat = await categoriesAPI.create({ nom });
      const normalized = {
        id: newCat.id,
        nom: newCat.nom || newCat.name || nom,
        name: newCat.nom || newCat.name || nom,
        ...newCat
      };
      setCategories(prev => [...prev, normalized]);
      setTotal(prev => prev + 1);
      toast.success("✅ Catégorie créée avec succès !");
      return newCat;
    } catch (error) {
      console.error("❌ Erreur addCategory:", error);
      toast.error("❌ Erreur lors de la création de la catégorie");
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (id, nom) => {
    try {
      const updated = await categoriesAPI.update(id, { nom });
      setCategories(prev =>
        prev.map(c => c.id === id ? {
          ...c,
          nom: updated.nom || updated.name || nom,
          name: updated.nom || updated.name || nom,
          ...updated
        } : c)
      );
      toast.success("✅ Catégorie modifiée avec succès !");
      return updated;
    } catch (error) {
      console.error("❌ Erreur updateCategory:", error);
      toast.error("❌ Erreur lors de la modification de la catégorie");
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      await categoriesAPI.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
      toast.success("✅ Catégorie supprimée avec succès !");
    } catch (error) {
      console.error("❌ Erreur deleteCategory:", error);
      toast.error("❌ Erreur lors de la suppression de la catégorie");
      throw error;
    }
  }, []);

  const refetch = fetchCategories;

  return {
    categories,
    total,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch,
  };
}
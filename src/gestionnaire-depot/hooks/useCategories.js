// src/gestionnaire-depot/hooks/useCategories.js
import { useState, useEffect, useCallback } from 'react';
import { categoriesAPI } from '../../services/api/categories';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("📦 Récupération des catégories...");
      const response = await categoriesAPI.getAll({ per_page: 1000 });
      console.log("🔍 Réponse brute:", response);
      console.log("🔍 Type de réponse:", typeof response);
      console.log("🔍 Est un tableau?", Array.isArray(response));

      // Si la réponse est déjà un tableau
      if (Array.isArray(response)) {
        console.log("✅ La réponse est directement un tableau de", response.length, "catégories");
        const normalized = response.map(cat => ({
          id: cat.id || cat.uuid,
          nom: cat.nom || cat.name || 'Sans nom',
          name: cat.nom || cat.name || 'Sans nom',
          ...cat
        }));
        console.log("✅ Catégories normalisées:", normalized);
        setCategories(normalized);
        setLoading(false);
        return;
      }

      // Si la réponse a une propriété data
      if (response && response.data) {
        console.log("✅ La réponse a une propriété data avec", response.data.length, "catégories");
        const rawData = response.data;
        const normalized = rawData.map(cat => ({
          id: cat.id || cat.uuid,
          nom: cat.nom || cat.name || 'Sans nom',
          name: cat.nom || cat.name || 'Sans nom',
          ...cat
        }));
        console.log("✅ Catégories normalisées:", normalized);
        setCategories(normalized);
        setLoading(false);
        return;
      }

      // Si la réponse a une propriété categories
      if (response && response.categories) {
        console.log("✅ La réponse a une propriété categories avec", response.categories.length, "catégories");
        const rawData = response.categories;
        const normalized = rawData.map(cat => ({
          id: cat.id || cat.uuid,
          nom: cat.nom || cat.name || 'Sans nom',
          name: cat.nom || cat.name || 'Sans nom',
          ...cat
        }));
        console.log("✅ Catégories normalisées:", normalized);
        setCategories(normalized);
        setLoading(false);
        return;
      }

      // Si on arrive ici, format inattendu
      console.warn("⚠️ Format de réponse non reconnu:", response);
      setCategories([]);
      
    } catch (err) {
      console.error("❌ Erreur fetchCategories", err);
      setError(err);
      setCategories([]);
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
      return newCat;
    } catch (error) {
      console.error("❌ Erreur addCategory:", error);
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
      return updated;
    } catch (error) {
      console.error("❌ Erreur updateCategory:", error);
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      await categoriesAPI.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("❌ Erreur deleteCategory:", error);
      throw error;
    }
  }, []);

  const refetch = fetchCategories;

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch,
  };
}
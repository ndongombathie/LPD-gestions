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
      console.log("Type:", typeof response);

      // Si la réponse est une chaîne, essayer de la parser (au cas où ce serait du JSON stringifié)
      if (typeof response === 'string') {
        try {
          const parsed = JSON.parse(response);
          console.log("✅ Réponse parsée:", parsed);
          // Maintenant traiter parsed comme un objet
          let rawData = [];
          if (Array.isArray(parsed)) {
            rawData = parsed;
          } else if (parsed && parsed.data) {
            rawData = parsed.data;
          } else {
            rawData = [];
          }
          const normalized = rawData.map(cat => ({
            id: cat.id || cat.uuid,
            nom: cat.nom || cat.name || 'Sans nom',
            name: cat.nom || cat.name || 'Sans nom',
            ...cat
          }));
          setCategories(normalized);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Impossible de parser la réponse string:", e);
          setError("La réponse du serveur n'est pas du JSON valide.");
          setCategories([]);
          setLoading(false);
          return;
        }
      }

      // Sinon, traitement normal (objet)
      let rawData = [];
      if (Array.isArray(response)) {
        rawData = response;
      } else if (response && response.data) {
        rawData = response.data;
      } else if (response && response.categories) {
        rawData = response.categories;
      } else {
        rawData = [];
      }

      const normalized = rawData.map(cat => ({
        id: cat.id || cat.uuid,
        nom: cat.nom || cat.name || 'Sans nom',
        name: cat.nom || cat.name || 'Sans nom',
        ...cat
      }));

      console.log("✅ Catégories normalisées:", normalized);
      setCategories(normalized);
    } catch (err) {
      setError(err);
      console.error("❌ Erreur fetchCategories", err);
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
      throw error;
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      await categoriesAPI.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error) {
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
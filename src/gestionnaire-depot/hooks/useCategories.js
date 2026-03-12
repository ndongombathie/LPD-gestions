import { useState, useEffect, useCallback } from 'react';
import { categoriesAPI } from '../../services/api/categories';
import toast from 'react-hot-toast';

export function useCategories(initialPage = 1, perPage = 10, searchTerm = '') {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = useCallback(async (page = currentPage, search = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search || undefined,
      };
      const response = await categoriesAPI.getAll(params);

      let data = [];
      let totalCount = 0;
      let lastPage = 1;

      if (Array.isArray(response)) {
        data = response;
        totalCount = response.length;
        lastPage = 1;
      } else if (response?.data) {
        data = response.data;
        totalCount = response.total || response.data.length;
        lastPage = response.last_page || 1;
      }

      const normalized = data.map(cat => ({
        id: cat.id || cat.uuid,
        nom: cat.nom || cat.name || 'Sans nom',
        name: cat.nom || cat.name || 'Sans nom',
        ...cat
      }));

      setCategories(normalized);
      setTotal(totalCount);
      setTotalPages(lastPage);
      setCurrentPage(page);
    } catch (err) {
      setError(err);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  }, [perPage, searchTerm]);

  // Effet pour charger les catégories lorsque la page ou le terme de recherche change
  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage, searchTerm, fetchCategories]);

  const addCategory = useCallback(async (nom) => {
    try {
      const newCat = await categoriesAPI.create({ nom });
      // Recharger la première page après ajout
      await fetchCategories(1);
      toast.success("✅ Catégorie créée avec succès !");
      return newCat;
    } catch (error) {
      toast.error("❌ Erreur lors de la création de la catégorie");
      throw error;
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id, nom) => {
    try {
      const updated = await categoriesAPI.update(id, { nom });
      // Recharger la page courante
      await fetchCategories(currentPage);
      toast.success("✅ Catégorie modifiée avec succès !");
      return updated;
    } catch (error) {
      toast.error("❌ Erreur lors de la modification de la catégorie");
      throw error;
    }
  }, [fetchCategories, currentPage]);

  const deleteCategory = useCallback(async (id) => {
    try {
      await categoriesAPI.delete(id);
      // Recharger la page courante
      await fetchCategories(currentPage);
      toast.success("✅ Catégorie supprimée avec succès !");
    } catch (error) {
      toast.error("❌ Erreur lors de la suppression de la catégorie");
      throw error;
    }
  }, [fetchCategories, currentPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    categories,
    total,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: () => fetchCategories(currentPage),
  };
}
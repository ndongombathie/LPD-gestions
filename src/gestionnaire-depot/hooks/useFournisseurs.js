// src/gestionnaire-depot/hooks/useFournisseurs.js
import { useState, useCallback, useEffect } from 'react';
import { fournisseursAPI } from '../../services/api/fournisseurs';

export const useFournisseurs = (initialPage = 1, perPage = 10) => {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuppliers = useCallback(async (page = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fournisseursAPI.getAll({ page, per_page: perPage });

      // Adapter selon la structure de réponse
      let data = [];
      let totalCount = 0;
      let lastPage = 1;

      if (Array.isArray(result)) {
        data = result;
        totalCount = result.length; // pas fiable si paginé
        lastPage = 1;
      } else if (result?.data) {
        data = result.data;
        totalCount = result.total || 0;
        lastPage = result.last_page || Math.ceil(totalCount / perPage);
      } else {
        throw new Error('Format de réponse inattendu');
      }

      // Formater les données
      const formatted = data.map((item) => ({
        id: item.id,
        name: item.name || item.nom || 'Nom inconnu',
        email: item.email || '',
        contactName: item.contactName || item.contact || '',
        phone: item.phone || '',
      }));

      setSuppliers(formatted);
      setTotal(totalCount);
      setTotalPages(lastPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchSuppliers(initialPage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchSuppliers(page);
    }
  };

  const refetch = () => fetchSuppliers(currentPage);

  return {
    suppliers,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    goToPage,
    refetch,
  };
};
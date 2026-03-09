// src/gestionnaire-depot/hooks/useAllFournisseurs.js
import { useState, useCallback, useEffect } from 'react';
import { fournisseursAPI } from '../../services/api/fournisseurs';

export const useAllFournisseurs = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchAllSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const totalCount = await fournisseursAPI.getNombre();
      setTotal(totalCount);
      
      const perPage = 10;
      const totalPages = Math.ceil(totalCount / perPage);
      
      const promises = [];
      for (let page = 1; page <= totalPages; page++) {
        promises.push(fournisseursAPI.getAll({ page, per_page: perPage }));
      }
      
      const results = await Promise.all(promises);
      
      let allSuppliers = [];
      results.forEach(result => {
        let pageSuppliers = [];
        
        if (Array.isArray(result)) {
          pageSuppliers = result;
        } else if (result?.data) {
          pageSuppliers = result.data;
        }
        
        const formatted = pageSuppliers.map(item => ({
          id: item.id,
          name: item.name || item.nom || 'Nom inconnu',
          email: item.email || '',
          contactName: item.contactName || item.contact || '',
          phone: item.phone || '',
        }));
        
        allSuppliers = [...allSuppliers, ...formatted];
      });
      
      setSuppliers(allSuppliers);
      
    } catch (err) {
      
      setError(err.message || 'Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSuppliers();
  }, [fetchAllSuppliers]);

  return {
    suppliers,
    total,
    loading,
    error,
    refetch: fetchAllSuppliers,
  };
};
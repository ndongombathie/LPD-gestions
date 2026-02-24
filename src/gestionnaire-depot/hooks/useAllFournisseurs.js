// src/gestionnaire-depot/hooks/useAllFournisseurs.js
import { useState, useEffect, useCallback } from 'react';
import { fournisseursAPI } from '../../services/api/fournisseurs';

export const useAllFournisseurs = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchAllSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Récupérer le nombre total de fournisseurs
      const totalCount = await fournisseursAPI.getNombre();
      setTotal(totalCount);
      
      // 2. Déterminer le nombre de pages nécessaires
      const perPage = 10; // Ce que l'API renvoie par défaut
      const totalPages = Math.ceil(totalCount / perPage);
      
      // 3. Charger toutes les pages en parallèle
      const promises = [];
      for (let page = 1; page <= totalPages; page++) {
        promises.push(fournisseursAPI.getAll({ page, per_page: perPage }));
      }
      
      const results = await Promise.all(promises);
      
      // 4. Concaténer tous les résultats
      let allSuppliers = [];
      results.forEach(result => {
        let pageSuppliers = [];
        
        // Adapter selon la structure de réponse
        if (Array.isArray(result)) {
          pageSuppliers = result;
        } else if (result?.data) {
          pageSuppliers = result.data;
        } else {
          console.warn('Format de réponse inattendu:', result);
          return;
        }
        
        // Formater les données
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
      console.log(`✅ ${allSuppliers.length} fournisseurs chargés`);
    } catch (err) {
      console.error('❌ Erreur chargement tous fournisseurs:', err);
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
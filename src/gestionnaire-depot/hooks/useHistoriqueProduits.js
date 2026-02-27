// src/gestionnaire-depot/hooks/useHistoriqueProduits.js
import { useState, useCallback } from 'react';
import { historiqueActionsAPI } from '../../services/api/historique-actions';

export const useHistoriqueProduits = () => {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistorique = useCallback(async (page = 1, perPage = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await historiqueActionsAPI.getAll({ 
        page, 
        per_page: perPage,
        order_by: 'created_at',
        order_direction: 'desc'
      });
      
      let data = [];
      let totalCount = 0;
      let lastPage = 1;

      if (Array.isArray(response)) {
        data = response;
        totalCount = response.length;
        lastPage = 1;
      } else if (response?.data) {
        data = response.data;
        totalCount = response.total || 0;
        lastPage = response.last_page || Math.ceil(totalCount / perPage);
      }

      // Filtrer pour ne garder que les modifications et suppressions
      const filteredData = data.filter(item => 
        item.action === 'Modification de produit' || 
        item.action === 'Suppression de produit'
      );

      const formatted = filteredData.map(item => ({
        id: item.id,
        produit_id: item.produit_id,
        action: item.action,
        details: item.details || '',
        anciennes_valeurs: item.anciennes_valeurs ? 
          (typeof item.anciennes_valeurs === 'string' ? JSON.parse(item.anciennes_valeurs) : item.anciennes_valeurs) : null,
        nouvelles_valeurs: item.nouvelles_valeurs ? 
          (typeof item.nouvelles_valeurs === 'string' ? JSON.parse(item.nouvelles_valeurs) : item.nouvelles_valeurs) : null,
        date: item.created_at,
        type: item.action === 'Modification de produit' ? 'Modification' : 'Suppression',
        productName: item.produit_nom || 'Produit inconnu',
      }));

      setHistory(formatted);
      setTotal(filteredData.length);
      setTotalPages(Math.ceil(filteredData.length / perPage));
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ Erreur fetchHistorique:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    total,
    loading,
    error,
    currentPage,
    totalPages,
    fetchHistorique,
    setCurrentPage
  };
};
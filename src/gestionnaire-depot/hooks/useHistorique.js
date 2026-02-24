// src/gestionnaire-depot/hooks/useHistorique.js
import { useState, useCallback } from 'react';
import { mouvementsAPI } from '../../services/api/mouvements';

export const useHistorique = () => {
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
      const response = await mouvementsAPI.getHistoriqueActions({ 
        page, 
        per_page: perPage 
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

      const formatted = data.map(item => ({
        id: item.id,
        product: item.produit_nom || item.product_name || 'Produit inconnu',
        type: item.type === 'entree' ? 'Entrée' : 'Sortie',
        quantity: item.quantite || 0,
        date: item.date || item.created_at,
        manager: item.gestionnaire || item.manager || 'Gestionnaire',
        motif: item.motif || item.commentaire || '',
        status: item.statut || 'completed',
      }));

      setHistory(formatted);
      setTotal(totalCount);
      setTotalPages(lastPage);
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
import { useState, useCallback } from 'react';
import { produitsAPI } from '../../services/api/produits';

export function useProduitsParStatutAvecPagination() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
    from: 0,
    to: 0
  });

  const fetchProduitsParStatut = useCallback(async (statut, page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = { 
        page, 
        per_page: 10,
        ...(searchTerm && { search: searchTerm })
      };
      
      let response;
      switch(statut) {
        case 'rupture':
          response = await produitsAPI.getProduitsEnRupture(params);
          break;
        case 'faible':
          response = await produitsAPI.getProduitsSousSeuil(params);
          break;
        case 'normal':
          response = await produitsAPI.getProduitsNormaux(params);
          break;
        default:
          setProduits([]);
          setLoading(false);
          return;
      }
      
      // La réponse Laravel paginée standard
      setProduits(response.data || []);
      setPagination({
        currentPage: response.current_page || 1,
        lastPage: response.last_page || 1,
        total: response.total || 0,
        perPage: response.per_page || 10,
        from: response.from || 0,
        to: response.to || 0
      });
    } catch (error) {
      console.error(`Erreur chargement produits ${statut}:`, error);
      setProduits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    produits,
    loading,
    pagination,
    fetchProduitsParStatut
  };
}
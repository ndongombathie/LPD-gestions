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

  const fetchHistorique = useCallback(async (page = 1, perPage = 20, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = { 
        page, 
        per_page: perPage,
        order_by: 'created_at',
        order_direction: 'desc'
      };
      
      // Ajouter le terme de recherche s'il existe
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      
      
      const response = await historiqueActionsAPI.getAll(params);
      
      
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
        lastPage = response.last_page || 1;
      }

      // Formater TOUTES les données sans filtrer
      const formatted = data.map(item => {
        // Déterminer le type d'action pour l'affichage
        let type = 'Autre';
        if (item.action === 'Modification de produit') type = 'Modification';
        else if (item.action === 'Suppression de produit') type = 'Suppression';
        else if (item.action === 'Création de produit') type = 'Création';
        else if (item.action === 'Transfert de stock') type = 'Transfert';
        else if (item.action === 'Réapprovisionnement') type = 'Réapprovisionnement';
        
        // Récupérer les infos du produit imbriqué
        const produit = item.produit || {};
        
        return {
          id: item.id,
          produit_id: item.produit_id,
          action: item.action,
          details: item.details || '',
          date: item.created_at,
          type: type,
          // Informations produit (imbriquées)
          productName: produit.nom || 'Produit inconnu',
          productCode: produit.code || '',
        };
      });

      setHistory(formatted);
      setTotal(totalCount);
      setTotalPages(lastPage);
      setCurrentPage(page);
    } catch (err) {
      
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
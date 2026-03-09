// src/hooks/useMouvements.js
import { useState, useEffect, useCallback } from 'react';
import { mouvementsAPI } from '../../services/api/mouvements';

export const useMouvements = () => {
  const [movements, setMovements] = useState([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [errorMovements, setErrorMovements] = useState(null);

  const [stats, setStats] = useState({
    totalEntries: 0,
    totalValidated: 0,
    totalPending: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState(null);

  const mapMovement = useCallback((item) => {
    // Déterminer le type (Entrée / Sortie) et le sous-type
    let type = 'Sortie';
    let sousType = '';
    let source = item.source || '';
    let destination = item.destination || '';

    if (item.type === 'entree') {
      type = 'Entrée';
      const motif = (item.motif || '').toLowerCase();
      if (motif.includes('création')) {
        sousType = 'creation';
      } else if (motif.includes('réapprovisionnement')) {
        sousType = 'reapprovisionnement';
      } else if (motif.includes('annulation')) {
        sousType = 'annulation';
      }
    } else if (item.type === 'sortie') {
      type = 'Sortie';
      const motif = (item.motif || '').toLowerCase();
      if (motif.includes('transfert')) {
        sousType = 'transfert';
      } else if (motif.includes('retour')) {
        sousType = 'retour';
      } else {
        sousType = 'diminution';
      }
    } else {
      // Cas particulier : les transferts annulés (pas de champ type)
      if (item.status === 'annuler') {
        type = 'Entrée';
        sousType = 'annulation';
      }
    }

    let status = item.statut?.toLowerCase() || 'completed';
    if (type === 'Entrée') status = 'completed';
    else if (status === 'en_attente') status = 'pending';
    else if (status === 'validé') status = 'validated';
    else if (status === 'annulé') status = 'cancelled';

    let productName = 'Produit inconnu';
    if (item.produit?.nom) productName = item.produit.nom;
    else if (item.nom) productName = item.nom;
    else if (item.product_nom) productName = item.product_nom;

    return {
      id: item.id,
      type,
      sousType,
      product: productName,
      barcode: item.produit?.code_barre || item.code_barre || '',
      source,
      destination,
      quantity: item.quantite || 0,
      date: item.date || item.created_at,
      status,
      motif: item.motif || '',
      createdAt: item.created_at,
      validatedAt: item.validated_at,
    };
  }, []);

  const fetchMovements = useCallback(async (page, perPage, filters) => {
    setLoadingMovements(true);
    setErrorMovements(null);

    try {
      let response;
      const params = {
        page,
        per_page: perPage,
        date_debut: filters.dateFrom || undefined,
        date_fin: filters.dateTo || undefined,
      };

      
      if (filters.activeTab === "en-attente") {
        response = await mouvementsAPI.getTransfertsEnAttente(params);
      } else if (filters.activeTab === "annulees") {
        response = await mouvementsAPI.getTransfertsAnnules(params);
        
      } else {
        response = await mouvementsAPI.getAll(params);
      }

      

      let movementsData = [];
      let total = 0;

      if (Array.isArray(response)) {
        movementsData = response;
        total = response.length;
      } else if (response?.data && Array.isArray(response.data)) {
        movementsData = response.data;
        total = response.total || response.meta?.total || movementsData.length;
      } else {
        const possibleData = response?.records || response?.items || response?.results;
        if (possibleData && Array.isArray(possibleData)) {
          movementsData = possibleData;
          total = response.total || possibleData.length;
        }
      }

      
      const formatted = movementsData.map(mapMovement);
      

      setMovements(formatted);
      setTotalMovements(total);
    } catch (err) {
      
      setErrorMovements(err.message || "Erreur lors du chargement des mouvements");
    } finally {
      setLoadingMovements(false);
    }
  }, [mapMovement]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorStats(null);

    try {
      
      
      const results = await Promise.allSettled([
        mouvementsAPI.getNbEntreesTotal(),
        mouvementsAPI.getNbSortiesTotal(),
        mouvementsAPI.getNbTransfertsEnAttente(),
      ]);

      

      const extractValue = (result, defaultValue = 0) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          
          
          if (typeof data === 'number') return data;
          if (data && typeof data === 'object') {
            if (data.count !== undefined) return data.count;
            if (data.data !== undefined) return data.data;
            if (data.nombre !== undefined) return data.nombre;
            if (data.total !== undefined) return data.total;
          }
          return data ?? defaultValue;
        }
        return defaultValue;
      };

      setStats({
        totalEntries: extractValue(results[0]),
        totalValidated: extractValue(results[1]),
        totalPending: extractValue(results[2]),
      });
      
    } catch (err) {
    
      setErrorStats('Erreur lors du chargement des statistiques');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const createTransfer = useCallback(async (data) => {
    try {
      const response = await mouvementsAPI.createTransfer(data);
      return { success: true, data: response.data };
    } catch (err) {
      
      const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
      return { success: false, error: errorMessage };
    }
  }, []);

  const cancelTransfer = useCallback(async (transferId) => {
    try {
      const response = await mouvementsAPI.cancelTransfer(transferId);
      return { success: true, data: response.data };
    } catch (err) {
      
      const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
      return { success: false, error: errorMessage };
    }
  }, []);

  const diminuerStock = useCallback(async (data) => {
    try {
      const response = await mouvementsAPI.diminuerStock(data);
      return { success: true, data: response.data };
    } catch (err) {
      
      const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
      return { success: false, error: errorMessage };
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    movements,
    totalMovements,
    loadingMovements,
    errorMovements,
    stats,
    loadingStats,
    errorStats,
    fetchMovements,
    fetchStats,
    createTransfer,
    cancelTransfer,
    diminuerStock,
  };
};
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
    todayCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState(null);

  const mapMovement = useCallback((item) => {
    let type = item.type === 'entree' ? 'Entrée' : 'Sortie';
    let sousType = '';
    if (item.type === 'sortie') {
      sousType = item.motif?.toLowerCase().includes('transfert') ? 'transfert' : 'diminution';
    }
    let status = item.statut?.toLowerCase() || 'completed';
    if (item.type === 'entree') status = 'completed';
    else if (status === 'en_attente') status = 'pending';
    else if (status === 'validé') status = 'validated';
    else if (status === 'annulé') status = 'cancelled';

    let productName = 'Produit inconnu';
    if (item.produit?.nom) productName = item.produit.nom;
    else if (item.nom) productName = item.nom;
    else if (item.product_nom) productName = item.product_nom;

    let source = item.source || (item.type === 'entree' ? 'Fournisseur' : 'Boutique Colobane');

    return {
      id: item.id,
      type,
      sousType,
      product: productName,
      barcode: item.produit?.code_barre || item.code_barre || '',
      source,
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

      console.log(`📡 Appel API ${filters.activeTab} avec params:`, params);

      if (filters.activeTab === "en-attente") {
        response = await mouvementsAPI.getTransfertsEnAttente(params);
      } else if (filters.activeTab === "annulees") {
        response = await mouvementsAPI.getTransfertsAnnules(params);
        console.log('📦 Réponse brute annulées:', response);
      } else {
        response = await mouvementsAPI.getAll(params);
      }

      console.log('📦 Réponse brute:', response);

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

      console.log('📋 Données à mapper:', movementsData);
      const formatted = movementsData.map(mapMovement);
      console.log('🎯 Mouvements formatés:', formatted);

      setMovements(formatted);
      setTotalMovements(total);
    } catch (err) {
      console.error('❌ Erreur fetchMovements:', err);
      setErrorMovements(err.message || "Erreur lors du chargement des mouvements");
    } finally {
      setLoadingMovements(false);
    }
  }, [mapMovement]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorStats(null);

    try {
      console.log('📊 Début chargement stats...');
      
      const results = await Promise.allSettled([
        mouvementsAPI.getNbEntreesTotal().catch(err => (console.warn(err), 0)),
        mouvementsAPI.getNbSortiesTotal().catch(err => (console.warn(err), 0)),
        mouvementsAPI.getTransfertsEnAttente().catch(err => (console.warn(err), [])),
        mouvementsAPI.getNombreAujourdhui().catch(err => (console.warn(err), 0)),
      ]);

      console.log('📦 Résultats bruts des stats:', results);

      const extractValue = (result, defaultValue = 0) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          console.log('✅ Données reçues pour stats:', data);
          
          if (Array.isArray(data)) return data.length;
          if (data && typeof data === 'object') {
            if (data.count !== undefined) return data.count;
            if (data.data !== undefined) {
              if (Array.isArray(data.data)) return data.data.length;
              return data.data;
            }
            if (data.nombre !== undefined) return data.nombre;
            if (data.total !== undefined) return data.total;
            const firstNum = Object.values(data).find(v => typeof v === 'number');
            if (firstNum !== undefined) return firstNum;
          }
          return data ?? defaultValue;
        }
        return defaultValue;
      };

      setStats({
        totalEntries: extractValue(results[0]),
        totalValidated: extractValue(results[1]),
        totalPending: extractValue(results[2]),
        todayCount: extractValue(results[3]),
      });
    } catch (err) {
      console.error('Erreur inattendue dans fetchStats:', err);
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
      console.error('❌ Erreur createTransfer:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
      return { success: false, error: errorMessage };
    }
  }, []);

  const cancelTransfer = useCallback(async (transferId) => {
    try {
      const response = await mouvementsAPI.cancelTransfer(transferId);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('❌ Erreur cancelTransfer:', err);
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
  };
};
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

  const mapMovement = useCallback((m) => {
    const type = m.type === 'entree' ? 'Entrée' : 'Sortie';
    let sousType = '';
    if (m.type === 'sortie') {
      sousType = m.motif?.toLowerCase().includes('transfert') ? 'transfert' : 'diminution';
    }
    let status = m.statut?.toLowerCase() || 'completed';
    if (m.type === 'entree') status = 'completed';
    else if (status === 'en_attente') status = 'pending';
    else if (status === 'validé') status = 'validated';
    else if (status === 'annulé') status = 'cancelled';

    return {
      id: m.id,
      type,
      sousType,
      product: m.produit?.nom || 'Produit inconnu',
      barcode: m.produit?.code_barre || '',
      source: m.source || (m.type === 'entree' ? 'Fournisseur' : 'Boutique Colobane'),
      quantity: m.quantite || 0,
      date: m.date || m.created_at,
      status,
      motif: m.motif || '',
      createdAt: m.created_at,
      validatedAt: m.validated_at,
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
      
      // Appels individuels avec logs
      const entriesPromise = mouvementsAPI.getNbEntreesTotal().then(res => {
        console.log('📦 getNbEntreesTotal retourne:', res);
        return res;
      }).catch(err => {
        console.warn('⚠️ Erreur getNbEntreesTotal:', err);
        return 0;
      });

      const sortiesPromise = mouvementsAPI.getNbSortiesTotal().then(res => {
        console.log('📦 getNbSortiesTotal retourne:', res);
        return res;
      }).catch(err => {
        console.warn('⚠️ Erreur getNbSortiesTotal:', err);
        return 0;
      });

      const pendingListPromise = mouvementsAPI.getTransfertsEnAttente().then(res => {
        console.log('📦 getTransfertsEnAttente (liste) retourne:', res);
        return res;
      }).catch(err => {
        console.warn('⚠️ Erreur getTransfertsEnAttente:', err);
        return [];
      });

      // CORRECTION ICI : utilisation de getNombreAujourdhui
      const todayPromise = mouvementsAPI.getNombreAujourdhui().then(res => {
        console.log('📦 getNombreAujourdhui retourne:', res);
        return res;
      }).catch(err => {
        console.warn('⚠️ Erreur getNombreAujourdhui:', err);
        return 0;
      });

      const results = await Promise.allSettled([
        entriesPromise,
        sortiesPromise,
        pendingListPromise,
        todayPromise,
      ]);

      console.log('📦 Résultats bruts des stats:', results);

      const extractValue = (result, defaultValue = 0) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          console.log('✅ Données reçues pour stats:', data);
          
          // Si c'est un tableau, on prend sa longueur
          if (Array.isArray(data)) {
            return data.length;
          }
          
          // Si c'est un objet, on cherche une propriété commune
          if (data && typeof data === 'object') {
            if (data.count !== undefined) return data.count;
            if (data.data !== undefined) return data.data;
            if (data.nombre !== undefined) return data.nombre;
            if (data.total !== undefined) return data.total;
            const firstNum = Object.values(data).find(v => typeof v === 'number');
            if (firstNum !== undefined) return firstNum;
          }
          
          // Sinon, on suppose que c'est directement le nombre
          return data ?? defaultValue;
        }
        return defaultValue;
      };

      const newStats = {
        totalEntries: extractValue(results[0]),
        totalValidated: extractValue(results[1]),
        totalPending: extractValue(results[2]), // longueur de la liste en attente
        todayCount: extractValue(results[3]),
      };
      console.log('📈 Nouvelles stats calculées:', newStats);
      setStats(newStats);
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
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Erreur inconnue' 
      };
    }
  }, []);

  const cancelTransfer = useCallback(async (transferId) => {
    try {
      const response = await mouvementsAPI.cancelTransfer(transferId);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('❌ Erreur cancelTransfer:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Erreur inconnue' 
      };
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
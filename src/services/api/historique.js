 
// src/services/api/historique.js
import httpClient from '../http/client';

 

/**
 * 📊 API pour l'historique des commandes
 * Compatible avec l'API commandes existante
 */
const ENDPOINTS = {
  GET_ALL: '/commandes',
  GET_BY_DATE_RANGE: '/commandes/by-date-range',
  GET_BY_STATUS: '/commandes/by-status/:status',
  SEARCH: '/commandes/search',
  GET_STATS: '/commandes/stats',
  GET_TODAY: '/commandes/today',
  GET_DETAILS: '/commandes/:id',
  GET_BY_TYPE_VENTE: '/commandes/by-type-vente/:typeVente',
  EXPORT: '/commandes/export',
};

/**
 * Normalisation des réponses API
 */
const normalizeResponse = (response) => {
  if (!response) return { data: [], success: false };
  
  // Si response est déjà un tableau
  if (Array.isArray(response)) {
    return { data: response, success: true };
  }
  
  // Si response a une propriété data qui est un tableau
  if (response.data && Array.isArray(response.data)) {
    return { data: response.data, success: true };
  }
  
  // Si response a une propriété items qui est un tableau
  if (response.items && Array.isArray(response.items)) {
    return { data: response.items, success: true };
  }
  
  // Si response est un objet avec des résultats
  if (response.results && Array.isArray(response.results)) {
    return { data: response.results, success: true };
  }
  
  console.warn('⚠️ Format de réponse API non reconnu:', response);
  return { data: [], success: false };
};

export const historiqueAPI = {
    /**
   * Récupère l'historique des actions (modifications et suppressions)
   * @param {Object} params - Paramètres de requête (page, etc.)
   * @returns {Promise} - Promesse contenant les données paginées
   */
  getAll: async (params = {}) => {
    const response = await httpClient.get('/historique-actions', { params });
    return response.data;
  } ,
  /**
   * Récupérer l'historique des commandes avec filtres
   */
  getHistorique: async (params = {}) => {
    try {
      console.log('🔄 Chargement historique avec params:', params);
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur getHistorique:', error);
      return { data: [], success: false, error: error.message };
    }
  },

  /**
   * Récupérer les commandes par période
   */
  getByPeriod: async (debut, fin, params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_DATE_RANGE, {
        params: { date_from: debut, date_to: fin, ...params }
      });
      return normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur getByPeriod:', error);
      return { data: [], success: false };
    }
  },

  /**
   * Récupérer les commandes par statut
   */
  getByStatus: async (statut, params = {}) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_STATUS.replace(':status', statut),
        { params }
      );
      return normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur getByStatus:', error);
      return { data: [], success: false };
    }
  },

  /**
   * Récupérer les commandes par type de vente
   */
  getByTypeVente: async (typeVente, params = {}) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_TYPE_VENTE.replace(':typeVente', typeVente),
        { params }
      );
      return normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur getByTypeVente:', error);
      return { data: [], success: false };
    }
  },

  /**
   * Rechercher dans les commandes
   */
  search: async (query, params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.SEARCH, {
        params: { q: query, ...params }
      });
      return normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur search:', error);
      return { data: [], success: false };
    }
  },

  /**
   * Récupérer les détails d'une commande
   */
  getDetails: async (commandeId) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_DETAILS.replace(':id', commandeId)
      );
      return { data: response.data, success: true };
    } catch (error) {
      console.error('❌ Erreur getDetails:', error);
      return { data: null, success: false, error: error.message };
    }
  },

  /**
   * Statistiques historiques
   */
  getStats: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_STATS);
      return { data: response.data, success: true };
    } catch (error) {
      console.error('❌ Erreur getStats:', error);
      return { data: null, success: false };
    }
  },

  /**
   * Statistiques par période
   */
  getPeriodStats: async (debut, fin) => {
    try {
      const response = await httpClient.get('/historique/stats/period', {
        params: { debut, fin }
      });
      return { data: response.data, success: true };
    } catch (error) {
      console.error('❌ Erreur getPeriodStats:', error);
      return { data: null, success: false };
    }
  },

  /**
   * Récupérer les commandes d'aujourd'hui
   */
  getToday: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_TODAY);
      return normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Erreur getToday:', error);
      return { data: [], success: false };
    }
  },

  /**
   * Exporter l'historique
   */
  exportHistorique: async (format = 'pdf', params = {}) => {
    try {
      const response = await httpClient.get(`${ENDPOINTS.EXPORT}/${format}`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur exportHistorique:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le statut d'une commande
   */
  updateStatus: async (commandeId, statut) => {
    try {
      const response = await httpClient.put(`/commandes/${commandeId}/statut`, { statut });
      return { data: response.data, success: true };
    } catch (error) {
      console.error('❌ Erreur updateStatus:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Annuler une commande
   */
  cancelCommande: async (commandeId, raison) => {
    try {
      const response = await httpClient.put(`/commandes/${commandeId}/annuler`, { raison });
      return { data: response.data, success: true };
    } catch (error) {
      console.error('❌ Erreur cancelCommande:', error);
      return { success: false, error: error.message };
    }
  },

};
/**
 * 📦 Commandes API - Version complète pour HistoriqueCommandes
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  // Vos endpoints existants
  GET_ALL: '/commandes',
  GET_PENDING: '/commandes/pending',
  GET_BY_ID: '/commandes/:id',
  CREATE: '/commandes',
  VALIDATE: '/commandes/:id/valider',
  CANCEL: '/commandes/:id/annuler',
  UPDATE: '/commandes/:id',
  DELETE: '/commandes/:id',
  
  // NOUVEAUX ENDPOINTS POUR HISTORIQUE
  GET_STATS: '/commandes/stats',
  GET_TODAY: '/commandes/today',
  GET_BY_DATE_RANGE: '/commandes/by-date-range',
  GET_BY_STATUS: '/commandes/by-status/:status',
  SEARCH: '/commandes/search',
  EXPORT: '/commandes/export',
};

export const commandesAPI = {
  /**
   * Récupérer toutes les commandes avec pagination/filtres
   * @param {object} params - {page, perPage, status, search, date_from, date_to}
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll commandes:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les commandes en attente
   */
  getPending: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_PENDING);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getPending commandes:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les commandes d'aujourd'hui
   */
  getToday: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_TODAY);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getToday commandes:', error.message);
      throw error;
    }
  },

  /**
   * Obtenir une commande par ID
   */
  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById commande:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques globales
   */
  getStats: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_STATS);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getStats commandes:', error.message);
      // Fallback: calculer localement si l'endpoint n'existe pas
      const allCommandes = await commandesAPI.getAll();
      return calculerStatsLocal(allCommandes.data || []);
    }
  },

  /**
   * Récupérer par plage de dates
   */
  getByDateRange: async (dateFrom, dateTo) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_DATE_RANGE, {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByDateRange:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer par statut
   */
  getByStatus: async (status) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_STATUS.replace(':status', status)
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByStatus:', error.message);
      // Fallback: filtrer localement
      const allCommandes = await commandesAPI.getAll();
      const filtered = (allCommandes.data || []).filter(c => c.status === status);
      return { data: filtered };
    }
  },

  /**
   * Rechercher dans les commandes
   */
  search: async (query) => {
    try {
      const response = await httpClient.get(ENDPOINTS.SEARCH, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur search commandes:', error.message);
      throw error;
    }
  },

  /**
   * Exporter les commandes
   */
  export: async (format = 'csv', params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.EXPORT, {
        params: { format, ...params },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur export commandes:', error.message);
      throw error;
    }
  },

  // Vos méthodes existantes (restent inchangées)
  create: async (data) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create commande:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update commande:', error.response?.data || error.message);
      throw error;
    }
  },

  validate: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.VALIDATE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validate commande:', error.response?.data || error.message);
      throw error;
    }
  },

  cancel: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CANCEL.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cancel commande:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete commande:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Fonction utilitaire pour calculer les stats localement
const calculerStatsLocal = (commandes) => {
  const aujourdhui = new Date().toISOString().split('T')[0];
  
  return {
    total: commandes.length,
    aujourdhui: commandes.filter(c => 
      new Date(c.created_at || c.date).toISOString().split('T')[0] === aujourdhui
    ).length,
    pending: commandes.filter(c => 
      c.status === 'pending' || c.statut === 'en_attente_paiement'
    ).length,
    completed: commandes.filter(c => 
      c.status === 'completed' || c.statut === 'complétée'
    ).length,
    cancelled: commandes.filter(c => 
      c.status === 'cancelled' || c.statut === 'annulée'
    ).length,
    revenue_total: commandes
      .filter(c => c.status === 'completed' || c.statut === 'complétée')
      .reduce((sum, c) => sum + (c.total_ttc || c.total || 0), 0),
    revenue_today: commandes
      .filter(c => {
        const dateCommande = new Date(c.created_at || c.date).toISOString().split('T')[0];
        return dateCommande === aujourdhui && 
              (c.status === 'completed' || c.statut === 'complétée');
      })
      .reduce((sum, c) => sum + (c.total_ttc || c.total || 0), 0)
  };
};
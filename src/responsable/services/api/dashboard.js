/**
 * 📊 Dashboard API
 * 
 * Endpoints pour les statistiques et données du tableau de bord
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  GET_STATS: '/dashboard/stats',
  GET_RECENT_ACTIVITIES: '/dashboard/activities/recent',
  GET_CLIENT_GROWTH: '/dashboard/clients/growth',
  GET_SALES_DATA: '/dashboard/sales',
  GET_METRICS: '/dashboard/metrics',
};

export const dashboardAPI = {
  /**
   * Récupérer les statistiques principales
   */
  getStats: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_STATS, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getStats dashboard:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les activités récentes
   */
  getRecentActivities: async (limit = 10) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_RECENT_ACTIVITIES, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getRecentActivities:', error.message);
      throw error;
    }
  },

  /**
   * Obtenir la croissance des clients
   */
  getClientGrowth: async (period = 'monthly') => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_CLIENT_GROWTH, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getClientGrowth:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer les données de vente
   */
  getSalesData: async (startDate, endDate) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_SALES_DATA, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getSalesData:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer toutes les métriques
   */
  getAllMetrics: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_METRICS);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllMetrics:', error.message);
      throw error;
    }
  },
};
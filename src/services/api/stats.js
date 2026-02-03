/**
 * 📊 API des statistiques pour le tableau de bord
 * Utilise httpClient (comme clients.js)
 */

import httpClient from '../http/client';

export const statsAPI = {
  // Statistiques quotidiennes
  getDailyStats: async (date = null) => {
    try {
      const endpoint = date 
        ? `/stats/daily?date=${date}`
        : '/stats/daily';
      const response = await httpClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getDailyStats:', error);
      throw error;
    }
  },

  // Statistiques du vendeur
  getSellerStats: async (sellerId = null, period = 'today') => {
    try {
      const endpoint = sellerId 
        ? `/stats/seller/${sellerId}?period=${period}`
        : `/stats/seller?period=${period}`;
      const response = await httpClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getSellerStats:', error);
      throw error;
    }
  },

  // Résumé des ventes
  getSalesSummary: async (startDate, endDate) => {
    try {
      const response = await httpClient.get('/stats/sales-summary', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getSalesSummary:', error);
      throw error;
    }
  },

  // Ventes du jour - IMPORTANT pour le dashboard
  getTodaySales: async () => {
    try {
      const response = await httpClient.get('/stats/today-sales');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getTodaySales:', error);
      
      // Données de démo pour le développement
      return {
        total: 125420,
        today_sales: 125420,
        completed_orders: 24,
        processed_orders: 24,
        products_sold: 42,
        items_sold: 42,
        pending_orders: 2,
        new_clients: 3,
        new_customers: 3,
        top_products: [
          {
            id: 1,
            nom: "Sac à Main Cuir Noir",
            name: "Sac à Main Cuir Noir",
            reference: "SAC-CUIR-001",
            ventes: 28,
            sales: 28,
            revenu: 420000,
            revenue: 420000,
            tendance: "up",
            trend: "up",
          },
          {
            id: 2,
            nom: "Chemise Homme Blanche",
            name: "Chemise Homme Blanche",
            reference: "CHM-BLANC-001",
            ventes: 19,
            sales: 19,
            revenu: 285000,
            revenue: 285000,
            tendance: "up",
            trend: "up",
          },
          {
            id: 3,
            nom: "Parfum Luxury 100ml",
            name: "Parfum Luxury 100ml",
            reference: "PARF-LUX-001",
            ventes: 15,
            sales: 15,
            revenu: 675000,
            revenue: 675000,
            tendance: "stable",
            trend: "stable",
          },
          {
            id: 4,
            nom: "Montre Sport Étanche",
            name: "Montre Sport Étanche",
            reference: "MONT-SPORT-002",
            ventes: 12,
            sales: 12,
            revenu: 360000,
            revenue: 360000,
            tendance: "down",
            trend: "down",
          },
        ]
      };
    }
  },

  // Produits les plus vendus
  getTopProducts: async (period = 'month', limit = 10) => {
    try {
      const response = await httpClient.get('/stats/top-products', {
        params: { period, limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getTopProducts:', error);
      throw error;
    }
  },

  // Statistiques par catégorie
  getCategoryStats: async (period = 'month') => {
    try {
      const response = await httpClient.get('/stats/by-category', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getCategoryStats:', error);
      throw error;
    }
  },

  // Revenus mensuels
  getMonthlyRevenue: async (year = null) => {
    try {
      const endpoint = year 
        ? `/stats/monthly-revenue?year=${year}`
        : '/stats/monthly-revenue';
      const response = await httpClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getMonthlyRevenue:', error);
      throw error;
    }
  },

  // NOUVELLE MÉTHODE : Commandes récentes
  getRecentOrders: async (limit = 5) => {
    try {
      const response = await httpClient.get('/orders/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getRecentOrders:', error);
      
      // Données de démo pour le développement
      return [
        {
          id: 1,
          numero_commande: 'CMD-2024-001',
          order_number: 'CMD-2024-001',
          client_nom: 'Marie Diop',
          client_name: 'Marie Diop',
          total_ttc: 47200,
          total: 47200,
          statut: 'complétée',
          status: 'complétée',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          numero_commande: 'CMD-2024-002',
          order_number: 'CMD-2024-002',
          client_nom: 'Jean Dupont',
          client_name: 'Jean Dupont',
          total_ttc: 85000,
          total: 85000,
          statut: 'en attente',
          status: 'en attente',
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          numero_commande: 'CMD-2024-003',
          order_number: 'CMD-2024-003',
          client_nom: 'Sophie Martin',
          client_name: 'Sophie Martin',
          total_ttc: 125000,
          total: 125000,
          statut: 'complétée',
          status: 'complétée',
          created_at: new Date().toISOString(),
        }
      ];
    }
  }
};
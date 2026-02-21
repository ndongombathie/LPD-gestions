/**
 * 👥 Clients API
 * 
 * Endpoints: /api/clients
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/clients',
  GET_BY_ID: '/clients/:id',
  CREATE: '/clients',
  UPDATE: '/clients/:id',
  DELETE: '/clients/:id',
  GET_SPECIAL: '/clients?type_client=special',
  SEARCH: '/clients/search',
};

export const clientsAPI = {
  /**
   * Récupérer tous les clients
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll clients:', error.message);
      throw error;
    }
  },

  /**
   * Rechercher des clients par nom
   */
  search: async (nom) => {
    try {
      console.log(`🔍 Recherche client: ${nom}`);
      // Essayer d'abord l'endpoint de recherche dédié
      const response = await httpClient.get(ENDPOINTS.GET_ALL, {
        params: { search: nom }
      });
      
      console.log('📡 Réponse recherche clients:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur search clients:', error.message);
      
      // Fallback: récupérer tous les clients et filtrer localement
      try {
        console.log('🔄 Fallback: recherche locale...');
        const allClientsResponse = await httpClient.get(ENDPOINTS.GET_ALL);
        if (allClientsResponse.data && allClientsResponse.data.data) {
          const clients = Array.isArray(allClientsResponse.data.data) 
            ? allClientsResponse.data.data 
            : [];
          
          const filtered = clients.filter(client => 
            client && client.nom && 
            client.nom.toLowerCase().includes(nom.toLowerCase())
          );
          
          console.log(`✅ ${filtered.length} clients trouvés en fallback`);
          return { data: filtered };
        }
        return { data: [] };
      } catch (fallbackError) {
        console.error('❌ Erreur fallback search:', fallbackError.message);
        return { data: [] };
      }
    }
  },

  /**
   * Récupérer les clients spéciaux
   */
  getSpecial: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_SPECIAL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getSpecial clients:', error.message);
      throw error;
    }
  },

  /**
   * Obtenir un client par ID
   */
  getById: async (id) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_ID.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getById client:', error.message);
      throw error;
    }
  },

  /**
   * Créer un client
   */
  create: async (data) => {
    try {
      console.log('📝 Création client:', data);
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      console.log('✅ Client créé:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur create client:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mettre à jour un client
   */
  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update client:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Supprimer un client
   */
  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete client:', error.response?.data || error.message);
      throw error;
    }
  },
};
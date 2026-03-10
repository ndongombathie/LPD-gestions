/**
 * 📊 Rapports API
 * Journal d'audit (Fournisseurs & Clients spéciaux)
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  LOGS_FOURNISSEURS: '/rapports/fournisseurs',
  LOGS_CLIENTS: '/rapports/clients',
};

const rapportsAPI = {

  /**
   * 📦 Logs fournisseurs
   * @param {Object} params
   *  - dateDebut
   *  - dateFin
   *  - action
   *  - recherche
   *  - page
   *  - perPage
   */
  getLogsFournisseurs: async (params = {}) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.LOGS_FOURNISSEURS,
        { params }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erreur chargement logs fournisseurs:', error);
      throw error;
    }
  },

  /**
   * ⭐ Logs clients spéciaux
   * @param {Object} params
   */
  getLogsClients: async (params = {}) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.LOGS_CLIENTS,
        { params }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erreur chargement logs clients:', error);
      throw error;
    }
  },
};

export default rapportsAPI;

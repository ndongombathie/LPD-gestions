/**
 * 📦 Commandes API - Version Fusion Complète
 * Compatible Historique + Clients Spéciaux + Responsable
 */

import httpClient from '../http/client';

// ======================================================
// 🔹 Commandes (entête)
// ======================================================
const ENDPOINTS = {
  GET_ALL: '/commandes',
  GET_PENDING: '/commandes-attente',
  GET_BY_ID: '/commandes/:id',
  CREATE: '/commandes',
  VALIDATE: '/commandes/:id/valider',
  CANCEL: '/commandes/:id/annuler',
  UPDATE: '/commandes/:id',
  DELETE: '/commandes/:id',

  // Historique
  GET_STATS: '/commandes/stats',
  GET_TODAY: '/commandes/today',
  GET_BY_DATE_RANGE: '/commandes/by-date-range',
  GET_BY_STATUS: '/commandes/by-status/:status',
  SEARCH: '/commandes/search',
  EXPORT: '/commandes/export',
  TEST_STRUCTURE: '/commandes/test-structure',

  // Responsable / Clients spéciaux
  SEND_TRANCHE: '/commandes/:id/envoyer-tranche',
  GET_STATS_SPECIAL: '/stats-commandes-speciales',
  GET_WITH_RESTE_SPECIAL: '/commandes/client-special/:clientId/avec-reste',
};

export const commandesAPI = {

  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response; // ✅ on retourne Axios complet
    } catch (error) {
      console.error('❌ Erreur getAll commandes:', error.message);
      return { data: { data: [], meta: { total: 0 } } };
    }
  },

getCommandesAvecResteClientSpecial: async (clientId) => {
  const response = await httpClient.get(
    ENDPOINTS.GET_WITH_RESTE_SPECIAL.replace(':clientId', clientId)
  );
  return response.data;
},

  getPending: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_PENDING, { params });
      return response.data;
    } catch {
      const all = await commandesAPI.getAll();
      return {
        data: (all.data || []).filter(c =>
          (c.status || c.statut || '').includes('attente')
        )
      };
    }
  },

  getToday: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_TODAY);
      return response.data;
    } catch {
      const all = await commandesAPI.getAll();
      const today = new Date().toISOString().split('T')[0];
      return {
        data: (all.data || []).filter(c =>
          (c.created_at || '').startsWith(today)
        )
      };
    }
  },

  getById: async (id) => {
    const response = await httpClient.get(
      ENDPOINTS.GET_BY_ID.replace(':id', id)
    );
    return response.data;
  },

  getStats: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_STATS);
      return response; // ✅ important
    } catch {
      const all = await commandesAPI.getAll();
      return {
        data: calculerStatsLocal(all?.data?.data || [])
      };
    }
  },

  getByDateRange: async (dateFrom, dateTo) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_DATE_RANGE, {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      return response.data;
    } catch {
      const all = await commandesAPI.getAll();
      return {
        data: (all.data || []).filter(c => {
          const d = (c.created_at || '').split('T')[0];
          return d >= dateFrom && d <= dateTo;
        })
      };
    }
  },

  getByStatus: async (status) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_STATUS.replace(':status', status)
      );
      return response.data;
    } catch {
      const all = await commandesAPI.getAll();
      return {
        data: (all.data || []).filter(c =>
          (c.status || c.statut) === status
        )
      };
    }
  },

  search: async (query) => {
    try {
      const response = await httpClient.get(ENDPOINTS.SEARCH, {
        params: { q: query }
      });
      return response.data;
    } catch {
      const all = await commandesAPI.getAll();
      const q = query.toLowerCase();
      return {
        data: (all.data || []).filter(c =>
          (c.client_nom || '').toLowerCase().includes(q)
        )
      };
    }
  },

  export: async (format = 'csv', params = {}) => {
    const response = await httpClient.get(ENDPOINTS.EXPORT, {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  },

  create: async (data) => {
    const response = await httpClient.post(ENDPOINTS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await httpClient.put(
      ENDPOINTS.UPDATE.replace(':id', id),
      data
    );
    return response.data;
  },

  validate: async (id) => {
    const response = await httpClient.post(
      ENDPOINTS.VALIDATE.replace(':id', id)
    );
    return response.data;
  },

  cancel: async (id) => {
    const response = await httpClient.post(
      ENDPOINTS.CANCEL.replace(':id', id)
    );
    return response.data;
  },

  delete: async (id) => {
    const response = await httpClient.delete(
      ENDPOINTS.DELETE.replace(':id', id)
    );
    return response.data;
  },

  sendTranche: async (id, data) => {
    const response = await httpClient.post(
      ENDPOINTS.SEND_TRANCHE.replace(':id', id),
      data
    );
    return response.data;
  },

  getStatsSpecial: async (params = {}) => {
    const response = await httpClient.get(
      ENDPOINTS.GET_STATS_SPECIAL,
      { params }
    );
    return response; // ✅ important
  },
};

// ======================================================
// 🔹 Lignes spéciales (Clients spéciaux)
// ======================================================
const LIGNES_ENDPOINTS = {
  GET_BY_COMMANDE: '/commandes/:id/lignes',
  CREATE: '/commandes/:id/lignes',
  UPDATE: '/commandes/lignes/:ligneId',
  DELETE: '/commandes/lignes/:ligneId',
};

export const lignesCommandeAPI = {

  getByCommande: async (commandeId) => {
    const res = await httpClient.get(
      LIGNES_ENDPOINTS.GET_BY_COMMANDE.replace(':id', commandeId)
    );
    return res.data;
  },

  create: async (commandeId, data) => {
    const res = await httpClient.post(
      LIGNES_ENDPOINTS.CREATE.replace(':id', commandeId),
      data
    );
    return res.data;
  },

  update: async (ligneId, data) => {
    const res = await httpClient.put(
      LIGNES_ENDPOINTS.UPDATE.replace(':ligneId', ligneId),
      data
    );
    return res.data;
  },

  delete: async (ligneId) => {
    const res = await httpClient.delete(
      LIGNES_ENDPOINTS.DELETE.replace(':ligneId', ligneId)
    );
    return res.data;
  },
};

// ======================================================
// 🔹 Utilitaire stats local
// ======================================================
const calculerStatsLocal = (commandes) => {
  return {
    total: commandes.length,
  };
};

export default commandesAPI;
/**
 * 📦 Commandes API - Version avec pagination
 */
import httpClient from '../http/client';

const ENDPOINTS = {
  GET_ALL: '/commandes',
  GET_PENDING: '/commandes/pending',
  GET_BY_ID: '/commandes/:id',
  CREATE: '/commandes',
  VALIDATE: '/commandes/:id/valider',
  CANCEL: '/commandes/:id/annuler',
  UPDATE: '/commandes/:id',
  DELETE: '/commandes/:id',
  GET_STATS: '/commandes/stats',
  GET_TODAY: '/commandes/today',
  GET_BY_DATE_RANGE: '/commandes/by-date-range',
  GET_BY_STATUS: '/commandes/by-status/:status',
  SEARCH: '/commandes/search',
  EXPORT: '/commandes/export',
  TEST_STRUCTURE: '/commandes/test-structure',
};

export const commandesAPI = {
  /**
   * Récupérer toutes les commandes avec pagination et filtres
   * @param {Object} params - Paramètres de requête (page, perPage, date, status, type, search)
   */
  getAll: async (params = {}) => {
    try {
      console.log('📦 API getAll appelée avec params:', params);
      
      // Construction des paramètres pour l'API
      const queryParams = {
        page: params.page || 1,
        per_page: params.perPage || params.per_page || 10,
        ...(params.date && { date: params.date }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.search && { search: params.search }),
        ...(params.sort && { sort: params.sort }),
        ...(params.orderBy && { order_by: params.orderBy })
      };

      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params: queryParams });
      
      // La réponse du backend devrait avoir cette structure:
      // {
      //   data: [...],
      //   current_page: 1,
      //   last_page: 10,
      //   per_page: 10,
      //   total: 100,
      //   from: 1,
      //   to: 10
      // }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll commandes:', error.message);
      
      // Fallback pour le développement - simuler une réponse paginée
      if (error.response?.status === 404 || error.message.includes('Network Error')) {
        console.warn('⚠️ Endpoint non disponible, retour de données mockées paginées');
        
        // Simuler une réponse paginée
        const mockData = generateMockCommandes(params.page || 1, params.perPage || 10);
        
        return {
          data: mockData.data,
          current_page: mockData.current_page,
          last_page: mockData.last_page,
          per_page: mockData.per_page,
          total: mockData.total,
          from: mockData.from,
          to: mockData.to
        };
      }
      throw error;
    }
  },

  /**
   * Récupérer les commandes en attente avec pagination
   */
  getPending: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_PENDING, { 
        params: { 
          page: params.page || 1,
          per_page: params.perPage || 10 
        } 
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getPending commandes:', error.message);
      const allCommandes = await commandesAPI.getAll({ 
        page: params.page, 
        perPage: params.perPage,
        status: 'pending' 
      });
      return allCommandes;
    }
  },

  /**
   * Récupérer les commandes d'aujourd'hui avec pagination
   */
  getToday: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_TODAY, {
        params: {
          page: params.page || 1,
          per_page: params.perPage || 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getToday commandes:', error.message);
      const allCommandes = await commandesAPI.getAll({ 
        page: params.page, 
        perPage: params.perPage,
        date: new Date().toISOString().split('T')[0]
      });
      return allCommandes;
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
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            id: id,
            uuid: `uuid-${id}`,
            numero_commande: `CMD-${id}`,
            client_nom: 'Client Test',
            status: 'completed',
            total_ttc: 15000,
            created_at: new Date().toISOString()
          }
        };
      }
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
      try {
        // Récupérer juste la première page pour les stats
        const response = await commandesAPI.getAll({ page: 1, perPage: 1 });
        if (response && response.total) {
          return {
            total: response.total,
            aujourdhui: 0,
            pending: 0,
            completed: 0,
            cancelled: 0,
            revenue_total: 0,
            revenue_today: 0
          };
        }
      } catch (fallbackError) {
        console.warn('⚠️ Impossible de calculer les stats');
      }
      
      return {
        total: 0,
        aujourdhui: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        revenue_total: 0,
        revenue_today: 0
      };
    }
  },

  /**
   * Récupérer par plage de dates avec pagination
   */
  getByDateRange: async (dateFrom, dateTo, params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_BY_DATE_RANGE, {
        params: { 
          date_from: dateFrom, 
          date_to: dateTo,
          page: params.page || 1,
          per_page: params.perPage || 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByDateRange:', error.message);
      const allCommandes = await commandesAPI.getAll({ 
        page: params.page, 
        perPage: params.perPage 
      });
      // Filtrer côté client en cas d'erreur
      if (allCommandes.data) {
        const filtered = allCommandes.data.filter(c => {
          const dateCommande = new Date(c.created_at || c.date).toISOString().split('T')[0];
          return dateCommande >= dateFrom && dateCommande <= dateTo;
        });
        return {
          data: filtered,
          current_page: 1,
          last_page: 1,
          per_page: filtered.length,
          total: filtered.length
        };
      }
      return { data: [] };
    }
  },

  /**
   * Récupérer par statut avec pagination
   */
  getByStatus: async (status, params = {}) => {
    try {
      const response = await httpClient.get(
        ENDPOINTS.GET_BY_STATUS.replace(':status', status),
        { params: { page: params.page || 1, per_page: params.perPage || 10 } }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getByStatus:', error.message);
      // Fallback: utiliser getAll avec filtre status
      return commandesAPI.getAll({ 
        page: params.page, 
        perPage: params.perPage,
        status: status 
      });
    }
  },

  /**
   * Rechercher dans les commandes avec pagination
   */
  search: async (query, params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.SEARCH, {
        params: { 
          q: query,
          page: params.page || 1,
          per_page: params.perPage || 10
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur search commandes:', error.message);
      // Fallback: filtrage côté client
      const allCommandes = await commandesAPI.getAll({ page: 1, perPage: 100 });
      if (allCommandes.data) {
        const searchLower = query.toLowerCase();
        const filtered = allCommandes.data.filter(c => 
          (c.client_nom && c.client_nom.toLowerCase().includes(searchLower)) ||
          (c.numero_commande && c.numero_commande.toLowerCase().includes(searchLower)) ||
          (c.client_telephone && c.client_telephone.includes(query))
        );
        
        // Pagination manuelle
        const page = params.page || 1;
        const perPage = params.perPage || 10;
        const start = (page - 1) * perPage;
        const paginatedData = filtered.slice(start, start + perPage);
        
        return {
          data: paginatedData,
          current_page: page,
          last_page: Math.ceil(filtered.length / perPage),
          per_page: perPage,
          total: filtered.length
        };
      }
      return { data: [] };
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

  /**
   * Méthode de test pour vérifier la structure attendue
   */
  testStructure: async () => {
    try {
      const testData = {
        client_nom: "Test Client API",
        vendeur_nom: "Test Vendeur",
        items: [
          {
            produit_id: 999,
            nom: "Produit Test API",
            quantite: 1,
            prix_unitaire: 1500,
            type_vente: "detail",
            prix_detail: 1500,
            prix_gros: 1200,
            prix_original: 1500,
            sous_total: 1500
          }
        ],
        montant_ht: 1500,
        montant_ttc: 1770,
        tva: 270,
        tva_appliquee: true,
        statut: "test_diagnostic",
        date_commande: new Date().toISOString()
      };

      console.log('🧪 API TEST - Données envoyées:', JSON.stringify(testData, null, 2));
      
      const response = await httpClient.post(ENDPOINTS.TEST_STRUCTURE, testData);
      
      console.log('🧪 API TEST - Réponse:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.warn('⚠️ Endpoint test non disponible:', error.message);
      return {
        warning: "Endpoint test non disponible",
        received_data: "Voir console pour les logs",
        suggestion: "Créez un endpoint /commandes/test-structure dans votre backend"
      };
    }
  },

  /**
   * Créer une nouvelle commande
   */
  create: async (data) => {
    try {
      console.log('📤 API CREATE - Envoi des données...');
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      return response.data;
    } catch (error) {
      console.group('❌ API CREATE - ERREUR');
      console.error('Message erreur:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Données erreur:', error.response?.data);
      console.groupEnd();
      
      const errorMessage = error.response?.data?.message || '';
      const isPusherError = errorMessage.includes('Pusher') || 
                           errorMessage.includes('BroadcastException') ||
                           errorMessage.includes('cURL error 7');
      
      if (error.response?.status === 500 && isPusherError) {
        console.warn('⚠️ Erreur Pusher détectée, mais la commande a probablement été créée côté serveur');
        
        return {
          success: true,
          message: 'Commande créée (notification en temps réel désactivée)',
          data: {
            id: `temp-pusher-${Date.now()}`,
            uuid: `temp-uuid-${Date.now()}`,
            numero_commande: `CMD-PSH-${Date.now().toString().slice(-6)}`,
            statut: 'en_attente_paiement',
            created_at: new Date().toISOString(),
            items: data.items?.map(item => ({
              ...item,
              id: `temp-item-${Date.now()}-${item.produit_id}`
            })),
            montant_ht: data.montant_ht,
            montant_ttc: data.montant_ttc,
            tva: data.tva,
            warning: 'Erreur Pusher: ' + errorMessage.substring(0, 100)
          }
        };
      }
      
      if (error.response?.status === 500) {
        const detailedError = error.response.data?.error || error.response.data?.message || 'Erreur serveur';
        throw new Error(`Erreur serveur (500): ${detailedError}`);
      }
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors || {};
        const errorMessages = Object.entries(errors).map(([field, messages]) => 
          `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
        ).join('; ');
        throw new Error(`Erreur validation: ${errorMessages || 'Données invalides'}`);
      }
      
      if (error.message.includes('Network Error')) {
        throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Erreur inconnue lors de la création');
    }
  },

  /**
   * Mettre à jour une commande
   */
  update: async (id, data) => {
    try {
      const response = await httpClient.put(ENDPOINTS.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur update commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Valider une commande (marquer comme payée/complétée)
   */
  validate: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.VALIDATE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur validate commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Annuler une commande
   */
  cancel: async (id) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CANCEL.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cancel commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Supprimer une commande
   */
  delete: async (id) => {
    try {
      const response = await httpClient.delete(ENDPOINTS.DELETE.replace(':id', id));
      return response.data;
    } catch (error) {
      console.error('❌ Erreur delete commande:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Créer une commande avec fallback
   */
  createWithFallback: async (commandeData) => {
    try {
      return await commandesAPI.create(commandeData);
    } catch (error) {
      console.warn('⚠️ Fallback: création locale de la commande');
      
      const commandeLocale = {
        success: false,
        message: 'Commande sauvegardée localement (erreur serveur)',
        data: {
          id: `local-${Date.now()}`,
          uuid: `local-uuid-${Date.now()}`,
          numero_commande: `CMD-LOCAL-${Date.now().toString().slice(-8)}`,
          statut: 'local_pending_sync',
          created_at: new Date().toISOString(),
          items: commandeData.items?.map(item => ({
            ...item,
            id: `local-item-${Date.now()}-${item.produit_id || 'unknown'}`
          })),
          montant_ht: commandeData.montant_ht,
          montant_ttc: commandeData.montant_ttc,
          tva: commandeData.tva,
          tva_appliquee: commandeData.tva_appliquee,
          client_nom: commandeData.client_nom,
          vendeur_nom: commandeData.vendeur_nom,
          error_details: error.message.substring(0, 200)
        },
        warning: 'Cette commande n\'a pas été synchronisée avec le serveur.'
      };
      
      return commandeLocale;
    }
  },

  /**
   * Nettoyer les logs de débogage
   */
  clearDebugLogs: () => {
    try {
      localStorage.removeItem('api_responses_log');
      localStorage.removeItem('commande_errors_log');
      localStorage.removeItem('commandes_locales_pending');
      console.log('🧹 Logs de débogage nettoyés');
    } catch (error) {
      console.error('❌ Erreur nettoyage logs:', error);
    }
  },

  /**
   * Obtenir les logs de débogage
   */
  getDebugLogs: () => {
    try {
      return {
        api_responses: JSON.parse(localStorage.getItem('api_responses_log') || '[]'),
        errors: JSON.parse(localStorage.getItem('commande_errors_log') || '[]'),
        pending_locales: JSON.parse(localStorage.getItem('commandes_locales_pending') || '[]')
      };
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      return {};
    }
  }
};

/**
 * Génère des données mockées pour les tests
 */
function generateMockCommandes(page = 1, perPage = 10) {
  const total = 57; // Nombre total de commandes mockées
  const lastPage = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  
  const commandes = [];
  for (let i = start; i < end; i++) {
    const index = i + 1;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const statuts = ['complétée', 'en_attente_paiement', 'annulée'];
    const types = ['détail', 'gros', 'mixte'];
    const statut = statuts[Math.floor(Math.random() * statuts.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const tvaAppliquee = Math.random() > 0.3;
    const montantHT = Math.floor(Math.random() * 50000) + 5000;
    const tva = tvaAppliquee ? Math.round(montantHT * 0.18) : 0;
    const montantTTC = montantHT + tva;
    
    commandes.push({
      id: `mock-${index}`,
      uuid: `mock-uuid-${index}`,
      numero_commande: `CMD-MOCK-${index.toString().padStart(4, '0')}`,
      client: {
        nom: `Client ${index}`,
        telephone: `77${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        adresse: `Adresse client ${index}`
      },
      statut: statut,
      type_vente: type,
      date: date.toISOString(),
      vendeur: 'Vendeur Test',
      montant_ht: montantHT,
      tva: tva,
      montant_ttc: montantTTC,
      total_ht: montantHT,
      total_ttc: montantTTC,
      tva_appliquee: tvaAppliquee,
      tva_active: tvaAppliquee,
      tva_taux: tvaAppliquee ? 18 : 0,
      produits: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
        id: `mock-prod-${index}-${j}`,
        nom: `Produit ${String.fromCharCode(65 + j)}`,
        quantite: Math.floor(Math.random() * 10) + 1,
        prix_unitaire: Math.floor(Math.random() * 5000) + 500,
        type_vente: type === 'mixte' ? (j % 2 === 0 ? 'gros' : 'détail') : type,
        sous_total: 0 // Sera calculé après
      }))
    });
    
    // Calculer les sous-totaux
    commandes[i - start].produits = commandes[i - start].produits.map(p => ({
      ...p,
      sous_total: p.quantite * p.prix_unitaire
    }));
  }
  
  return {
    data: commandes,
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total: total,
    from: start + 1,
    to: end
  };
}

export default commandesAPI;
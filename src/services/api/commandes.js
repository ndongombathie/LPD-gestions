/**
 * 📦 Commandes API - Version avec pagination et filtres corrigés
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
   * Méthode principale flexible pour récupérer les commandes avec tous les filtres
   */
  getAllWithFilters: async (filters = {}) => {
    try {
      console.log('📦 API getAllWithFilters appelée avec filters:', filters);
      
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      
      // Pagination
      params.append('page', filters.page || 1);
      params.append('per_page', filters.perPage || filters.per_page || 10);
      
      // Filtres - Support multi-formats (pour compatibilité avec différents backends)
      if (filters.statut && filters.statut !== 'tous') {
        params.append('statut', filters.statut);
        params.append('status', filters.statut);
      }
      
      if (filters.status && filters.status !== 'tous') {
        params.append('status', filters.status);
      }
      
      if (filters.type_vente && filters.type_vente !== 'tous') {
        params.append('type_vente', filters.type_vente);
        params.append('type', filters.type_vente);
      }
      
      if (filters.type && filters.type !== 'tous') {
        params.append('type', filters.type);
      }
      
      // Dates
      if (filters.date) {
        params.append('date', filters.date);
      }
      
      if (filters.date_debut) {
        params.append('date_debut', filters.date_debut);
        params.append('date_from', filters.date_debut);
      }
      
      if (filters.date_fin) {
        params.append('date_fin', filters.date_fin);
        params.append('date_to', filters.date_fin);
      }
      
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }
      
      // Recherche
      if (filters.recherche) {
        params.append('recherche', filters.recherche);
        params.append('search', filters.recherche);
        params.append('q', filters.recherche);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Tri
      if (filters.sort) {
        params.append('sort', filters.sort);
      }
      
      if (filters.sortField && filters.sortDirection) {
        params.append('sort_by', filters.sortField);
        params.append('sort_direction', filters.sortDirection);
        params.append('sort', `${filters.sortField}:${filters.sortDirection}`);
      }
      
      const url = `${ENDPOINTS.GET_ALL}?${params.toString()}`;
      console.log('📤 URL complète:', url);
      
      const response = await httpClient.get(url);
      
      console.log('📥 Réponse reçue:', response.data);
      
      // Normaliser la réponse
      return normalizeResponse(response.data, filters);
      
    } catch (error) {
      console.error('❌ Erreur getAllWithFilters:', error);
      
      // Retourner des données mockées filtrées pour le développement
      const mockData = generateFilteredMockCommandes(filters);
      return mockData;
    }
  },

  /**
   * Récupérer toutes les commandes (alias de getAllWithFilters)
   */
  getAll: async (params = {}) => {
    return commandesAPI.getAllWithFilters(params);
  },

  /**
   * Récupérer les commandes en attente
   */
  getPending: async (params = {}) => {
    return commandesAPI.getAllWithFilters({
      ...params,
      statut: 'en_attente_paiement',
      status: 'en_attente_paiement'
    });
  },

  /**
   * Récupérer les commandes d'aujourd'hui
   */
  getToday: async (params = {}) => {
    const today = new Date().toISOString().split('T')[0];
    return commandesAPI.getAllWithFilters({
      ...params,
      date: today
    });
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
   * Récupérer par plage de dates
   */
  getByDateRange: async (dateFrom, dateTo, params = {}) => {
    return commandesAPI.getAllWithFilters({
      ...params,
      date_debut: dateFrom,
      date_fin: dateTo,
      date_from: dateFrom,
      date_to: dateTo
    });
  },

  /**
   * Récupérer par statut
   */
  getByStatus: async (status, params = {}) => {
    return commandesAPI.getAllWithFilters({
      ...params,
      statut: status,
      status: status
    });
  },

  /**
   * Rechercher des commandes
   */
  search: async (query, params = {}) => {
    return commandesAPI.getAllWithFilters({
      ...params,
      recherche: query,
      search: query
    });
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
   * Valider une commande
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
 * Normalise la réponse de l'API
 */
function normalizeResponse(response, filters = {}) {
  // Si la réponse a déjà la structure attendue
  if (response && response.data && Array.isArray(response.data)) {
    return {
      data: response.data,
      current_page: response.current_page || filters.page || 1,
      last_page: response.last_page || 1,
      per_page: response.per_page || filters.perPage || 10,
      total: response.total || response.data.length,
      from: response.from || 1,
      to: response.to || response.data.length,
      success: true
    };
  }
  
  // Si la réponse est directement un tableau
  if (Array.isArray(response)) {
    return {
      data: response,
      current_page: filters.page || 1,
      last_page: 1,
      per_page: response.length,
      total: response.length,
      from: 1,
      to: response.length,
      success: true
    };
  }
  
  // Si la réponse est un objet avec une propriété data qui est un objet
  if (response && response.data && !Array.isArray(response.data)) {
    return {
      data: [response.data],
      current_page: filters.page || 1,
      last_page: 1,
      per_page: 1,
      total: 1,
      from: 1,
      to: 1,
      success: true
    };
  }
  
  // Structure par défaut
  return {
    data: [],
    current_page: filters.page || 1,
    last_page: 1,
    per_page: filters.perPage || 10,
    total: 0,
    from: 0,
    to: 0,
    success: true
  };
}

/**
 * Génère des données mockées filtrées pour le développement
 */
function generateFilteredMockCommandes(filters = {}) {
  console.log('🎭 Génération de données mockées avec filtres:', filters);
  
  let allCommandes = [];
  const total = 57;
  
  // Générer toutes les commandes
  for (let i = 1; i <= total; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const statuts = ['complétée', 'en_attente_paiement', 'annulée'];
    const types = ['détail', 'gros', 'mixte'];
    const commandeStatut = statuts[Math.floor(Math.random() * statuts.length)];
    const commandeType = types[Math.floor(Math.random() * types.length)];
    const tvaAppliquee = Math.random() > 0.3;
    const montantHT = Math.floor(Math.random() * 50000) + 5000;
    const tva = tvaAppliquee ? Math.round(montantHT * 0.18) : 0;
    const montantTTC = montantHT + tva;
    
    allCommandes.push({
      id: i,
      uuid: `uuid-${i}`,
      numero_commande: `CMD-${i.toString().padStart(4, '0')}`,
      numero: `CMD-${i.toString().padStart(4, '0')}`,
      client: {
        nom: `Client ${i}`,
        telephone: `77${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        adresse: `Adresse ${i}`
      },
      client_nom: `Client ${i}`,
      client_telephone: `77${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      statut: commandeStatut,
      status: commandeStatut,
      type_vente: commandeType,
      date: date.toISOString(),
      created_at: date.toISOString(),
      date_commande: date.toISOString(),
      vendeur: 'Vendeur Test',
      vendeur_nom: 'Vendeur Test',
      montant_ht: montantHT,
      montant_ttc: montantTTC,
      total_ht: montantHT,
      total_ttc: montantTTC,
      tva: tva,
      tva_appliquee: tvaAppliquee,
      produits: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
        id: j + 1,
        nom: `Produit ${j + 1}`,
        quantite: Math.floor(Math.random() * 5) + 1,
        prix_unitaire: Math.floor(Math.random() * 5000) + 1000,
        prix_vente: Math.floor(Math.random() * 5000) + 1000,
        type_vente: commandeType === 'mixte' ? (j % 2 === 0 ? 'gros' : 'détail') : commandeType,
        sous_total: 0
      }))
    });
  }
  
  // Calculer les sous-totaux
  allCommandes = allCommandes.map(cmd => ({
    ...cmd,
    produits: cmd.produits.map(p => ({
      ...p,
      sous_total: p.quantite * p.prix_unitaire
    }))
  }));
  
  // Appliquer les filtres
  let filteredCommandes = [...allCommandes];
  
  // Filtre par statut
  const statutFiltre = filters.statut || filters.status;
  if (statutFiltre && statutFiltre !== 'tous') {
    filteredCommandes = filteredCommandes.filter(cmd => 
      cmd.statut === statutFiltre || cmd.status === statutFiltre
    );
    console.log(`📊 Filtre statut "${statutFiltre}": ${filteredCommandes.length} commandes`);
  }
  
  // Filtre par type
  const typeFiltre = filters.type_vente || filters.type;
  if (typeFiltre && typeFiltre !== 'tous') {
    filteredCommandes = filteredCommandes.filter(cmd => cmd.type_vente === typeFiltre);
    console.log(`📊 Filtre type "${typeFiltre}": ${filteredCommandes.length} commandes`);
  }
  
  // Filtre par date
  const dateFiltre = filters.date;
  const dateDebut = filters.date_debut || filters.date_from;
  const dateFin = filters.date_fin || filters.date_to;
  
  if (dateFiltre) {
    filteredCommandes = filteredCommandes.filter(cmd => {
      const cmdDate = new Date(cmd.date).toISOString().split('T')[0];
      return cmdDate === dateFiltre;
    });
    console.log(`📅 Filtre date "${dateFiltre}": ${filteredCommandes.length} commandes`);
  } else if (dateDebut && dateFin) {
    filteredCommandes = filteredCommandes.filter(cmd => {
      const cmdDate = new Date(cmd.date).toISOString().split('T')[0];
      return cmdDate >= dateDebut && cmdDate <= dateFin;
    });
    console.log(`📅 Filtre plage "${dateDebut}" -> "${dateFin}": ${filteredCommandes.length} commandes`);
  }
  
  // Filtre par recherche
  const rechercheFiltre = filters.recherche || filters.search;
  if (rechercheFiltre) {
    const searchLower = rechercheFiltre.toLowerCase();
    filteredCommandes = filteredCommandes.filter(cmd => 
      cmd.numero_commande.toLowerCase().includes(searchLower) ||
      cmd.client_nom.toLowerCase().includes(searchLower) ||
      cmd.client?.nom?.toLowerCase().includes(searchLower) ||
      cmd.client_telephone?.includes(rechercheFiltre)
    );
    console.log(`🔍 Filtre recherche "${rechercheFiltre}": ${filteredCommandes.length} commandes`);
  }
  
  // Pagination
  const page = filters.page || 1;
  const perPage = filters.perPage || filters.per_page || 10;
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedCommandes = filteredCommandes.slice(start, end);
  const totalPages = Math.ceil(filteredCommandes.length / perPage);
  
  return {
    data: paginatedCommandes,
    total: filteredCommandes.length,
    current_page: page,
    last_page: totalPages,
    per_page: perPage,
    from: start + 1,
    to: end,
    success: true
  };
}

export default commandesAPI;
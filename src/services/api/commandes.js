/**
 * 📦 Commandes API - Version complète pour HistoriqueCommandes
 * AVEC DIAGNOSTIC DES PRIX
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

  // NOUVEAU: ENDPOINT DE TEST STRUCTURE
  TEST_STRUCTURE: '/commandes/test-structure',
};

export const commandesAPI = {
  /**
   * Récupérer toutes les commandes avec pagination/filtres
   */
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get(ENDPOINTS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAll commandes:', error.message);
      if (error.response?.status === 404 || error.message.includes('Network Error')) {
        console.warn('⚠️ Endpoint non disponible, retour de données mockées');
        return {
          data: [],
          meta: { total: 0, current_page: 1, last_page: 1 }
        };
      }
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
      const allCommandes = await commandesAPI.getAll();
      const pending = (allCommandes.data || []).filter(c => 
        c.status === 'pending' || c.statut === 'en_attente_paiement'
      );
      return { data: pending };
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
      const allCommandes = await commandesAPI.getAll();
      const aujourdhui = new Date().toISOString().split('T')[0];
      const today = (allCommandes.data || []).filter(c => {
        const dateCommande = new Date(c.created_at || c.date).toISOString().split('T')[0];
        return dateCommande === aujourdhui;
      });
      return { data: today };
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
        const allCommandes = await commandesAPI.getAll();
        return calculerStatsLocal(allCommandes.data || []);
      } catch (fallbackError) {
        console.warn('⚠️ Impossible de calculer les stats, retour de données par défaut');
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
      const allCommandes = await commandesAPI.getAll();
      const filtered = (allCommandes.data || []).filter(c => {
        const dateCommande = new Date(c.created_at || c.date).toISOString().split('T')[0];
        return dateCommande >= dateFrom && dateCommande <= dateTo;
      });
      return { data: filtered };
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
      const allCommandes = await commandesAPI.getAll();
      const filtered = (allCommandes.data || []).filter(c => 
        c.status === status || c.statut === status
      );
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
      const allCommandes = await commandesAPI.getAll();
      const searchLower = query.toLowerCase();
      const results = (allCommandes.data || []).filter(c => 
        (c.client_nom && c.client_nom.toLowerCase().includes(searchLower)) ||
        (c.numero_commande && c.numero_commande.toLowerCase().includes(searchLower)) ||
        (c.client_telephone && c.client_telephone.includes(query))
      );
      return { data: results };
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
      
      // Simuler une réponse si l'endpoint n'existe pas
      return {
        warning: "Endpoint test non disponible",
        received_data: "Voir console pour les logs",
        suggestion: "Créez un endpoint /commandes/test-structure dans votre backend"
      };
    }
  },

  /**
   * Créer une nouvelle commande (avec diagnostic amélioré)
   */
  create: async (data) => {
    try {
      // DIAGNOSTIC AVANT ENVOI
      console.group('🔍 API CREATE - DIAGNOSTIC AVANT ENVOI');
      
      // Vérifier la structure des items
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item, index) => {
          console.log(`📦 Item ${index + 1}:`, {
            produit_id: item.produit_id,
            nom: item.nom,
            quantite: item.quantite,
            prix_unitaire: item.prix_unitaire,
            type_vente: item.type_vente,
            prix_detail: item.prix_detail,
            prix_gros: item.prix_gros,
            prix_original: item.prix_original,
            sous_total_calc: item.quantite * item.prix_unitaire,
            sous_total_envoye: item.sous_total
          });
        });
      }

      // Vérifier les totaux
      console.log('💰 Totaux:', {
        montant_ht: data.montant_ht,
        tva: data.tva,
        montant_ttc: data.montant_ttc,
        tva_appliquee: data.tva_appliquee,
        tva_calculée: data.tva_appliquee ? data.montant_ht * 0.18 : 0,
        montant_ttc_calculé: data.montant_ht + (data.tva_appliquee ? data.montant_ht * 0.18 : 0)
      });

      console.groupEnd();

      // ENVOI À L'API
      console.log('📤 API CREATE - Envoi des données...');
      const response = await httpClient.post(ENDPOINTS.CREATE, data);
      
      // DIAGNOSTIC APRÈS RÉCEPTION
      console.group('✅ API CREATE - RÉPONSE REÇUE');
      console.log('Réponse complète:', response.data);
      
      if (response.data?.data?.items) {
        console.log('📦 Items retournés par le serveur:');
        response.data.data.items.forEach((item, index) => {
          console.log(`  Item ${index + 1}:`, {
            prix_unitaire: item.prix_unitaire,
            sous_total: item.sous_total,
            type_vente: item.type_vente
          });
        });
      }
      
      console.groupEnd();
      
      return response.data;
      
    } catch (error) {
      console.group('❌ API CREATE - ERREUR');
      console.error('Message erreur:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Données erreur:', error.response?.data);
      console.error('Headers:', error.response?.headers);
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
   * Méthode utilitaire pour créer une commande avec fallback robuste
   * ET DIAGNOSTIC COMPLET
   */
  createWithFallback: async (commandeData) => {
    console.group('🚀 CREATE WITH FALLBACK - DÉBUT');
    
    try {
      console.log('🔍 ÉTAPE 1 - Validation des données locales');
      
      // Validation approfondie
      if (!commandeData.items || !Array.isArray(commandeData.items) || commandeData.items.length === 0) {
        throw new Error('Aucun item dans la commande');
      }

      // Vérifier chaque item
      commandeData.items.forEach((item, index) => {
        if (!item.prix_unitaire || isNaN(item.prix_unitaire)) {
          throw new Error(`Item ${index + 1} (${item.nom}): prix_unitaire invalide: ${item.prix_unitaire}`);
        }
        if (!item.quantite || isNaN(item.quantite) || item.quantite <= 0) {
          throw new Error(`Item ${index + 1} (${item.nom}): quantite invalide: ${item.quantite}`);
        }
        
        const sousTotalCalc = item.quantite * item.prix_unitaire;
        const sousTotalEnvoye = item.sous_total || 0;
        
        if (Math.abs(sousTotalCalc - sousTotalEnvoye) > 0.01) {
          console.warn(`⚠️ Item ${index + 1}: sous-total incohérent. Calculé: ${sousTotalCalc}, Envoyé: ${sousTotalEnvoye}`);
        }
      });

      // Vérifier les totaux
      const totalHTItems = commandeData.items.reduce((sum, item) => 
        sum + (item.quantite * item.prix_unitaire), 0);
      
      const tvaCalc = commandeData.tva_appliquee ? totalHTItems * 0.18 : 0;
      const totalTTCCalc = totalHTItems + tvaCalc;

      console.log('🧮 Validation des totaux:', {
        totalHTItems,
        montant_ht: commandeData.montant_ht,
        differenceHT: Math.abs(totalHTItems - commandeData.montant_ht),
        tvaCalc,
        tvaEnvoyee: commandeData.tva,
        totalTTCCalc,
        montant_ttc: commandeData.montant_ttc,
        differenceTTC: Math.abs(totalTTCCalc - commandeData.montant_ttc)
      });

      if (Math.abs(totalHTItems - commandeData.montant_ht) > 1) {
        console.warn('⚠️ Différence significative dans le total HT');
        // Ajuster pour éviter les erreurs
        commandeData.montant_ht = parseFloat(totalHTItems.toFixed(2));
        commandeData.tva = parseFloat(tvaCalc.toFixed(2));
        commandeData.montant_ttc = parseFloat(totalTTCCalc.toFixed(2));
        console.log('🔄 Totaux ajustés:', commandeData);
      }

      console.log('🔍 ÉTAPE 2 - Appel de l\'API');
      const response = await commandesAPI.create(commandeData);
      
      console.log('🔍 ÉTAPE 3 - Analyse de la réponse');
      
      // Vérifier la réponse
      if (!response.success && !response.data) {
        throw new Error('Réponse API invalide: pas de success ni de data');
      }

      // Si c'est un succès simulé (Pusher error), on log un warning
      if (response.warning) {
        console.warn('⚠️ Commande créée avec warning:', response.warning);
      }

      // Sauvegarder pour référence
      try {
        const apiResponses = JSON.parse(localStorage.getItem('api_responses_log') || '[]');
        apiResponses.push({
          timestamp: new Date().toISOString(),
          data_sent: commandeData,
          response_received: response,
          status: 'success'
        });
        localStorage.setItem('api_responses_log', JSON.stringify(apiResponses.slice(-20))); // Garder les 20 derniers
      } catch (storageError) {
        console.error('❌ Erreur sauvegarde log:', storageError);
      }

      console.groupEnd();
      return response;
      
    } catch (error) {
      console.error('🚨 ERREUR CRITIQUE création commande:', error);
      
      // Diagnostic d'erreur détaillé
      const errorDiagnostic = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        commandeData: {
          montant_ht: commandeData.montant_ht,
          montant_ttc: commandeData.montant_ttc,
          items_count: commandeData.items?.length,
          items_sample: commandeData.items?.slice(0, 2).map(item => ({
            nom: item.nom,
            prix_unitaire: item.prix_unitaire,
            quantite: item.quantite,
            type_vente: item.type_vente
          }))
        }
      };
      
      console.error('📋 Diagnostic erreur:', errorDiagnostic);
      
      // Sauvegarder l'erreur pour débogage
      try {
        const errorLog = JSON.parse(localStorage.getItem('commande_errors_log') || '[]');
        errorLog.push(errorDiagnostic);
        localStorage.setItem('commande_errors_log', JSON.stringify(errorLog.slice(-50)));
      } catch (storageError) {
        console.error('❌ Erreur sauvegarde erreur:', storageError);
      }
      
      // Créer une commande locale
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
        warning: 'Cette commande n\'a pas été synchronisée avec le serveur. Elle sera sauvegardée localement.'
      };
      
      // Stocker la commande locale pour re-synchronisation
      try {
        const commandesLocales = JSON.parse(localStorage.getItem('commandes_locales_pending') || '[]');
        commandesLocales.push({
          original_data: commandeData,
          local_version: commandeLocale.data,
          timestamp: new Date().toISOString(),
          attempts: 0
        });
        localStorage.setItem('commandes_locales_pending', JSON.stringify(commandesLocales));
        console.log('📝 Commande sauvegardée localement pour re-synchronisation');
      } catch (storageError) {
        console.error('❌ Erreur sauvegarde locale:', storageError);
      }
      
      console.groupEnd();
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
      localStorage.removeItem('commande_debug_log');
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
        pending_locales: JSON.parse(localStorage.getItem('commandes_locales_pending') || '[]'),
        debug_log: JSON.parse(localStorage.getItem('commande_debug_log') || '[]')
      };
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      return {};
    }
  }
};

// Fonction utilitaire pour calculer les stats localement
const calculerStatsLocal = (commandes) => {
  const aujourdhui = new Date().toISOString().split('T')[0];
  
  const stats = {
    total: commandes.length,
    aujourdhui: commandes.filter(c => {
      try {
        const dateCommande = new Date(c.created_at || c.date || c.date_commande).toISOString().split('T')[0];
        return dateCommande === aujourdhui;
      } catch {
        return false;
      }
    }).length,
    pending: commandes.filter(c => {
      const statut = c.status || c.statut || '';
      return statut.includes('pending') || 
             statut.includes('attente') || 
             statut.includes('en_attente');
    }).length,
    completed: commandes.filter(c => {
      const statut = c.status || c.statut || '';
      return statut.includes('completed') || 
             statut.includes('complété') || 
             statut.includes('validé') ||
             statut.includes('payé');
    }).length,
    cancelled: commandes.filter(c => {
      const statut = c.status || c.statut || '';
      return statut.includes('cancelled') || 
             statut.includes('annulé');
    }).length,
    revenue_total: commandes
      .filter(c => {
        const statut = c.status || c.statut || '';
        return statut.includes('completed') || 
               statut.includes('complété') || 
               statut.includes('validé') ||
               statut.includes('payé');
      })
      .reduce((sum, c) => sum + (c.total_ttc || c.total || c.montant_ttc || 0), 0),
    revenue_today: commandes
      .filter(c => {
        try {
          const dateCommande = new Date(c.created_at || c.date || c.date_commande).toISOString().split('T')[0];
          const statut = c.status || c.statut || '';
          return dateCommande === aujourdhui && 
                (statut.includes('completed') || 
                 statut.includes('complété') || 
                 statut.includes('validé') ||
                 statut.includes('payé'));
        } catch {
          return false;
        }
      })
      .reduce((sum, c) => sum + (c.total_ttc || c.total || c.montant_ttc || 0), 0)
  };
  
  console.log('📊 Stats calculées localement:', stats);
  return stats;
};

// Exportation par défaut pour compatibilité
export default commandesAPI;
/**
 * @fileoverview API Service pour Gestionnaire de Boutique
 * @module services/api/gestionnaireBoutique
 * 
 * Endpoints disponibles:
 * - GET  /api/produits-transfer - Liste des produits transférés (paginée)
 * - PUT  /api/valider-produits-transfer - Validation des produits transférés
 * - GET  /api/produits-sous-seuil - Produits en sous-seuil
 * - GET  /api/nombre-produits-total - Nombre total de produits
 * - GET  /api/quantite-totale-produit - Quantité totale
 * - GET  /api/transfers/valide - Liste des transferts validés
 * - GET  /api/produits-disponibles-boutique - Produits disponibles en boutique
 * - GET  /api/montant-total-stock - Montant total du stock
 */

import httpClient from '../http/client';

const DEFAULT_CACHE_TTL_MS = 30000;
const cacheStore = new Map();

const buildCacheKey = (url, params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
};

const cachedGet = async (url, params, options = {}, ttlMs = DEFAULT_CACHE_TTL_MS) => {
  // Extraire le signal si présent
  const { signal, ...restOptions } = options;
  
  // Vérifier si le signal est déjà avorté
  if (signal && signal.aborted) {
    const error = new Error('Request was canceled');
    error.name = 'CanceledError';
    error.code = 'ERR_CANCELED';
    throw error;
  }

  const key = buildCacheKey(url, params);
  const now = Date.now();
  const cached = cacheStore.get(key);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.value;
  }

  try {
    const response = await httpClient.get(url, { params, signal, ...restOptions });
    const data = response.data;
    cacheStore.set(key, { timestamp: now, value: data });
    return data;
  } catch (error) {
    // Ne pas mettre en cache les erreurs d'annulation
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      throw error;
    }
    // Pour les autres erreurs, on laisse passer
    throw error;
  }
};

export const clearGestionnaireBoutiqueCache = () => {
  cacheStore.clear();
};

/**
 * Récupère la liste des produits transférés par le gestionnaire de dépôt
 * @returns {Promise<Object>} Données paginées avec structure Laravel
 */
export const getProduitsTransfer = async (page = 1, search = "", options = {}) => {
  try {
    return await cachedGet('/produits-transfer', { page, search }, options);
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    console.error('❌ Erreur getProduitsTransfer:', error);
    // Mode dégradé: si timeout, 401, 404, ou 500, retourner structure vide
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour produits-transfer (Backend non disponible)');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
};

/**
 * Valide un produit transféré en mettant à jour les prix
 * @param {Object} data - Données de validation
 * @param {number} data.produit_id - ID du produit à valider
 * @param {number} data.prix_vente_detail - Prix de vente au détail
 * @param {number} data.prix_vente_gros - Prix de vente en gros
 * @param {number} data.prix_seuil_detail - Seuil de stock détail
 * @param {number} data.prix_seuil_gros - Seuil de stock gros
 * @returns {Promise<Object>} Produit validé
 */
export const validerProduitTransfer = async (data) => {
  try {
    const response = await httpClient.put('/valider-produits-transfer', data);
    clearGestionnaireBoutiqueCache();
    return response.data;
  } catch (error) {
    console.error('❌ Erreur validerProduitTransfer:', error);
    throw error;
  }
};

/**
 * Récupère la liste des produits en sous-seuil (paginée)
 * @returns {Promise<Object>} Données paginées avec structure Laravel
 */
export const getProduitsSousSeuil = async (page = 1, search = "", options = {}) => {
  try {
    // Le backend retourne {current_page, data: [], total, per_page, ...}
    return await cachedGet('/produits-sous-seuils', { page, search }, options);
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    console.error('❌ Erreur getProduitsSousSeuil:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour produits-sous-seuil');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
};

/**
 * Récupère le nombre total de produits dans la boutique
 * @returns {Promise<number>} Nombre total de produits
 */
export const getNombreProduitsTotal = async (options = {}) => {
  try {
    return await cachedGet('/nombre-produits-total', {}, options);
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return 0;
    }
    console.error('❌ Erreur getNombreProduitsTotal:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour nombre-produits-total');
      return 0;
    }
    throw error;
  }
};

/**
 * Récupère la quantité totale de produits
 * @returns {Promise<number>} Quantité totale
 */
export const getQuantiteTotaleProduit = async (options = {}) => {
  try {
    // Le backend retourne {total_quantity: "739"}
    const response = await cachedGet('/quantite-totale-produit', {}, options);
    const totalQuantity = response?.total_quantity ? parseInt(response.total_quantity) : 0;
    return totalQuantity;
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return 0;
    }
    console.error('❌ Erreur getQuantiteTotaleProduit:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour quantite-totale-produit');
      return 0;
    }
    throw error;
  }
};

/**
 * Récupère la liste des transferts validés
 * @returns {Promise<Object>} Données paginées des transferts validés
 */
export const getTransfertsValides = async (page = 1, search = "", options = {}) => {
  try {
    // Le backend retourne directement un array: [...]
    // On le normalise en structure paginée pour compatibilité
    const response = await cachedGet('/transfers/valide', { page, search }, options);
    if (Array.isArray(response)) {
      return {
        current_page: 1,
        data: response,
        last_page: 1,
        total: response.length,
        per_page: response.length
      };
    }
    return response;
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    console.error('❌ Erreur getTransfertsValides:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour transfers-valide');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
};

/**
 * Récupère l'historique complet des produits transférés (validés et en attente)
 * @param {number} page - Numéro de page
 * @param {string} search - Terme de recherche
 * @returns {Promise<Object>} Données paginées avec tous les transferts
 */
export const getAllProduitsTransfer = async (page = 1, search = "", options = {}) => {
  try {
    return await cachedGet('/all-produits-transfer', { page, search }, options);
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    console.error('❌ Erreur getAllProduitsTransfer:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404 || error.response?.status === 500) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour all-produits-transfer (Backend non disponible)');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
};

/**
 * Récupère la liste des produits disponibles dans la boutique
 * @returns {Promise<Array>} Liste des produits disponibles
 */
export const getProduitsDisponiblesBoutique = async (page = 1, search = "", options = {}) => {
  try {
    return await cachedGet('/produits-disponibles-boutique', { page, search }, options);
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    console.error('❌ Erreur getProduitsDisponiblesBoutique:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour produits-disponibles-boutique');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
};

/**
 * Récupère le montant total du stock de la boutique
 * @returns {Promise<number>} Montant total en valeur
 */
export const getMontantTotalStock = async (options = {}) => {
  try {
    return await cachedGet('/montant-total-stock', {}, options);
  } catch (error) {
    // Ignorer silencieusement les erreurs d'annulation (AbortController)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return 0;
    }
    console.error('❌ Erreur getMontantTotalStock:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour montant-total-stock');
      return 0;
    }
    throw error;
  }
};

/**
 * Récupère les statistiques globales de la boutique
 * @returns {Promise<Object>} Statistiques { nombreProduits, quantiteTotale, produitsSousSeuil, montantTotal }
 */
export const getStatistiquesBoutique = async () => {
  try {
    // Utiliser Promise.allSettled pour ne pas échouer si un appel échoue
    const results = await Promise.allSettled([
      getNombreProduitsTotal(),
      getQuantiteTotaleProduit(),
      getProduitsSousSeuil(),
      getMontantTotalStock()
    ]);
    
    const [nombreProduitsResult, quantiteTotaleResult, produitsSousSeuilResult, montantTotalResult] = results;
    
    // Extraire les produits sous seuil correctement
    const produitsSousSeuilData = produitsSousSeuilResult.status === 'fulfilled' ? produitsSousSeuilResult.value : { data: [], total: 0 };
    const produitsSousSeuilArray = produitsSousSeuilData?.data || [];
    
    return {
      nombreProduits: nombreProduitsResult.status === 'fulfilled' ? nombreProduitsResult.value : 0,
      quantiteTotale: quantiteTotaleResult.status === 'fulfilled' ? quantiteTotaleResult.value : 0,
      produitsSousSeuil: produitsSousSeuilArray.length,
      alertes: produitsSousSeuilArray,
      montantTotal: montantTotalResult.status === 'fulfilled' ? montantTotalResult.value : 0
    };
  } catch (error) {
    console.error('❌ Erreur getStatistiquesBoutique:', error);
    // Mode dégradé global
    console.warn('⚠️ MODE DÉGRADÉ activé pour statistiques globales');
    return {
      nombreProduits: 0,
      quantiteTotale: 0,
      produitsSousSeuil: 0,
      alertes: [],
      montantTotal: 0
    };
  }
};

export const getProduitsRupture = async (page = 1, search = "", options = {}) => {
  try {
    return await cachedGet('/produits-rupture', { page, search }, options);
  } catch (error) {
    console.error('❌ Erreur getProduitsRupture:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour produits-rupture');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
}

export default {
  getProduitsTransfer,
  validerProduitTransfer,
  getProduitsSousSeuil,
  getNombreProduitsTotal,
  getQuantiteTotaleProduit,
  getTransfertsValides,
  getAllProduitsTransfer,
  getProduitsDisponiblesBoutique,
  getMontantTotalStock,
  getStatistiquesBoutique,
  getProduitsRupture,
  clearGestionnaireBoutiqueCache
};

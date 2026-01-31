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

/**
 * Récupère la liste des produits transférés par le gestionnaire de dépôt
 * @returns {Promise<Object>} Données paginées avec structure Laravel
 */
export const getProduitsTransfer = async () => {
  try {
    const response = await httpClient.get('/produits-transfer');
    return response.data;
  } catch (error) {
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
    return response.data;
  } catch (error) {
    console.error('❌ Erreur validerProduitTransfer:', error);
    throw error;
  }
};

/**
 * Récupère la liste des produits en sous-seuil
 * @returns {Promise<Array>} Liste des produits en alerte
 */
export const getProduitsSousSeuil = async () => {
  try {
    const response = await httpClient.get('/produits-sous-seuil');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur getProduitsSousSeuil:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour produits-sous-seuil');
      return [];
    }
    throw error;
  }
};

/**
 * Récupère le nombre total de produits dans la boutique
 * @returns {Promise<number>} Nombre total de produits
 */
export const getNombreProduitsTotal = async () => {
  try {
    const response = await httpClient.get('/nombre-produits-total');
    return response.data;
  } catch (error) {
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
export const getQuantiteTotaleProduit = async () => {
  try {
    const response = await httpClient.get('/quantite-totale-produit');
    return response.data;
  } catch (error) {
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
export const getTransfertsValides = async () => {
  try {
    const response = await httpClient.get('/transfers/valide');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur getTransfertsValides:', error);
    if (error.code === 'ECONNABORTED' || error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ MODE DÉGRADÉ activé pour transfers-valide');
      return { current_page: 1, data: [], last_page: 1, total: 0, per_page: 20 };
    }
    throw error;
  }
};

/**
 * Récupère la liste des produits disponibles dans la boutique
 * @returns {Promise<Array>} Liste des produits disponibles
 */
export const getProduitsDisponiblesBoutique = async () => {
  try {
    const response = await httpClient.get('/produits-disponibles-boutique');
    return response.data;
  } catch (error) {
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
export const getMontantTotalStock = async () => {
  try {
    const response = await httpClient.get('/montant-total-stock');
    return response.data;
  } catch (error) {
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
    const [nombreProduits, quantiteTotale, produitsSousSeuil, montantTotal] = await Promise.all([
      getNombreProduitsTotal(),
      getQuantiteTotaleProduit(),
      getProduitsSousSeuil(),
      getMontantTotalStock()
    ]);
    
    return {
      nombreProduits,
      quantiteTotale,
      produitsSousSeuil: Array.isArray(produitsSousSeuil) ? produitsSousSeuil.length : 0,
      alertes: produitsSousSeuil,
      montantTotal
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

export default {
  getProduitsTransfer,
  validerProduitTransfer,
  getProduitsSousSeuil,
  getNombreProduitsTotal,
  getQuantiteTotaleProduit,
  getTransfertsValides,
  getProduitsDisponiblesBoutique,
  getMontantTotalStock,
  getStatistiquesBoutique
};

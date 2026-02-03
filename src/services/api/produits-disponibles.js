/**
 * 🛒 API pour les produits disponibles en boutique
 */

import httpClient from '../http/client';

const ENDPOINTS = {
  LIST: '/produits-disponibles-boutique',
  BY_BARCODE: '/produits-disponibles-boutique/code-barre/',
  BY_REF: '/produits-disponibles-boutique/reference/',
  SEARCH: '/produits-disponibles-boutique/search',
};

/**
 * 🔧 Normalisation des réponses API
 */
const normalizeResponse = (response) => {
  if (!response) return [];
  if (response.data && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

/**
 * ✅ Vérifie si un produit a AU MOINS un transfer VALIDE
 */
const hasValidTransfer = (produit) => {
  if (!Array.isArray(produit.transfers)) return false;

  return produit.transfers.some(
    (t) => t.status === 'valide'
  );
};

/**
 * 🔧 Formater les données produits pour correspondre au format attendu par le frontend
 */
const formatProduit = (produitApi) => {
  // 🔥 Transfers VALIDES uniquement
  const transfersValides = Array.isArray(produitApi.transfers)
    ? produitApi.transfers.filter(t => t.status === 'valide')
    : [];

  // 🔢 Stock réel calculé depuis les transfers validés
  const stockFromTransfers = transfersValides.reduce(
    (sum, t) => sum + (t.quantite || 0),
    0
  );

  return {
    // Données de base
    id: produitApi.id,
    nom: produitApi.nom || produitApi.libelle || produitApi.name || 'Produit sans nom',
    code: produitApi.code || produitApi.reference || 'N/A',
    code_barre: produitApi.code_barre || produitApi.barcode || produitApi.code,

    // Prix
    prix_vente_detail: produitApi.prix_vente_detail || produitApi.prix_detail || produitApi.prix || 0,
    prix_vente_gros: produitApi.prix_vente_gros || produitApi.prix_gros || produitApi.prix_unite_carton || produitApi.prix || 0,
    prix_achat: produitApi.prix_achat || 0,
    prix_total: produitApi.prix_total || 0,

    // Seuils de prix
    prix_seuil_detail:
      produitApi.prix_seuil_detail ||
      Math.round((produitApi.prix_vente_detail || produitApi.prix || 0) * 0.7),

    prix_seuil_gros:
      produitApi.prix_seuil_gros ||
      Math.round((produitApi.prix_vente_gros || produitApi.prix_unite_carton || produitApi.prix || 0) * 0.7),

    // ✅ Stock (UNIQUEMENT VALIDE)
    stock_global: stockFromTransfers,
    stock: stockFromTransfers,
    stock_seuil: produitApi.stock_seuil || 10,
    seuil_alerte: produitApi.stock_seuil || 10,

    // Gestion des cartons
    unite_carton: produitApi.unite_carton || 1,
    prix_unite_carton:
      produitApi.prix_unite_carton ||
      produitApi.prix_vente_gros ||
      produitApi.prix_gros ||
      0,

    nombre_carton:
      produitApi.nombre_carton ||
      Math.floor(stockFromTransfers / (produitApi.unite_carton || 1)),

    // Catégorie
    categorie_id: produitApi.categorie_id,
    categorie: produitApi.categorie_nom || produitApi.categorie || 'Non catégorisé',

    // Dates
    created_at: produitApi.created_at,
    updated_at: produitApi.updated_at,

    // Compatibilité
    prix: produitApi.prix_vente_detail || produitApi.prix_detail || produitApi.prix || 0,
    prix_detail: produitApi.prix_vente_detail || produitApi.prix_detail || produitApi.prix || 0,
    prix_gros:
      produitApi.prix_vente_gros ||
      produitApi.prix_gros ||
      produitApi.prix_unite_carton ||
      produitApi.prix ||
      0,

    prix_seuil:
      produitApi.prix_seuil_detail ||
      Math.round((produitApi.prix_vente_detail || produitApi.prix || 0) * 0.7),
  };
};

export const produitsDisponiblesAPI = {
  /**
   * 📦 Récupérer tous les produits disponibles (VALIDÉS)
   */
  getDisponiblesBoutique: async () => {
    try {
      console.log('🔄 Chargement des produits disponibles...');
      const response = await httpClient.get(ENDPOINTS.LIST);

      console.log('📡 Réponse API produits brutes:', response.data);

      const produitsApi = normalizeResponse(response.data);

      // 🔥 FILTRAGE : seulement les produits VALIDÉS
      const produitsValides = produitsApi.filter(hasValidTransfer);

      // 🔄 Formatage
      const produitsFormates = produitsValides.map(formatProduit);

      console.log('📦 Produits VALIDÉS formatés:', produitsFormates);

      return produitsFormates;
    } catch (error) {
      console.error('❌ Erreur API getDisponiblesBoutique:', error);
      throw error;
    }
  },

  /**
   * 🏷️ Récupérer un produit par code-barre
   */
  getByCodeBarre: async (codeBarre) => {
    if (!codeBarre) return null;

    try {
      const response = await httpClient.get(
        `${ENDPOINTS.BY_BARCODE}${encodeURIComponent(codeBarre)}`
      );

      const data = normalizeResponse(response.data);
      const produit = data.find(hasValidTransfer);

      return produit ? formatProduit(produit) : null;
    } catch (error) {
      console.error('❌ Erreur API getByCodeBarre:', error);
      return null;
    }
  },

  /**
   * 📄 Récupérer un produit par référence
   */
  getByReference: async (reference) => {
    if (!reference) return null;

    try {
      const response = await httpClient.get(
        `${ENDPOINTS.BY_REF}${encodeURIComponent(reference)}`
      );

      const data = normalizeResponse(response.data);
      const produit = data.find(hasValidTransfer);

      return produit ? formatProduit(produit) : null;
    } catch (error) {
      console.error('❌ Erreur API getByReference:', error);
      return null;
    }
  },

  /**
   * 🔍 Recherche de produits (nom, code, catégorie…)
   */
  search: async (searchTerm, params = {}) => {
    if (!searchTerm) return [];

    try {
      const response = await httpClient.get(ENDPOINTS.SEARCH, {
        params: {
          q: searchTerm,
          ...params,
        },
      });

      const produitsApi = normalizeResponse(response.data);

      // 🔥 FILTRAGE + FORMATAGE
      return produitsApi
        .filter(hasValidTransfer)
        .map(formatProduit);
    } catch (error) {
      console.error('❌ Erreur API search:', error);
      return [];
    }
  },
};

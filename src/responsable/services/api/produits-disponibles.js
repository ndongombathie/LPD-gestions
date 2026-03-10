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

  
  if (!response) {

    return [];
  }
  
  // Votre API retourne: { data: [array des produits], ...pagination }
  if (response.data && response.data.data && Array.isArray(response.data.data)) {

    return response.data.data; // Extrait le tableau de data
  }
  
  // Si data est directement un tableau
  if (response.data && Array.isArray(response.data)) {

    return response.data;
  }
  
  // Array directement
  if (Array.isArray(response)) {

    return response;
  }
  

  return [];
};

/**
 * ✅ Vérifie si un transfert est VALIDE
 */
const hasValidTransfer = (transferItem) => {
  if (!transferItem) return false;
  

  
  // Vérifier si le transfert a un statut 'valide'
  return transferItem.status === 'valide';
};

/**
 * 🔧 Formater les données produits pour correspondre au format attendu par le frontend
 */
const formatProduit = (transferItem) => {

  
  if (!transferItem.produit) {

    return null;
  }
  
  const produit = transferItem.produit;
  
  // Calculer les prix si non définis
  const prixVenteDetail = parseFloat(produit.prix_vente_detail) || 0;
  const prixUniteCarton = parseFloat(produit.prix_unite_carton) || 0;
  let prixVenteGros = parseFloat(produit.prix_vente_gros) || prixUniteCarton;
  
  // Si pas de prix défini, calculer à partir du prix d'achat
  let prixFinalDetail = prixVenteDetail;
  let prixFinalGros = prixVenteGros;
  
  if (prixFinalDetail === 0 && produit.prix_achat > 0) {
    prixFinalDetail = Math.round(parseFloat(produit.prix_achat) * 1.3); // +30%
    prixFinalGros = Math.round(prixFinalDetail * 0.8); // -20% pour le gros
  }
  
  // Stock disponible = quantité du transfert VALIDE
  const stockDisponible = parseInt(transferItem.quantite) || 0;
  
  // Calculer les seuils de prix
  const prixSeuilDetail = parseFloat(produit.prix_seuil_detail) || 0;
  const prixSeuilGros = parseFloat(produit.prix_seuil_gros) || 0;
  
  // Calculer nombre de cartons
  const uniteCarton = parseInt(produit.unite_carton) || 0;
  const nombreCarton = parseInt(transferItem.nombre_carton) || 0;
  
  return {
    // Données de base
    id: produit.id,
    nom: produit.nom || 'Produit sans nom',
    code: produit.code || 'N/A',
    reference: produit.code, // Utiliser code comme référence
    code_barre: produit.code, // Pas de code-barre dans vos données, utiliser code

    // Prix
    prix_vente_detail: prixFinalDetail,
    prix_vente_gros: prixFinalGros,
    prix_achat: parseFloat(produit.prix_achat) || 0,
    prix_total: parseFloat(produit.prix_total) || 0,

    // Seuils de prix
    prix_seuil_detail: prixSeuilDetail,
    prix_seuil_gros: prixSeuilGros,

    // ✅ Stock (quantité du transfert VALIDE)
    stock_global: stockDisponible,
    stock: stockDisponible,
    stock_seuil: parseInt(transferItem.seuil) || parseInt(produit.stock_seuil) || 10,
    seuil_alerte: parseInt(transferItem.seuil) || parseInt(produit.stock_seuil) || 10,

    // Gestion des cartons
    unite_carton: uniteCarton,
    prix_unite_carton: prixUniteCarton || prixFinalGros,
    nombre_carton: nombreCarton,

    // Catégorie
    categorie_id: produit.categorie_id,
    categorie: produit.categorie_nom || 'Non catégorisé',

    // Dates
    created_at: produit.created_at,
    updated_at: produit.updated_at,

    // Compatibilité
    prix: prixFinalDetail,
    prix_detail: prixFinalDetail,
    prix_gros: prixFinalGros,
    prix_seuil: prixSeuilDetail,
    
    // Informations du transfert (pour débogage)
    transfer_id: transferItem.id,
    boutique_id: transferItem.boutique_id,
    transfer_quantite: transferItem.quantite,
    transfer_status: transferItem.status,
    transfer_nombre_carton: transferItem.nombre_carton
  };
};

export const produitsDisponiblesAPI = {
  /**
   * 📦 Récupérer tous les produits disponibles (VALIDÉS)
   */
  getDisponiblesBoutique: async () => {
    try {

      const response = await httpClient.get(ENDPOINTS.LIST);
      
      return response.data?.data;
    } catch (error) {

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

      const transferts = normalizeResponse(response.data);

      
      const transfertValide = transferts.find(hasValidTransfer);
      
      if (transfertValide) {
        const produitFormate = formatProduit(transfertValide);

        return produitFormate;
      }
      

      return null;
    } catch (error) {

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

      const transferts = normalizeResponse(response.data);
      const transfertValide = transferts.find(hasValidTransfer);

      return transfertValide ? formatProduit(transfertValide) : null;
    } catch (error) {

      return null;
    }
  },

  /**
   * 🔍 Recherche de produits
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

      const transferts = normalizeResponse(response.data);

      return transferts
        .filter(hasValidTransfer)
        .map(transfert => formatProduit(transfert))
        .filter(produit => produit !== null);
    } catch (error) {

      return [];
    }
  },
  
  /**
   * 🎯 Méthode de débogage
   */
  debugAPI: async () => {
    try {

      const response = await httpClient.get(ENDPOINTS.LIST);

      return response.data;
    } catch (error) {

      return null;
    }
  }
};
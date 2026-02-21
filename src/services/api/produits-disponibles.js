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
  console.log('📦 Normalisation - Réponse reçue:', response);
  
  if (!response) {
    console.log('❌ Réponse vide');
    return [];
  }
  
  // Votre API retourne: { data: [array des produits], ...pagination }
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    console.log('✅ Structure: response.data.data (array paginé)');
    return response.data.data; // Extrait le tableau de data
  }
  
  // Si data est directement un tableau
  if (response.data && Array.isArray(response.data)) {
    console.log('✅ Structure: response.data (array direct)');
    return response.data;
  }
  
  // Array directement
  if (Array.isArray(response)) {
    console.log('✅ Structure: array direct');
    return response;
  }
  
  console.log('⚠️ Structure inconnue, retour tableau vide');
  return [];
};

/**
 * ✅ Vérifie si un transfert est VALIDE
 */
const hasValidTransfer = (transferItem) => {
  if (!transferItem) return false;
  
  console.log('🔍 Vérification transfert:', {
    id: transferItem.id,
    status: transferItem.status,
    produit: transferItem.produit?.nom
  });
  
  // Vérifier si le transfert a un statut 'valide'
  return transferItem.status === 'valide';
};

/**
 * 🔧 Formater les données produits pour correspondre au format attendu par le frontend
 */
const formatProduit = (transferItem) => {
  console.log('🎨 Formatage produit depuis transfert:', transferItem.id);
  
  if (!transferItem.produit) {
    console.error('❌ Produit non trouvé dans le transfert');
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
  const prixSeuilDetail = parseFloat(produit.prix_seuil_detail) || Math.round(prixFinalDetail * 0.7);
  const prixSeuilGros = parseFloat(produit.prix_seuil_gros) || Math.round(prixFinalGros * 0.7);
  
  // Calculer nombre de cartons
  const uniteCarton = parseInt(produit.unite_carton) || 1;
  const nombreCarton = parseInt(transferItem.nombre_carton) || Math.floor(stockDisponible / uniteCarton);
  
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
      console.log('🔄 [API] Chargement des produits disponibles...');
      const response = await httpClient.get(ENDPOINTS.LIST);

      console.log('📡 [API] Réponse API complète:', response);
      console.log('📡 [API] Structure data:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        isArray: Array.isArray(response.data?.data),
        length: response.data?.data?.length
      });

      const transferts = normalizeResponse(response);
      console.log(`📡 [API] ${transferts.length} transferts normalisés`);

      if (transferts.length > 0) {
        console.log('📡 [API] Premier transfert brut:', transferts[0]);
        console.log('📡 [API] Produit dans transfert:', transferts[0]?.produit);
      }

      // 🔥 FILTRAGE : seulement les transferts VALIDÉS
      const transfertsValides = transferts.filter(hasValidTransfer);
      console.log(`📡 [API] ${transfertsValides.length} transferts valides après filtrage`);

      // 🔄 Formatage
      const produitsFormates = transfertsValides
        .map(transfert => formatProduit(transfert))
        .filter(produit => produit !== null); // Filtrer les null

      console.log(`📦 [API] ${produitsFormates.length} produits formatés retournés`);

      if (produitsFormates.length > 0) {
        console.log('📦 [API] Exemple produit formaté:', {
          nom: produitsFormates[0].nom,
          code: produitsFormates[0].code,
          stock: produitsFormates[0].stock,
          prix_detail: produitsFormates[0].prix_vente_detail,
          prix_gros: produitsFormates[0].prix_vente_gros,
          prix_seuil_detail: produitsFormates[0].prix_seuil_detail,
          prix_seuil_gros: produitsFormates[0].prix_seuil_gros
        });
      }

      return produitsFormates;
    } catch (error) {
      console.error('❌ [API] Erreur getDisponiblesBoutique:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  },

  /**
   * 🏷️ Récupérer un produit par code-barre
   */
  getByCodeBarre: async (codeBarre) => {
    if (!codeBarre) return null;

    try {
      console.log(`🔄 [API] Recherche par code-barre: ${codeBarre}`);
      
      const response = await httpClient.get(
        `${ENDPOINTS.BY_BARCODE}${encodeURIComponent(codeBarre)}`
      );

      const transferts = normalizeResponse(response.data);
      console.log(`📡 [API] ${transferts.length} transferts trouvés`);
      
      const transfertValide = transferts.find(hasValidTransfer);
      
      if (transfertValide) {
        const produitFormate = formatProduit(transfertValide);
        console.log('✅ [API] Produit trouvé:', produitFormate.nom);
        return produitFormate;
      }
      
      console.log('❌ [API] Aucun produit valide trouvé');
      return null;
    } catch (error) {
      console.error('❌ [API] Erreur getByCodeBarre:', error);
      return null;
    }
  },

  /**
   * 📄 Récupérer un produit par référence
   */
  getByReference: async (reference) => {
    if (!reference) return null;

    try {
      console.log(`🔄 [API] Recherche par référence: ${reference}`);
      
      const response = await httpClient.get(
        `${ENDPOINTS.BY_REF}${encodeURIComponent(reference)}`
      );

      const transferts = normalizeResponse(response.data);
      const transfertValide = transferts.find(hasValidTransfer);

      return transfertValide ? formatProduit(transfertValide) : null;
    } catch (error) {
      console.error('❌ [API] Erreur getByReference:', error);
      return null;
    }
  },

  /**
   * 🔍 Recherche de produits
   */
  search: async (searchTerm, params = {}) => {
    if (!searchTerm) return [];

    try {
      console.log(`🔄 [API] Recherche: ${searchTerm}`);
      
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
      console.error('❌ [API] Erreur search:', error);
      return [];
    }
  },
  
  /**
   * 🎯 Méthode de débogage
   */
  debugAPI: async () => {
    try {
      console.log('🔍 [DEBUG] Test API...');
      const response = await httpClient.get(ENDPOINTS.LIST);
      console.log('🔍 [DEBUG] Réponse brute:', response.data);
      console.log('🔍 [DEBUG] Keys:', Object.keys(response.data));
      console.log('🔍 [DEBUG] Type data:', typeof response.data.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DEBUG] Erreur:', error);
      return null;
    }
  }
};
import httpClient from '../http/client';

const ENDPOINTS = {
  LIST: '/produits-disponibles-boutique',
  BY_BARCODE: '/produits-disponibles-boutique/code-barre/',
  BY_REF: '/produits-disponibles-boutique/reference/',
  SEARCH: '/produits-disponibles-boutique/search',
};

const normalizeResponse = (response) => {
  if (!response) {
    return [];
  }
  
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  if (Array.isArray(response)) {
    return response;
  }
  
  return [];
};

const hasValidTransfer = (transferItem) => {
  if (!transferItem) return false;
  
  return transferItem.status === 'valide';
};

const formatProduit = (transferItem) => {
  if (!transferItem.produit) {
    return null;
  }
  
  const produit = transferItem.produit;
  
  const prixVenteDetail = parseFloat(produit.prix_vente_detail) || 0;
  const prixUniteCarton = parseFloat(produit.prix_unite_carton) || 0;
  let prixVenteGros = parseFloat(produit.prix_vente_gros) || prixUniteCarton;
  
  let prixFinalDetail = prixVenteDetail;
  let prixFinalGros = prixVenteGros;
  
  if (prixFinalDetail === 0 && produit.prix_achat > 0) {
    prixFinalDetail = Math.round(parseFloat(produit.prix_achat) * 1.3);
    prixFinalGros = Math.round(prixFinalDetail * 0.8);
  }
  
  const stockDisponible = parseInt(transferItem.quantite) || 0;
  
  const prixSeuilDetail = parseFloat(produit.prix_seuil_detail) || Math.round(prixFinalDetail * 0.7);
  const prixSeuilGros = parseFloat(produit.prix_seuil_gros) || Math.round(prixFinalGros * 0.7);
  
  const uniteCarton = parseInt(produit.unite_carton) || 1;
  const nombreCarton = parseInt(transferItem.nombre_carton) || Math.floor(stockDisponible / uniteCarton);
  
  return {
    id: produit.id,
    nom: produit.nom || 'Produit sans nom',
    code: produit.code || 'N/A',
    reference: produit.code,
    code_barre: produit.code,

    prix_vente_detail: prixFinalDetail,
    prix_vente_gros: prixFinalGros,
    prix_achat: parseFloat(produit.prix_achat) || 0,
    prix_total: parseFloat(produit.prix_total) || 0,

    prix_seuil_detail: prixSeuilDetail,
    prix_seuil_gros: prixSeuilGros,

    stock_global: stockDisponible,
    stock: stockDisponible,
    stock_seuil: parseInt(transferItem.seuil) || parseInt(produit.stock_seuil) || 10,
    seuil_alerte: parseInt(transferItem.seuil) || parseInt(produit.stock_seuil) || 10,

    unite_carton: uniteCarton,
    prix_unite_carton: prixUniteCarton || prixFinalGros,
    nombre_carton: nombreCarton,

    categorie_id: produit.categorie_id,
    categorie: produit.categorie_nom || 'Non catégorisé',

    created_at: produit.created_at,
    updated_at: produit.updated_at,

    prix: prixFinalDetail,
    prix_detail: prixFinalDetail,
    prix_gros: prixFinalGros,
    prix_seuil: prixSeuilDetail,
    
    transfer_id: transferItem.id,
    boutique_id: transferItem.boutique_id,
    transfer_quantite: transferItem.quantite,
    transfer_status: transferItem.status,
    transfer_nombre_carton: transferItem.nombre_carton
  };
};

export const produitsDisponiblesAPI = {
  getDisponiblesBoutique: async (page = 1, perPage = 12) => {
    try {
      const response = await httpClient.get(ENDPOINTS.LIST, {
        params: { 
          page,
          per_page: perPage
        }
      });

      return {
        produits: response.data.data,
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total
      };
    } catch (error) {
      throw error;
    }
  },

  getByCodeBarre: async (codeBarre) => {
    if (!codeBarre) return null;

    try {
      const response = await httpClient.get(
        `${ENDPOINTS.BY_BARCODE}${encodeURIComponent(codeBarre)}`
      );

      if (!response.data) {
        return null;
      }

      if (response.data.status !== 'valide') {
        return null;
      }

      const produitFormatPanier = {
        id: response.data.produit_id,
        nom: 'Produit',
        code_barre: codeBarre,
        
        prix_vente_detail: response.data.prix_vente_detail || 0,
        prix_vente_gros: response.data.prix_vente_gros || 0,
        prix_seuil_detail: response.data.prix_seuil_detail || 0,
        prix_seuil_gros: response.data.prix_seuil_gros || 0,
        
        stock_global: response.data.quantite || 0,
        stock: response.data.quantite || 0,
        
        unite_carton: 1,
        prix_unite_carton: response.data.prix_vente_gros || 0,
        
        prix: response.data.prix_vente_detail || 0,
        prix_detail: response.data.prix_vente_detail || 0,
        prix_gros: response.data.prix_vente_gros || 0,
        prix_seuil: response.data.prix_seuil_detail || 0,
        
        transfer_id: response.data.id,
        transfer_quantite: response.data.quantite,
        transfer_status: response.data.status,
      };

      return produitFormatPanier;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      
      return null;
    }
  },

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
  
  debugAPI: async () => {
    try {
      const response = await httpClient.get(ENDPOINTS.LIST);
      return response.data;
    } catch (error) {
      return null;
    }
  }
};
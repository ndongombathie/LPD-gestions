import httpClient from "../http/client";

const PRODUITS_ENDPOINT = "/produits-controle-depots";
const MOUVEMENTS_ENDPOINT = "/mouvements-stock";
const DEFAULT_PER_PAGE = 15;

/**
 * 🟢 Calcul état du stock
 */
const getEtatStock = (stockGlobal, stockSeuil) => {
  if (stockGlobal === 0) return "Rupture";
  if (stockGlobal <= stockSeuil) return "Stock faible";
  return "Disponible";
};

const depotAPI = {
  /**
   * 📦 Produits dépôt - RECHERCHE STRICTE
   */
  getProduitsControle: async (params = {}) => {
    try {
      const {
        page = 1,
        per_page = DEFAULT_PER_PAGE,
        search = '',
        ...filters
      } = params;

      // Construction des paramètres
      const queryParams = new URLSearchParams();
      
      // Paramètres obligatoires
      queryParams.append('page', page);
      queryParams.append('per_page', per_page);
      
      // ✅ RECHERCHE - Envoyée telle quelle au backend
      if (search && search.trim() !== '') {
        queryParams.append('search', search.trim());
        console.log('🔍 RECHERCHE STRICTE:', search.trim());
      }

      const url = `${PRODUITS_ENDPOINT}?${queryParams.toString()}`;
      console.log('📡 URL:', url);

      const res = await httpClient.get(url);
      const payload = res?.data ?? {};

      // Extraction des données
      let rawData = [];
      if (Array.isArray(payload?.data)) {
        rawData = payload.data;
      } else if (Array.isArray(payload)) {
        rawData = payload;
      }

      console.log(`📦 Reçu ${rawData.length} produits du backend`);

      // ✅ SI RECHERCHE ACTIVE, on vérifie que le backend a bien filtré
      if (search && search.trim() !== '' && rawData.length > 0) {
        // Vérification que TOUS les produits contiennent le terme recherché
        const allMatch = rawData.every(p => 
          p.nom?.toLowerCase().includes(search.toLowerCase())
        );
        
        if (!allMatch) {
          console.warn('⚠️ Attention: Le backend n\'a pas filtré correctement!');
        }
      }

      // Transformation des données
      const data = rawData.map((produit) => ({
        id: produit.id,
        nom: produit.nom,
        code: produit.code,
        
        // Fournisseur
        fournisseur_nom: produit.fournisseur?.nom ?? 
                        produit.fournisseur_nom ?? 
                        "Non défini",
        
        fournisseur_id: produit.fournisseur?.id ?? 
                       produit.fournisseur_id ?? 
                       null,
        prix_total: produit.prix_total ?? 0,
        prix_achat: produit.prix_achat ?? produit.prix ?? 0,
        nombre_carton: produit.nombre_carton ?? produit.quantite ?? 0,
        stock_global: produit.stock_global ?? produit.stock ?? 0,
        stock_seuil: produit.stock_seuil ?? produit.seuil ?? 0,
        
        etat_stock: getEtatStock(
          produit.stock_global ?? produit.stock ?? 0,
          produit.stock_seuil ?? produit.seuil ?? 0
        ),
      }));

      // Pagination
      const pagination = {
        currentPage: payload?.current_page ?? payload?.page ?? page,
        lastPage: payload?.last_page ?? payload?.total_pages ?? 1,
        perPage: payload?.per_page ?? payload?.perPage ?? per_page,
        total: payload?.total ?? data.length,
      };

      return { data, pagination };

    } catch (error) {
      console.error("❌ ERREUR API:", error);
      return { 
        data: [], 
        pagination: { currentPage: 1, lastPage: 1, total: 0 } 
      };
    }
  },

  /**
   * 📜 Mouvements d'un produit
   */
  getMouvementsProduit: async (produitId) => {
    try {
      const res = await httpClient.get(MOUVEMENTS_ENDPOINT, {
        params: { 
          produit_id: produitId, 
          per_page: 100 
        }
      });
      
      const payload = res?.data ?? {};
      const rawData = Array.isArray(payload?.data) ? payload.data : 
                     Array.isArray(payload) ? payload : [];
      
      const data = rawData.map(m => ({
        id: m.id,
        type: m.type,
        source: m.source,
        destination: m.destination,
        quantite: m.quantite,
        date: m.date,
      }));

      return { data };
    } catch (error) {
      console.error("❌ Erreur mouvements:", error);
      return { data: [] };
    }
  },
};

export default depotAPI;
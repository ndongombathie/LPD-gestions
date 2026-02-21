// src/gestionnaire-depot/pages/StockContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { produitsAPI } from '../../services/api/produits';
import { categoriesAPI } from '../../services/api/categories';
import { fournisseursAPI } from '../../services/api/fournisseurs';
import { mouvementsAPI } from '../../services/api/mouvements';
import httpClient from '../../services/http/client';

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [movements, setMovements] = useState([]);
  
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [fournisseursLoading, setFournisseursLoading] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);
  
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const loadingPromise = useRef(null);

  const normalizeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  };

  const fetchAllPaginated = async (endpoint) => {
    let allData = [];
    let page = 1;
    let hasMore = true;
    let lastPage = 1;

    while (hasMore) {
      try {
        const response = await httpClient.get(endpoint, { params: { page } });
        const result = response.data;

        if (result && result.data !== undefined) {
          allData = [...allData, ...result.data];
          lastPage = result.last_page || 1;
          if (page >= lastPage) {
            hasMore = false;
          } else {
            page++;
          }
        } else if (Array.isArray(result)) {
          allData = result;
          hasMore = false;
        } else {
          allData = result || [];
          hasMore = false;
        }
        if (page > 50) hasMore = false;
      } catch (error) {
        console.error(`Erreur pagination ${endpoint}:`, error);
        throw error;
      }
    }
    return allData;
  };

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const productsData = await fetchAllPaginated('/produits');
      const normalized = productsData.map(p => ({
        id: p.id || p.uuid,
        nom: p.nom || p.name || 'Sans nom',
        name: p.nom || p.name || 'Sans nom',
        code_barre: p.code_barre || p.code || '',
        barcode: p.code_barre || p.code || '',
        nombre_carton: p.nombre_carton || p.cartons || 0,
        cartons: p.nombre_carton || p.cartons || 0,
        unite_carton: p.unite_carton || p.unitsPerCarton || 1,
        unitsPerCarton: p.unite_carton || p.unitsPerCarton || 1,
        prix_unite_carton: p.prix_unite_carton || p.pricePerCarton || 0,
        pricePerCarton: p.prix_unite_carton || p.pricePerCarton || 0,
        stock_seuil: p.stock_seuil || p.stockMin || 5,
        stockMin: p.stock_seuil || p.stockMin || 5,
        fournisseur_id: p.fournisseur_id || p.fournisseurId || null,
        categorie_id: p.categorie_id || p.categoryId || null,
        categorie_nom: p.categorie_nom || p.category || '',
        category: p.categorie_nom || p.category || '',
        ...p
      }));
      setProducts(normalized);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const categoriesData = await fetchAllPaginated('/categories');
      const normalized = categoriesData.map(c => ({
        id: c.id || c.uuid,
        nom: c.nom || c.name || 'Sans nom',
        name: c.nom || c.name || 'Sans nom',
      }));
      setCategories(normalized);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadFournisseurs = useCallback(async () => {
    setFournisseursLoading(true);
    try {
      const fournisseursData = await fetchAllPaginated('/fournisseurs');
      const normalized = fournisseursData.map(f => ({
        id: f.id || f.uuid,
        nom: f.nom || f.name || 'Inconnu',
        name: f.nom || f.name || 'Inconnu',
        email: f.email || '',
        address: f.adresse || f.address || '',
        contact: f.contactName || f.contact || '',
        phone: f.phone || '',
        produits: f.produits || f.products || '',
        delai: f.delai || f.deliveryDelay || '',
        ordersCount: f.ordersCount || f.commandes || 0,
        status: f.status || 'Actif',
        derniereLivraison: f.derniere_livraison || f.last_delivery || f.last_delivery_date || f.date_derniere_livraison || f.delivery_date || '—',
      }));
      setFournisseurs(normalized);
    } catch (error) {
      console.error('Erreur chargement fournisseurs:', error);
      setFournisseurs([]);
    } finally {
      setFournisseursLoading(false);
    }
  }, []);

  const loadMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      // 1. Récupérer tous les mouvements
      const movementsData = await mouvementsAPI.getAllPaginated();
      
      // 2. Récupérer les transferts en attente
      let pendingTransfers = [];
      try {
        pendingTransfers = await mouvementsAPI.getPendingTransfers();
        console.log('📦 Transferts en attente (brut) :', pendingTransfers);
      } catch (error) {
        console.warn("Impossible de récupérer les transferts en attente, certains IDs pourraient manquer.");
      }

      // 3. Construire une map pour associer un mouvement à son transfer_id
      //    On suppose que chaque transfert a un champ "mouvement_id" et un champ "transfer_id" (ou "id")
      //    Afficher la structure pour la détecter
      const transferMap = new Map();
      if (Array.isArray(pendingTransfers)) {
        pendingTransfers.forEach(t => {
          console.log('🔍 Objet transfert :', t);
          // À adapter selon la structure réelle
          // Exemple : si t contient { mouvement_id: 123, transfert_id: "uuid" }
          const mouvementId = t.mouvement_id || t.mouvementId || t.id_mouvement;
          const transferId = t.transfer_id || t.id || t.transfert_id;
          if (mouvementId && transferId) {
            transferMap.set(mouvementId, transferId);
          } else {
            console.warn('Impossible de trouver mouvement_id ou transfer_id dans', t);
          }
        });
      }

      // 4. Normaliser les mouvements
      const normalized = movementsData.map(m => {
        let type = m.type === 'entree' ? 'Entrée' : 'Sortie';
        let sousType = '';
        let status = '';

        if (m.type === 'entree') {
          status = 'validated';
        } else if (m.type === 'sortie') {
          const motif = m.motif?.toLowerCase() || '';
          if (motif.includes('transfert')) {
            sousType = 'transfert';
          } else {
            sousType = 'diminution';
          }

          const statutRaw = m.statut?.toLowerCase() || '';
          if (statutRaw.includes('en_attente') || statutRaw.includes('en attente')) {
            status = 'pending';
          } else if (statutRaw.includes('validé') || statutRaw.includes('valide')) {
            status = 'validated';
          } else if (statutRaw.includes('annulé') || statutRaw.includes('cancelled')) {
            status = 'cancelled';
          } else {
            if (sousType === 'diminution') {
              status = 'validated';
            } else {
              status = 'pending';
              console.warn(`Transfert sans statut reconnu, mis en attente.`, m);
            }
          }
        }

        // Récupérer le transfer_id depuis la map si disponible
        let transfer_id = m.transfer_id || m.transfert_id || m.id;
        if (transferMap.has(m.id)) {
          transfer_id = transferMap.get(m.id);
        }

        return {
          id: m.id,
          type,
          sousType,
          produit_id: m.produit_id,
          quantite: m.quantite || 0,
          qty: m.quantite || 0,
          date: m.date || m.created_at,
          motif: m.motif || '',
          status,
          created_at: m.created_at,
          updated_at: m.updated_at,
          productName: m.produit?.nom || 'Produit inconnu',
          barcode: m.produit?.code_barre || '',
          stockBefore: m.stock_avant || 0,
          before: m.stock_avant || 0,
          stockAfter: m.stock_apres || 0,
          after: m.stock_apres || 0,
          manager: m.utilisateur?.nom || 'Gestionnaire',
          transfer_id,
        };
      });
      setMovements(normalized);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
      setMovements([]);
    } finally {
      setMovementsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (loadingPromise.current) {
      return loadingPromise.current;
    }
    const promise = (async () => {
      try {
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadFournisseurs(),
          loadMovements(),
        ]);
        setInitialLoadDone(true);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
      } finally {
        loadingPromise.current = null;
      }
    })();
    loadingPromise.current = promise;
    return promise;
  }, [loadProducts, loadCategories, loadFournisseurs, loadMovements]);

  const ensureLoaded = useCallback(async () => {
    if (initialLoadDone) {
      return;
    }
    return refreshAll();
  }, [initialLoadDone, refreshAll]);

  const value = {
    products,
    categories,
    fournisseurs,
    movements,
    productsLoading,
    categoriesLoading,
    fournisseursLoading,
    movementsLoading,
    initialLoadDone,
    ensureLoaded,
    refreshAll,
  };

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
};
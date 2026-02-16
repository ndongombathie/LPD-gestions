// src/gestionnaire-depot/pages/StockContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);

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
        hasMore = false;
      }
    }
    return allData;
  };

  const loadProducts = useCallback(async () => {
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
    }
  }, []);

  const loadCategories = useCallback(async () => {
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
    }
  }, []);

  const loadFournisseurs = useCallback(async () => {
  try {
    const fournisseursData = await fetchAllPaginated('/fournisseurs');
    console.log('📦 Réponse brute API fournisseurs:', fournisseursData); // AJOUT
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
  }
}, []);

  const loadMovements = useCallback(async () => {
    try {
      const movementsData = await mouvementsAPI.getAllPaginated();
      console.log('📦 Mouvements bruts reçus:', movementsData);
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
          transfer_id: m.transfer_id || m.id,
        };
      });
      setMovements(normalized);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
      setMovements([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadFournisseurs(),
        loadMovements(),
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadCategories, loadFournisseurs, loadMovements]);

  useEffect(() => {
    refreshAll();
  }, []);

  const value = {
    products,
    categories,
    fournisseurs,
    movements,
    loading,
    refreshAll,
    refreshProducts: loadProducts,
    refreshCategories: loadCategories,
    refreshFournisseurs: loadFournisseurs,
    refreshMovements: loadMovements,
  };

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
};
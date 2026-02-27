// src/gestionnaire-depot/hooks/useAllProducts.js
import { useState, useEffect, useCallback } from 'react';
import { produitsAPI } from '../../services/api/produits';

export const useAllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    normalCount: 0,
    faibleCount: 0,
    ruptureCount: 0,
    totalValue: 0,
    totalUnits: 0
  });
  
  const [ruptureProducts, setRuptureProducts] = useState([]);
  const [faibleProducts, setFaibleProducts] = useState([]);
  const [normalProducts, setNormalProducts] = useState([]);
  
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    setLoadingStats(true);
    setError(null);
    
    try {
      console.log('📡 Début chargement des données...');
      
      // Charger les produits ET les compteurs ET les listes en parallèle
      const [
        productsRes, 
        totalCountRes,
        normalCountRes, 
        faibleCountRes, 
        ruptureCountRes,
        normalListRes, 
        faibleListRes, 
        ruptureListRes
      ] = await Promise.allSettled([
        produitsAPI.getAll({ page: 1, per_page: 100 }),
        produitsAPI.getNbProduits(),
        produitsAPI.getNbProduitsNormaux(),
        produitsAPI.getNbProduitsSousSeuil(),
        produitsAPI.getNbProduitsEnRupture(),
        produitsAPI.getProduitsNormaux(),
        produitsAPI.getProduitsSousSeuil(),
        produitsAPI.getProduitsEnRupture()
      ]);

      // Fonction pour extraire les compteurs (nombres)
      const extractCount = (result) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          // La réponse peut être un nombre direct
          if (typeof data === 'number') return data;
          // Ou un objet avec une propriété
          return data?.count ?? data?.data ?? data ?? 0;
        }
        return 0;
      };

      // Fonction pour extraire les listes
      const extractListData = (result) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          if (Array.isArray(data)) return data;
          if (data?.data && Array.isArray(data.data)) return data.data;
          return [];
        }
        return [];
      };

      // Extraire les compteurs
      const totalProducts = extractCount(totalCountRes);
      const normalCount = extractCount(normalCountRes);
      const faibleCount = extractCount(faibleCountRes);
      const ruptureCount = extractCount(ruptureCountRes);

      console.log('📊 Compteurs reçus:', {
        total: totalProducts,
        normal: normalCount,
        faible: faibleCount,
        rupture: ruptureCount
      });

      // Extraire les listes
      const normalList = extractListData(normalListRes);
      const faibleList = extractListData(faibleListRes);
      const ruptureList = extractListData(ruptureListRes);

      console.log('📋 Listes reçues:', {
        normal: normalList.length,
        faible: faibleList.length,
        rupture: ruptureList.length
      });

      setNormalProducts(normalList);
      setFaibleProducts(faibleList);
      setRuptureProducts(ruptureList);

      // Traitement des produits (tous)
      if (productsRes.status === 'fulfilled') {
        const firstPage = productsRes.value;
        let allProducts = [];

        if (Array.isArray(firstPage)) {
          allProducts = firstPage;
        } else if (firstPage?.data && Array.isArray(firstPage.data)) {
          allProducts = firstPage.data;
        }

        // Charger les pages suivantes si nécessaire
        const perPage = 100;
        const totalPages = Math.ceil(totalProducts / perPage);

        if (totalPages > 1) {
          const promises = [];
          for (let page = 2; page <= totalPages; page++) {
            promises.push(produitsAPI.getAll({ page, per_page: perPage }));
          }
          const otherPages = await Promise.all(promises);
          otherPages.forEach(pageData => {
            if (Array.isArray(pageData)) {
              allProducts = allProducts.concat(pageData);
            } else if (pageData?.data) {
              allProducts = allProducts.concat(pageData.data);
            }
          });
        }

        console.log('📦 Total produits chargés:', allProducts.length);
        setProducts(allProducts);
        setTotal(allProducts.length);

        // Calculer la valeur totale et les unités
        const totalValue = allProducts.reduce((sum, p) => {
          const cartons = p.nombre_carton ?? 0;
          const pricePerCarton = p.prix_unite_carton ?? 0;
          return sum + (cartons * pricePerCarton);
        }, 0);

        const totalUnits = allProducts.reduce((sum, p) => {
          const cartons = p.nombre_carton ?? 0;
          const unitsPerCarton = Number(p.unite_carton) || 1;
          return sum + (cartons * unitsPerCarton);
        }, 0);

        setStats({
          totalProducts,
          normalCount,
          faibleCount,
          ruptureCount,
          totalValue,
          totalUnits
        });

      } else {
        setStats({
          totalProducts,
          normalCount,
          faibleCount,
          ruptureCount,
          totalValue: 0,
          totalUnits: 0
        });
      }

    } catch (err) {
      console.error('❌ Erreur générale:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStats(false);
      console.log('✅ Chargement terminé');
    }
  }, []);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  return { 
    products, 
    total, 
    loading, 
    error, 
    stats,
    loadingStats,
    normalProducts,
    faibleProducts,
    ruptureProducts,
    refetch: fetchAllProducts 
  };
};
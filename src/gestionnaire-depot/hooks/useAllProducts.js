import { useState, useEffect, useCallback } from 'react';
import { produitsAPI } from '../../services/api/produits';

export const useAllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Première requête pour obtenir le nombre total et la première page
      const firstPage = await produitsAPI.getAll({ page: 1, per_page: 100 });
      let allProducts = [];
      let totalCount = 0;

      // Analyser la structure de la réponse
      if (Array.isArray(firstPage)) {
        allProducts = firstPage;
        totalCount = firstPage.length;
      } else if (firstPage?.data && Array.isArray(firstPage.data)) {
        allProducts = firstPage.data;
        totalCount = firstPage.total || firstPage.data.length;
      } else {
        throw new Error('Format de réponse inattendu');
      }

      // Si le nombre total est supérieur à la page chargée, charger les pages suivantes
      const perPage = 100; // Doit correspondre à ce qui est envoyé à l'API
      const totalPages = Math.ceil(totalCount / perPage);

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

      setProducts(allProducts);
      setTotal(totalCount);
    } catch (err) {
      console.error('❌ Erreur lors du chargement de tous les produits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  return { products, total, loading, error, refetch: fetchAllProducts };
};
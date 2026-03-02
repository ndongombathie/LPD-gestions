// src/gestionnaire-depot/hooks/useProduitsParStatut.js
import { useState, useCallback } from 'react';
import { produitsAPI } from '../../services/api/produits';

export const useProduitsParStatut = () => {
  const [ruptureProducts, setRuptureProducts] = useState([]);
  const [faibleProducts, setFaibleProducts] = useState([]);
  const [normalProducts, setNormalProducts] = useState([]);
  
  const [counts, setCounts] = useState({
    rupture: 0,
    faible: 0,
    normal: 0
  });
  
  const [loading, setLoading] = useState({
    rupture: false,
    faible: false,
    normal: false
  });
  
  const [error, setError] = useState({
    rupture: null,
    faible: null,
    normal: null
  });

  // Charger les compteurs
  const fetchCounts = useCallback(async () => {
    try {
      const [rupture, faible, normal] = await Promise.all([
        produitsAPI.getNbProduitsEnRupture(),
        produitsAPI.getNbProduitsSousSeuil(),
        produitsAPI.getNbProduitsNormaux()
      ]);
      
      setCounts({
        rupture: rupture || 0,
        faible: faible || 0,
        normal: normal || 0
      });
    } catch (error) {
      console.error('❌ Erreur chargement compteurs:', error);
    }
  }, []);

  const fetchRupture = useCallback(async (params = {}) => {
    setLoading(prev => ({ ...prev, rupture: true }));
    setError(prev => ({ ...prev, rupture: null }));
    try {
      console.log("📦 Chargement des produits en rupture avec params:", params);
      const response = await produitsAPI.getProduitsEnRupture(params);
      
      let data = [];
      let totalCount = 0;
      
      if (Array.isArray(response)) {
        data = response;
        totalCount = response.length;
      } else if (response?.data) {
        data = response.data;
        totalCount = response.total || 0;
      } else if (response?.produits) {
        data = response.produits;
        totalCount = response.produits.length;
      }
      
      const formatted = data.map(item => ({
        id: item.id,
        nom: item.nom || item.name || 'Sans nom',
        code: item.code || item.code_barre || '',
        nombre_carton: item.nombre_carton || item.stock_actuel || 0,
        unite_carton: item.unite_carton || item.unites_par_carton || 1,
        prix_unite_carton: item.prix_unite_carton || item.prix || 0,
        stock_seuil: item.stock_seuil || item.seuil_minimum || 5,
        categorie_nom: item.categorie_nom || item.categorie?.nom || 'Général',
        fournisseur_nom: item.fournisseur_nom || item.fournisseur?.nom || ''
      }));
      
      // Filtrer côté client pour être sûr (stock = 0)
      const vraimentRupture = formatted.filter(p => p.nombre_carton === 0);
      
      setRuptureProducts(vraimentRupture);
      return { data: vraimentRupture, total: totalCount };
    } catch (err) {
      console.error('❌ Erreur fetchRupture:', err);
      setError(prev => ({ ...prev, rupture: err.message }));
      setRuptureProducts([]);
      return { data: [], total: 0 };
    } finally {
      setLoading(prev => ({ ...prev, rupture: false }));
    }
  }, []);

  const fetchFaible = useCallback(async (params = {}) => {
    setLoading(prev => ({ ...prev, faible: true }));
    setError(prev => ({ ...prev, faible: null }));
    try {
      console.log("📦 Chargement des produits faibles avec params:", params);
      const response = await produitsAPI.getProduitsSousSeuil(params);
      
      let data = [];
      let totalCount = 0;
      
      if (Array.isArray(response)) {
        data = response;
        totalCount = response.length;
      } else if (response?.data) {
        data = response.data;
        totalCount = response.total || 0;
      } else if (response?.produits) {
        data = response.produits;
        totalCount = response.produits.length;
      }
      
      const formatted = data.map(item => ({
        id: item.id,
        nom: item.nom || item.name || 'Sans nom',
        code: item.code || item.code_barre || '',
        nombre_carton: item.nombre_carton || item.stock_actuel || 0,
        unite_carton: item.unite_carton || item.unites_par_carton || 1,
        prix_unite_carton: item.prix_unite_carton || item.prix || 0,
        stock_seuil: item.stock_seuil || item.seuil_minimum || 5,
        categorie_nom: item.categorie_nom || item.categorie?.nom || 'Général',
        fournisseur_nom: item.fournisseur_nom || item.fournisseur?.nom || ''
      }));
      
      // Filtrer côté client pour être sûr (0 < stock <= seuil)
      const vraimentFaibles = formatted.filter(p => 
        p.nombre_carton > 0 && p.nombre_carton <= p.stock_seuil
      );
      
      setFaibleProducts(vraimentFaibles);
      return { data: vraimentFaibles, total: totalCount };
    } catch (err) {
      console.error('❌ Erreur fetchFaible:', err);
      setError(prev => ({ ...prev, faible: err.message }));
      setFaibleProducts([]);
      return { data: [], total: 0 };
    } finally {
      setLoading(prev => ({ ...prev, faible: false }));
    }
  }, []);

  const fetchNormal = useCallback(async (params = {}) => {
    setLoading(prev => ({ ...prev, normal: true }));
    setError(prev => ({ ...prev, normal: null }));
    try {
      console.log("📦 Chargement des produits normaux avec params:", params);
      const response = await produitsAPI.getProduitsNormaux(params);
      
      let data = [];
      let totalCount = 0;
      
      if (Array.isArray(response)) {
        data = response;
        totalCount = response.length;
      } else if (response?.data) {
        data = response.data;
        totalCount = response.total || 0;
      } else if (response?.produits) {
        data = response.produits;
        totalCount = response.produits.length;
      }
      
      const formatted = data.map(item => ({
        id: item.id,
        nom: item.nom || item.name || 'Sans nom',
        code: item.code || item.code_barre || '',
        nombre_carton: item.nombre_carton || item.stock_actuel || 0,
        unite_carton: item.unite_carton || item.unites_par_carton || 1,
        prix_unite_carton: item.prix_unite_carton || item.prix || 0,
        stock_seuil: item.stock_seuil || item.seuil_minimum || 5,
        categorie_nom: item.categorie_nom || item.categorie?.nom || 'Général',
        fournisseur_nom: item.fournisseur_nom || item.fournisseur?.nom || ''
      }));
      
      // Filtrer côté client pour être sûr (stock > seuil)
      const vraimentNormaux = formatted.filter(p => p.nombre_carton > p.stock_seuil);
      
      setNormalProducts(vraimentNormaux);
      return { data: vraimentNormaux, total: totalCount };
    } catch (err) {
      console.error('❌ Erreur fetchNormal:', err);
      setError(prev => ({ ...prev, normal: err.message }));
      setNormalProducts([]);
      return { data: [], total: 0 };
    } finally {
      setLoading(prev => ({ ...prev, normal: false }));
    }
  }, []);

  return {
    ruptureProducts,
    faibleProducts,
    normalProducts,
    counts,
    loading,
    error,
    fetchCounts,
    fetchRupture,
    fetchFaible,
    fetchNormal,
    refetchAll: () => {
      fetchCounts();
      fetchRupture();
      fetchFaible();
      fetchNormal();
    }
  };
};
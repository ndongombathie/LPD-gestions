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
      console.log("📦 Chargement des produits en rupture...");
      const response = await produitsAPI.getProduitsEnRupture(params);
      console.log("✅ Réponse rupture:", response);
      
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data) {
        data = response.data;
      } else if (response?.produits) {
        data = response.produits;
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
      
      // FILTRAGE : Ne garder que les produits avec stock = 0
      const vraimentRupture = formatted.filter(p => p.nombre_carton === 0);
      console.log(`✅ ${vraimentRupture.length} produits vraiment en rupture (stock=0) sur ${formatted.length} reçus`);
      
      setRuptureProducts(vraimentRupture);
    } catch (err) {
      console.error('❌ Erreur fetchRupture:', err);
      setError(prev => ({ ...prev, rupture: err.message }));
      setRuptureProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, rupture: false }));
    }
  }, []);

  const fetchFaible = useCallback(async (params = {}) => {
    setLoading(prev => ({ ...prev, faible: true }));
    setError(prev => ({ ...prev, faible: null }));
    try {
      console.log("📦 Chargement des produits faibles...");
      const response = await produitsAPI.getProduitsSousSeuil(params);
      console.log("✅ Réponse faible:", response);
      
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data) {
        data = response.data;
      } else if (response?.produits) {
        data = response.produits;
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
      
      // FILTRAGE : Ne garder que les produits avec stock > 0 ET stock <= seuil
      const vraimentFaibles = formatted.filter(p => 
        p.nombre_carton > 0 && p.nombre_carton <= p.stock_seuil
      );
      console.log(`✅ ${vraimentFaibles.length} produits vraiment faibles sur ${formatted.length} reçus`);
      
      setFaibleProducts(vraimentFaibles);
    } catch (err) {
      console.error('❌ Erreur fetchFaible:', err);
      setError(prev => ({ ...prev, faible: err.message }));
      setFaibleProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, faible: false }));
    }
  }, []);

  const fetchNormal = useCallback(async (params = {}) => {
    setLoading(prev => ({ ...prev, normal: true }));
    setError(prev => ({ ...prev, normal: null }));
    try {
      console.log("📦 Chargement des produits normaux...");
      const response = await produitsAPI.getProduitsNormaux(params);
      console.log("✅ Réponse normale:", response);
      
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data) {
        data = response.data;
      } else if (response?.produits) {
        data = response.produits;
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
      
      // FILTRAGE : Ne garder que les produits avec stock > seuil
      const vraimentNormaux = formatted.filter(p => p.nombre_carton > p.stock_seuil);
      console.log(`✅ ${vraimentNormaux.length} produits vraiment normaux sur ${formatted.length} reçus`);
      
      setNormalProducts(vraimentNormaux);
    } catch (err) {
      console.error('❌ Erreur fetchNormal:', err);
      setError(prev => ({ ...prev, normal: err.message }));
      setNormalProducts([]);
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
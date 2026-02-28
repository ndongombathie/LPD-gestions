import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faBarcode,
  faSearch,
  faUser,
  faPhone,
  faMapMarkerAlt,
  faBox,
  faShoppingBag,
  faPallet,
  faPlus,
  faMinus,
  faEdit,
  faRedo,
  faTrash,
  faCheck,
  faTimes,
  faPaperPlane,
  faBan,
  faMoneyBillWave,
  faReceipt,
  faCartArrowDown,
  faCheckSquare,
  faSquare,
  faSpinner,
  faBoxes,
  faExclamationTriangle,
  faUserCircle,
  faWarning,
  faInfoCircle,
  faCheckCircle,
  faExclamationCircle,
  faDatabase,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

import { useReactToPrint } from 'react-to-print';
import TicketCommande from './TicketCommande';

import { produitsDisponiblesAPI } from '../../services/api/produits-disponibles';
import { commandesAPI } from '../../services/api/commandes';
import { clientsAPI } from '../../services/api/clients';
import profileAPI from '../../services/api/profile';
import gestionnaireBoutiqueAPI from '../../services/api/gestionnaireBoutique';
import useDebouncedValue from '../../gestionnaire-boutique/hooks/useDebouncedValue';

const Notification = ({ type, message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const dismissMs = 1500;
    const tickMs = 50;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 150);
    }, dismissMs);

    const step = 100 / (dismissMs / tickMs);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - step));
    }, tickMs);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      case 'error': return faExclamationCircle;
      case 'info': return faInfoCircle;
      default: return faInfoCircle;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-gradient-to-r from-emerald-500 to-green-500';
      case 'warning': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'error': return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'info': return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-[1000] animate-slideInRight ${getBgColor()} text-white rounded-xl shadow-2xl overflow-hidden min-w-[320px] max-w-[400px] border border-white/20`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <FontAwesomeIcon icon={getIcon()} className="text-lg" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm leading-tight">
              {type === 'success' && 'Succès !'}
              {type === 'warning' && 'Attention !'}
              {type === 'error' && 'Erreur !'}
              {type === 'info' && 'Information'}
            </p>
            <p className="text-white/90 text-sm mt-1">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="text-white/70 hover:text-white text-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>
      <div className="h-1 bg-white/20">
        <div 
          className="h-full bg-white/40 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const NouvelleCommande = ({ panier, setPanier, onCommandeValidee, sellerName = null }) => {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [codeBarre, setCodeBarre] = useState('');
  const [client, setClient] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: ''
  });
  const [typeVenteGlobal, setTypeVenteGlobal] = useState('détail');
  const [editionPrix, setEditionPrix] = useState(null);
  const [editionQuantite, setEditionQuantite] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [tvaActive, setTvaActive] = useState(false);
  const [produits, setProduits] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(true);
  const [produitsFiltres, setProduitsFiltres] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [tousLesProduits, setTousLesProduits] = useState([]);
  const [loadingRecherche, setLoadingRecherche] = useState(false);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [totalProduitsFiltres, setTotalProduitsFiltres] = useState(0);
  const [rechercheCurrentPage, setRechercheCurrentPage] = useState(1);
  const [rechercheLastPage, setRechercheLastPage] = useState(1);
  const rechercheTimeout = useRef(null);
  const [commandeImprimee, setCommandeImprimee] = useState(null);
  const ticketRef = useRef();

  const imprimerTicket = useReactToPrint({
    contentRef: ticketRef,
  });

  const [vendeurInfo, setVendeurInfo] = useState({
    nom: sellerName || 'Vendeur',
    prenom: '',
    email: '',
    telephone: '',
    boutique_id: null,
    role: '',
    photo: null
  });
  const [loadingVendeur, setLoadingVendeur] = useState(false);
  const [apiError, setApiError] = useState(null);
 
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const [notifications, setNotifications] = useState([]);

  const inputCodeBarreRef = useRef(null);
  const inputNomClientRef = useRef(null);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const normaliserTypeVente = (type) => {
    if (!type) return 'detail';
    if (type === 'détail') return 'detail';
    if (type === 'gros') return 'gros';
    return type;
  };

  const getTypeVenteAffichage = (type) => {
    if (!type) return 'détail';
    if (type === 'detail') return 'détail';
    if (type === 'gros') return 'gros';
    if (type === 'mixte') return 'Mixte';
    return type;
  };

  const chargerProduits = async (page = currentPage) => {
    try {
      setLoadingProduits(true);
      setErrorMessage('');

      const response = await produitsDisponiblesAPI.getDisponiblesBoutique(page, itemsPerPage);
    
      let produitsData = [];
      let totalPages = 1;

      if (response && response.produits && Array.isArray(response.produits)) {
        produitsData = response.produits;
        totalPages = response.lastPage || response.last_page || 1;
      } else if (response && response.data && response.data.produits && Array.isArray(response.data.produits)) {
        produitsData = response.data.produits;
        totalPages = response.data.lastPage || response.data.last_page || 1;
      } else if (response && response.data && Array.isArray(response.data)) {
        produitsData = response.data;
        totalPages = response.lastPage || response.last_page || 1;
      } else if (Array.isArray(response)) {
        produitsData = response;
      }

      if (produitsData.length > itemsPerPage) {
        produitsData = produitsData.slice(0, itemsPerPage);
      }

      setLastPage(totalPages);
      setCurrentPage(page);

      const produitsFormates = produitsData.map(produit => {
        const produitObj = produit.produit || produit;
        
        const prixDetail = parseFloat(produit.prix_vente_detail || produit.prix || produitObj.prix || 0);
        const prixGros = parseFloat(produit.prix_vente_gros || produit.prix_unite_carton || produitObj.prix_gros || prixDetail * 0.8);
        
        const stockGlobal = parseInt(produit.quantite || produit.stock || produitObj.stock || produitObj.quantite || 0, 10);
        
        return {
          id: produitObj.id || produit.id,
          nom: produitObj.nom || produit.nom || 'Produit sans nom',
          code_barre: produitObj.code_barre || produit.code_barre || '',
          
          prix_vente_detail: prixDetail,
          prix_vente_gros: prixGros,
          prix_achat: parseFloat(produit.prix_achat || 0),
          prix_total: parseFloat(produit.prix_total || 0),
          
          prix_seuil_detail: parseFloat(produit.prix_seuil_detail || prixDetail * 0.7),
          prix_seuil_gros: parseFloat(produit.prix_seuil_gros || prixGros * 0.7),
          
          stock_global: stockGlobal,
          stock_seuil: parseInt(produit.seuil || produit.stock_seuil || 10, 10),
          stock: stockGlobal,
          seuil_alerte: parseInt(produit.seuil || produit.stock_seuil || 10, 10),
          
          unite_carton: parseInt(produit.unite_carton || produit.unite_par_carton || 1, 10),
          prix_unite_carton: prixGros,
          nombre_carton: Math.floor(stockGlobal / (produit.unite_carton || produit.unite_par_carton || 1)),
          
          categorie_id: produit.categorie_id || produitObj.categorie?.id,
          categorie: produit.categorie_nom || produitObj.categorie?.nom || 'Non catégorisé',
          
          created_at: produit.created_at || produitObj.created_at,
          updated_at: produit.updated_at || produitObj.updated_at,
          
          prix: prixDetail,
          prix_detail: prixDetail,
          prix_gros: prixGros,
          prix_seuil: parseFloat(produit.prix_seuil_detail || prixDetail * 0.7)
        };
      });

      setProduits(produitsFormates);
      
      if (!rechercheEnCours) {
        setProduitsFiltres(produitsFormates);
      }

    } catch (error) {
      setErrorMessage('Impossible de charger les produits depuis l\'API.');
      setProduits([]);
      setProduitsFiltres([]);
    } finally {
      setLoadingProduits(false);
    }
  };

  const chargerTousLesProduits = async () => {
    if (!rechercheProduit.trim()) {
      setTousLesProduits([]);
      setRechercheEnCours(false);
      setProduitsFiltres(produits);
      setTotalProduitsFiltres(0);
      return;
    }

    setLoadingRecherche(true);
    setRechercheEnCours(true);
    
    try {
      let page = 1;
      let allProducts = [];
      let hasMorePages = true;
      let maxPages = 10;
      
      while (hasMorePages && page <= maxPages) {
        const response = await produitsDisponiblesAPI.getDisponiblesBoutique(page, 100);
        
        let produitsData = [];
        let lastPage = 1;
        
        if (response && response.produits && Array.isArray(response.produits)) {
          produitsData = response.produits;
          lastPage = response.lastPage || response.last_page || 1;
          hasMorePages = page < lastPage;
        } else if (response && response.data && response.data.produits && Array.isArray(response.data.produits)) {
          produitsData = response.data.produits;
          lastPage = response.data.lastPage || response.data.last_page || 1;
          hasMorePages = page < lastPage;
        } else if (response && response.data && Array.isArray(response.data)) {
          produitsData = response.data;
          lastPage = response.lastPage || response.last_page || 1;
          hasMorePages = page < lastPage;
        } else if (Array.isArray(response)) {
          produitsData = response;
          hasMorePages = false;
        }
        
        const produitsFormatesPage = produitsData.map(produit => {
          const produitObj = produit.produit || produit;
          
          const prixDetail = parseFloat(produit.prix_vente_detail || produit.prix || produitObj.prix || 0);
          const prixGros = parseFloat(produit.prix_vente_gros || produit.prix_unite_carton || produitObj.prix_gros || prixDetail * 0.8);
          const stockGlobal = parseInt(produit.quantite || produit.stock || produitObj.stock || produitObj.quantite || 0, 10);
          
          return {
            id: produitObj.id || produit.id,
            nom: produitObj.nom || produit.nom || 'Produit sans nom',
            code_barre: produitObj.code_barre || produit.code_barre || '',
            prix_vente_detail: prixDetail,
            prix_vente_gros: prixGros,
            prix_achat: parseFloat(produit.prix_achat || 0),
            prix_total: parseFloat(produit.prix_total || 0),
            prix_seuil_detail: parseFloat(produit.prix_seuil_detail || prixDetail * 0.7),
            prix_seuil_gros: parseFloat(produit.prix_seuil_gros || prixGros * 0.7),
            stock_global: stockGlobal,
            stock_seuil: parseInt(produit.seuil || produit.stock_seuil || 10, 10),
            stock: stockGlobal,
            seuil_alerte: parseInt(produit.seuil || produit.stock_seuil || 10, 10),
            unite_carton: parseInt(produit.unite_carton || produit.unite_par_carton || 1, 10),
            prix_unite_carton: prixGros,
            nombre_carton: Math.floor(stockGlobal / (produit.unite_carton || produit.unite_par_carton || 1)),
            categorie_id: produit.categorie_id || produitObj.categorie?.id,
            categorie: produit.categorie_nom || produitObj.categorie?.nom || 'Non catégorisé',
            created_at: produit.created_at || produitObj.created_at,
            updated_at: produit.updated_at || produitObj.updated_at,
            prix: prixDetail,
            prix_detail: prixDetail,
            prix_gros: prixGros,
            prix_seuil: parseFloat(produit.prix_seuil_detail || prixDetail * 0.7)
          };
        });
        
        allProducts = [...allProducts, ...produitsFormatesPage];
        page++;
      }
      
      setTousLesProduits(allProducts);
      
      filtrerProduitsRecherche(allProducts);
      
    } catch (error) {
      addNotification('error', 'Erreur lors de la recherche des produits');
    } finally {
      setLoadingRecherche(false);
    }
  };

  const filtrerProduitsRecherche = (produitsList) => {
    if (!rechercheProduit.trim()) {
      setProduitsFiltres([]);
      setTotalProduitsFiltres(0);
      setRechercheLastPage(1);
      return;
    }

    const searchLower = rechercheProduit.toLowerCase().trim();
    
    const filtres = produitsList.filter(produit => {
      if (!produit) return false;
      
      const nomMatch = produit.nom?.toLowerCase().includes(searchLower) || false;
      const codeBarreMatch = produit.code_barre?.toLowerCase().includes(searchLower) || false;
      const categorieMatch = produit.categorie?.toLowerCase().includes(searchLower) || false;
      
      return nomMatch || codeBarreMatch || categorieMatch;
    });
    
    setTotalProduitsFiltres(filtres.length);
    
    const totalPages = Math.ceil(filtres.length / itemsPerPage);
    setRechercheLastPage(totalPages || 1);
    
    if (rechercheCurrentPage > totalPages && totalPages > 0) {
      setRechercheCurrentPage(totalPages);
    }
    
    const startIndex = (rechercheCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const produitsPagination = filtres.slice(startIndex, endIndex);
    
    setProduitsFiltres(produitsPagination);
  };

  useEffect(() => {
    if (rechercheTimeout.current) {
      clearTimeout(rechercheTimeout.current);
    }

    rechercheTimeout.current = setTimeout(() => {
      if (rechercheProduit.trim()) {
        chargerTousLesProduits();
      } else {
        setRechercheEnCours(false);
        setProduitsFiltres(produits);
        setTotalProduitsFiltres(0);
        setTousLesProduits([]);
      }
    }, 500);

    return () => {
      if (rechercheTimeout.current) {
        clearTimeout(rechercheTimeout.current);
      }
    };
  }, [rechercheProduit]);

  useEffect(() => {
    if (rechercheEnCours && tousLesProduits.length > 0) {
      filtrerProduitsRecherche(tousLesProduits);
    }
  }, [rechercheCurrentPage, rechercheEnCours]);

  useEffect(() => {
    chargerProduits(1);
    chargerInfosVendeur();
  }, []);

  useEffect(() => {
    if (currentPage > 0 && !rechercheEnCours) {
      chargerProduits(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    if (sellerName && sellerName !== vendeurInfo.nom) {
      setVendeurInfo(prev => ({ ...prev, nom: sellerName }));
    }
  }, [sellerName]);

  useEffect(() => {
    if (inputCodeBarreRef.current) {
      inputCodeBarreRef.current.focus();
    }
  }, []);

  const chargerInfosVendeur = async () => {
    try {
      setLoadingVendeur(true);

      const infosVendeur = await profileAPI.getProfile();

      if (infosVendeur) {
        setVendeurInfo({
          nom: infosVendeur.nom || sellerName || 'Vendeur',
          prenom: infosVendeur.prenom || '',
          email: infosVendeur.email || '',
          telephone: infosVendeur.telephone || '',
          boutique_id: infosVendeur.boutique_id || null,
          role: infosVendeur.role || '',
          photo: infosVendeur.photo || null
        });
      }
    } catch (error) {
      if (sellerName) {
        setVendeurInfo(prev => ({ ...prev, nom: sellerName }));
      }
    } finally {
      setLoadingVendeur(false);
    }
  };

  const getVendeurNomComplet = () => {
    if (vendeurInfo.prenom && vendeurInfo.nom) {
      return `${vendeurInfo.prenom} ${vendeurInfo.nom}`.trim();
    }
    return vendeurInfo.nom || 'Vendeur';
  };

  const getVendeurApiData = () => {
    return {
      vendeur_id: vendeurInfo.id || null,
      vendeur_nom: getVendeurNomComplet(),
      vendeur_email: vendeurInfo.email || '',
      vendeur_telephone: vendeurInfo.telephone || '',
      boutique_id: vendeurInfo.boutique_id || null
    };
  };

  const obtenirPrixParType = (produit, typeVente) => {
    if (!produit) {
      return { prix: 0, prix_seuil: 0 };
    }

    const typeNormalise = normaliserTypeVente(typeVente);

    if (typeNormalise === 'gros') {
      return {
        prix: produit.prix_vente_gros || 0,
        prix_seuil: produit.prix_seuil_gros || 0
      };
    }
    
    return {
      prix: produit.prix_vente_detail || 0,
      prix_seuil: produit.prix_seuil_detail || 0
    };
  };

  const ajouterAuPanier = (produit, typeVenteSpecifique = null) => {
    if (!produit) {
      return;
    }

    const typeVente = typeVenteSpecifique || typeVenteGlobal;
    const typeNormalise = normaliserTypeVente(typeVente);

    if (produit.stock_global <= 0) {
      addNotification('error', 'Ce produit est en rupture de stock');
      return;
    }

    if (typeNormalise === 'gros' && produit.unite_carton > 1 && produit.stock_global < produit.unite_carton) {
      addNotification('error', `Stock insuffisant pour vendre en gros (nécessite ${produit.unite_carton} unités)`);
      return;
    }

    const { prix, prix_seuil } = obtenirPrixParType(produit, typeNormalise);

    const produitExistant = panier.find(item =>
      item && item.id === produit.id && item.type_vente === typeNormalise
    );

    if (produitExistant) {
      const stockRestant = produit.stock_global - produitExistant.quantite;
      if (stockRestant <= 0) {
        addNotification('error', 'Stock insuffisant pour ajouter une unité supplémentaire');
        return;
      }

      setPanier(panier.map(item =>
        item && item.id === produit.id && item.type_vente === typeNormalise
          ? { 
              ...item, 
              quantite: item.quantite + 1,
              prix_unitaire: item.prix_vente
            }
          : item
      ));
      addNotification('success', `${produit.nom} quantité augmentée`);
    } else {
      setPanier([...panier.filter(item => item), {
        ...produit,
        quantite: 1,
        type_vente: typeNormalise,
        
        prix_vente: prix,
        prix_base: prix,
        prix_seuil: prix_seuil,
        prix_original: prix,
        
        prix_unitaire: prix,
        prix_detail: produit.prix_vente_detail || produit.prix || 0,
        prix_gros: produit.prix_vente_gros || produit.prix_unite_carton || 0,
        
        type_vente_affichage: typeVente,
        
        stock_initial: produit.stock_global,
        stock_seuil: produit.stock_seuil,
        
        unite_par_carton: produit.unite_carton || 1,
        
        categorie: produit.categorie || 'Non catégorisé'
      }]);
      addNotification('success', `${produit.nom} ajouté au panier`);
    }
  };

  const ajouterParCodeBarre = async () => {
    if (!codeBarre.trim()) {
      addNotification('warning', 'Veuillez saisir un code barre');
      return;
    }

    try {
      const produitTrouve = await produitsDisponiblesAPI.getByCodeBarre(codeBarre);

      if (produitTrouve) {
        const produitFormate = {
          id: produitTrouve.id,
          nom: produitTrouve.nom,
          code_barre: produitTrouve.code_barre || '',
          
          prix_vente_detail: produitTrouve.prix_vente_detail || produitTrouve.prix || 0,
          prix_vente_gros: produitTrouve.prix_vente_gros || produitTrouve.prix_unite_carton || 0,
          prix_achat: produitTrouve.prix_achat || 0,
          prix_total: produitTrouve.prix_total || 0,
          
          prix_seuil_detail: produitTrouve.prix_seuil_detail || Math.round((produitTrouve.prix_vente_detail || produitTrouve.prix || 0) * 0.7),
          prix_seuil_gros: produitTrouve.prix_seuil_gros || Math.round((produitTrouve.prix_vente_gros || produitTrouve.prix_unite_carton || 0) * 0.7),
          
          stock_global: produitTrouve.stock_global || produitTrouve.stock || 0,
          stock_seuil: produitTrouve.stock_seuil || 10,
          stock: produitTrouve.stock_global || produitTrouve.stock || 0,
          seuil_alerte: produitTrouve.stock_seuil || 10,
          
          unite_carton: produitTrouve.unite_carton || 1,
          prix_unite_carton: produitTrouve.prix_unite_carton || produitTrouve.prix_vente_gros || 0,
          nombre_carton: produitTrouve.nombre_carton || Math.floor((produitTrouve.stock_global || 0) / (produitTrouve.unite_carton || 1)),
          
          categorie_id: produitTrouve.categorie_id,
          categorie: produitTrouve.categorie_nom || 'Non catégorisé',
          
          created_at: produitTrouve.created_at,
          updated_at: produitTrouve.updated_at,
          
          prix: produitTrouve.prix_vente_detail || produitTrouve.prix || 0,
          prix_detail: produitTrouve.prix_vente_detail || produitTrouve.prix || 0,
          prix_gros: produitTrouve.prix_vente_gros || produitTrouve.prix_unite_carton || 0,
          prix_seuil: produitTrouve.prix_seuil_detail || Math.round((produitTrouve.prix_vente_detail || produitTrouve.prix || 0) * 0.7)
        };

        ajouterAuPanier(produitFormate, typeVenteGlobal);
        setCodeBarre('');
        if (inputCodeBarreRef.current) {
          inputCodeBarreRef.current.focus();
        }
      } else {
        addNotification('error', 'Aucun produit trouvé avec ce code barre');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors de la recherche du code barre');
    }
  };

  const handleCodeBarreKeyPress = (e) => {
    if (e.key === 'Enter') {
      ajouterParCodeBarre();
    }
  };

  const demarrerEditionQuantite = (produit) => {
    if (!produit) return;

    setEditionQuantite({
      produitId: produit.id,
      typeVente: produit.type_vente,
      nouvelleQuantite: produit.quantite
    });
  };

  const changerQuantiteEdition = (nouvelleQuantite) => {
    if (!editionQuantite) return;

    setEditionQuantite({
      ...editionQuantite,
      nouvelleQuantite: parseInt(nouvelleQuantite) || 0
    });
  };

  const validerModificationQuantite = () => {
    if (!editionQuantite) return;

    const { produitId, typeVente, nouvelleQuantite } = editionQuantite;

    if (nouvelleQuantite <= 0) {
      retirerDuPanier(produitId, typeVente);
    } else {
      const produitOriginal = produits.find(p => p && p.id === produitId);
      if (produitOriginal && nouvelleQuantite > produitOriginal.stock_global) {
        addNotification('error', `Stock insuffisant. Maximum disponible: ${produitOriginal.stock_global}`);
        return;
      }

      setPanier(panier.map(item =>
        item && item.id === produitId && item.type_vente === typeVente
          ? { ...item, quantite: nouvelleQuantite }
          : item
      ));
      addNotification('success', 'Quantité modifiée avec succès');
    }

    setEditionQuantite(null);
  };

  const annulerEditionQuantite = () => {
    setEditionQuantite(null);
  };

  const modifierQuantite = (produitId, typeVente, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      retirerDuPanier(produitId, typeVente);
    } else {
      const produitOriginal = produits.find(p => p && p.id === produitId);
      if (produitOriginal && nouvelleQuantite > produitOriginal.stock_global) {
        addNotification('error', `Stock insuffisant. Maximum disponible: ${produitOriginal.stock_global}`);
        return;
      }

      setPanier(panier.map(item =>
        item && item.id === produitId && item.type_vente === typeVente
          ? { ...item, quantite: nouvelleQuantite }
          : item
      ));
    }
  };

  const retirerDuPanier = (produitId, typeVente) => {
    setPanier(panier.filter(item =>
      !(item && item.id === produitId && item.type_vente === typeVente)
    ));
    if (editionPrix && editionPrix.produitId === produitId && editionPrix.typeVente === typeVente) {
      setEditionPrix(null);
    }
    if (editionQuantite && editionQuantite.produitId === produitId && editionQuantite.typeVente === typeVente) {
      setEditionQuantite(null);
    }
    addNotification('info', 'Produit retiré du panier');
  };

  const demarrerEditionPrix = (produit) => {
    if (!produit) return;

    setEditionPrix({
      produitId: produit.id,
      typeVente: produit.type_vente,
      nouveauPrix: produit.prix_vente,
      prixBase: produit.prix_base,
      prixSeuil: produit.prix_seuil,
      prixOriginal: produit.prix_original
    });
  };

  const changerPrixEdition = (nouveauPrix) => {
    if (!editionPrix) return;

    setEditionPrix({
      ...editionPrix,
      nouveauPrix: parseFloat(nouveauPrix) || 0
    });
  };

  const validerModificationPrix = () => {
    if (!editionPrix) return;

    const { produitId, typeVente, nouveauPrix, prixSeuil } = editionPrix;

    if (nouveauPrix < prixSeuil) {
      addNotification('error', `Prix trop bas ! Le prix ne peut pas être inférieur à ${prixSeuil.toLocaleString()} FCFA`);
      return;
    }

    if (nouveauPrix < 0) {
      addNotification('error', 'Le prix ne peut pas être négatif !');
      return;
    }

    setPanier(panier.map(item =>
      item && item.id === produitId && item.type_vente === typeVente
        ? { ...item, prix_vente: nouveauPrix }
        : item
    ));

    setEditionPrix(null);
    addNotification('success', `Prix modifié à ${nouveauPrix.toLocaleString()} FCFA`);
  };

  const annulerEditionPrix = () => {
    setEditionPrix(null);
  };

  const reinitialiserPrix = (produitId, typeVente) => {
    const produit = panier.find(item =>
      item && item.id === produitId && item.type_vente === typeVente
    );
    if (produit) {
      setPanier(panier.map(item =>
        item && item.id === produitId && item.type_vente === typeVente
          ? { ...item, prix_vente: produit.prix_original }
          : item
      ));
      addNotification('info', `Prix réinitialisé à ${produit.prix_original.toLocaleString()} FCFA`);
    }
  };

  const calculerTotaux = () => {
    const totalHT = panier.reduce((total, item) => {
      if (!item) return total;
      const prix = Number(item.prix_vente) || 0;
      const quantite = Number(item.quantite) || 0;
      return total + (prix * quantite);
    }, 0);

    let tva = 0;
    let totalTTC = totalHT;

    if (tvaActive) {
      tva = Math.round(totalHT * 0.18);
      totalTTC = totalHT + tva;
    }

    return {
      totalHT: Math.round(totalHT),
      tva: tva,
      totalTTC: Math.round(totalTTC)
    };
  };

  const { totalHT, tva, totalTTC } = calculerTotaux();

  const isPusherError = (error) => {
    const errorMessage = error?.response?.data?.message || error?.message || '';
    return errorMessage.includes('Pusher') ||
      errorMessage.includes('BroadcastException') ||
      errorMessage.includes('cURL error 7');
  };

  const validerCommande = async () => {
    if (panier.length === 0) {
      addNotification('warning', 'Le panier est vide !');
      return;
    }

    if (!client.nom.trim() || !client.prenom.trim()) {
      addNotification('error', 'Veuillez saisir le nom ET le prénom du client !');

      if (inputNomClientRef.current) {
        inputNomClientRef.current.focus();
        inputNomClientRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        inputNomClientRef.current.classList.add('border-red-500', 'ring-2', 'ring-red-200');

        setTimeout(() => {
          if (inputNomClientRef.current) {
            inputNomClientRef.current.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
          }
        }, 2000);
      }

      return;
    }

    if (editionPrix || editionQuantite) {
      addNotification('warning', 'Veuillez terminer les modifications en cours !');
      return;
    }

    setEnvoiEnCours(true);
    setApiError(null);

    try {
      const stockInsuffisant = panier.find(item => {
        if (!item) return false;
        const produitOriginal = produits.find(p => p && p.id === item.id);
        return produitOriginal && item.quantite > produitOriginal.stock_global;
      });

      if (stockInsuffisant) {
        addNotification('error', `Stock insuffisant pour ${stockInsuffisant.nom}. Veuillez ajuster les quantités.`);
        setEnvoiEnCours(false);
        return;
      }

      let clientId = null;
      let clientNomFinal = client.nom.trim();
      let clientPrenomFinal = client.prenom.trim();
      let clientTelephoneFinal = client.telephone?.trim() || '';
      let clientAdresseFinal = client.adresse?.trim() || '';

      try {
        const nouveauClient = {
          nom: clientNomFinal,
          prenom: clientPrenomFinal,
          telephone: clientTelephoneFinal,
          adresse: clientAdresseFinal,
          type_client: 'normal',
          solde: 0,
          contact: ''
        };

        const createResponse = await clientsAPI.create(nouveauClient);

        if (createResponse && createResponse.data) {
          if (createResponse.data.id) {
            clientId = createResponse.data.id;
          }
          else if (createResponse.data.data && createResponse.data.data.id) {
            clientId = createResponse.data.data.id;
          }
         
        }
        else if (createResponse && createResponse.id) {
          clientId = createResponse.id;
        }

      } catch  {
          addNotification('error', 'Erreur lors de la création du client. La commande sera créée sans lier le client.');
      }

      const typesDansPanier = [...new Set(panier.filter(item => item).map(item => item.type_vente))];
      const aDuDetail = typesDansPanier.includes('detail');
      const aDuGros = typesDansPanier.includes('gros');
      
      let typeVenteGlobalCommande;
      if (aDuDetail && aDuGros) {
        typeVenteGlobalCommande = 'mixte';
      } else if (aDuGros) {
        typeVenteGlobalCommande = 'gros';
      } else {
        typeVenteGlobalCommande = 'detail';
      }

      
      const vendeurData = getVendeurApiData();

      const itemsData = panier.filter(item => item).map(item => {
        const quantite = parseInt(item.quantite) || 1;
        const prixUnitaire = parseFloat(item.prix_vente) || 0;
        
        const typeVenteArticle = item.type_vente || normaliserTypeVente(typeVenteGlobal);
        
        const itemData = {
          produit_id: item.id,
          nom: item.nom,
          code_barre: item.code_barre,
          quantite: quantite,
          mode_vente: typeVenteArticle,
          type_vente_affichage: typeVenteArticle === 'detail' ? 'détail' : 'gros',
          prix_unitaire: prixUnitaire,
          prix_detail: parseFloat(item.prix_detail || 0),
          prix_gros: parseFloat(item.prix_gros || 0),
          prix_original: parseFloat(item.prix_original || 0),
          stock_initial: parseInt(item.stock_global),
          categorie: item.categorie || 'Non catégorisé'
        };
        
        if (typeVenteArticle === 'gros') {
          itemData.unite_par_carton = parseInt(item.unite_par_carton || 1);
          itemData.est_vente_carton = true;
          itemData.nombre_cartons = Math.ceil(quantite / (item.unite_par_carton || 1));
          itemData.unites_restantes = quantite % (item.unite_par_carton || 1);
        }
        
        return itemData;
      });

      let totalHTCalcule = 0;
      
      panier.filter(item => item).forEach(item => {
        const prix = Number(item.prix_vente) || 0;
        const quantite = Number(item.quantite) || 0;
        totalHTCalcule += prix * quantite;
      });
      
      totalHTCalcule = Math.round(totalHTCalcule);
      
      const tvaCalculee = tvaActive ? Math.round(totalHTCalcule * 0.18) : 0;
      const totalTTCCalcule = totalHTCalcule + tvaCalculee;

      const commandeData = {
        client_id: clientId,
        client_nom: `${clientNomFinal} ${clientPrenomFinal}`.trim(),
        client_prenom: clientPrenomFinal,
        client_nom_famille: clientNomFinal,
        client_telephone: clientTelephoneFinal,
        client_adresse: clientAdresseFinal,

        vendeur_id: vendeurData.vendeur_id,
        vendeur_nom: vendeurData.vendeur_nom,
        vendeur_email: vendeurData.vendeur_email,
        vendeur_telephone: vendeurData.vendeur_telephone,
        boutique_id: vendeurData.boutique_id,

        type_vente: typeVenteGlobalCommande,
        type_vente_original: typeVenteGlobal,
        type_vente_affichage: getTypeVenteAffichage(typeVenteGlobalCommande),
        
        statistiques_types: {
          detail: aDuDetail,
          gros: aDuGros,
          types_presents: typesDansPanier
        },

        items: itemsData,

        montant_ht: totalHTCalcule,
        tva: tvaCalculee,
        montant_ttc: totalTTCCalcule,
        total: totalTTCCalcule,
        
        tva_appliquee: tvaActive,
        tva_taux: tvaActive ? 18 : 0,

        statut: 'en_attente',
        date_commande: new Date().toISOString(),
        mode_paiement: 'non_paye',
        notes: '',

        resume: {
          nombre_articles_detail: itemsData.filter(i => i.type_vente === 'detail').length,
          nombre_articles_gros: itemsData.filter(i => i.type_vente === 'gros').length,
          total_detail: itemsData.filter(i => i.type_vente === 'detail').reduce((sum, i) => sum + (i.prix_unitaire * i.quantite), 0),
          total_gros: itemsData.filter(i => i.type_vente === 'gros').reduce((sum, i) => sum + (i.prix_unitaire * i.quantite), 0)
        }
      };

      let apiResponse = null;
      let apiError = null;
      let commandeCreee = false;

      try {
        apiResponse = await commandesAPI.create(commandeData);
        commandeCreee = true;
      } catch (error) {
        apiError = error;

        if (isPusherError(error)) {
          commandeCreee = true;

          apiResponse = {
            success: true,
            data: {
              id: `temp-pusher-${Date.now()}`,
              numero: `CMD-PSH-${Date.now().toString().slice(-8)}`,
              statut: 'en_attente_paiement',
              created_at: new Date().toISOString(),
              type_vente: typeVenteGlobalCommande,
              total: commandeData.total,
              montant_ht: commandeData.montant_ht,
              tva: commandeData.tva,
              montant_ttc: commandeData.montant_ttc
            }
          };
        }
      }

      let nouvelleCommande;

      if (commandeCreee && apiResponse) {
        nouvelleCommande = {
          id: apiResponse?.data?.id || apiResponse?.data?.uuid || `temp-${Date.now()}`,
          numero_commande: apiResponse?.data?.numero || `CMD-${Date.now().toString().slice(-8)}`,
          date: apiResponse?.data?.created_at || new Date().toISOString(),
          
          type_vente: typeVenteGlobalCommande,
          type_vente_affichage: getTypeVenteAffichage(typeVenteGlobalCommande),
          type_vente_original: typeVenteGlobal,
          
          client: {
            id: clientId,
            nom: clientNomFinal,
            prenom: clientPrenomFinal,
            telephone: clientTelephoneFinal,
            adresse: clientAdresseFinal
          },
          vendeur: {
            id: vendeurData.vendeur_id,
            nom_complet: vendeurData.vendeur_nom,
            nom: vendeurInfo.nom,
            prenom: vendeurInfo.prenom,
            email: vendeurInfo.email,
            telephone: vendeurInfo.telephone,
            boutique_id: vendeurInfo.boutique_id,
            role: vendeurInfo.role
          },
          
          items: panier.filter(item => item).map(item => ({
            produit_id: item.id,
            nom: item.nom,
            code_barre: item.code_barre,
            quantite: item.quantite,
            type_vente: item.type_vente,
            type_vente_affichage: item.type_vente === 'detail' ? 'Détail' : 'Gros',
            prix_unitaire: item.prix_vente,
            prix_base: item.prix_base,
            prix_seuil: item.prix_seuil,
            prix_original: item.prix_original,
            sous_total: item.prix_vente * item.quantite,
            categorie: item.categorie,
            stock_initial: item.stock_global,
            prix_detail: item.prix_detail || 0,
            prix_gros: item.prix_gros || 0,
            unite_par_carton: item.unite_par_carton || 1
          })),
          
          statistiques: {
            types_presents: typesDansPanier,
            nombre_detail: itemsData.filter(i => i.type_vente === 'detail').length,
            nombre_gros: itemsData.filter(i => i.type_vente === 'gros').length,
            total_detail: itemsData.filter(i => i.type_vente === 'detail').reduce((sum, i) => sum + (i.prix_unitaire * i.quantite), 0),
            total_gros: itemsData.filter(i => i.type_vente === 'gros').reduce((sum, i) => sum + (i.prix_unitaire * i.quantite), 0)
          },
          
          total_ht: totalHTCalcule,
          tva: tvaCalculee,
          total_ttc: totalTTCCalcule,
          total: totalTTCCalcule,
          montant_ht: totalHTCalcule,
          montant_ttc: totalTTCCalcule,
          tva_appliquee: tvaActive,
          tva_taux: tvaActive ? 18 : 0,
          
          statut: apiResponse?.data?.statut || 'en_attente_paiement',
          api_success: true,
          api_message: isPusherError(apiError) ? 'Créée avec succès (notification échouée)' : 'Créée avec succès',
          api_data: apiResponse?.data,
          api_error: isPusherError(apiError) ? 'Erreur notification WebSocket' : null,
          has_pusher_error: isPusherError(apiError)
        };
      } else {
        nouvelleCommande = {
          id: `local-${Date.now()}`,
          numero_commande: `CMD-LOCAL-${Date.now().toString().slice(-8)}`,
          date: new Date().toISOString(),
          
          type_vente: typeVenteGlobalCommande,
          type_vente_affichage: getTypeVenteAffichage(typeVenteGlobalCommande),
          type_vente_original: typeVenteGlobal,
          
          client: {
            id: null,
            nom: clientNomFinal,
            prenom: clientPrenomFinal,
            telephone: clientTelephoneFinal,
            adresse: clientAdresseFinal
          },
          vendeur: {
            id: vendeurData.vendeur_id,
            nom_complet: vendeurData.vendeur_nom,
            nom: vendeurInfo.nom,
            prenom: vendeurInfo.prenom,
            email: vendeurInfo.email,
            telephone: vendeurInfo.telephone,
            boutique_id: vendeurInfo.boutique_id,
            role: vendeurInfo.role
          },
          
          items: panier.filter(item => item).map(item => ({
            produit_id: item.id,
            nom: item.nom,
            code_barre: item.code_barre,
            quantite: item.quantite,
            type_vente: item.type_vente,
            type_vente_affichage: item.type_vente === 'detail' ? 'Détail' : 'Gros',
            prix_unitaire: item.prix_vente,
            prix_base: item.prix_base,
            prix_seuil: item.prix_seuil,
            prix_original: item.prix_original,
            sous_total: item.prix_vente * item.quantite,
            categorie: item.categorie,
            stock_initial: item.stock_global,
            prix_detail: item.prix_detail || 0,
            prix_gros: item.prix_gros || 0,
            unite_par_carton: item.unite_par_carton || 1
          })),
          
          statistiques: {
            types_presents: typesDansPanier,
            nombre_detail: itemsData.filter(i => i.type_vente === 'detail').length,
            nombre_gros: itemsData.filter(i => i.type_vente === 'gros').length
          },
          
          total_ht: totalHTCalcule,
          tva: tvaCalculee,
          total_ttc: totalTTCCalcule,
          total: totalTTCCalcule,
          montant_ht: totalHTCalcule,
          montant_ttc: totalTTCCalcule,
          tva_appliquee: tvaActive,
          tva_taux: tvaActive ? 18 : 0,
          
          statut: 'en_attente_paiement',
          api_success: false,
          api_message: 'Créée localement (erreur serveur)',
          api_error: apiError?.message || 'Erreur de connexion',
          is_local: true
        };
      }

      await onCommandeValidee(nouvelleCommande);

      setCommandeImprimee(nouvelleCommande);

      setPanier([]);
      setClient({ nom: '', prenom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
      setCodeBarre('');

      if (inputCodeBarreRef.current) {
        inputCodeBarreRef.current.focus();
      }

      if (apiError && !commandeCreee) {
        setApiError({
          type: 'error',
          message: 'Erreur serveur. Commande sauvegardée localement.',
          details: apiError.response?.data?.message || apiError.message
        });

        addNotification('warning', `Commande ${nouvelleCommande.numero_commande} sauvegardée localement (${totalTTCCalcule.toLocaleString()} FCFA)`);
      } else if (commandeCreee && isPusherError(apiError)) {
        addNotification('success', `Commande ${nouvelleCommande.numero_commande} créée avec succès (${totalTTCCalcule.toLocaleString()} FCFA) !`);
        addNotification('info', 'Les notifications temps-réel sont temporairement indisponibles');
      } else {
        addNotification('success', `Commande ${nouvelleCommande.numero_commande} créée avec succès (${totalTTCCalcule.toLocaleString()} FCFA) !`);
      }

    } catch (error) {

      const typesDansPanier = [...new Set(panier.filter(item => item).map(item => item.type_vente))];
      const typeVenteGlobalCommande = typesDansPanier.includes('detail') && typesDansPanier.includes('gros') ? 'mixte' :
                                    typesDansPanier.includes('gros') ? 'gros' : 'detail';

      let totalHTCalcule = 0;
      panier.filter(item => item).forEach(item => {
        const prix = Number(item.prix_vente) || 0;
        const quantite = Number(item.quantite) || 0;
        totalHTCalcule += prix * quantite;
      });
      
      totalHTCalcule = Math.round(totalHTCalcule);
      const tvaCalculee = tvaActive ? Math.round(totalHTCalcule * 0.18) : 0;
      const totalTTCCalcule = totalHTCalcule + tvaCalculee;

      const commandeLocale = {
        id: `local-${Date.now()}`,
        numero_commande: `CMD-LOCAL-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        
        type_vente: typeVenteGlobalCommande,
        type_vente_affichage: getTypeVenteAffichage(typeVenteGlobalCommande),
        
        client: {
          id: null,
          nom: client.nom.trim(),
          prenom: client.prenom.trim(),
          telephone: client.telephone?.trim() || '',
          adresse: client.adresse?.trim() || ''
        },
        vendeur: getVendeurApiData(),
        
        items: panier.filter(item => item).map(item => ({
          produit_id: item.id,
          nom: item.nom,
          code_barre: item.code_barre,
          quantite: item.quantite,
          type_vente: item.type_vente,
          type_vente_affichage: item.type_vente === 'detail' ? 'Détail' : 'Gros',
          prix_unitaire: item.prix_vente,
          prix_base: item.prix_base,
          prix_seuil: item.prix_seuil,
          prix_original: item.prix_original,
          sous_total: item.prix_vente * item.quantite,
          categorie: item.categorie,
          stock_initial: item.stock_global,
          prix_detail: item.prix_detail || 0,
          prix_gros: item.prix_gros || 0,
          unite_par_carton: item.unite_par_carton || 1
        })),
        
        total_ht: totalHTCalcule,
        tva: tvaCalculee,
        total_ttc: totalTTCCalcule,
        total: totalTTCCalcule,
        montant_ht: totalHTCalcule,
        montant_ttc: totalTTCCalcule,
        tva_appliquee: tvaActive,
        tva_taux: tvaActive ? 18 : 0,
        
        statut: 'en_attente_paiement',
        api_success: false,
        api_message: 'Erreur inattendue',
        api_error: error.message,
        is_local: true
      };
      
      await onCommandeValidee(commandeLocale);

      setApiError({
        type: 'critical',
        message: 'Erreur inattendue. Commande sauvegardée localement.',
        details: error.message
      });

      addNotification('warning', `Erreur inattendue. Commande ${commandeLocale.numero_commande} sauvegardée localement (${totalTTCCalcule.toLocaleString()} FCFA)`);

    } finally {
      setEnvoiEnCours(false);
    }
  };

  const annulerCommande = () => {
    if (panier.length === 0) {
      addNotification('info', 'Aucune commande en cours !');
      return;
    }

    const confirmAnnulation = () => {
      setPanier([]);
      setClient({ nom: '', prenom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
      setCodeBarre('');
      setApiError(null);

      if (inputCodeBarreRef.current) {
        inputCodeBarreRef.current.focus();
      }
      addNotification('info', 'Commande annulée avec succès');
    };

    const modalId = Date.now();
    const modal = document.createElement('div');
    modal.id = `confirm-modal-${modalId}`;
    modal.className = 'fixed inset-0 z-[2000] flex items-center justify-center bg-black/50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-800">Confirmer l'annulation</h3>
        </div>
        <p class="text-gray-600 mb-6">Êtes-vous sûr de vouloir annuler la commande en cours ? Tous les articles du panier seront supprimés.</p>
        <div class="flex gap-3">
          <button id="confirm-cancel-${modalId}" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors">
            Oui, annuler
          </button>
          <button id="cancel-modal-${modalId}" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg font-semibold transition-colors">
            Non, garder
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    document.getElementById(`confirm-cancel-${modalId}`).onclick = () => {
      document.body.removeChild(modal);
      confirmAnnulation();
    };

    document.getElementById(`cancel-modal-${modalId}`).onclick = () => {
      document.body.removeChild(modal);
    };
  };

  const rechargerProduits = async () => {
    await chargerProduits(1);
    setCurrentPage(1);
    setRechercheProduit('');
    setRechercheEnCours(false);
    addNotification('success', 'Produits rechargés avec succès');
  };

  const produitsParType = panier.reduce((acc, item) => {
    if (!item) return acc;
    const type = item.type_vente_affichage || getTypeVenteAffichage(item.type_vente);
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {});

  const renderProduitsFiltres = () => {
    if (!produitsFiltres || !Array.isArray(produitsFiltres)) {
      return (
        <div className="text-center py-10 text-gray-500">
          <FontAwesomeIcon icon={faBox} className="text-4xl mb-3 text-gray-300" />
          <p className="font-medium">Erreur de chargement</p>
          <small className="text-sm">Les produits n'ont pas pu être chargés</small>
        </div>
      );
    }

    if (produitsFiltres.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <FontAwesomeIcon icon={faBox} className="text-4xl mb-3 text-gray-300" />
          <p className="font-medium">Aucun produit trouvé</p>
          <small className="text-sm">Aucun produit ne correspond à votre recherche</small>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {produitsFiltres.map(produit => {
          if (!produit) return null;

          return (
            <div 
              key={produit.id || Date.now()} 
              className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#472ead] flex flex-col min-w-0 w-full"
            >
              <div className="overflow-hidden">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 truncate" title={produit.nom || 'Produit sans nom'}>
                  {produit.nom || 'Produit sans nom'}
                </h4>
                
                <div className="space-y-1.5 mb-2">
                  {produit.code_barre && (
                    <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                      <FontAwesomeIcon icon={faBarcode} className="text-xs text-gray-400 flex-shrink-0" />
                      <span className="truncate">Code: {produit.code_barre}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                    <FontAwesomeIcon icon={faBoxes} className="text-xs text-gray-400 flex-shrink-0" />
                    <span className="truncate">Cat: {produit.categorie || 'Non catégorisé'}</span>
                  </p>
                </div>

                <div className="space-y-1.5 mb-2">
                  <div className="bg-white p-1.5 rounded border border-gray-200">
                    <div className="font-semibold text-gray-800 flex items-center gap-1 text-xs">
                      <FontAwesomeIcon icon={faShoppingBag} className="text-[#472ead] flex-shrink-0" />
                      <span className="truncate">Détail:</span>
                    </div>
                    <div className="font-bold text-green-600 text-xs truncate">
                      {(produit.prix_vente_detail || produit.prix || 0).toLocaleString()} FCFA
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-500 flex-shrink-0" />
                      <span className="truncate">Seuil: {(produit.prix_seuil_detail || produit.prix_seuil || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-white p-1.5 rounded border border-gray-200">
                    <div className="font-semibold text-gray-800 flex items-center gap-1 text-xs">
                      <FontAwesomeIcon icon={faPallet} className="text-[#f58020] flex-shrink-0" />
                      <span className="truncate">Gros:</span>
                    </div>
                    <div className="font-bold text-green-600 text-xs truncate">
                      {(produit.prix_vente_gros || produit.prix_unite_carton || 0).toLocaleString()} FCFA
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-500 flex-shrink-0" />
                      <span className="truncate">Seuil: {(produit.prix_seuil_gros || 0).toLocaleString()}</span>
                    </div>
                    {produit.unite_carton > 1 && (
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                        {produit.unite_carton} unités/carton
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => ajouterAuPanier(produit, 'détail')}
                  className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center gap-1 justify-center transition-all duration-300 ${
                    produit.stock_global === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white hover:shadow-md'
                  }`}
                  title="Ajouter en vente détail"
                  disabled={produit.stock_global === 0}
                >
                  <FontAwesomeIcon icon={faShoppingBag} className="text-xs flex-shrink-0" />
                  <span className="truncate">{produit.stock_global === 0 ? 'Épuisé' : 'Détail'}</span>
                </button>
                <button
                  onClick={() => ajouterAuPanier(produit, 'gros')}
                  className={`flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center gap-1 justify-center transition-all duration-300 ${
                    produit.stock_global === 0 || (produit.unite_carton > 1 && produit.stock_global < produit.unite_carton)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-br from-[#f58020] to-[#ff9c4d] text-white hover:shadow-md'
                  }`}
                  title="Ajouter en vente gros"
                  disabled={produit.stock_global === 0 || (produit.unite_carton > 1 && produit.stock_global < produit.unite_carton)}
                >
                  <FontAwesomeIcon icon={faPallet} className="text-xs flex-shrink-0" />
                  <span className="truncate">
                    {produit.stock_global === 0 ? 'Épuisé' : 'Gros'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-5 min-h-screen bg-gray-50 box-border">
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slideInRight {
            animation: slideInRight 0.3s ease-out;
          }
        `}
      </style>

      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div className="mb-5">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex flex-col gap-0">
            <h2 className="text-2xl text-gray-800 mb-2 font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faShoppingCart} className="text-indigo-700 text-xl" />
              Nouvelle Commande
            </h2>
            <p className="text-gray-600 text-sm font-light">Créez une commande client - Gestion détail et gros</p>
          </div>

          <div className="text-right text-sm text-gray-700">
            <div className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</div>
            <div className="text-xs text-gray-600">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>

            <div className="mt-2 flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
              {loadingVendeur ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-gray-500" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserCircle} className="text-gray-600 text-xs" />
                  <span className="text-xs font-medium text-gray-700">
                    {getVendeurNomComplet()}
                  </span>
                  {vendeurInfo.role && (
                    <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                      {vendeurInfo.role}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {apiError && (
          <div className={`mb-4 rounded-lg p-3 flex items-center justify-between ${apiError.type === 'critical'
              ? 'bg-red-50 border border-red-200'
              : 'bg-amber-50 border border-amber-200'
            }`}>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={apiError.type === 'critical' ? faExclamationTriangle : faWarning}
                className={apiError.type === 'critical' ? 'text-red-500' : 'text-amber-500'}
              />
              <div>
                <span className={`text-sm ${apiError.type === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                  {apiError.message}
                </span>
                {apiError.details && (
                  <small className="block text-xs mt-1 opacity-75">{apiError.details}</small>
                )}
              </div>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-xs hover:opacity-75"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" />
              <span className="text-sm text-amber-700">{errorMessage}</span>
            </div>
            <button
              onClick={rechargerProduits}
              className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faRedo} />
              Réessayer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-180px)] box-border">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm overflow-y-auto box-border">
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faShoppingBag} className="text-[#472ead] text-sm" />
              Type de Vente Global
            </h3>
            <div className="flex gap-3 mb-3">
              <button
                className={`flex-1 py-2 px-4 border-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2 justify-center text-sm ${typeVenteGlobal === 'détail' ? 'border-[#472ead] bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white transform -translate-y-0.5 shadow-lg shadow-[#472ead]/30' : 'border-gray-200 bg-white hover:border-[#472ead] hover:bg-[#472ead]/5'}`}
                onClick={() => setTypeVenteGlobal('détail')}
              >
                <FontAwesomeIcon icon={faShoppingBag} className="text-sm" />
                Détail
              </button>
              <button
                className={`flex-1 py-2 px-4 border-2 rounded-lg font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2 justify-center text-sm ${typeVenteGlobal === 'gros' ? 'border-[#f58020] bg-gradient-to-br from-[#f58020] to-[#ff9c4d] text-white transform -translate-y-0.5 shadow-lg shadow-[#f58020]/30' : 'border-gray-200 bg-white hover:border-[#f58020] hover:bg-[#f58020]/5'}`}
                onClick={() => setTypeVenteGlobal('gros')}
              >
                <FontAwesomeIcon icon={faPallet} className="text-sm" />
                Gros
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Type :</strong> {typeVenteGlobal}
              </p>
              <small className="text-xs text-gray-500">
                {typeVenteGlobal === 'détail'
                  ? 'Prix détail - Vente à l\'unité'
                  : 'Prix gros - Vente par carton'}
              </small>
            </div>
          </div>

          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faBarcode} className="text-[#472ead] text-sm" />
              Scanner Code Barre
            </h3>
            <div className="flex gap-3 items-center">
              <input
                ref={inputCodeBarreRef}
                type="text"
                placeholder={`Scannez ou entrez le code barre...`}
                value={codeBarre}
                onChange={(e) => setCodeBarre(e.target.value)}
                onKeyPress={handleCodeBarreKeyPress}
                className="flex-1 py-2 px-3 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
                autoFocus
              />
              <button
                onClick={ajouterParCodeBarre}
                className="bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 border-none cursor-pointer text-sm hover:shadow-lg hover:-translate-y-0.5 shadow-md"
              >
                <FontAwesomeIcon icon={faSearch} className="text-sm" />
                Scanner
              </button>
            </div>
            <small className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <FontAwesomeIcon icon={faBarcode} />
              Appuyez sur Entrée ou cliquez sur Scanner pour ajouter le produit
            </small>
          </div>

          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faSearch} className="text-[#472ead] text-sm" />
              Recherche Produits
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom, code barre ou catégorie..."
                value={rechercheProduit}
                onChange={(e) => setRechercheProduit(e.target.value)}
                className="w-full py-2 px-3 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none pr-10"
              />
              {(loadingRecherche || loadingProduits) && (
                <div className="absolute right-3 top-2.5">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {rechercheEnCours && totalProduitsFiltres > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {totalProduitsFiltres} produit(s) trouvé(s) - Page {rechercheCurrentPage}/{rechercheLastPage}
              </p>
            )}
          </div>

          <div className="overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base text-gray-800 font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faBox} className="text-[#472ead] text-sm" />
                {rechercheEnCours ? 'Résultats de recherche' : 'Produits Disponibles'}
                {produitsFiltres.length > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {produitsFiltres.length} produits
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {(loadingProduits || loadingRecherche) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Chargement...
                  </div>
                )}
                <button
                  onClick={rechargerProduits}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
                  disabled={loadingProduits || loadingRecherche}
                >
                  <FontAwesomeIcon icon={faRedo} className={loadingProduits ? 'animate-spin' : ''} />
                  Recharger
                </button>
              </div>
            </div>

            {loadingProduits ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-[#472ead] mb-3" />
                  <p className="text-gray-600">Chargement des produits...</p>
                </div>
              </div>
            ) : (
              <>
                {renderProduitsFiltres()}

                {rechercheEnCours ? (
                  rechercheLastPage > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                      <button
                        disabled={rechercheCurrentPage === 1 || loadingRecherche}
                        onClick={() => setRechercheCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                        Précédent
                      </button>

                      <span className="font-semibold text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg">
                        Page {rechercheCurrentPage} / {rechercheLastPage}
                      </span>

                      <button
                        disabled={rechercheCurrentPage === rechercheLastPage || loadingRecherche}
                        onClick={() => setRechercheCurrentPage(prev => Math.min(rechercheLastPage, prev + 1))}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        Suivant
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                      </button>
                    </div>
                  )
                ) : (
                  lastPage > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                      <button
                        disabled={currentPage === 1 || loadingProduits}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                        Précédent
                      </button>

                      <span className="font-semibold text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg">
                        Page {currentPage} / {lastPage}
                      </span>

                      <button
                        disabled={currentPage === lastPage || loadingProduits}
                        onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        Suivant
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                      </button>
                    </div>
                  )
                )}
              </>
            )}
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="text-xs text-gray-600">
                Page {pageInfo.current} / {pageInfo.last} • {pageInfo.total} produits
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {pageInfo.links.map((l, idx) => {
                  const isDisabled = !l.url || l.label === '...' || l.page === null;
                  const isActive = !!l.active;
                  const labelText = l.label.replace('&laquo; Previous', 'Précédent').replace('Next &raquo;', 'Suivant');
                  return (
                    <button
                      key={`${labelText}-${idx}`}
                      onClick={() => !isDisabled && goToPage(l.page)}
                      disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isActive
                          ? 'bg-[#472ead] border-[#472ead] text-white'
                          : isDisabled
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#472ead] hover:bg-[#472ead]/5'
                      }`}
                    >
                      {labelText}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 shadow-sm relative">
            <h3 className="text-base text-gray-800 mb-5 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-[#472ead] text-sm" />
              Informations Client
            </h3>
            <div className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 block">
                    Nom *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="absolute left-3 top-3 text-gray-500 text-sm z-10" />
                    <input
                      ref={inputNomClientRef}
                      type="text"
                      placeholder="Saisir le nom"
                      value={client.nom}
                      onChange={(e) => setClient({ ...client, nom: e.target.value })}
                      className="w-full py-2.5 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none hover:border-gray-300"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 block">
                    Prénom *
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="absolute left-3 top-3 text-gray-500 text-sm z-10" />
                    <input
                      type="text"
                      placeholder="Saisir le prénom"
                      value={client.prenom}
                      onChange={(e) => setClient({ ...client, prenom: e.target.value })}
                      className="w-full py-2.5 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none hover:border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-gray-600 block">
                  Téléphone
                  <span className="text-gray-400 text-xs font-normal ml-1">(optionnel)</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-3 text-gray-500 text-sm z-10" />
                  <input
                    type="tel"
                    placeholder="Ex: 77 123 45 67"
                    value={client.telephone}
                    onChange={(e) => setClient({ ...client, telephone: e.target.value })}
                    className="w-full py-2.5 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-gray-600 block">
                  Adresse
                  <span className="text-gray-400 text-xs font-normal ml-1">(optionnel)</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-3 text-gray-500 text-sm z-10" />
                  <textarea
                    placeholder="Saisir l'adresse complète"
                    value={client.adresse}
                    onChange={(e) => setClient({ ...client, adresse: e.target.value })}
                    className="w-full py-2.5 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none hover:border-gray-300 resize-y min-h-[80px]"
                    rows="3"
                  />
                </div>
              </div>

              {(client.nom.trim() || client.prenom.trim()) && (
                <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUserCircle} className="text-emerald-600 text-sm" />
                    <div>
                      <p className="text-xs font-medium text-emerald-800">
                        Client identifié
                      </p>
                      <p className="text-sm font-semibold text-emerald-900 mt-0.5">
                        {client.nom.trim()} {client.prenom.trim()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                <FontAwesomeIcon icon={faInfoCircle} className="text-xs mr-1" />
                Les champs marqués d'une astérisque (*) sont obligatoires
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-base text-gray-800 font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingCart} className="text-[#472ead] text-sm" />
                Panier
              </h3>
              <div className="bg-[#472ead] text-white py-1 px-3 rounded-full text-xs font-semibold">
                {panier.filter(item => item).length} art. - {totalTTC.toLocaleString()} FCFA
              </div>
            </div>

            {panier.filter(item => item).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FontAwesomeIcon icon={faCartArrowDown} className="text-4xl mb-3 text-gray-300" />
                <p className="font-medium">Panier vide</p>
                <small className="text-sm">Scannez un code barre pour ajouter un produit</small>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer font-medium text-gray-800 text-sm">
                      <input
                        type="checkbox"
                        checked={tvaActive}
                        onChange={(e) => {
                          setTvaActive(e.target.checked);
                        }}
                        className="hidden"
                      />
                      <span className="flex items-center justify-center w-4 h-4">
                        <FontAwesomeIcon
                          icon={tvaActive ? faCheckSquare : faSquare}
                          className={`text-sm transition-all duration-300 ${tvaActive ? 'text-green-500' : 'text-gray-400'}`}
                        />
                      </span>
                      <span className="flex items-center gap-2 text-sm">
                        <FontAwesomeIcon icon={faReceipt} className={`text-sm ${tvaActive ? 'text-green-500' : 'text-gray-400'}`} />
                        TVA (18%)
                      </span>
                    </label>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${tvaActive ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-500'}`}>
                      {tvaActive ? '✓ TVA appliquée' : 'TVA non appliquée'}
                    </span>
                  </div>
                </div>

                {Object.entries(produitsParType).map(([typeVente, produits]) => (
                  <div key={typeVente} className="mb-4 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 py-3 px-4 flex justify-between items-center border-b-2 border-gray-200">
                      <h4 className="m-0 text-gray-800 font-semibold flex items-center gap-2 text-sm">
                        {typeVente === 'détail' ? (
                          <>
                            <FontAwesomeIcon icon={faShoppingBag} className="text-[#472ead] text-sm" />
                            Détail (unité)
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPallet} className="text-[#f58020] text-sm" />
                            Gros (carton)
                          </>
                        )}
                      </h4>
                      <span className={`${typeVente === 'détail' ? 'bg-[#472ead]' : 'bg-[#f58020]'} text-white py-0.5 px-2 rounded-full text-xs font-semibold`}>
                        {produits.filter(item => item).length} prod.
                      </span>
                    </div>

                    <div className="p-3">
                      {produits.filter(item => item).map(item => {
                        const typeAffichage = item.type_vente_affichage || getTypeVenteAffichage(item.type_vente);
                        return (
                          <div key={`${item.id}-${item.type_vente}`} className="bg-gray-50 rounded-lg p-3 mb-3 border-2 border-gray-200">
                            <div className="mb-3">
                              <div className="font-bold text-gray-800 mb-1 text-sm">{item.nom}</div>
                              <div className="text-xs text-gray-600 mb-1">
                                Code-barre: {item.code_barre || 'N/A'} | Cat: {item.categorie}
                              </div>

                              {editionPrix && editionPrix.produitId === item.id && editionPrix.typeVente === item.type_vente ? (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 my-3 text-xs">
                                  <div className="flex items-center gap-2 mb-2">
                                    <label className="font-semibold text-amber-700 text-xs">Nouveau prix:</label>
                                    <input
                                      type="number"
                                      value={editionPrix.nouveauPrix}
                                      onChange={(e) => changerPrixEdition(e.target.value)}
                                      className="w-20 py-1 px-2 border border-amber-300 rounded text-xs font-semibold text-center"
                                      min={item.prix_seuil}
                                      step="100"
                                    />
                                    <span className="text-xs">FCFA</span>
                                  </div>
                                  <div className="flex justify-between mb-3 flex-wrap gap-1 text-xs">
                                    <small className="text-amber-700 text-xs">Min: {item.prix_seuil.toLocaleString()} FCFA</small>
                                    <small className="text-amber-700 text-xs">Base: {item.prix_base.toLocaleString()} FCFA</small>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={validerModificationPrix} className="bg-green-500 text-white py-1 px-3 rounded text-xs font-semibold flex items-center gap-1 border-none cursor-pointer transition-all hover:shadow">
                                      <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                    <button onClick={annulerEditionPrix} className="bg-red-500 text-white py-1 px-3 rounded text-xs font-semibold flex items-center gap-1 border-none cursor-pointer transition-all hover:shadow">
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="my-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-sm font-bold ${item.prix_vente !== item.prix_base ? 'text-amber-600' : 'text-gray-800'}`}>
                                      {item.prix_vente.toLocaleString()} FCFA × {item.quantite}
                                    </span>
                                    {item.categorie && (
                                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                        {item.categorie}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-green-600 font-semibold mt-1">
                                    {(item.prix_vente * item.quantite).toLocaleString()} FCFA
                                  </div>
                                  {typeAffichage === 'gros' && item.unite_par_carton > 1 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {item.quantite} carton(s) × {item.unite_par_carton} unités
                                      <br />
                                      <small>
                                        Prix unitaire détail: {(item.prix_detail || 0).toLocaleString()} FCFA
                                      </small>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center">
                              {editionQuantite && editionQuantite.produitId === item.id && editionQuantite.typeVente === item.type_vente ? (
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={editionQuantite.nouvelleQuantite}
                                      onChange={(e) => changerQuantiteEdition(e.target.value)}
                                      className="w-16 py-1 px-2 border border-gray-300 rounded text-sm text-center"
                                      min="1"
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={validerModificationQuantite} className="bg-green-500 text-white w-7 h-7 rounded flex items-center justify-center">
                                        <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                      </button>
                                      <button onClick={annulerEditionQuantite} className="bg-red-500 text-white w-7 h-7 rounded flex items-center justify-center">
                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-white py-1 px-2 rounded-lg border border-gray-200">
                                  <button
                                    onClick={() => modifierQuantite(item.id, item.type_vente, item.quantite - 1)}
                                    className={`${typeAffichage === 'détail' ? 'bg-[#472ead]' : 'bg-[#f58020]'} text-white w-6 h-6 rounded text-sm font-bold border-none cursor-pointer disabled:opacity-50`}
                                    disabled={!!editionPrix}
                                  >
                                    <FontAwesomeIcon icon={faMinus} className="text-xs" />
                                  </button>
                                  <span
                                    className="font-semibold text-gray-800 cursor-pointer px-2"
                                    onClick={() => demarrerEditionQuantite(item)}
                                    title="Modifier quantité"
                                  >
                                    {item.quantite}
                                  </span>
                                  <button
                                    onClick={() => modifierQuantite(item.id, item.type_vente, item.quantite + 1)}
                                    className={`${typeAffichage === 'détail' ? 'bg-[#472ead]' : 'bg-[#f58020]'} text-white w-6 h-6 rounded text-sm font-bold border-none cursor-pointer disabled:opacity-50`}
                                    disabled={!!editionPrix}
                                  >
                                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                  </button>
                                </div>
                              )}

                              <div className="flex gap-2">
                                {!editionPrix && !editionQuantite && (
                                  <button
                                    onClick={() => demarrerEditionPrix(item)}
                                    className="bg-blue-500 text-white w-7 h-7 rounded flex items-center justify-center hover:shadow"
                                    title="Modifier prix"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                  </button>
                                )}
                                {!editionPrix && !editionQuantite && item.prix_vente !== item.prix_base && (
                                  <button
                                    onClick={() => reinitialiserPrix(item.id, item.type_vente)}
                                    className="bg-amber-500 text-white w-7 h-7 rounded flex items-center justify-center hover:shadow"
                                    title="Rétablir prix"
                                  >
                                    <FontAwesomeIcon icon={faRedo} className="text-xs" />
                                  </button>
                                )}
                                <button
                                  onClick={() => retirerDuPanier(item.id, item.type_vente)}
                                  className="bg-red-500 text-white w-7 h-7 rounded flex items-center justify-center hover:shadow disabled:opacity-50"
                                  disabled={!!editionPrix || !!editionQuantite}
                                  title="Retirer"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
                  <h4 className="text-sm text-gray-800 mb-3 font-semibold flex items-center gap-2">
                    <FontAwesomeIcon icon={faReceipt} className="text-[#472ead] text-sm" />
                    Résumé de la commande
                  </h4>
                  
                  <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 text-sm">
                    <span>Total HT:</span>
                    <span className="font-medium">{totalHT.toLocaleString()} FCFA</span>
                  </div>
                  
                  <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 text-sm">
                    <span>TVA (18%):</span>
                    <span className={`font-medium ${tvaActive ? 'text-amber-600' : 'text-gray-400'}`}>
                      {tvaActive ? `+ ${tva.toLocaleString()}` : '0'} FCFA
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm font-bold text-gray-800 mt-2 pt-2 border-t-2 border-gray-300">
                    <strong>Total TTC:</strong>
                    <strong className={tvaActive ? 'text-green-600' : 'text-gray-800'}>
                      {totalTTC.toLocaleString()} FCFA
                    </strong>
                  </div>
                  
                  <div className="mt-2 text-xs text-center font-semibold p-2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                    <FontAwesomeIcon icon={faDatabase} className="mr-1" />
                    Montant: {totalTTC.toLocaleString()} FCFA
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  {apiError && (
                    <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        <FontAwesomeIcon icon={faWarning} className="text-xs" />
                        Mode dégradé activé - Les commandes sont sauvegardées localement
                      </p>
                    </div>
                  )}

                  <button
                    onClick={validerCommande}
                    className="py-3 rounded-lg text-sm font-bold border-none cursor-pointer flex items-center gap-2 justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    disabled={!!editionPrix || !!editionQuantite || envoiEnCours}
                  >
                    {envoiEnCours ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Validation...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                        Envoyer la Commande - {totalTTC.toLocaleString()} FCFA
                        {tvaActive && <span className="text-xs ml-1 opacity-75">(TVA incl.)</span>}
                      </>
                    )}
                  </button>
                  <button
                    onClick={annulerCommande}
                    className="py-3 rounded-lg text-sm font-bold border-none cursor-pointer flex items-center gap-2 justify-center bg-gradient-to-br from-red-500 to-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    disabled={!!editionPrix || !!editionQuantite || envoiEnCours}
                  >
                    <FontAwesomeIcon icon={faBan} className="text-sm" />
                    Annuler Commande
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {commandeImprimee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-4">
            
            <TicketCommande
              ref={ticketRef}
              commande={commandeImprimee}
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={imprimerTicket}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimer
              </button>
              <button
                onClick={() => setCommandeImprimee(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NouvelleCommande;

import React, { useState, useRef, useEffect } from 'react';
import Ticket from "./Ticket";
import { useReactToPrint } from "react-to-print";
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
  faDatabase,
  faCartArrowDown,
  faCheckSquare,
  faPrint,
  faXmark,
  faSquare,
  faSpinner,
  faBoxes,
  faTag,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// Import des APIs
import { produitsDisponiblesAPI } from '../../services/api/produits-disponibles';
import { commandesAPI } from '../../services/api/commandes';
import { clientsAPI } from '../../services/api/clients';

const NouvelleCommande = ({ panier, setPanier, onCommandeValidee, sellerName = null }) => {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [codeBarre, setCodeBarre] = useState('');
  const [client, setClient] = useState({ nom: '', telephone: '', adresse: '' });
  const [typeVenteGlobal, setTypeVenteGlobal] = useState('détail');
  const [editionPrix, setEditionPrix] = useState(null);
  const [editionQuantite, setEditionQuantite] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [tvaActive, setTvaActive] = useState(true);
  const [produits, setProduits] = useState([]);
  const [loadingProduits, setLoadingProduits] = useState(true);
  const [produitsFiltres, setProduitsFiltres] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [clientsExistant, setClientsExistant] = useState([]);
  const [rechercheClient, setRechercheClient] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const inputCodeBarreRef = useRef(null);
  const inputNomClientRef = useRef(null);
  const [commandeValidee, setCommandeValidee] = useState(null);
  const ticketRef = useRef();

  // Fonction pour normaliser le type de vente (enlever les accents)
  const normaliserTypeVente = (type) => {
    if (!type) return 'detail';
    if (type === 'détail') return 'detail';
    if (type === 'gros') return 'gros';
    return type;
  };

  // Charger les produits et clients depuis l'API au montage
  useEffect(() => {
    chargerProduits();
    chargerClients();
  }, []);

  // Filtrer les produits lorsque la recherche change
  useEffect(() => {
    const filtrerProduits = () => {
      if (!produits || !Array.isArray(produits)) {
        setProduitsFiltres([]);
        return;
      }
      
      const filtres = produits.filter(produit => {
        if (!produit) return false;
        const nomMatch = produit.nom?.toLowerCase().includes(rechercheProduit.toLowerCase()) || false;
        const codeMatch = produit.code?.toLowerCase().includes(rechercheProduit.toLowerCase()) || false;
        const categorieMatch = produit.categorie?.toLowerCase().includes(rechercheProduit.toLowerCase()) || false;
        const codeBarreMatch = produit.code_barre?.includes(rechercheProduit) || false;
        return nomMatch || codeMatch || categorieMatch || codeBarreMatch;
      });
      setProduitsFiltres(filtres);
    };

    filtrerProduits();
  }, [rechercheProduit, produits]);

  // Rechercher clients quand le nom change
  useEffect(() => {
    if (client.nom.trim().length > 2) {
      rechercherClients(client.nom);
    } else {
      setClientsExistant([]);
      setShowClientDropdown(false);
    }
  }, [client.nom]);

  // Charger les produits disponibles depuis l'API
  const chargerProduits = async () => {
    try {
      setLoadingProduits(true);
      setErrorMessage('');
      
      // Utiliser l'API des produits disponibles en boutique
      const produitsApi = await produitsDisponiblesAPI.getDisponiblesBoutique();
      
      // Formatage des données selon vos variables
      const produitsFormates = produitsApi.map(produit => ({
        // Variables principales selon votre modèle
        id: produit.id,
        nom: produit.nom,
        code: produit.code,
        code_barre: produit.code_barre || produit.code,
        
        // Prix selon votre modèle
        prix_vente_detail: produit.prix_vente_detail || produit.prix || 0,
        prix_vente_gros: produit.prix_vente_gros || produit.prix_unite_carton || produit.prix || 0,
        prix_achat: produit.prix_achat || 0,
        prix_total: produit.prix_total || 0,
        
        // Seuils
        prix_seuil_detail: produit.prix_seuil_detail || Math.round((produit.prix_vente_detail || produit.prix || 0) * 0.7),
        prix_seuil_gros: produit.prix_seuil_gros || Math.round((produit.prix_vente_gros || produit.prix_unite_carton || produit.prix || 0) * 0.7),
        
        // Stock et gestion (stock_global gardé pour vérifications internes mais non affiché)
        stock_global: produit.stock_global || produit.stock || 0,
        stock_seuil: produit.stock_seuil || 10,
        stock: produit.stock_global || produit.stock || 0,
        seuil_alerte: produit.stock_seuil || 10,
        
        // Gestion des cartons (gardé pour vérifications mais non affiché)
        unite_carton: produit.unite_carton || 1,
        prix_unite_carton: produit.prix_unite_carton || produit.prix_vente_gros || 0,
        nombre_carton: produit.nombre_carton || Math.floor((produit.stock_global || 0) / (produit.unite_carton || 1)),
        
        // Catégorie
        categorie_id: produit.categorie_id,
        categorie: produit.categorie_nom || 'Non catégorisé',
        
        // Dates
        created_at: produit.created_at,
        updated_at: produit.updated_at,
        
        // Variables compatibilité
        prix: produit.prix_vente_detail || produit.prix || 0,
        prix_detail: produit.prix_vente_detail || produit.prix || 0,
        prix_gros: produit.prix_vente_gros || produit.prix_unite_carton || produit.prix || 0,
        prix_seuil: produit.prix_seuil_detail || Math.round((produit.prix_vente_detail || produit.prix || 0) * 0.7)
      }));
      
      setProduits(produitsFormates);
      console.log(`${produitsFormates.length} produits disponibles chargés`);
      
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
      setErrorMessage('Impossible de charger les produits. Mode démo activé.');
      
      // Données de démo avec vos variables
      setProduits([
        {
          id: 1,
          nom: 'Bloc Note Mood Diary',
          code: 'BLOC-MOOD-001',
          code_barre: '694689174174',
          prix_vente_detail: 350,
          prix_vente_gros: 2800,
          prix_achat: 250,
          prix_total: 6000,
          prix_seuil_detail: 280,
          prix_seuil_gros: 2240,
          stock_global: 15,
          stock_seuil: 5,
          stock: 15,
          seuil_alerte: 5,
          unite_carton: 24,
          prix_unite_carton: 2800,
          nombre_carton: 10,
          categorie_id: 1,
          categorie: 'Papeterie',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          prix: 350,
          prix_detail: 350,
          prix_gros: 2800,
          prix_seuil: 280
        },
        {
          id: 2,
          nom: "Bouteille d'eau 1.5L",
          code: 'EAU-1.5L-001',
          code_barre: '6044000268101',
          prix_vente_detail: 400,
          prix_vente_gros: 3200,
          prix_achat: 280,
          prix_total: 4800,
          prix_seuil_detail: 320,
          prix_seuil_gros: 2560,
          stock_global: 50,
          stock_seuil: 10,
          stock: 50,
          seuil_alerte: 10,
          unite_carton: 12,
          prix_unite_carton: 3200,
          nombre_carton: 20,
          categorie_id: 2,
          categorie: 'Boissons',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          prix: 400,
          prix_detail: 400,
          prix_gros: 3200,
          prix_seuil: 320
        }
      ]);
    } finally {
      setLoadingProduits(false);
    }
  };

  const chargerClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      if (response.data && Array.isArray(response.data)) {
        console.log(`${response.data.length} clients chargés`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement clients:', error);
    }
  };

  const rechercherClients = async (nom) => {
    try {
      const response = await clientsAPI.search(nom);
      if (response.data && Array.isArray(response.data)) {
        setClientsExistant(response.data.slice(0, 5));
        setShowClientDropdown(true);
      }
    } catch (error) {
      console.error('❌ Erreur recherche clients:', error);
      setClientsExistant([]);
    }
  };

  const selectionnerClient = (clientExistant) => {
    setClient({
      nom: clientExistant.nom || clientExistant.prenom + ' ' + clientExistant.nom,
      telephone: clientExistant.telephone || '',
      adresse: clientExistant.adresse || ''
    });
    setShowClientDropdown(false);
  };

  const obtenirPrixParType = (produit, typeVente) => {
    if (!produit) {
      return { prix: 0, prix_seuil: 0 };
    }
    
    const typeNormalise = normaliserTypeVente(typeVente);
    
    if (typeNormalise === 'gros') {
      return {
        prix: produit.prix_vente_gros || produit.prix_unite_carton || Math.round((produit.prix || 0) * 0.8),
        prix_seuil: produit.prix_seuil_gros || Math.round((produit.prix_seuil || (produit.prix || 0) * 0.7) * 0.8)
      };
    }
    return {
      prix: produit.prix_vente_detail || produit.prix || 0,
      prix_seuil: produit.prix_seuil_detail || Math.round((produit.prix_vente_detail || produit.prix || 0) * 0.7)
    };
  };

  const ajouterAuPanier = (produit, typeVenteSpecifique = null) => {
    if (!produit) {
      console.error('❌ Produit non défini');
      return;
    }
    
    const typeVente = typeVenteSpecifique || typeVenteGlobal;
    const typeNormalise = normaliserTypeVente(typeVente);
    
    // Vérifier si le produit est en stock
    if (produit.stock_global <= 0) {
      alert('❌ Ce produit est en rupture de stock');
      return;
    }
    
    // Pour le gros, vérifier si assez de stock pour un carton
    if (typeNormalise === 'gros' && produit.unite_carton > 1 && produit.stock_global < produit.unite_carton) {
      alert(`❌ Stock insuffisant pour vendre en gros (nécessite ${produit.unite_carton} unités)`);
      return;
    }
    
    const { prix, prix_seuil } = obtenirPrixParType(produit, typeNormalise);

    const produitExistant = panier.find(item => 
      item && item.id === produit.id && item.type_vente === typeNormalise
    );
    
    if (produitExistant) {
      const stockRestant = produit.stock_global - produitExistant.quantite;
      if (stockRestant <= 0) {
        alert('❌ Stock insuffisant pour ajouter une unité supplémentaire');
        return;
      }
      
      setPanier(panier.map(item =>
        item && item.id === produit.id && item.type_vente === typeNormalise
          ? { ...item, quantite: item.quantite + 1 }
          : item
      ));
    } else {
      setPanier([...panier.filter(item => item), { 
        ...produit, 
        quantite: 1,
        type_vente: typeNormalise,
        prix_vente: prix,
        prix_base: prix,
        prix_seuil: prix_seuil,
        prix_original: prix,
        type_vente_affichage: typeVente,
        // Stock actuel pour référence
        stock_initial: produit.stock_global,
        stock_seuil: produit.stock_seuil
      }]);
    }
  };

  const ajouterParCodeBarre = async () => {
    if (!codeBarre.trim()) {
      alert('❌ Veuillez saisir un code barre');
      return;
    }

    try {
      // Recherche par code barre via API
      const produitTrouve = await produitsDisponiblesAPI.getByCodeBarre(codeBarre);
      
      if (produitTrouve) {
        // Formater le produit trouvé
        const produitFormate = {
          id: produitTrouve.id,
          nom: produitTrouve.nom,
          code: produitTrouve.code,
          code_barre: produitTrouve.code_barre || produitTrouve.code,
          prix_vente_detail: produitTrouve.prix_vente_detail || produitTrouve.prix || 0,
          prix_vente_gros: produitTrouve.prix_vente_gros || produitTrouve.prix_unite_carton || produitTrouve.prix || 0,
          prix_achat: produitTrouve.prix_achat || 0,
          prix_total: produitTrouve.prix_total || 0,
          prix_seuil_detail: produitTrouve.prix_seuil_detail || Math.round((produitTrouve.prix_vente_detail || produitTrouve.prix || 0) * 0.7),
          prix_seuil_gros: produitTrouve.prix_seuil_gros || Math.round((produitTrouve.prix_vente_gros || produitTrouve.prix_unite_carton || produitTrouve.prix || 0) * 0.7),
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
          prix_gros: produitTrouve.prix_vente_gros || produitTrouve.prix_unite_carton || produitTrouve.prix || 0,
          prix_seuil: produitTrouve.prix_seuil_detail || Math.round((produitTrouve.prix_vente_detail || produitTrouve.prix || 0) * 0.7)
        };
        
        ajouterAuPanier(produitFormate, typeVenteGlobal);
        setCodeBarre('');
        if (inputCodeBarreRef.current) {
          inputCodeBarreRef.current.focus();
        }
      } else {
        alert('❌ Aucun produit trouvé avec ce code barre');
      }
    } catch (error) {
      console.error('❌ Erreur recherche code barre:', error);
      // Recherche locale en cas d'erreur API
      const produitTrouve = produits.find(p => 
        p && (p.code === codeBarre || p.code_barre === codeBarre)
      );
      
      if (produitTrouve) {
        ajouterAuPanier(produitTrouve, typeVenteGlobal);
        setCodeBarre('');
        if (inputCodeBarreRef.current) {
          inputCodeBarreRef.current.focus();
        }
      } else {
        alert('❌ Aucun produit trouvé avec ce code barre');
      }
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
        alert(`❌ Stock insuffisant. Maximum disponible: ${produitOriginal.stock_global}`);
        return;
      }
      
      setPanier(panier.map(item =>
        item && item.id === produitId && item.type_vente === typeVente
          ? { ...item, quantite: nouvelleQuantite }
          : item
      ));
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
        alert(`❌ Stock insuffisant. Maximum disponible: ${produitOriginal.stock_global}`);
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
      alert(`❌ Prix trop bas ! Le prix ne peut pas être inférieur à ${prixSeuil.toLocaleString()} FCFA (prix de seuil)`);
      return;
    }

    if (nouveauPrix < 0) {
      alert('❌ Le prix ne peut pas être négatif !');
      return;
    }

    setPanier(panier.map(item =>
      item && item.id === produitId && item.type_vente === typeVente
        ? { ...item, prix_vente: nouveauPrix }
        : item
    ));

    setEditionPrix(null);
    
    alert(`✅ Prix modifié à ${nouveauPrix.toLocaleString()} FCFA`);
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
      alert(`🔄 Prix réinitialisé à ${produit.prix_original.toLocaleString()} FCFA`);
    }
  };

  const calculerTotaux = () => {
    const totalHT = panier.reduce((total, item) => {
      if (!item) return total;
      return total + (item.prix_vente * item.quantite);
    }, 0);
    
    let tva = 0;
    let totalTTC = totalHT;
    
    if (tvaActive) {
      tva = totalHT * 0.18;
      totalTTC = totalHT + tva;
    }

    return {
      totalHT: Math.round(totalHT),
      tva: Math.round(tva),
      totalTTC: Math.round(totalTTC),
      tvaActive: tvaActive
    };
  };

  const { totalHT, tva, totalTTC } = calculerTotaux();

  const validerCommande = async () => {
    console.log('🔄 Début validation commande...');
    
    if (panier.length === 0) {
      alert('❌ Le panier est vide !');
      return;
    }

    if (!client.nom.trim()) {
      alert('❌ Veuillez saisir le nom du client !');
      
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
      alert('❌ Veuillez terminer les modifications en cours !');
      return;
    }

    setEnvoiEnCours(true);

    try {
      // Vérifier les stocks avant validation
      const stockInsuffisant = panier.find(item => {
        if (!item) return false;
        const produitOriginal = produits.find(p => p && p.id === item.id);
        return produitOriginal && item.quantite > produitOriginal.stock_global;
      });

      if (stockInsuffisant) {
        alert(`❌ Stock insuffisant pour ${stockInsuffisant.nom}. Veuillez ajuster les quantités.`);
        setEnvoiEnCours(false);
        return;
      }

      // 1. Vérifier ou créer le client
      let clientId = null;
      let clientNomFinal = client.nom.trim();
      let clientTelephoneFinal = client.telephone?.trim() || null;
      let clientAdresseFinal = client.adresse?.trim() || null;
      
      try {
        // Rechercher le client
        const clientsResponse = await clientsAPI.search(client.nom);
        let clientExistant = null;
        
        if (clientsResponse.data && Array.isArray(clientsResponse.data)) {
          clientExistant = clientsResponse.data.find(c => 
            c.nom === client.nom || 
            (c.telephone && c.telephone === client.telephone)
          );
        }
        
        if (clientExistant) {
          clientId = clientExistant.id;
          clientNomFinal = clientExistant.nom;
          clientTelephoneFinal = clientExistant.telephone || clientTelephoneFinal;
          clientAdresseFinal = clientExistant.adresse || clientAdresseFinal;
          console.log(`✅ Client existant trouvé: ${clientExistant.nom} (ID: ${clientId})`);
        } else {
          // Créer un nouveau client
          const nouveauClient = {
            nom: client.nom,
            prenom: '',
            telephone: client.telephone || '',
            adresse: client.adresse || '',
            email: '',
            type_client: 'normal'
          };
          
          console.log('📝 Création nouveau client:', nouveauClient);
          const createResponse = await clientsAPI.create(nouveauClient);
          clientId = createResponse.data.id;
          console.log(`✅ Nouveau client créé avec ID: ${clientId}`);
        }
      } catch (clientError) {
        console.warn('⚠️ Erreur gestion client:', clientError);
        // Continuer sans clientId
      }

      const typeVenteNormalise = normaliserTypeVente(typeVenteGlobal);

      // 2. Préparer les données pour l'API
      const commandeData = {
        // Informations client
        client_id: clientId,
        client_nom: clientNomFinal,
        client_telephone: clientTelephoneFinal,
        client_adresse: clientAdresseFinal,
        
        // Type de vente - Normalisé
        type_vente: typeVenteNormalise,
        
        // Items (produits)
        items: panier.filter(item => item).map(item => ({
          produit_id: item.id,
          nom: item.nom,
          code: item.code,
          quantite: parseInt(item.quantite),
          prix_unitaire: parseFloat(item.prix_vente),
          sous_total: parseFloat(item.prix_vente * item.quantite),
          type_vente: item.type_vente,
          stock_initial: parseInt(item.stock_global)
        })),
        
        // Totaux
        montant_ht: parseFloat(totalHT),
        tva: tvaActive ? parseFloat(tva) : 0,
        montant_ttc: parseFloat(totalTTC),
        tva_appliquee: tvaActive,
        
        // Métadonnées
        statut: 'en_attente',
        vendeur_nom: sellerName || 'Vendeur Principal',
        date_commande: new Date().toISOString(),
        mode_paiement: 'non_paye',
        notes: ''
      };

      console.log('📦 Données commande formatées pour API:', JSON.stringify(commandeData, null, 2));

      // 3. Envoyer à l'API des commandes
      let apiResponse = null;
      let apiError = null;
      
      try {
        console.log('📤 Tentative d\'envoi à l\'API...');
        apiResponse = await commandesAPI.create(commandeData);
        console.log('✅ Réponse API:', apiResponse);
      } catch (error) {
        console.error('❌ Erreur API commandes:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        apiError = error;
        
        if (error.response?.data) {
          console.error('📋 Détail erreur API:', error.response.data);
        }
      }

      // 4. Mettre à jour les stocks si la commande est créée
      if (apiResponse && apiResponse.data) {
        try {
          console.log('⚠️ Mise à jour des stocks non implémentée avec produitsDisponiblesAPI');
        } catch (stockError) {
          console.error('❌ Erreur mise à jour stocks:', stockError);
        }
      }

      // 5. Créer l'objet commande pour l'affichage
      const nouvelleCommande = {
        id: apiResponse?.data?.uuid || apiResponse?.data?.id || `local-${Date.now()}`,
        numero_commande: apiResponse?.data?.numero || `CMD-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        client: {
          nom: clientNomFinal,
          telephone: clientTelephoneFinal,
          adresse: clientAdresseFinal
        },
        type_vente: typeVenteNormalise,
        type_vente_affichage: typeVenteGlobal,
        items: panier.filter(item => item).map(item => ({
          produit_id: item.id,
          nom: item.nom,
          code: item.code,
          reference: item.code,
          quantite: item.quantite,
          type_vente: item.type_vente,
          type_vente_affichage: item.type_vente_affichage || typeVenteGlobal,
          prix_unitaire: item.prix_vente,
          prix_base: item.prix_base,
          prix_seuil: item.prix_seuil,
          prix_original: item.prix_original,
          sous_total: item.prix_vente * item.quantite,
          categorie: item.categorie,
          stock_initial: item.stock_global
        })),
        total_ht: totalHT,
        tva: tva,
        total_ttc: totalTTC,
        tva_appliquee: tvaActive,
        statut: apiResponse?.data?.statut || 'en_attente_paiement',
        vendeur: sellerName || 'Vendeur Principal',
        api_success: !!apiResponse,
        api_message: apiError ? 'Erreur API' : 'Synchronisé avec API',
        api_data: apiResponse?.data,
        api_error: apiError?.response?.data
      };

      console.log('✅ Commande créée:', nouvelleCommande);

      // 6. Appeler le callback parent
      await onCommandeValidee(nouvelleCommande);
      
      // 7. Afficher le ticket
      setCommandeValidee(nouvelleCommande);

      // 8. Réinitialiser
      setPanier([]);
      setClient({ nom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
      setClientsExistant([]);
      setShowClientDropdown(false);
      
      // 9. Message de succès
      if (apiError) {
        let errorMsg = 'Erreur lors de l\'envoi à l\'API';
        if (apiError.response?.data?.message) {
          errorMsg = apiError.response.data.message;
        } else if (apiError.message) {
          errorMsg = apiError.message;
        }
        alert(`⚠️ Commande enregistrée localement - ${errorMsg}`);
      } else {
        alert(`✅ Commande ${nouvelleCommande.numero_commande} créée avec succès !`);
      }
      
    } catch (error) {
      console.error('❌ Erreur validation commande:', error);
      
      let errorMessage = 'Erreur lors de la création de la commande';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
      
      // Créer une commande locale en cas d'erreur
      const commandeLocale = {
        id: `local-error-${Date.now()}`,
        numero_commande: `CMD-ERR-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        client: {
          nom: client.nom,
          telephone: client.telephone,
          adresse: client.adresse
        },
        type_vente: normaliserTypeVente(typeVenteGlobal),
        items: panier.filter(item => item).map(item => ({
          produit_id: item.id,
          nom: item.nom,
          code: item.code,
          quantite: item.quantite,
          prix_unitaire: item.prix_vente,
          sous_total: item.prix_vente * item.quantite
        })),
        total_ht: totalHT,
        tva: tva,
        total_ttc: totalTTC,
        statut: 'erreur',
        vendeur: sellerName || 'Vendeur Principal',
        error_message: errorMessage
      };
      
      await onCommandeValidee(commandeLocale);
      
      setCommandeValidee(commandeLocale);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const imprimerTicket = useReactToPrint({
    content: () => ticketRef.current,
  });

  const annulerCommande = () => {
    if (panier.length === 0) {
      alert('ℹ️ Aucune commande en cours !');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir annuler la commande en cours ?')) {
      setPanier([]);
      setClient({ nom: '', telephone: '', adresse: '' });
      setEditionPrix(null);
      setEditionQuantite(null);
      setClientsExistant([]);
      setShowClientDropdown(false);
    }
  };

  const rechargerProduits = async () => {
    await chargerProduits();
  };

  // Fonction utilitaire pour l'affichage du type de vente
  const getTypeVenteAffichage = (type) => {
    if (!type) return 'détail';
    return type === 'detail' ? 'détail' : 'gros';
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

  // Fonction pour afficher les produits filtrés
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produitsFiltres.map(produit => {
          if (!produit) return null;
          
          const prixDetail = obtenirPrixParType(produit, 'detail');
          const prixGros = obtenirPrixParType(produit, 'gros');
          
          return (
            <div key={produit.id || Date.now()} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#472ead] flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">{produit.nom || 'Produit sans nom'}</h4>
                <div className="space-y-2 mb-3">
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <FontAwesomeIcon icon={faTag} className="text-xs text-gray-400" />
                    Code: <span className="font-medium">{produit.code || 'N/A'}</span>
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBoxes} className="text-xs text-gray-400" />
                    Catégorie: <span className="font-medium">{produit.categorie || 'Non catégorisé'}</span>
                  </p>
                  {produit.code_barre && produit.code_barre !== produit.code && (
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <FontAwesomeIcon icon={faBarcode} className="text-xs text-gray-400" />
                      Code-barre: <span className="font-medium">{produit.code_barre}</span>
                    </p>
                  )}
                </div>
                
                {/* Prix - Section simplifiée sans stock */}
                <div className="space-y-2 my-3">
                  <div className="bg-white p-2 rounded border border-gray-200 text-xs">
                    <div className="font-semibold text-gray-800 flex items-center gap-2 mb-1 text-xs">
                      <FontAwesomeIcon icon={faShoppingBag} className="text-xs text-[#472ead]" />
                      Détail (unité):
                    </div>
                    <div className="font-bold text-green-600 text-sm">
                      {(produit.prix_vente_detail || produit.prix || 0).toLocaleString()} FCFA
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-500" />
                      Seuil: {(produit.prix_seuil_detail || produit.prix_seuil || 0).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 text-xs">
                    <div className="font-semibold text-gray-800 flex items-center gap-2 mb-1 text-xs">
                      <FontAwesomeIcon icon={faPallet} className="text-xs text-[#f58020]" />
                      Gros (carton):
                    </div>
                    <div className="font-bold text-green-600 text-sm">
                      {(produit.prix_vente_gros || produit.prix_unite_carton || 0).toLocaleString()} FCFA
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-500" />
                      Seuil: {(produit.prix_seuil_gros || 0).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => ajouterAuPanier(produit, 'détail')}
                    className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center gap-2 justify-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
                      produit.stock_global === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white'
                    }`}
                    title="Ajouter en vente détail"
                    disabled={produit.stock_global === 0}
                  >
                    <FontAwesomeIcon icon={faShoppingBag} className="text-xs" />
                    {produit.stock_global === 0 ? 'Stock épuisé' : 'Détail'}
                  </button>
                  <button
                    onClick={() => ajouterAuPanier(produit, 'gros')}
                    className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center gap-2 justify-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
                      produit.stock_global === 0 || produit.stock_global < produit.unite_carton
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-br from-[#f58020] to-[#ff9c4d] text-white'
                    }`}
                    title="Ajouter en vente gros"
                    disabled={produit.stock_global === 0 || produit.stock_global < produit.unite_carton}
                  >
                    <FontAwesomeIcon icon={faPallet} className="text-xs" />
                    {produit.stock_global === 0 ? 'Stock épuisé' : 'Gros'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-5 min-h-screen bg-gray-50 box-border">
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
          </div>
        </div>

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
        {/* Section gauche : Produits */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm overflow-y-auto box-border">
          {/* Type de vente global */}
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

          {/* Code barre */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faBarcode} className="text-[#472ead] text-sm" />
              Scanner Code Barre
            </h3>
            <div className="flex gap-3 items-center">
              <input
                ref={inputCodeBarreRef}
                type="text"
                placeholder={`Code produit (${typeVenteGlobal})...`}
                value={codeBarre}
                onChange={(e) => setCodeBarre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && ajouterParCodeBarre()}
                className="flex-1 py-2 px-3 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
              />
              <button 
                onClick={ajouterParCodeBarre} 
                className="bg-gradient-to-br from-[#472ead] to-[#5a3bc0] text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 border-none cursor-pointer text-sm hover:shadow-lg hover:-translate-y-0.5 shadow-md"
              >
                <FontAwesomeIcon icon={faSearch} className="text-sm" />
                Scanner
              </button>
            </div>
          </div>

          {/* Recherche manuelle */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <h3 className="text-base text-gray-800 mb-3 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faSearch} className="text-[#472ead] text-sm" />
              Recherche Produits
            </h3>
            <input
              type="text"
              placeholder="Nom, code produit ou catégorie..."
              value={rechercheProduit}
              onChange={(e) => setRechercheProduit(e.target.value)}
              className="w-full py-2 px-3 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
            />
          </div>

          {/* Liste des produits disponibles */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base text-gray-800 font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faBox} className="text-[#472ead] text-sm" />
                Produits Disponibles ({produitsFiltres.length})
              </h3>
              <div className="flex items-center gap-2">
                {loadingProduits && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Chargement...
                  </div>
                )}
                <button
                  onClick={rechargerProduits}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <FontAwesomeIcon icon={faRedo} />
                  Recharger
                </button>
              </div>
            </div>
            
            {loadingProduits ? (
              <div className="flex justify-center items-center py-10">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-[#472ead]" />
              </div>
            ) : (
              renderProduitsFiltres()
            )}
          </div>
        </div>

        {/* Section droite : Panier et Client */}
        <div className="space-y-5">
          {/* Informations client */}
          <div className="bg-white rounded-xl p-5 shadow-sm relative">
            <h3 className="text-base text-gray-800 mb-4 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-[#472ead] text-sm" />
              Informations Client
            </h3>
            <div className="space-y-3">
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faUser} className="absolute left-3 text-gray-500 text-sm z-10" />
                <input
                  ref={inputNomClientRef}
                  type="text"
                  placeholder="Nom complet *"
                  value={client.nom}
                  onChange={(e) => setClient({...client, nom: e.target.value})}
                  className="w-full py-2 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
                  required
                />
                
                {showClientDropdown && clientsExistant.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {clientsExistant.map((clientItem, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectionnerClient(clientItem)}
                      >
                        <div className="font-medium">{clientItem.nom || `${clientItem.prenom} ${clientItem.nom}`}</div>
                        {clientItem.telephone && (
                          <div className="text-sm text-gray-600">📱 {clientItem.telephone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faPhone} className="absolute left-3 text-gray-500 text-sm z-10" />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={client.telephone}
                  onChange={(e) => setClient({...client, telephone: e.target.value})}
                  className="w-full py-2 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none"
                />
              </div>
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-3 text-gray-500 text-sm z-10" />
                <textarea
                  placeholder="Adresse"
                  value={client.adresse}
                  onChange={(e) => setClient({...client, adresse: e.target.value})}
                  className="w-full py-2 px-3 pl-10 text-sm border-2 border-gray-200 rounded-lg transition-colors focus:border-[#472ead] focus:outline-none resize-y min-h-[60px]"
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Panier */}
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
                <small className="text-sm">Ajoutez des produits</small>
              </div>
            ) : (
              <>
                {/* Contrôle TVA */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                  <div className="mb-0">
                    <label className="flex items-center gap-3 cursor-pointer font-medium text-gray-800 text-sm">
                      <input
                        type="checkbox"
                        checked={tvaActive}
                        onChange={(e) => setTvaActive(e.target.checked)}
                        className="hidden"
                      />
                      <span className="flex items-center justify-center w-4 h-4">
                        <FontAwesomeIcon 
                          icon={tvaActive ? faCheckSquare : faSquare} 
                          className={`text-sm transition-all duration-300 ${tvaActive ? 'text-green-500' : 'text-gray-400'}`}
                        />
                      </span>
                      <span className="flex items-center gap-2 text-sm">
                        <FontAwesomeIcon icon={faReceipt} className="text-[#472ead] text-sm" />
                        TVA (18%)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Affichage groupé par type de vente */}
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
                                Code: {item.code} | Cat: {item.categorie}
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
                                  <span className={`text-sm font-bold ${item.prix_vente !== item.prix_base ? 'text-amber-600' : 'text-gray-800'}`}>
                                    {item.prix_vente.toLocaleString()} FCFA × {item.quantite}
                                  </span>
                                  <div className="text-xs text-green-600 font-semibold mt-1">
                                    {(item.prix_vente * item.quantite).toLocaleString()} FCFA
                                  </div>
                                  {typeAffichage === 'gros' && item.unite_carton > 1 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {item.quantite} carton(s) × {item.unite_carton} unités
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

                {/* Résumé */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
                  <h4 className="text-sm text-gray-800 mb-3 font-semibold flex items-center gap-2">
                    <FontAwesomeIcon icon={faReceipt} className="text-[#472ead] text-sm" />
                    Résumé
                  </h4>
                  <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 text-sm">
                    <span>Total HT:</span>
                    <span>{totalHT.toLocaleString()} FCFA</span>
                  </div>
                  {tvaActive && (
                    <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 text-sm">
                      <span>TVA (18%):</span>
                      <span>{tva.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-800">
                    <strong>Total TTC:</strong>
                    <strong>{totalTTC.toLocaleString()} FCFA</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-auto">
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
                        Envoyer la Commande
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
      
      {/* Modal du ticket */}
      {commandeValidee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-2xl shadow-2xl w-[340px]">
            
            {/* TITRE */}
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faPrint} />
                Aperçu du ticket
              </h3>
              <button
                onClick={() => setCommandeValidee(null)}
                className="text-gray-500 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* TICKET */}
            <div className="flex justify-center">
              <Ticket ref={ticketRef} commande={commandeValidee} />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={imprimerTicket}
                className="flex-1 flex items-center justify-center gap-2
                           bg-green-600 hover:bg-green-700
                           text-white py-2 rounded-lg font-bold transition"
              >
                <FontAwesomeIcon icon={faPrint} />
                Imprimer
              </button>

              <button
                onClick={() => setCommandeValidee(null)}
                className="flex-1 flex items-center justify-center gap-2
                           bg-gray-200 hover:bg-gray-300
                           py-2 rounded-lg font-bold transition"
              >
                <FontAwesomeIcon icon={faXmark} />
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
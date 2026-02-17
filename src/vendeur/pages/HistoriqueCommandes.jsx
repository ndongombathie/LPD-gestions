import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory,
  faFilter,
  faSearch,
  faCalendarAlt,
  faFileAlt,
  faUser,
  faPhone,
  faBox,
  faShoppingBag,
  faPallet,
  faSync,
  faEye,
  faTimes,
  faCheckCircle,
  faClock,
  faTimesCircle,
  faFileInvoiceDollar,
  faReceipt,
  faChartBar,
  faRedo,
  faCalendarDay,
  faCalendar,
  faBoxOpen,
  faCalculator,
  faList,
  faSpinner,
  faExclamationTriangle,
  faDatabase,
  faUserTie,
  faMapMarkerAlt,
  faChevronDown,
  faChevronUp,
  faSort,
  faDownload,
  faPrint,
  faShare,
  faChartLine,
  faMoneyBill,
  faTag,
  faCrown,
  faStar,
  faArrowUp,
  faArrowDown,
  faInfoCircle,
  faCheck,
  faBan,
  faChevronLeft,
  faChevronRight,
  faStepBackward,
  faStepForward,
  faBell,
  faBarcode
} from '@fortawesome/free-solid-svg-icons';
import { commandesAPI } from '../../services/api/commandes';
import profileAPI from '../../services/api/profile';

const HistoriqueCommandes = ({ sellerName = null }) => {
  // États pour les données
  const [commandes, setCommandes] = useState([]);
  const [commandesFiltrees, setCommandesFiltrees] = useState([]);
  const [commandesPaginees, setCommandesPaginees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    aujourdhui: 0,
    en_attente: 0,
    valide: 0,
    annulee: 0,
    total_gros: 0,
    total_detail: 0
  });

  // États pour les filtres
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreTypeVente, setFiltreTypeVente] = useState('tous');
  const [filtreDate, setFiltreDate] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [recherche, setRecherche] = useState('');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [commandeDetails, setCommandeDetails] = useState(null);
  const [modeDemo, setModeDemo] = useState(false);
  const [vendeurInfo, setVendeurInfo] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // État pour le rafraîchissement
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  
  // États pour la pagination
  const [pageCourante, setPageCourante] = useState(1);
  const [itemsParPage, setItemsParPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // ---------- Mappage des statuts ----------
  const mapAPIStatut = (statutAPI) => {
    const mapping = {
      'validee': 'complétée',
      'completed': 'complétée',
      'pending': 'en_attente_paiement',
      'en_attente': 'en_attente_paiement',
      'en attente': 'en_attente_paiement',
      'en attente paiement': 'en_attente_paiement',
      'cancelled': 'annulée',
      'annulee': 'annulée',
      'annulée': 'annulée',
      'local_only': 'en_attente_paiement',
      'en_attente_paiement': 'en_attente_paiement',
      'payee': 'complétée',
      'paid': 'complétée',
      'delivered': 'complétée',
      'livree': 'complétée',
      'processing': 'en_attente_paiement',
      'traitement': 'en_attente_paiement',
      'attente': 'en_attente_paiement',
      'validée': 'complétée',
      'à préparer': 'en_attente_paiement',
      'préparée': 'en_attente_paiement',
      'expédiée': 'complétée',
      'livraison en cours': 'en_attente_paiement'
    };
    const statut = statutAPI?.toLowerCase()?.trim();
    return mapping[statut] || statutAPI || 'en_attente_paiement';
  };

  // ---------- Fonction pour extraire les produits des détails de la commande ----------
  const extraireProduitsDeLaCommande = (commandeData) => {
    console.log('🔍 Extraction des produits depuis:', commandeData);
    
    let produits = [];
    
    // Vérifier tous les formats possibles où les produits peuvent être stockés
    const sourcesProduits = [
      commandeData.items,
      commandeData.produits,
      commandeData.lignes_commande,
      commandeData.lignes,
      commandeData.order_items,
      commandeData.products,
      commandeData.details,
      commandeData.articles
    ];
    
    for (const source of sourcesProduits) {
      if (source && Array.isArray(source) && source.length > 0) {
        console.log('✅ Source produits trouvée:', source);
        
        produits = source.map(item => {
          // Extraction améliorée du nom du produit
          let nomProduit = 'Produit sans nom';
          
          // Vérifier toutes les sources possibles pour le nom
          if (item.nom) nomProduit = item.nom;
          else if (item.name) nomProduit = item.name;
          else if (item.libelle) nomProduit = item.libelle;
          else if (item.designation) nomProduit = item.designation;
          else if (item.product_nom) nomProduit = item.product_nom;
          else if (item.product_name) nomProduit = item.product_name;
          else if (item.product && item.product.nom) nomProduit = item.product.nom;
          else if (item.product && item.product.name) nomProduit = item.product.name;
          else if (item.produit && item.produit.nom) nomProduit = item.produit.nom;
          else if (item.produit && item.produit.name) nomProduit = item.produit.name;
          
          // Déterminer le type de vente du produit
          let typeVenteProduit = 'détail';
          if (item.type_vente) {
            const typeStr = item.type_vente.toLowerCase();
            if (typeStr === 'gros' || typeStr === 'gross') {
              typeVenteProduit = 'gros';
            } else if (typeStr === 'détail' || typeStr === 'detail') {
              typeVenteProduit = 'détail';
            }
          } else if (item.sale_type) {
            const typeStr = item.sale_type.toLowerCase();
            if (typeStr === 'gros' || typeStr === 'gross' || typeStr === 'wholesale') {
              typeVenteProduit = 'gros';
            } else {
              typeVenteProduit = 'détail';
            }
          }
          
          return {
            id: item.id || item.product_id || item.produit_id,
            nom: nomProduit,
            quantite: Number(item.quantite || item.quantity || item.qte || item.qty || 1),
            prix_unitaire: Number(item.prix_unitaire || item.prix || item.price || 0),
            prix_vente: Number(item.prix_vente || item.prix_detail || item.prix_gros || item.sale_price || item.prix_unitaire || item.prix || item.price || 0),
            type_vente: typeVenteProduit,
            sous_total: Number(item.sous_total || item.subtotal || item.total_item || item.total || 
                              (Number(item.quantite || 1) * Number(item.prix_vente || item.prix || 0)) || 0),
            _raw: item
          };
        });
        break; // Sortir dès qu'on trouve des produits
      }
    }
    
    // Si toujours pas de produits, vérifier si la commande a un champ produits_format
    if (produits.length === 0 && commandeData.produits_format) {
      try {
        if (typeof commandeData.produits_format === 'string') {
          produits = JSON.parse(commandeData.produits_format);
        } else {
          produits = commandeData.produits_format;
        }
      } catch (e) {
        console.warn('⚠️ Erreur parsing produits_format:', e);
      }
    }
    
    console.log('📦 Produits extraits:', produits);
    return produits;
  };

  // ---------- Charger les informations du vendeur ----------
  const chargerInfosVendeur = useCallback(async () => {
    try {
      const response = await profileAPI.getProfile();
      if (response && response.data) {
        setVendeurInfo(response.data);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger les infos du vendeur:', error);
    }
  }, []);

  // ---------- Formater le nom complet du client ----------
  const formaterNomClient = (client) => {
    if (!client) return 'Client';
    
    if (typeof client === 'object') {
      if (client.nom && client.prenom) {
        return `${client.prenom} ${client.nom}`;
      }
      if (client.nom_complet) return client.nom_complet;
      if (client.full_name) return client.full_name;
      if (client.name) return client.name;
      if (client.nom) return client.nom;
      
      const prenom = client.firstName || client.first_name || client.prenom || '';
      const nom = client.lastName || client.last_name || client.nom || client.name || '';
      
      if (prenom && nom) return `${prenom} ${nom}`;
      if (nom) return nom;
      if (prenom) return prenom;
    }
    
    if (typeof client === 'string') return client;
    
    return 'Client';
  };

  // ---------- Fonction pour vérifier si une commande est d'aujourd'hui ----------
  const estAujourdhui = (dateString) => {
    try {
      const aujourdhui = new Date();
      const dateCommande = new Date(dateString);
      
      return (
        dateCommande.getDate() === aujourdhui.getDate() &&
        dateCommande.getMonth() === aujourdhui.getMonth() &&
        dateCommande.getFullYear() === aujourdhui.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // ---------- Fonction de pagination ----------
  const paginerCommandes = useCallback((commandesList, page, itemsPerPage) => {
    const indexDebut = (page - 1) * itemsPerPage;
    const indexFin = indexDebut + itemsPerPage;
    
    return {
      commandesPaginees: commandesList.slice(indexDebut, indexFin),
      totalPages: Math.ceil(commandesList.length / itemsPerPage)
    };
  }, []);

  // ---------- Données de secours ----------
  const genererDonneesFallback = useCallback(() => {
    const aujourdhui = new Date();
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    const avantHier = new Date(aujourdhui);
    avantHier.setDate(avantHier.getDate() - 2);
    
    const nomVendeur = vendeurInfo?.nom || vendeurInfo?.name || sellerName || 'Vendeur';
    
    const commandesDemo = [];
    
    for (let i = 1; i <= 150; i++) {
      const date = i % 3 === 0 ? hier : i % 3 === 1 ? aujourdhui : avantHier;
      const statut = i % 4 === 0 ? 'annulée' : i % 4 === 1 ? 'en_attente_paiement' : 'complétée';
      const typeVente = i % 3 === 0 ? 'gros' : 'détail';
      
      // ✅ TVA aléatoire pour démo (50% des commandes avec TVA)
      const tvaAppliquee = Math.random() > 0.5;
      
      const produits = [];
      const nbProduits = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 1; j <= nbProduits; j++) {
        const prixVente = Math.floor(Math.random() * 50000) + 1000;
        const quantite = Math.floor(Math.random() * 10) + 1;
        
        produits.push({
          id: j,
          nom: `Produit ${i}-${j}`,
          quantite: quantite,
          prix_unitaire: prixVente,
          prix_vente: prixVente,
          type_vente: typeVente,
          sous_total: prixVente * quantite
        });
      }
      
      const totalHT = produits.reduce((sum, p) => sum + (p.prix_vente * p.quantite), 0);
      const tva = tvaAppliquee ? Math.round(totalHT * 0.18) : 0;
      const totalTTC = totalHT + tva;
      
      commandesDemo.push({
        id: `demo-${i.toString().padStart(3, '0')}`,
        numero_commande: `CMD-${date.getDate().toString().padStart(2, '0')}${i.toString().padStart(3, '0')}`,
        client: { 
          nom: `Client ${i}`,
          telephone: `77 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`, 
          adresse: 'Dakar, Plateau' 
        },
        total_ht: totalHT,
        tva: tva,
        total_ttc: totalTTC,
        tva_appliquee: tvaAppliquee, // ✅ Important
        statut: statut,
        type_vente: typeVente,
        date: new Date(date.getTime() - Math.random() * 10000000000).toISOString(),
        vendeur: nomVendeur,
        produits: produits,
        _source: 'demo'
      });
    }
    
    return commandesDemo;
  }, [sellerName, vendeurInfo]);

  // ---------- Charger les statistiques ----------
  const chargerStatistiques = useCallback((commandesList) => {
    console.log('📊 Calcul des statistiques sur', commandesList.length, 'commandes');
    
    const commandesAujourdhui = commandesList.filter(c => estAujourdhui(c.date));
    
    // Compter par type de vente
    let totalGros = 0;
    let totalDetail = 0;
    
    commandesList.forEach(commande => {
      if (commande.type_vente === 'gros') totalGros++;
      else if (commande.type_vente === 'détail') totalDetail++;
      else if (commande.type_vente === 'mixte') {
        totalGros++;
        totalDetail++;
      }
    });
    
    const statsCalc = {
      aujourdhui: commandesAujourdhui.length,
      en_attente: commandesAujourdhui.filter(c => {
        const statut = c.statut?.toLowerCase() || '';
        return statut.includes('attente') || 
               statut === 'en_attente_paiement' || 
               statut === 'pending' ||
               statut === 'processing';
      }).length,
      valide: commandesAujourdhui.filter(c => {
        const statut = c.statut?.toLowerCase() || '';
        return statut === 'complétée' || 
               statut === 'completed' ||
               statut === 'payee' ||
               statut === 'paid' ||
               statut === 'delivered' ||
               statut === 'livree' ||
               statut === 'validée';
      }).length,
      annulee: commandesAujourdhui.filter(c => {
        const statut = c.statut?.toLowerCase() || '';
        return statut === 'annulée' || 
               statut === 'cancelled' ||
               statut === 'annulee';
      }).length,
      total_gros: totalGros,
      total_detail: totalDetail
    };
    
    setStats(statsCalc);
  }, []);

  // ---------- Fonction pour déterminer le type de vente d'une commande ----------
  const determinerTypeVente = (commande) => {
    // 1. Vérifier d'abord le champ type_vente de la commande (priorité maximale)
    if (commande.type_vente) {
      const typeStr = commande.type_vente.toLowerCase().trim();
      if (typeStr === 'gros' || typeStr === 'gross' || typeStr === 'wholesale') {
        return 'gros';
      }
      if (typeStr === 'détail' || typeStr === 'detail' || typeStr === 'retail') {
        return 'détail';
      }
      if (typeStr === 'mixte' || typeStr === 'mixed') {
        return 'mixte';
      }
      // Si c'est autre chose, retourner la valeur brute
      return commande.type_vente;
    }
    
    // 2. Vérifier dans les produits si le champ type_vente de la commande n'existe pas
    const produits = extraireProduitsDeLaCommande(commande);
    if (produits && produits.length > 0) {
      const typesProduits = new Set();
      produits.forEach(p => {
        if (p.type_vente) {
          const productType = p.type_vente.toLowerCase();
          if (productType === 'gros' || productType === 'gross') {
            typesProduits.add('gros');
          } else if (productType === 'détail' || productType === 'detail') {
            typesProduits.add('détail');
          }
        }
      });
      
      if (typesProduits.size === 1) {
        return Array.from(typesProduits)[0];
      } else if (typesProduits.size > 1) {
        return 'mixte';
      }
    }
    
    // 3. Valeur par défaut
    return 'détail';
  };

  // ---------- Charger les commandes ----------
  const chargerCommandes = useCallback(async (showNotification = false) => {
    console.log('🚀 Début chargement des commandes depuis API...');
    setLoading(true);
    setError(null);
    setModeDemo(false);
    
    try {
      chargerInfosVendeur();

      const response = await commandesAPI.getAll({
        perPage: 1000,
        page: 1,
        sort: 'desc',
        orderBy: 'date'
      });
      
      let commandesTransformees = [];
      
      if (response && (response.data || response)) {
        const data = response.data || response;
        
        if (Array.isArray(data) && data.length === 0) {
          setModeDemo(true);
          commandesTransformees = genererDonneesFallback();
        } else {
          commandesTransformees = (Array.isArray(data) ? data : [data]).map(commande => {
            // Extraire les produits de la commande
            const produits = extraireProduitsDeLaCommande(commande);
            
            // Déterminer le type de vente avec la nouvelle fonction
            const typeVente = determinerTypeVente(commande);
            
            let clientNom = 'Client';
            let clientTelephone = '';
            let clientAdresse = '';
            
            if (commande.client) {
              if (typeof commande.client === 'object') {
                clientNom = formaterNomClient(commande.client);
                clientTelephone = commande.client.telephone || commande.client.phone || '';
                clientAdresse = commande.client.adresse || commande.client.address || '';
              } else if (typeof commande.client === 'string') {
                clientNom = commande.client;
              }
            }
            
            // ✅ GESTION DE LA TVA - Vérifier si la TVA a été appliquée
            const tvaAppliquee = commande.tva_appliquee === true || 
                                 commande.tva_appliquee === 1 || 
                                 commande.tva_appliquee === 'true' ||
                                 commande.tva_active === true ||
                                 commande.tva_active === 1 ||
                                 commande.tva_active === 'true' ||
                                 commande.tva_appliquee === 'oui' ||
                                 (commande.tva && commande.tva > 0); // Si tva > 0, c'est qu'elle a été appliquée
            
            const totalTTC = Number(commande.total_ttc || commande.total || 
                                   commande.montant_ttc || commande.montant || 0);
            
            const totalHT = Number(commande.total_ht || commande.montant_ht || 
                                  (tvaAppliquee ? Math.round(totalTTC / 1.18) : totalTTC));
            
            // Si TVA non appliquée, tva = 0
            const tva = tvaAppliquee 
              ? Number(commande.tva || Math.round(totalHT * 0.18) || 0)
              : 0;
            
            let nomVendeur = sellerName || 'Vendeur';
            if (commande.vendeur) {
              if (typeof commande.vendeur === 'object') {
                nomVendeur = commande.vendeur.nom || commande.vendeur.name || nomVendeur;
              } else if (typeof commande.vendeur === 'string') {
                nomVendeur = commande.vendeur;
              }
            } else if (vendeurInfo) {
              nomVendeur = vendeurInfo.nom || vendeurInfo.name || nomVendeur;
            }
            
            return {
              id: commande.id || commande.uuid || `cmd-${Date.now()}-${Math.random()}`,
              numero_commande: commande.numero_commande || commande.numero || 
                              commande.reference || commande.order_number || 
                              `CMD-${Date.now().toString().slice(-8)}`,
              client: {
                nom: clientNom,
                telephone: clientTelephone,
                adresse: clientAdresse
              },
              total_ht: totalHT,
              tva: tva,
              total_ttc: totalTTC,
              tva_appliquee: tvaAppliquee, // ✅ Important : stocker si TVA appliquée ou non
              statut: mapAPIStatut(commande.statut || commande.status),
              type_vente: typeVente,
              date: commande.date || commande.created_at || 
                    commande.date_commande || commande.updated_at || new Date().toISOString(),
              vendeur: nomVendeur,
              produits: produits,
              _raw: commande,
              _source: 'api'
            };
          });
        }
        
        // Trier par date (plus récent d'abord)
        const commandesTriees = commandesTransformees.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        
        console.log(`✅ ${commandesTriees.length} commandes chargées depuis l'API`);
        console.log('Échantillon des types de vente:', commandesTriees.slice(0, 5).map(c => ({
          id: c.id,
          type_vente: c.type_vente,
          tva_appliquee: c.tva_appliquee,
          tva: c.tva
        })));
        
        const ancienNombre = commandes.length;
        const nouveauNombre = commandesTriees.length;
        
        setCommandes(commandesTriees);
        setCommandesFiltrees(commandesTriees);
        
        // Initialiser la pagination
        const { commandesPaginees, totalPages } = paginerCommandes(commandesTriees, 1, itemsParPage);
        setCommandesPaginees(commandesPaginees);
        setTotalPages(totalPages);
        setPageCourante(1);
        
        chargerStatistiques(commandesTriees);
        
        if (showNotification && ancienNombre > 0 && nouveauNombre > ancienNombre) {
          setShowRefreshNotification(true);
          setTimeout(() => setShowRefreshNotification(false), 3000);
        }
        
      } else {
        throw new Error('Format de réponse API invalide');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commandes:', error);
      setError(`Impossible de charger les commandes: ${error.message}`);
      setModeDemo(true);
      
      const fallbackData = genererDonneesFallback();
      console.log(`⚠️ Utilisation de ${fallbackData.length} commandes de démonstration`);
      setCommandes(fallbackData);
      setCommandesFiltrees(fallbackData);
      
      const { commandesPaginees, totalPages } = paginerCommandes(fallbackData, 1, itemsParPage);
      setCommandesPaginees(commandesPaginees);
      setTotalPages(totalPages);
      setPageCourante(1);
      
      chargerStatistiques(fallbackData);
    } finally {
      setLoading(false);
      setLastUpdate(Date.now());
    }
  }, [sellerName, vendeurInfo, chargerInfosVendeur, itemsParPage, paginerCommandes, commandes.length, genererDonneesFallback, chargerStatistiques]);

  // ---------- Charger les détails d'une commande ----------
  const chargerDetailsCommande = async (commande) => {
    if (!commande) return;
    
    setDetailsLoading(true);
    setCommandeSelectionnee(commande);
    setError(null);
    
    try {
      // Si c'est une commande en mode démo
      if (commande._source === 'demo') {
        setCommandeDetails(commande);
        setModalOuvert(true);
        setDetailsLoading(false);
        return;
      }
      
      // Vérifier qu'on a un ID
      if (!commande.id) {
        console.warn('⚠️ Commande sans ID');
        setCommandeDetails(commande);
        setModalOuvert(true);
        setDetailsLoading(false);
        return;
      }
      
      console.log(`🔍 Chargement des détails pour la commande ID: ${commande.id}`);
      
      // Appel API avec l'ID de la commande
      const response = await commandesAPI.getById(commande.id);
      
      if (response && response.data) {
        const details = response.data;
        console.log('✅ Détails reçus de l\'API:', details);
        
        // Extraire les produits depuis les détails de la commande
        const produits = extraireProduitsDeLaCommande(details);
        console.log('📦 Produits trouvés dans les détails:', produits);
        
        // Si aucun produit trouvé, garder ceux de la commande de base
        if (produits.length === 0 && commande.produits && commande.produits.length > 0) {
          console.log('⚠️ Aucun produit dans les détails, utilisation des produits de base');
          produits.push(...commande.produits);
        }
        
        // Déterminer le type de vente avec la nouvelle fonction
        const typeVente = determinerTypeVente(details) || commande.type_vente;
        
        // ✅ GESTION DE LA TVA DANS LES DÉTAILS
        const tvaAppliquee = details.tva_appliquee === true || 
                             details.tva_appliquee === 1 || 
                             details.tva_appliquee === 'true' ||
                             details.tva_active === true ||
                             details.tva_active === 1 ||
                             details.tva_active === 'true' ||
                             (details.tva && details.tva > 0) ||
                             commande.tva_appliquee;
        
        const totalTTC = Number(details.total_ttc || details.total || 
                                details.montant_ttc || commande.total_ttc || 0);
        
        const totalHT = Number(details.total_ht || details.montant_ht || 
                              (tvaAppliquee ? Math.round(totalTTC / 1.18) : totalTTC) ||
                              commande.total_ht || 0);
        
        const tva = tvaAppliquee 
          ? Number(details.tva || Math.round(totalHT * 0.18) || commande.tva || 0)
          : 0;
        
        // Extraire les informations client
        let clientNom = 'Client';
        let clientTelephone = '';
        let clientAdresse = '';
        
        if (details.client) {
          if (typeof details.client === 'object') {
            clientNom = formaterNomClient(details.client);
            clientTelephone = details.client.telephone || details.client.phone || '';
            clientAdresse = details.client.adresse || details.client.address || '';
          } else if (typeof details.client === 'string') {
            clientNom = details.client;
          }
        } else if (commande.client) {
          clientNom = commande.client.nom || 'Client';
          clientTelephone = commande.client.telephone || '';
          clientAdresse = commande.client.adresse || '';
        }
        
        setCommandeDetails({
          ...commande,
          produits: produits,
          client: {
            nom: clientNom,
            telephone: clientTelephone,
            adresse: clientAdresse
          },
          total_ht: totalHT,
          tva: tva,
          total_ttc: totalTTC,
          tva_appliquee: tvaAppliquee,
          statut: mapAPIStatut(details.statut || details.status || commande.statut),
          numero_commande: details.numero_commande || details.numero || 
                          details.reference || commande.numero_commande,
          date: details.date || details.created_at || commande.date,
          type_vente: typeVente,
          vendeur: details.vendeur_nom || details.seller_name || commande.vendeur,
          _details_complets: details
        });
        
      } else {
        console.warn('⚠️ Réponse API sans données');
        setCommandeDetails(commande);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des détails:', error);
      setError(`Erreur: ${error.message}`);
      setCommandeDetails(commande);
    } finally {
      setModalOuvert(true);
      setDetailsLoading(false);
    }
  };

  // ---------- Ouvrir les détails ----------
  const ouvrirDetails = async (commande) => {
    await chargerDetailsCommande(commande);
  };

  // ---------- Écouter les événements de création de commande ----------
  useEffect(() => {
    const handleCommandeCreee = (event) => {
      console.log('🔄 Nouvelle commande détectée, rechargement...', event.detail);
      chargerCommandes(true);
    };

    window.addEventListener('commande-creee', handleCommandeCreee);
    
    return () => {
      window.removeEventListener('commande-creee', handleCommandeCreee);
    };
  }, [chargerCommandes]);

  // ---------- Effet initial ----------
  useEffect(() => {
    chargerCommandes();
  }, [chargerCommandes]);

  // ---------- Effet pour les filtres ----------
  useEffect(() => {
    if (commandes.length === 0) return;
    
    let commandesFiltreesTemp = [...commandes];
    
    // Filtre statut
    if (filtreStatut !== 'tous') {
      commandesFiltreesTemp = commandesFiltreesTemp.filter(c => c.statut === filtreStatut);
    }
    
    // Filtre type vente
    if (filtreTypeVente !== 'tous') {
      commandesFiltreesTemp = commandesFiltreesTemp.filter(c => {
        if (filtreTypeVente === 'mixte') {
          return c.type_vente === 'mixte';
        } else {
          return c.type_vente === filtreTypeVente;
        }
      });
      
      console.log(`Filtré pour ${filtreTypeVente}: ${commandesFiltreesTemp.length} commandes`);
    }
    
    // Filtre date
    if (filtreDate !== 'tous') {
      const aujourdhui = new Date();
      const aujourdhuiStr = aujourdhui.toISOString().split('T')[0];
      
      commandesFiltreesTemp = commandesFiltreesTemp.filter(c => {
        try {
          const dateCommande = new Date(c.date).toISOString().split('T')[0];
          
          switch (filtreDate) {
            case 'aujourdhui':
              return dateCommande === aujourdhuiStr;
            case 'hier':
              const hier = new Date(aujourdhui);
              hier.setDate(hier.getDate() - 1);
              const hierStr = hier.toISOString().split('T')[0];
              return dateCommande === hierStr;
            case '7jours':
              const date7jours = new Date(aujourdhui);
              date7jours.setDate(date7jours.getDate() - 7);
              return new Date(c.date) >= date7jours;
            case '30jours':
              const date30jours = new Date(aujourdhui);
              date30jours.setDate(date30jours.getDate() - 30);
              return new Date(c.date) >= date30jours;
            case 'personnalisee':
              if (dateDebut && dateFin) {
                const debut = new Date(dateDebut);
                const fin = new Date(dateFin);
                fin.setDate(fin.getDate() + 1);
                const dateC = new Date(c.date);
                return dateC >= debut && dateC < fin;
              }
              return true;
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }
    
    // Filtre recherche
    if (recherche.trim()) {
      const terme = recherche.toLowerCase().trim();
      commandesFiltreesTemp = commandesFiltreesTemp.filter(c => {
        return (
          c.numero_commande?.toLowerCase().includes(terme) ||
          c.client?.nom?.toLowerCase().includes(terme) ||
          c.client?.telephone?.includes(terme) ||
          (c.produits && c.produits.some(p => 
            p.nom?.toLowerCase().includes(terme)
          ))
        );
      });
    }
    
    // Tri
    commandesFiltreesTemp.sort((a, b) => {
      let valA, valB;
      
      switch (sortField) {
        case 'numero':
          valA = a.numero_commande;
          valB = b.numero_commande;
          break;
        case 'montant':
          valA = a.total_ttc;
          valB = b.total_ttc;
          break;
        case 'client':
          valA = a.client?.nom;
          valB = b.client?.nom;
          break;
        case 'date':
        default:
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
          break;
      }
      
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    
    setCommandesFiltrees(commandesFiltreesTemp);
    
    // Mettre à jour la pagination
    const { commandesPaginees, totalPages } = paginerCommandes(commandesFiltreesTemp, pageCourante, itemsParPage);
    
    // Si la page courante n'existe plus, aller à la dernière page
    if (pageCourante > totalPages && totalPages > 0) {
      const nouvellePage = totalPages;
      const { commandesPaginees: nouvellesPaginees } = paginerCommandes(commandesFiltreesTemp, nouvellePage, itemsParPage);
      setCommandesPaginees(nouvellesPaginees);
      setTotalPages(totalPages);
      setPageCourante(nouvellePage);
    } else {
      setCommandesPaginees(commandesPaginees);
      setTotalPages(totalPages);
    }
    
  }, [commandes, filtreStatut, filtreTypeVente, filtreDate, dateDebut, dateFin, recherche, sortField, sortDirection, itemsParPage, paginerCommandes, pageCourante]);

  // ---------- Effet pour mettre à jour les statistiques ----------
  useEffect(() => {
    if (commandes.length > 0) {
      chargerStatistiques(commandes);
    }
  }, [commandes, chargerStatistiques]);

  // ---------- Fonctions de pagination ----------
  const allerPage = (page) => {
    if (page < 1 || page > totalPages) return;
    
    const { commandesPaginees } = paginerCommandes(commandesFiltrees, page, itemsParPage);
    setCommandesPaginees(commandesPaginees);
    setPageCourante(page);
    
    const tableElement = document.querySelector('.bg-white.rounded-xl.shadow-lg.border');
    if (tableElement) {
      window.scrollTo({
        top: tableElement.offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const changerItemsParPage = (nouvelleValeur) => {
    setItemsParPage(nouvelleValeur);
    const { commandesPaginees, totalPages } = paginerCommandes(commandesFiltrees, 1, nouvelleValeur);
    setCommandesPaginees(commandesPaginees);
    setTotalPages(totalPages);
    setPageCourante(1);
  };

  // ---------- Helpers ----------
  const getStatutIcone = (statut) => {
    switch (statut) {
      case 'complétée': return <FontAwesomeIcon icon={faCheckCircle} />;
      case 'en_attente_paiement': return <FontAwesomeIcon icon={faClock} />;
      case 'annulée': return <FontAwesomeIcon icon={faTimesCircle} />;
      default: return <FontAwesomeIcon icon={faFileAlt} />;
    }
  };

  const getStatutCouleur = (statut) => {
    switch (statut) {
      case 'complétée': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_attente_paiement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'annulée': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeVenteCouleur = (type) => {
    switch (type) {
      case 'détail': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gros': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'mixte': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formaterDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formaterMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant || 0);
  };

  const fermerDetails = () => {
    setModalOuvert(false);
    setTimeout(() => {
      setCommandeSelectionnee(null);
      setCommandeDetails(null);
    }, 300);
  };

  const reinitialiserFiltres = () => {
    setFiltreStatut('tous');
    setFiltreTypeVente('tous');
    setFiltreDate('tous');
    setDateDebut('');
    setDateFin('');
    setRecherche('');
  };

  const trierPar = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faArrowUp : faArrowDown;
  };

  // ---------- Rendu des boutons de pagination ----------
  const renderPaginationButtons = () => {
    const buttons = [];
    
    buttons.push(
      <button
        key="first"
        onClick={() => allerPage(1)}
        disabled={pageCourante === 1}
        className={`px-3 py-1 rounded-l-lg border border-gray-300 ${pageCourante === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        <FontAwesomeIcon icon={faStepBackward} />
      </button>
    );
    
    buttons.push(
      <button
        key="prev"
        onClick={() => allerPage(pageCourante - 1)}
        disabled={pageCourante === 1}
        className={`px-3 py-1 border border-gray-300 ${pageCourante === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
    );
    
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pageCourante - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => allerPage(i)}
          className={`px-3 py-1 border border-gray-300 ${pageCourante === i ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {i}
        </button>
      );
    }
    
    buttons.push(
      <button
        key="next"
        onClick={() => allerPage(pageCourante + 1)}
        disabled={pageCourante === totalPages}
        className={`px-3 py-1 border border-gray-300 ${pageCourante === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    );
    
    buttons.push(
      <button
        key="last"
        onClick={() => allerPage(totalPages)}
        disabled={pageCourante === totalPages}
        className={`px-3 py-1 rounded-r-lg border border-gray-300 ${pageCourante === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
      >
        <FontAwesomeIcon icon={faStepForward} />
      </button>
    );
    
    return buttons;
  };

  // ---------- Rendu de la table des produits dans le modal ----------
  const renderProduitsTable = () => {
    if (!commandeDetails?.produits || commandeDetails.produits.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faBox} className="text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">Aucun produit dans cette commande</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Produit</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantité</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Prix unitaire</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Sous-total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {commandeDetails.produits.map((produit, index) => {
              const quantite = produit.quantite || 0;
              const prixVente = produit.prix_vente || produit.prix_unitaire || 0;
              const sousTotal = produit.sous_total || (quantite * prixVente);
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{produit.nom}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      produit.type_vente === 'gros' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {produit.type_vente === 'gros' ? 'Gros' : 'Détail'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{quantite}</td>
                  <td className="py-3 px-4 text-gray-900">{formaterMontant(prixVente)} FCFA</td>
                  <td className="py-3 px-4 text-gray-900 font-semibold">{formaterMontant(sousTotal)} FCFA</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const donneesModal = commandeDetails || commandeSelectionnee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Notification de mise à jour */}
      {showRefreshNotification && (
        <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <FontAwesomeIcon icon={faBell} className="animate-bounce" />
          <span>Nouvelles commandes disponibles !</span>
        </div>
      )}

      {/* En-tête principal */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FontAwesomeIcon icon={faHistory} className="text-blue-600" />
              Historique des Commandes
            </h1>
            <p className="text-gray-600 mt-2">Consultez et gérez l'historique complet des commandes clients</p>
            <p className="text-xs text-gray-400 mt-1">
              Dernière mise à jour: {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            {modeDemo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                <FontAwesomeIcon icon={faDatabase} className="mr-2" />
                Mode démo
              </span>
            )}
            
            {vendeurInfo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                <FontAwesomeIcon icon={faUserTie} className="mr-2" />
                {vendeurInfo.nom || vendeurInfo.name || sellerName || 'Vendeur'}
              </span>
            )}
            
            <button 
              onClick={() => chargerCommandes(true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faRedo} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Commandes aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.aujourdhui}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FontAwesomeIcon icon={faCalendarDay} className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.en_attente}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FontAwesomeIcon icon={faClock} className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Validées</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.valide}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Annulées</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.annulee}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FontAwesomeIcon icon={faBan} className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FontAwesomeIcon icon={faFilter} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Filtres et recherche</h2>
                <p className="text-gray-600 text-sm">Affinez vos résultats</p>
              </div>
            </div>
            <FontAwesomeIcon 
              icon={showAdvancedFilters ? faChevronUp : faChevronDown} 
              className="text-gray-400"
            />
          </div>
        </div>

        <div className={`border-t border-gray-200 transition-all duration-300 ${showAdvancedFilters ? 'max-h-screen opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faTag} />
                Statut de la commande
              </label>
              <div className="flex flex-wrap gap-2">
                {['tous', 'complétée', 'en_attente_paiement', 'annulée'].map(statut => (
                  <button
                    key={statut}
                    onClick={() => setFiltreStatut(statut)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtreStatut === statut 
                      ? statut === 'complétée' ? 'bg-green-100 text-green-800 border border-green-300' 
                      : statut === 'en_attente_paiement' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : statut === 'annulée' ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {statut === 'tous' ? 'Tous' : 
                     statut === 'complétée' ? 'Complétées' :
                     statut === 'en_attente_paiement' ? 'En attente' : 'Annulées'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxOpen} />
                Type de vente
              </label>
              <div className="flex flex-wrap gap-2">
                {['tous', 'détail', 'gros', 'mixte'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFiltreTypeVente(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtreTypeVente === type 
                      ? type === 'détail' ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : type === 'gros' ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : type === 'mixte' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {type === 'tous' ? 'Tous' : 
                     type === 'détail' ? 'Détail' :
                     type === 'gros' ? 'Gros' : 'Mixte'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} />
                Période
              </label>
              <div className="flex flex-wrap gap-2">
                {['tous', 'aujourdhui', 'hier', '7jours', '30jours', 'personnalisee'].map(periode => (
                  <button
                    key={periode}
                    onClick={() => setFiltreDate(periode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtreDate === periode 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {periode === 'tous' ? 'Toutes' :
                     periode === 'aujourdhui' ? 'Aujourd\'hui' :
                     periode === 'hier' ? 'Hier' :
                     periode === '7jours' ? '7 jours' :
                     periode === '30jours' ? '30 jours' : 
                     'Personnalisée'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtreDate === 'personnalisee' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Période personnalisée</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par numéro de commande, nom du client, téléphone, produit..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              {commandesFiltrees.length} commande(s) trouvée(s) sur {commandes.length}
            </div>
            <div className="flex gap-3">
              {(filtreStatut !== 'tous' || filtreTypeVente !== 'tous' || filtreDate !== 'tous' || recherche) && (
                <button
                  onClick={reinitialiserFiltres}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des commandes avec pagination */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0">Liste des commandes</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Tri:
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => trierPar('date')}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-lg border transition-colors ${sortField === 'date' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  Date
                  <FontAwesomeIcon icon={getSortIcon('date')} className="text-xs" />
                </button>
                <button
                  onClick={() => trierPar('montant')}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-lg border transition-colors ${sortField === 'montant' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  Montant
                  <FontAwesomeIcon icon={getSortIcon('montant')} className="text-xs" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher:</span>
                <select
                  value={itemsParPage}
                  onChange={(e) => changerItemsParPage(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span className="text-sm text-gray-600">par page</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-blue-600 mb-4" />
            <p className="text-gray-600">Chargement des commandes...</p>
          </div>
        ) : commandesPaginees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faBox} className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-600 mb-6">Aucune commande ne correspond à vos critères de recherche.</p>
            <button
              onClick={reinitialiserFiltres}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {commandesPaginees.map(commande => (
                <div key={commande.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="lg:w-2/3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{commande.numero_commande}</h3>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatutCouleur(commande.statut)}`}>
                              {getStatutIcone(commande.statut)}
                              {commande.statut === 'en_attente_paiement' ? 'En attente' : 
                               commande.statut === 'complétée' ? 'Complétée' : 
                               commande.statut === 'annulée' ? 'Annulée' : commande.statut}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getTypeVenteCouleur(commande.type_vente)}`}>
                              {commande.type_vente === 'gros' ? 'Gros' : 
                               commande.type_vente === 'mixte' ? 'Mixte' : 'Détail'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                              {formaterDate(commande.date)}
                            </span>
                            
                            {/* ✅ Indicateur TVA appliquée ou non */}
                            {commande.tva_appliquee ? (
                              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                TVA appliquée
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
                                TVA non appliquée
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formaterMontant(commande.total_ttc)} FCFA
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            HT: {formaterMontant(commande.total_ht)} • 
                            {/* ✅ Afficher TVA = 0 si non appliquée */}
                            TVA: {formaterMontant(commande.tva)} 
                            {!commande.tva_appliquee && commande.tva === 0 && (
                              <span className="ml-1 text-gray-400">(non appliquée)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{commande.client?.nom || 'Client non spécifié'}</h4>
                            <div className="flex flex-wrap gap-4 mt-2">
                              {commande.client?.telephone && (
                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                  <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                                  {commande.client.telephone}
                                </span>
                              )}
                              {commande.client?.adresse && (
                                <span className="flex items-center gap-2 text-sm text-gray-600">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                                  {commande.client.adresse}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FontAwesomeIcon icon={faBox} />
                          Produits ({commande.produits?.length || 0})
                        </h4>
                        {commande.produits && commande.produits.length > 0 ? (
                          <div className="space-y-2">
                            {commande.produits.slice(0, 2).map((produit, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-900">{produit.nom}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-600">× {produit.quantite}</span>
                                  <span className="text-gray-900">{formaterMontant(produit.prix_vente || produit.prix_unitaire)} FCFA</span>
                                </div>
                              </div>
                            ))}
                            {commande.produits.length > 2 && (
                              <div className="text-sm text-gray-500 italic">
                                + {commande.produits.length - 2} autre(s) produit(s)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Aucun produit dans cette commande
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-1/3 lg:border-l lg:pl-6 lg:border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Vendeur</h4>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <FontAwesomeIcon icon={faUserTie} className="text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-900">{commande.vendeur}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={() => ouvrirDetails(commande)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            title={`Charger les détails complets de la commande ${commande.numero_commande}`}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            Voir les détails complets
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {pageCourante} sur {totalPages} • 
                    Affichage de {Math.min((pageCourante - 1) * itemsParPage + 1, commandesFiltrees.length)} à {Math.min(pageCourante * itemsParPage, commandesFiltrees.length)} sur {commandesFiltrees.length} commandes
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded-lg shadow-sm">
                      {renderPaginationButtons()}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-gray-600">Aller à:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={pageCourante}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) {
                            allerPage(page);
                          }
                        }}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {commandesPaginees.length > 0 && !loading && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{commandesFiltrees.length}</span> commande(s) correspondant aux filtres
              {filtreStatut !== 'tous' && ` • Statut: ${filtreStatut}`}
              {filtreTypeVente !== 'tous' && ` • Type: ${filtreTypeVente}`}
              {filtreDate !== 'tous' && ` • Période: ${filtreDate === 'tous' ? 'Toutes' : filtreDate}`}
              {recherche && ` • Recherche: "${recherche}"`}
            </div>
          </div>
        )}
      </div>

      {/* Modal des détails */}
      {modalOuvert && donneesModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={fermerDetails}
          ></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto z-10">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faReceipt} className="text-blue-600 text-xl" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Détails de la commande
                  </h3>
                  <p className="text-gray-600">{donneesModal.numero_commande}</p>
                </div>
                {donneesModal._source === 'demo' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                    Démo
                  </span>
                )}
              </div>

              <button
                onClick={fermerDetails}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {detailsLoading ? (
                <div className="py-12 text-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-blue-600 mb-4" />
                  <p className="text-gray-600">Chargement des détails...</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-600" />
                      Informations de la commande
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Numéro</label>
                        <p className="text-gray-900 font-medium">{donneesModal.numero_commande}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                        <p className="text-gray-900 font-medium">{formaterDate(donneesModal.date)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Statut</label>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatutCouleur(donneesModal.statut)}`}>
                          {getStatutIcone(donneesModal.statut)}
                          {donneesModal.statut === 'en_attente_paiement' ? 'En attente' : 
                           donneesModal.statut === 'complétée' ? 'Complétée' : 
                           donneesModal.statut === 'annulée' ? 'Annulée' : donneesModal.statut}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Type de vente</label>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getTypeVenteCouleur(donneesModal.type_vente)}`}>
                          {donneesModal.type_vente === 'gros' ? 'Gros' : 
                           donneesModal.type_vente === 'mixte' ? 'Mixte' : 'Détail'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Vendeur</label>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <FontAwesomeIcon icon={faUserTie} className="text-gray-400" />
                          {donneesModal.vendeur}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">TVA</label>
                        <p className="text-gray-900 font-medium">
                          {donneesModal.tva_appliquee ? (
                            <span className="text-green-600">Appliquée (18%)</span>
                          ) : (
                            <span className="text-gray-500">Non appliquée</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                      Informations client
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nom complet</label>
                        <p className="text-gray-900 font-medium">{donneesModal.client?.nom || 'Non spécifié'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                          {donneesModal.client?.telephone || 'Non spécifié'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Adresse</label>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                          {donneesModal.client?.adresse || 'Non spécifié'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faList} className="text-blue-600" />
                      Produits commandés ({donneesModal.produits?.length || 0})
                    </h4>
                    
                    {renderProduitsTable()}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalculator} className="text-blue-600" />
                      Totaux de la commande
                    </h4>
                    <div className="space-y-3 max-w-md ml-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total HT:</span>
                        <span className="text-gray-900 font-semibold">{formaterMontant(donneesModal.total_ht)} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          TVA (18%): 
                          {!donneesModal.tva_appliquee && donneesModal.tva === 0 && (
                            <span className="ml-1 text-xs text-gray-400">(non appliquée)</span>
                          )}
                        </span>
                        <span className={`font-semibold ${donneesModal.tva_appliquee ? 'text-amber-600' : 'text-gray-500'}`}>
                          {formaterMontant(donneesModal.tva)} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                        <span className="text-lg font-bold text-gray-900">Total TTC:</span>
                        <span className="text-2xl font-bold text-blue-600">{formaterMontant(donneesModal.total_ttc)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end p-6 border-t bg-gray-50 sticky bottom-0 bg-white z-20">
              <button
                onClick={fermerDetails}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HistoriqueCommandes;
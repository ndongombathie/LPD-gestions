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
  faArrowUp,
  faArrowDown,
  faInfoCircle,
  faCheck,
  faBan,
  faBell,
  faMoneyBill,
  faAngleLeft,
  faAngleRight,
  faAngleDoubleLeft,
  faAngleDoubleRight
} from '@fortawesome/free-solid-svg-icons';
import { commandesAPI } from '../../services/api/commandes';
import profileAPI from '../../services/api/profile';

const HistoriqueCommandes = ({ sellerName = null }) => {
  // États pour les données
  const [commandes, setCommandes] = useState([]);
  const [commandesFiltrees, setCommandesFiltrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    aujourdhui: 0,
    en_attente: 0,
    valide: 0,
    annulee: 0,
    total_gros: 0,
    total_detail: 0,
    total_ventes: 0,
    montant_total: 0
  });

  // États pour les filtres
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreTypeVente, setFiltreTypeVente] = useState('tous');
  const [filtreDate, setFiltreDate] = useState('aujourdhui');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [recherche, setRecherche] = useState('');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [commandeDetails, setCommandeDetails] = useState(null);
  const [vendeurInfo, setVendeurInfo] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // États pour la pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1
  });

  // États pour la pagination des commandes filtrées (affichage)
  const [commandesPaginees, setCommandesPaginees] = useState([]);
  
  // État pour le rafraîchissement
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  
  // État pour la progression du chargement
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ---------- Fonction améliorée pour détecter si la TVA est appliquée ----------
  const estTVAAppliquee = (commande) => {
    if (!commande) return false;
    
    console.log('🔍 Vérification TVA pour commande:', commande.id || commande.numero_commande);
    
    // 1. Vérification directe des indicateurs de TVA
    const tvaIndicators = [
      commande.tva_appliquee,
      commande.tva_appliquee === 1,
      commande.tva_appliquee === '1',
      commande.tva_appliquee === true,
      commande.tva_appliquee === 'true',
      commande.tva_appliquee === 'oui',
      commande.tva_appliquee === 'yes',
      commande.tva_active,
      commande.tva_active === 1,
      commande.tva_active === true,
      commande.tva_active === '1',
      commande.tva_active === 'true',
      // Champs de l'API backend
      commande.apply_tva,
      commande.apply_tva === 1,
      commande.apply_tva === true,
      commande.appliquer_tva,
      commande.has_tva,
      commande.tva_inclus,
      commande.tva_inclus === 1,
      commande.tva_inclus === true,
      commande.tva_incluse,
      commande.tva_incluse === 1,
      commande.tva_incluse === true,
      commande.tva_apply,
      commande.tva_apply === 1,
      commande.tva_apply === true,
      commande.with_tva,
      commande.with_tva === 1,
      commande.with_tva === true
    ];

    if (tvaIndicators.some(indicator => indicator === true)) {
      console.log('✅ TVA détectée via indicateur direct');
      return true;
    }

    // 2. Vérification du taux de TVA
    const tvaTaux = Number(commande.tva_taux || commande.taux_tva || commande.tva_rate || commande.vat_rate || 0);
    if (tvaTaux > 0) {
      console.log('✅ TVA détectée via taux:', tvaTaux);
      return true;
    }

    // 3. Vérification du montant de TVA
    const montantTVA = Number(
      commande.tva || 
      commande.montant_tva || 
      commande.tva_amount || 
      commande.vat_amount || 
      commande.total_tva || 
      0
    );
    if (montantTVA > 0) {
      console.log('✅ TVA détectée via montant TVA:', montantTVA);
      return true;
    }

    // 4. Vérification via les montants (TTC > HT)
    const montantTTC = Number(
      commande.total_ttc || 
      commande.montant_ttc || 
      commande.grand_total || 
      commande.total || 
      commande.total_amount || 
      0
    );
    
    const montantHT = Number(
      commande.total_ht || 
      commande.montant_ht || 
      commande.subtotal || 
      commande.sub_total || 
      commande.total_htva || 
      0
    );
    
    if (montantTTC > 0 && montantHT > 0) {
      // Si TTC est strictement supérieur à HT, il y a probablement TVA
      if (montantTTC > montantHT) {
        console.log('✅ TVA détectée via TTC > HT:', montantTTC, '>', montantHT);
        return true;
      }
      
      // Calcul du ratio TTC/HT
      const ratio = montantTTC / montantHT;
      // Si le ratio est proche de 1.18 (ou autre taux de TVA)
      if (Math.abs(ratio - 1.18) < 0.01 || Math.abs(ratio - 1.19) < 0.01 || ratio > 1.17) {
        console.log('✅ TVA détectée via ratio TTC/HT:', ratio);
        return true;
      }
    }

    // 5. Vérification via les produits
    if (commande.items && Array.isArray(commande.items)) {
      for (const item of commande.items) {
        // Vérifier si l'article a des indicateurs de TVA
        if (item.tva_appliquee || item.tva_appliquee === 1 || item.tva_appliquee === true ||
            item.tva_active || item.tva_active === 1 || item.tva_active === true ||
            Number(item.tva_taux || 0) > 0 ||
            Number(item.tva || 0) > 0 || 
            Number(item.montant_tva || 0) > 0) {
          console.log('✅ TVA détectée via produit avec indicateur');
          return true;
        }
        
        // Vérifier le prix TTC vs HT de l'article
        const itemTTC = Number(item.prix_ttc || item.prix_total_ttc || item.sous_total || item.total || 0);
        const itemHT = Number(item.prix_ht || item.prix_total_ht || item.sous_total_ht || item.subtotal || 0);
        
        if (itemTTC > 0 && itemHT > 0 && itemTTC > itemHT) {
          console.log('✅ TVA détectée via produit TTC > HT');
          return true;
        }
      }
    }

    // 6. Vérification via les produits dans d'autres formats
    const produitsArrays = [
      commande.produits,
      commande.lignes_commande,
      commande.lignes,
      commande.order_items,
      commande.products,
      commande.details,
      commande.articles
    ];

    for (const produits of produitsArrays) {
      if (produits && Array.isArray(produits)) {
        for (const produit of produits) {
          if (produit.tva_appliquee || produit.tva_appliquee === 1 || produit.tva_appliquee === true ||
              produit.tva_active || produit.tva_active === 1 || produit.tva_active === true ||
              Number(produit.tva_taux || 0) > 0 ||
              Number(produit.tva || 0) > 0) {
            console.log('✅ TVA détectée via produit (autre format)');
            return true;
          }
        }
      }
    }

    // 7. Vérification via les métadonnées
    if (commande.metadata) {
      const metadata = commande.metadata;
      if (metadata.tva_appliquee || metadata.tva_appliquee === '1' || metadata.tva_appliquee === true ||
          metadata.apply_tva || metadata.has_tva || metadata.with_tva ||
          Number(metadata.taux_tva || 0) > 0 ||
          Number(metadata.tva_amount || 0) > 0) {
        console.log('✅ TVA détectée via métadonnées');
        return true;
      }
    }

    // 8. Vérification via les paramètres de la boutique
    if (commande.boutique && commande.boutique.tva_active) {
      console.log('✅ TVA détectée via boutique');
      return true;
    }

    // 9. Vérification via le mode de paiement ou type de vente
    if (commande.paiement && commande.paiement.mode) {
      if (commande.paiement.mode.toLowerCase().includes('tva') || 
          commande.paiement.mode.toLowerCase().includes('facture')) {
        console.log('✅ TVA détectée via mode de paiement');
        return true;
      }
    }

    console.log('❌ TVA non détectée');
    return false;
  };

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
    let produits = [];
    
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
        produits = source.map(item => {
          let nomProduit = 'Produit sans nom';
          
          if (item.nom) nomProduit = item.nom;
          else if (item.name) nomProduit = item.name;
          else if (item.libelle) nomProduit = item.libelle;
          else if (item.designation) nomProduit = item.designation;
          else if (item.product_nom) nomProduit = item.product_nom;
          else if (item.product_name) nomProduit = item.product_name;
          else if (item.product?.nom) nomProduit = item.product.nom;
          else if (item.product?.name) nomProduit = item.product.name;
          else if (item.produit?.nom) nomProduit = item.produit.nom;
          else if (item.produit?.name) nomProduit = item.produit.name;
          
          let typeVenteProduit = 'détail';
          if (item.type_vente) {
            const typeStr = item.type_vente.toLowerCase();
            if (typeStr === 'gros' || typeStr === 'gross' || typeStr === 'wholesale') {
              typeVenteProduit = 'gros';
            } else if (typeStr === 'détail' || typeStr === 'detail' || typeStr === 'retail') {
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
                              (Number(item.quantite || 1) * Number(item.prix_vente || item.prix || 0)) || 0)
          };
        });
        break;
      }
    }
    
    if (produits.length === 0 && commandeData.produits_format) {
      try {
        if (typeof commandeData.produits_format === 'string') {
          produits = JSON.parse(commandeData.produits_format);
        } else {
          produits = commandeData.produits_format;
        }
      } catch (e) {
        console.warn('Erreur parsing produits_format:', e);
      }
    }
    
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
      console.warn('Impossible de charger les infos du vendeur:', error);
    }
  }, []);

  // ---------- Formater le nom complet du client ----------
  const formaterNomClient = (client) => {
    if (!client) return 'Client';
    
    if (typeof client === 'object') {
      if (client.nom && client.prenom) return `${client.prenom} ${client.nom}`;
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

  // ---------- Charger les statistiques ----------
  const chargerStatistiques = useCallback((commandesList) => {
    const commandesAujourdhui = commandesList.filter(c => estAujourdhui(c.date));
    
    let totalGros = 0;
    let totalDetail = 0;
    let montantTotal = 0;
    
    commandesList.forEach(commande => {
      if (commande.type_vente === 'gros') totalGros++;
      else if (commande.type_vente === 'détail') totalDetail++;
      else if (commande.type_vente === 'mixte') {
        totalGros++;
        totalDetail++;
      }
      
      if (commande.total_ttc) {
        montantTotal += commande.total_ttc;
      } else if (commande.montant_ttc) {
        montantTotal += commande.montant_ttc;
      } else if (commande.total) {
        montantTotal += commande.total;
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
      total_detail: totalDetail,
      total_ventes: commandesList.length,
      montant_total: montantTotal
    };
    
    setStats(statsCalc);
  }, []);

  // ---------- FONCTION CORRIGÉE : Déterminer le type de vente d'une commande ----------
  const determinerTypeVente = (commande) => {
    // PRIORITÉ 1: Vérifier le type_vente directement sur la commande
    if (commande.type_vente) {
      const typeStr = commande.type_vente.toString().toLowerCase().trim();
      if (typeStr === 'gros' || typeStr === 'gross' || typeStr === 'wholesale') {
        return 'gros';
      }
      if (typeStr === 'détail' || typeStr === 'detail' || typeStr === 'retail') {
        return 'détail';
      }
      if (typeStr === 'mixte' || typeStr === 'mixed') {
        return 'mixte';
      }
      // Si c'est une autre valeur mais qu'elle contient "gros"
      if (typeStr.includes('gros')) {
        return 'gros';
      }
      if (typeStr.includes('détail') || typeStr.includes('detail')) {
        return 'détail';
      }
    }
    
    // PRIORITÉ 2: Vérifier sale_type
    if (commande.sale_type) {
      const saleTypeStr = commande.sale_type.toString().toLowerCase().trim();
      if (saleTypeStr === 'gros' || saleTypeStr === 'wholesale') {
        return 'gros';
      }
      if (saleTypeStr === 'détail' || saleTypeStr === 'retail') {
        return 'détail';
      }
      if (saleTypeStr === 'mixte' || saleTypeStr === 'mixed') {
        return 'mixte';
      }
    }
    
    // PRIORITÉ 3: Vérifier dans les métadonnées
    if (commande.metadata && commande.metadata.type_vente) {
      const metaType = commande.metadata.type_vente.toString().toLowerCase();
      if (metaType.includes('gros')) return 'gros';
      if (metaType.includes('détail') || metaType.includes('detail')) return 'détail';
      if (metaType.includes('mixte')) return 'mixte';
    }
    
    // PRIORITÉ 4: Analyser les produits pour déterminer le type
    const produits = extraireProduitsDeLaCommande(commande);
    
    if (produits && produits.length > 0) {
      let aDuGros = false;
      let aDuDetail = false;
      
      produits.forEach(p => {
        // Vérifier le type de vente du produit
        if (p.type_vente) {
          const productType = p.type_vente.toString().toLowerCase();
          if (productType === 'gros' || productType === 'gross' || productType === 'wholesale') {
            aDuGros = true;
          } else if (productType === 'détail' || productType === 'detail' || productType === 'retail') {
            aDuDetail = true;
          }
        }
        
        // Vérifier par les champs de prix spécifiques
        if (p.prix_gros && p.prix_gros > 0) {
          aDuGros = true;
        }
        if (p.prix_detail && p.prix_detail > 0) {
          aDuDetail = true;
        }
      });
      
      if (aDuGros && aDuDetail) {
        return 'mixte';
      } else if (aDuGros) {
        return 'gros';
      } else if (aDuDetail) {
        return 'détail';
      }
    }
    
    // PRIORITÉ 5: Vérifier par le montant total (si > seuil, considérer comme gros)
    const montant = commande.total_ttc || commande.montant_ttc || commande.total || 0;
    if (montant > 50000) { // Seuil de 50 000 FCFA pour considérer comme gros
      return 'gros';
    }
    
    // Par défaut, retourner 'détail'
    return 'détail';
  };

  // ---------- Charger TOUTES les commandes avec pagination massive ----------
  const chargerCommandes = useCallback(async (showNotification = false) => {
    console.log('🚀 Début chargement massif des commandes...');
    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0 });
    
    try {
      chargerInfosVendeur();

      // Configuration pour charger un maximum de commandes
      const BATCH_SIZE = 200;
      const MAX_PAGES = 50;
      
      let toutesLesCommandes = [];
      let pageActuelle = 1;
      let aPlusDePages = true;
      let totalPagesAPI = 1;

      while (aPlusDePages && pageActuelle <= MAX_PAGES) {
        console.log(`📦 Chargement lot ${pageActuelle}...`);
        
        setProgress({ current: pageActuelle, total: Math.min(totalPagesAPI, MAX_PAGES) });
        
        const response = await commandesAPI.getAll({
          page: pageActuelle,
          perPage: BATCH_SIZE,
          sort: 'desc',
          orderBy: 'date'
        });

        // Extraire les données de la page courante
        let commandesPage = [];
        let paginationInfo = null;
        
        if (response?.data && Array.isArray(response.data)) {
          commandesPage = response.data;
        } else if (Array.isArray(response)) {
          commandesPage = response;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          commandesPage = response.data.data;
          paginationInfo = response.data.pagination || response.data.meta;
        }

        // Récupérer les infos de pagination
        if (paginationInfo) {
          totalPagesAPI = paginationInfo.total_pages || paginationInfo.last_page || paginationInfo.pageCount || 1;
        }

        // Transformer les commandes de cette page
        const commandesTransformeesPage = commandesPage.map(commande => {
          const produits = extraireProduitsDeLaCommande(commande);
          // Utiliser la fonction corrigée pour déterminer le type de vente
          const typeVente = determinerTypeVente(commande);
          
          // Détection de la TVA avec la fonction améliorée
          const tvaAppliquee = estTVAAppliquee(commande);
          
          // Récupération des montants
          const montantTTC = Number(
            commande.total_ttc || 
            commande.total || 
            commande.montant_ttc || 
            commande.montant || 
            commande.grand_total ||
            0
          );
          
          const montantHT = Number(
            commande.total_ht || 
            commande.montant_ht || 
            commande.subtotal ||
            commande.sub_total ||
            (tvaAppliquee ? Math.round(montantTTC / 1.18) : montantTTC)
          );
          
          const montantTVA = tvaAppliquee 
            ? Number(
                commande.tva || 
                commande.montant_tva ||
                commande.tva_amount ||
                Math.round(montantHT * 0.18) || 
                (montantTTC - montantHT) || 
                0
              )
            : 0;
          
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
            total_ht: montantHT,
            tva: montantTVA,
            total_ttc: montantTTC,
            montant_ht: montantHT,
            montant_ttc: montantTTC,
            tva_appliquee: tvaAppliquee,
            tva_active: tvaAppliquee,
            tva_taux: tvaAppliquee ? 18 : 0,
            statut: mapAPIStatut(commande.statut || commande.status),
            // Utiliser le typeVente déterminé par la fonction corrigée
            type_vente: typeVente,
            date: commande.date || commande.created_at || 
                  commande.date_commande || commande.updated_at || new Date().toISOString(),
            vendeur: nomVendeur,
            produits: produits
          };
        });

        toutesLesCommandes = [...toutesLesCommandes, ...commandesTransformeesPage];
        console.log(`📊 Lot ${pageActuelle}: +${commandesTransformeesPage.length} commandes (total: ${toutesLesCommandes.length})`);
        
        // Déterminer s'il y a d'autres pages à charger
        pageActuelle++;
        
        if (paginationInfo) {
          aPlusDePages = pageActuelle <= paginationInfo.total_pages;
        } else if (commandesPage.length < BATCH_SIZE) {
          aPlusDePages = false;
        } else {
          aPlusDePages = commandesPage.length > 0;
        }
        
        // Petite pause pour éviter de surcharger l'API
        if (aPlusDePages) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`✅ TOTAL FINAL: ${toutesLesCommandes.length} commandes chargées`);

      // Trier par date (plus récent d'abord)
      const commandesTriees = toutesLesCommandes.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      setCommandes(commandesTriees);
      setCommandesFiltrees(commandesTriees);
      
      // Mettre à jour la pagination
      setPagination(prev => ({
        ...prev,
        totalItems: commandesTriees.length,
        totalPages: Math.ceil(commandesTriees.length / prev.itemsPerPage),
        currentPage: 1 // Reset à la première page
      }));
      
      chargerStatistiques(commandesTriees);
      
      // Sauvegarder en cache
      try {
        localStorage.setItem('commandes_cache', JSON.stringify({
          data: commandesTriees,
          timestamp: Date.now(),
          count: commandesTriees.length
        }));
      } catch (e) {
        console.warn('Impossible de sauvegarder en cache:', e);
      }
      
      if (showNotification) {
        setShowRefreshNotification(true);
        setTimeout(() => setShowRefreshNotification(false), 3000);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commandes:', error);
      setError(`Impossible de charger les commandes: ${error.message}`);
    } finally {
      setLoading(false);
      setLastUpdate(Date.now());
      setProgress({ current: 0, total: 0 });
    }
  }, [sellerName, vendeurInfo, chargerInfosVendeur, chargerStatistiques]);

  // ---------- Charger les détails d'une commande ----------
  const chargerDetailsCommande = async (commande) => {
    if (!commande) return;
    
    setDetailsLoading(true);
    setCommandeSelectionnee(commande);
    setError(null);
    
    try {
      if (!commande.id) {
        setCommandeDetails(commande);
        setModalOuvert(true);
        setDetailsLoading(false);
        return;
      }
      
      const response = await commandesAPI.getById(commande.id);
      
      if (response && response.data) {
        const details = response.data;
        const produits = extraireProduitsDeLaCommande(details);
        
        if (produits.length === 0 && commande.produits?.length > 0) {
          produits.push(...commande.produits);
        }
        
        // Utiliser la fonction corrigée pour déterminer le type de vente
        let typeVente = commande.type_vente;
        if (!typeVente) {
          typeVente = determinerTypeVente(details);
        }
        
        const tvaAppliquee = estTVAAppliquee(details) || estTVAAppliquee(commande);
        
        const totalTTC = Number(
          details.total_ttc || 
          details.total || 
          details.montant_ttc || 
          details.grand_total ||
          commande.total_ttc || 
          0
        );
        
        const totalHT = Number(
          details.total_ht || 
          details.montant_ht || 
          details.subtotal ||
          (tvaAppliquee ? Math.round(totalTTC / 1.18) : totalTTC) ||
          commande.total_ht || 
          0
        );
        
        const tva = tvaAppliquee 
          ? Number(
              details.tva || 
              details.montant_tva ||
              details.tva_amount ||
              Math.round(totalHT * 0.18) || 
              commande.tva || 
              (totalTTC - totalHT) ||
              0
            )
          : 0;
        
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
          montant_ht: totalHT,
          montant_ttc: totalTTC,
          tva_appliquee: tvaAppliquee,
          tva_active: tvaAppliquee,
          tva_taux: tvaAppliquee ? 18 : 0,
          statut: mapAPIStatut(details.statut || details.status || commande.statut),
          numero_commande: details.numero_commande || details.numero || 
                          details.reference || commande.numero_commande,
          date: details.date || details.created_at || commande.date,
          type_vente: typeVente,
          vendeur: details.vendeur_nom || details.seller_name || commande.vendeur
        });
        
      } else {
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

  // ---------- Effet pour les filtres et la pagination ----------
  useEffect(() => {
    if (commandes.length === 0) return;
    
    let commandesFiltreesTemp = [...commandes];
    
    // Application des filtres
    if (filtreStatut !== 'tous') {
      commandesFiltreesTemp = commandesFiltreesTemp.filter(c => c.statut === filtreStatut);
    }
    
    if (filtreTypeVente !== 'tous') {
      commandesFiltreesTemp = commandesFiltreesTemp.filter(c => {
        if (filtreTypeVente === 'mixte') {
          return c.type_vente === 'mixte';
        } else {
          return c.type_vente === filtreTypeVente;
        }
      });
    }
    
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
    
    // Mettre à jour la pagination avec les nouvelles données filtrées
    setPagination(prev => ({
      ...prev,
      totalItems: commandesFiltreesTemp.length,
      totalPages: Math.ceil(commandesFiltreesTemp.length / prev.itemsPerPage),
      currentPage: 1 // Revenir à la première page quand les filtres changent
    }));
    
  }, [commandes, filtreStatut, filtreTypeVente, filtreDate, dateDebut, dateFin, recherche, sortField, sortDirection]);

  // ---------- Effet pour la pagination ----------
  useEffect(() => {
    // Calculer les commandes à afficher pour la page courante
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const commandesPage = commandesFiltrees.slice(startIndex, endIndex);
    
    setCommandesPaginees(commandesPage);
  }, [commandesFiltrees, pagination.currentPage, pagination.itemsPerPage]);

  // ---------- Effet pour mettre à jour les statistiques ----------
  useEffect(() => {
    if (commandes.length > 0) {
      chargerStatistiques(commandes);
    }
  }, [commandes, chargerStatistiques]);

  // ---------- Fonctions de pagination ----------
  const goToPage = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  };

  const nextPage = () => {
    goToPage(pagination.currentPage + 1);
  };

  const prevPage = () => {
    goToPage(pagination.currentPage - 1);
  };

  const firstPage = () => {
    goToPage(1);
  };

  const lastPage = () => {
    goToPage(pagination.totalPages);
  };

  const changeItemsPerPage = (newItemsPerPage) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: newItemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / newItemsPerPage)
    }));
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

  // ---------- Rendu de la table des produits dans le modal ----------
  const renderProduitsTable = () => {
    if (!commandeDetails?.produits || commandeDetails.produits.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faBox} className="text-3xl text-gray-400 mb-3" />
          <p className="text-gray-600 text-sm">Aucun produit dans cette commande</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-3 text-left font-medium text-gray-700">Produit</th>
              <th className="py-2 px-3 text-left font-medium text-gray-700">Type</th>
              <th className="py-2 px-3 text-left font-medium text-gray-700">Qté</th>
              <th className="py-2 px-3 text-left font-medium text-gray-700">Prix unit.</th>
              <th className="py-2 px-3 text-left font-medium text-gray-700">Sous-total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {commandeDetails.produits.map((produit, index) => {
              const quantite = produit.quantite || 0;
              const prixVente = produit.prix_vente || produit.prix_unitaire || 0;
              const sousTotal = produit.sous_total || (quantite * prixVente);
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <div className="font-medium text-gray-900">{produit.nom}</div>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      produit.type_vente === 'gros' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {produit.type_vente === 'gros' ? 'Gros' : 'Détail'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-900">{quantite}</td>
                  <td className="py-2 px-3 text-gray-900">{formaterMontant(prixVente)}</td>
                  <td className="py-2 px-3 text-gray-900 font-medium">{formaterMontant(sousTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const donneesModal = commandeDetails || commandeSelectionnee;

  // Calcul des indices pour l'affichage
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  // Génération des numéros de page pour la navigation
  const getPageNumbers = () => {
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= pagination.totalPages; i++) {
      if (i === 1 || i === pagination.totalPages || (i >= pagination.currentPage - delta && i <= pagination.currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Notification de mise à jour */}
      {showRefreshNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-slide-in">
          <FontAwesomeIcon icon={faBell} className="animate-bounce" />
          <span>Commandes mises à jour !</span>
        </div>
      )}

      {/* Barre de progression */}
      {loading && progress.total > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-200 flex items-center gap-3 text-sm">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600" />
          <span>Chargement... {progress.current}/{progress.total}</span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-700 hover:text-red-900">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faHistory} className="text-blue-600" />
              Historique des Commandes
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {commandes.length} commandes • Dernière màj: {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {vendeurInfo && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                <FontAwesomeIcon icon={faUserTie} className="mr-1" />
                {vendeurInfo.nom || vendeurInfo.name || sellerName || 'Vendeur'}
              </span>
            )}
            
            <button 
              onClick={() => chargerCommandes(true)}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faRedo} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </div>

        {/* Stats compactes */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Aujourd'hui</p>
                <p className="text-xl font-bold text-gray-900">{stats.aujourdhui}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FontAwesomeIcon icon={faCalendarDay} className="text-blue-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">En attente</p>
                <p className="text-xl font-bold text-yellow-600">{stats.en_attente}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FontAwesomeIcon icon={faClock} className="text-yellow-600 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Validées</p>
                <p className="text-xl font-bold text-green-600">{stats.valide}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <FontAwesomeIcon icon={faCheck} className="text-green-600 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
        <div 
          className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faFilter} className="text-blue-600 text-sm" />
            </div>
            <span className="text-sm font-medium text-gray-900">Filtres</span>
            {(filtreStatut !== 'tous' || filtreTypeVente !== 'tous' || filtreDate !== 'tous' || recherche) && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Actifs
              </span>
            )}
          </div>
          <FontAwesomeIcon 
            icon={showAdvancedFilters ? faChevronUp : faChevronDown} 
            className="text-gray-400 text-sm"
          />
        </div>

        {showAdvancedFilters && (
          <div className="p-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="tous">Tous</option>
                  <option value="complétée">Complétées</option>
                  <option value="en_attente_paiement">En attente</option>
                  <option value="annulée">Annulées</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filtreTypeVente}
                  onChange={(e) => setFiltreTypeVente(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="tous">Tous</option>
                  <option value="détail">Détail</option>
                  <option value="gros">Gros</option>
                  <option value="mixte">Mixte</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Période</label>
                <select
                  value={filtreDate}
                  onChange={(e) => setFiltreDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="tous">Toutes</option>
                  <option value="aujourdhui">Aujourd'hui</option>
                  <option value="hier">Hier</option>
                  <option value="7jours">7 jours</option>
                  <option value="30jours">30 jours</option>
                  <option value="personnalisee">Personnalisée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Recherche</label>
                <input
                  type="text"
                  placeholder="N° commande, client..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {filtreDate === 'personnalisee' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={reinitialiserFiltres}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sélecteur de nombre d'éléments par page */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Afficher:</span>
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => changeItemsPerPage(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-xs text-gray-600">
            {pagination.totalItems > 0 ? `${startIndex}-${endIndex} sur ${pagination.totalItems}` : '0 élément'}
          </span>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {loading && progress.total === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Chargement des commandes...</p>
          </div>
        ) : commandesFiltrees.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faBox} className="text-xl text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Aucune commande trouvée</p>
            <button
              onClick={reinitialiserFiltres}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {commandesPaginees.map(commande => (
              <div key={commande.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-600 text-xs" />
                      <span className="text-sm font-semibold text-gray-900">{commande.numero_commande}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatutCouleur(commande.statut)}`}>
                        {getStatutIcone(commande.statut)}
                        <span className="text-xs">
                          {commande.statut === 'en_attente_paiement' ? 'Attente' : 
                           commande.statut === 'complétée' ? 'Validée' : 
                           commande.statut === 'annulée' ? 'Annulée' : commande.statut}
                        </span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeVenteCouleur(commande.type_vente)}`}>
                        {commande.type_vente === 'gros' ? 'Gros' : 
                         commande.type_vente === 'mixte' ? 'Mixte' : 'Détail'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                        {commande.client?.nom || 'Client'}
                      </span>
                      {commande.client?.telephone && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                          {commande.client.telephone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        {formaterDate(commande.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">
                        {commande.produits?.length || 0} produit(s)
                      </span>
                      {commande.tva_appliquee || commande.tva > 0 || commande.tva_taux > 0 ? (
                        <span className="text-green-600 text-xs flex items-center gap-1">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                          TVA 18%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <FontAwesomeIcon icon={faTimesCircle} className="text-xs" />
                          Sans TVA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">
                      {formaterMontant(commande.total_ttc || commande.montant_ttc || commande.total)} FCFA
                    </div>
                    <button
                      onClick={() => ouvrirDetails(commande)}
                      className="mt-1 inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {commandesFiltrees.length > 0 && (
          <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-600">
                Affichage de {startIndex} à {endIndex} sur {pagination.totalItems} commandes
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={firstPage}
                  disabled={pagination.currentPage === 1}
                  className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Première page"
                >
                  <FontAwesomeIcon icon={faAngleDoubleLeft} />
                </button>
                <button
                  onClick={prevPage}
                  disabled={pagination.currentPage === 1}
                  className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Page précédente"
                >
                  <FontAwesomeIcon icon={faAngleLeft} />
                </button>

                <div className="flex items-center gap-1 mx-2">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`dots-${index}`} className="px-2 py-1 text-xs text-gray-500">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[28px] h-7 px-2 text-xs rounded-md transition-colors ${
                          pagination.currentPage === page
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Page suivante"
                >
                  <FontAwesomeIcon icon={faAngleRight} />
                </button>
                <button
                  onClick={lastPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Dernière page"
                >
                  <FontAwesomeIcon icon={faAngleDoubleRight} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal des détails */}
      {modalOuvert && donneesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={fermerDetails}></div>
          
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="text-blue-600" />
                <h3 className="text-lg font-semibold">Détails de la commande</h3>
                <span className="text-sm text-gray-600">{donneesModal.numero_commande}</span>
              </div>
              <button onClick={fermerDetails} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {detailsLoading ? (
                <div className="py-8 text-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Chargement...</p>
                </div>
              ) : (
                <>
                  {/* Infos commande */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Informations</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Statut:</span>{' '}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatutCouleur(donneesModal.statut)}`}>
                          {getStatutIcone(donneesModal.statut)}
                          {donneesModal.statut}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>{' '}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeVenteCouleur(donneesModal.type_vente)}`}>
                          {donneesModal.type_vente}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>{' '}
                        <span>{formaterDate(donneesModal.date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Vendeur:</span>{' '}
                        <span>{donneesModal.vendeur}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Client</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Nom:</span> {donneesModal.client?.nom || 'Non spécifié'}</p>
                      {donneesModal.client?.telephone && (
                        <p><span className="text-gray-600">Tél:</span> {donneesModal.client.telephone}</p>
                      )}
                      {donneesModal.client?.adresse && (
                        <p><span className="text-gray-600">Adresse:</span> {donneesModal.client.adresse}</p>
                      )}
                    </div>
                  </div>

                  {/* Produits */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Produits ({donneesModal.produits?.length || 0})</h4>
                    {renderProduitsTable()}
                  </div>

                  {/* Totaux avec TVA */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total HT:</span>
                        <span className="font-medium">{formaterMontant(donneesModal.total_ht || donneesModal.montant_ht)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          TVA (18%):
                          {(donneesModal.tva_appliquee === false || donneesModal.tva === 0) && (
                            <span className="ml-1 text-xs text-gray-400">(non appliquée)</span>
                          )}
                        </span>
                        <span className="font-medium">{formaterMontant(donneesModal.tva)} FCFA</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold">
                        <span>Total TTC:</span>
                        <span className="text-blue-600">{formaterMontant(donneesModal.total_ttc || donneesModal.montant_ttc)} FCFA</span>
                      </div>
                      
                      {(donneesModal.tva_appliquee || donneesModal.tva > 0) ? (
                        <div className="mt-2 text-xs text-center p-2 bg-green-50 text-green-700 rounded border border-green-200">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          TVA appliquée (18%)
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-center p-2 bg-gray-50 text-gray-500 rounded border border-gray-200">
                          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                          TVA non appliquée
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button onClick={fermerDetails} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HistoriqueCommandes;
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
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1
  });

  const [commandesPaginees, setCommandesPaginees] = useState([]);
  
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [chargementComplet, setChargementComplet] = useState(false);

  const chargerToutesLesCommandes = useCallback(async (showNotification = false) => {
    setLoading(true);
    setError(null);
    setChargementComplet(false);
    
    try {
      chargerInfosVendeur();

      let toutesLesCommandes = [];
      let pageActuelle = 1;
      let aPlusDePages = true;
      let totalPages = 1;

      while (aPlusDePages) {
        
        setProgress({ 
          current: pageActuelle, 
          total: totalPages > 0 ? totalPages : '?' 
        });
        
        const response = await commandesAPI.getAll({
          page: pageActuelle,
          perPage: 100,
        });

        let commandesPage = [];
        let paginationInfo = null;
        
        if (response?.data && Array.isArray(response.data)) {
          commandesPage = response.data;
          paginationInfo = response;
        } else if (Array.isArray(response)) {
          commandesPage = response;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          commandesPage = response.data.data;
          paginationInfo = response.data;
        }

        if (paginationInfo) {
          totalPages = paginationInfo.last_page || paginationInfo.total_pages || 1;
        }

        const commandesTransformeesPage = commandesPage.map(commande => {
          const produits = extraireProduitsDeLaCommande(commande);
          const typeVente = determinerTypeVente(commande);
          const tvaAppliquee = estTVAAppliquee(commande);
          
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
            type_vente: typeVente,
            date: commande.date || commande.created_at || 
                  commande.date_commande || commande.updated_at || new Date().toISOString(),
            vendeur: nomVendeur,
            produits: produits
          };
        });

        toutesLesCommandes = [...toutesLesCommandes, ...commandesTransformeesPage];
        
        pageActuelle++;
        
        if (paginationInfo) {
          aPlusDePages = pageActuelle <= paginationInfo.last_page;
        } else if (commandesPage.length < 100) {
          aPlusDePages = false;
        } else {
          aPlusDePages = commandesPage.length === 100;
        }
        
        if (aPlusDePages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const commandesTriees = toutesLesCommandes.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      setCommandes(commandesTriees);
      setCommandesFiltrees(commandesTriees);
      
      setPagination(prev => ({
        ...prev,
        totalItems: commandesTriees.length,
        totalPages: Math.ceil(commandesTriees.length / prev.itemsPerPage),
        currentPage: 1
      }));
      
      chargerStatistiques(commandesTriees);
      
      try {
        localStorage.setItem('commandes_cache', JSON.stringify({
          data: commandesTriees,
          timestamp: Date.now(),
          count: commandesTriees.length
        }));
      } catch (e) {
      }
      
      setChargementComplet(true);
      
      if (showNotification) {
        setShowRefreshNotification(true);
        setTimeout(() => setShowRefreshNotification(false), 3000);
      }
      
    } catch (error) {
      setError(`Impossible de charger les commandes: ${error.message}`);
      
      try {
        const cached = localStorage.getItem('commandes_cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          setCommandes(data);
          setCommandesFiltrees(data);
          setPagination(prev => ({
            ...prev,
            totalItems: data.length,
            totalPages: Math.ceil(data.length / prev.itemsPerPage)
          }));
          chargerStatistiques(data);
          setError(null);
          setChargementComplet(true);
        }
      } catch (cacheError) {
      }
      
    } finally {
      setLoading(false);
      setLastUpdate(Date.now());
      setProgress({ current: 0, total: 0 });
    }
  }, [sellerName, vendeurInfo]);

  const estTVAAppliquee = (commande) => {
    if (!commande) return false;
    
    const tvaIndicators = [
      commande.tva_appliquee,
      commande.tva_appliquee === 1,
      commande.tva_appliquee === '1',
      commande.tva_appliquee === true,
      commande.tva_appliquee === 'true',
      commande.tva_active,
      commande.tva_active === 1,
      commande.tva_active === true,
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
      commande.tva_incluse === true
    ];

    if (tvaIndicators.some(indicator => indicator === true)) {
      return true;
    }

    const tvaTaux = Number(commande.tva_taux || commande.taux_tva || commande.tva_rate || 0);
    if (tvaTaux > 0) {
      return true;
    }

    const montantTVA = Number(
      commande.tva || 
      commande.montant_tva || 
      commande.tva_amount || 
      0
    );
    if (montantTVA > 0) {
      return true;
    }

    const montantTTC = Number(
      commande.total_ttc || 
      commande.montant_ttc || 
      commande.total || 
      0
    );
    
    const montantHT = Number(
      commande.total_ht || 
      commande.montant_ht || 
      commande.subtotal ||
      0
    );
    
    if (montantTTC > 0 && montantHT > 0 && montantTTC > montantHT) {
      return true;
    }

    return false;
  };

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
      'validée': 'complétée'
    };
    const statut = statutAPI?.toLowerCase()?.trim();
    return mapping[statut] || statutAPI || 'en_attente_paiement';
  };

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
          }
          
          return {
            id: item.id || item.product_id || item.produit_id,
            nom: nomProduit,
            quantite: Number(item.quantite || item.quantity || item.qte || item.qty || 1),
            prix_unitaire: Number(item.prix_unitaire || item.prix || item.price || 0),
            prix_vente: Number(item.prix_vente || item.prix_detail || item.prix_gros || item.sale_price || item.prix_unitaire || 0),
            type_vente: typeVenteProduit,
            sous_total: Number(item.sous_total || item.subtotal || item.total_item || 
                              (Number(item.quantite || 1) * Number(item.prix_vente || item.prix || 0)) || 0)
          };
        });
        break;
      }
    }
    
    return produits;
  };

  const chargerInfosVendeur = useCallback(async () => {
    try {
      const response = await profileAPI.getProfile();
      if (response && response.data) {
        setVendeurInfo(response.data);
      }
    } catch (error) {
    }
  }, []);

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
               statut === 'pending';
      }).length,
      valide: commandesAujourdhui.filter(c => {
        const statut = c.statut?.toLowerCase() || '';
        return statut === 'complétée' || 
               statut === 'completed' ||
               statut === 'payee' ||
               statut === 'paid';
      }).length,
      annulee: commandesAujourdhui.filter(c => {
        const statut = c.statut?.toLowerCase() || '';
        return statut === 'annulée' || 
               statut === 'cancelled';
      }).length,
      total_gros: totalGros,
      total_detail: totalDetail,
      total_ventes: commandesList.length,
      montant_total: montantTotal
    };
    
    setStats(statsCalc);
  }, []);

  const determinerTypeVente = (commande) => {
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
    }
    
    const produits = extraireProduitsDeLaCommande(commande);
    
    if (produits && produits.length > 0) {
      let aDuGros = false;
      let aDuDetail = false;
      
      produits.forEach(p => {
        if (p.type_vente) {
          const productType = p.type_vente.toString().toLowerCase();
          if (productType === 'gros' || productType === 'gross' || productType === 'wholesale') {
            aDuGros = true;
          } else if (productType === 'détail' || productType === 'detail' || productType === 'retail') {
            aDuDetail = true;
          }
        }
        
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
    
    return 'détail';
  };

  const chargerDetailsCommande = async (commande) => {
    if (!commande) return;
    
    setDetailsLoading(true);
    setCommandeSelectionnee(commande);
    setError(null);
    
    try {
      if (!commande.id || commande.id.toString().startsWith('mock-')) {
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
        
        let typeVente = commande.type_vente;
        if (!typeVente) {
          typeVente = determinerTypeVente(details);
        }
        
        const tvaAppliquee = estTVAAppliquee(details) || estTVAAppliquee(commande);
        
        const totalTTC = Number(
          details.total_ttc || 
          details.total || 
          details.montant_ttc || 
          commande.total_ttc || 
          0
        );
        
        const totalHT = Number(
          details.total_ht || 
          details.montant_ht || 
          (tvaAppliquee ? Math.round(totalTTC / 1.18) : totalTTC) ||
          commande.total_ht || 
          0
        );
        
        const tva = tvaAppliquee 
          ? Number(
              details.tva || 
              details.montant_tva ||
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
      setError(`Erreur: ${error.message}`);
      setCommandeDetails(commande);
    } finally {
      setModalOuvert(true);
      setDetailsLoading(false);
    }
  };

  const ouvrirDetails = async (commande) => {
    await chargerDetailsCommande(commande);
  };

  useEffect(() => {
    const handleCommandeCreee = (event) => {
      chargerToutesLesCommandes(true);
    };

    window.addEventListener('commande-creee', handleCommandeCreee);
    
    return () => {
      window.removeEventListener('commande-creee', handleCommandeCreee);
    };
  }, [chargerToutesLesCommandes]);

  useEffect(() => {
    chargerToutesLesCommandes();
  }, [chargerToutesLesCommandes]);

  useEffect(() => {
    if (commandes.length === 0) return;
    
    let commandesFiltreesTemp = [...commandes];
    
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
    
    setPagination(prev => ({
      ...prev,
      totalItems: commandesFiltreesTemp.length,
      totalPages: Math.ceil(commandesFiltreesTemp.length / prev.itemsPerPage),
      currentPage: 1
    }));
    
  }, [commandes, filtreStatut, filtreTypeVente, filtreDate, dateDebut, dateFin, recherche, sortField, sortDirection]);

  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const commandesPage = commandesFiltrees.slice(startIndex, endIndex);
    
    setCommandesPaginees(commandesPage);
  }, [commandesFiltrees, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    if (commandes.length > 0) {
      chargerStatistiques(commandes);
    }
  }, [commandes, chargerStatistiques]);

  const goToPage = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const reinitialiserFiltres = () => {
    setFiltreStatut('tous');
    setFiltreTypeVente('tous');
    setFiltreDate('aujourdhui');
    setDateDebut('');
    setDateFin('');
    setRecherche('');
  };

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

  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

  const getPageNumbers = () => {
    const delta = 2;
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
      {showRefreshNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-slide-in">
          <FontAwesomeIcon icon={faBell} className="animate-bounce" />
          <span>Commandes mises à jour !</span>
        </div>
      )}

      {loading && !chargementComplet && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-200 flex items-center gap-3 text-sm">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600" />
          <span>Chargement des commandes... Page {progress.current}/{progress.total}</span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '10%' }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-700 hover:text-red-900">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faHistory} className="text-blue-600" />
              Historique des Commandes
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {commandes.length} commandes au total • Dernière màj: {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
              {!loading && commandes.length > 0 && ` • ${pagination.totalPages} pages`}
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
              onClick={() => chargerToutesLesCommandes(true)}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faRedo} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </div>

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
            {(filtreStatut !== 'tous' || filtreTypeVente !== 'tous' || filtreDate !== 'aujourdhui' || recherche) && (
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

      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">
          Total: <span className="font-bold">{pagination.totalItems}</span> commandes
        </div>
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

      <div className="bg-white rounded-lg shadow border border-gray-200">
        {loading && !chargementComplet && progress.total === 0 ? (
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-1 flex-wrap">
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
                      {(commande.tva_appliquee || commande.tva > 0) ? (
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

        {commandesFiltrees.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-3 pb-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              Page {pagination.currentPage} / {pagination.totalPages} • {pagination.totalItems} commandes
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={prevPage}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  pagination.currentPage === 1
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#472ead] hover:bg-[#472ead]/5'
                }`}
              >
                Précédent
              </button>

              {getPageNumbers().map((item, index) => {
                if (item === '...') {
                  return (
                    <span 
                      key={`dots-${index}`} 
                      className="px-3 py-1.5 text-xs text-gray-500"
                    >
                      ...
                    </span>
                  );
                }

                const page = parseInt(item);
                const isActive = pagination.currentPage === page;

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'bg-[#472ead] border-[#472ead] text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#472ead] hover:bg-[#472ead]/5'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={nextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  pagination.currentPage === pagination.totalPages
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#472ead] hover:bg-[#472ead]/5'
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

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

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Produits ({donneesModal.produits?.length || 0})</h4>
                    {renderProduitsTable()}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total HT:</span>
                        <span className="font-medium">{formaterMontant(donneesModal.total_ht || donneesModal.montant_ht)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          TVA (18%):
                        </span>
                        <span className="font-medium">{formaterMontant(donneesModal.tva)} FCFA</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold">
                        <span>Total TTC:</span>
                        <span className="text-blue-600">{formaterMontant(donneesModal.total_ttc || donneesModal.montant_ttc)} FCFA</span>
                      </div>
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
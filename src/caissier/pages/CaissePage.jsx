import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printInvoice } from '../components/InvoicePrint';
import QRScanner from '../components/QRScanner';
import caissierApi from '../services/caissierApi';
import { toast } from 'sonner';
import { initializeEcho } from '../../utils/echo';

const CaissePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [isCancellingTicket, setIsCancellingTicket] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showArticleDetails, setShowArticleDetails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentData, setPaymentData] = useState({
    moyenPaiement: 'especes',
    autreMoyenPaiement: '',
    montantPaye: '',
    tauxTVA: 18,
  });

  // Fonction pour transformer une commande en ticket
  const transformCommandeToTicket = (commande, paiements = []) => {
    // Calculer le total HT et TVA (le total du backend inclut déjà la TVA)
    // On suppose une TVA de 18% par défaut
    const tauxTVA = 0.18;
    const totalTTC = commande.total || 0;
    const totalHT = totalTTC / (1 + tauxTVA);
    const tva = totalTTC - totalHT;

    // Calculer le reste dû à partir des paiements
    const totalPaye = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
    const resteDu = totalTTC - totalPaye;

    // Pour les clients spéciaux, récupérer le moyen de paiement depuis le premier paiement en attente
    // (créé par le responsable)
    const isClientSpecial = commande.client?.type_client === 'special' || false;
    let moyenPaiementDefini = null;
    if (isClientSpecial && paiements.length > 0) {
      // Le premier paiement en attente contient le moyen de paiement défini par le responsable
      const premierPaiement = paiements[0];
      moyenPaiementDefini = premierPaiement.type_paiement;
    }

    // Transformer les détails en lignes
    const lignes = (commande.details || []).map(detail => ({
      produit: detail.produit?.nom || 'Produit',
      quantite: detail.quantite || 0,
      prix: detail.prix_unitaire || 0,
      prix_unitaire: detail.prix_unitaire || 0,
    }));

    return {
      id: commande.id,
      commande_id: commande.id,
      numero: `CMD-${commande.id.substring(0, 8).toUpperCase()}`,
      date_ticket: commande.date || commande.created_at,
      vendeur_nom: commande.vendeur ? `${commande.vendeur.prenom || ''} ${commande.vendeur.nom || ''}`.trim() : 'N/A',
      total_ht: totalHT,
      tva: tva,
      total_ttc: totalTTC,
      moyen_paiement: moyenPaiementDefini, // Pour les clients spéciaux, récupéré depuis les paiements
      statut: resteDu > 0 ? (totalPaye > 0 ? 'partiellement_paye' : 'en_attente') : 'encaissé',
      client_special: isClientSpecial,
      client_nom: commande.client ? `${commande.client.prenom || ''} ${commande.client.nom || ''}`.trim() : null,
      lignes: lignes,
      montant_deja_paye: totalPaye,
      reste_du: resteDu,
      paiements: paiements,
    };
  };

  const [totalTickets, setTotalTickets] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;

  // Fonction pour charger les tickets (pagination côté serveur - charge uniquement la page courante)
  const fetchTickets = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await caissierApi.getCommandesAttente({ page, per_page: PAGE_SIZE, search: search || undefined });
      const commandes = response?.data || [];
      
      const ticketsTransformes = commandes.map(commande => {
        const paiements = commande.paiements || [];
        return transformCommandeToTicket(commande, paiements);
      });
      
      setTickets(ticketsTransformes);
      setPendingCount(response?.total ?? ticketsTransformes.length);
      setTotalAmount(response?.total_amount ?? ticketsTransformes.reduce((s, t) => s + (t.total_ttc || 0), 0));
      setTotalPages(Math.max(1, response?.last_page ?? 1));
    } catch (error) {
      // Erreur silencieuse - ne pas afficher de message localhost
      toast.error('Erreur', {
        description: 'Impossible de charger les tickets en attente'
      });
    } finally {
      setLoading(false);
    }
  };

  // Référence pour stocker les abonnements WebSocket
  const echoRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const fetchingRef = useRef(false);

  const fetchTicketsSafe = async (page = 1, search = '') => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      await fetchTickets(page, search);
    } finally {
      fetchingRef.current = false;
    }
  };

  const loadPage = (page) => {
    setCurrentPage(page);
    fetchTicketsSafe(page, filterText.trim());
  };

  // Fonction pour charger les statistiques du dashboard (pour le compteur de tickets traités)
  const fetchDashboardStats = async () => {
    try {
      const stats = await caissierApi.getDashboardStats();
      setProcessedCount(stats.ticketsTraites || 0);
    } catch (error) {
      // Erreur silencieuse - ne pas bloquer l'application
    }
  };

  useEffect(() => {
    fetchTicketsSafe(1, '');
    fetchDashboardStats(); // Charger les statistiques pour initialiser le compteur

    // Initialiser WebSocket de manière asynchrone pour ne pas bloquer le rendu
    // Utiliser setTimeout pour différer l'initialisation
    const timeoutId = setTimeout(() => {
      try {
        const echo = initializeEcho();
        if (echo) {
          echoRef.current = echo;
        }
      } catch (e) {
        // Ignorer les erreurs WebSocket - ne pas bloquer l'application
      }
    }, 2000); // Démarrer après 2 secondes pour ne pas ralentir le chargement initial

    return () => {
      clearTimeout(timeoutId);
      // Nettoyage WebSocket si nécessaire
      if (echoRef.current) {
        try {
          subscriptionsRef.current.forEach(sub => {
            if (sub.channel && echoRef.current) {
              echoRef.current.leave(sub.channel);
            }
          });
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
        subscriptionsRef.current = [];
      }
    };
  }, []); // Seulement au montage

  // Si on arrive depuis une notification (selectedTicketId), ouvrir directement le ticket
  const handledSelectedTicketRef = useRef(false);
  useEffect(() => {
    const selectedTicketId = location?.state?.selectedTicketId;
    if (!selectedTicketId) return;
    if (handledSelectedTicketRef.current) return;
    if (!tickets || tickets.length === 0) return;

    const ticket = tickets.find((t) => t.id === selectedTicketId || t.commande_id === selectedTicketId);
    if (!ticket) return;

    handledSelectedTicketRef.current = true;
    handleEncaisse(ticket);

    // Nettoyer l'état de navigation pour éviter de rouvrir au refresh
    navigate(location.pathname, { replace: true, state: {} });
  }, [location?.state?.selectedTicketId, tickets]);

  const handleEncaisse = (ticket) => {
    setSelectedTicket(ticket);
    
    // Pour les clients spéciaux, le moyen de paiement est déjà défini par le responsable
    // Il est dans ticket.moyen_paiement (récupéré depuis les paiements existants)
    const moyenPaiementParDefaut = ticket.client_special 
      ? (ticket.moyen_paiement || 'especes')
      : 'especes';
    
    // Pour les paiements partiels, utiliser le reste dû au lieu du total
    const montantParDefaut = ticket.reste_du || ticket.total_ttc;
    
    setPaymentData({
      moyenPaiement: moyenPaiementParDefaut,
      autreMoyenPaiement: moyenPaiementParDefaut === 'autre' ? (ticket.moyen_paiement || '') : '',
      montantPaye: montantParDefaut.toString(),
      tauxTVA: 18,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTicket || isProcessingPayment) return;

    const montant = parseFloat(paymentData.montantPaye);
    const resteDu = selectedTicket.reste_du || selectedTicket.total_ttc;
    
    // Validation
    if (montant <= 0) {
      toast.error('Erreur', { description: 'Le montant payé doit être supérieur à 0' });
      return;
    }

    if (montant > resteDu) {
      toast.error('Erreur', { 
        description: `Le montant payé (${formatCurrency(montant)}) ne peut pas être supérieur au reste dû (${formatCurrency(resteDu)})` 
      });
      return;
    }

    // Pour les clients spéciaux, le moyen de paiement est déjà défini par le responsable
    // On utilise celui du ticket (récupéré depuis les paiements existants créés par le responsable)
    const moyenPaiementFinal = selectedTicket.client_special
      ? (selectedTicket.moyen_paiement || selectedTicket.paiements?.[0]?.type_paiement || 'especes')
      : (paymentData.moyenPaiement === 'autre' 
          ? (paymentData.autreMoyenPaiement || 'Autre')
          : paymentData.moyenPaiement);

    // Validation : pour les clients spéciaux, le moyen de paiement doit être défini
    if (selectedTicket.client_special && !moyenPaiementFinal) {
      toast.error('Erreur', { 
        description: 'Le moyen de paiement n\'a pas été défini par le responsable. Veuillez contacter le responsable.' 
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const ticketEncaisse = {
        ...selectedTicket,
        moyen_paiement: moyenPaiementFinal,
        montant_paye: montant,
        statut: 'encaissé',
      };

      // Appel API pour créer le paiement
      await caissierApi.creerPaiement(selectedTicket.commande_id, {
        montant: montant,
        type_paiement: moyenPaiementFinal || 'especes'
      });

      toast.success('Encaissement réussi', {
        description: `Paiement de ${formatCurrency(montant)} enregistré`,
        action: {
          label: 'Imprimer',
          onClick: () => printInvoice(ticketEncaisse),
        }
      });

      // Fermer le modal immédiatement
      setIsPaymentModalOpen(false);
      setSelectedTicket(null);

      // Recharger les tickets pour que le ticket disparaisse immédiatement
      await fetchTicketsSafe(currentPage, filterText.trim());
      // Mettre à jour le compteur de tickets traités
      await fetchDashboardStats();
    } catch (error) {
      // Vérifier si le paiement a quand même été créé (code 200 ou 201)
      const statusCode = error.response?.status;
      if (statusCode === 200 || statusCode === 201) {
        const ticketEncaisse = {
          ...selectedTicket,
          moyen_paiement: moyenPaiementFinal,
          montant_paye: montant,
          statut: 'encaissé',
        };
        toast.success('Encaissement réussi', {
          description: `Paiement de ${formatCurrency(montant)} enregistré`,
          action: {
            label: 'Imprimer',
            onClick: () => printInvoice(ticketEncaisse),
          }
        });
        setIsPaymentModalOpen(false);
        setSelectedTicket(null);
        await fetchTicketsSafe(currentPage, filterText.trim());
        // Mettre à jour le compteur de tickets traités
        await fetchDashboardStats();
      } else {
        toast.error('Erreur', {
          description: String(error.response?.data?.message || 'Impossible d\'enregistrer le paiement')
            .replace(/https?:\/\/localhost:[0-9]+/gi, '')
            .trim()
        });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      const raw = (qrData ?? '').toString().trim();

      // Fonction pour extraire l'ID de commande depuis différents formats de QR code
      const extractCommandeId = (value) => {
        if (!value) return null;
        const s = value.toString().trim();

        // Format JSON: { "commande_id": "...", "id": "..." } ou similaire
        try {
          const obj = JSON.parse(s);
          const candidate = obj?.commande_id || obj?.commandeId || obj?.id;
          if (typeof candidate === 'string' && candidate.length > 0) return candidate;
        } catch (_e) {
          // Pas un JSON valide, continuer
        }

        // UUID dans une string (format standard: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const uuidMatch = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch?.[0]) return uuidMatch[0];

        // Format CMD-XXXXXXXX (numéro de ticket)
        const cmdMatch = s.match(/CMD-([0-9A-F]{8})/i);
        if (cmdMatch?.[1]) {
          // Chercher dans les tickets chargés pour trouver l'ID complet
          const ticket = tickets.find(t => t.numero?.toUpperCase() === s.toUpperCase());
          if (ticket?.commande_id) return ticket.commande_id;
        }

        // Essayer de trouver dans les tickets déjà chargés par numéro complet
        const ticketTrouve = tickets.find((t) => {
          const numero = t?.numero?.toString?.() || '';
          const id = t?.id?.toString?.() || '';
          const commandeId = t?.commande_id?.toString?.() || '';
          return (
            raw === numero ||
            raw === id ||
            raw === commandeId ||
            (numero && raw.includes(numero)) ||
            (id && raw.includes(id)) ||
            (commandeId && raw.includes(commandeId))
          );
        });
        if (ticketTrouve?.commande_id) return ticketTrouve.commande_id;

        return null;
      };

      // 1) Vérifier d'abord dans les tickets déjà chargés (pour éviter un appel API inutile)
      const ticketLocal = tickets.find((t) => {
        const numero = t?.numero?.toString?.() || '';
        const id = t?.id?.toString?.() || '';
        const commandeId = t?.commande_id?.toString?.() || '';
        return (
          raw === numero ||
          raw === id ||
          raw === commandeId ||
          (numero && raw.toUpperCase() === numero.toUpperCase()) ||
          (numero && raw.includes(numero.replace('CMD-', '')))
        );
      });

      if (ticketLocal) {
        handleEncaisse(ticketLocal);
        setIsQRScannerOpen(false);
        toast.success('Ticket trouvé', {
          description: `Ticket ${ticketLocal.numero} chargé avec succès`
        });
        return;
      }

      // 2) Extraire l'ID de commande depuis le QR code
      const commandeId = extractCommandeId(raw);
      if (!commandeId) {
        toast.error('QR code invalide', {
          description: 'Ce QR code ne correspond à aucune commande. Format attendu: UUID ou CMD-XXXXXXXX'
        });
        return;
      }

      // 3) Récupérer directement les détails complets de la commande via l'API
      // Cette approche est plus fiable que de chercher dans la liste paginée
      toast.loading('Chargement du ticket...', { id: 'qr-loading' });
      
      try {
        // Récupérer les détails complets de la commande (inclut détails produits, vendeur, client)
        const commandeDetails = await caissierApi.getCommandeDetails(commandeId);
        
        // Récupérer les paiements de la commande
        const paiements = await caissierApi.getPaiements(commandeId);
        
        // Transformer en ticket avec toutes les informations
        const ticketFromDetails = transformCommandeToTicket(
          commandeDetails, 
          Array.isArray(paiements) ? paiements : []
        );

        // Vérifier le statut de la commande
        if (ticketFromDetails?.statut === 'encaissé') {
          toast.dismiss('qr-loading');
          toast.error('Commande déjà encaissée', {
            description: `Le ticket ${ticketFromDetails.numero} a déjà été complètement encaissé.`
          });
          setIsQRScannerOpen(false);
          return;
        }

        // Vérifier si la commande est en attente (statut 'attente')
        if (commandeDetails?.statut !== 'attente') {
          toast.dismiss('qr-loading');
          toast.warning('Commande non disponible', {
            description: `Le ticket ${ticketFromDetails.numero} n'est pas en attente d'encaissement (statut: ${commandeDetails?.statut || 'inconnu'}).`
          });
          setIsQRScannerOpen(false);
          return;
        }

        // Tout est OK, ouvrir le modal d'encaissement avec toutes les informations
        toast.dismiss('qr-loading');
        
        // Mettre à jour le filtre pour afficher ce ticket dans la liste (optionnel mais utile)
        // Cela permet de voir le ticket dans la liste même s'il n'était pas sur la page courante
        const numeroTicket = ticketFromDetails.numero || `CMD-${commandeId.substring(0, 8).toUpperCase()}`;
        if (!filterText.includes(numeroTicket) && !filterText.includes(commandeId.substring(0, 8))) {
          // Optionnel : mettre à jour le filtre pour rechercher ce ticket
          // setFilterText(numeroTicket); // Décommenter si vous voulez filtrer automatiquement
        }
        
        toast.success('Ticket chargé', {
          description: `Ticket ${numeroTicket} chargé avec succès`
        });
        
        handleEncaisse(ticketFromDetails);
        setIsQRScannerOpen(false);
        
      } catch (error) {
        toast.dismiss('qr-loading');
        
        // Vérifier si c'est une erreur 404 (commande non trouvée)
        if (error.response?.status === 404) {
          toast.error('Commande introuvable', {
            description: 'Cette commande n\'existe pas ou n\'est plus disponible.'
          });
        } else {
          toast.error('Erreur', {
            description: 'Erreur lors du chargement du ticket. Veuillez réessayer.'
          });
        }
      }
    } catch (error) {
      // Erreur générale lors du traitement
      toast.error('Erreur', {
        description: 'Erreur lors du traitement du QR code. Veuillez réessayer.'
      });
    }
  };

  // Tickets = données de la page courante (serveur). Recherche gérée côté serveur
  const displayedTickets = tickets;

  // Recherche avec debounce (300ms) - ne pas déclencher au montage (le premier useEffect le fait)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTicketsSafe(1, filterText.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [filterText]);

  const moyensPaiement = [
    { value: 'especes', label: 'Espèces' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'wave', label: 'Wave' },
    { value: 'om', label: 'Orange Money' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'autre', label: 'Autre' },
  ];

  const moyensPaiementLabels = {
    especes: 'Espèces',
    carte: 'Carte bancaire',
    wave: 'Wave',
    om: 'Orange Money',
    cheque: 'Chèque',
    autre: 'Autre',
  };

  return (
    <div className="space-y-14 relative z-10">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">
            Caisse
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des encaissements
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsQRScannerOpen(true)}
          className="bg-[#472EAD] hover:bg-[#3d2888] text-white shadow-md hover:shadow-lg transition-all font-semibold px-6 py-3"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scanner QR Code
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-white border-l-4 border-l-[#F58020] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tickets en attente</p>
              <p className="text-3xl font-bold text-[#F58020] mt-2">
                {pendingCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F58020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="bg-white border-l-4 border-l-[#472EAD] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total en attente</p>
              <p className="text-2xl font-bold text-[#472EAD] mt-2">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F7F5FF] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#472EAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tickets traités</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {processedCount ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Tickets en attente */}
      <div className="pt-4">
      <Card className="bg-white">
        <CardHeader
          title="Tickets en attente d'encaissement"
          subtitle={`${displayedTickets.length} ticket(s) sur cette page / ${pendingCount} total`}
        />
        {/* Filtre de recherche */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Rechercher par N° ticket, vendeur, client ou ID..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full"
          />
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#472EAD] mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des tickets...</p>
          </div>
        ) : pendingCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ticket en attente</p>
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ticket ne correspond à votre recherche</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border-l-4 border-l-[#472EAD] border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-[#E4E0FF] transition-all bg-white"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-[#472EAD]">
                        {ticket.numero}
                      </h3>
                      {ticket.client_special && (
                        <Badge variant="accent" className="text-xs">Client spécial</Badge>
                      )}
                      {ticket.statut === 'partiellement_paye' ? (
                        <Badge variant="info" className="text-xs">Partiellement payé</Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">En attente</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-gray-500">Vendeur:</span>
                        <p className="font-medium text-gray-700 truncate">{ticket.vendeur_nom}</p>
                      </div>
                      {ticket.client_nom && (
                        <div className="min-w-0">
                          <span className="text-gray-500">Client:</span>
                          <p className="font-medium text-gray-700 truncate">{ticket.client_nom}</p>
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-gray-500">Heure:</span>
                        <p className="font-medium text-gray-700">
                          {formatDateTime(ticket.date_ticket).split(' ')[1]?.substring(0, 5)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500">
                          {ticket.reste_du && ticket.reste_du < ticket.total_ttc ? 'Reste dû:' : 'Total TTC:'}
                        </span>
                        <p className="font-bold text-[#472EAD]">
                          {formatCurrency(ticket.reste_du && ticket.reste_du < ticket.total_ttc ? ticket.reste_du : ticket.total_ttc)}
                        </p>
                        {ticket.reste_du && ticket.reste_du < ticket.total_ttc && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            (Total: {formatCurrency(ticket.total_ttc)}, Payé: {formatCurrency(ticket.montant_deja_paye || 0)})
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500">Produits:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowArticleDetails(prev => ({ ...prev, [ticket.id]: !prev[ticket.id] }))}
                            className="flex items-center gap-1 text-[#472EAD] hover:text-[#3d2888] font-medium"
                          >
                            <span>{ticket.lignes?.length || 0} article(s)</span>
                            {showArticleDetails[ticket.id] ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {showArticleDetails[ticket.id] && ticket.lignes && ticket.lignes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="space-y-2">
                          {ticket.lignes.map((ligne, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{ligne.produit}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                  <span>Qté: {ligne.quantite}</span>
                                  <span>Prix unitaire: {formatCurrency(ligne.prix_unitaire || ligne.prix)}</span>
                                  <span className="font-semibold">Total: {formatCurrency((ligne.prix_unitaire || ligne.prix) * ligne.quantite)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                  title="Pilement"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                  title="Dépilement"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>THT: {formatCurrency(ticket.total_ht)}</span>
                        <span>•</span>
                        <span>TVA: {formatCurrency(ticket.tva)}</span>
                        <span>•</span>
                        <span className="font-semibold text-gray-700">TTC: {formatCurrency(ticket.total_ttc)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      onClick={() => handleEncaisse(ticket)}
                      className="bg-[#472EAD] hover:bg-[#3d2888] text-white shadow-md hover:shadow-lg transition-all text-sm px-4 py-2 font-semibold"
                      size="sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Encaisser
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setTicketToCancel(ticket);
                        setIsCancelModalOpen(true);
                      }}
                      className="shadow-md hover:shadow-lg transition-shadow text-sm px-3 py-1.5 border border-gray-300 hover:bg-gray-50"
                      size="sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Annuler
                    </Button>
                    {ticket.statut === 'encaissé' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printInvoice(ticket)}
                        className="border-2 border-[#472EAD] text-[#472EAD] hover:bg-[#F7F5FF] font-semibold text-xs px-3 py-1.5"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Pagination en bas de page (15 par page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 py-3 px-4 mt-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Affichage{' '}
                  <span className="font-medium text-gray-900">
                    {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, pendingCount)}
                  </span>
                  {' '}sur{' '}
                  <span className="font-medium text-gray-900">{pendingCount}</span>
                  {' '}ticket(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50"
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      </div>

      {/* Modal d'encaissement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedTicket(null);
        }}
        title="Encaisser le ticket"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setSelectedTicket(null);
              }}
              className="border border-gray-300 font-semibold hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePaymentSubmit}
              disabled={isProcessingPayment}
              className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-md hover:shadow-lg w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                selectedTicket?.client_special ? 'Confirmer l\'encaissement' : 'Valider l\'encaissement'
              )}
            </Button>
          </>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  Détails du ticket {selectedTicket.numero}
                </h4>
                {selectedTicket.client_special && (
                  <Badge variant="accent" className="text-xs">Client spécial - Envoyé par le responsable</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Vendeur:</span>
                  <p className="font-medium">{selectedTicket.vendeur_nom}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <p className="font-medium">{formatDateTime(selectedTicket.date_ticket)}</p>
                </div>
                {selectedTicket.client_nom && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Client:</span>
                    <p className="font-medium">{selectedTicket.client_nom}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-medium">{formatCurrency(selectedTicket.total_ht)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">TVA (18%):</span>
                  <span className="font-medium">{formatCurrency(selectedTicket.tva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Total TTC:</span>
                  <span className="text-[#472EAD]">
                    {formatCurrency(selectedTicket.total_ttc)}
                  </span>
                </div>
              </div>
            </div>

            {/* Détails des articles */}
            {selectedTicket.lignes && selectedTicket.lignes.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Détails des articles
                </h4>
                <div className="space-y-2">
                  {selectedTicket.lignes.map((ligne, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-white rounded border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{ligne.produit}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs text-gray-600">
                          <span>Qté: {ligne.quantite}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Prix unitaire: {formatCurrency(ligne.prix_unitaire || ligne.prix)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-semibold">Total: {formatCurrency((ligne.prix_unitaire || ligne.prix) * ligne.quantite)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-4">
                        <button
                          type="button"
                          className="p-1.5 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Pilement"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Dépilement"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTicket.client_special ? (
              // Pour les clients spéciaux, le moyen de paiement est déjà défini par le responsable
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Moyen de paiement (défini par le responsable)
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {moyensPaiementLabels[selectedTicket.moyen_paiement] || selectedTicket.moyen_paiement || 'Non défini'}
                </p>
                {!selectedTicket.moyen_paiement && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Le moyen de paiement n'a pas été défini par le responsable. Veuillez contacter le responsable avant de procéder à l'encaissement.
                    </p>
                  </div>
                )}
                <p className="text-xs text-blue-700 mt-2">
                  Ce moyen de paiement a été défini par le responsable. Vous devez seulement confirmer l'encaissement.
                </p>
              </div>
            ) : (
              // Pour les clients normaux, le caissier choisit le moyen de paiement
              <>
                <Select
                  label="Moyen de paiement"
                  options={moyensPaiement}
                  value={paymentData.moyenPaiement}
                  onChange={(e) => setPaymentData({ 
                    ...paymentData, 
                    moyenPaiement: e.target.value,
                    autreMoyenPaiement: e.target.value !== 'autre' ? '' : paymentData.autreMoyenPaiement
                  })}
                />

                {paymentData.moyenPaiement === 'autre' && (
                  <Input
                    label="Précisez le moyen de paiement"
                    type="text"
                    value={paymentData.autreMoyenPaiement}
                    onChange={(e) => setPaymentData({ ...paymentData, autreMoyenPaiement: e.target.value })}
                    placeholder="Ex: Virement bancaire, Mobile Money, etc."
                    required
                  />
                )}
              </>
            )}

            <div className="space-y-2">
              <Input
                label="Montant payé (FCFA)"
                type="number"
                value={paymentData.montantPaye}
                onChange={(e) => setPaymentData({ ...paymentData, montantPaye: e.target.value })}
                helperText={
                  selectedTicket.reste_du && selectedTicket.reste_du < selectedTicket.total_ttc
                    ? `Reste dû: ${formatCurrency(selectedTicket.reste_du)} (Total: ${formatCurrency(selectedTicket.total_ttc)}, Déjà payé: ${formatCurrency(selectedTicket.montant_deja_paye || 0)})`
                    : `Total à payer: ${formatCurrency(selectedTicket.total_ttc)}`
                }
                required
                className="w-full"
              />
            </div>

            {selectedTicket.reste_du && selectedTicket.reste_du < selectedTicket.total_ttc && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-semibold">
                  Paiement partiel : {formatCurrency(selectedTicket.montant_deja_paye || 0)} déjà payé sur {formatCurrency(selectedTicket.total_ttc)}
                </p>
              </div>
            )}

            {parseFloat(paymentData.montantPaye || 0) > (selectedTicket.reste_du || selectedTicket.total_ttc) && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold">
                  Monnaie à rendre: {formatCurrency(parseFloat(paymentData.montantPaye || 0) - (selectedTicket.reste_du || selectedTicket.total_ttc))}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Scanner QR Code */}
      <Modal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        title="Scanner QR Code du ticket"
        size="md"
      >
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setIsQRScannerOpen(false)}
        />
      </Modal>

      {/* Modal de confirmation d'annulation */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (isCancellingTicket) return;
          setIsCancelModalOpen(false);
          setTicketToCancel(null);
        }}
        title="Confirmer l'annulation"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (isCancellingTicket) return;
                setIsCancelModalOpen(false);
                setTicketToCancel(null);
              }}
              disabled={isCancellingTicket}
              className="border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Non, garder le ticket
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!ticketToCancel || isCancellingTicket) return;
                
                try {
                  setIsCancellingTicket(true);
                  // Appel API pour annuler la commande
                  await caissierApi.annulerCommande(ticketToCancel.commande_id);
                  
                  toast.success('Ticket annulé', {
                    description: `Le ticket ${ticketToCancel.numero} a été annulé`
                  });

                  // Recharger les tickets
                  await fetchTicketsSafe(currentPage, filterText.trim());
                  // Mettre à jour le compteur de tickets traités (au cas où le ticket annulé était encaissé)
                  await fetchDashboardStats();
                  
                  setIsCancelModalOpen(false);
                  setTicketToCancel(null);
                } catch (error) {
                  // Erreur lors de l'annulation - silencieux
                  toast.error('Erreur', {
                    description: 'Impossible d\'annuler le ticket'
                  });
                } finally {
                  setIsCancellingTicket(false);
                }
              }}
              disabled={isCancellingTicket}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancellingTicket ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Annulation...
                </>
              ) : (
                'Oui, annuler le ticket'
              )}
            </Button>
          </>
        }
      >
        {ticketToCancel && (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">
                    Attention : Annulation du ticket
                  </h4>
                  <p className="text-sm text-red-800">
                    Vous êtes sur le point d'annuler le ticket <strong>{ticketToCancel.numero}</strong>.
                    Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3">Détails du ticket</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro:</span>
                  <span className="font-medium">{ticketToCancel.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendeur:</span>
                  <span className="font-medium">{ticketToCancel.vendeur_nom}</span>
                </div>
                {ticketToCancel.client_nom && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{ticketToCancel.client_nom}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Total TTC:</span>
                  <span className="font-bold text-[#472EAD]">{formatCurrency(ticketToCancel.total_ttc)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Êtes-vous sûr de vouloir annuler ce ticket ?
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default CaissePage;


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
import caissierApi, { invalidateCommandesAttenteClientCache } from '../services/caissierApi';
import { toast } from 'sonner';
import { echo } from '../../utils/echo';

const CaissePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const boutiqueId = localStorage.getItem('boutique_id');
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
  /** Après encaissement réussi : modal Imprimer / Annuler (remplace le toast avec action) */
  const [isFactureModalOpen, setIsFactureModalOpen] = useState(false);
  const [ticketFacture, setTicketFacture] = useState(null);
  const [isCaisseCloturee, setIsCaisseCloturee] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showArticleDetails, setShowArticleDetails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentData, setPaymentData] = useState({
    moyenPaiement: 'especes',
    autreMoyenPaiement: '',
    montantPaye: '',
    montantDonneEspeces: '', // Montant donné par le client (espèces) → pour calculer la monnaie à rendre
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
    const totalPaye = paiements[0]?.somme_payees || 0;
    const resteDu = paiements[0]?.reste_du || 0;

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
      numero: commande.numero,
      date_ticket: commande.date || commande.created_at,
      vendeur_nom: commande.vendeur ? `${commande.vendeur.prenom || ''} ${commande.vendeur.nom || ''}`.trim() : 'N/A',
      total_ht: totalHT,
      tva: tva || 0,
      tva_applicable: commande.tva_appliquee || false,
      total_ttc: commande.total || 0,
      moyen_paiement: moyenPaiementDefini, // Pour les clients spéciaux, récupéré depuis les paiements
      statut: resteDu > 0 ? (totalPaye > 0 ? 'partiellement_payee' : 'attente') : 'encaissé',
      client_special: isClientSpecial,
      client_nom: commande.client ? `${commande.client.prenom || ''} ${commande.client.nom || ''}`.trim() : null,
      lignes: lignes,
      montant_deja_paye: paiements[0]?.somme_payees,
      reste_du: paiements[0]?.reste_du || 0,
      paiements: paiements,
      montant_a_encaisser: commande.montant_a_encaisser || totalTTC, // Par défaut, le montant à payer est le total TTC, mais pour les paiements partiels, c'est le reste dû
      premiere_tranche:commande.premiere_tranche || null,
    };
  };

  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

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
    } catch {
      // Erreur silencieuse - ne pas afficher de message localhost
      toast.error('Erreur', {
        description: 'Impossible de charger les tickets en attente'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchingRef = useRef(false);
  const currentPageRef = useRef(currentPage);
  const filterTextRef = useRef(filterText);
  currentPageRef.current = currentPage;
  filterTextRef.current = filterText;

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
    } catch  {
      // Erreur silencieuse - ne pas bloquer l'application
    }
  };

  useEffect(() => {
    fetchTicketsSafe(1, '');
    fetchDashboardStats();
  }, []);

  // Verrou : si la caisse du jour est clôturée, bloquer les actions d'encaissement/annulation
  useEffect(() => {
    let cancelled = false;
    const today = caissierApi.getDateLocal();

    // Flag local (posé après clôture) → effet immédiat
    try {
      if (localStorage.getItem(`lpd_caisse_cloturee_${today}`) === '1') {
        setIsCaisseCloturee(true);
      }
    } catch (_e) {
      // ignore
    }

    (async () => {
      try {
        const journal = await caissierApi.getCaissierCaisseJournal(today);
        if (cancelled) return;
        setIsCaisseCloturee(Boolean(journal?.cloture));
      } catch {
        // éviter faux positifs
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);   

  // Écouter les nouvelles commandes validées (temps réel)
  useEffect(() => {
    if (!echo) return;
    if (!boutiqueId) return;
    const channel = echo.private(`boutique.${boutiqueId}`);
    const listener = () => {
      invalidateCommandesAttenteClientCache();
      fetchTicketsSafe(currentPageRef.current, filterTextRef.current);
      fetchDashboardStats();
    };
    channel.listen('.commande.validee', listener);
    return () => {
      try {
        channel.stopListening('.commande.validee');
        echo.leave(`private-boutique.${boutiqueId}`);
      } catch {
        
      }
    };
  }, [boutiqueId]);

  // Écouter les paiements créés (temps réel)
  useEffect(() => {
      if (!echo) return;
      if (!boutiqueId)  return;
      const channel = echo.private(`boutique.${boutiqueId}`);
      const listener = () => {
          invalidateCommandesAttenteClientCache();
          fetchTicketsSafe(currentPage, filterText.trim());
          fetchDashboardStats();
      };
      channel.listen(".paiement.cree", listener);
      return () => {
          channel.stopListening(".paiement.cree");
          echo.leave(`boutique.${boutiqueId}`);
      };
  }, [boutiqueId, currentPage, filterText]);

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
    if (isCaisseCloturee) {
      toast.error('Caisse clôturée', {
        description: "La caisse est clôturée pour aujourd'hui. Encaissement impossible."
      });
      return;
    }
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
      montantDonneEspeces: '',
      tauxTVA: 18,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTicket || isProcessingPayment) return;
    if (isCaisseCloturee) {
      toast.error('Caisse clôturée', {
        description: "La caisse est clôturée pour aujourd'hui. Encaissement impossible."
      });
      return;
    }

    /**
     * Montant réellement encaissé sur cette opération (aligné sur l’API).
     * - Paiement complet : souvent = TTC ou reste dû final.
     * - Paiement partiel / tranche : = montant_a_encaisser (pas le TTC ni tout le reste dû global si différent).
     */
    const montantEncaisseOperation = (() => {
      const ma = Number(selectedTicket.montant_a_encaisser);
      if (Number.isFinite(ma) && ma > 0) return ma;
      const r = Number(selectedTicket.reste_du);
      if (Number.isFinite(r) && r > 0) return r;
      return Number(selectedTicket.total_ttc || 0);
    })();

    // En espèces : le montant donné doit être au moins égal au montant à payer
    if (paymentData.moyenPaiement === 'especes') {
      const donne = parseFloat(paymentData.montantDonneEspeces) || 0;
      if (donne < selectedTicket.montant_a_encaisser) {
        toast.error('Erreur', {
          description: `Le montant donné (${formatCurrency(donne)}) est inférieur au montant à payer (${formatCurrency(selectedTicket.montant_a_encaisser)}). Le client doit donner au moins ${formatCurrency(selectedTicket.montant_a_encaisser)}.`,
        });
        return;
      }
    }

    // Le caissier choisit le moyen de paiement pour toutes les commandes (y compris clients spéciaux)
    const moyenPaiementFinal = paymentData.moyenPaiement === 'autre'
      ? (paymentData.autreMoyenPaiement || 'Autre')
      : paymentData.moyenPaiement;

    setIsProcessingPayment(true);
    try {
      const montantDu = Number(
        selectedTicket.montant_a_encaisser ?? selectedTicket.reste_du ?? selectedTicket.total_ttc ?? 0
      );
      const donneEspeces = parseFloat(paymentData.montantDonneEspeces) || 0;
      const ticketEncaisse = {
        ...selectedTicket,
        moyen_paiement: moyenPaiementFinal,
        montant_paye: montantEncaisseOperation,
        statut: 'encaissé',
        ...(moyenPaiementFinal === 'especes'
          ? {
              monnaie_recue: donneEspeces,
              monnaie_rendue: Math.max(0, donneEspeces - montantDu),
            }
          : {}),
      };

      // Appel API pour créer le paiement
      
      await caissierApi.creerPaiement(selectedTicket.commande_id, {
        type_paiement: moyenPaiementFinal || 'especes',
        montant: selectedTicket.montant_a_encaisser || 0,
      });

      setIsPaymentModalOpen(false);
      setSelectedTicket(null);
      setTicketFacture(ticketEncaisse);
      setIsFactureModalOpen(true);

      // Recharger les tickets pour que le ticket disparaisse immédiatement
      invalidateCommandesAttenteClientCache();
      await fetchTicketsSafe(currentPage, filterText.trim());
      // Mettre à jour le compteur de tickets traités
      await fetchDashboardStats();
    } catch (error) {
      // Vérifier si le paiement a quand même été créé (code 200 ou 201)
      const statusCode = error.response?.status;
      if (statusCode === 200 || statusCode === 201) {
        const montantDu = Number(
          selectedTicket.montant_a_encaisser ?? selectedTicket.reste_du ?? selectedTicket.total_ttc ?? 0
        );
        const donneEspeces = parseFloat(paymentData.montantDonneEspeces) || 0;
        const ticketEncaisse = {
          ...selectedTicket,
          moyen_paiement: moyenPaiementFinal,
          montant_paye: montantEncaisseOperation,
          statut: 'encaissé',
          ...(moyenPaiementFinal === 'especes'
            ? {
                monnaie_recue: donneEspeces,
                monnaie_rendue: Math.max(0, donneEspeces - montantDu),
              }
            : {}),
        };
        setIsPaymentModalOpen(false);
        setSelectedTicket(null);
        setTicketFacture(ticketEncaisse);
        setIsFactureModalOpen(true);
        invalidateCommandesAttenteClientCache();
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
      if (isCaisseCloturee) {
        toast.error('Caisse clôturée', {
          description: "La caisse est clôturée pour aujourd'hui. Encaissement impossible."
        });
        return;
      }
      const raw = (qrData ?? '').toString().trim();

      const extractCommandeId = (value) => {
        if (!value) return null;
        const s = value.toString().trim();

        // JSON: { commande_id } ou { id }
        try {
          const obj = JSON.parse(s);
          const candidate = obj?.commande_id || obj?.commandeId || obj?.id;
          if (typeof candidate === 'string' && candidate.length > 0) return candidate;
        } catch {
          // Pas un JSON valide, continuer
        }

        // UUID dans une string (URL, texte, etc.)
        const m = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (m?.[0]) return m[0];

        return null;
      };

      // 1) Essayer de matcher sur les tickets déjà chargés
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

      if (ticketTrouve) {
        handleEncaisse(ticketTrouve);
        setIsQRScannerOpen(false);
        return;
      }

      // 2) Sinon, récupérer la commande via l'API (le vendeur génère un QR code de commande)
      const commandeId = extractCommandeId(raw);
      if (!commandeId) {
        toast.error('QR code invalide', {
          description: 'Ce QR code ne correspond à aucune commande.'
        });
        return;
      }

      // Essayer de récupérer la commande en attente (avec détails + paiements inclus)
      const res = await caissierApi.getCommandesAttente();
      const commandes = res?.data || [];
      const commande = (Array.isArray(commandes) ? commandes : []).find((c) => c.id === commandeId);

      if (commande) {
        const ticketFromApi = transformCommandeToTicket(commande, commande.paiements || []);
        handleEncaisse(ticketFromApi);
        setIsQRScannerOpen(false);
        return;
      }

      // Fallback: details + paiements
      const commandeDetails = await caissierApi.getCommandeDetails(commandeId);
      const paiements = await caissierApi.getPaiements(commandeId);
      const ticketFromDetails = transformCommandeToTicket(commandeDetails, Array.isArray(paiements) ? paiements : []);

      if (ticketFromDetails?.statut === 'encaissé') {
        toast.error('Commande déjà encaissée', {
          description: 'Cette commande a déjà été encaissée.'
        });
        return;
      }

      handleEncaisse(ticketFromDetails);
      setIsQRScannerOpen(false);
    } catch (error) {
      // Erreur lors du scan QR - silencieux
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
      {isCaisseCloturee && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Caisse clôturée</p>
          <p className="text-sm opacity-90">
            La caisse est clôturée pour aujourd&apos;hui. Les actions d&apos;encaissement et d&apos;annulation sont désactivées.
          </p>
        </div>
      )}
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
          disabled={isCaisseCloturee}
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
        ) : pendingCount === 0 && filterText.trim().length < 2 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ticket en attente</p>
          </div>
        ) : pendingCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ticket ne correspond à votre recherche</p>
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
                      {ticket.statut === 'partiellement_payee' ? (
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

                    {
                      ticket.tva_applicable ? (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>THT: {formatCurrency(ticket.total_ht)}</span>
                            <span>•</span>
                            <span>TVA: {formatCurrency(ticket.tva)}</span>
                            <span>•</span>
                            <span className="font-semibold text-gray-700">
                              TTC: {formatCurrency(ticket.total_ttc)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-700">
                          TTC: {formatCurrency(ticket.total_ttc)}
                        </span>
                      )
                    }
                
                  </div>
                  <div className="flex flex-row gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      onClick={() => handleEncaisse(ticket)}
                      disabled={isCaisseCloturee}
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
                      disabled={isCaisseCloturee}
                      className="shadow-md hover:shadow-lg transition-shadow text-sm px-3 py-1.5 border border-gray-300 hover:bg-gray-50"
                      size="sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Annuler
                    </Button>
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
                {selectedTicket.tva_applicable &&(
                  <span>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Total HT:</span>
                      <span className="font-medium">{formatCurrency(selectedTicket.total_ht)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">TVA (18%):</span>
                      <span className="font-medium">{formatCurrency(selectedTicket.tva)}</span>
                    </div>
                  </span>
                 )}
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

            {/* Moyen de paiement : le caissier choisit pour toutes les commandes (y compris clients spéciaux) */}
            {selectedTicket.client_special && selectedTicket.moyen_paiement && (
              <p className="text-xs text-blue-700 mb-1">
                Suggestion responsable : {moyensPaiementLabels[selectedTicket.moyen_paiement] || selectedTicket.moyen_paiement}
              </p>
            )}
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

            {paymentData.moyenPaiement === 'especes' && (
              <div className="space-y-2">
                <Input
                  label="Montant donné par le client (FCFA)"
                  type="number"
                  min="0"
                  step="1"
                  value={paymentData.montantDonneEspeces}
                  onChange={(e) => setPaymentData((prev) => ({ ...prev, montantDonneEspeces: e.target.value }))}
                  placeholder="Ex: 15000"
                  className="w-full"
                />
                {(() => {
                  const resteDu = selectedTicket.montant_a_encaisser || 0;
                  
                  const donne = parseFloat(paymentData.montantDonneEspeces) || 0;
                  const monnaieARendre = Math.max(0, donne - resteDu);
                  const insuffisant = donne > 0 && donne < resteDu;
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-600">À payer:</span>
                        <span className="font-semibold">{formatCurrency(resteDu)}</span>
                        {donne > 0 && (
                          <>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm font-semibold text-green-700">
                              Monnaie à rendre: {formatCurrency(monnaieARendre)}
                            </span>
                          </>
                        )}
                      </div>
                      {insuffisant && (
                        <p className="text-sm text-red-600 font-medium">
                          Le montant donné est insuffisant. Il manque {formatCurrency(resteDu - donne)}.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Montant envoyé (à la caisse) = non modifiable */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Montant envoyé (FCFA)
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={formatCurrency(selectedTicket.montant_a_encaisser ?? 0)}
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-gray-700 font-semibold tabular-nums cursor-not-allowed"
                aria-label="Montant envoyé (non modifiable)"
              />
              <p className="text-xs text-gray-500">Montant envoyé à la caisse par le dépôt / responsable (non modifiable).</p>
              {(selectedTicket.reste_du > 0 && selectedTicket.reste_du < selectedTicket.total_ttc) && (
                <p className="text-xs text-gray-600">
                  Reste dû: {formatCurrency(selectedTicket.reste_du)} (Total: {formatCurrency(selectedTicket.total_ttc)}, Déjà payé: {formatCurrency(selectedTicket.montant_deja_paye || 0)})
                </p>
              )}
            </div>

            {selectedTicket.reste_du > 0 && selectedTicket.reste_du < selectedTicket.total_ttc && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-semibold">
                  Paiement partiel : {formatCurrency(selectedTicket.montant_deja_paye || 0)} déjà payé sur {formatCurrency(selectedTicket.total_ttc)}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Après encaissement : choix d’impression (remplace le toast vert avec bouton Imprimer) */}
      <Modal
        isOpen={isFactureModalOpen}
        onClose={() => {
          setIsFactureModalOpen(false);
          setTicketFacture(null);
        }}
        title="Facture"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsFactureModalOpen(false);
                setTicketFacture(null);
              }}
              className="border border-gray-300 font-semibold hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (ticketFacture) printInvoice(ticketFacture);
                setIsFactureModalOpen(false);
                setTicketFacture(null);
              }}
              className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-md hover:shadow-lg"
            >
              Imprimer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            Encaissement enregistré avec succès. Voulez-vous imprimer la facture&nbsp;?
          </p>
          {ticketFacture && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-800">Ticket :</span> {ticketFacture.numero}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-800">Montant :</span>{' '}
                {formatCurrency(ticketFacture.montant_paye ?? ticketFacture.total_ttc)}
              </p>
            </div>
          )}
        </div>
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
                  invalidateCommandesAttenteClientCache();
                  await fetchTicketsSafe(currentPage, filterText.trim());
                  // Mettre à jour le compteur de tickets traités (au cas où le ticket annulé était encaissé)
                  await fetchDashboardStats();
                  
                  setIsCancelModalOpen(false);
                  setTicketToCancel(null);
                } catch {
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
                  <span className="font-bold text-[#472EAD]">{formatCurrency(ticketToCancel.montant_a_encaisser)}</span>
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


import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime, calculateTVA } from '../../utils/formatters';
import { printInvoice } from '../components/InvoicePrint';
import QRScanner from '../components/QRScanner';

const CaissePage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showArticleDetails, setShowArticleDetails] = useState({});
  const [paymentData, setPaymentData] = useState({
    moyenPaiement: 'especes',
    autreMoyenPaiement: '',
    montantPaye: '',
    tauxTVA: 18,
  });

  // Simuler des tickets en temps réel (à remplacer par une vraie connexion WebSocket/API)
  useEffect(() => {
    // Simuler le polling ou WebSocket pour les tickets en temps réel
    const fetchTickets = async () => {
      setLoading(true);
      // TODO: Remplacer par un vrai appel API
      // const response = await api.get('/tickets/pending');
      
      // Données simulées
      setTimeout(() => {
        setTickets([
          {
            id: 1,
            commande_id: 101,
            numero: 'TKT-2024-001',
            date_ticket: new Date().toISOString(),
            vendeur_nom: 'Amadou Diop',
            total_ht: 50000,
            tva: 9000,
            total_ttc: 59000,
            moyen_paiement: null,
            statut: 'en_attente',
            client_special: false,
            lignes: [
              { produit: 'Produit A', quantite: 2, prix: 25000 },
            ],
          },
          {
            id: 2,
            commande_id: 102,
            numero: 'TKT-2024-002',
            date_ticket: new Date().toISOString(),
            vendeur_nom: 'Fatou Sarr',
            total_ht: 75000,
            tva: 13500,
            total_ttc: 88500,
            moyen_paiement: null,
            statut: 'en_attente',
            client_special: true,
            client_nom: 'Client VIP',
            lignes: [
              { produit: 'Produit B', quantite: 3, prix: 25000 },
            ],
          },
        ]);
        setLoading(false);
      }, 500);
    };

    fetchTickets();
    // Polling toutes les 5 secondes
    const interval = setInterval(fetchTickets, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleEncaisse = (ticket) => {
    setSelectedTicket(ticket);
    // Pour les clients spéciaux, le moyen de paiement est déjà défini par le responsable
    // Le montant est toujours le total TTC (pas de paiement par tranche)
    const moyenPaiementParDefaut = ticket.client_special 
      ? (ticket.moyen_paiement || 'especes')
      : 'especes';
    
    setPaymentData({
      moyenPaiement: moyenPaiementParDefaut,
      autreMoyenPaiement: moyenPaiementParDefaut === 'autre' ? (ticket.moyen_paiement || '') : '',
      montantPaye: ticket.total_ttc.toString(),
      tauxTVA: 18,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTicket) return;

    const montant = parseFloat(paymentData.montantPaye);
    
    // Validation pour tous les clients
    if (montant < selectedTicket.total_ttc) {
      alert('Le montant payé ne peut pas être inférieur au total TTC');
      return;
    }

    if (montant <= 0) {
      alert('Le montant payé doit être supérieur à 0');
      return;
    }

    // Pour les clients spéciaux, le moyen de paiement est déjà défini par le responsable
    // On utilise celui du ticket, pas celui du formulaire
    const moyenPaiementFinal = selectedTicket.client_special
      ? selectedTicket.moyen_paiement
      : (paymentData.moyenPaiement === 'autre' 
          ? (paymentData.autreMoyenPaiement || 'Autre')
          : paymentData.moyenPaiement);

    // Mettre à jour la liste des tickets
    setTickets(prevTickets => 
      prevTickets.map(t => 
        t.id === selectedTicket.id 
          ? {
              ...t,
              statut: 'encaissé',
              moyen_paiement: moyenPaiementFinal,
            }
          : t
      ).filter(t => t.statut === 'en_attente' || t.statut === 'partiellement_paye')
    );

    setIsPaymentModalOpen(false);
    
    // Formater le ticket pour l'impression
    const ticketEncaisse = {
      ...selectedTicket,
      moyen_paiement: moyenPaiementFinal,
      montant_paye: montant,
      statut: 'encaissé',
    };
    
    // Proposer l'impression de la facture
    if (window.confirm('Encaissement confirmé avec succès. Voulez-vous imprimer la facture ?')) {
      printInvoice(ticketEncaisse);
    }
    
    setSelectedTicket(null);
  };

  const handlePrintInvoice = (ticket) => {
    // TODO: Implémenter l'impression de la facture
    window.print();
  };

  const handleQRScan = async (qrData) => {
    try {
      console.log('QR Code scanné:', qrData);
      const ticketTrouve = tickets.find(t => 
        t.numero === qrData || 
        t.id === qrData || 
        t.commande_id === qrData ||
        qrData.includes(t.numero) ||
        qrData.includes(t.id)
      );

      if (ticketTrouve) {
        handleEncaisse(ticketTrouve);
        setIsQRScannerOpen(false);
      } else {
        alert(`Ticket non trouvé pour le QR code: ${qrData}\n\nVérifiez que le ticket existe dans la liste.`);
      }
    } catch (error) {
      console.error('Erreur lors du scan QR:', error);
      alert('Erreur lors du traitement du QR code. Veuillez réessayer.');
    }
  };

  // Inclure les tickets en attente ET partiellement payés (pour permettre les paiements par tranche)
  const pendingTickets = tickets.filter(t => t.statut === 'en_attente' || t.statut === 'partiellement_paye');
  const processedTickets = tickets.filter(t => t.statut === 'encaissé');

  // Filtrer les tickets selon le texte de recherche
  const filteredPendingTickets = pendingTickets.filter(ticket => {
    if (!filterText.trim()) return true;
    const searchText = filterText.toLowerCase();
    return (
      ticket.numero.toLowerCase().includes(searchText) ||
      (ticket.client_nom && ticket.client_nom.toLowerCase().includes(searchText)) ||
      String(ticket.id).toLowerCase().includes(searchText) ||
      String(ticket.commande_id).toLowerCase().includes(searchText)
    );
  });

  const moyensPaiement = [
    { value: 'especes', label: 'Espèces' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'wave', label: 'Wave' },
    { value: 'om', label: 'Orange Money' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'autre', label: 'Autre' },
  ];

  return (
    <div className="space-y-6 relative z-10">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-[#F58020] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tickets en attente</p>
              <p className="text-3xl font-bold text-[#F58020] mt-2">
                {pendingTickets.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F58020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-[#472EAD] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total en attente</p>
              <p className="text-2xl font-bold text-[#472EAD] mt-2">
                {formatCurrency(pendingTickets.reduce((sum, t) => sum + t.total_ttc, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F7F5FF] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#472EAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tickets traités</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {processedTickets.length}
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
      <Card>
        <CardHeader
          title="Tickets en attente d'encaissement"
          subtitle={`${filteredPendingTickets.length} ticket(s) trouvé(s) sur ${pendingTickets.length} total`}
        />
        {/* Filtre de recherche */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Rechercher par numéro de ticket, ID ou nom de client..."
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
        ) : pendingTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ticket en attente</p>
          </div>
        ) : filteredPendingTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun ticket ne correspond à votre recherche</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPendingTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border-l-4 border-l-[#472EAD] border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-[#E4E0FF] transition-all bg-white"
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
                      <Badge variant="warning" className="text-xs">En attente</Badge>
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
                          {ticket.client_special && ticket.montant_deja_paye > 0 ? 'Reste dû:' : 'Total TTC:'}
                        </span>
                        <p className="font-bold text-[#472EAD]">
                          {formatCurrency(ticket.client_special && ticket.reste_du ? ticket.reste_du : ticket.total_ttc)}
                        </p>
                        {ticket.client_special && ticket.montant_deja_paye > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            (Total: {formatCurrency(ticket.total_ttc)}, Payé: {formatCurrency(ticket.montant_deja_paye)})
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
                        if (window.confirm(`Voulez-vous vraiment annuler le ticket ${ticket.numero} ?`)) {
                          setTickets(prevTickets => prevTickets.filter(t => t.id !== ticket.id));
                        }
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
          </div>
        )}
      </Card>

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
              className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-md hover:shadow-lg w-full py-3"
            >
              {selectedTicket?.client_special ? 'Confirmer l\'encaissement' : 'Valider l\'encaissement'}
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
                  {selectedTicket.moyen_paiement || 'Non défini'}
                </p>
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
                helperText={`Total à payer: ${formatCurrency(selectedTicket.total_ttc)}`}
                required
                className="w-full"
              />
            </div>

            {parseFloat(paymentData.montantPaye || 0) > selectedTicket.total_ttc && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold">
                  Monnaie à rendre: {formatCurrency(parseFloat(paymentData.montantPaye || 0) - selectedTicket.total_ttc)}
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

    </div>
  );
};

export default CaissePage;


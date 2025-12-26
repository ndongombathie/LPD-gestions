import React, { useState } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printInvoice } from '../components/InvoicePrint';
import QRScanner from '../components/QRScanner';

const CaissePage = () => {
  // Données fictives
  const [tickets, setTickets] = useState([
    {
      id: 'ticket-1',
      commande_id: 'commande-1',
      numero: 'TKT-2025-000001',
      date_ticket: new Date().toISOString(),
      vendeur_nom: 'Amadou Diallo',
      client_nom: 'Client A',
      client_special: false,
      statut: 'en_attente',
      total_ht: 100000,
      tva: 18000,
      total_ttc: 118000,
      montant_deja_paye: 0,
      reste_du: 118000,
      lignes: [
        { produit: 'Produit A', quantite: 2, prix_unitaire: 50000 },
      ],
    },
    {
      id: 'ticket-2',
      commande_id: 'commande-2',
      numero: 'TKT-2025-000002',
      date_ticket: new Date(Date.now() - 1800000).toISOString(),
      vendeur_nom: 'Fatou Ba',
      client_nom: 'Client B',
      client_special: true,
      statut: 'en_attente',
      total_ht: 85000,
      tva: 15300,
      total_ttc: 100300,
      montant_deja_paye: 0,
      reste_du: 100300,
      lignes: [
        { produit: 'Produit B', quantite: 1, prix_unitaire: 85000 },
      ],
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [paymentData, setPaymentData] = useState({
    moyenPaiement: 'especes',
    autreMoyenPaiement: '',
    montantPaye: '',
    tauxTVA: 18,
  });

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
      // Le QR code devrait contenir l'ID ou le numéro du ticket
      // Format attendu: "TKT-2025-000001" ou "ticket-1" ou un ID
      console.log('QR Code scanné:', qrData);
      
      // Chercher le ticket dans la liste
      const ticketTrouve = tickets.find(t => 
        t.numero === qrData || 
        t.id === qrData || 
        t.commande_id === qrData ||
        qrData.includes(t.numero) ||
        qrData.includes(t.id)
      );

      if (ticketTrouve) {
        // Si le ticket est trouvé, ouvrir directement le modal d'encaissement
        handleEncaisse(ticketTrouve);
        setIsQRScannerOpen(false);
      } else {
        // Si le ticket n'est pas trouvé, essayer de le récupérer via l'API
        // TODO: Appel API pour récupérer le ticket par QR code
        // const response = await api.get(`/tickets/qr/${qrData}`);
        // if (response.data) {
        //   handleEncaisse(response.data);
        //   setIsQRScannerOpen(false);
        // } else {
        alert(`Ticket non trouvé pour le QR code: ${qrData}\n\nVérifiez que le ticket existe dans la liste.`);
        // }
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
      ticket.id.toLowerCase().includes(searchText)
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-white">
            Caisse
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestion des encaissements
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsQRScannerOpen(true)}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scanner QR Code
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-accent-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tickets en attente</p>
              <p className="text-3xl font-bold text-accent-500 dark:text-accent-400 mt-2">
                {pendingTickets.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-primary-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total en attente</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                {formatCurrency(pendingTickets.reduce((sum, t) => sum + t.total_ttc, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tickets traités</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {processedTickets.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        {pendingTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun ticket en attente</p>
          </div>
        ) : filteredPendingTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun ticket ne correspond à votre recherche</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPendingTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border-l-4 border-l-primary-600 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-lg hover:border-primary-300 transition-all bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {ticket.numero}
                      </h3>
                      {ticket.client_special && (
                        <Badge variant="accent" className="text-xs">Client spécial</Badge>
                      )}
                      {ticket.statut === 'partiellement_paye' ? (
                        <Badge variant="warning" className="text-xs">Paiement partiel</Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">En attente</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400">Vendeur:</span>
                        <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{ticket.vendeur_nom}</p>
                      </div>
                      {ticket.client_nom && (
                        <div className="min-w-0">
                          <span className="text-gray-500 dark:text-gray-400">Client:</span>
                          <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{ticket.client_nom}</p>
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400">Heure:</span>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {formatDateTime(ticket.date_ticket).split(' ')[1]?.substring(0, 5)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400">
                          {ticket.client_special && ticket.montant_deja_paye > 0 ? 'Reste dû:' : 'Total TTC:'}
                        </span>
                        <p className="font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(ticket.client_special && ticket.reste_du ? ticket.reste_du : ticket.total_ttc)}
                        </p>
                        {ticket.client_special && ticket.montant_deja_paye > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            (Total: {formatCurrency(ticket.total_ttc)}, Payé: {formatCurrency(ticket.montant_deja_paye)})
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400">Produits:</span>
                        <p className="font-medium text-gray-600 dark:text-gray-400 truncate">
                          {ticket.lignes?.length || 0} article(s)
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>THT: {formatCurrency(ticket.total_ht)}</span>
                        <span>•</span>
                        <span>TVA: {formatCurrency(ticket.tva)}</span>
                        <span>•</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">TTC: {formatCurrency(ticket.total_ttc)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      onClick={() => handleEncaisse(ticket)}
                      className="shadow-md hover:shadow-lg transition-shadow text-sm px-3 py-1.5"
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
                      className="shadow-md hover:shadow-lg transition-shadow text-sm px-3 py-1.5"
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
                        className="text-xs px-3 py-1.5"
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
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setSelectedTicket(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={handlePaymentSubmit}>
              {selectedTicket?.client_special ? 'Confirmer l\'encaissement' : 'Valider l\'encaissement'}
            </Button>
          </>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Détails du ticket {selectedTicket.numero}
                </h4>
                {selectedTicket.client_special && (
                  <Badge variant="accent" className="text-xs">Client spécial - Envoyé par le responsable</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Vendeur:</span>
                  <p className="font-medium">{selectedTicket.vendeur_nom}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <p className="font-medium">{formatDateTime(selectedTicket.date_ticket)}</p>
                </div>
                {selectedTicket.client_nom && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Client:</span>
                    <p className="font-medium">{selectedTicket.client_nom}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Total HT:</span>
                  <span className="font-medium">{formatCurrency(selectedTicket.total_ht)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">TVA (18%):</span>
                  <span className="font-medium">{formatCurrency(selectedTicket.tva)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span>Total TTC:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {formatCurrency(selectedTicket.total_ttc)}
                  </span>
                </div>
              </div>
            </div>

            {/* Détails des articles */}
            {selectedTicket.lignes && selectedTicket.lignes.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Détails des articles
                </h4>
                <div className="space-y-2">
                  {selectedTicket.lignes.map((ligne, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{ligne.produit}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>Qté: {ligne.quantite}</span>
                          <span>Prix unitaire: {formatCurrency(ligne.prix_unitaire)}</span>
                          <span className="font-semibold">Total: {formatCurrency(ligne.quantite * ligne.prix_unitaire)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          title="Pilement"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-md bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Moyen de paiement (défini par le responsable)
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {selectedTicket.moyen_paiement || 'Non défini'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
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

            <Input
              label="Montant payé (FCFA)"
              type="number"
              value={paymentData.montantPaye}
              onChange={(e) => setPaymentData({ ...paymentData, montantPaye: e.target.value })}
              helperText={`Total à payer: ${formatCurrency(selectedTicket.total_ttc)}`}
              required
            />

            {parseFloat(paymentData.montantPaye || 0) > selectedTicket.total_ttc && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
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


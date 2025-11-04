import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime, calculateTVA } from '../../utils/formatters';
import { printInvoice } from '../components/InvoicePrint';

const CaissePage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    moyenPaiement: 'especes',
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
    setPaymentData({
      moyenPaiement: 'especes',
      montantPaye: ticket.total_ttc.toString(),
      tauxTVA: 18,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTicket) return;

    const montant = parseFloat(paymentData.montantPaye);
    if (montant < selectedTicket.total_ttc) {
      alert('Le montant payé ne peut pas être inférieur au total TTC');
      return;
    }

    try {
      // TODO: Appel API pour enregistrer le paiement
      // await api.post('/tickets/encaisser', {
      //   ticket_id: selectedTicket.id,
      //   moyen_paiement: paymentData.moyenPaiement,
      //   montant_paye: montant,
      // });

      // Mettre à jour le ticket localement
      setTickets(tickets.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, statut: 'encaissé', moyen_paiement: paymentData.moyenPaiement }
          : t
      ));

      setIsPaymentModalOpen(false);
      const ticketEncaisse = { ...selectedTicket, moyen_paiement: paymentData.moyenPaiement, montant_paye: montant };
      
      // Proposer l'impression de la facture
      if (window.confirm('Paiement enregistré avec succès. Voulez-vous imprimer la facture ?')) {
        printInvoice(ticketEncaisse);
      }
      
      setSelectedTicket(null);
    } catch (error) {
      alert('Erreur lors de l\'encaissement: ' + error.message);
    }
  };

  const handlePrintInvoice = (ticket) => {
    // TODO: Implémenter l'impression de la facture
    window.print();
  };

  const pendingTickets = tickets.filter(t => t.statut === 'en_attente');
  const processedTickets = tickets.filter(t => t.statut === 'encaissé');

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
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-white">
          Caisse
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestion des encaissements
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tickets en attente</p>
            <p className="text-3xl font-bold text-accent-500 dark:text-accent-400 mt-2">
              {pendingTickets.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total en attente</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {formatCurrency(pendingTickets.reduce((sum, t) => sum + t.total_ttc, 0))}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tickets traités</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {processedTickets.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Tickets en attente */}
      <Card>
        <CardHeader
          title="Tickets en attente d'encaissement"
          subtitle={`${pendingTickets.length} ticket(s) à traiter`}
        />
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des tickets...</p>
          </div>
        ) : pendingTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun ticket en attente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTickets.map((ticket) => (
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
                      <Badge variant="warning" className="text-xs">En attente</Badge>
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
                        <span className="text-gray-500 dark:text-gray-400">Total TTC:</span>
                        <p className="font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(ticket.total_ttc)}
                        </p>
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
                  <div className="flex flex-col gap-2 flex-shrink-0">
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
              Valider l'encaissement
            </Button>
          </>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Détails du ticket {selectedTicket.numero}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Vendeur:</span>
                  <p className="font-medium">{selectedTicket.vendeur_nom}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <p className="font-medium">{formatDateTime(selectedTicket.date_ticket)}</p>
                </div>
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

            <Select
              label="Moyen de paiement"
              options={moyensPaiement}
              value={paymentData.moyenPaiement}
              onChange={(e) => setPaymentData({ ...paymentData, moyenPaiement: e.target.value })}
            />

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

    </div>
  );
};

export default CaissePage;


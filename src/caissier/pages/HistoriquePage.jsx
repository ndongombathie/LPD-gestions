import React, { useState } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printInvoice } from '../components/InvoicePrint';

const HistoriquePage = () => {
  // Données fictives
  const historiqueFictif = [
    {
      id: 'encaissement_1',
      type: 'encaissement',
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ticket: {
        id: 'ticket-1',
        numero: 'TKT-2025-000001',
        date_ticket: new Date(Date.now() - 3600000).toISOString(),
        vendeur_nom: 'Amadou Diallo',
        total_ht: 100000,
        tva: 18000,
        total_ttc: 118000,
        moyen_paiement: 'especes',
        lignes: [
          { produit: 'Produit A', quantite: 2, prix: 50000 },
        ],
      },
      montant: 118000,
    },
    {
      id: 'decaissement_1',
      type: 'decaissement',
      date: new Date(Date.now() - 7200000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
      montant: 15000,
      motif: 'Achat de matériel de bureau',
      cree_par: 'Ibrahima Sall',
      fait_par: 'Amadou Diallo',
    },
    {
      id: 'encaissement_2',
      type: 'encaissement',
      date: new Date(Date.now() - 10800000).toISOString(),
      created_at: new Date(Date.now() - 10800000).toISOString(),
      ticket: {
        id: 'ticket-2',
        numero: 'TKT-2025-000002',
        date_ticket: new Date(Date.now() - 10800000).toISOString(),
        vendeur_nom: 'Fatou Ba',
        total_ht: 85000,
        tva: 15300,
        total_ttc: 100300,
        moyen_paiement: 'carte',
        lignes: [
          { produit: 'Produit B', quantite: 1, prix: 85000 },
        ],
      },
      montant: 100300,
    },
  ];

  const [filters, setFilters] = useState({
    type: 'tous',
    dateDebut: '',
    dateFin: '',
    recherche: '',
  });

  // Filtrage côté client
  const filteredHistorique = historiqueFictif.filter((item) => {
    // Filtre par type
    if (filters.type !== 'tous' && item.type !== filters.type) {
      return false;
    }
    
    // Filtre par date
    if (filters.dateDebut) {
      const itemDate = new Date(item.date);
      const dateDebut = new Date(filters.dateDebut);
      if (itemDate < dateDebut) return false;
    }
    if (filters.dateFin) {
      const itemDate = new Date(item.date);
      const dateFin = new Date(filters.dateFin);
      dateFin.setHours(23, 59, 59, 999);
      if (itemDate > dateFin) return false;
    }
    
    // Filtre par recherche
    if (filters.recherche) {
      const searchLower = filters.recherche.toLowerCase();
      if (item.type === 'encaissement' && item.ticket) {
        if (!item.ticket.numero?.toLowerCase().includes(searchLower) &&
            !item.ticket.vendeur_nom?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (item.type === 'decaissement' && item.motif) {
        if (!item.motif.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
    }
    return true;
  });

  const moyensPaiementLabels = {
    especes: 'Espèces',
    carte: 'Carte bancaire',
    wave: 'Wave',
    om: 'Orange Money',
    cheque: 'Chèque',
    autre: 'Autre',
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primarytext-white">
            Historique des opérations
          </h1>
          <p className="text-gray-600text-gray-400 mt-1">
            Consultez l'historique de tous vos encaissements et décaissements
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader title="Filtres de recherche" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Type d'opération"
            options={[
              { value: 'tous', label: 'Tous' },
              { value: 'encaissement', label: 'Encaissements' },
              { value: 'decaissement', label: 'Décaissements' },
            ]}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          />
          <Input
            label="Date début"
            type="date"
            value={filters.dateDebut}
            onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
          />
          <Input
            label="Date fin"
            type="date"
            value={filters.dateFin}
            onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
          />
          <Input
            label="Recherche"
            placeholder="N° ticket, vendeur, motif..."
            value={filters.recherche}
            onChange={(e) => setFilters({ ...filters, recherche: e.target.value })}
          />
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600text-gray-400">Total encaissements</p>
              <p className="text-2xl font-bold text-green-600text-green-400 mt-1">
                {formatCurrency(
                  filteredHistorique
                    .filter(item => item.type === 'encaissement')
                    .reduce((sum, item) => sum + (item.ticket?.total_ttc || 0), 0)
                )}
              </p>
              <p className="text-xs text-gray-500text-gray-400 mt-1">
                {filteredHistorique.filter(item => item.type === 'encaissement').length} opération(s)
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600text-gray-400">Total décaissements</p>
              <p className="text-2xl font-bold text-red-600text-red-400 mt-1">
                {formatCurrency(
                  filteredHistorique
                    .filter(item => item.type === 'decaissement')
                    .reduce((sum, item) => sum + (item.montant || 0), 0)
                )}
              </p>
              <p className="text-xs text-gray-500text-gray-400 mt-1">
                {filteredHistorique.filter(item => item.type === 'decaissement').length} opération(s)
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-[#472EAD]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600text-gray-400">Solde net</p>
              <p className="text-2xl font-bold text-[#472EAD]text-primary-400 mt-1">
                {formatCurrency(
                  filteredHistorique
                    .filter(item => item.type === 'encaissement')
                    .reduce((sum, item) => sum + (item.ticket?.total_ttc || 0), 0) -
                  filteredHistorique
                    .filter(item => item.type === 'decaissement')
                    .reduce((sum, item) => sum + (item.montant || 0), 0)
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F7F5FF]bg-primary-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#472EAD]text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste de l'historique */}
      <Card>
        <CardHeader
          title="Historique des opérations"
          subtitle={`${filteredHistorique.length} opération(s) trouvée(s)`}
        />
        {filteredHistorique.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500text-gray-400">Aucune opération trouvée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistorique.map((item) => (
              <div
                key={item.id}
                className={`border-l-4 rounded-lg p-3 hover:shadow-md transition-all ${
                  item.type === 'encaissement'
                    ? 'border-l-green-500 bg-gradient-to-r from-green-50 to-whitefrom-green-900/20to-gray-800'
                    : 'border-l-red-500 bg-gradient-to-r from-red-50 to-whitefrom-red-900/20to-gray-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={item.type === 'encaissement' ? 'success' : 'danger'}
                        className="text-xs"
                      >
                        {item.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}
                      </Badge>
                      <span className="text-xs text-gray-500text-gray-400">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>

                    {item.type === 'encaissement' && item.ticket ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-gray-500text-gray-400">Ticket:</span>
                          <p className="font-semibold text-gray-900text-white truncate">
                            {item.ticket.numero}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500text-gray-400">Vendeur:</span>
                          <p className="font-medium text-gray-700text-gray-300 truncate">
                            {item.ticket.vendeur_nom}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500text-gray-400">Paiement:</span>
                          <p className="font-medium text-gray-700text-gray-300 truncate">
                            {moyensPaiementLabels[item.ticket.moyen_paiement] || item.ticket.moyen_paiement}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500text-gray-400">TTC:</span>
                          <p className="font-bold text-green-600text-green-400">
                            {formatCurrency(item.ticket.total_ttc)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500text-gray-400">THT/TVA:</span>
                          <p className="font-medium text-gray-600text-gray-400 text-xs">
                            {formatCurrency(item.ticket.total_ht)} / {formatCurrency(item.ticket.tva)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500text-gray-400">Montant:</span>
                          <p className="font-bold text-red-600text-red-400">
                            {formatCurrency(item.montant)}
                          </p>
                        </div>
                        <div className="md:col-span-2 min-w-0">
                          <span className="text-gray-500text-gray-400">Motif:</span>
                          <p className="font-medium text-gray-700text-gray-300 truncate">
                            {item.motif}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.type === 'encaissement' && item.ticket && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(item.ticket)}
                      className="flex-shrink-0 border-2 border-[#472EAD] text-[#472EAD] hover:bg-[#F7F5FF] font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoriquePage;

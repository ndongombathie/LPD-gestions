import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printInvoice } from '../components/InvoicePrint';
import caissierApi from '../services/caissierApi';
import { toast } from 'sonner';

const HistoriquePage = () => {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: 'tous',
    dateDebut: '',
    dateFin: '',
    recherche: '',
  });

  const parseMontant = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const n = parseFloat(value.replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  const toValidDate = (value) => {
    if (!value) return null;
    try {
      const s =
        typeof value === 'string' && value.includes(' ') && !value.includes('T')
          ? value.replace(' ', 'T')
          : value;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch (_e) {
      return null;
    }
  };

  // Charger l'historique depuis l'API (éviter les appels multiples)
  useEffect(() => {
    let cancelled = false;
    const fetchHistorique = async () => {
      try {
        setLoading(true);
        const data = await caissierApi.getHistoriqueComplet(filters);
        if (!cancelled) {
          setHistorique(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('Erreur', {
            description: 'Impossible de charger l\'historique'
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistorique();
    return () => { cancelled = true; };
  }, [filters.type, filters.dateDebut, filters.dateFin]); // Ne pas inclure filters.recherche (filtrage côté client)

  // Filtrage côté client (pour la recherche textuelle)
  const filteredHistorique = historique.filter((item) => {
    // Filtre par type
    if (filters.type !== 'tous' && item.type !== filters.type) {
      return false;
    }
    
    // Filtre par date
    if (filters.dateDebut) {
      const itemDate = toValidDate(item.date || item.created_at);
      const dateDebut = toValidDate(filters.dateDebut);
      if (!itemDate || !dateDebut) return false;
      if (itemDate < dateDebut) return false;
    }
    if (filters.dateFin) {
      const itemDate = toValidDate(item.date || item.created_at);
      const dateFin = toValidDate(filters.dateFin);
      if (!itemDate || !dateFin) return false;
      dateFin.setHours(23, 59, 59, 999);
      if (itemDate > dateFin) return false;
    }
    
    // Filtre par recherche
    if (filters.recherche) {
      const searchLower = filters.recherche.toLowerCase();
      if (item.type === 'encaissement' && item.commande) {
        const commandeNum = `CMD-${item.commande.id?.substring(0, 8).toUpperCase()}`;
        const vendeurNom = item.commande.vendeur 
          ? `${item.commande.vendeur.prenom || ''} ${item.commande.vendeur.nom || ''}`.trim()
          : '';
        if (!commandeNum.toLowerCase().includes(searchLower) &&
            !vendeurNom.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (item.type === 'decaissement' && item.decaissement) {
        const motif = item.decaissement.motif || item.decaissement.libelle || '';
        if (!motif.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
    }
    return true;
  });

  // Pagination (côté client)
  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filteredHistorique.length / PAGE_SIZE));
  const paginatedHistorique = filteredHistorique.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.type, filters.dateDebut, filters.dateFin, filters.recherche, historique.length]);

  const moyensPaiementLabels = {
    especes: 'Espèces',
    carte: 'Carte bancaire',
    wave: 'Wave',
    om: 'Orange Money',
    cheque: 'Chèque',
    autre: 'Autre',
  };

  return (
    <div className="space-y-14">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">
            Historique des opérations
          </h1>
          <p className="text-gray-600 mt-1">
            Consultez l'historique de tous vos encaissements et décaissements
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card className="bg-white">
        <CardHeader title="Filtres de recherche" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Type d'opération"
            options={[
              { value: 'tous', label: 'Tous' },
              { value: 'encaissement', label: 'Encaissements' },
              { value: 'decaissement', label: 'Décaissements' },
              { value: 'annulation', label: 'Annulations' },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
        <Card className="border-l-4 border-l-green-500 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total encaissements</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(
                  filteredHistorique
                    .filter(item => item.type === 'encaissement')
                    .reduce((sum, item) => sum + (item.paiement?.montant || item.commande?.total || 0), 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredHistorique.filter(item => item.type === 'encaissement').length} opération(s)
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total décaissements</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(
                  filteredHistorique
                    .filter(item => item.type === 'decaissement')
                    .reduce((sum, item) => sum + parseMontant(item.decaissement?.montant), 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredHistorique.filter(item => item.type === 'decaissement').length} opération(s)
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-[#472EAD] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solde net</p>
              <p className="text-2xl font-bold text-[#472EAD] mt-1">
                {formatCurrency(
                  filteredHistorique
                    .filter(item => item.type === 'encaissement')
                    .reduce((sum, item) => sum + (item.paiement?.montant || item.commande?.total || 0), 0) -
                  filteredHistorique
                    .filter(item => item.type === 'decaissement')
                    .reduce((sum, item) => sum + parseMontant(item.decaissement?.montant), 0)
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F7F5FF] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#472EAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste de l'historique */}
      <div className="pt-4">
      <Card className="bg-white">
        <CardHeader
          title="Historique des opérations"
          subtitle={`${filteredHistorique.length} opération(s) trouvée(s)`}
        />
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#472EAD] mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de l'historique...</p>
          </div>
        ) : filteredHistorique.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune opération trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedHistorique.map((item) => (
              <div
                key={item.id}
                className={`border-l-4 rounded-lg p-4 hover:shadow-md transition-all bg-white ${
                  item.type === 'encaissement'
                    ? 'border-l-green-500 bg-gradient-to-r from-green-50 to-white'
                    : 'border-l-red-500 bg-gradient-to-r from-red-50 to-white'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          item.type === 'encaissement' ? 'success' : 
                          item.type === 'annulation' ? 'warning' : 
                          'danger'
                        }
                        className="text-sm"
                      >
                        {item.type === 'encaissement' ? 'Encaissement' : 
                         item.type === 'annulation' ? 'Annulation' : 
                         'Décaissement'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>

                    {item.type === 'encaissement' && item.commande ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-500">Ticket:</span>
                          <p className="font-semibold text-gray-900 truncate">
                            CMD-{item.commande.id?.substring(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Vendeur:</span>
                          <p className="font-medium text-gray-700 truncate">
                            {item.commande.vendeur 
                              ? `${item.commande.vendeur.prenom || ''} ${item.commande.vendeur.nom || ''}`.trim()
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Paiement:</span>
                          <p className="font-medium text-gray-700 truncate">
                            {moyensPaiementLabels[item.paiement?.type_paiement] || item.paiement?.type_paiement || 'N/A'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Montant:</span>
                          <p className="font-bold text-green-600">
                            {formatCurrency(item.paiement?.montant || item.commande.total || 0)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Total commande:</span>
                          <p className="font-medium text-gray-600 text-sm">
                            {formatCurrency(item.commande.total || 0)}
                          </p>
                        </div>
                      </div>
                    ) : item.type === 'decaissement' && item.decaissement ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-500">Date et heure:</span>
                          <p className="font-medium text-gray-700">
                            {formatDateTime(item.date || item.created_at)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Motif:</span>
                          <p className="font-medium text-gray-700 truncate">
                            {item.decaissement.motif || item.decaissement.libelle || 'N/A'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Montant:</span>
                          <p className="font-bold text-red-600">
                            {formatCurrency(parseMontant(item.decaissement.montant))}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Validé par:</span>
                          <p className="font-medium text-gray-700 truncate">
                            {item.decaissement.caissier
                              ? `${item.decaissement.caissier.prenom || ''} ${item.decaissement.caissier.nom || ''}`.trim() || 'N/A'
                              : item.decaissement.fait_par || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : item.type === 'annulation' && item.commande ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-500">Ticket:</span>
                          <p className="font-semibold text-gray-900 truncate">
                            CMD-{item.commande.id?.substring(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Vendeur:</span>
                          <p className="font-medium text-gray-700 truncate">
                            {item.commande.vendeur 
                              ? `${item.commande.vendeur.prenom || ''} ${item.commande.vendeur.nom || ''}`.trim()
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Total:</span>
                          <p className="font-bold text-orange-600">
                            {formatCurrency(item.commande.total || 0)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500">Statut:</span>
                          <p className="font-medium text-gray-700">
                            Annulée
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {item.type === 'encaissement' && item.commande && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Transformer la commande en format ticket pour l'impression
                        const ticket = {
                          id: item.commande.id,
                          numero: `CMD-${item.commande.id?.substring(0, 8).toUpperCase()}`,
                          date_ticket: item.commande.date || item.commande.created_at,
                          vendeur_nom: item.commande.vendeur 
                            ? `${item.commande.vendeur.prenom || ''} ${item.commande.vendeur.nom || ''}`.trim()
                            : 'N/A',
                          total_ht: item.commande.total / 1.18,
                          tva: item.commande.total * 0.18 / 1.18,
                          total_ttc: item.commande.total,
                          moyen_paiement: item.paiement?.type_paiement,
                          lignes: item.commande.details?.map(d => ({
                            produit: d.produit?.nom || 'Produit',
                            quantite: d.quantite,
                            prix: d.prix_unitaire,
                          })) || [],
                        };
                        printInvoice(ticket);
                      }}
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

            {/* Pagination en bas de page (15 par page) */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 mt-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Affichage{' '}
                  <span className="font-medium text-gray-900">
                    {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredHistorique.length)}
                  </span>
                  {' '}sur{' '}
                  <span className="font-medium text-gray-900">{filteredHistorique.length}</span>
                  {' '}opération(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
    </div>
  );
};

export default HistoriquePage;

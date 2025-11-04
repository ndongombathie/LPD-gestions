import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printDecaissement } from '../components/DecaissementPrint';

const DecaissementsPage = () => {
  const [decaissements, setDecaissements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDecaissement, setSelectedDecaissement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const currentCaissier = 'Caissier 1'; // TODO: Récupérer depuis la session

  useEffect(() => {
    fetchDecaissements();
    // Rafraîchir toutes les 5 secondes pour voir les nouveaux décaissements
    const interval = setInterval(fetchDecaissements, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDecaissements = async () => {
    setLoading(true);
    try {
      // TODO: Appel API pour récupérer les décaissements
      // const response = await api.get('/decaissements');
      
      // Données simulées
      setTimeout(() => {
        setDecaissements([
          {
            id: 1,
            montant: 10000,
            motif: 'Achat fournitures de bureau',
            created_at: new Date().toISOString(),
            statut: 'en_attente',
            cree_par: 'Responsable Boutique',
          },
          {
            id: 2,
            montant: 5000,
            motif: 'Frais de transport',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            statut: 'fait',
            cree_par: 'Responsable Boutique',
            fait_par: 'Caissier 1',
            fait_le: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: 3,
            montant: 15000,
            motif: 'Achat équipement',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            statut: 'en_attente',
            cree_par: 'Responsable Boutique',
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la récupération des décaissements:', error);
      setLoading(false);
    }
  };

  const handleValiderDecaissement = async (decaissement) => {
    if (!window.confirm(`Confirmer le décaissement de ${formatCurrency(decaissement.montant)} ?`)) {
      return;
    }

    try {
      // TODO: Appel API pour valider le décaissement
      // await api.put(`/decaissements/${decaissement.id}/valider`, {
      //   caissier_id: currentCaissierId,
      // });

      // Mise à jour locale
      setDecaissements(decaissements.map(d => 
        d.id === decaissement.id 
          ? { 
              ...d, 
              statut: 'fait',
              fait_par: currentCaissier,
              fait_le: new Date().toISOString(),
            }
          : d
      ));

      alert('Décaissement effectué avec succès');
    } catch (error) {
      alert('Erreur lors de la validation: ' + error.message);
    }
  };

  const handleVoirDetails = (decaissement) => {
    setSelectedDecaissement(decaissement);
    setIsDetailModalOpen(true);
  };

  const totalDecaissements = decaissements.reduce((sum, d) => sum + d.montant, 0);
  const decaissementsEnAttente = decaissements.filter(d => d.statut === 'en_attente');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-white">
            Décaissements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Validation et gestion des décaissements en attente
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total décaissements</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
              {formatCurrency(totalDecaissements)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
              {decaissementsEnAttente.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Effectués</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
              {decaissements.filter(d => d.statut === 'fait').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Liste des décaissements */}
      <Card>
        <CardHeader
          title="Décaissements en attente"
          subtitle={`${decaissementsEnAttente.length} décaissement(s) à valider`}
        />
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : decaissementsEnAttente.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun décaissement en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {decaissementsEnAttente.map((dec) => (
                  <tr 
                    key={dec.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleVoirDetails(dec)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(dec.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {dec.motif}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {dec.cree_par}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(dec.montant)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleValiderDecaissement(dec)}
                      >
                        Valider
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Liste des décaissements effectués */}
      <Card>
        <CardHeader
          title="Historique des décaissements effectués"
          subtitle={`${decaissements.filter(d => d.statut === 'fait').length} décaissement(s) effectué(s)`}
        />
        {decaissements.filter(d => d.statut === 'fait').length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun décaissement effectué</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Effectué par
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {decaissements.filter(d => d.statut === 'fait').map((dec) => (
                  <tr 
                    key={dec.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleVoirDetails(dec)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(dec.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {dec.motif}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {dec.cree_par}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {dec.fait_par || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(dec.montant)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => printDecaissement(dec)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDecaissement(null);
        }}
        title="Détails du décaissement"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedDecaissement(null);
              }}
            >
              Fermer
            </Button>
            {selectedDecaissement?.statut === 'fait' && (
              <Button
                variant="primary"
                onClick={() => {
                  printDecaissement(selectedDecaissement);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimer
              </Button>
            )}
            {selectedDecaissement?.statut === 'en_attente' && (
              <Button
                variant="primary"
                onClick={() => {
                  handleValiderDecaissement(selectedDecaissement);
                  setIsDetailModalOpen(false);
                }}
              >
                Valider le décaissement
              </Button>
            )}
          </>
        }
      >
        {selectedDecaissement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(selectedDecaissement.montant)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</p>
                <div className="mt-1">
                  {selectedDecaissement.statut === 'en_attente' ? (
                    <Badge variant="accent">En attente</Badge>
                  ) : (
                    <Badge variant="success">Fait</Badge>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Motif</p>
              <p className="text-sm text-gray-900 dark:text-white mt-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {selectedDecaissement.motif}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Créé par</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedDecaissement.cree_par}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de création</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDateTime(selectedDecaissement.created_at)}
                </p>
              </div>
            </div>
            {selectedDecaissement.statut === 'fait' && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Effectué par</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedDecaissement.fait_par || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date d'effectuation</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedDecaissement.fait_le ? formatDateTime(selectedDecaissement.fait_le) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DecaissementsPage;


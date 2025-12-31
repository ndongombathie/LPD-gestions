import React, { useState } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printDecaissement } from '../components/DecaissementPrint';

const DecaissementsPage = () => {
  // Données fictives
  const [decaissements, setDecaissements] = useState([
    {
      id: 'dec-1',
      montant: 15000,
      motif: 'Achat de matériel de bureau',
      statut: 'en_attente',
      cree_par: 'Ibrahima Sall',
      fait_par: null,
      fait_le: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'dec-2',
      montant: 10000,
      motif: 'Frais de transport',
      statut: 'en_attente',
      cree_par: 'Fatou Ba',
      fait_par: null,
      fait_le: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'dec-3',
      montant: 25000,
      motif: 'Paiement fournisseur',
      statut: 'fait',
      cree_par: 'Amadou Diallo',
      fait_par: 'Ibrahima Sall',
      fait_le: new Date(Date.now() - 7200000).toISOString(),
      created_at: new Date(Date.now() - 10800000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  const [selectedDecaissement, setSelectedDecaissement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [compteChoisi, setCompteChoisi] = useState('caisse');

  const comptes = [
    { value: 'caisse', label: 'Caisse' },
    { value: 'banque', label: 'Compte bancaire' },
    { value: 'wave', label: 'Wave' },
    { value: 'om', label: 'Orange Money' },
    { value: 'autre', label: 'Autre' },
  ];

  const handleValiderDecaissement = (decaissement) => {
    setSelectedDecaissement(decaissement);
    setCompteChoisi('caisse');
    setIsValidationModalOpen(true);
  };

  const handleConfirmDecaissement = () => {
    if (!selectedDecaissement) return;

    // Mise à jour de la liste
    setDecaissements(prevDecaissements => 
      prevDecaissements.map(d => 
        d.id === selectedDecaissement.id 
          ? {
              ...d,
              statut: 'fait',
              fait_par: 'Caissier actuel',
              fait_le: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              compte_utilise: compteChoisi,
            }
          : d
      )
    );

    setIsValidationModalOpen(false);
    setSelectedDecaissement(null);
    alert('Décaissement effectué avec succès');
  };

  const handleAnnulerDecaissement = (decaissement) => {
    if (!window.confirm(`Voulez-vous vraiment annuler ce décaissement de ${formatCurrency(decaissement.montant)} ?`)) {
      return;
    }

    // Supprimer le décaissement de la liste
    setDecaissements(prevDecaissements => 
      prevDecaissements.filter(d => d.id !== decaissement.id)
    );

    alert('Décaissement annulé');
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
          <h1 className="text-3xl font-bold text-[#472EAD]">
            Décaissements
          </h1>
          <p className="text-gray-600 mt-1">
            Validation et gestion des décaissements en attente
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total décaissements</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalDecaissements)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-[#F58020] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-[#F58020] mt-1">
                {decaissementsEnAttente.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F58020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des décaissements */}
      <Card>
        <CardHeader
          title="Décaissements en attente"
          subtitle={`${decaissementsEnAttente.length} décaissement(s) à valider`}
        />
        {decaissementsEnAttente.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun décaissement en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {decaissementsEnAttente.map((dec) => (
                  <tr 
                    key={dec.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleVoirDetails(dec)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(dec.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {dec.motif}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {dec.cree_par}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                      {formatCurrency(dec.montant)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleValiderDecaissement(dec)}
                          className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-sm"
                        >
                          Valider
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAnnulerDecaissement(dec)}
                          className="border border-gray-300 font-semibold hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Annuler
                        </Button>
                      </div>
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
            <p className="text-gray-500">Aucun décaissement effectué</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effectué par
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {decaissements.filter(d => d.statut === 'fait').map((dec) => (
                  <tr 
                    key={dec.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleVoirDetails(dec)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(dec.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {dec.motif}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {dec.cree_par}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {dec.fait_par || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
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
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleAnnulerDecaissement(selectedDecaissement);
                    setIsDetailModalOpen(false);
                  }}
                  className="border border-gray-300 font-semibold hover:bg-gray-100"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleValiderDecaissement(selectedDecaissement);
                  }}
                  className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-md hover:shadow-lg"
                >
                  Valider le décaissement
                </Button>
              </>
            )}
          </>
        }
      >
        {selectedDecaissement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Montant</p>
                <p className="text-lg font-bold text-red-600text-red-400 mt-1">
                  {formatCurrency(selectedDecaissement.montant)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Statut</p>
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
              <p className="text-sm font-medium text-gray-600">Motif</p>
              <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                {selectedDecaissement.motif}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Créé par</p>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedDecaissement.cree_par}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date de création</p>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDateTime(selectedDecaissement.created_at)}
                </p>
              </div>
            </div>
            {selectedDecaissement.statut === 'fait' && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Effectué par</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedDecaissement.fait_par || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date d'effectuation</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedDecaissement.fait_le ? formatDateTime(selectedDecaissement.fait_le) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de validation du décaissement */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => {
          setIsValidationModalOpen(false);
          setSelectedDecaissement(null);
        }}
        title="Valider le décaissement"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsValidationModalOpen(false);
                setSelectedDecaissement(null);
              }}
              className="border border-gray-300 font-semibold hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirmDecaissement}
              className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-md hover:shadow-lg"
            >
              Confirmer le décaissement
            </Button>
          </>
        }
      >
        {selectedDecaissement && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                Détails du décaissement
              </h4>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(selectedDecaissement.montant)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-600">Motif:</span>
                  <span className="font-medium text-gray-900 sm:text-right">
                    {selectedDecaissement.motif}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-600">Créé par:</span>
                  <span className="font-medium text-gray-900">
                    {selectedDecaissement.cree_par}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-gray-600">Date de création:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(selectedDecaissement.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Note:</strong> Ce décaissement a été créé par le responsable. Veuillez choisir le compte à utiliser pour effectuer le décaissement.
              </p>
            </div>

            <div className="space-y-2">
              <Select
                label="Compte à utiliser"
                options={comptes}
                value={compteChoisi}
                onChange={(e) => setCompteChoisi(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DecaissementsPage;

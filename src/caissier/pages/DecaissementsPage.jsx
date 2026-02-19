import React, { useState, useEffect, useRef } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { printDecaissement } from '../components/DecaissementPrint';
import { toast } from 'sonner';
import { getEcho } from '../../utils/echo';
import caissierApi from '../services/caissierApi';

const DecaissementsPage = () => {
  const [decaissements, setDecaissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecaissement, setSelectedDecaissement] = useState(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [compteChoisi, setCompteChoisi] = useState('caisse');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [decaissementToCancel, setDecaissementToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDecaissements, setTotalDecaissements] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;
  const echoRef = useRef(null);
  const subscriptionsRef = useRef([]);

  const comptes = [
    { value: 'caisse', label: 'Caisse' },
    { value: 'banque', label: 'Compte bancaire' },
    { value: 'wave', label: 'Wave' },
    { value: 'om', label: 'Orange Money' },
    { value: 'autre', label: 'Autre' },
  ];

  // Fonction pour charger les décaissements en attente (pagination côté serveur)
  const fetchingDecaissementsRef = useRef(false);
  const fetchDecaissements = async (page = 1) => {
    if (fetchingDecaissementsRef.current) return;
    try {
      fetchingDecaissementsRef.current = true;
      setLoading(true);
      const response = await caissierApi.getDecaissementsAttente({ page, per_page: PAGE_SIZE });
      const decaissementsData = response?.data || [];
      
      // Transformer les données pour correspondre au format attendu
      const transformed = (Array.isArray(decaissementsData) ? decaissementsData : []).map(dec => ({
        id: dec.id,
        montant: typeof dec.montant === 'string' ? parseFloat(dec.montant.replace(/[^\d.-]/g, '')) : dec.montant,
        motif: dec.motif || dec.libelle || 'Non spécifié',
        libelle: dec.libelle || dec.motif || 'Non spécifié',
        statut: dec.statut?.toLowerCase() || 'en_attente',
        cree_par: dec.user ? `${dec.user.prenom || ''} ${dec.user.nom || ''}`.trim() : 'N/A',
        fait_par: dec.caissier ? `${dec.caissier.prenom || ''} ${dec.caissier.nom || ''}`.trim() : null,
        fait_le: dec.caissier_id ? (dec.updated_at || dec.date) : null,
        methode_paiement: dec.methode_paiement || 'caisse',
        created_at: dec.created_at,
        updated_at: dec.updated_at,
        date: dec.date,
        user: dec.user,
        caissier: dec.caissier,
      }));
      
      setDecaissements(transformed);
      setTotalDecaissements(response?.total ?? transformed.length);
      setTotalAmount(response?.total_amount ?? transformed.reduce((s, d) => s + (d.montant || 0), 0));
      setTotalPages(Math.max(1, response?.last_page ?? 1));
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de charger les décaissements en attente'
      });
      // Erreur silencieuse - gérée par le composant
    } finally {
      setLoading(false);
      fetchingDecaissementsRef.current = false;
    }
  };

  // Initialiser WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;
    
    echoRef.current = echo;

    // S'abonner au canal global pour les décaissements
    // (Vous devrez créer un événement DecaissementCree/DecaissementValide si nécessaire)
    
    return () => {
      // Nettoyage
      subscriptionsRef.current.forEach(sub => {
        if (echo) {
          echo.leave(sub.channel);
        }
      });
      subscriptionsRef.current = [];
    };
  }, []);

  const loadPage = (page) => {
    setCurrentPage(page);
    fetchDecaissements(page);
  };

  useEffect(() => {
    fetchDecaissements(1);
  }, []);

  const handleValiderDecaissement = (decaissement) => {
    setSelectedDecaissement(decaissement);
    setCompteChoisi(decaissement.methode_paiement || 'caisse');
    setIsValidationModalOpen(true);
  };

  const handleConfirmDecaissement = async () => {
    if (!selectedDecaissement) return;
    if (isValidating) return;

    try {
      setIsValidating(true);
      // Appel API pour valider le décaissement
      await caissierApi.validerDecaissement(selectedDecaissement.id, { methode_paiement: compteChoisi });

      const currentUserStr = sessionStorage.getItem('user') || sessionStorage.getItem('lpd_current_user');
      let currentUser = null;
      try {
        currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      } catch (_e) {
        currentUser = null;
      }
      const decaissementForPrint = {
        ...selectedDecaissement,
        statut: 'valide',
        fait_par: currentUser ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : (selectedDecaissement.fait_par || 'N/A'),
        fait_le: new Date().toISOString(),
      };

      toast.success('Décaissement validé', {
        description: `Décaissement de ${formatCurrency(selectedDecaissement.montant)} effectué avec succès`,
        action: {
          label: 'Imprimer',
          onClick: () => printDecaissement(decaissementForPrint),
        }
      });

      setIsValidationModalOpen(false);
      setSelectedDecaissement(null);
      await fetchDecaissements(currentPage);
    } catch (error) {
      // Erreur silencieuse - gérée par le composant
      toast.error('Erreur', {
        description: String(error.response?.data?.message || 'Impossible de valider le décaissement')
          .replace(/https?:\/\/localhost:[0-9]+/gi, '')
          .trim()
      });
    } finally {
      setIsValidating(false);
    }
  };

  const openCancelModal = (decaissement) => {
    setDecaissementToCancel(decaissement);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!decaissementToCancel || isCancelling) return;
    try {
      setIsCancelling(true);
      await caissierApi.annulerDecaissement(decaissementToCancel.id);
      toast.success('Décaissement annulé', {
        description: 'Le décaissement a été annulé avec succès'
      });
      await fetchDecaissements(currentPage);
      setIsCancelModalOpen(false);
      setDecaissementToCancel(null);
    } catch (error) {
      toast.error('Erreur', {
        description: String(error.response?.data?.message || 'Impossible d\'annuler le décaissement')
          .replace(/https?:\/\/localhost:[0-9]+/gi, '')
          .trim()
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const displayedDecaissements = decaissements;

  return (
    <div className="space-y-14 relative z-10">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">
            Décaissements
          </h1>
          <p className="text-gray-600 mt-1">
            Validation des décaissements créés par le responsable
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white border-l-4 border-l-[#F58020] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-[#F58020] mt-1">
                {totalDecaissements}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F58020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="bg-white border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total en attente</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des décaissements en attente */}
      <div className="pt-4">
      <Card className="bg-white">
        <CardHeader
          title="Décaissements en attente"
          subtitle={`${displayedDecaissements.length} sur cette page / ${totalDecaissements} décaissement(s) à valider`}
        />
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : totalDecaissements === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun décaissement en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="px-5 py-4 text-right text-sm font-medium text-gray-600 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedDecaissements.map((dec) => (
                  <tr 
                    key={dec.id} 
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(dec.created_at)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                      {dec.motif}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dec.cree_par}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
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
                          onClick={() => openCancelModal(dec)}
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
            {/* Pagination en bas de page (15 par page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 py-3 px-4 mt-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  Affichage{' '}
                  <span className="font-medium text-gray-900">
                    {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalDecaissements)}
                  </span>
                  {' '}sur{' '}
                  <span className="font-medium text-gray-900">{totalDecaissements}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-white border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 disabled:opacity-50"
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
                    className="bg-white border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 disabled:opacity-50"
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

      {/* Modal de validation du décaissement */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => {
          if (isValidating) return;
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
                if (isValidating) return;
                setIsValidationModalOpen(false);
                setSelectedDecaissement(null);
              }}
              disabled={isValidating}
              className="border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirmDecaissement}
              disabled={isValidating}
              className="bg-[#472EAD] hover:bg-[#3d2888] text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validation...
                </>
              ) : (
                'Confirmer le décaissement'
              )}
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

      {/* Modal de confirmation d'annulation */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (isCancelling) return;
          setIsCancelModalOpen(false);
          setDecaissementToCancel(null);
        }}
        title="Confirmer l'annulation"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (isCancelling) return;
                setIsCancelModalOpen(false);
                setDecaissementToCancel(null);
              }}
              disabled={isCancelling}
              className="border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Non, garder
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Annulation...
                </>
              ) : (
                'Oui, annuler'
              )}
            </Button>
          </>
        }
      >
        {decaissementToCancel && (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">
                    Attention : Annulation du décaissement
                  </h4>
                  <p className="text-sm text-red-800">
                    Vous êtes sur le point d'annuler un décaissement de <strong>{formatCurrency(decaissementToCancel.montant)}</strong>.
                    Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3">Détails</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Motif:</span>
                  <span className="font-medium text-gray-900">{decaissementToCancel.motif}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Créé par:</span>
                  <span className="font-medium text-gray-900">{decaissementToCancel.cree_par}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{formatDateTime(decaissementToCancel.created_at)}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Confirmez-vous l'annulation ?
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DecaissementsPage;

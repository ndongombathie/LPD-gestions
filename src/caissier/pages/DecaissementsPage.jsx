import React, { useState, useEffect, useRef } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
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
  const [compteChoisi, setCompteChoisi] = useState('caisse');
  const echoRef = useRef(null);
  const subscriptionsRef = useRef([]);

  const comptes = [
    { value: 'caisse', label: 'Caisse' },
    { value: 'banque', label: 'Compte bancaire' },
    { value: 'wave', label: 'Wave' },
    { value: 'om', label: 'Orange Money' },
    { value: 'autre', label: 'Autre' },
  ];

  // Fonction pour charger les décaissements en attente
  const fetchDecaissements = async () => {
    try {
      setLoading(true);
      const response = await caissierApi.getDecaissementsAttente();
      
      // Gérer différents formats de réponse
      let decaissementsData = [];
      if (response && typeof response === 'object') {
        if (response.data) {
          decaissementsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        } else if (Array.isArray(response)) {
          decaissementsData = response;
        }
      }
      
      if (!Array.isArray(decaissementsData)) {
        decaissementsData = [];
      }
      
      // Transformer les données pour correspondre au format attendu
      const transformed = decaissementsData.map(dec => ({
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
    } catch (error) {
      // Afficher l'erreur détaillée pour le débogage
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error('Erreur', {
        description: `Impossible de charger les décaissements: ${errorMessage}`
      });
      console.error('Erreur détaillée décaissements:', error.response?.data || error);
    } finally {
      setLoading(false);
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

  // Charger les décaissements au montage
  useEffect(() => {
    fetchDecaissements();
  }, []);

  const handleValiderDecaissement = (decaissement) => {
    setSelectedDecaissement(decaissement);
    setCompteChoisi(decaissement.methode_paiement || 'caisse');
    setIsValidationModalOpen(true);
  };

  const handleConfirmDecaissement = async () => {
    if (!selectedDecaissement) return;

    try {
      // Appel API pour valider le décaissement
      await caissierApi.validerDecaissement(selectedDecaissement.id);

      toast.success('Décaissement validé', {
        description: `Décaissement de ${formatCurrency(selectedDecaissement.montant)} effectué avec succès`
      });

      // Fermer le modal immédiatement
      setIsValidationModalOpen(false);
      setSelectedDecaissement(null);

      // Recharger les décaissements (WebSocket le fera automatiquement si configuré)
      await fetchDecaissements();
    } catch (error) {
      console.error('Erreur lors de la validation du décaissement:', error);
      toast.error('Erreur', {
        description: error.response?.data?.message || 'Impossible de valider le décaissement'
      });
    }
  };

  const handleAnnulerDecaissement = async (decaissement) => {
    if (!window.confirm(`Voulez-vous vraiment annuler ce décaissement de ${formatCurrency(decaissement.montant)} ?`)) {
      return;
    }

    try {
      // Appel API pour annuler le décaissement
      await caissierApi.annulerDecaissement(decaissement.id);
      
      toast.success('Décaissement annulé', {
        description: 'Le décaissement a été annulé avec succès'
      });

      // Recharger les décaissements
      await fetchDecaissements();
    } catch (error) {
      console.error('Erreur lors de l\'annulation du décaissement:', error);
      toast.error('Erreur', {
        description: error.response?.data?.message || 'Impossible d\'annuler le décaissement'
      });
    }
  };

  const decaissementsEnAttente = decaissements.filter(d => d.statut === 'en_attente');
  const totalEnAttente = decaissementsEnAttente.reduce((sum, d) => sum + (d.montant || 0), 0);

  return (
    <div className="space-y-6 relative z-10">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total en attente</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalEnAttente)}
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
      <Card>
        <CardHeader
          title="Décaissements en attente"
          subtitle={`${decaissementsEnAttente.length} décaissement(s) à valider`}
        />
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : decaissementsEnAttente.length === 0 ? (
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
                    className="hover:bg-gray-50"
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

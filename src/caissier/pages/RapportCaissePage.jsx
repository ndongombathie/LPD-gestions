import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { caissesJournalAPI } from '../../utils/api';

const RapportCaissePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fondOuverture: '',
    totalEncaissements: '',
    totalDecaissements: '',
    soldeCloture: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchRapport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await caissesJournalAPI.getByDate(selectedDate);
      setRapport(data);
      
      // Pré-remplir le formulaire avec les données
      setFormData({
        fondOuverture: data.fond_ouverture?.toString() || '',
        totalEncaissements: data.total_encaissements?.toString() || '',
        totalDecaissements: data.total_decaissements?.toString() || '',
        soldeCloture: data.solde_cloture?.toString() || '',
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport:', error);
      // Ne pas afficher d'alerte pour les erreurs d'authentification
      if (error.response?.status !== 401) {
        alert('Erreur lors du chargement du rapport. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRapport();
  }, [fetchRapport]);


  const handleClotureCaisse = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir clôturer la caisse pour cette journée?')) {
      return;
    }

    try {
      setLoading(true);
      await caissesJournalAPI.cloture(selectedDate);
      alert('Caisse clôturée avec succès');
      fetchRapport();
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
      alert('Erreur lors de la clôture: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRapport = async () => {
    try {
      setLoading(true);
      await caissesJournalAPI.update(selectedDate, {
        fond_ouverture: parseInt(formData.fondOuverture) || 0,
        total_encaissements: parseInt(formData.totalEncaissements) || 0,
        total_decaissements: parseInt(formData.totalDecaissements) || 0,
        solde_cloture: parseInt(formData.soldeCloture) || 0,
      });
      setIsEditing(false);
      alert('Rapport mis à jour avec succès');
      fetchRapport();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
      alert('Erreur lors de la sauvegarde: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implémenter l'export PDF
    window.print();
  };

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
          <h1 className="text-3xl font-bold text-text-primary dark:text-white">
            Rapport de caisse journalier
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivi des encaissements et décaissements de la journée
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" onClick={handleExportPDF}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter PDF
          </Button>
          {rapport && !rapport.cloture && (
            <Button variant="danger" onClick={handleClotureCaisse}>
              Clôturer la caisse
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du rapport...</p>
        </div>
      ) : !rapport ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun rapport disponible pour cette date</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Formulaire de saisie du rapport */}
          <Card>
            <CardHeader 
              title="Saisie du rapport journalier"
              action={
                !isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(true);
                    setFormData({
                      fondOuverture: (rapport.fond_ouverture || 0).toString(),
                      totalEncaissements: (rapport.total_encaissements || 0).toString(),
                      totalDecaissements: (rapport.total_decaissements || 0).toString(),
                      soldeCloture: (rapport.solde_cloture || 0).toString(),
                    });
                  }}>
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                      Annuler
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveRapport}>
                      Enregistrer
                    </Button>
                  </div>
                )
              }
            />
            
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Fond d'ouverture (FCFA)"
                  type="number"
                  value={formData.fondOuverture}
                  onChange={(e) => setFormData({ ...formData, fondOuverture: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Total encaissements (FCFA)"
                  type="number"
                  value={formData.totalEncaissements}
                  onChange={(e) => setFormData({ ...formData, totalEncaissements: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Total décaissements (FCFA)"
                  type="number"
                  value={formData.totalDecaissements}
                  onChange={(e) => setFormData({ ...formData, totalDecaissements: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Solde de clôture (FCFA)"
                  type="number"
                  value={formData.soldeCloture}
                  onChange={(e) => setFormData({ ...formData, soldeCloture: e.target.value })}
                  placeholder="0"
                  helperText={`Calculé: ${formatCurrency((parseFloat(formData.fondOuverture) || 0) + (parseFloat(formData.totalEncaissements) || 0) - (parseFloat(formData.totalDecaissements) || 0))}`}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-primary-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fond d'ouverture</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                        {formatCurrency(rapport.fond_ouverture || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total encaissements</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(rapport.total_encaissements || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total décaissements</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {formatCurrency(rapport.total_decaissements || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                  </div>
                </Card>
                <Card className="border-l-4 border-l-accent-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Solde de clôture</p>
                      <p className="text-2xl font-bold text-accent-500 dark:text-accent-400 mt-1">
                        {formatCurrency(rapport.solde_cloture || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Calculé: {formatCurrency((rapport.fond_ouverture || 0) + (rapport.total_encaissements || 0) - (rapport.total_decaissements || 0))}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent-500 dark:text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </Card>

          {/* Ventes par moyen de paiement */}
          <Card>
            <CardHeader title="Ventes par moyen de paiement" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(rapport.ventes_par_moyen || {}).map(([moyen, montant], index) => (
                <div 
                  key={moyen} 
                  className={`text-center p-4 rounded-lg border-l-4 ${
                    index === 0 ? 'border-l-primary-600 bg-primary-50 dark:bg-primary-900/20' :
                    index === 1 ? 'border-l-accent-500 bg-accent-50 dark:bg-accent-900/20' :
                    index === 2 ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                    'border-l-gray-400 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{moyensPaiementLabels[moyen]}</p>
                  <p className={`text-lg font-bold mt-1 ${
                    index === 0 ? 'text-primary-600 dark:text-primary-400' :
                    index === 1 ? 'text-accent-600 dark:text-accent-400' :
                    index === 2 ? 'text-green-600 dark:text-green-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {formatCurrency(montant)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Détail des tickets */}
          <Card>
            <CardHeader 
              title="Détail des tickets encaissés"
              subtitle={`${rapport.tickets_encaisses?.length || 0} ticket(s)`}
            />
            {rapport.tickets_encaisses && rapport.tickets_encaisses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        N° Ticket
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Heure
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vendeur
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Moyen de paiement
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rapport.tickets_encaisses.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {ticket.numero}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {ticket.heure}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {ticket.vendeur}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {moyensPaiementLabels[ticket.moyen_paiement]}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(ticket.total_ttc)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700 font-bold">
                      <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-primary-600 dark:text-primary-400">
                        {formatCurrency(
                          rapport.tickets_encaisses.reduce((sum, t) => sum + t.total_ttc, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Aucun ticket encaissé</p>
              </div>
            )}
          </Card>

          {/* Détail des décaissements */}
          <Card>
            <CardHeader 
              title="Détail des décaissements"
              subtitle={`${rapport.decaissements?.length || 0} décaissement(s)`}
            />
            {rapport.decaissements && rapport.decaissements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Heure
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Motif
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rapport.decaissements.map((dec) => (
                      <tr key={dec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {dec.heure}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {dec.motif}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(dec.montant)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-700 font-bold">
                      <td colSpan="2" className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(
                          rapport.decaissements.reduce((sum, d) => sum + d.montant, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Aucun décaissement</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default RapportCaissePage;


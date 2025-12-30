import React, { useState, useEffect, useRef } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

const RapportCaissePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const previousDateRef = useRef(selectedDate);
  
  // Données fictives - stockées par date
  const initialRapport = {
    fond_ouverture: 50000,
    total_encaissements: 245000,
    total_decaissements: 15000,
    solde_cloture: 280000,
    cloture: false,
    ventes_par_moyen: {
      especes: 120000,
      carte: 80000,
      wave: 25000,
      om: 20000,
    },
    tickets_encaisses: [
      {
        id: 'ticket-1',
        numero: 'TKT-2025-000001',
        heure: '09:30',
        vendeur: 'Amadou Diallo',
        total_ttc: 118000,
        moyen_paiement: 'especes',
      },
      {
        id: 'ticket-2',
        numero: 'TKT-2025-000002',
        heure: '11:15',
        vendeur: 'Fatou Ba',
        total_ttc: 100300,
        moyen_paiement: 'carte',
      },
      {
        id: 'ticket-3',
        numero: 'TKT-2025-000003',
        heure: '14:45',
        vendeur: 'Ibrahima Sall',
        total_ttc: 26700,
        moyen_paiement: 'wave',
      },
    ],
    decaissements: [
      {
        id: 'dec-1',
        heure: '10:00',
        motif: 'Achat de matériel de bureau',
        montant: 10000,
      },
      {
        id: 'dec-2',
        heure: '15:30',
        motif: 'Frais de transport',
        montant: 5000,
      },
    ],
  };

  // Initialiser les rapports par date
  const [rapportsParDate, setRapportsParDate] = useState({
    [selectedDate]: { ...initialRapport }
  });

  // Récupérer le rapport pour la date sélectionnée
  const rapport = rapportsParDate[selectedDate] || null;


  // Vérifier si on est passé à une nouvelle journée et clôturer automatiquement le rapport de la veille
  useEffect(() => {
    const dateActuelle = new Date().toISOString().split('T')[0];
    const datePrecedente = previousDateRef.current;

    // Si on change de date et qu'il y a un rapport non clôturé de la veille, le clôturer
    if (datePrecedente && datePrecedente !== dateActuelle) {
      setRapportsParDate(prev => {
        const updated = { ...prev };
        // Clôturer tous les rapports non clôturés des dates précédentes
        Object.keys(updated).forEach(date => {
          if (date !== dateActuelle && updated[date] && !updated[date].cloture) {
            updated[date] = { ...updated[date], cloture: true };
          }
        });
        return updated;
      });
    }

    // Vérifier si on est dans une nouvelle journée (minuit passé)
    const checkNewDay = () => {
      const now = new Date().toISOString().split('T')[0];
      if (now !== dateActuelle) {
        // Nouvelle journée détectée, clôturer automatiquement le rapport de la veille
        setRapportsParDate(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(date => {
            if (date !== now && updated[date] && !updated[date].cloture) {
              updated[date] = { ...updated[date], cloture: true };
            }
          });
          return updated;
        });
      }
    };

    // Vérifier toutes les minutes si on est passé à une nouvelle journée
    const interval = setInterval(checkNewDay, 60000); // Vérifier toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Gérer le changement de date
  useEffect(() => {
    const datePrecedente = previousDateRef.current;
    const dateActuelle = new Date().toISOString().split('T')[0];
    
    // Si on change de date manuellement
    if (datePrecedente && datePrecedente !== selectedDate) {
      setRapportsParDate(prev => {
        const updated = { ...prev };
        
        // Ne clôturer que si on passe d'une date passée à la date actuelle (ou future)
        // Ne PAS clôturer si on consulte simplement un rapport passé
        if (datePrecedente < dateActuelle && selectedDate >= dateActuelle) {
          // On passe d'une date passée à la date actuelle, clôturer la date passée
          if (updated[datePrecedente] && !updated[datePrecedente].cloture) {
            updated[datePrecedente] = { ...updated[datePrecedente], cloture: true };
          }
        }
        
        // Créer un nouveau rapport pour la nouvelle date si elle n'existe pas
        if (!updated[selectedDate]) {
          // Trouver la date précédente la plus proche pour le fond d'ouverture
          const datePrecedentePourFond = Object.keys(updated)
            .filter(d => d < selectedDate)
            .sort()
            .pop();
          
          const soldeClotureVeille = datePrecedentePourFond 
            ? (updated[datePrecedentePourFond]?.solde_cloture || 0)
            : 0;
            
          updated[selectedDate] = {
            fond_ouverture: soldeClotureVeille,
            total_encaissements: 0,
            total_decaissements: 0,
            solde_cloture: soldeClotureVeille,
            cloture: false,
            ventes_par_moyen: {},
            tickets_encaisses: [],
            decaissements: [],
          };
        }
        return updated;
      });
    }

    // Créer un nouveau rapport pour la date actuelle si elle n'existe pas
    if (!rapportsParDate[selectedDate]) {
      const datePrecedente = Object.keys(rapportsParDate)
        .filter(d => d < selectedDate)
        .sort()
        .pop();
      
      const soldeClotureVeille = datePrecedente 
        ? (rapportsParDate[datePrecedente]?.solde_cloture || 0)
        : 0;

      setRapportsParDate(prev => ({
        ...prev,
        [selectedDate]: {
          fond_ouverture: soldeClotureVeille,
          total_encaissements: 0,
          total_decaissements: 0,
          solde_cloture: soldeClotureVeille,
          cloture: false,
          ventes_par_moyen: {},
          tickets_encaisses: [],
          decaissements: [],
        }
      }));
    }

    previousDateRef.current = selectedDate;
  }, [selectedDate, rapportsParDate]);

  const handleClotureCaisse = () => {
    if (!window.confirm('Êtes-vous sûr de vouloir clôturer la caisse pour cette journée?')) {
      return;
    }

    setRapportsParDate(prev => ({
      ...prev,
      [selectedDate]: { ...prev[selectedDate], cloture: true }
    }));
    alert('Caisse clôturée avec succès');
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#472EAD]text-white">
              Rapport de caisse journalier
            </h1>
            {rapport && rapport.cloture && (
              <Badge variant="success">Clôturé</Badge>
            )}
            {rapport && !rapport.cloture && (
              <Badge variant="warning">En cours</Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {rapport && rapport.cloture 
              ? `Rapport clôturé du ${formatDate(selectedDate)} - Consultation uniquement`
              : `Suivi des encaissements et décaissements du ${formatDate(selectedDate)}`
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            title="Sélectionner une date pour consulter le rapport"
          />
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            className="border-2 border-[#472EAD] text-[#472EAD] hover:bg-[#F7F5FF] font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter PDF
          </Button>
          {rapport && !rapport.cloture && (
            <Button 
              variant="danger" 
              onClick={handleClotureCaisse}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
            >
              Clôturer la caisse
            </Button>
          )}
        </div>
      </div>

      {/* Liste des dates disponibles */}
      {Object.keys(rapportsParDate).length > 0 && (
        <Card>
          <CardHeader title="Dates disponibles" />
          <div className="flex flex-wrap gap-2">
            {Object.keys(rapportsParDate)
              .sort((a, b) => new Date(b) - new Date(a))
              .map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedDate === date
                      ? 'bg-[#472EAD] text-white shadow-md'
                      : rapportsParDate[date]?.cloture
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formatDate(date)}
                  {rapportsParDate[date]?.cloture && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
          </div>
        </Card>
      )}

      {!rapport ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun rapport disponible pour cette date</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Formulaire de saisie du rapport */}
          <Card>
            <CardHeader 
              title={`Rapport du ${formatDate(selectedDate)}`}
            />
            
            {rapport.cloture && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-800text-green-200">
                    Ce rapport est clôturé. Il est en lecture seule et ne peut plus être modifié.
                  </p>
                </div>
              </div>
            )}
            
            {!rapport.cloture && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800text-blue-200">
                  <strong>Note :</strong> Les montants sont calculés automatiquement à partir des encaissements et décaissements de la journée. 
                  Vous pouvez clôturer le rapport une fois tous les montants vérifiés.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Fond d'ouverture</p>
                  <p className="text-2xl font-bold text-[#472EAD]text-primary-400 mt-2">
                    {formatCurrency(rapport.fond_ouverture || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total encaissements</p>
                  <p className="text-2xl font-bold text-green-600text-green-400 mt-2">
                    {formatCurrency(rapport.total_encaissements || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total décaissements</p>
                  <p className="text-2xl font-bold text-red-600text-red-400 mt-2">
                    {formatCurrency(rapport.total_decaissements || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Solde de clôture</p>
                  <p className="text-2xl font-bold text-[#F58020]text-accent-400 mt-2">
                    {formatCurrency(rapport.solde_cloture || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculé: {formatCurrency((rapport.fond_ouverture || 0) + (rapport.total_encaissements || 0) - (rapport.total_decaissements || 0))}
                  </p>
                </div>
            </div>
          </Card>

          {/* Ventes par moyen de paiement */}
          <Card>
            <CardHeader title="Ventes par moyen de paiement" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(rapport.ventes_par_moyen || {}).map(([moyen, montant]) => (
                <div key={moyen} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{moyensPaiementLabels[moyen]}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        N° Ticket
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Heure
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Vendeur
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Moyen de paiement
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rapport.tickets_encaisses.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.numero}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {ticket.heure}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {ticket.vendeur}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {moyensPaiementLabels[ticket.moyen_paiement]}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(ticket.total_ttc)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#472EAD]text-primary-400">
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
                <p className="text-gray-500">Aucun ticket encaissé</p>
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Heure
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Motif
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500text-gray-300 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rapport.decaissements.map((dec) => (
                      <tr key={dec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {dec.heure}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {dec.motif}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600text-red-400">
                          {formatCurrency(dec.montant)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="2" className="px-4 py-3 text-right text-sm text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-600text-red-400">
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
                <p className="text-gray-500">Aucun décaissement</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default RapportCaissePage;


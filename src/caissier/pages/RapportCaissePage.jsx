import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import caissierApi from '../services/caissierApi';
import { toast } from 'sonner';

const RapportCaissePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [rapport, setRapport] = useState(null);
  const [ventesParMoyen, setVentesParMoyen] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const getDatePart = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value.substring(0, 10);
    try {
      return new Date(value).toISOString().substring(0, 10);
    } catch (_e) {
      return null;
    }
  };

  const getTimeHHMM = (value) => {
    if (!value) return '--:--';
    if (typeof value === 'string') {
      const s = value.includes('T') ? value.split('T')[1] : (value.includes(' ') ? value.split(' ')[1] : value);
      return (s || '').substring(0, 5) || '--:--';
    }
    try {
      const d = new Date(value);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (_e) {
      return '--:--';
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [journal, ventes, commandesPayeesResponse, decaissementsResponse] = await Promise.all([
          caissierApi.getCaissierCaisseJournal(selectedDate),
          caissierApi.getVentesParMoyen(selectedDate),
          caissierApi.getCommandesPayees(),
          caissierApi.getDecaissements({ per_page: 200 }),
        ]);

        if (cancelled) return;

        const commandesPayees = commandesPayeesResponse?.data || commandesPayeesResponse || [];
        const decaissements = decaissementsResponse?.data || decaissementsResponse || [];

        // Tickets encaissés = paiements du jour (heure exacte)
        const ticketsEncaisses = [];
        (Array.isArray(commandesPayees) ? commandesPayees : []).forEach((commande) => {
          const paiements = Array.isArray(commande?.paiements) ? commande.paiements : [];
          const paiementsDuJour = paiements.filter((p) => getDatePart(p?.date || p?.created_at) === selectedDate);
          if (paiementsDuJour.length === 0) return;

          const vendeur = commande?.vendeur
            ? `${commande.vendeur?.prenom || ''} ${commande.vendeur?.nom || ''}`.trim()
            : 'N/A';

          paiementsDuJour.forEach((p) => {
            const dt = p?.date || p?.created_at || commande?.updated_at || commande?.created_at;
            ticketsEncaisses.push({
              id: `${commande.id}_${p.id}`,
              numero: `CMD-${commande.id?.substring(0, 8)?.toUpperCase()}`,
              heure: getTimeHHMM(dt),
              vendeur,
              moyen_paiement: p?.type_paiement || 'autre',
              // Ici "total_ttc" = montant encaissé (paiement)
              total_ttc: p?.montant || 0,
              date_ticket: dt,
            });
          });
        });

        ticketsEncaisses.sort((a, b) => String(a.date_ticket || '').localeCompare(String(b.date_ticket || '')));

        // Décaissements du jour = statut "fait" validés ce jour-là
        const decaissementsDuJour = (Array.isArray(decaissements) ? decaissements : [])
          .filter((d) => String(d?.statut || '').toLowerCase() === 'fait')
          .filter((d) => getDatePart(d?.updated_at || d?.date || d?.created_at) === selectedDate)
          .map((d) => {
            const dt = d?.updated_at || d?.date || d?.created_at;
            const montant = typeof d?.montant === 'string'
              ? parseFloat(d.montant.replace(/[^\d.-]/g, '')) || 0
              : (d?.montant || 0);

            return ({
              id: d.id,
              heure: getTimeHHMM(dt),
              motif: d.motif || d.libelle || 'Non spécifié',
              montant,
              date: dt,
            });
          })
          .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        setRapport({
          id: journal?.id,
          fond_ouverture: journal?.fond_ouverture ?? 0,
          total_encaissements: journal?.total_encaissements ?? 0,
          total_decaissements: journal?.total_decaissements ?? 0,
          solde_theorique: journal?.solde_theorique ?? 0,
          solde_reel: journal?.solde_reel ?? null,
          solde_cloture: journal?.solde_reel ?? journal?.solde_theorique ?? 0,
          cloture: Boolean(journal?.cloture),
          observations: journal?.observations ?? null,
          tickets_encaisses: ticketsEncaisses,
          decaissements: decaissementsDuJour,
          ventes_par_moyen: {},
        });

        setVentesParMoyen(Array.isArray(ventes) ? ventes : []);
      } catch (_err) {
        if (cancelled) return;
        setRapport(null);
        setVentesParMoyen([]);
        setErrorMessage("Impossible de charger le rapport de caisse.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const ventesParMoyenObj = useMemo(() => {
    const obj = {};
    (ventesParMoyen || []).forEach((v) => {
      const key = v?.type || v?.moyen || 'autre';
      obj[key] = (obj[key] || 0) + (v?.montant || 0);
    });
    return obj;
  }, [ventesParMoyen]);

  const handleClotureCaisse = async () => {
    if (!rapport) return;
    const soldeTheorique = (rapport.fond_ouverture || 0) + (rapport.total_encaissements || 0) - (rapport.total_decaissements || 0);

    setIsClosing(true);
    try {
      const updated = await caissierApi.cloturerCaissierCaisseJournal(selectedDate, {
        solde_reel: soldeTheorique,
        observations: rapport.observations || null,
      });

      setRapport((prev) => ({
        ...prev,
        ...updated,
        solde_cloture: updated?.solde_reel ?? updated?.solde_theorique ?? prev?.solde_cloture ?? soldeTheorique,
        cloture: Boolean(updated?.cloture),
      }));
      toast.success('Caisse clôturée', {
        description: 'Le rapport a été clôturé avec succès.'
      });
    } catch (_err) {
      toast.error('Erreur', {
        description: "Impossible de clôturer la caisse."
      });
    } finally {
      setIsClosing(false);
      setIsCloseConfirmOpen(false);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement du rapport...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#472EAD] dark:text-white">
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
              onClick={() => setIsCloseConfirmOpen(true)}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
            >
              {isClosing ? 'Clôture...' : 'Clôturer la caisse'}
            </Button>
          )}
        </div>
      </div>

      {errorMessage ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600">{errorMessage}</p>
          </div>
        </Card>
      ) : null}

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
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Ce rapport est clôturé. Il est en lecture seule et ne peut plus être modifié.
                  </p>
                </div>
              </div>
            )}
            
            {!rapport.cloture && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note :</strong> Les montants sont calculés automatiquement à partir des encaissements et décaissements de la journée. 
                  Vous pouvez clôturer le rapport une fois tous les montants vérifiés.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Fond d'ouverture</p>
                  <p className="text-2xl font-bold text-[#472EAD] dark:text-primary-400 mt-2">
                    {formatCurrency(rapport.fond_ouverture || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total encaissements</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(rapport.total_encaissements || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total décaissements</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {formatCurrency(rapport.total_decaissements || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Solde de clôture</p>
                  <p className="text-2xl font-bold text-[#F58020] dark:text-accent-400 mt-2">
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
              {Object.entries(ventesParMoyenObj || {}).map(([moyen, montant]) => (
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
                      <td className="px-4 py-3 text-right text-sm text-[#472EAD] dark:text-primary-400">
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rapport.decaissements.map((dec) => (
                      <tr key={dec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {dec.heure}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {dec.motif}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(dec.montant)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="2" className="px-4 py-3 text-right text-sm text-gray-900">
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
                <p className="text-gray-500">Aucun décaissement</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modal de confirmation de clôture */}
      <Modal
        isOpen={isCloseConfirmOpen}
        onClose={() => {
          if (isClosing) return;
          setIsCloseConfirmOpen(false);
        }}
        title="Confirmer la clôture"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (isClosing) return;
                setIsCloseConfirmOpen(false);
              }}
              disabled={isClosing}
              className="border border-gray-300 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleClotureCaisse}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClosing ? 'Clôture...' : 'Oui, clôturer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Vous êtes sur le point de <strong>clôturer</strong> la caisse pour la journée du <strong>{formatDate(selectedDate)}</strong>.
              Après clôture, le rapport sera en lecture seule.
            </p>
          </div>
          {rapport && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Solde théorique:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency((rapport.fond_ouverture || 0) + (rapport.total_encaissements || 0) - (rapport.total_decaissements || 0))}
                </span>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600 text-center">Confirmez-vous la clôture ?</p>
        </div>
      </Modal>
    </div>
  );
};

export default RapportCaissePage;


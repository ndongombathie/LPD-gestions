import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const DecaissementsPage = () => {
  const [decaissements, setDecaissements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    montant: '',
    motif: '',
  });

  useEffect(() => {
    fetchDecaissements();
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
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la récupération des décaissements:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.montant || !formData.motif) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const montant = parseFloat(formData.montant);
    if (montant <= 0) {
      alert('Le montant doit être supérieur à 0');
      return;
    }

    try {
      // TODO: Appel API pour enregistrer le décaissement
      // await api.post('/decaissements', {
      //   montant: montant,
      //   motif: formData.motif,
      // });

      // Ajouter le décaissement à la liste avec statut "en_attente"
      const newDecaissement = {
        id: decaissements.length + 1,
        montant: montant,
        motif: formData.motif,
        created_at: new Date().toISOString(),
        statut: 'en_attente',
        cree_par: 'Responsable Boutique', // Récupérer depuis la session
      };

      setDecaissements([newDecaissement, ...decaissements]);
      setFormData({ montant: '', motif: '' });
      setIsModalOpen(false);
      alert('Décaissement créé avec succès. En attente de validation par le caissier.');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement: ' + error.message);
    }
  };

  const totalDecaissements = decaissements.reduce((sum, d) => sum + d.montant, 0);
  const decaissementsEnAttente = decaissements.filter(d => d.statut === 'en_attente');
  const decaissementsFaits = decaissements.filter(d => d.statut === 'fait');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-white">
            Décaissements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créer et suivre les demandes de décaissement
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau décaissement
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              {decaissementsFaits.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total effectués</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {formatCurrency(decaissementsFaits.reduce((sum, d) => sum + d.montant, 0))}
            </p>
          </div>
        </Card>
      </div>

      {/* Liste des décaissements */}
      <Card>
        <CardHeader
          title="Historique des décaissements"
          subtitle={`${decaissements.length} décaissement(s) au total`}
        />
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : decaissements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun décaissement enregistré</p>
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
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {decaissements.map((dec) => (
                  <tr key={dec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(dec.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {dec.motif}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {dec.cree_par}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {dec.statut === 'en_attente' ? (
                        <Badge variant="accent">En attente</Badge>
                      ) : (
                        <Badge variant="success">Fait</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(dec.montant)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700 font-bold">
                  <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(totalDecaissements)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de décaissement */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ montant: '', motif: '' });
        }}
        title="Nouveau décaissement"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setFormData({ montant: '', motif: '' });
              }}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleSubmit}>
              Créer le décaissement
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Montant (FCFA)"
            type="number"
            value={formData.montant}
            onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
            placeholder="0"
            required
            min="1"
            step="1"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motif du décaissement
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              rows="4"
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              placeholder="Décrivez le motif du décaissement..."
              required
            />
          </div>
          {formData.montant && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                Montant à décaisser: <span className="font-bold">{formatCurrency(parseFloat(formData.montant) || 0)}</span>
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Le décaissement sera en attente de validation par le caissier.
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default DecaissementsPage;


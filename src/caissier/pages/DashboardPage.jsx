import React, { useState, useEffect } from 'react';
import Card, { CardHeader } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { dashboardAPI, commandesAPI } from '../../utils/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    fondOuverture: 0,
    totalEncaissements: 0,
    totalDecaissements: 0,
    soldeActuel: 0,
    ticketsEnAttente: 0,
    ticketsTraites: 0,
  });

  const [ventesParMoyen, setVentesParMoyen] = useState([]);
  const [ventesParHeure, setVentesParHeure] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer les stats du jour
      let statsData;
      try {
        statsData = await dashboardAPI.getStats(today);
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        // Données par défaut en cas d'erreur
        statsData = {
          fondOuverture: 0,
          totalEncaissements: 0,
          totalDecaissements: 0,
          soldeActuel: 0,
          ticketsTraites: 0,
          ventesParMoyen: {},
        };
      }
      
      // Récupérer les tickets en attente
      let pendingTickets = [];
      try {
        pendingTickets = await commandesAPI.getPending();
      } catch (error) {
        console.error('Erreur lors de la récupération des tickets:', error);
      }
      
      setStats({
        fondOuverture: statsData.fondOuverture || 0,
        totalEncaissements: statsData.totalEncaissements || 0,
        totalDecaissements: statsData.totalDecaissements || 0,
        soldeActuel: statsData.soldeActuel || 0,
        ticketsEnAttente: pendingTickets.length || 0,
        ticketsTraites: statsData.ticketsTraites || 0,
      });

      // Formater les ventes par moyen de paiement
      const ventesParMoyenFormatted = Object.entries(statsData.ventesParMoyen || {})
        .map(([moyen, montant]) => {
          const labels = {
            especes: 'Espèces',
            carte: 'Carte',
            wave: 'Wave',
            om: 'Orange Money',
            cheque: 'Chèque',
            autre: 'Autre',
          };
          const total = statsData.totalEncaissements || 0;
          return {
            moyen: labels[moyen] || moyen,
            montant: montant || 0,
            pourcentage: total > 0 
              ? Math.round((montant / total) * 100) 
              : 0,
          };
        })
        .filter(v => v.montant > 0);

      setVentesParMoyen(ventesParMoyenFormatted.length > 0 ? ventesParMoyenFormatted : []);

      // Pour les ventes par heure, on peut utiliser des données simulées pour l'instant
      // ou créer une API spécifique si nécessaire
      setVentesParHeure([
        { heure: '08h-10h', montant: 0 },
        { heure: '10h-12h', montant: 0 },
        { heure: '12h-14h', montant: 0 },
        { heure: '14h-16h', montant: 0 },
        { heure: '16h-18h', montant: 0 },
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      // Ne pas afficher d'alerte pour les erreurs d'authentification
      // S'assurer que les données par défaut sont définies
      setStats({
        fondOuverture: 0,
        totalEncaissements: 0,
        totalDecaissements: 0,
        soldeActuel: 0,
        ticketsEnAttente: 0,
        ticketsTraites: 0,
      });
      setVentesParMoyen([]);
      setVentesParHeure([
        { heure: '08h-10h', montant: 0 },
        { heure: '10h-12h', montant: 0 },
        { heure: '12h-14h', montant: 0 },
        { heure: '14h-16h', montant: 0 },
        { heure: '16h-18h', montant: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Protection contre division par zéro
  const maxVente = ventesParHeure.length > 0 
    ? Math.max(1, ...ventesParHeure.map(v => v.montant || 0))
    : 1;

  // Données de fallback pour les graphiques si vides
  const displayVentesParHeure = ventesParHeure.length > 0 
    ? ventesParHeure 
    : [
        { heure: '08h-10h', montant: 0 },
        { heure: '10h-12h', montant: 0 },
        { heure: '12h-14h', montant: 0 },
        { heure: '14h-16h', montant: 0 },
        { heure: '16h-18h', montant: 0 },
      ];

  const displayVentesParMoyen = ventesParMoyen.length > 0 
    ? ventesParMoyen 
    : [
        { moyen: 'Espèces', montant: 0, pourcentage: 0 },
        { moyen: 'Carte', montant: 0, pourcentage: 0 },
        { moyen: 'Wave', montant: 0, pourcentage: 0 },
      ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de votre activité du {formatDate(new Date().toISOString())}
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-white">
          Tableau de bord
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Vue d'ensemble de votre activité du {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary-600 hover:shadow-md transition-shadow bg-background-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fond d'ouverture</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats.fondOuverture)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-background-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Encaissements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats.totalEncaissements)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow bg-background-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Décaissements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats.totalDecaissements)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-accent-500 hover:shadow-md transition-shadow bg-background-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Solde actuel</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats.soldeActuel)}
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

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres - Ventes par heure */}
        <Card>
          <CardHeader title="Ventes par période de la journée" />
          <div className="mt-6">
            <div className="space-y-4">
              {displayVentesParHeure.map((vente, index) => {
                const widthPercentage = maxVente > 0 ? (vente.montant / maxVente) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {vente.heure}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(vente.montant || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 h-4 rounded-full transition-all duration-500 shadow-lg hover:shadow-xl"
                        style={{ width: `${Math.max(0, Math.min(100, widthPercentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Graphique circulaire - Ventes par moyen de paiement */}
        <Card>
          <CardHeader title="Ventes par moyen de paiement" />
          <div className="mt-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg 
                  className="transform -rotate-90 w-48 h-48" 
                  viewBox="0 0 192 192"
                  style={{ display: 'block' }}
                >
                  {/* Cercle de fond toujours visible */}
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="transparent"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                    className="dark:stroke-gray-700"
                  />
                  {/* Segments de données */}
                  {displayVentesParMoyen.length > 0 && displayVentesParMoyen.some(v => v.montant > 0) ? (
                    displayVentesParMoyen.reduce((acc, item, index) => {
                      const prevPercentage = acc.prevPercentage;
                      const percentage = item.pourcentage || 0;
                      if (percentage <= 0) {
                        return acc;
                      }
                      const circumference = 2 * Math.PI * 90;
                      const offset = circumference - (percentage / 100) * circumference;
                      const strokeDasharray = circumference;
                      const strokeDashoffset = offset - (prevPercentage / 100) * circumference;
                      
                      // Couleurs selon la palette
                      const colors = [
                        '#472EAD', // primary-600
                        '#F58020', // accent-500
                        '#10b981', // green-500
                        '#8b5cf6', // primary-400
                        '#ea580c', // accent-600
                        '#6b7280', // gray-500
                      ];

                      acc.elements.push(
                        <circle
                          key={index}
                          cx="96"
                          cy="96"
                          r="90"
                          fill="transparent"
                          stroke={colors[index % colors.length]}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      );
                      acc.prevPercentage += percentage;
                      return acc;
                    }, { elements: [], prevPercentage: 0 }).elements
                  ) : null}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalEncaissements || 0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {displayVentesParMoyen.length > 0 ? (
                displayVentesParMoyen.map((item, index) => {
                  const colors = [
                    '#472EAD', // primary-600
                    '#F58020', // accent-500
                    '#10b981', // green-500
                    '#8b5cf6', // primary-400
                    '#ea580c', // accent-600
                    '#6b7280', // gray-500
                  ];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: colors[index % colors.length],
                          }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.moyen}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.montant || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.pourcentage || 0}%</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Tickets du jour" />
          <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent-50 via-accent-100 to-orange-50 dark:from-accent-900/20 dark:via-accent-900/10 dark:to-orange-900/20 rounded-lg border-l-4 border-accent-500 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-accent-200">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">En attente</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.ticketsEnAttente} ticket(s) à traiter
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  {stats.ticketsEnAttente}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 via-primary-100 to-violet-50 dark:from-primary-900/20 dark:via-primary-900/10 dark:to-violet-900/20 rounded-lg border-l-4 border-primary-600 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-primary-200">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Traités</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.ticketsTraites} ticket(s) encaissé(s)
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats.ticketsTraites}
                </p>
              </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Activité récente" />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Encaissement</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 5 min</p>
              </div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{formatCurrency(59000)}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Décaissement</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 1h</p>
              </div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(10000)}
              </p>
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Encaissement</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 2h</p>
              </div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{formatCurrency(88500)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;


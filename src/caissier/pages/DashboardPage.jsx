import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // Données fictives
  const stats = {
    fondOuverture: 50000,
    totalEncaissements: 245000,
    totalDecaissements: 15000,
    soldeActuel: 280000,
    ticketsEnAttente: 3,
    ticketsTraites: 12,
  };

  const ventesParMoyen = [
    { moyen: 'Espèces', montant: 120000, pourcentage: 49 },
    { moyen: 'Carte', montant: 80000, pourcentage: 33 },
    { moyen: 'Wave', montant: 25000, pourcentage: 10 },
    { moyen: 'Orange Money', montant: 20000, pourcentage: 8 },
  ];

  const ventesParHeure = [
    { heure: '08h-10h', montant: 35000 },
    { heure: '10h-12h', montant: 65000 },
    { heure: '12h-14h', montant: 85000 },
    { heure: '14h-16h', montant: 45000 },
    { heure: '16h-18h', montant: 16000 },
  ];

  const maxVente = Math.max(...ventesParHeure.map(v => v.montant));

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
        <Card className="border-l-4 border-l-primary-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fond d'ouverture</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
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
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Encaissements</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
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
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Décaissements</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
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
        <Card className="border-l-4 border-l-accent-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Solde actuel</p>
              <p className="text-2xl font-bold text-accent-500 dark:text-accent-400 mt-2">
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
              {ventesParHeure.map((vente, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {vente.heure}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(vente.montant)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-primary-600 to-accent-500 h-4 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${maxVente > 0 ? (vente.montant / maxVente) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Graphique circulaire - Ventes par moyen de paiement */}
        <Card>
          <CardHeader title="Ventes par moyen de paiement" />
          <div className="mt-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 200 200">
                  {(() => {
                    const circumference = 2 * Math.PI * 90;
                    let cumulativePercentage = 0;
                    const colors = ['#472EAD', '#F58020', '#10b981', '#8b5cf6', '#ef4444'];
                    
                    return ventesParMoyen.map((item, index) => {
                      const percentage = item.pourcentage;
                      const strokeDashoffset = circumference * (1 - cumulativePercentage / 100);
                      cumulativePercentage += percentage;
                      
                      return (
                        <circle
                          key={index}
                          cx="100"
                          cy="100"
                          r="90"
                          fill="transparent"
                          stroke={colors[index % colors.length]}
                          strokeWidth="20"
                          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalEncaissements)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {ventesParMoyen.map((item, index) => {
                const colors = ['#472EAD', '#F58020', '#10b981', '#8b5cf6', '#ef4444'];
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
                        {formatCurrency(item.montant)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.pourcentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Tickets du jour" />
          <div className="mt-4 space-y-4">
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-900/10 rounded-lg border border-accent-200 dark:border-accent-800 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate('/caissier/caisse')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center shadow-md">
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
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate('/caissier/caisse')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-md">
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


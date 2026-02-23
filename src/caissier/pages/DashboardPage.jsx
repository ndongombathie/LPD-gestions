import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import caissierApi from '../services/caissierApi';
import { echo } from '../../utils/echo';
import { toast } from 'sonner';

// Fonction pour formater le temps relatif
const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // États
  const [loading, setLoading] = useState(true);
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
  const [activiteRecente, setActiviteRecente] = useState([]);
  const echoRef = useRef(null);

  // Fonction pour charger les données (avec protection contre les appels multiples)
  const loadingRef = useRef(false);
  const loadData = async () => {
    if (loadingRef.current) return; // Éviter les appels simultanés
    try {
      loadingRef.current = true;
      setLoading(true);
      
      // Charger toutes les données en parallèle
      const [statsData, ventesMoyen, ventesHeure, activite] = await Promise.all([
        caissierApi.getDashboardStats(),
        caissierApi.getVentesParMoyen(),
        caissierApi.getVentesParHeure(),
        caissierApi.getActiviteRecente(6),
      ]);
      
      setStats(statsData);
      setVentesParMoyen(ventesMoyen);
      setVentesParHeure(ventesHeure);
      setActiviteRecente(Array.isArray(activite) ? activite.slice(0, 4) : []);
    } catch (error) {
      toast.error('Erreur', {
        description: error.response?.data?.message || 'Impossible de charger les données du tableau de bord.',
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Charger les données
  useEffect(() => {
    // Chargement initial - priorité absolue
    loadData();

    // Initialiser WebSocket de manière asynchrone pour les mises à jour en temps réel
    const timeoutId = setTimeout(() => {
      try {
      //  const echo = initializeEcho();
        if (echo) {
          echoRef.current = echo;
          
          // Récupérer l'ID de la boutique de l'utilisateur connecté
          const userStr = sessionStorage.getItem('user');
          let boutiqueId = null;
          try {
            const user = userStr ? JSON.parse(userStr) : null;
            boutiqueId = user?.boutique_id;
          } catch (e) {
            // Ignorer
          }

          // Écouter les événements de paiement et décaissement pour mettre à jour le dashboard
          if (boutiqueId) {
            const boutiqueChannel = echo.private(`boutique.${boutiqueId}`);
            
            // Écouter les nouveaux paiements
            boutiqueChannel.listen('.paiement.cree', () => {
              loadData(); // Recharger les données du dashboard
            });
            
            // Écouter les nouvelles commandes validées
            boutiqueChannel.listen('.commande.validee', () => {
              loadData();
            });
            
            // Écouter les commandes annulées
            boutiqueChannel.listen('.commande.annulee', () => {
              loadData();
            });
          }
        }
      } catch (e) {
        // Ignorer les erreurs WebSocket - ne pas bloquer l'application
      }
    }, 2000); // Démarrer après 2 secondes pour ne pas ralentir le chargement initial

    return () => {
      clearTimeout(timeoutId);
      // Nettoyage WebSocket si nécessaire
      if (echoRef.current) {
        try {
          const userStr = sessionStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          const boutiqueId = user?.boutique_id;
          if (boutiqueId) {
            echoRef.current.leave(`boutique.${boutiqueId}`);
          }
        } catch (e) {
          // Ignorer
        }
      }
    };
  }, []);

  const maxVente = ventesParHeure.length > 0 
    ? Math.max(...ventesParHeure.map(v => v.montant), 1) 
    : 1;

  if (loading) {
    return (
      <div className="space-y-6 relative z-10 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#472EAD]"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-14 relative z-10" style={{ position: 'relative', visibility: 'visible', opacity: 1, display: 'block', width: '100%', minHeight: '400px' }}>
      {/* En-tête */}
      <div style={{ backgroundColor: 'transparent', padding: '10px' }}>
        <h1 className="text-3xl font-bold text-[#472EAD]" style={{ color: '#472EAD', fontSize: '2rem' }}>
          Tableau de bord
        </h1>
        <p className="text-gray-600 mt-1" style={{ color: '#6B7280' }}>
          Vue d'ensemble de votre activité du {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="border-l-4 border-l-[#472EAD] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fond d'ouverture</p>
              <p className="text-2xl font-bold text-[#472EAD] mt-2">
                {formatCurrency(stats.fondOuverture)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F7F5FF] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#472EAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Encaissements</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(stats.totalEncaissements)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Décaissements</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(stats.totalDecaissements)}
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
              <p className="text-sm text-gray-600">Solde actuel</p>
              <p className="text-2xl font-bold text-[#F58020] mt-2">
                {formatCurrency(stats.soldeActuel)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F58020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Graphique en barres - Ventes par heure */}
        <Card>
          <CardHeader title="Ventes par période de la journée" />
          <div className="mt-6">
            <div className="space-y-4">
              {ventesParHeure.map((vente, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {vente.heure}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(vente.montant)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-[#472EAD] to-[#F58020] h-4 rounded-full transition-all duration-500 shadow-sm"
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

                    if (!ventesParMoyen || ventesParMoyen.length === 0) {
                      return (
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="transparent"
                          stroke="#E5E7EB"
                          strokeWidth="20"
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset={0}
                        />
                      );
                    }

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
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalEncaissements)}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {ventesParMoyen.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">Aucune vente enregistrée pour le moment</p>
                </div>
              ) : ventesParMoyen.map((item, index) => {
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
                      <span className="text-sm text-gray-700">{item.moyen}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.montant)}
                      </p>
                      <p className="text-xs text-gray-500">{item.pourcentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <Card className="bg-white">
          <CardHeader title="Tickets du jour" />
          <div className="mt-4 space-y-4">
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] rounded-lg border border-[#FED7AA] cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate('/caissier/caisse')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FB923C] to-[#F58020] rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">En attente</p>
                  <p className="text-sm text-gray-600">
                    {stats.ticketsEnAttente} ticket(s) à traiter
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#F58020]">
                {stats.ticketsEnAttente}
              </p>
            </div>
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-[#F7F5FF] to-[#EFEAFF] rounded-lg border border-[#E4E0FF] cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate('/caissier/caisse')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#472EAD] rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Traités</p>
                  <p className="text-sm text-gray-600">
                    {stats.ticketsTraites} ticket(s) encaissé(s)
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#472EAD]">
                {stats.ticketsTraites}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white">
          <CardHeader title="Activité récente" />
          <div className="mt-4 space-y-4">
            {activiteRecente.length > 0 ? (
              activiteRecente.slice(0, 4).map((activite, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 ${
                    index < Math.min(activiteRecente.length, 4) - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
              <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activite.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTimeAgo(activite.date)}
              </p>
            </div>
                  <p className={`text-sm font-semibold ${
                    activite.type === 'encaissement' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activite.type === 'encaissement' ? '+' : '-'}{formatCurrency(activite.montant)}
              </p>
            </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;


import React from 'react';

// Version simplifiée sans les appels API pour le moment
const Dashboard: React.FC = () => {
  // Données statiques pour le moment - on ajoutera l'API plus tard
  const stats = {
    totalSales: 1000,
    todaySales: 0,
    totalProducts: 6,
    lowStockProducts: 2,
    pendingTransfers: 1,
    totalCustomers: 3,
  };

  const user = {
    firstName: 'Modou',
    lastName: 'Ndiaye'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Ventes du jour',
      value: formatCurrency(stats.todaySales),
      icon: '💰',
      bgColor: 'bg-[#F3FAF6]',
      iconColor: 'bg-[#F58020]',
      textColor: 'text-[#111827]',
    },
    {
      title: 'Ventes totales',
      value: formatCurrency(stats.totalSales),
      icon: '📊',
      bgColor: 'bg-[#F3FAF6]',
      iconColor: 'bg-[#472EAD]',
      textColor: 'text-[#111827]',
    },
    {
      title: 'Produits',
      value: stats.totalProducts,
      icon: '📦',
      bgColor: 'bg-[#F3FAF6]',
      iconColor: 'bg-[#472EAD]',
      textColor: 'text-[#111827]',
    },
    {
      title: 'Clients',
      value: stats.totalCustomers,
      icon: '👥',
      bgColor: 'bg-[#F3FAF6]',
      iconColor: 'bg-[#F58020]',
      textColor: 'text-[#111827]',
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-[#F3FAF6] min-h-screen">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">
          Tableau de bord
        </h1>
        <p className="text-[#111827] mt-1 opacity-80">
          Bienvenue, {user.firstName} {user.lastName}
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#111827] opacity-80 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-[#111827]">
                  {card.value}
                </p>
              </div>
              <div className={`${card.iconColor} p-3 rounded-lg text-white text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Activité récente</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-[#F3FAF6] rounded-lg">
              <div className="w-10 h-10 bg-[#F58020] rounded-full flex items-center justify-center text-white text-lg">
                ✅
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111827]">
                  Nouvelle vente complétée
                </p>
                <p className="text-xs text-[#111827] opacity-70">
                  Il y a 5 minutes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-[#F3FAF6] rounded-lg">
              <div className="w-10 h-10 bg-[#472EAD] rounded-full flex items-center justify-center text-white text-lg">
                🔄
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111827]">
                  Transfert de stock en cours
                </p>
                <p className="text-xs text-[#111827] opacity-70">
                  Il y a 1 heure
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-[#F3FAF6] rounded-lg">
              <div className="w-10 h-10 bg-[#F58020] rounded-full flex items-center justify-center text-white text-lg">
                ⚠️
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111827]">
                  Stock faible détecté
                </p>
                <p className="text-xs text-[#111827] opacity-70">
                  Il y a 2 heures
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes & Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Alertes & Notifications</h2>
          <div className="space-y-3">
            {stats.pendingTransfers > 0 && (
              <div className="p-4 bg-[#FEF3E2] border border-[#F58020] rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-[#F58020] text-lg mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {stats.pendingTransfers} transfert(s) en attente
                    </p>
                    <p className="text-xs text-[#111827] opacity-70 mt-1">
                      Nécessite votre attention
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#F0F4FF] border border-[#472EAD] rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-[#472EAD] text-lg mt-0.5">✅</span>
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    Système fonctionnel
                  </p>
                  <p className="text-xs text-[#111827] opacity-70 mt-1">
                    Tous les services sont opérationnels
                  </p>
                </div>
              </div>
            </div>

            {stats.lowStockProducts > 0 && (
              <div className="p-4 bg-[#FDF2F2] border border-[#EF4444] rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-[#EF4444] text-lg mt-0.5">🔴</span>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {stats.lowStockProducts} produit(s) en stock faible
                    </p>
                    <p className="text-xs text-[#111827] opacity-70 mt-1">
                      Réapprovisionnement nécessaire
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React from 'react';

const Dashboard: React.FC = () => {
  // Données spécifiques pour un gestionnaire de dépôt
  const depotStats = {
    totalProducts: 150,
    lowStockProducts: 12,
    criticalStockProducts: 3,
    todayMovements: 23,
    activeSuppliers: 8,
    recentDeliveries: 15, // Livraisons ce mois-ci
    stockLevel: 72, // pourcentage
  };

  const user = {
    firstName: 'Modou',
    lastName: 'Ndiaye',
    role: 'Gestionnaire Depôt'
  };

  const statCards = [
    {
      title: 'Produits en Stock',
      value: depotStats.totalProducts,
      subtitle: `${depotStats.lowStockProducts} en stock faible`,
      icon: '📦',
      color: 'bg-[#472EAD]',
      textColor: 'text-white'
    },
    {
      title: 'Niveau Stock Moyen',
      value: `${depotStats.stockLevel}%`,
      subtitle: `${depotStats.criticalStockProducts} produits critiques`,
      icon: '📊',
      color: 'bg-[#F58020]',
      textColor: 'text-white'
    },
    {
      title: 'Mouvements Aujourd\'hui',
      value: depotStats.todayMovements,
      subtitle: 'Entrées & sorties',
      icon: '🚚',
      color: 'bg-[#F3FAF6]',
      textColor: 'text-[#111827]'
    },
    {
      title: 'Fournisseurs',
      value: depotStats.activeSuppliers,
      subtitle: `${depotStats.recentDeliveries} livraisons ce mois`,
      icon: '🏢',
      color: 'bg-[#F3FAF6]',
      textColor: 'text-[#111827]'
    },
  ];

  const recentActivities = [
    {
      type: 'reception',
      title: 'Réception de marchandise',
      description: '50 cahiers - Fournisseur Papeterie Plus',
      time: 'Il y a 2 heures',
      icon: '✅',
      color: 'text-green-600'
    },
    {
      type: 'sortie',
      title: 'Sortie vers Boutique',
      description: '30 stylos - Boutique Dakar Centre',
      time: 'Il y a 4 heures',
      icon: '🔄',
      color: 'text-blue-600'
    },
    {
      type: 'alerte',
      title: 'Stock faible détecté',
      description: 'Classeurs (reste 5 unités)',
      time: 'Il y a 6 heures',
      icon: '⚠️',
      color: 'text-orange-600'
    },
    {
      type: 'inventaire',
      title: 'Inventaire planifié',
      description: 'Inventaire général programmé pour vendredi',
      time: 'Il y a 1 jour',
      icon: '📋',
      color: 'text-purple-600'
    }
  ];

  const alerts = [
    {
      type: 'critical',
      title: 'Produits en rupture de stock',
      description: '3 produits nécessitent un réapprovisionnement urgent',
      count: 3,
      icon: '🔴',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900'
    },
    {
      type: 'warning',
      title: 'Livraisons attendues',
      description: '2 livraisons prévues cette semaine',
      count: 2,
      icon: '📦',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900'
    },
    {
      type: 'info',
      title: 'Niveau de stock optimal',
      description: '85% des produits ont un stock suffisant',
      count: 128,
      icon: '🟢',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900'
    }
  ];

  return (
    <div className="space-y-6 p-6 bg-[#F3FAF6] min-h-screen overflow-x-hidden"> {/* ← CORRECTION ICI */}
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">
              Tableau de bord Dépôt
            </h1>
            <p className="text-[#111827] mt-1 opacity-80">
              Bienvenue, {user.firstName} {user.lastName} - {user.role}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#111827] opacity-70">Aujourd'hui</p>
            <p className="text-lg font-semibold text-[#472EAD]">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
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
                <p className="text-xs text-[#111827] opacity-70 mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg ${card.textColor} text-2xl`}>
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
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Activité Récente</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-[#F3FAF6] rounded-lg">
                <div className={`text-2xl ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111827]">
                    {activity.title}
                  </p>
                  <p className="text-xs text-[#111827] opacity-70">
                    {activity.description}
                  </p>
                  <p className="text-xs text-[#111827] opacity-50 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes & Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Alertes & Notifications</h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-4 ${alert.bgColor} border ${alert.borderColor} rounded-lg`}>
                <div className="flex items-start gap-3">
                  <span className={`text-lg mt-0.5 ${alert.textColor}`}>{alert.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${alert.textColor}`}>
                        {alert.title}
                      </p>
                      {alert.count > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${alert.bgColor} ${alert.textColor} border ${alert.borderColor}`}>
                          {alert.count}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${alert.textColor} opacity-80 mt-1`}>
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides CORRIGÉES */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-[#111827] mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Entrée Stock */}
          <button className="p-4 bg-[#F3FAF6] rounded-lg text-[#111827] hover:bg-[#472EAD] hover:text-white transition-colors text-center">
            <div className="text-2xl mb-2">📥</div>
            <p className="text-sm font-medium">Entrée Stock</p>
          </button>
          
          {/* 2. Sortie Boutique */}
          <button className="p-4 bg-[#F3FAF6] rounded-lg text-[#111827] hover:bg-[#472EAD] hover:text-white transition-colors text-center">
            <div className="text-2xl mb-2">📤</div>
            <p className="text-sm font-medium">Sortie Boutique</p>
          </button>
          
          {/* 3. Enregistrer Livraison */}
          <button className="p-4 bg-[#F3FAF6] rounded-lg text-[#111827] hover:bg-[#472EAD] hover:text-white transition-colors text-center">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm font-medium">Enregistrer Livraison</p>
          </button>
          
          {/* 4. Inventaire Stock */}
          <button className="p-4 bg-[#F3FAF6] rounded-lg text-[#111827] hover:bg-[#472EAD] hover:text-white transition-colors text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm font-medium">Nouvel Inventaire</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
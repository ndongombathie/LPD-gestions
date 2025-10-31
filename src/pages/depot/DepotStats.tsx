import React from 'react';

const DepotStats: React.FC = () => {
  const stats = [
    { label: 'Produits en stock', value: '156', color: 'bg-blue-500' },
    { label: 'Produits à réapprovisionner', value: '12', color: 'bg-orange-500' },
    { label: 'Mouvements aujourd\'hui', value: '24', color: 'bg-green-500' },
    { label: 'Valeur totale du stock', value: '4.5M FCFA', color: 'bg-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className={`w-4 h-4 ${stat.color} rounded-full mr-3`}></div>
            <h3 className="text-lg font-semibold text-gray-700">{stat.label}</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DepotStats;
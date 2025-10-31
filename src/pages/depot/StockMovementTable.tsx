import React from 'react';

interface Movement {
  id: number;
  product: string;
  type: 'entrée' | 'sortie';
  quantity: number;
  date: string;
  user: string;
}

const StockMovementTable: React.FC = () => {
  const movements: Movement[] = [
    { id: 1, product: 'iPhone 15', type: 'entrée', quantity: 50, date: '2024-01-15', user: 'Admin' },
    { id: 2, product: 'Samsung Galaxy', type: 'sortie', quantity: 25, date: '2024-01-15', user: 'Boutique' },
    { id: 3, product: 'Câble USB-C', type: 'entrée', quantity: 100, date: '2024-01-14', user: 'Admin' },
  ];

  const getTypeColor = (type: string) => {
    return type === 'entrée' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">📦 Historique des mouvements</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{movement.product}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(movement.type)}`}>
                    {movement.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{movement.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{movement.date}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{movement.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovementTable;
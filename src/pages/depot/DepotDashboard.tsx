import React, { useState } from 'react';
import DepotStats from './DepotStats';
import StockMovementTable from './StockMovementTable';
import AddProductModal from './AddProductModal';

const DepotDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          🏭 Gestion du Dépôt
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Ajouter un produit
        </button>
      </div>

      {/* Statistiques */}
      <DepotStats />

      {/* Tableau des mouvements */}
      <StockMovementTable />

      {/* Modal d'ajout */}
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default DepotDashboard;
import React from 'react';
import Card from '../../components/ui/Card';
import { formatDate } from '../../utils/formatters';

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-white">
          Tableau de bord
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Vue d'ensemble du {formatDate(new Date().toISOString())}
        </p>
      </div>

      <Card>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue dans l'interface responsable. Vous pouvez créer des demandes de décaissement depuis la page Décaissements.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;


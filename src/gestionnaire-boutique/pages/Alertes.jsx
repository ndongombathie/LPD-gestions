import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import * as api from "../services/apiMock";

const Alertes = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.fetchStocks().then((res) => {
      if (!mounted) return;
      setStocks(res);
      setLoading(false);
    });
    return () => (mounted = false);
  }, []);

  const alertes = stocks.filter((p) => p.quantite <= p.seuil);

  const handleReappro = (row) => {
    // simulation : ouvrir modal ou envoyer requête
    alert(`Réapprovisionnement demandé pour ${row.nom}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
          <AlertTriangle className="text-[#F58020]" />
          Produits en alerte
        </h2>

        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner />
          ) : alertes.length === 0 ? (
            <EmptyState message="Aucun produit en alerte" />
          ) : (
            <DataTable
              columns={[
                { label: 'Nom', key: 'nom' },
                { label: 'Catégorie', key: 'categorie' },
                { label: 'Quantité', key: 'quantite' },
                { label: 'Seuil', key: 'seuil' },
              ]}
              data={alertes}
              actions={[{ title: 'Réapprovisionner', icon: <RefreshCw />, color: 'text-[#472EAD]', hoverBg: 'bg-[#F7F5FF]', onClick: handleReappro }]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Alertes;

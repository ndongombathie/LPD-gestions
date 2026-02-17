// ==========================================================
// 💰 CaissiersPage.jsx — Interface caissiers avec filtres
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  Users,
  Banknote,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle,
  XCircle,
  User,
  Eye,
  Wallet,
} from "lucide-react";

// Composants
import CaissierHistoryModal from "../../components/roles/CaissierHistoryModal";
import FondOuvertureModal from "../../components/roles/FondOuvertureModal";
import { journalResponsableAPI } from "@/services/api/JournalResponsable";


const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function CaissiersPage() {
  const [loading, setLoading] = useState(true);
  const [caissiers, setCaissiers] = useState([]);
  const [selectedCaissier, setSelectedCaissier] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFondOuverture, setShowFondOuverture] = useState(false);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  const [encaissementsGlobal, setEncaissementsGlobal] = useState(0);


  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const toast = React.useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

 useEffect(() => {
  let interval;

  const loadCaissiers = async (firstLoad = false) => {
    try {
      if (firstLoad) setLoading(true);

      const response = await journalResponsableAPI.getCaissiers();

      setCaissiers(response.data || []);
      setEncaissementsGlobal(response.encaissementsGlobal || 0);





      if (firstLoad) setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  loadCaissiers(true);

  // refresh auto toutes les 30s comme vendeurs
  interval = setInterval(() => loadCaissiers(false), 30000);

  return () => clearInterval(interval);
}, []);


  const filteredCaissiers = caissiers.filter(caissier => {
    if (search) {
      const terme = search.toLowerCase();
      if (!caissier.name?.toLowerCase().includes(terme) &&
          !caissier.email?.toLowerCase().includes(terme)) {
        return false;
      }
    }
    
    return true;
  });

  const globalStats = {
    total: caissiers.length,
    encaissementsTotal: caissiers.reduce((sum, v) => sum + (v.stats?.encaissementsTotal || 0), 0),
    decaissementsTotal: caissiers.reduce((sum, v) => sum + (v.stats?.decaissementsTotal || 0), 0),
    soldeNet: caissiers.reduce((sum, v) => sum + (v.stats?.soldeNet || 0), 0),
  };

  const handleViewHistory = (caissier) => {
    setSelectedCaissier(caissier);
    setShowHistory(true);
  };

  const handleFondOuverture = (caissier) => {
    setSelectedCaissier(caissier);
    setShowFondOuverture(true);
  };

  const getStatusIcon = (status) => {
    return status === "actif" ? 
      <CheckCircle className="w-3 h-3 text-emerald-500" /> : 
      <XCircle className="w-3 h-3 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* EN-TÊTE COMPACT */}
      <div className="mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Équipe Caissiers</h2>
            <p className="text-xs text-gray-500 mt-1">
              {globalStats.total} caissiers
            </p>
          </div>
        </div>

        {/* STATISTIQUES COMPACTES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3 h-3 text-indigo-600" />
              <div className="text-xs text-gray-500">Équipe</div>
            </div>
            <div className="text-sm font-bold text-gray-800">{globalStats.total}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <div className="text-xs text-gray-500">Encaissements</div>
            </div>
            <div className="text-sm font-bold text-emerald-600">{formatFCFA(encaissementsGlobal)}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <div className="text-xs text-gray-500">Décaissements</div>
            </div>
            <div className="text-sm font-bold text-red-600">{formatFCFA(globalStats.decaissementsTotal)}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-3 h-3 text-blue-600" />
              <div className="text-xs text-gray-500">Solde net</div>
            </div>
            <div className={`text-sm font-bold ${globalStats.soldeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatFCFA(globalStats.soldeNet)}
            </div>
          </div>
        </div>

        {/* RECHERCHE */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher caissier..."
              className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* TABLEAU OPTIMISÉ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-5">
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700">
              Caissiers ({filteredCaissiers.length})
            </h3>
            {search && (
              <span className="text-xs text-gray-500">
                {filteredCaissiers.length} résultat{filteredCaissiers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Caissier
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Encaissements
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Décaissements
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Solde net
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Fond d'ouverture
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCaissiers.map((caissier) => (
                <tr key={caissier.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{caissier.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getStatusIcon(caissier.status)}
                          <span className="text-xs text-gray-500">{caissier.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatFCFA(caissier.stats?.encaissementsTotal || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-red-600">
                      {formatFCFA(caissier.stats?.decaissementsTotal || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={`text-sm font-bold ${(caissier.stats?.soldeNet || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatFCFA(caissier.stats?.soldeNet || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatFCFA(caissier.stats?.fondOuverture || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewHistory(caissier)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded"
                      >
                        <Eye className="w-3 h-3" />
                        Détails
                      </button>
                      <button
                        onClick={() => handleFondOuverture(caissier)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded"
                      >
                        <Wallet className="w-3 h-3" />
                        Fond
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL D'HISTORIQUE */}
      {showHistory && selectedCaissier && (
        <CaissierHistoryModal
          employee={selectedCaissier}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* MODAL FOND D'OUVERTURE */}
      {showFondOuverture && selectedCaissier && (
        <FondOuvertureModal
          employee={selectedCaissier}
          isOpen={showFondOuverture}
          onClose={() => setShowFondOuverture(false)}
          onToast={toast}
        />
      )}
      
    </div>
  );
}
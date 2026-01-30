// ==========================================================
// 💰 CaissiersPage.jsx — Interface caissiers avec filtres
// ==========================================================

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  Banknote,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle,
  XCircle,
  User,
  Award,
  Activity,
  Eye,
  Target,
  Percent,
  DollarSign,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  BarChart3,
  Clock,
  AlertCircle,
} from "lucide-react";

// Composants
import CaissierHistoryModal from "../../components/roles/CaissierHistoryModal";

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
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadCaissiers = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const simulatedCaissiers = [
          {
            id: "CAIS-001",
            name: "Amadou Diallo",
            email: "a.diallo@lpd.sn",
            telephone: "77 123 45 67",
            status: "actif",
            date_embauche: "2024-01-15",
            lastActivity: new Date().toISOString(),
            stats: {
              encaissementsTotal: 4525000,
              decaissementsTotal: 1200000,
              soldeNet: 3325000,
              transactionsCount: 128,
              encaissementsCount: 98,
              decaissementsCount: 30,
              tauxErreur: 1.2,
              joursActifs: 28,
              objectifAtteint: 95,
            },
            badges: ["rapide", "précis", "fiable"],
          },
          {
            id: "CAIS-002",
            name: "Fatou Ba",
            email: "f.ba@lpd.sn",
            telephone: "76 234 56 78",
            status: "actif",
            date_embauche: "2024-02-10",
            lastActivity: new Date(Date.now() - 86400000).toISOString(),
            stats: {
              encaissementsTotal: 3215000,
              decaissementsTotal: 850000,
              soldeNet: 2365000,
              transactionsCount: 89,
              encaissementsCount: 65,
              decaissementsCount: 24,
              tauxErreur: 0.8,
              joursActifs: 25,
              objectifAtteint: 98,
            },
            badges: ["organisé", "vérifié"],
          },
          {
            id: "CAIS-003",
            name: "Ibrahima Sall",
            email: "i.sall@lpd.sn",
            telephone: "78 345 67 89",
            status: "actif",
            date_embauche: "2024-03-05",
            lastActivity: "2024-11-28",
            stats: {
              encaissementsTotal: 1678000,
              decaissementsTotal: 450000,
              soldeNet: 1228000,
              transactionsCount: 45,
              encaissementsCount: 32,
              decaissementsCount: 13,
              tauxErreur: 2.5,
              joursActifs: 15,
              objectifAtteint: 85,
            },
            badges: ["nouveau", "apprentissage"],
          },
          {
            id: "CAIS-004",
            name: "Aissatou Ndiaye",
            email: "a.ndiaye@lpd.sn",
            telephone: "70 456 78 90",
            status: "actif",
            date_embauche: "2024-04-20",
            lastActivity: new Date().toISOString(),
            stats: {
              encaissementsTotal: 5890000,
              decaissementsTotal: 2100000,
              soldeNet: 3790000,
              transactionsCount: 167,
              encaissementsCount: 125,
              decaissementsCount: 42,
              tauxErreur: 0.5,
              joursActifs: 30,
              objectifAtteint: 102,
            },
            badges: ["leader", "efficace", "expert"],
          },
        ];
        
        setCaissiers(simulatedCaissiers);
      } catch (error) {
        toast.error("Erreur de chargement des caissiers");
      } finally {
        setLoading(false);
      }
    };

    loadCaissiers();
  }, []);

  const filteredCaissiers = caissiers.filter(caissier => {
    if (search) {
      const terme = search.toLowerCase();
      if (!caissier.name.toLowerCase().includes(terme) &&
          !caissier.email.toLowerCase().includes(terme)) {
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
    transactionsTotal: caissiers.reduce((sum, v) => sum + (v.stats?.transactionsCount || 0), 0),
    tauxErreurMoyen: caissiers.length 
      ? caissiers.reduce((sum, v) => sum + (v.stats?.tauxErreur || 0), 0) / caissiers.length
      : 0,
    objectifMoyen: caissiers.length 
      ? caissiers.reduce((sum, v) => sum + (v.stats?.objectifAtteint || 0), 0) / caissiers.length
      : 0,
  };

  const handleViewHistory = (caissier) => {
    setSelectedCaissier(caissier);
    setShowHistory(true);
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
              {globalStats.total} caissiers • {globalStats.transactionsTotal} transactions
            </p>
          </div>
        </div>

        {/* STATISTIQUES COMPACTES */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
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
            <div className="text-sm font-bold text-emerald-600">{formatFCFA(globalStats.encaissementsTotal)}</div>
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

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3 h-3 text-orange-600" />
              <div className="text-xs text-gray-500">Taux erreur</div>
            </div>
            <div className="text-sm font-bold text-orange-600">{globalStats.tauxErreurMoyen.toFixed(1)}%</div>
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
                  Performance
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Transactions
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Encaissements
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Solde net
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
                    <div className="flex flex-col gap-1">
                      <div className={`text-xs font-medium px-2 py-0.5 rounded ${caissier.stats?.tauxErreur <= 1 ? 'bg-emerald-100 text-emerald-700' : caissier.stats?.tauxErreur <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {caissier.stats?.tauxErreur?.toFixed(1) || 0}% erreurs
                      </div>
                      <div className="text-xs text-gray-500">
                        {caissier.stats?.objectifAtteint || 0}% objectif
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">{caissier.stats?.transactionsCount || 0}</div>
                    <div className="text-xs text-gray-500">
                      {caissier.stats?.encaissementsCount || 0} enc. / {caissier.stats?.decaissementsCount || 0} déc.
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatFCFA(caissier.stats?.encaissementsTotal || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFCFA(caissier.stats?.decaissementsTotal || 0)} déc.
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={`text-sm font-bold ${(caissier.stats?.soldeNet || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatFCFA(caissier.stats?.soldeNet || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleViewHistory(caissier)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded"
                    >
                      <Eye className="w-3 h-3" />
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DASHBOARD COMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Classement */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1">
              <Award className="w-3 h-3 text-yellow-600" />
              Classement encaissements
            </h4>
            <TrendingUp className="w-3 h-3 text-yellow-600" />
          </div>
          <div className="space-y-1.5">
            {[...caissiers]
              .sort((a, b) => (b.stats?.encaissementsTotal || 0) - (a.stats?.encaissementsTotal || 0))
              .slice(0, 4)
              .map((caissier, index) => (
                <div key={caissier.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 text-xs font-bold rounded flex items-center justify-center
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-50 text-blue-600'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800 truncate max-w-[100px]">{caissier.name}</div>
                      <div className="text-[10px] text-gray-500">{caissier.stats?.tauxErreur?.toFixed(1) || 0}% erreurs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-emerald-600">
                      {formatFCFA(caissier.stats?.encaissementsTotal || 0)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Métriques */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-600" />
              Indicateurs clés
            </h4>
            <BarChart3 className="w-3 h-3 text-indigo-600" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Banknote className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-600">Tx moyenne</span>
              </div>
              <div className="text-sm font-bold text-blue-600">
                {formatFCFA(globalStats.transactionsTotal > 0 ? globalStats.encaissementsTotal / globalStats.transactionsTotal : 0)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-gray-600">Jours actifs</span>
              </div>
              <div className="text-sm font-bold text-purple-600">
                {Math.round(caissiers.reduce((sum, v) => sum + (v.stats?.joursActifs || 0), 0) / caissiers.length)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-emerald-600" />
                <span className="text-xs text-gray-600">Objectifs</span>
              </div>
              <div className="text-sm font-bold text-emerald-600">
                {globalStats.objectifMoyen.toFixed(0)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-orange-600" />
                <span className="text-xs text-gray-600">Erreur moy.</span>
              </div>
              <div className="text-sm font-bold text-orange-600">
                {globalStats.tauxErreurMoyen.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Distribution erreurs */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1">
              <Target className="w-3 h-3 text-purple-600" />
              Distribution erreurs
            </h4>
            <TrendingDown className="w-3 h-3 text-purple-600" />
          </div>
          <div className="space-y-2">
            {['0-0.5%', '0.6-1%', '1.1-2%', '>2%'].map((range, idx) => {
              const count = caissiers.filter(c => {
                const taux = c.stats?.tauxErreur || 0;
                if (range === '0-0.5%') return taux <= 0.5;
                if (range === '0.6-1%') return taux > 0.5 && taux <= 1;
                if (range === '1.1-2%') return taux > 1 && taux <= 2;
                return taux > 2;
              }).length;
              
              const percentage = (count / caissiers.length) * 100;
              
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{range}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
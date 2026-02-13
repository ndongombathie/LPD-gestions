// ==========================================================
// 🏪 GestionnairesBoutiquePage.jsx — Interface gestionnaires boutique avec filtres
// ==========================================================

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  Package,
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
  Store,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  BarChart3,
  Clock,
  AlertCircle,
  ShoppingBag,
  Box,
  Layers,
  CheckSquare,
} from "lucide-react";

// Composants
import GestionnaireBoutiqueHistoryModal from "../../components/roles/GestionnaireBoutiqueHistoryModal";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function GestionnairesBoutiquePage() {
  const [loading, setLoading] = useState(true);
  const [gestionnaires, setGestionnaires] = useState([]);
  const [selectedGestionnaire, setSelectedGestionnaire] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadGestionnaires = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const simulatedGestionnaires = [
          {
            id: "GB-001",
            name: "Mohamed Diallo",
            email: "m.diallo@lpd.sn",
            telephone: "77 123 45 67",
            status: "actif",
            boutique: "Boutique Centre Ville",
            date_embauche: "2024-01-15",
            lastActivity: new Date().toISOString(),
            stats: {
              produitsGerés: 245,
              transfertsReçus: 18,
              transfertsEnvoyes: 7,
              ajustementsEffectues: 12,
              inventairesComplets: 4,
              anomaliesDetectees: 3,
              tauxValidation: 98.5,
              stockMoyenValeur: 4500000,
              joursActifs: 28,
              objectifAtteint: 95,
            },
            badges: ["expert-stock", "organisé", "détail-orienté"],
          },
          {
            id: "GB-002",
            name: "Fatou Bâ",
            email: "f.ba@lpd.sn",
            telephone: "76 234 56 78",
            status: "actif",
            boutique: "Boutique Université",
            date_embauche: "2024-02-10",
            lastActivity: new Date(Date.now() - 86400000).toISOString(),
            stats: {
              produitsGerés: 189,
              transfertsReçus: 15,
              transfertsEnvoyes: 5,
              ajustementsEffectues: 8,
              inventairesComplets: 3,
              anomaliesDetectees: 1,
              tauxValidation: 99.2,
              stockMoyenValeur: 3200000,
              joursActifs: 25,
              objectifAtteint: 102,
            },
            badges: ["rapide", "précis"],
          },
          {
            id: "GB-003",
            name: "Ibrahima Sow",
            email: "i.sow@lpd.sn",
            telephone: "78 345 67 89",
            status: "actif",
            boutique: "Boutique Plateau",
            date_embauche: "2024-03-05",
            lastActivity: "2024-11-28",
            stats: {
              produitsGerés: 156,
              transfertsReçus: 9,
              transfertsEnvoyes: 4,
              ajustementsEffectues: 6,
              inventairesComplets: 2,
              anomaliesDetectees: 5,
              tauxValidation: 94.3,
              stockMoyenValeur: 2100000,
              joursActifs: 15,
              objectifAtteint: 85,
            },
            badges: ["nouveau", "apprentissage"],
          },
          {
            id: "GB-004",
            name: "Aminata Ndiaye",
            email: "a.ndiaye@lpd.sn",
            telephone: "70 456 78 90",
            status: "actif",
            boutique: "Boutique Almadies",
            date_embauche: "2024-04-20",
            lastActivity: new Date().toISOString(),
            stats: {
              produitsGerés: 312,
              transfertsReçus: 24,
              transfertsEnvoyes: 11,
              ajustementsEffectues: 15,
              inventairesComplets: 6,
              anomaliesDetectees: 2,
              tauxValidation: 99.8,
              stockMoyenValeur: 5800000,
              joursActifs: 30,
              objectifAtteint: 108,
            },
            badges: ["leader", "efficace", "expert-inventaire"],
          },
        ];
        
        setGestionnaires(simulatedGestionnaires);
      } catch (error) {
        toast.error("Erreur de chargement des gestionnaires");
      } finally {
        setLoading(false);
      }
    };

    loadGestionnaires();
  }, []);

  const filteredGestionnaires = gestionnaires.filter(gestionnaire => {
    if (search) {
      const terme = search.toLowerCase();
      if (!gestionnaire.name.toLowerCase().includes(terme) &&
          !gestionnaire.email.toLowerCase().includes(terme) &&
          !gestionnaire.boutique.toLowerCase().includes(terme)) {
        return false;
      }
    }
    
    return true;
  });

  const globalStats = {
    total: gestionnaires.length,
    produitsGerésTotal: gestionnaires.reduce((sum, v) => sum + (v.stats?.produitsGerés || 0), 0),
    transfertsReçusTotal: gestionnaires.reduce((sum, v) => sum + (v.stats?.transfertsReçus || 0), 0),
    ajustementsTotal: gestionnaires.reduce((sum, v) => sum + (v.stats?.ajustementsEffectues || 0), 0),
    inventairesTotal: gestionnaires.reduce((sum, v) => sum + (v.stats?.inventairesComplets || 0), 0),
    anomaliesTotal: gestionnaires.reduce((sum, v) => sum + (v.stats?.anomaliesDetectees || 0), 0),
    tauxValidationMoyen: gestionnaires.length 
      ? gestionnaires.reduce((sum, v) => sum + (v.stats?.tauxValidation || 0), 0) / gestionnaires.length
      : 0,
    stockValeurMoyen: gestionnaires.length 
      ? gestionnaires.reduce((sum, v) => sum + (v.stats?.stockMoyenValeur || 0), 0) / gestionnaires.length
      : 0,
    objectifMoyen: gestionnaires.length 
      ? gestionnaires.reduce((sum, v) => sum + (v.stats?.objectifAtteint || 0), 0) / gestionnaires.length
      : 0,
  };

  const handleViewHistory = (gestionnaire) => {
    setSelectedGestionnaire(gestionnaire);
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
            <h2 className="text-base font-bold text-gray-800">Équipe Gestionnaires Boutique</h2>
            <p className="text-xs text-gray-500 mt-1">
              {globalStats.total} gestionnaires • {globalStats.produitsGerésTotal} produits gérés
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
              <Package className="w-3 h-3 text-blue-600" />
              <div className="text-xs text-gray-500">Produits gérés</div>
            </div>
            <div className="text-sm font-bold text-blue-600">{globalStats.produitsGerésTotal}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <div className="text-xs text-gray-500">Transferts reçus</div>
            </div>
            <div className="text-sm font-bold text-emerald-600">{globalStats.transfertsReçusTotal}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-3 h-3 text-purple-600" />
              <div className="text-xs text-gray-500">Taux validation</div>
            </div>
            <div className="text-sm font-bold text-purple-600">{globalStats.tauxValidationMoyen.toFixed(1)}%</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3 h-3 text-orange-600" />
              <div className="text-xs text-gray-500">Objectifs</div>
            </div>
            <div className="text-sm font-bold text-orange-600">{globalStats.objectifMoyen.toFixed(0)}%</div>
          </div>
        </div>

        {/* RECHERCHE */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher gestionnaire, boutique, email..."
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
              Gestionnaires ({filteredGestionnaires.length})
            </h3>
            {search && (
              <span className="text-xs text-gray-500">
                {filteredGestionnaires.length} résultat{filteredGestionnaires.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Gestionnaire
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Performance
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Activités
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Validation
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGestionnaires.map((gestionnaire) => (
                <tr key={gestionnaire.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{gestionnaire.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getStatusIcon(gestionnaire.status)}
                          <span className="text-xs text-gray-500">{gestionnaire.boutique}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <div className={`text-xs font-medium px-2 py-0.5 rounded ${gestionnaire.stats?.objectifAtteint >= 100 ? 'bg-emerald-100 text-emerald-700' : gestionnaire.stats?.objectifAtteint >= 90 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {gestionnaire.stats?.objectifAtteint || 0}% objectif
                      </div>
                      <div className="text-xs text-gray-500">
                        {gestionnaire.stats?.joursActifs || 0} jours actifs
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">{gestionnaire.stats?.produitsGerés || 0}</div>
                    <div className="text-xs text-gray-500">
                      {gestionnaire.stats?.transfertsReçus || 0} transf. • {gestionnaire.stats?.ajustementsEffectues || 0} ajust.
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-blue-600">
                      {formatFCFA(gestionnaire.stats?.stockMoyenValeur || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {gestionnaire.stats?.anomaliesDetectees || 0} anomalies
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, gestionnaire.stats?.tauxValidation || 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {gestionnaire.stats?.tauxValidation?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleViewHistory(gestionnaire)}
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



      {/* MODAL D'HISTORIQUE */}
      {showHistory && selectedGestionnaire && (
        <GestionnaireBoutiqueHistoryModal
          employee={selectedGestionnaire}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
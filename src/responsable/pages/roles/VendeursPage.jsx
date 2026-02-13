// ==========================================================
// 📊 VendeursPage.jsx — Version compacte pour intégration
// ==========================================================

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle,
  User,
  Award,
  Activity,
  Eye,
  Target,
  Percent,
  Package,
  Users as Clients,
  Crown,
  Medal,
  BarChart3,
  Calendar,
  TrendingDown,
} from "lucide-react";

// Composants
import VendeurHistoryModal from "../../components/roles/VendeurHistoryModal";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function VendeursPage() {
  const [loading, setLoading] = useState(true);
  const [vendeurs, setVendeurs] = useState([]);
  const [selectedVendeur, setSelectedVendeur] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadVendeurs = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const simulatedVendeurs = [
          {
            id: "VEN-001",
            name: "Mohamed Diarra",
            email: "m.diarra@lpd.sn",
            telephone: "77 123 45 67",
            status: "actif",
            date_embauche: "2024-01-15",
            lastActivity: new Date().toISOString(),
            stats: {
              totalVentes: 128,
              montantTotal: 4525000,
              tauxReussite: 94.5,
              ticketMoyen: 35351,
              produitsVendus: 890,
              clientsServis: 215,
              ventesMois: 45,
              croissance: 12.5,
              joursActifs: 28,
              objectifAtteint: 92,
            },
            badges: ["top-seller", "client-satisfaction", "rapide"],
          },
          {
            id: "VEN-002",
            name: "Fatou Ndiaye",
            email: "f.ndiaye@lpd.sn",
            telephone: "76 234 56 78",
            status: "actif",
            date_embauche: "2024-02-10",
            lastActivity: new Date(Date.now() - 86400000).toISOString(),
            stats: {
              totalVentes: 89,
              montantTotal: 3215000,
              tauxReussite: 96.2,
              ticketMoyen: 36124,
              produitsVendus: 567,
              clientsServis: 178,
              ventesMois: 32,
              croissance: 8.3,
              joursActifs: 25,
              objectifAtteint: 85,
            },
            badges: ["fidélisation", "up-sell"],
          },
          {
            id: "VEN-003",
            name: "Ibrahima Sow",
            email: "i.sow@lpd.sn",
            telephone: "78 345 67 89",
            status: "actif",
            date_embauche: "2024-03-05",
            lastActivity: "2024-11-28",
            stats: {
              totalVentes: 45,
              montantTotal: 1678000,
              tauxReussite: 88.3,
              ticketMoyen: 37289,
              produitsVendus: 312,
              clientsServis: 98,
              ventesMois: 18,
              croissance: -5.2,
              joursActifs: 15,
              objectifAtteint: 67,
            },
            badges: ["nouveau"],
          },
          {
            id: "VEN-004",
            name: "Aminata Fall",
            email: "a.fall@lpd.sn",
            telephone: "70 456 78 90",
            status: "actif",
            date_embauche: "2024-04-20",
            lastActivity: new Date().toISOString(),
            stats: {
              totalVentes: 167,
              montantTotal: 5890000,
              tauxReussite: 97.1,
              ticketMoyen: 35269,
              produitsVendus: 1102,
              clientsServis: 342,
              ventesMois: 56,
              croissance: 24.7,
              joursActifs: 30,
              objectifAtteint: 104,
            },
            badges: ["top-seller", "leader", "efficace"],
          },
          {
            id: "VEN-005",
            name: "Ousmane Kane",
            email: "o.kane@lpd.sn",
            telephone: "77 567 89 01",
            status: "actif",
            date_embauche: "2024-05-12",
            lastActivity: new Date().toISOString(),
            stats: {
              totalVentes: 112,
              montantTotal: 3980000,
              tauxReussite: 91.8,
              ticketMoyen: 35536,
              produitsVendus: 745,
              clientsServis: 189,
              ventesMois: 39,
              croissance: 15.6,
              joursActifs: 27,
              objectifAtteint: 88,
            },
            badges: ["consistant", "ponctuel"],
          },
        ];
        
        setVendeurs(simulatedVendeurs);
      } catch (error) {
        toast.error("Erreur de chargement des vendeurs");
      } finally {
        setLoading(false);
      }
    };

    loadVendeurs();
  }, []);

  const filteredVendeurs = vendeurs.filter(vendeur => {
    if (search) {
      const terme = search.toLowerCase();
      if (!vendeur.name.toLowerCase().includes(terme) &&
          !vendeur.email.toLowerCase().includes(terme)) {
        return false;
      }
    }
    
    return true;
  });

  const globalStats = {
    total: vendeurs.length,
    totalVentes: vendeurs.reduce((sum, v) => sum + (v.stats?.totalVentes || 0), 0),
    totalChiffre: vendeurs.reduce((sum, v) => sum + (v.stats?.montantTotal || 0), 0),
    tauxMoyen: vendeurs.length 
      ? vendeurs.reduce((sum, v) => sum + (v.stats?.tauxReussite || 0), 0) / vendeurs.length
      : 0,
    croissanceMoyenne: vendeurs.length 
      ? vendeurs.reduce((sum, v) => sum + (v.stats?.croissance || 0), 0) / vendeurs.length
      : 0,
    objectifMoyen: vendeurs.length 
      ? vendeurs.reduce((sum, v) => sum + (v.stats?.objectifAtteint || 0), 0) / vendeurs.length
      : 0,
  };

  const handleViewHistory = (vendeur) => {
    setSelectedVendeur(vendeur);
    setShowHistory(true);
  };

  const getStatusIcon = (status) => {
    return <CheckCircle className="w-3 h-3 text-emerald-500" />;
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
            <h2 className="text-base font-bold text-gray-800">Équipe Vendeurs</h2>
            <p className="text-xs text-gray-500 mt-1">
              {globalStats.total} vendeurs • {globalStats.totalVentes} ventes
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
              <ShoppingCart className="w-3 h-3 text-emerald-600" />
              <div className="text-xs text-gray-500">Chiffre</div>
            </div>
            <div className="text-sm font-bold text-emerald-600">{formatFCFA(globalStats.totalChiffre)}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              <div className="text-xs text-gray-500">Performance</div>
            </div>
            <div className="text-sm font-bold text-purple-600">{globalStats.tauxMoyen.toFixed(1)}%</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-blue-600" />
              <div className="text-xs text-gray-500">Croissance</div>
            </div>
            <div className={`text-sm font-bold ${globalStats.croissanceMoyenne >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {globalStats.croissanceMoyenne >= 0 ? '+' : ''}{globalStats.croissanceMoyenne.toFixed(1)}%
            </div>
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
              placeholder="Rechercher vendeur..."
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
              Vendeurs ({filteredVendeurs.length})
            </h3>
            {search && (
              <span className="text-xs text-gray-500">
                {filteredVendeurs.length} résultat{filteredVendeurs.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendeur
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Perf.
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Ventes
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Chiffre
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Taux
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendeurs.map((vendeur) => (
                <tr key={vendeur.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{vendeur.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getStatusIcon(vendeur.status)}
                          <span className="text-xs text-gray-500">{vendeur.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={`text-xs font-medium px-2 py-1 rounded ${vendeur.stats?.croissance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {vendeur.stats?.croissance >= 0 ? '+' : ''}{vendeur.stats?.croissance?.toFixed(1) || 0}%
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">{vendeur.stats?.totalVentes || 0}</div>
                    <div className="text-xs text-gray-500">
                      {vendeur.stats?.clientsServis || 0} clients
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatFCFA(vendeur.stats?.montantTotal || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, vendeur.stats?.tauxReussite || 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {vendeur.stats?.tauxReussite?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleViewHistory(vendeur)}
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
      {showHistory && selectedVendeur && (
        <VendeurHistoryModal
          employee={selectedVendeur}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
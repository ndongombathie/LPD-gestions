// ==========================================================
// 📊 VendeursPage.jsx — Version compacte pour intégration
// ==========================================================

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Search,
  CheckCircle,
  User,
  Eye,
  Calendar,
} from "lucide-react";

// Composants
import VendeurHistoryModal from "../../components/roles/VendeurHistoryModal";
import Pagination from "@/responsable/components/Pagination";
import { journalResponsableAPI } from "@/services/api/JournalResponsable";

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
  const [totalVendeurs, setTotalVendeurs] = useState(0);
  
  // ✅ Stats globales (indépendantes de la pagination)
  const [statsGlobales, setStatsGlobales] = useState({
    total_ventes: 0,
    total_chiffre: 0,
  });
  
  // Filtres de période
const [dateDebut, setDateDebut] = useState("");
const [dateFin, setDateFin] = useState("");
  
  // ✅ Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Reset page quand les filtres de période changent (search exclu)
  useEffect(() => {
    setPage(1);
  }, [dateDebut, dateFin]);

  // ✅ useEffect avec pagination (search exclu des dépendances)
  useEffect(() => {
    const loadVendeurs = async () => {
      try {
        setLoading(true);

const response = await journalResponsableAPI.getVendeurs({
  page: page,
  ...(dateDebut && { date_debut: dateDebut }),
  ...(dateFin && { date_fin: dateFin }),
});

        const pagination = response?.total_ventes;

        setVendeurs(pagination?.data || []);
        setTotalPages(pagination?.last_page || 1);
        setTotalVendeurs(pagination?.total || 0);
        
        // ✅ Récupération des stats globales
        setStatsGlobales({
          total_ventes: pagination?.total || 0,
          total_chiffre: response?.somme_total_encaisses || 0,
        });

      } catch (error) {
        toast.error("Erreur de chargement des vendeurs");
        setVendeurs([]);
      } finally {
        setLoading(false);
      }
    };

    loadVendeurs();
  }, [dateDebut, dateFin, page]); // search retiré des dépendances

  // ✅ Filtrer les vendeurs côté front
  const filteredVendeurs = vendeurs.filter((v) => {
    const fullName = `${v.vendeur?.prenom || ""} ${v.vendeur?.nom || ""}`.toLowerCase();
    const email = (v.vendeur?.email || "").toLowerCase();
    const term = search.toLowerCase();

    return fullName.includes(term) || email.includes(term);
  });

  // ✅ Statistiques globales (indépendantes de la pagination)
  const globalStats = {
    total: totalVendeurs,
    totalVentes: statsGlobales.total_ventes,
    totalChiffre: statsGlobales.total_chiffre,
  };

  const handleViewHistory = (vendeur) => {
    setSelectedVendeur(vendeur);
    setShowHistory(true);
  };

  const getStatusIcon = (status) => {
    return <CheckCircle className="w-3 h-3 text-emerald-500" />;
  };

  if (loading && vendeurs.length === 0) {
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
              {totalVendeurs} vendeur{totalVendeurs > 1 ? 's' : ''} au total • {filteredVendeurs.length} affiché{filteredVendeurs.length > 1 ? 's' : ''} • {globalStats.totalVentes} ventes
            </p>
          </div>
        </div>

        {/* FILTRE DE PÉRIODE */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">Période :</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
              />
              <span className="text-xs text-gray-500">au</span>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* STATISTIQUES COMPACTES */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3 h-3 text-indigo-600" />
              <div className="text-xs text-gray-500">Équipe</div>
            </div>
            <div className="text-sm font-bold text-gray-800">{totalVendeurs}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-3 h-3 text-emerald-600" />
              <div className="text-xs text-gray-500">Chiffre</div>
            </div>
            <div className="text-sm font-bold text-emerald-600">{formatFCFA(globalStats.totalChiffre)}</div>
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
                  Ventes
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Chiffre
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendeurs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-sm text-gray-500">
                    {vendeurs.length === 0 ? "Aucun vendeur trouvé pour cette période" : "Aucun vendeur ne correspond à votre recherche"}
                  </td>
                </tr>
              )}
              {filteredVendeurs.map((vendeur) => (
                <tr key={vendeur.vendeur_id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {vendeur.vendeur?.prenom} {vendeur.vendeur?.nom}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getStatusIcon(vendeur.vendeur?.role)}
                          <span className="text-xs text-gray-500">
                            {vendeur.vendeur?.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">{vendeur.total_ventes || 0}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatFCFA(vendeur.total_encaisses || 0)}
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

      {/* ✅ PAGINATION (uniquement si nécessaire) */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}

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
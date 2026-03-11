// ==========================================================
// 💰 CaissiersPage.jsx — Interface caissiers avec filtres et pagination
// ==========================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // ← AJOUT AnimatePresence
import {
  Users,
  Banknote,
  TrendingUp,
  TrendingDown,
  Search,
  User,
  Eye,
  Wallet,
  Calendar,
} from "lucide-react";

// Composants
import CaissierHistoryModal from "../../components/roles/CaissierHistoryModal";
import FondOuvertureModal from "../../components/roles/FondOuvertureModal";
import Pagination from "@/responsable/components/Pagination";
import { journalResponsableAPI } from "@/responsable/services/api/JournalResponsable";

// ==========================================================
// 🌀 Mini Loader LPD (Top Right) - AJOUTÉ
// ==========================================================
const LPDLoader = ({ visible }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="fixed top-20 right-8 z-50"
    >
      <div className="relative w-14 h-14">
        {/* Cercle animé externe */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
          }}
          className="absolute inset-0 rounded-full border-2 border-t-[#F58020] border-r-transparent border-b-[#472EAD] border-l-transparent"
        />

        {/* Cercle interne */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
          className="absolute inset-2 rounded-full bg-[#472EAD] flex items-center justify-center shadow-lg"
        >
          <span className="text-[11px] font-black text-[#F58020] tracking-wider">
            LPD
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function CaissiersPage() {
  const [isFetching, setIsFetching] = useState(true); // ← UN SEUL ÉTAT POUR LE CHARGEMENT
  const [caissiers, setCaissiers] = useState([]);
  const [selectedCaissier, setSelectedCaissier] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFondOuverture, setShowFondOuverture] = useState(false);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  
  // ✅ Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // ✅ Stats globales (indépendantes de la pagination)
  const [statsGlobales, setStatsGlobales] = useState({
    encaissements: 0,
    decaissements: 0,
    solde_net: 0,
    caissiers_count: 0
  });

  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const toast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  // ✅ Reset page quand les dates changent
  useEffect(() => {
    setPage(1);
  }, [dateDebut, dateFin]);

  // ✅ Chargement des caissiers avec pagination et filtres de date
  useEffect(() => {
    const loadCaissiers = async () => {
      try {
        setIsFetching(true); // ← ACTIVE LE LOADER

        const response = await journalResponsableAPI.getCaissiers({
          page: page,
          ...(dateDebut && { date_debut: dateDebut }),
          ...(dateFin && { date_fin: dateFin }),
        });

        // ✅ Pagination
        setCaissiers(response.journals.data || []);
        setTotalPages(response.journals.last_page || 1);

        // ✅ Stats globales venant du backend
        setStatsGlobales(response.stats || {
          encaissements: 0,
          decaissements: 0,
          solde_net: 0,
          caissiers_count: 0
        });

      } catch (error) {
        setCaissiers([]);
      } finally {
        setIsFetching(false); // ← DÉSACTIVE LE LOADER
      }
    };

    loadCaissiers();
  }, [dateDebut, dateFin, page]);

  // ✅ Recherche 100% front avec useMemo
  const filteredCaissiers = useMemo(() => {
    const term = search.toLowerCase();

    return caissiers.filter((c) => {
      const prenom = (c.caissier?.prenom || "").toLowerCase();
      const nom = (c.caissier?.nom || "").toLowerCase();
      const email = (c.caissier?.email || "").toLowerCase();
      const fullName = `${prenom} ${nom}`;

      return fullName.includes(term) || email.includes(term);
    });
  }, [caissiers, search]);

  // ✅ Statistiques globales (indépendantes de la pagination)
  const globalStats = {
    total: statsGlobales.caissiers_count || 0,
    encaissementsTotal: statsGlobales.encaissements || 0,
    decaissementsTotal: statsGlobales.decaissements || 0,
    soldeNet: statsGlobales.solde_net || 0,
  };

  const handleViewHistory = (caissier) => {
    setSelectedCaissier(caissier);
    setShowHistory(true);
  };

  const handleFondOuverture = (caissier) => {
    setSelectedCaissier(caissier);
    setShowFondOuverture(true);
  };

  return (
    <>
      {/* 🌀 Loader LPD subtil en haut à droite - POUR TOUS LES CHARGEMENTS */}
      <AnimatePresence>
        <LPDLoader visible={isFetching} />
      </AnimatePresence>

      <div className="w-full">
        {/* EN-TÊTE COMPACT */}
        <div className="mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-800">Équipe Caissiers</h2>
              <p className="text-xs text-gray-500 mt-1">
                {globalStats.total} caissier{globalStats.total > 1 ? 's' : ''} au total • {filteredCaissiers.length} affiché{filteredCaissiers.length > 1 ? 's' : ''}
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
              <div className="text-sm font-bold text-emerald-600">
                {formatFCFA(globalStats.encaissementsTotal)}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <div className="text-xs text-gray-500">Décaissements</div>
              </div>
              <div className="text-sm font-bold text-red-600">
                {formatFCFA(globalStats.decaissementsTotal)}
              </div>
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
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCaissiers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-sm text-gray-500">
                      {caissiers.length === 0 ? "Aucun caissier trouvé pour cette période" : "Aucun caissier ne correspond à votre recherche"}
                    </td>
                  </tr>
                )}
                {filteredCaissiers.map((caissier) => (
                  <tr key={caissier.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {caissier.caissier?.prenom} {caissier.caissier?.nom}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {caissier.caissier?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-emerald-600">
                        {formatFCFA(caissier.total_encaissements || 0)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-red-600">
                        {formatFCFA(caissier.total_decaissements || 0)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className={`text-sm font-bold ${(caissier.solde_theorique || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatFCFA(caissier.solde_theorique || 0)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatFCFA(caissier.fond_ouverture || 0)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(caissier.created_at).toLocaleDateString()}
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

        {/* ✅ PAGINATION BACKEND (uniquement si nécessaire) */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}

        {/* MODAL D'HISTORIQUE */}
        {showHistory && selectedCaissier && (
          <CaissierHistoryModal
            employee={selectedCaissier}
            date={selectedCaissier.created_at}
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
        
        {/* TOASTS */}
        <div className="fixed top-5 right-5 z-[9999] space-y-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
                t.type === "success"
                  ? "bg-emerald-600"
                  : t.type === "error"
                  ? "bg-red-600"
                  : "bg-gray-800"
              }`}
            >
              <div className="font-semibold">{t.title}</div>
              <div>{t.message}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
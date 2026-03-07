// ==========================================================
// 👥 Utilisateurs.jsx — Interface Responsable (LPD Manager)
// Version Responsable = CONSULTATION SEULEMENT (lecture seule)
// Connecté à l'API Laravel (/api/users)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import { utilisateursAPI } from '@/services/api';
import Pagination from "../components/Pagination.jsx";

const ROLES = [
  "Vendeur",
  "Caissier",
  "Comptable",
  "Gestionnaire Dépôt",
  "Gestionnaire Boutique",
  "Responsable",
];

const ROLE_LABELS = {
  vendeur: "Vendeur",
  caissier: "Caissier",
  comptable: "Comptable",
  gestionnaire_depot: "Gestionnaire Dépôt",
  gestionnaire_boutique: "Gestionnaire Boutique",
  responsable: "Responsable",
};

const getRoleKeyFromLabel = (label) =>
  Object.keys(ROLE_LABELS).find(
    (key) => ROLE_LABELS[key] === label
  );

// ————————————————————————————————————————————————
// ✅ Toasts de notification
// ————————————————————————————————————————————————
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[120] space-y-2">
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`min-w-[280px] max-w-[360px] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 backdrop-blur-sm ${
            t.type === "success"
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
              : "bg-rose-50/95 border-rose-200 text-rose-800"
          }`}
        >
          <div className="pt-0.5">
            {t.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{t.title}</div>
            {t.message && (
              <div className="text-xs mt-0.5 opacity-90">
                {t.message}
              </div>
            )}
          </div>
          <button
            className="opacity-60 hover:opacity-100"
            onClick={() => remove(t.id)}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// ————————————————————————————————————————————————
// ✅ Page principale (lecture seule, API réelle)
// ————————————————————————————————————————————————
export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [previousRole, setPreviousRole] = useState("Tous");


  const [searchInput, setSearchInput] = useState(""); // État temporaire pour l'input
   // État final pour l'API
  const [filterRole, setFilterRole] = useState("Tous");
  const [toasts, setToasts] = useState([]);
  // Pagination backend
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);

  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const toast = React.useCallback((type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  // Réinitialiser la page quand le filtre change
useEffect(() => {
  setPage(1);
}, [filterRole, searchInput]);

  // Debounce pour la recherche : attendre que l'utilisateur arrête de taper
  // ET réinitialiser la page en même temps


  // Chargement des utilisateurs depuis l'API
useEffect(() => {
  const fetchUsers = async () => {
    // ✅ Loader plein écran UNIQUEMENT au premier chargement
    if (initialLoad) {
      setLoading(true);
    } else {
      setLoadingPage(true);
    }

    try {
      const params = {
        page,
        search: searchInput || undefined,
        role:
          filterRole !== "Tous"
            ? getRoleKeyFromLabel(filterRole)
            : undefined,
      };

      const data = await utilisateursAPI.getAll(params);

      const total = data.total || 0;
      const perPage = data.per_page || 20;

      setTotalItems(total);
      setTotalPages(Math.ceil(total / perPage));

      const rawUsers = data.data || [];

      const normalized = rawUsers.map((u) => ({
        id: u.id,
        prenom: u.prenom || "",
        nom: u.nom || "",
        email: u.email || "",
        tel: u.telephone || "",
        adresse: u.adresse || "",
        cni: u.numero_cni || "",
        role: ROLE_LABELS[u.role] || u.role || "",
      }));

      setUsers(normalized);
    } catch (err) {
      toast(
        "error",
        "Erreur",
        "Impossible de charger la liste des utilisateurs."
      );
    } finally {
      setLoading(false);
      setLoadingPage(false);
      setInitialLoad(false); // ✅ très important
    }
  };

  fetchUsers();
}, [page, filterRole, searchInput, toast]);

  // Statistiques simples
  const stats = useMemo(() => ({
    total: totalItems,
  }), [totalItems]);

  // ————————————————————————————————————————————————
  // ⏳ Loader harmonisé
  // ————————————————————————————————————————————————
// Loader d'affichage initial - UNIQUEMENT au premier chargement
if (initialLoad && loading && users.length === 0) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
        <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
        <span className="text-sm font-medium text-[#472EAD]">
          Chargement des utilisateurs...
        </span>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8"> {/* Changé de space-y-7 à space-y-8 */}
        
        {/* HEADER avec badge intégré */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-8"
        >
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Utilisateurs — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Gestion des utilisateurs
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Consultation des profils (vendeurs, caissiers, gestionnaires) et
                export de la liste du personnel.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Vue en lecture seule • {stats.total} utilisateur
              {stats.total > 1 && "s"} enregistrés
            </p>
          </div>

          {/* BADGE TOTAL aligné à droite au même niveau */}
          <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#E4E0FF] shadow-sm hover:shadow transition-shadow duration-200">
              <span className="h-2 w-2 rounded-full bg-[#472EAD] animate-pulse" />
              <span className="text-xs text-gray-600">
                Total : <span className="font-semibold text-[#472EAD]">{stats.total}</span>
              </span>
            </div>
          </div>
        </motion.header>

        {/* RECHERCHE + FILTRE + TABLEAU */}
        <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-4 sm:py-5 space-y-4">
          
          {/* Barre de recherche + Filtre */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 🔍 Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
              />
            </div>

            {/* 🎯 Filtre par rôle */}
            <div className="flex items-center gap-2 sm:w-56 relative">              
              <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                Filtrer par rôle
              </span>
                <select
                  disabled={loadingRole}
                  className="flex-1 border border-gray-300 rounded-xl text-sm px-3 py-2.5 bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] disabled:opacity-60"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >

                <option>Tous</option>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
                  {loadingRole && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#472EAD]" />
                )}
            </div>
          </div>

          {/* Résumé affichage */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
            <span>
              Affichage :{" "}
              <span className="font-semibold">{users.length}</span> sur{" "}
              <span className="font-semibold">{stats.total}</span>
            </span>
            <span>
              Page <span className="font-semibold">{page}</span> /{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
          </div>

          {/* TABLE (lecture seule, aucune action) */}
          <div className="mt-2">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
                <Search className="w-8 h-8 mb-3 opacity-60" />
                <p className="text-sm font-medium">
                  Aucun utilisateur trouvé
                </p>
                <p className="text-xs mt-1">
                  Essayez de modifier votre recherche ou vos filtres.
                </p>
              </div>
            ) : (
              <>


                <DataTable
                  columns={[
                    {
                      label: "Nom complet",
                      key: "prenom",
                      render: (_, r) => `${r.prenom} ${r.nom}`,
                    },
                    { label: "Email", key: "email" },
                    { label: "Téléphone", key: "tel" },
                    { label: "Adresse", key: "adresse" },
                    { label: "Rôle", key: "role" },
                  ]}
                  data={users}
                  actions={[]}
                />

                {loadingPage && (
                  <div className="flex justify-center py-2 text-xs text-gray-400 mt-2">
                    Chargement de la page...
                  </div>
                )}
                
                <div className="mt-6">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(p) => {
                      if (p < 1 || p > totalPages) return;
                      if (p === page) return;
                      if (loadingPage) return;
                      setPage(p);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* TOASTS */}
        <Toasts toasts={toasts} remove={removeToast} />
      </div>
    </div>
  );
}
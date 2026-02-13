// ==========================================================
// 🧾 JournalActivites.jsx — Version alignée avec l'architecture
// - Affichage des sous-pages des rôles DANS JournalActivites
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ShoppingCart,
  Banknote,
  Store,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// Import des sous-pages des rôles
import VendeursPage from "./roles/VendeursPage.jsx";
import CaissiersPage from "./roles/CaissiersPage.jsx";
import GestionnairesBoutiquePage from "./roles/GestionnairesBoutiquePage.jsx";

const todayISO = () => new Date().toISOString().slice(0, 10);

// ==========================================================
// 🧩 Helpers
// ==========================================================
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const parseLogDate = (dateStr) => {
  const onlyDate = dateStr?.slice(0, 10);
  return new Date(onlyDate);
};

// Profils suivis par le journal
const ROLE_CARDS = [
  {
    id: "vendeur",
    label: "Vendeurs",
    description: "Ventes, paniers, annulations",
    icon: ShoppingCart,
    color: "emerald",
  },
  {
    id: "caissier",
    label: "Caissiers",
    description: "Encaissements, décaissements",
    icon: Banknote,
    color: "amber",
  },
  {
    id: "gestionnaire_boutique",
    label: "Gestionnaire Boutique",
    description: "Stock et réappro",
    icon: Store,
    color: "blue",
  },
];

// Types d'action
const ACTION_TYPES = [
  "Tous",
  "connexion",
  "creation",
  "modification",
  "suppression",
  "vente",
  "encaissement",
  "decaissement",
  "reappro",
  "stock",
  "inventaire",
  "ajustement",
  "rapport",
  "audit",
];

// Modules
const MODULES = [
  "Tous",
  "VENTE",
  "CAISSE",
  "STOCK_BOUTIQUE",
  "DECAISSEMENT",
  "UTILISATEURS",
];

const MODULE_LABELS = {
  Tous: "Tous les modules",
  VENTE: "Vente",
  CAISSE: "Caisse",
  STOCK_BOUTIQUE: "Stock boutique",
  DECAISSEMENT: "Décaissement",
  UTILISATEURS: "Utilisateurs",
};

// ==========================================================
// 🧮 Calcul des statistiques
// ==========================================================
function computeStatsForRole(logs, activeRole) {
  const totalEvents = logs.length;

  const sumByType = (type) =>
    logs.reduce(
      (sum, l) =>
        sum + (l.type === type ? Number(l.montant || 0) || 0 : 0),
      0
    );

  const ventes = logs.filter((l) => l.type === "vente");
  const encaissements = logs.filter((l) => l.type === "encaissement");
  const decaissements = logs.filter((l) => l.type === "decaissement");
  const reappros = logs.filter((l) => l.type === "reappro");
  const inventaires = logs.filter((l) => l.type === "inventaire");
  const ajustements = logs.filter((l) => l.type === "ajustement");
  const creations = logs.filter((l) => l.type === "creation");
  const modifications = logs.filter((l) => l.type === "modification");
  const rapports = logs.filter((l) => l.type === "rapport");
  const audits = logs.filter((l) => l.type === "audit");

  const annulations = logs.filter(
    (l) =>
      (l.type === "vente" || l.type === "encaissement") &&
      (l.statut === "annule" || l.statut === "annulée")
  );

  const anomalies = logs.filter(
    (l) =>
      l.statut === "anomalie" ||
      l.statut === "refuse" ||
      l.statut === "refusé"
  );

  const ventesTotal = sumByType("vente");
  const encaisseTotal = sumByType("encaissement");
  const decaisseTotal = sumByType("decaissement");
  const fluxTotal = encaisseTotal - decaisseTotal;

  const ticketMoyen = ventes.length ? ventesTotal / ventes.length : 0;

  return {
    totalEvents,
    ventesCount: ventes.length,
    encaissementsCount: encaissements.length,
    decaissementsCount: decaissements.length,
    reapprosCount: reappros.length,
    inventairesCount: inventaires.length,
    ajustementsCount: ajustements.length,
    annulationsCount: annulations.length,
    anomaliesCount: anomalies.length,
    rapportsCount: rapports.length,
    auditsCount: audits.length,
    ticketMoyen,
    ventesTotal,
    encaisseTotal,
    decaisseTotal,
    fluxTotal,
    creationCount: creations.length,
    modificationCount: modifications.length,
  };
}

// ==========================================================
// 💰 Composant principal — VERSION CORRIGÉE
// ==========================================================
export default function JournalActivites() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());

  const [activeRole, setActiveRole] = useState("vendeur");
  const [activeRolePage, setActiveRolePage] = useState("vendeur");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  // ========================================================
  // 📥 Chargement initial
  // ========================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const simulated = [
          // Vendeurs
          {
            id: 1,
            date: "2025-11-09 08:32",
            role: "vendeur",
            user: "Vendeur #12",
            module: "VENTE",
            type: "connexion",
            description: "Connexion réussie depuis POS Boutique 1",
            ref: null,
            montant: null,
            statut: "ok",
          },
          {
            id: 2,
            date: "2025-11-09 08:45",
            role: "vendeur",
            user: "Vendeur #12",
            module: "VENTE",
            type: "vente",
            description: "Panier #10023 validé (3 articles)",
            ref: "PAN-10023",
            montant: 45000,
            statut: "ok",
          },
          {
            id: 3,
            date: "2025-11-09 09:15",
            role: "vendeur",
            user: "Vendeur #07",
            module: "VENTE",
            type: "vente",
            description: "Panier #10024 avec remise client fidèle",
            ref: "PAN-10024",
            montant: 27500,
            statut: "ok",
          },
          {
            id: 4,
            date: "2025-11-09 09:25",
            role: "vendeur",
            user: "Vendeur #12",
            module: "VENTE",
            type: "vente",
            description: "Panier #10025 annulé par le client",
            ref: "PAN-10025",
            montant: 18000,
            statut: "annule",
          },

          // Caissiers
          {
            id: 5,
            date: "2025-11-09 08:50",
            role: "caissier",
            user: "Caissier #1",
            module: "CAISSE",
            type: "encaissement",
            description: "Encaissement panier #10023 (Espèces)",
            ref: "ENC-2025-0001",
            montant: 45000,
            statut: "ok",
          },
          {
            id: 6,
            date: "2025-11-09 09:00",
            role: "caissier",
            user: "Caissier #1",
            module: "CAISSE",
            type: "encaissement",
            description: "Encaissement panier #10024 (Mobile Money)",
            ref: "ENC-2025-0002",
            montant: 27500,
            statut: "ok",
          },
          {
            id: 7,
            date: "2025-11-09 09:10",
            role: "caissier",
            user: "Caissier #1",
            module: "DECAISSEMENT",
            type: "decaissement",
            description: "Décaissement 20 000 FCFA (Frais fournisseur)",
            ref: "DEC-2025-0003",
            montant: 20000,
            statut: "ok",
          },
          {
            id: 8,
            date: "2025-11-09 09:20",
            role: "caissier",
            user: "Caissier #1",
            module: "CAISSE",
            type: "encaissement",
            description:
              "Annulation encaissement panier #10025 (erreur de montant)",
            ref: "ENC-2025-0004",
            montant: 18000,
            statut: "anomalie",
          },

          // Gestionnaire Boutique
          {
            id: 9,
            date: "2025-11-09 07:55",
            role: "gestionnaire_boutique",
            user: "Gest. Boutique #1",
            module: "STOCK_BOUTIQUE",
            type: "reappro",
            description: "Réapprovisionnement Ramette A4 x 50",
            ref: "REP-BOUT-001",
            montant: null,
            statut: "ok",
          },
          {
            id: 10,
            date: "2025-11-09 08:05",
            role: "gestionnaire_boutique",
            user: "Gest. Boutique #1",
            module: "STOCK_BOUTIQUE",
            type: "stock",
            description: "Produit 'Stylo bleu' sous seuil (reste 12)",
            ref: "ALR-BOUT-001",
            montant: null,
            statut: "anomalie",
          },
          {
            id: 11,
            date: "2025-11-09 08:10",
            role: "gestionnaire_boutique",
            user: "Gest. Boutique #1",
            module: "STOCK_BOUTIQUE",
            type: "ajustement",
            description:
              "Ajustement stock 'Classeur archives A4' (-3 suite inventaire)",
            ref: "AJU-BOUT-001",
            montant: null,
            statut: "ok",
          },
        ];

        setLogs(simulated);
      } catch (e) {
        toast.error("Impossible de charger le journal d'activités.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ========================================================
  // 🔎 Filtrage local (uniquement par date)
  // ========================================================
  const filteredLogs = useMemo(() => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);

    return logs
      .filter((l) => {
        const d = parseLogDate(l.date);
        if (isNaN(d.getTime())) return false;
        return d >= start && d <= end;
      })
      .filter((l) => (activeRole === "all" ? true : l.role === activeRole))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [logs, dateDebut, dateFin, activeRole]);

  // Logs pour KPI
  const kpiBaseLogs = useMemo(() => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);

    return logs
      .filter((l) => {
        const d = parseLogDate(l.date);
        if (isNaN(d.getTime())) return false;
        return d >= start && d <= end;
      })
      .filter((l) => (activeRole === "all" ? true : l.role === activeRole));
  }, [logs, dateDebut, dateFin, activeRole]);

  const stats = useMemo(
    () => computeStatsForRole(kpiBaseLogs, activeRole),
    [kpiBaseLogs, activeRole]
  );

  // Loader
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-gray-50 via-gray-50/50 to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-gray-200 shadow-sm">
          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-gray-700">
            Chargement du journal d'activités...
          </span>
        </div>
      </div>
    );
  }

  const activeRoleLabel = ROLE_CARDS.find((r) => r.id === activeRole)?.label || "Vendeurs";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-50/50 to-white px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Journal d'activités — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Journal des activités
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Traçabilité complète des connexions, ventes, mouvements de stock, encaissements et décaissements.
                <br />
                <span className="text-[#2F1F7A] font-medium">Cliquez sur une carte pour voir les détails par rôle</span>
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période du{" "}
              <span className="font-semibold">{dateDebut}</span> au{" "}
              <span className="font-semibold">{dateFin}</span> •{" "}
              {filteredLogs.length} activité
              {filteredLogs.length > 1 && "s"} affichée
            </p>
          </div>
        </motion.header>

        {/* CARTES PROFILS (CLIQUABLES) - ONGLETS MÉTIER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {ROLE_CARDS.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            const colorClasses = {
              emerald: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-200',
                ring: 'ring-emerald-300',
                dot: 'bg-emerald-500'
              },
              amber: {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-200',
                ring: 'ring-amber-300',
                dot: 'bg-amber-500'
              },
              blue: {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-200',
                ring: 'ring-blue-300',
                dot: 'bg-blue-500'
              },
            };
            
            const colors = colorClasses[role.color];
            
            return (
              <motion.button
                key={role.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveRole(role.id);       // pour les stats
                  setActiveRolePage(role.id);  // pour la sous-page
                }}
                className={`relative group text-left rounded-xl border px-4 py-4 transition-all duration-300 shadow-sm hover:shadow-md ${
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-opacity-50 ${colors.ring}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? colors.bg : 'bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? colors.text : 'text-gray-500'}`} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-sm font-semibold ${isActive ? colors.text : 'text-gray-700'}`}>
                      {role.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {role.description}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colors.dot}`} />
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className={`absolute inset-0 rounded-xl ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
              </motion.button>
            );
          })}
        </motion.div>

        {/* STATISTIQUES PAR PROFIL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Statistiques pour : {activeRoleLabel}</h2>
            </div>
            {stats.anomaliesCount > 0 && (
              <div className="inline-flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span>{stats.anomaliesCount} anomalie{stats.anomaliesCount > 1 ? 's' : ''} détectée{stats.anomaliesCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeRole === "vendeur" && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Total ventes</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{formatFCFA(stats.ventesTotal || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.ventesCount} vente{stats.ventesCount > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Ticket moyen</p>
                  <p className="text-xl font-bold text-indigo-600 mt-1">{formatFCFA(stats.ticketMoyen)}</p>
                  <p className="text-xs text-gray-500 mt-1">Par transaction</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Annulations</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{stats.annulationsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Paniers annulés</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Actions totales</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-1">Sur la période</p>
                </div>
              </>
            )}

            {activeRole === "caissier" && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Encaissements</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{formatFCFA(stats.encaisseTotal || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.encaissementsCount} opération{stats.encaissementsCount > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Décaissements</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">{formatFCFA(stats.decaisseTotal || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.decaissementsCount} sortie{stats.decaissementsCount > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Flux net</p>
                  <p className={`text-xl font-bold mt-1 ${
                    stats.fluxTotal >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatFCFA(stats.fluxTotal || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Encaissé - Décaissé</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Actions totales</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-1">Sur la période</p>
                </div>
              </>
            )}

            {activeRole === "gestionnaire_boutique" && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Réapprovisionnements</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{stats.reapprosCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Mouvements d'entrée</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Inventaires/Ajustements</p>
                  <p className="text-xl font-bold text-indigo-600 mt-1">{stats.inventairesCount + stats.ajustementsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Opérations stock</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Alertes</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{stats.anomaliesCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Ruptures/défauts</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Actions totales</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-1">Sur la période</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ZONE D'AFFICHAGE DES SOUS-PAGES */}
        {activeRolePage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            {activeRolePage === "vendeur" && <VendeursPage />}
            {activeRolePage === "caissier" && <CaissiersPage />}
            {activeRolePage === "gestionnaire_boutique" && <GestionnairesBoutiquePage />}
          </motion.div>
        )}
      </div>
    </div>
  );
}
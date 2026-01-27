// ==========================================================
// 🧾 JournalActivites.jsx — Version 2 (UX Redesign)
// Refonte visuelle avec focus sur l'expérience utilisateur
// - Même design que les autres pages
// - Suppression de la carte "Tous les profils"
// - Barre de filtres horizontale
// - Statistiques améliorées
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  FileDown,
  RefreshCw,
  Search,
  Activity,
  ShoppingCart,
  Banknote,
  Warehouse,
  Store,
  UserCircle2,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Eye,
  ChevronDown,
  X,
  Info,
  Download,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

// Profils suivis par le journal (SANS "Tous les profils")
const ROLE_CARDS = [
  {
    id: "vendeur",
    label: "Vendeurs",
    description: "Ventes, paniers, annulations",
    icon: ShoppingCart,
    color: "emerald",
    accent: "from-emerald-400 to-emerald-600",
  },
  {
    id: "caissier",
    label: "Caissiers",
    description: "Encaissements, décaissements",
    icon: Banknote,
    color: "amber",
    accent: "from-amber-400 to-amber-600",
  },
  {
    id: "gestionnaire_boutique",
    label: "Gestionnaire Boutique",
    description: "Stock et réapprovisionnement",
    icon: Store,
    color: "blue",
    accent: "from-blue-400 to-blue-600",
  },
  {
    id: "gestionnaire_depot",
    label: "Gestionnaire Dépôt",
    description: "Inventaires et transferts",
    icon: Warehouse,
    color: "purple",
    accent: "from-purple-400 to-purple-600",
  },
  {
    id: "responsable",
    label: "Responsable",
    description: "Gestion des utilisateurs",
    icon: UserCircle2,
    color: "indigo",
    accent: "from-indigo-400 to-indigo-600",
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
];

// Modules
const MODULES = [
  "Tous",
  "VENTE",
  "CAISSE",
  "STOCK_BOUTIQUE",
  "STOCK_DEPOT",
  "DECAISSEMENT",
  "UTILISATEURS",
];

const MODULE_LABELS = {
  Tous: "Tous les modules",
  VENTE: "Vente",
  CAISSE: "Caisse",
  STOCK_BOUTIQUE: "Stock boutique",
  STOCK_DEPOT: "Stock dépôt",
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
// 💰 Composant principal — VERSION 2 (UX Redesign)
// ==========================================================
export default function JournalActivites() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());

  const [activeRole, setActiveRole] = useState("vendeur");
  const [typeAction, setTypeAction] = useState("Tous");
  const [moduleFilter, setModuleFilter] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

          // Gestionnaire Dépôt
          {
            id: 12,
            date: "2025-11-09 07:30",
            role: "gestionnaire_depot",
            user: "Gest. Dépôt #2",
            module: "STOCK_DEPOT",
            type: "inventaire",
            description: "Inventaire partiel rayon Papeterie (zone A)",
            ref: "INV-DEP-2025-01",
            montant: null,
            statut: "ok",
          },
          {
            id: 13,
            date: "2025-11-09 07:40",
            role: "gestionnaire_depot",
            user: "Gest. Dépôt #2",
            module: "STOCK_DEPOT",
            type: "reappro",
            description: "Transfert vers Boutique 1 : Ramette A4 x 100",
            ref: "TRF-DEP-BOUT-001",
            montant: null,
            statut: "ok",
          },
          {
            id: 14,
            date: "2025-11-09 08:00",
            role: "gestionnaire_depot",
            user: "Gest. Dépôt #2",
            module: "STOCK_DEPOT",
            type: "stock",
            description: "Rupture 'Classeur archives A4' au dépôt",
            ref: "ALR-DEP-002",
            montant: null,
            statut: "anomalie",
          },

          // Responsable / Utilisateurs
          {
            id: 15,
            date: "2025-11-09 08:20",
            role: "responsable",
            user: "Responsable",
            module: "UTILISATEURS",
            type: "creation",
            description: "Création utilisateur 'Vendeur #13'",
            ref: "USR-00013",
            montant: null,
            statut: "ok",
          },
          {
            id: 16,
            date: "2025-11-09 08:25",
            role: "responsable",
            user: "Responsable",
            module: "UTILISATEURS",
            type: "modification",
            description: "Changement rôle 'Caissier #2' → actif",
            ref: "USR-00007",
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
  // 🔎 Filtrage local
  // ========================================================
  const filteredLogs = useMemo(() => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);

    const q = (recherche || "").toLowerCase();

    return logs
      .filter((l) => {
        const d = parseLogDate(l.date);
        if (isNaN(d.getTime())) return false;
        return d >= start && d <= end;
      })
      .filter((l) => (activeRole === "all" ? true : l.role === activeRole))
      .filter((l) =>
        moduleFilter === "Tous" ? true : l.module === moduleFilter
      )
      .filter((l) => (typeAction === "Tous" ? true : l.type === typeAction))
      .filter((l) => {
        if (!q) return true;
        const blob = [
          l.user,
          l.role,
          l.module,
          l.type,
          l.description,
          l.ref,
          l.statut,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [logs, dateDebut, dateFin, activeRole, moduleFilter, typeAction, recherche]);

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

  // Compteur de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (moduleFilter !== "Tous") count++;
    if (typeAction !== "Tous") count++;
    if (recherche) count++;
    return count;
  }, [moduleFilter, typeAction, recherche]);

  // ========================================================
  // 📤 Export PDF
  // ========================================================
  const exportPDF = () => {
    const doc = new jsPDF();
    const roleLabel =
      ROLE_CARDS.find((r) => r.id === activeRole)?.label || "Vendeurs";

    doc.text("Journal d'activités — Librairie Papeterie Daradji (LPD)", 14, 16);
    doc.setFontSize(10);
    doc.text(`Profil : ${roleLabel}`, 14, 22);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 27);
    doc.text(
      `Filtres : Module=${moduleFilter} • Type=${typeAction} • Résultats=${filteredLogs.length}`,
      14,
      32
    );

    doc.autoTable({
      startY: 38,
      head: [
        [
          "Date",
          "Utilisateur",
          "Rôle",
          "Module",
          "Type",
          "Référence",
          "Montant",
          "Statut",
          "Description",
        ],
      ],
      body: filteredLogs.map((l) => [
        l.date,
        l.user,
        l.role,
        l.module,
        l.type,
        l.ref || "-",
        l.montant ? formatFCFA(l.montant) : "-",
        l.statut || "-",
        l.description,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 46, 173] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24 },
        3: { cellWidth: 26 },
        4: { cellWidth: 22 },
        5: { cellWidth: 25 },
        6: { cellWidth: 24 },
        7: { cellWidth: 22 },
        8: { cellWidth: "auto" },
      },
    });

    doc.save(`Journal_activites_${dateDebut}_au_${dateFin}.pdf`);
    toast.success("Export PDF généré avec succès.");
  };

  const resetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setDateDebut(d.toISOString().slice(0, 10));
    setDateFin(todayISO());
    setModuleFilter("Tous");
    setTypeAction("Tous");
    setRecherche("");
    setShowAdvancedFilters(false);
    toast.info("Filtres réinitialisés");
  };

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

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition"
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>
        </motion.header>

        {/* BARRE DE FILTRES HORIZONTALE */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Recherche */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher utilisateur, référence, description..."
                      className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Période */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateDebut}
                      max={dateFin}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                    />
                    <span className="text-gray-400 self-center">→</span>
                    <input
                      type="date"
                      value={dateFin}
                      min={dateDebut}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Module */}
                <div className="min-w-[160px]">
                  <select
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                  >
                    {MODULES.map((m) => (
                      <option key={m} value={m}>
                        {MODULE_LABELS[m] || m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bouton filtres avancés */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  <Filter className="w-4 h-4" />
                  Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filtres avancés (toggle) */}
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Type d'action */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Type d'action
                      </label>
                      <select
                        value={typeAction}
                        onChange={(e) => setTypeAction(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                      >
                        {ACTION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex items-end gap-2 ml-auto">
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Réinitialiser
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CARTES PROFILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ROLE_CARDS.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            const colorClass = {
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
              amber: 'bg-amber-50 text-amber-600 border-amber-200',
              blue: 'bg-blue-50 text-blue-600 border-blue-200',
              purple: 'bg-purple-50 text-purple-600 border-purple-200',
              indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            }[role.color];
            
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRole(role.id)}
                className={`relative group text-left rounded-xl border px-4 py-4 transition shadow-sm hover:shadow-md ${
                  isActive
                    ? `${colorClass} ring-2 ring-opacity-50 ring-${role.color}-300`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? colorClass.split(' ')[0] : 'bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? colorClass.split(' ')[1] : 'text-gray-500'}`} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-sm font-semibold ${isActive ? colorClass.split(' ')[1] : 'text-gray-700'}`}>
                      {role.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {role.description}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${role.color}-500`} />
                )}
              </button>
            );
          })}
        </div>

        {/* STATISTIQUES PAR PROFIL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                  <p className="text-xl font-bold text-amber-600 mt-1">{formatFCFA(stats.decaissementTotal || 0)}</p>
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

            {(activeRole === "gestionnaire_boutique" || activeRole === "gestionnaire_depot") && (
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

            {activeRole === "responsable" && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Utilisateurs créés</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{stats.creationCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Nouveaux comptes</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Modifications</p>
                  <p className="text-xl font-bold text-indigo-600 mt-1">{stats.modificationCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Changements effectués</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Actions totales</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-1">Sur la période</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Activité globale</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{stats.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-1">Toutes actions</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: "overview", label: "Vue d'ensemble", icon: <Activity className="w-4 h-4" /> },
                { id: "timeline", label: "Timeline", icon: <Clock className="w-4 h-4" /> },
                { id: "details", label: "Détails complets", icon: <FileDown className="w-4 h-4" /> },
                { id: "analytics", label: "Analyses", icon: <TrendingUp className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENU DES ONGLETS */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* ACTIVITÉS RÉCENTES */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Activités récentes</h3>
                    </div>
                    <span className="text-xs text-gray-500">Dernières 8 activités</span>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className={`p-2 rounded-full ${
                          log.statut === "ok" ? 'bg-emerald-100 text-emerald-600' :
                          log.statut === "anomalie" ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {log.statut === "ok" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{log.user}</span>
                            <span className="text-xs text-gray-500">{log.date.slice(11, 16)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                              {log.type}
                            </span>
                            {log.montant && (
                              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                                {formatFCFA(log.montant)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RÉPARTITION PAR TYPE */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Répartition par type d'action</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(
                      filteredLogs.reduce((acc, log) => {
                        acc[log.type] = (acc[log.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                          <span className="text-lg font-bold text-gray-800">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(count / filteredLogs.length) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {((count / filteredLogs.length) * 100).toFixed(1)}% du total
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Timeline des activités</h3>
                    </div>
                  </div>
                  
                  <div className="relative pl-8">
                    {/* Ligne verticale */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    {filteredLogs.slice(0, 10).map((log, index) => (
                      <div key={log.id} className="relative mb-6 last:mb-0">
                        {/* Point sur la timeline */}
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                          log.statut === "ok" ? 'bg-emerald-500' :
                          log.statut === "anomalie" ? 'bg-red-500' :
                          'bg-amber-500'
                        }`} />
                        
                        {/* Carte d'activité */}
                        <div className="ml-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{log.user}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {log.role}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{log.date}</div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{log.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.statut === "ok" ? 'bg-emerald-100 text-emerald-700' :
                              log.statut === "anomalie" ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {log.statut}
                            </span>
                            {log.ref && (
                              <span className="text-xs text-gray-500">Ref: {log.ref}</span>
                            )}
                            {log.montant && (
                              <span className="text-xs font-medium text-emerald-600 ml-auto">
                                {formatFCFA(log.montant)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-4">
                {/* EN-TÊTE TABLEAU */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">Détail complet des activités</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                      {filteredLogs.length} activité{filteredLogs.length > 1 && 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportPDF}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      Exporter
                    </button>
                  </div>
                </div>

                {/* TABLEAU COMPLET */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Heure
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Référence
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs.length ? (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{log.user}</div>
                                <div className="text-xs text-gray-500 capitalize">{log.role}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                                {log.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.ref || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.montant ? formatFCFA(log.montant) : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.statut === "ok"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : log.statut === "anomalie"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {log.statut}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {log.description}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <Activity className="w-12 h-12 mb-3 opacity-30" />
                              <p className="text-sm">Aucune activité trouvée avec les filtres actuels</p>
                              <button
                                onClick={resetFilters}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                              >
                                Réinitialiser les filtres
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {filteredLogs.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">1</span> à{" "}
                        <span className="font-medium">{Math.min(filteredLogs.length, 10)}</span> sur{" "}
                        <span className="font-medium">{filteredLogs.length}</span> résultats
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Précédent
                      </button>
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Analyses par profil</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Activité horaire</h4>
                      <div className="text-2xl font-bold text-gray-800">
                        08:00 - 12:00
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Pic d'activité quotidien</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Taux d'anomalies</h4>
                      <div className="text-2xl font-bold text-gray-800">
                        {filteredLogs.length > 0 ? ((stats.anomaliesCount / filteredLogs.length) * 100).toFixed(1) : 0}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Sur les activités filtrées</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Utilisateur le plus actif</h4>
                      <div className="text-2xl font-bold text-gray-800">
                        {(() => {
                          const userCounts = filteredLogs.reduce((acc, log) => {
                            acc[log.user] = (acc[log.user] || 0) + 1;
                            return acc;
                          }, {});
                          const mostActive = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
                          return mostActive ? mostActive[0] : '-';
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Sur la période</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFORMATIF */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Système de traçabilité temps réel - Données actualisées automatiquement</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}</span>
              <button className="text-indigo-600 hover:text-indigo-700">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
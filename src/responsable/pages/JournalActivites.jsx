// ==========================================================
// 🧾 JournalActivites.jsx — Interface Responsable (LPD Manager)
// Traçabilité avancée multi-profils (Vendeurs, Caissiers, Gestionnaires)
// - Cartes rôles cliquables
// - Filtres : période, module, type d’action, recherche
// - KPI ciblés par rôle
// - Timeline + Tableau complet + Export PDF
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
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
// import { instance } from "../../utils/axios"; // à réactiver quand l'API sera prête
import TimelineActivity from "../components/TimelineActivity";

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
  // Supporte "2025-11-09 08:32" → on garde juste la date
  const onlyDate = dateStr?.slice(0, 10);
  return new Date(onlyDate);
};

// Profils suivis par le journal
const ROLE_CARDS = [
  {
    id: "all",
    label: "Tous les profils",
    description: "Vue consolidée de toutes les actions critiques.",
    icon: Activity,
    accent: "from-[#472EAD] to-[#7A5BF5]",
  },
  {
    id: "vendeur",
    label: "Historique Vendeurs",
    description: "Ventes, paniers, annulations, remises…",
    icon: ShoppingCart,
    accent: "from-[#10B981] to-[#34D399]",
  },
  {
    id: "caissier",
    label: "Historique Caissiers",
    description: "Encaissements, remboursements, décaissements liés.",
    icon: Banknote,
    accent: "from-[#F97316] to-[#FB923C]",
  },
  {
    id: "gestionnaire_boutique",
    label: "Gestionnaire Boutique",
    description: "Réappr., ruptures, ajustements du stock boutique.",
    icon: Store,
    accent: "from-[#3B82F6] to-[#60A5FA]",
  },
  {
    id: "gestionnaire_depot",
    label: "Gestionnaire Dépôt",
    description: "Mouvement de stock dépôt, transferts, inventaires.",
    icon: Warehouse,
    accent: "from-[#6366F1] to-[#A855F7]",
  },
  {
    id: "responsable",
    label: "Actions Responsable",
    description: "Création & gestion des utilisateurs, paramétrages…",
    icon: UserCircle2,
    accent: "from-[#0EA5E9] to-[#22C55E]",
  },
];

// Types d’action (métier)
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

// Modules / contextes
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
  Tous: "Tous",
  VENTE: "Vente",
  CAISSE: "Caisse",
  STOCK_BOUTIQUE: "Stock boutique",
  STOCK_DEPOT: "Stock dépôt",
  DECAISSEMENT: "Décaissement",
  UTILISATEURS: "Utilisateurs",
};

// ==========================================================
// 🧮 Calcul de KPI selon rôle
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

  // On renvoie un objet riche ; le rendu des KPI adaptera selon le rôle
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
// 💰 Composant principal
// ==========================================================
export default function JournalActivites() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());

  const [activeRole, setActiveRole] = useState("all");
  const [typeAction, setTypeAction] = useState("Tous");
  const [moduleFilter, setModuleFilter] = useState("Tous");
  const [recherche, setRecherche] = useState("");

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  // ========================================================
  // 📥 Chargement initial (simulation pour l’instant)
  // ========================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Exemple futur :
        // const { data } = await instance.get("/journal-activites", {
        //   params: { from: dateDebut, to: dateFin, profile: activeRole, type: typeAction, module: moduleFilter, q: recherche },
        // });
        // setLogs(data);

        // 👉 Simulation de logs multi-profils
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
        console.error("Erreur journal:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ========================================================
  // 🔎 Filtrage local (période, rôle, module, type, recherche)
  // ========================================================
  const filteredLogs = useMemo(() => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    // Inclure toute la journée de dateFin
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
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // plus récents en premier
  }, [logs, dateDebut, dateFin, activeRole, moduleFilter, typeAction, recherche]);

  // Logs pour KPI = filtrés par période + rôle, mais AVANT type/module/recherche
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

  // Timeline limitée aux 8 dernières activités filtrées
  const timelineData = useMemo(
    () => filteredLogs.slice(0, 8),
    [filteredLogs]
  );

  // ========================================================
  // 📤 Export PDF
  // ========================================================
  const exportPDF = () => {
    const doc = new jsPDF();
    const roleLabel =
      ROLE_CARDS.find((r) => r.id === activeRole)?.label || "Tous les profils";

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
  };

  // ========================================================
  // 🏷️ Rendu KPI selon rôle
  // ========================================================
  const renderRoleKpis = () => {
    const baseCard =
      "rounded-2xl border px-4 py-3 bg-white shadow-sm flex flex-col gap-1";

    if (activeRole === "vendeur") {
      return (
        <>
          <div className={`${baseCard} border-emerald-200`}>
            <span className="text-xs text-gray-500">Total ventes</span>
            <span className="text-lg font-bold text-emerald-700">
              {formatFCFA(stats.ventesTotal || 0)}
            </span>
            <span className="text-[11px] text-gray-400">
              {stats.ventesCount} vente(s) enregistrée(s)
            </span>
          </div>
          <div className={`${baseCard} border-indigo-200`}>
            <span className="text-xs text-gray-500">Ticket moyen</span>
            <span className="text-lg font-bold text-indigo-700">
              {formatFCFA(stats.ticketMoyen)}
            </span>
            <span className="text-[11px] text-gray-400">
              Montant moyen par panier
            </span>
          </div>
          <div className={`${baseCard} border-rose-200`}>
            <span className="text-xs text-gray-500">Annulations</span>
            <span className="text-lg font-bold text-rose-700">
              {stats.annulationsCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Paniers annulés sur la période
            </span>
          </div>
        </>
      );
    }

    if (activeRole === "caissier") {
      return (
        <>
          <div className={`${baseCard} border-emerald-200`}>
            <span className="text-xs text-gray-500">Total encaissé</span>
            <span className="text-lg font-bold text-emerald-700">
              {formatFCFA(stats.encaisseTotal || 0)}
            </span>
            <span className="text-[11px] text-gray-400">
              {stats.encaissementsCount} encaissement(s)
            </span>
          </div>
          <div className={`${baseCard} border-amber-200`}>
            <span className="text-xs text-gray-500">Décaissements</span>
            <span className="text-lg font-bold text-amber-700">
              {stats.decaissementsCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Sorties de caisse liées aux décaissements
            </span>
          </div>
          <div className={`${baseCard} border-rose-200`}>
            <span className="text-xs text-gray-500">Anomalies caisse</span>
            <span className="text-lg font-bold text-rose-700">
              {stats.anomaliesCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Encaissements annulés / suspects
            </span>
          </div>
        </>
      );
    }

    if (
      activeRole === "gestionnaire_boutique" ||
      activeRole === "gestionnaire_depot"
    ) {
      return (
        <>
          <div className={`${baseCard} border-sky-200`}>
            <span className="text-xs text-gray-500">Réapprovisionnements</span>
            <span className="text-lg font-bold text-sky-700">
              {stats.reapprosCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Mouvements d’entrée sur la période
            </span>
          </div>
          <div className={`${baseCard} border-indigo-200`}>
            <span className="text-xs text-gray-500">
              Inventaires / ajustements
            </span>
            <span className="text-lg font-bold text-indigo-700">
              {stats.inventairesCount + stats.ajustementsCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Inventaires & corrections de stock
            </span>
          </div>
          <div className={`${baseCard} border-rose-200`}>
            <span className="text-xs text-gray-500">Alertes stock</span>
            <span className="text-lg font-bold text-rose-700">
              {stats.anomaliesCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Ruptures / sous seuil / incohérences détectées
            </span>
          </div>
        </>
      );
    }

    if (activeRole === "responsable") {
      return (
        <>
          <div className={`${baseCard} border-emerald-200`}>
            <span className="text-xs text-gray-500">Utilisateurs créés</span>
            <span className="text-lg font-bold text-emerald-700">
              {stats.creationCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Nouveaux comptes sur la période
            </span>
          </div>
          <div className={`${baseCard} border-indigo-200`}>
            <span className="text-xs text-gray-500">
              Utilisateurs modifiés
            </span>
            <span className="text-lg font-bold text-indigo-700">
              {stats.modificationCount}
            </span>
            <span className="text-[11px] text-gray-400">
              Changement de rôles / statuts
            </span>
          </div>
          <div className={`${baseCard} border-sky-200`}>
            <span className="text-xs text-gray-500">Actions administrateur</span>
            <span className="text-lg font-bold text-sky-700">
              {stats.totalEvents}
            </span>
            <span className="text-[11px] text-gray-400">
              Toutes actions Responsable confondues
            </span>
          </div>
        </>
      );
    }

    // Vue "Tous les profils"
    return (
      <>
        <div className={`${baseCard} border-indigo-200`}>
          <span className="text-xs text-gray-500">Événements tracés</span>
          <span className="text-lg font-bold text-indigo-700">
            {stats.totalEvents}
          </span>
          <span className="text-[11px] text-gray-400">
            Toutes actions confondues sur la période
          </span>
        </div>
        <div className={`${baseCard} border-emerald-200`}>
          <span className="text-xs text-gray-500">Flux monétaires nets</span>
          <span className="text-lg font-bold text-emerald-700">
            {formatFCFA(stats.fluxTotal || 0)}
          </span>
          <span className="text-[11px] text-gray-400">
            Encaissements - décaissements (net)
          </span>
        </div>
        <div className={`${baseCard} border-rose-200`}>
          <span className="text-xs text-gray-500">Anomalies globales</span>
          <span className="text-lg font-bold text-rose-700">
            {stats.anomaliesCount}
          </span>
          <span className="text-[11px] text-gray-400">
            Annulations, refus, alertes stock / caisse
          </span>
        </div>
      </>
    );
  };

  // ========================================================
  // Loader
  // ========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <RefreshCw className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement du journal d’activités...
          </span>
        </div>
      </div>
    );
  }

  const activeRoleLabel =
    ROLE_CARDS.find((r) => r.id === activeRole)?.label || "Tous les profils";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
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
                Module Journal d’activités — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Journal des activités
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Traçabilité complète des connexions, ventes, mouvements de
                stock, encaissements et décaissements.
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

        {/* CARTES PROFILS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ROLE_CARDS.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRole(role.id)}
                className={`relative group text-left rounded-2xl border px-4 py-3 transition shadow-sm ${
                  isActive
                    ? "border-[#472EAD] bg-white"
                    : "border-[#E4E0FF] bg-white/80 hover:bg-white"
                }`}
              >
                <div
                  className={`absolute inset-x-0 -top-0.5 h-1 rounded-t-2xl bg-gradient-to-r ${role.accent} opacity-80`}
                />
                <div className="flex items-center gap-2 mt-1">
                  <span className="p-1.5 rounded-full bg-[#F7F5FF] text-[#472EAD]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#2F1F7A]">
                      {role.label}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {role.description}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-[#472EAD] text-white">
                    Actif
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {/* FILTRES + KPI */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* Filtres */}
          <div className="lg:col-span-1 bg-white/90 rounded-2xl border border-[#E4E0FF] shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#472EAD] font-semibold text-sm">
              <Filter size={16} />
              Filtres
            </div>

            <div className="space-y-3">
              {/* Période */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Période
                </label>
                <div className="grid grid-cols-[auto,1fr] gap-2 items-center">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateDebut}
                      max={dateFin}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                    />
                    <input
                      type="date"
                      value={dateFin}
                      min={dateDebut}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                    />
                  </div>
                </div>
              </div>

              {/* Module */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Module / Contexte
                </label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                >
                  {MODULES.map((m) => (
                    <option key={m} value={m}>
                      {MODULE_LABELS[m] || m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type d’action */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Type d’action
                </label>
                <select
                  value={typeAction}
                  onChange={(e) => setTypeAction(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recherche */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher (utilisateur, ref, description)…"
                    className="pl-9 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 rounded-2xl border border-[#E4E0FF] shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="w-4 h-4 text-[#472EAD]" />
                  <span className="text-sm font-semibold text-[#2F1F7A]">
                    Vue active : {activeRoleLabel}
                  </span>
                </div>
                {stats.anomaliesCount > 0 && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{stats.anomaliesCount} anomalie(s) détectée(s)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderRoleKpis()}
              </div>
            </div>
          </div>
        </section>

        {/* TIMELINE + TABLEAU */}
        <section className="space-y-6 mt-2">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5"
          >
            <h3 className="text-sm sm:text-base font-semibold text-[#2F1F7A] mb-2">
              Activités récentes ({activeRoleLabel})
            </h3>
            <p className="text-[11px] text-gray-400 mb-3">
              Dernières actions sur la période sélectionnée (jusqu’à 8 entrées).
            </p>

            <TimelineActivity data={timelineData} />
          </motion.div>

          {/* Tableau complet */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5 overflow-x-auto"
          >
            <h3 className="text-sm sm:text-base font-semibold text-[#2F1F7A] mb-3">
              Tableau complet des activités
            </h3>
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Module
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Réf.
                  </th>
                  <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length ? (
                  filteredLogs.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.date}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.user}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.role}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {MODULE_LABELS[l.module] || l.module}
                      </td>
                      <td className="px-4 py-2.5 capitalize whitespace-nowrap">
                        {l.type}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.ref || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {l.montant ? formatFCFA(l.montant) : "-"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            l.statut === "ok"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : l.statut === "anomalie" ||
                                l.statut === "refuse" ||
                                l.statut === "refusé"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : l.statut === "annule" || l.statut === "annulée"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {l.statut || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{l.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                    >
                      Aucune activité trouvée sur cette période avec ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

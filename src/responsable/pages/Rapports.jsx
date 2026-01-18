// ==========================================================
// 📑 Rapports.jsx — Interface Responsable (LPD Manager)
// Analyses & Rapports (Ventes, Stock, Décaissements, Clients, Responsable)
// - Onglets par type de rapport
// - Filtres période + filtres spécifiques
// - KPI clairs (cartes custom, pas KpiCard)
// - Graphiques (via ChartBox) + table détaillée
// - Export PDF adapté à l’onglet actif
// ==========================================================

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  FileDown,
  CalendarDays,
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  Users,
  ClipboardList,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

import ChartBox from "../components/ChartBox";

const BOUTIQUE_LABEL = "Boutique Colobane";

const todayISO = () => new Date().toISOString().slice(0, 10);
const sevenDaysAgoISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
};

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

// ---------------------------------------------------------------------
// 🔢 Données simulées (à remplacer par l’API plus tard)
// ---------------------------------------------------------------------

// VENTES : une ligne = une vente (ticket)
const VENTES_DATA = [
  {
    id: 1,
    date: "2025-11-01",
    ref: "VEN-2025-0001",
    vendeur: "Vendeur #12",
    client: "Client occasionnel",
    clientType: "NORMAL",
    categorie: "Papeterie",
    montant: 45000,
    nbArticles: 3,
    modePaiement: "ESPECES",
    statut: "VALIDE",
  },
  {
    id: 2,
    date: "2025-11-01",
    ref: "VEN-2025-0002",
    vendeur: "Vendeur #07",
    client: "École Yalla Suren",
    clientType: "SPECIAL",
    categorie: "Papeterie",
    montant: 120000,
    nbArticles: 15,
    modePaiement: "MOBILE_MONEY",
    statut: "VALIDE",
  },
  {
    id: 3,
    date: "2025-11-02",
    ref: "VEN-2025-0003",
    vendeur: "Vendeur #12",
    client: "Client occasionnel",
    clientType: "NORMAL",
    categorie: "Fournitures bureau",
    montant: 27500,
    nbArticles: 2,
    modePaiement: "ESPECES",
    statut: "VALIDE",
  },
  {
    id: 4,
    date: "2025-11-02",
    ref: "VEN-2025-0004",
    vendeur: "Vendeur #12",
    client: "Client occasionnel",
    clientType: "NORMAL",
    categorie: "Papeterie",
    montant: 18000,
    nbArticles: 2,
    modePaiement: "CARTE",
    statut: "ANNULEE",
  },
  {
    id: 5,
    date: "2025-11-03",
    ref: "VEN-2025-0005",
    vendeur: "Vendeur #03",
    client: "Entreprise SENCAP",
    clientType: "SPECIAL",
    categorie: "Fournitures bureau",
    montant: 200000,
    nbArticles: 22,
    modePaiement: "VIREMENT",
    statut: "VALIDE",
  },
];

// STOCK : photographie actuelle du stock
const STOCK_DATA = [
  {
    id: 1,
    code: "PROD-001",
    libelle: "Cahier 200 p",
    categorie: "Papeterie",
    fournisseur: "PAPDISK",
    stockActuel: 120,
    seuilAlerte: 30,
    etat: "NORMAL",
    valeurStock: 600000,
  },
  {
    id: 2,
    code: "PROD-002",
    libelle: "Stylo bleu",
    categorie: "Papeterie",
    fournisseur: "PAPDISK",
    stockActuel: 12,
    seuilAlerte: 30,
    etat: "SOUS_SEUIL",
    valeurStock: 36000,
  },
  {
    id: 3,
    code: "PROD-003",
    libelle: "Ramette A4",
    categorie: "Papeterie",
    fournisseur: "FOURPAPER",
    stockActuel: 0,
    seuilAlerte: 20,
    etat: "RUPTURE",
    valeurStock: 0,
  },
  {
    id: 4,
    code: "PROD-004",
    libelle: "Classeur A4",
    categorie: "Fournitures bureau",
    fournisseur: "FOURPAPER",
    stockActuel: 40,
    seuilAlerte: 20,
    etat: "NORMAL",
    valeurStock: 160000,
  },
  {
    id: 5,
    code: "PROD-005",
    libelle: "Feutres Couleur",
    categorie: "Papeterie",
    fournisseur: "COLORPLUS",
    stockActuel: 8,
    seuilAlerte: 10,
    etat: "SOUS_SEUIL",
    valeurStock: 24000,
  },
];

// DECAISSEMENTS
const DECAISSEMENTS_DATA = [
  {
    id: 1,
    date: "2025-11-01",
    ref: "DEC-2025-0001",
    type: "FOURNISSEUR",
    fournisseur: "PAPDISK",
    motif: "Règlement facture F-2025-001",
    montant: 200000,
    modePaiement: "VIREMENT",
    statut: "VALIDE",
  },
  {
    id: 2,
    date: "2025-11-02",
    ref: "DEC-2025-0002",
    type: "CHARGES",
    fournisseur: "SONATEL",
    motif: "Facture internet",
    montant: 45000,
    modePaiement: "MOBILE_MONEY",
    statut: "VALIDE",
  },
  {
    id: 3,
    date: "2025-11-03",
    ref: "DEC-2025-0003",
    type: "FOURNISSEUR",
    fournisseur: "FOURPAPER",
    motif: "Acompte commande papier",
    montant: 100000,
    modePaiement: "ESPECES",
    statut: "EN_ATTENTE",
  },
];

// CLIENTS (agrégé)
const CLIENTS_DATA = [
  {
    id: 1,
    nom: "Client occasionnel",
    type: "NORMAL",
    segment: "Particulier",
    nbVentes: 15,
    ca: 225000,
    remises: 5000,
    derniereAchat: "2025-11-03",
  },
  {
    id: 2,
    nom: "École Yalla Suren",
    type: "SPECIAL",
    segment: "École",
    nbVentes: 4,
    ca: 480000,
    remises: 30000,
    derniereAchat: "2025-11-02",
  },
  {
    id: 3,
    nom: "Entreprise SENCAP",
    type: "SPECIAL",
    segment: "Entreprise",
    nbVentes: 3,
    ca: 600000,
    remises: 45000,
    derniereAchat: "2025-11-03",
  },
];

// OPERATIONS RESPONSABLE
const RESPONSABLE_OPS_DATA = [
  {
    id: 1,
    date: "2025-11-01",
    type: "UTILISATEUR_CREATION",
    module: "UTILISATEURS",
    detail: "Création utilisateur 'Vendeur #13'",
    statut: "OK",
  },
  {
    id: 2,
    date: "2025-11-01",
    type: "DECAISSEMENT_VALIDATION",
    module: "DECAISSEMENT",
    detail: "Validation décaissement DEC-2025-0001",
    statut: "OK",
  },
  {
    id: 3,
    date: "2025-11-02",
    type: "ROLE_MODIFICATION",
    module: "UTILISATEURS",
    detail: "Changement rôle 'Caissier #2' → actif",
    statut: "OK",
  },
  {
    id: 4,
    date: "2025-11-03",
    type: "DECAISSEMENT_REFUS",
    module: "DECAISSEMENT",
    detail: "Refus décaissement DEC-2025-0003 (motif incomplet)",
    statut: "REFUSE",
  },
];

// Onglets
const REPORT_TABS = [
  { id: "ventes", label: "Ventes", icon: TrendingUp },
  { id: "stock", label: "Stock & ruptures", icon: Package },
  { id: "decaissements", label: "Décaissements", icon: DollarSign },
  { id: "clients", label: "Clients", icon: Users },
  { id: "responsable", label: "Responsable", icon: ClipboardList },
];

// ---------------------------------------------------------------------
// 📊 Helpers d’agrégation simple
// ---------------------------------------------------------------------

const isWithinPeriod = (dateStr, from, to) => {
  const d = new Date(dateStr);
  const start = new Date(from);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
};

const groupByDateSum = (rows, dateKey, valueKey) => {
  const map = new Map();
  rows.forEach((r) => {
    if (!r[dateKey]) return;
    if (!map.has(r[dateKey])) map.set(r[dateKey], 0);
    map.set(r[dateKey], map.get(r[dateKey]) + Number(r[valueKey] || 0));
  });
  return Array.from(map.entries()).map(([date, value]) => ({
    name: date,
    valeur: value,
  }));
};

const groupByKeyCount = (rows, key) => {
  const map = new Map();
  rows.forEach((r) => {
    const k = r[key] || "Non défini";
    if (!map.has(k)) map.set(k, 0);
    map.set(k, map.get(k) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

const groupByKeySum = (rows, key, valueKey) => {
  const map = new Map();
  rows.forEach((r) => {
    const k = r[key] || "Non défini";
    if (!map.has(k)) map.set(k, 0);
    map.set(k, map.get(k) + Number(r[valueKey] || 0));
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

// ---------------------------------------------------------------------
// 💼 Composant principal Rapports
// ---------------------------------------------------------------------

export default function Rapports() {
  const [activeTab, setActiveTab] = useState("ventes");

  const [dateDebut, setDateDebut] = useState(sevenDaysAgoISO());
  const [dateFin, setDateFin] = useState(todayISO());

  // Filtres spécifiques
  const [venteClientType, setVenteClientType] = useState("TOUS");
  const [venteModePaiement, setVenteModePaiement] = useState("TOUS");

  const [stockEtat, setStockEtat] = useState("TOUS");
  const [stockCategorie, setStockCategorie] = useState("TOUS");

  const [decaType, setDecaType] = useState("TOUS");
  const [decaStatut, setDecaStatut] = useState("TOUS");

  const [clientType, setClientType] = useState("TOUS");
  const [clientSegment, setClientSegment] = useState("TOUS");

  const [respType, setRespType] = useState("TOUS");

  // -------------------------------------------------------------------
  // 🔎 FILTRES PAR ONGLET
  // -------------------------------------------------------------------

  const ventesFiltrees = useMemo(
    () =>
      VENTES_DATA.filter((v) => isWithinPeriod(v.date, dateDebut, dateFin))
        .filter((v) =>
          venteClientType === "TOUS" ? true : v.clientType === venteClientType
        )
        .filter((v) =>
          venteModePaiement === "TOUS"
            ? true
            : v.modePaiement === venteModePaiement
        ),
    [dateDebut, dateFin, venteClientType, venteModePaiement]
  );

  const stockFiltre = useMemo(
    () =>
      STOCK_DATA.filter((s) =>
        stockEtat === "TOUS" ? true : s.etat === stockEtat
      ).filter((s) =>
        stockCategorie === "TOUS" ? true : s.categorie === stockCategorie
      ),
    [stockEtat, stockCategorie]
  );

  const decaissementsFiltres = useMemo(
    () =>
      DECAISSEMENTS_DATA.filter((d) =>
        isWithinPeriod(d.date, dateDebut, dateFin)
      )
        .filter((d) => (decaType === "TOUS" ? true : d.type === decaType))
        .filter((d) =>
          decaStatut === "TOUS" ? true : d.statut === decaStatut
        ),
    [dateDebut, dateFin, decaType, decaStatut]
  );

  const clientsFiltres = useMemo(
    () =>
      CLIENTS_DATA.filter((c) =>
        clientType === "TOUS" ? true : c.type === clientType
      ).filter((c) =>
        clientSegment === "TOUS" ? true : c.segment === clientSegment
      ),
    [clientType, clientSegment]
  );

  const respOpsFiltres = useMemo(
    () =>
      RESPONSABLE_OPS_DATA.filter((o) =>
        isWithinPeriod(o.date, dateDebut, dateFin)
      ).filter((o) => (respType === "TOUS" ? true : o.type === respType)),
    [dateDebut, dateFin, respType]
  );

  // -------------------------------------------------------------------
  // 📈 KPI PAR ONGLET
  // -------------------------------------------------------------------

  const ventesStats = useMemo(() => {
    const totalCA = ventesFiltrees
      .filter((v) => v.statut === "VALIDE")
      .reduce((s, v) => s + v.montant, 0);
    const nbVentesValide = ventesFiltrees.filter(
      (v) => v.statut === "VALIDE"
    ).length;
    const nbVentesAnnulee = ventesFiltrees.filter(
      (v) => v.statut === "ANNULEE"
    ).length;
    const nbArticles = ventesFiltrees
      .filter((v) => v.statut === "VALIDE")
      .reduce((s, v) => s + v.nbArticles, 0);
    const panierMoyen =
      nbVentesValide > 0 ? Math.round(totalCA / nbVentesValide) : 0;

    return { totalCA, nbVentesValide, nbVentesAnnulee, nbArticles, panierMoyen };
  }, [ventesFiltrees]);

  const stockStats = useMemo(() => {
    const totalProduits = stockFiltre.length;
    const ruptures = stockFiltre.filter((s) => s.etat === "RUPTURE").length;
    const sousSeuil = stockFiltre.filter(
      (s) => s.etat === "SOUS_SEUIL"
    ).length;
    const valeurTotale = stockFiltre.reduce((s, p) => s + p.valeurStock, 0);
    const valeurCritique = stockFiltre
      .filter((s) => s.etat !== "NORMAL")
      .reduce((s, p) => s + p.valeurStock, 0);

    return { totalProduits, ruptures, sousSeuil, valeurTotale, valeurCritique };
  }, [stockFiltre]);

  const decaStats = useMemo(() => {
    const totalMontant = decaissementsFiltres.reduce((s, d) => s + d.montant, 0);
    const nbDeca = decaissementsFiltres.length;
    const moyenne = nbDeca > 0 ? Math.round(totalMontant / nbDeca) : 0;
    const nbValides = decaissementsFiltres.filter(
      (d) => d.statut === "VALIDE"
    ).length;
    const nbEnAttente = decaissementsFiltres.filter(
      (d) => d.statut === "EN_ATTENTE"
    ).length;

    return { totalMontant, nbDeca, moyenne, nbValides, nbEnAttente };
  }, [decaissementsFiltres]);

  const clientsStats = useMemo(() => {
    const nbClients = clientsFiltres.length;
    const caTotal = clientsFiltres.reduce((s, c) => s + c.ca, 0);
    const remisesTotales = clientsFiltres.reduce((s, c) => s + c.remises, 0);
    const nbClientsSpeciaux = clientsFiltres.filter(
      (c) => c.type === "SPECIAL"
    ).length;

    return { nbClients, caTotal, remisesTotales, nbClientsSpeciaux };
  }, [clientsFiltres]);

  const respStats = useMemo(() => {
    const totalOps = respOpsFiltres.length;
    const creations = respOpsFiltres.filter(
      (o) => o.type === "UTILISATEUR_CREATION"
    ).length;
    const validationsDeca = respOpsFiltres.filter(
      (o) => o.type === "DECAISSEMENT_VALIDATION"
    ).length;
    const refusDeca = respOpsFiltres.filter(
      (o) => o.type === "DECAISSEMENT_REFUS"
    ).length;

    return { totalOps, creations, validationsDeca, refusDeca };
  }, [respOpsFiltres]);

  // -------------------------------------------------------------------
  // 📉 Données graphiques par onglet
  // -------------------------------------------------------------------

  const ventesSerieCA = useMemo(
    () => groupByDateSum(ventesFiltrees, "date", "montant"),
    [ventesFiltrees]
  );

  const ventesModesPaiement = useMemo(
    () => groupByKeyCount(ventesFiltrees, "modePaiement"),
    [ventesFiltrees]
  );

  const stockParEtat = useMemo(
    () => groupByKeyCount(stockFiltre, "etat"),
    [stockFiltre]
  );

  const stockParCategorieValeur = useMemo(
    () => groupByKeySum(stockFiltre, "categorie", "valeurStock"),
    [stockFiltre]
  );

  const decaSerieMontant = useMemo(
    () => groupByDateSum(decaissementsFiltres, "date", "montant"),
    [decaissementsFiltres]
  );

  const decaParType = useMemo(
    () => groupByKeySum(decaissementsFiltres, "type", "montant"),
    [decaissementsFiltres]
  );

  const clientsParCA = useMemo(
    () =>
      [...clientsFiltres]
        .sort((a, b) => b.ca - a.ca)
        .slice(0, 5)
        .map((c) => ({ name: c.nom, value: c.ca })),
    [clientsFiltres]
  );

  const clientsTypeRepartition = useMemo(
    () => groupByKeyCount(clientsFiltres, "type"),
    [clientsFiltres]
  );

  const respOpsParDate = useMemo(
    () => groupByDateSum(respOpsFiltres, "date", "id"), // id juste pour compter
    [respOpsFiltres]
  );

  const respOpsParType = useMemo(
    () => groupByKeyCount(respOpsFiltres, "type"),
    [respOpsFiltres]
  );

  const activeTabLabel =
    REPORT_TABS.find((t) => t.id === activeTab)?.label || "Rapport";

  // -------------------------------------------------------------------
  // 🧮 KPI (cartes custom, lisibles) — mêmes pour tous les onglets
  // -------------------------------------------------------------------

  const baseKpiCard =
    "rounded-2xl border px-4 py-3 bg-white shadow-sm flex flex-col gap-2";

  const renderKpis = () => {
    if (activeTab === "ventes") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* CA total */}
          <div className={`${baseKpiCard} border-indigo-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                CA total
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                <TrendingUp size={12} />
                <span>Ventes</span>
              </span>
            </div>
            <div className="text-lg font-bold text-indigo-700">
              {formatFCFA(ventesStats.totalCA)}
            </div>
            <p className="text-[11px] text-gray-400">
              Ventes validées sur la période sélectionnée.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{ventesStats.nbVentesValide} ticket(s) validé(s)</span>
              <span className="h-3 w-px bg-gray-200" />
              <span>{ventesStats.nbVentesAnnulee} annulé(s)</span>
            </div>
          </div>

          {/* Volume de ventes */}
          <div className={`${baseKpiCard} border-emerald-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Volume de ventes
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <BarChart3 size={12} />
                <span>Tickets</span>
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {ventesStats.nbVentesValide}
            </div>
            <p className="text-[11px] text-gray-400">
              Tickets de vente validés (hors annulations).
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{ventesStats.nbArticles} article(s) vendus</span>
            </div>
          </div>

          {/* Panier moyen */}
          <div className={`${baseKpiCard} border-sky-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Panier moyen
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
                <PieChart size={12} />
                <span>Par ticket</span>
              </span>
            </div>
            <div className="text-lg font-bold text-sky-700">
              {formatFCFA(ventesStats.panierMoyen)}
            </div>
            <p className="text-[11px] text-gray-400">
              Chiffre d’affaires moyen par vente validée.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>Basé sur {ventesStats.nbVentesValide} vente(s)</span>
            </div>
          </div>

          {/* Statut des ventes */}
          <div className={`${baseKpiCard} border-amber-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Qualité des ventes
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <AlertCircle size={12} />
                <span>Contrôle</span>
              </span>
            </div>
            <div className="text-lg font-bold text-amber-700">
              {ventesStats.nbVentesAnnulee} vente(s) annulée(s)
            </div>
            <p className="text-[11px] text-gray-400">
              Retours, erreurs de caisse, corrections de tickets.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>
                {ventesStats.nbVentesValide + ventesStats.nbVentesAnnulee} ticket(s) au total
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "stock") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Valeur du stock */}
          <div className={`${baseKpiCard} border-emerald-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Valeur du stock
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <Package size={12} />
                <span>Global</span>
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {formatFCFA(stockStats.valeurTotale)}
            </div>
            <p className="text-[11px] text-gray-400">
              Valeur financière estimée des produits filtrés.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{stockStats.totalProduits} référence(s)</span>
            </div>
          </div>

          {/* Produits critiques */}
          <div className={`${baseKpiCard} border-rose-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Produits critiques
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                <AlertCircle size={12} />
                <span>Risque</span>
              </span>
            </div>
            <div className="text-lg font-bold text-rose-700">
              {stockStats.ruptures + stockStats.sousSeuil}
            </div>
            <p className="text-[11px] text-gray-400">
              Références en rupture ou sous le seuil d’alerte.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{stockStats.ruptures} rupture(s)</span>
              <span className="h-3 w-px bg-gray-200" />
              <span>{stockStats.sousSeuil} sous-seuil</span>
            </div>
          </div>

          {/* Ruptures */}
          <div className={`${baseKpiCard} border-indigo-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Ruptures
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                <Package size={12} />
                <span>Urgent</span>
              </span>
            </div>
            <div className="text-lg font-bold text-indigo-700">
              {stockStats.ruptures}
            </div>
            <p className="text-[11px] text-gray-400">
              Références totalement épuisées en stock.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>Valeur critique : {formatFCFA(stockStats.valeurCritique)}</span>
            </div>
          </div>

          {/* Sous seuil */}
          <div className={`${baseKpiCard} border-amber-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Sous seuil
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <TrendingUp size={12} />
                <span>Prévention</span>
              </span>
            </div>
            <div className="text-lg font-bold text-amber-700">
              {stockStats.sousSeuil}
            </div>
            <p className="text-[11px] text-gray-400">
              Produits à risque de rupture à court terme.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>
                {stockStats.totalProduits -
                  stockStats.sousSeuil -
                  stockStats.ruptures}{" "}
                produit(s) en stock normal
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "decaissements") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Montant total */}
          <div className={`${baseKpiCard} border-rose-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Montant total
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                <DollarSign size={12} />
                <span>Sorties</span>
              </span>
            </div>
            <div className="text-lg font-bold text-rose-700">
              {formatFCFA(decaStats.totalMontant)}
            </div>
            <p className="text-[11px] text-gray-400">
              Total des décaissements sur la période.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{decaStats.nbDeca} opération(s)</span>
            </div>
          </div>

          {/* Décaissements validés */}
          <div className={`${baseKpiCard} border-emerald-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Décaissements validés
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <ClipboardList size={12} />
                <span>Confirmés</span>
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {decaStats.nbValides}
            </div>
            <p className="text-[11px] text-gray-400">
              Opérations validées par la caisse / responsable.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{decaStats.nbEnAttente} en attente</span>
            </div>
          </div>

          {/* Montant moyen */}
          <div className={`${baseKpiCard} border-indigo-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Montant moyen
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                <BarChart3 size={12} />
                <span>Par opé.</span>
              </span>
            </div>
            <div className="text-lg font-bold text-indigo-700">
              {formatFCFA(decaStats.moyenne)}
            </div>
            <p className="text-[11px] text-gray-400">
              Moyenne par opération de décaissement.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>Basé sur {decaStats.nbDeca} opération(s)</span>
            </div>
          </div>

          {/* Décaissements en attente */}
          <div className={`${baseKpiCard} border-amber-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                En attente
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <AlertCircle size={12} />
                <span>À suivre</span>
              </span>
            </div>
            <div className="text-lg font-bold text-amber-700">
              {decaStats.nbEnAttente}
            </div>
            <p className="text-[11px] text-gray-400">
              Décaissements encore non validés.
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === "clients") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* CA clients */}
          <div className={`${baseKpiCard} border-emerald-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                CA clients
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp size={12} />
                <span>Portefeuille</span>
              </span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {formatFCFA(clientsStats.caTotal)}
            </div>
            <p className="text-[11px] text-gray-400">
              Chiffre d’affaires généré par les clients filtrés.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span>{clientsStats.nbClients} client(s)</span>
            </div>
          </div>

          {/* Clients spéciaux */}
          <div className={`${baseKpiCard} border-rose-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Clients spéciaux
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                <Users size={12} />
                <span>VIP</span>
              </span>
            </div>
            <div className="text-lg font-bold text-rose-700">
              {clientsStats.nbClientsSpeciaux}
            </div>
            <p className="text-[11px] text-gray-400">
              Écoles, entreprises et comptes à forte valeur.
            </p>
          </div>

          {/* Remises */}
          <div className={`${baseKpiCard} border-amber-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                Remises accordées
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <DollarSign size={12} />
                <span>Réduc.</span>
              </span>
            </div>
            <div className="text-lg font-bold text-amber-700">
              {formatFCFA(clientsStats.remisesTotales)}
            </div>
            <p className="text-[11px] text-gray-400">
              Total des réductions financières pour ces clients.
            </p>
          </div>

          {/* CA moyen par client */}
          <div className={`${baseKpiCard} border-indigo-200`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">
                CA moyen / client
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                <BarChart3 size={12} />
                <span>Analyse</span>
              </span>
            </div>
            <div className="text-lg font-bold text-indigo-700">
              {clientsStats.nbClients > 0
                ? formatFCFA(
                    Math.round(clientsStats.caTotal / clientsStats.nbClients)
                  )
                : formatFCFA(0)}
            </div>
            <p className="text-[11px] text-gray-400">
              CA moyen par client sur le portefeuille filtré.
            </p>
          </div>
        </div>
      );
    }

    // Responsable
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Total opérations */}
        <div className={`${baseKpiCard} border-indigo-200`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase">
              Actions du responsable
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
              <ClipboardList size={12} />
              <span>Administration</span>
            </span>
          </div>
          <div className="text-lg font-bold text-indigo-700">
            {respStats.totalOps}
          </div>
          <p className="text-[11px] text-gray-400">
            Opérations administratives sur la période.
          </p>
        </div>

        {/* Créations d'utilisateurs */}
        <div className={`${baseKpiCard} border-emerald-200`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase">
              Utilisateurs créés
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              <Users size={12} />
              <span>Comptes</span>
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {respStats.creations}
          </div>
          <p className="text-[11px] text-gray-400">
            Nouveaux comptes utilisateurs enregistrés.
          </p>
        </div>

        {/* Décaissements validés */}
        <div className={`${baseKpiCard} border-sky-200`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase">
              Décaissements validés
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
              <DollarSign size={12} />
              <span>Contrôle</span>
            </span>
          </div>
          <div className="text-lg font-bold text-sky-700">
            {respStats.validationsDeca}
          </div>
          <p className="text-[11px] text-gray-400">
            Décaissements approuvés par vos soins.
          </p>
        </div>

        {/* Décaissements refusés */}
        <div className={`${baseKpiCard} border-rose-200`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase">
              Décaissements refusés
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
              <AlertCircle size={12} />
              <span>Anomalies</span>
            </span>
          </div>
          <div className="text-lg font-bold text-rose-700">
            {respStats.refusDeca}
          </div>
          <p className="text-[11px] text-gray-400">
            Refus motivés (pièce manquante, montant incohérent, etc.).
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------
  // 🎚️ Filtres spécifiques rendus dans la carte Filtres
  // -------------------------------------------------------------------

  const renderTabSpecificFilters = () => {
    if (activeTab === "ventes") {
      return (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Type de client
            </label>
            <select
              value={venteClientType}
              onChange={(e) => setVenteClientType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="NORMAL">Normal</option>
              <option value="SPECIAL">Client spécial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Mode de paiement
            </label>
            <select
              value={venteModePaiement}
              onChange={(e) => setVenteModePaiement(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="ESPECES">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARTE">Carte</option>
              <option value="VIREMENT">Virement</option>
            </select>
          </div>
        </>
      );
    }

    if (activeTab === "stock") {
      return (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              État de stock
            </label>
            <select
              value={stockEtat}
              onChange={(e) => setStockEtat(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="NORMAL">Normal</option>
              <option value="SOUS_SEUIL">Sous seuil</option>
              <option value="RUPTURE">Rupture</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Catégorie
            </label>
            <select
              value={stockCategorie}
              onChange={(e) => setStockCategorie(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Toutes</option>
              <option value="Papeterie">Papeterie</option>
              <option value="Fournitures bureau">Fournitures bureau</option>
            </select>
          </div>
        </>
      );
    }

    if (activeTab === "decaissements") {
      return (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Type de décaissement
            </label>
            <select
              value={decaType}
              onChange={(e) => setDecaType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="FOURNISSEUR">Fournisseur</option>
              <option value="CHARGES">Charges</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Statut
            </label>
            <select
              value={decaStatut}
              onChange={(e) => setDecaStatut(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="VALIDE">Validé</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>
        </>
      );
    }

    if (activeTab === "clients") {
      return (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Type de client
            </label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="NORMAL">Normal</option>
              <option value="SPECIAL">Client spécial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Segment
            </label>
            <select
              value={clientSegment}
              onChange={(e) => setClientSegment(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            >
              <option value="TOUS">Tous</option>
              <option value="Particulier">Particulier</option>
              <option value="École">École</option>
              <option value="Entreprise">Entreprise</option>
            </select>
          </div>
        </>
      );
    }

    // Responsable
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Type d’opération
        </label>
        <select
          value={respType}
          onChange={(e) => setRespType(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
        >
          <option value="TOUS">Toutes</option>
          <option value="UTILISATEUR_CREATION">Création utilisateur</option>
          <option value="ROLE_MODIFICATION">Modification de rôle</option>
          <option value="DECAISSEMENT_VALIDATION">
            Validation décaissement
          </option>
          <option value="DECAISSEMENT_REFUS">Refus décaissement</option>
        </select>
      </div>
    );
  };

  // -------------------------------------------------------------------
  // 📊 GRAPHIQUES (ChartBox) PAR ONGLET
  // -------------------------------------------------------------------

  const renderCharts = () => {
    if (activeTab === "ventes") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartBox
            title="Évolution du CA"
            icon={<BarChart3 size={18} />}
            data={ventesSerieCA}
            dataKey1="valeur"
            type="bar"
          />
          <ChartBox
            title="Répartition par mode de paiement"
            icon={<PieChart size={18} />}
            data={ventesModesPaiement}
            dataKey1="value"
            type="pie"
          />
        </div>
      );
    }

    if (activeTab === "stock") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartBox
            title="Répartition par état de stock"
            icon={<PieChart size={18} />}
            data={stockParEtat}
            dataKey1="value"
            type="pie"
          />
          <ChartBox
            title="Valeur stock par catégorie"
            icon={<BarChart3 size={18} />}
            data={stockParCategorieValeur}
            dataKey1="value"
            type="bar"
          />
        </div>
      );
    }

    if (activeTab === "decaissements") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartBox
            title="Décaissements par date"
            icon={<BarChart3 size={18} />}
            data={decaSerieMontant}
            dataKey1="valeur"
            type="bar"
          />
          <ChartBox
            title="Répartition par type de décaissement"
            icon={<PieChart size={18} />}
            data={decaParType}
            dataKey1="value"
            type="pie"
          />
        </div>
      );
    }

    if (activeTab === "clients") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartBox
            title="Top clients par CA"
            icon={<BarChart3 size={18} />}
            data={clientsParCA}
            dataKey1="value"
            type="bar"
          />
          <ChartBox
            title="Répartition clients (normal vs spéciaux)"
            icon={<PieChart size={18} />}
            data={clientsTypeRepartition}
            dataKey1="value"
            type="pie"
          />
        </div>
      );
    }

    // Responsable
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartBox
          title="Actions du responsable par date"
          icon={<BarChart3 size={18} />}
          data={respOpsParDate}
          dataKey1="valeur"
          type="bar"
        />
        <ChartBox
          title="Répartition par type d’action"
          icon={<PieChart size={18} />}
          data={respOpsParType}
          dataKey1="value"
          type="pie"
        />
      </div>
    );
  };

  // -------------------------------------------------------------------
  // 🧾 TABLEAU DÉTAILLÉ PAR ONGLET
  // -------------------------------------------------------------------

  const renderTable = () => {
    if (activeTab === "ventes") {
      return (
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Date
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Réf.
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Vendeur
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Client
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Type
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Montant
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Articles
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Paiement
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {ventesFiltrees.length ? (
              ventesFiltrees.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">{v.date}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{v.ref}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {v.vendeur}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {v.client}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {v.clientType === "SPECIAL" ? "Spécial" : "Normal"}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {formatFCFA(v.montant)}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {v.nbArticles}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {v.modePaiement}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {v.statut}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                >
                  Aucune vente trouvée sur cette période avec ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "stock") {
      return (
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Code
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Libellé
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Fournisseur
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Stock
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Seuil
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                État
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Valeur stock
              </th>
            </tr>
          </thead>
          <tbody>
            {stockFiltre.length ? (
              stockFiltre.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">{p.code}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {p.libelle}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {p.categorie}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {p.fournisseur}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {p.stockActuel}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {p.seuilAlerte}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {p.etat === "RUPTURE"
                      ? "Rupture"
                      : p.etat === "SOUS_SEUIL"
                      ? "Sous seuil"
                      : "Normal"}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {formatFCFA(p.valeurStock)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                >
                  Aucun produit ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "decaissements") {
      return (
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Date
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Réf.
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Type
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Fournisseur / Bénéficiaire
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Motif
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Montant
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Paiement
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {decaissementsFiltres.length ? (
              decaissementsFiltres.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">{d.date}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{d.ref}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{d.type}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {d.fournisseur}
                  </td>
                  <td className="px-4 py-2.5">{d.motif}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {formatFCFA(d.montant)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {d.modePaiement}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {d.statut}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                >
                  Aucun décaissement trouvé sur cette période avec ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "clients") {
      return (
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
            <tr>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Client
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Type
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Segment
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Nb ventes
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                CA
              </th>
              <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                Remises
              </th>
              <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                Dernier achat
              </th>
            </tr>
          </thead>
          <tbody>
            {clientsFiltres.length ? (
              clientsFiltres.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">{c.nom}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {c.type === "SPECIAL" ? "Spécial" : "Normal"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {c.segment}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {c.nbVentes}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {formatFCFA(c.ca)}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {formatFCFA(c.remises)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {c.derniereAchat}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                >
                  Aucun client ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    // Responsable
    return (
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
          <tr>
            <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
              Date
            </th>
            <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
              Type d’opération
            </th>
            <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
              Module
            </th>
            <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
              Détail
            </th>
            <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {respOpsFiltres.length ? (
            respOpsFiltres.map((o) => (
              <tr
                key={o.id}
                className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
              >
                <td className="px-4 py-2.5 whitespace-nowrap">{o.date}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{o.type}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{o.module}</td>
                <td className="px-4 py-2.5">{o.detail}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{o.statut}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="text-center text-gray-400 py-6 text-xs sm:text-sm"
              >
                Aucune opération responsable trouvée avec ces filtres.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  // -------------------------------------------------------------------
  // 📤 Export PDF selon onglet
  // -------------------------------------------------------------------

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `Rapport ${activeTabLabel} — ${BOUTIQUE_LABEL}`;
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 22);

    let head = [];
    let body = [];

    if (activeTab === "ventes") {
      head = [
        [
          "Date",
          "Réf.",
          "Vendeur",
          "Client",
          "Type",
          "Montant",
          "Articles",
          "Paiement",
          "Statut",
        ],
      ];
      body = ventesFiltrees.map((v) => [
        v.date,
        v.ref,
        v.vendeur,
        v.client,
        v.clientType,
        formatFCFA(v.montant),
        v.nbArticles,
        v.modePaiement,
        v.statut,
      ]);
    } else if (activeTab === "stock") {
      head = [
        [
          "Code",
          "Libellé",
          "Catégorie",
          "Fournisseur",
          "Stock",
          "Seuil",
          "État",
          "Valeur",
        ],
      ];
      body = stockFiltre.map((p) => [
        p.code,
        p.libelle,
        p.categorie,
        p.fournisseur,
        p.stockActuel,
        p.seuilAlerte,
        p.etat,
        formatFCFA(p.valeurStock),
      ]);
    } else if (activeTab === "decaissements") {
      head = [
        [
          "Date",
          "Réf.",
          "Type",
          "Fournisseur",
          "Motif",
          "Montant",
          "Paiement",
          "Statut",
        ],
      ];
      body = decaissementsFiltres.map((d) => [
        d.date,
        d.ref,
        d.type,
        d.fournisseur,
        d.motif,
        formatFCFA(d.montant),
        d.modePaiement,
        d.statut,
      ]);
    } else if (activeTab === "clients") {
      head = [
        [
          "Client",
          "Type",
          "Segment",
          "Nb ventes",
          "CA",
          "Remises",
          "Dernier achat",
        ],
      ];
      body = clientsFiltres.map((c) => [
        c.nom,
        c.type,
        c.segment,
        c.nbVentes,
        formatFCFA(c.ca),
        formatFCFA(c.remises),
        c.derniereAchat,
      ]);
    } else {
      // Responsable
      head = [["Date", "Type", "Module", "Détail", "Statut"]];
      body = respOpsFiltres.map((o) => [
        o.date,
        o.type,
        o.module,
        o.detail,
        o.statut,
      ]);
    }

    doc.autoTable({
      startY: 30,
      head,
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save(
      `Rapport_${activeTab}_${dateDebut}_au_${dateFin}.pdf`.replaceAll(
        " ",
        "_"
      )
    );
  };

  // -------------------------------------------------------------------
  // 🧱 Rendu principal
  // -------------------------------------------------------------------

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-7">
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
                Module Rapports — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Rapports & analyses
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Vue analytique des ventes, stocks, décaissements, clients et de
                vos propres actions pour {BOUTIQUE_LABEL}.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période du{" "}
              <span className="font-semibold">{dateDebut}</span> au{" "}
              <span className="font-semibold">{dateFin}</span> • Rapport{" "}
              <span className="font-semibold">{activeTabLabel}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition"
            >
              <FileDown className="w-4 h-4" />
              Exporter en PDF
            </button>
          </div>
        </motion.header>

        {/* ONGLET RAPPORTS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative text-left rounded-2xl border px-4 py-3 transition shadow-sm ${
                  isActive
                    ? "border-[#472EAD] bg-white"
                    : "border-[#E4E0FF] bg-white/80 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-[#F7F5FF] text-[#472EAD]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#2F1F7A]">
                      {tab.label}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Rapport dédié
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
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {/* Boutique (fixée) */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Boutique
                </label>
                <div className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 text-gray-600">
                  {BOUTIQUE_LABEL}
                </div>
              </div>

              {/* Filtres spécifiques onglet */}
              {renderTabSpecificFilters()}
            </div>
          </div>

          {/* KPI */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 rounded-2xl border border-[#E4E0FF] shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#472EAD]" />
                  <span className="text-sm font-semibold text-[#2F1F7A]">
                    Indicateurs clés — {activeTabLabel}
                  </span>
                </div>
                {activeTab === "stock" &&
                  (stockStats.ruptures > 0 || stockStats.sousSeuil > 0) && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        {stockStats.ruptures} rupture(s),{" "}
                        {stockStats.sousSeuil} sous-seuil
                      </span>
                    </div>
                  )}
              </div>
              {renderKpis()}
            </div>
          </div>
        </section>

        {/* GRAPHIQUES */}
        <section className="mt-2">{renderCharts()}</section>

        {/* TABLEAU */}
        <section className="mt-4">
          <div className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5 overflow-x-auto">
            <h3 className="text-sm sm:text-base font-semibold text-[#2F1F7A] mb-3">
              Détail du rapport — {activeTabLabel}
            </h3>
            {renderTable()}
          </div>
        </section>
      </div>
    </div>
  );
}

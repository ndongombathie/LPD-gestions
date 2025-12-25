// ==========================================================
// 📦 Inventaire.jsx — Interface Responsable (LPD Manager)
// Inventaire Boutique Colobane : écarts, pertes, gains, synthèse
// - Comptage périodique (données simulées)
// - Filtres : période, catégorie, fournisseur, type d’écart, recherche
// - KPI financiers en bloc structuré (théorique, réel, pertes, gains…)
// - Graphiques : évolution valeurs & répartition des écarts
// - Export PDF + bouton "Générer les ajustements" (simulation)
// ==========================================================

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  CalendarDays,
  Search,
  Layers,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Percent,
  FileDown,
  PackageOpen,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "sonner";

import ChartBox from "../components/ChartBox";

const todayISO = () => new Date().toISOString().slice(0, 10);

// ==========================================================
// 🧩 Helpers
// ==========================================================
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const formatPercent = (value) => {
  if (!isFinite(value) || isNaN(value)) return "0,0 %";
  const v = value * 100;
  return `${v.toFixed(1).replace(".", ",")} %`;
};

// ==========================================================
// 🧪 Données simulées d’inventaire — Boutique Colobane
// Chaque ligne représente un produit contrôlé lors d’un inventaire
// ==========================================================
const INVENTAIRE_EXEMPLE = [
  {
    id: 1,
    date: "2025-11-01",
    reference: "PROD-0001",
    produit: "Ramette A4 80g",
    categorie: "Papeterie",
    fournisseur: "PAPDISK",
    qteTheorique: 120,
    qteReelle: 110,
    prixUnitaire: 2500,
    commentaire: "Écart négatif probablement dû à des ventes non comptabilisées",
  },
  {
    id: 2,
    date: "2025-11-01",
    reference: "PROD-0002",
    produit: "Stylo bille bleu",
    categorie: "Papeterie",
    fournisseur: "Office Pro",
    qteTheorique: 300,
    qteReelle: 305,
    prixUnitaire: 200,
    commentaire: "Surplus constaté après recomptage",
  },
  {
    id: 3,
    date: "2025-11-02",
    reference: "PROD-0003",
    produit: "Classeur A4 à levier",
    categorie: "Papeterie",
    fournisseur: "PAPDISK",
    qteTheorique: 60,
    qteReelle: 52,
    prixUnitaire: 1500,
    commentaire: "Casse / pertes en rayon",
  },
  {
    id: 4,
    date: "2025-11-02",
    reference: "PROD-0004",
    produit: "Surligneur jaune",
    categorie: "Papeterie",
    fournisseur: "Office Pro",
    qteTheorique: 80,
    qteReelle: 80,
    prixUnitaire: 600,
    commentaire: "Aucun écart constaté",
  },
  {
    id: 5,
    date: "2025-11-03",
    reference: "PROD-0005",
    produit: "Calculatrice scientifique",
    categorie: "Informatique",
    fournisseur: "Tech Import",
    qteTheorique: 25,
    qteReelle: 23,
    prixUnitaire: 15000,
    commentaire: "Manque 2 pièces (erreur de réception ou vol)",
  },
  {
    id: 6,
    date: "2025-11-03",
    reference: "PROD-0006",
    produit: "Clé USB 32 Go",
    categorie: "Informatique",
    fournisseur: "Tech Import",
    qteTheorique: 40,
    qteReelle: 43,
    prixUnitaire: 8000,
    commentaire: "Surplus suite à une réception non saisie",
  },
  {
    id: 7,
    date: "2025-11-04",
    reference: "PROD-0007",
    produit: "Agenda 2026",
    categorie: "Papeterie",
    fournisseur: "PAPDISK",
    qteTheorique: 50,
    qteReelle: 49,
    prixUnitaire: 3500,
    commentaire: "Un exemplaire abîmé retiré de la vente",
  },
  {
    id: 8,
    date: "2025-11-04",
    reference: "PROD-0008",
    produit: "Carnet spirale petit format",
    categorie: "Papeterie",
    fournisseur: "Office Pro",
    qteTheorique: 150,
    qteReelle: 150,
    prixUnitaire: 1200,
    commentaire: "Stock parfaitement cohérent",
  },
];

// ==========================================================
// 🧮 Calcul des stats à partir des lignes filtrées
// ==========================================================
function computeStats(lignes) {
  if (!lignes.length) {
    return {
      totalArticles: 0,
      totalTheo: 0,
      totalReel: 0,
      pertes: 0,
      gains: 0,
      ecartGlobal: 0,
      tauxEcart: 0,
    };
  }

  let totalTheo = 0;
  let totalReel = 0;
  let pertes = 0;
  let gains = 0;

  lignes.forEach((l) => {
    const theo = Number(l.qteTheorique || 0) * Number(l.prixUnitaire || 0);
    const reel = Number(l.qteReelle || 0) * Number(l.prixUnitaire || 0);
    const ecart = reel - theo;

    totalTheo += theo;
    totalReel += reel;

    if (ecart < 0) {
      pertes += Math.abs(ecart);
    } else if (ecart > 0) {
      gains += ecart;
    }
  });

  const ecartGlobal = totalReel - totalTheo;
  const tauxEcart = totalTheo ? ecartGlobal / totalTheo : 0;

  return {
    totalArticles: lignes.length,
    totalTheo,
    totalReel,
    pertes,
    gains,
    ecartGlobal,
    tauxEcart,
  };
}

// Regroupement par date pour le graphique d’évolution
function buildEvolutionData(lignes) {
  const map = new Map();

  lignes.forEach((l) => {
    const key = l.date;
    const exist = map.get(key) || { name: key, theorique: 0, reel: 0 };
    const theo = Number(l.qteTheorique || 0) * Number(l.prixUnitaire || 0);
    const reel = Number(l.qteReelle || 0) * Number(l.prixUnitaire || 0);
    exist.theorique += theo;
    exist.reel += reel;
    map.set(key, exist);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.name < b.name ? -1 : 1
  );
}

// Répartition des écarts par catégorie
function buildCategorieData(lignes) {
  const map = new Map();

  lignes.forEach((l) => {
    const cat = l.categorie || "Autres";
    const theo = Number(l.qteTheorique || 0) * Number(l.prixUnitaire || 0);
    const reel = Number(l.qteReelle || 0) * Number(l.prixUnitaire || 0);
    const ecart = reel - theo;
    const abs = Math.abs(ecart);
    const exist = map.get(cat) || { name: cat, value: 0 };
    exist.value += abs;
    map.set(cat, exist);
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

// ==========================================================
// 💰 Composant principal
// ==========================================================
export default function Inventaire() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());

  const [categorie, setCategorie] = useState("Toutes");
  const [fournisseur, setFournisseur] = useState("Tous");
  const [typeEcart, setTypeEcart] = useState("Tous"); // "Tous" | "Perte" | "Gain" | "Sans écart"
  const [recherche, setRecherche] = useState("");

  // Options dynamiques basées sur les données simulées
  const categorieOptions = useMemo(
    () => [
      "Toutes",
      ...Array.from(new Set(INVENTAIRE_EXEMPLE.map((l) => l.categorie))),
    ],
    []
  );
  const fournisseurOptions = useMemo(
    () => [
      "Tous",
      ...Array.from(new Set(INVENTAIRE_EXEMPLE.map((l) => l.fournisseur))),
    ],
    []
  );

  // 🔎 Filtrage des lignes
  const lignesFiltrees = useMemo(() => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);
    const q = (recherche || "").toLowerCase();

    return INVENTAIRE_EXEMPLE.filter((l) => {
      const d = new Date(l.date);
      if (isNaN(d.getTime())) return false;
      if (d < start || d > end) return false;

      if (categorie !== "Toutes" && l.categorie !== categorie) return false;
      if (fournisseur !== "Tous" && l.fournisseur !== fournisseur)
        return false;

      const ecartQte = Number(l.qteReelle || 0) - Number(l.qteTheorique || 0);
      if (typeEcart === "Perte" && !(ecartQte < 0)) return false;
      if (typeEcart === "Gain" && !(ecartQte > 0)) return false;
      if (typeEcart === "Sans écart" && ecartQte !== 0) return false;

      if (q) {
        const blob = [
          l.produit,
          l.reference,
          l.categorie,
          l.fournisseur,
          l.commentaire,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }, [dateDebut, dateFin, categorie, fournisseur, typeEcart, recherche]);

  const stats = useMemo(
    () => computeStats(lignesFiltrees),
    [lignesFiltrees]
  );

  const evolutionData = useMemo(
    () => buildEvolutionData(lignesFiltrees),
    [lignesFiltrees]
  );
  const categorieData = useMemo(
    () => buildCategorieData(lignesFiltrees),
    [lignesFiltrees]
  );

  const typeEcartData = useMemo(() => {
    const pertes = stats.pertes;
    const gains = stats.gains;
    const sansEcart =
      Math.max(stats.totalTheo, stats.totalReel) - pertes - gains;

    return [
      { name: "Pertes", value: Math.max(pertes, 0) },
      { name: "Gains", value: Math.max(gains, 0) },
      { name: "Sans écart", value: Math.max(sansEcart, 0) },
    ];
  }, [stats.pertes, stats.gains, stats.totalTheo, stats.totalReel]);

  // ========================================================
  // 📤 Export PDF
  // ========================================================
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(
      "Inventaire — Boutique Colobane (Librairie Papeterie Daradji)",
      14,
      16
    );
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 22);
    doc.text(
      `Filtres : Catégorie=${categorie} • Fournisseur=${fournisseur} • Type d’écart=${typeEcart}`,
      14,
      27
    );
    doc.text(
      `Lignes d’inventaire : ${lignesFiltrees.length}`,
      14,
      32
    );

    doc.autoTable({
      startY: 38,
      head: [
        [
          "Date",
          "Réf.",
          "Produit",
          "Catégorie",
          "Fournisseur",
          "Qté théor.",
          "Qté réelle",
          "Écart",
          "Valeur écart",
        ],
      ],
      body: lignesFiltrees.map((l) => {
        const ecartQte = Number(l.qteReelle || 0) - Number(l.qteTheorique || 0);
        const ecartValeur = ecartQte * Number(l.prixUnitaire || 0);
        return [
          l.date,
          l.reference,
          l.produit,
          l.categorie,
          l.fournisseur,
          l.qteTheorique,
          l.qteReelle,
          ecartQte,
          formatFCFA(ecartValeur),
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save(`Inventaire_Colobane_${dateDebut}_au_${dateFin}.pdf`);
    toast.success("Export PDF inventaire généré avec succès.");
  };

  // Simule la génération d’ajustements (futur endpoint)
  const handleGenerateAdjustments = () => {
    if (!lignesFiltrees.length) {
      toast.error(
        "Aucune ligne d’inventaire pour générer des ajustements sur cette période."
      );
      return;
    }

    // Ici, plus tard : appel API pour créer les écritures d’ajustement
    // await instance.post("/inventaire/ajustements", { lignes: lignesFiltrees });

    toast.success(
      "Simulation : ajustements de stock générés (journal d’inventaire à implémenter côté API)."
    );
  };

  const totalEcartArticle = (ligne) =>
    Number(ligne.qteReelle || 0) - Number(ligne.qteTheorique || 0);

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
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Inventaire — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Inventaire & écarts de stock — Boutique Colobane
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comptage physique, analyse des écarts et synthèse financière
                pour la boutique de Colobane.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période du{" "}
              <span className="font-semibold">{dateDebut}</span> au{" "}
              <span className="font-semibold">{dateFin}</span> •{" "}
              {lignesFiltrees.length} ligne
              {lignesFiltrees.length > 1 && "s"} d’inventaire affichée
              {lignesFiltrees.length > 1 && "s"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <button
              onClick={handleGenerateAdjustments}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition"
            >
              <PackageOpen className="w-4 h-4" />
              Générer les ajustements
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition"
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>
        </motion.header>

        {/* FILTRES + KPI */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* Filtres */}
          <div className="lg:col-span-1 bg-white/90 rounded-2xl border border-[#E4E0FF] shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#472EAD] font-semibold text-sm">
              <Filter size={16} />
              Filtres inventaire
            </div>

            <div className="space-y-3">
              {/* Période */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Période de comptage
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

              {/* Catégorie */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Catégorie
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                >
                  {categorieOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Fournisseur
                </label>
                <select
                  value={fournisseur}
                  onChange={(e) => setFournisseur(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                >
                  {fournisseurOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type d’écart */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Type d’écart
                </label>
                <select
                  value={typeEcart}
                  onChange={(e) => setTypeEcart(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                >
                  <option value="Tous">Tous</option>
                  <option value="Perte">Perte (écart négatif)</option>
                  <option value="Gain">Gain (écart positif)</option>
                  <option value="Sans écart">Sans écart</option>
                </select>
              </div>

              {/* Recherche */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Recherche produit / référence
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Nom produit, référence, commentaire…"
                    className="pl-9 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI en bloc structuré */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 rounded-2xl border border-[#E4E0FF] shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[#2F1F7A]">
                  Synthèse financière de l’inventaire — Boutique Colobane
                </h2>
                <span className="text-[11px] text-gray-400">
                  Basée sur les lignes d’inventaire filtrées
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Valeur stock théorique */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Valeur stock théorique
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Calculée depuis les quantités système (avant comptage
                        physique)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-indigo-700 font-mono">
                      {formatFCFA(stats.totalTheo)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {stats.totalArticles} article
                      {stats.totalArticles > 1 && "s"}
                    </p>
                  </div>
                </div>

                {/* Valeur stock réel */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <BarChart3 className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Valeur stock réel
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Résultat du comptage physique réalisé en boutique
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
                      {formatFCFA(stats.totalReel)}
                    </p>
                  </div>
                </div>

                {/* Pertes inventaire */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <ArrowDownRight className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Pertes inventaire
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Vols, casse, erreurs ou écarts négatifs constatés
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-rose-700 font-mono">
                      {formatFCFA(stats.pertes)}
                    </p>
                  </div>
                </div>

                {/* Gains / Surplus */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Gains / Surplus
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Surplus détectés (écarts positifs, régularisations)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-amber-700 font-mono">
                      {formatFCFA(stats.gains)}
                    </p>
                  </div>
                </div>

                {/* Écart global */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-700">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Écart global (réel − théorique)
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Différence totale entre la valeur théorique et la
                        valeur réelle
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm sm:text-base font-bold font-mono ${
                        stats.ecartGlobal < 0
                          ? "text-rose-700"
                          : stats.ecartGlobal > 0
                          ? "text-emerald-700"
                          : "text-slate-600"
                      }`}
                    >
                      {formatFCFA(stats.ecartGlobal)}
                    </p>
                  </div>
                </div>

                {/* Taux d’écart */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-700">
                      <Percent className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        Taux d’écart
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Écart global rapporté à la valeur théorique du stock
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-slate-700 font-mono">
                      {formatPercent(stats.tauxEcart)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GRAPHIQUES */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ChartBox
            title="Évolution de la valeur de stock (théorique vs réel)"
            icon={<BarChart3 size={18} />}
            data={evolutionData}
            dataKey1="theorique"
            dataKey2="reel"
            type="line"
          />

          <ChartBox
            title="Répartition des écarts par catégorie"
            icon={<Layers size={18} />}
            data={categorieData}
            dataKey1="value"
            type="pie"
          />
        </section>

        {/* Pie type d’écart */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ChartBox
            title="Répartition des écarts (pertes / gains / sans écart)"
            icon={<AlertTriangle size={18} />}
            data={typeEcartData}
            dataKey1="value"
            type="pie"
          />
        </section>

        {/* TABLEAU DÉTAILLÉ */}
        <section className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5 overflow-x-auto">
          <h3 className="text-sm sm:text-base font-semibold text-[#2F1F7A] mb-3">
            Détail des lignes d’inventaire — Colobane
          </h3>
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
                  Produit
                </th>
                <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                  Qté théorique
                </th>
                <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                  Qté réelle
                </th>
                <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                  Écart
                </th>
                <th className="px-4 py-3 text-right border-b border-[#E4E0FF]">
                  Valeur écart
                </th>
                <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                  Commentaire
                </th>
              </tr>
            </thead>
            <tbody>
              {lignesFiltrees.length ? (
                lignesFiltrees.map((l) => {
                  const ecartQte = totalEcartArticle(l);
                  const ecartValeur =
                    ecartQte * Number(l.prixUnitaire || 0);

                  const ecartClass =
                    ecartQte < 0
                      ? "text-rose-600"
                      : ecartQte > 0
                      ? "text-emerald-600"
                      : "text-slate-600";

                  return (
                    <tr
                      key={l.id}
                      className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.date}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.reference}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.produit}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.categorie}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.fournisseur}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {l.qteTheorique}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {l.qteReelle}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right whitespace-nowrap font-medium ${ecartClass}`}
                      >
                        {ecartQte}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right whitespace-nowrap font-medium ${ecartClass}`}
                      >
                        {formatFCFA(ecartValeur)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] text-gray-600">
                          {l.commentaire}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                  >
                    Aucune ligne d’inventaire trouvée pour cette période et ces
                    filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

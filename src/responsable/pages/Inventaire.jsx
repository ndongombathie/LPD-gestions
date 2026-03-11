// ==========================================================
// 📦 Inventaire.jsx — Version 3.0 (Avec API Réelles)
// Intégration complète avec les services API fournis
// ==========================================================

import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "sonner";

import ChartBox from "../components/ChartBox";
import { stockAPI } from "@/responsable/services/api/stock";
import { produitsAPI } from "@/responsable/services/api/produits";
import { commandesAPI } from "@/responsable/services/api/commandes";

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
// 💰 Composant principal — VERSION 3.0 (Avec API Réelles)
// ==========================================================
export default function Inventaire() {
  // États pour les filtres
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());
  const [categorie, setCategorie] = useState("Toutes");
  const [fournisseur, setFournisseur] = useState("Tous");
  const [typeEcart, setTypeEcart] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // États pour les données API
  const [inventaireData, setInventaireData] = useState([]);
  const [produitsData, setProduitsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingAdjustments, setGeneratingAdjustments] = useState(false);

  // Options dynamiques (à partir des données API)
  const categorieOptions = useMemo(
    () => [
      "Toutes",
      ...Array.from(new Set(inventaireData.map((l) => l.categorie || l.categorie_id))).filter(Boolean),
    ],
    [inventaireData]
  );
  const fournisseurOptions = useMemo(
    () => [
      "Tous",
      ...Array.from(new Set(inventaireData.map((l) => l.fournisseur || l.fournisseur_id))).filter(Boolean),
    ],
    [inventaireData]
  );

  // 🔄 Charger les données d'inventaire
  const fetchInventaireData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        date_debut: dateDebut,
        date_fin: dateFin,
        ...(categorie !== "Toutes" && { categorie }),
        ...(fournisseur !== "Tous" && { fournisseur }),
        ...(recherche && { search: recherche }),
      };

      const response = await stockAPI.getAll(params);
      setInventaireData(response.data || response || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données d\'inventaire');
      setInventaireData([]);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, categorie, fournisseur, recherche]);

  // 🔄 Charger la liste des produits (pour les références)
  const fetchProduitsData = useCallback(async () => {
    try {
      setLoadingProduits(true);
      const response = await produitsAPI.getAll({
        page: 1,
        perPage: 1000, // Charger beaucoup pour avoir toutes les références
        sortBy: 'nom',
      });
      setProduitsData(response.data || response || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoadingProduits(false);
    }
  }, []);

  // Initialiser les données
  useEffect(() => {
    fetchInventaireData();
    fetchProduitsData();
  }, [fetchInventaireData, fetchProduitsData]);

  // 🔎 Filtrage des lignes
  const lignesFiltrees = useMemo(() => {
    if (!inventaireData.length) return [];

    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    end.setHours(23, 59, 59, 999);
    const q = (recherche || "").toLowerCase();

    return inventaireData.filter((l) => {
      // Format de date différent selon l'API
      const dateInventaire = l.date_inventaire || l.date || l.created_at;
      if (!dateInventaire) return false;
      
      const d = new Date(dateInventaire);
      if (isNaN(d.getTime())) return false;
      if (d < start || d > end) return false;

      const lCategorie = l.categorie || l.categorie_id;
      const lFournisseur = l.fournisseur || l.fournisseur_id;
      
      if (categorie !== "Toutes" && lCategorie !== categorie) return false;
      if (fournisseur !== "Tous" && lFournisseur !== fournisseur) return false;

      const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
      const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
      const ecartQte = qteReelle - qteTheorique;
      
      if (typeEcart === "Perte" && !(ecartQte < 0)) return false;
      if (typeEcart === "Gain" && !(ecartQte > 0)) return false;
      if (typeEcart === "Sans écart" && ecartQte !== 0) return false;

      if (q) {
        const produitInfo = produitsData.find(p => p.id === l.produit_id) || {};
        const searchString = [
          produitInfo.nom || l.produit || '',
          produitInfo.reference || l.reference || '',
          lCategorie,
          lFournisseur,
          l.commentaire || l.raison || '',
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        
        if (!searchString.includes(q)) return false;
      }

      return true;
    });
  }, [inventaireData, dateDebut, dateFin, categorie, fournisseur, typeEcart, recherche, produitsData]);

  // 🧮 Calcul des stats
  const stats = useMemo(() => {
    if (!lignesFiltrees.length) {
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

    lignesFiltrees.forEach((l) => {
      const produitInfo = produitsData.find(p => p.id === l.produit_id) || {};
      const prixUnitaire = Number(l.prix_unitaire || l.prixUnitaire || produitInfo.prix_vente || 0);
      const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
      const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
      
      const theo = qteTheorique * prixUnitaire;
      const reel = qteReelle * prixUnitaire;
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
      totalArticles: lignesFiltrees.length,
      totalTheo,
      totalReel,
      pertes,
      gains,
      ecartGlobal,
      tauxEcart,
    };
  }, [lignesFiltrees, produitsData]);

  function buildEvolutionData(lignes) {
    const map = new Map();

    lignes.forEach((l) => {
      const dateInventaire = l.date_inventaire || l.date || l.created_at;
      if (!dateInventaire) return;
      
      const dateKey = dateInventaire.split('T')[0]; // Garder seulement YYYY-MM-DD
      const exist = map.get(dateKey) || { name: dateKey, theorique: 0, reel: 0 };
      
      const produitInfo = produitsData.find(p => p.id === l.produit_id) || {};
      const prixUnitaire = Number(l.prix_unitaire || l.prixUnitaire || produitInfo.prix_vente || 0);
      const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
      const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
      
      const theo = qteTheorique * prixUnitaire;
      const reel = qteReelle * prixUnitaire;
      
      exist.theorique += theo;
      exist.reel += reel;
      map.set(dateKey, exist);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name < b.name ? -1 : 1
    );
  }

  function buildCategorieData(lignes) {
    const map = new Map();

    lignes.forEach((l) => {
      const cat = l.categorie || l.categorie_id || "Autres";
      const produitInfo = produitsData.find(p => p.id === l.produit_id) || {};
      const prixUnitaire = Number(l.prix_unitaire || l.prixUnitaire || produitInfo.prix_vente || 0);
      const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
      const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
      const ecart = (qteReelle - qteTheorique) * prixUnitaire;
      const abs = Math.abs(ecart);
      
      const exist = map.get(cat) || { name: cat, value: 0 };
      exist.value += abs;
      map.set(cat, exist);
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }

  const evolutionData = useMemo(
    () => buildEvolutionData(lignesFiltrees),
    [lignesFiltrees, produitsData]
  );
  const categorieData = useMemo(
    () => buildCategorieData(lignesFiltrees),
    [lignesFiltrees, produitsData]
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

  // 📤 Export PDF
  const exportPDF = async () => {
    try {
      setGeneratingPDF(true);
      
      const doc = new jsPDF();
      doc.text(
        "Inventaire — Boutique Colobane (Librairie Papeterie Daradji)",
        14,
        16
      );
      doc.setFontSize(10);
      doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 22);
      doc.text(
        `Filtres : Catégorie=${categorie} • Fournisseur=${fournisseur} • Type d'écart=${typeEcart}`,
        14,
        27
      );
      doc.text(
        `Lignes d'inventaire : ${lignesFiltrees.length}`,
        14,
        32
      );

      const tableData = lignesFiltrees.map((l) => {
        const produitInfo = produitsData.find(p => p.id === l.produit_id) || {};
        const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
        const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
        const prixUnitaire = Number(l.prix_unitaire || l.prixUnitaire || produitInfo.prix_vente || 0);
        const ecartQte = qteReelle - qteTheorique;
        const ecartValeur = ecartQte * prixUnitaire;
        
        const dateInventaire = l.date_inventaire || l.date || l.created_at;
        const dateFormatted = dateInventaire ? dateInventaire.split('T')[0] : '';
        
        return [
          dateFormatted,
          produitInfo.reference || l.reference || 'N/A',
          produitInfo.nom || l.produit || 'N/A',
          l.categorie || l.categorie_id || 'N/A',
          l.fournisseur || l.fournisseur_id || 'N/A',
          qteTheorique,
          qteReelle,
          ecartQte,
          formatFCFA(ecartValeur),
        ];
      });

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
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 46, 173] },
      });

      doc.save(`Inventaire_Colobane_${dateDebut}_au_${dateFin}.pdf`);
      toast.success("Export PDF inventaire généré avec succès.");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // 📝 Générer les ajustements de stock
  const handleGenerateAdjustments = async () => {
    if (!lignesFiltrees.length) {
      toast.error(
        "Aucune ligne d'inventaire pour générer des ajustements sur cette période."
      );
      return;
    }

    try {
      setGeneratingAdjustments(true);
      
      // Filtrer les lignes avec écart
      const lignesAvecEcart = lignesFiltrees.filter(l => {
        const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
        const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
        return qteReelle !== qteTheorique;
      });

      let ajustementsReussis = 0;
      let ajustementsEchoues = 0;

      // Pour chaque ligne avec écart, créer un ajustement
      for (const ligne of lignesAvecEcart) {
        try {
          const qteTheorique = Number(ligne.qte_theorique || ligne.qteTheorique || ligne.quantite_theorique || 0);
          const qteReelle = Number(ligne.qte_reelle || ligne.qteReelle || ligne.quantite_reelle || 0);
          const quantiteAjustement = qteReelle - qteTheorique;
          
          // Utiliser l'API stock pour le transfert ou mise à jour
          await stockAPI.update(ligne.id || ligne.produit_id, {
            quantite: qteReelle,
            type: 'ajustement',
            raison: ligne.commentaire || `Ajustement après inventaire - Écart: ${quantiteAjustement}`,
            date_ajustement: new Date().toISOString(),
          });

          ajustementsReussis++;
        } catch (error) {
          ajustementsEchoues++;
        }
      }

      if (ajustementsReussis > 0) {
        toast.success(`${ajustementsReussis} ajustements de stock effectués avec succès`);
        
        // Recharger les données
        await fetchInventaireData();
      }
      
      if (ajustementsEchoues > 0) {
        toast.warning(`${ajustementsEchoues} ajustements ont échoué`);
      }

    } catch (error) {
      toast.error("Erreur lors de la génération des ajustements");
    } finally {
      setGeneratingAdjustments(false);
    }
  };

  // 🧮 Calcul écart par article
  const totalEcartArticle = (ligne) => {
    const qteTheorique = Number(ligne.qte_theorique || ligne.qteTheorique || ligne.quantite_theorique || 0);
    const qteReelle = Number(ligne.qte_reelle || ligne.qteReelle || ligne.quantite_reelle || 0);
    return qteReelle - qteTheorique;
  };

  // 🔄 Réinitialiser les filtres
  const resetFilters = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setDateDebut(d.toISOString().slice(0, 10));
    setDateFin(todayISO());
    setCategorie("Toutes");
    setFournisseur("Tous");
    setTypeEcart("Tous");
    setRecherche("");
    setShowAdvancedFilters(false);
    toast.info("Filtres réinitialisés");
  };

  // 🔄 Recharger les données
  const handleRefresh = () => {
    fetchInventaireData();
    toast.info("Données actualisées");
  };

  // Compteur de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categorie !== "Toutes") count++;
    if (fournisseur !== "Tous") count++;
    if (typeEcart !== "Tous") count++;
    if (recherche) count++;
    return count;
  }, [categorie, fournisseur, typeEcart, recherche]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-50/50 to-white px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
      <div className="w-full space-y-8">
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
              {lignesFiltrees.length > 1 && "s"} d'inventaire affichée
              {lignesFiltrees.length > 1 && "s"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <button
              onClick={handleGenerateAdjustments}
              disabled={generatingAdjustments || !lignesFiltrees.length}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingAdjustments ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackageOpen className="w-4 h-4" />
              )}
              {generatingAdjustments ? 'Génération...' : 'Générer les ajustements'}
            </button>
            <button
              onClick={exportPDF}
              disabled={generatingPDF || !lignesFiltrees.length}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {generatingPDF ? 'Génération...' : 'Exporter PDF'}
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
            {/* Partie gauche : Filtres rapides */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Recherche */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher produit, référence, commentaire..."
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

                {/* Catégorie */}
                <div className="min-w-[160px]">
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <option>Chargement...</option>
                    ) : (
                      categorieOptions.map((c) => (
                        <option key={c} value={c}>
                          {c === "Toutes" ? "Toutes catégories" : c}
                        </option>
                      ))
                    )}
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
                    {/* Fournisseur */}
                    <div className="min-w-[180px]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fournisseur
                      </label>
                      <select
                        value={fournisseur}
                        onChange={(e) => setFournisseur(e.target.value)}
                        disabled={loading}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition disabled:opacity-50"
                      >
                        {loading ? (
                          <option>Chargement...</option>
                        ) : (
                          fournisseurOptions.map((f) => (
                            <option key={f} value={f}>
                              {f === "Tous" ? "Tous les fournisseurs" : f}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Type d'écart */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Type d'écart
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "Tous", label: "Tous", color: "gray" },
                          { value: "Perte", label: "Perte", color: "red" },
                          { value: "Gain", label: "Gain", color: "green" },
                          { value: "Sans écart", label: "Sans écart", color: "blue" },
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setTypeEcart(type.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              typeEcart === type.value
                                ? type.value === "Perte"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : type.value === "Gain"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : type.value === "Sans écart"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
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

        {/* ÉTAT DE CHARGEMENT */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-gray-600">Chargement des données d'inventaire...</p>
              <p className="text-sm text-gray-400 mt-1">Veuillez patienter</p>
            </div>
          </motion.div>
        )}

        {/* STATISTIQUES RAPIDES */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valeur théorique</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{formatFCFA(stats.totalTheo)}</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">{stats.totalArticles} articles</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valeur réelle</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{formatFCFA(stats.totalReel)}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Après comptage physique</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Écart global</p>
                  <p className={`text-xl font-bold mt-1 ${
                    stats.ecartGlobal < 0 ? 'text-red-600' : 
                    stats.ecartGlobal > 0 ? 'text-emerald-600' : 
                    'text-gray-600'
                  }`}>
                    {formatFCFA(stats.ecartGlobal)}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  stats.ecartGlobal < 0 ? 'bg-red-50' : 
                  stats.ecartGlobal > 0 ? 'bg-emerald-50' : 
                  'bg-gray-50'
                }`}>
                  {stats.ecartGlobal < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : stats.ecartGlobal > 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <MinusCircle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">{formatPercent(stats.tauxEcart)} taux</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pertes / Gains</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-red-600">{formatFCFA(stats.pertes)}</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-bold text-emerald-600">{formatFCFA(stats.gains)}</span>
                  </div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Sur la période</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* ONGLETS DE NAVIGATION */}
        {!loading && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto">
                {[
                  { id: "overview", label: "Vue d'ensemble", icon: <BarChart3 className="w-4 h-4" /> },
                  { id: "details", label: "Détails des produits", icon: <Layers className="w-4 h-4" /> },
                  { id: "analytics", label: "Analyses", icon: <PieChart className="w-4 h-4" /> },
                  { id: "reports", label: "Rapports", icon: <FileDown className="w-4 h-4" /> },
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
                  {/* GRAPHIQUES */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <LineChart className="w-4 h-4 text-indigo-600" />
                          </div>
                          <h3 className="font-semibold text-gray-800">Évolution de la valeur de stock</h3>
                        </div>
                        <span className="text-xs text-gray-500">Théorique vs Réel</span>
                      </div>
                      <div className="h-64">
                        <ChartBox
                          data={evolutionData}
                          dataKey1="theorique"
                          dataKey2="reel"
                          type="line"
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-50 rounded-lg">
                            <PieChart className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h3 className="font-semibold text-gray-800">Répartition par catégorie</h3>
                        </div>
                      </div>
                      <div className="h-64">
                        <ChartBox
                          data={categorieData}
                          dataKey1="value"
                          type="pie"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DISTRIBUTION DES ÉCARTS */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Distribution des écarts</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {typeEcartData.map((item, index) => {
                        const total = typeEcartData.reduce((sum, i) => sum + i.value, 0);
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                item.name === "Pertes" ? "text-red-600" :
                                item.name === "Gains" ? "text-emerald-600" :
                                "text-blue-600"
                              }`}>
                                {item.name}
                              </span>
                              <span className="text-xs font-bold text-gray-700">
                                {formatPercent(percentage / 100)}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.name === "Pertes" ? "bg-red-500" :
                                  item.name === "Gains" ? "bg-emerald-500" :
                                  "bg-blue-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatFCFA(item.value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="space-y-4">
                  {/* EN-TÊTE TABLEAU */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">Produits inventoriés</h3>
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                        {lignesFiltrees.length} produits
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        {viewMode === "grid" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={exportPDF}
                        disabled={generatingPDF || !lignesFiltrees.length}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                      >
                        {generatingPDF ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Exporter
                      </button>
                    </div>
                  </div>

                  {/* TABLEAU DES PRODUITS */}
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produit
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Catégorie
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fournisseur
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qté Théorique
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qté Réelle
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Écart
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            État
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lignesFiltrees.length ? (
                          lignesFiltrees.map((l) => {
                            const produitInfo = produitsData.find(p => p.id === l.produit_id) || {};
                            const qteTheorique = Number(l.qte_theorique || l.qteTheorique || l.quantite_theorique || 0);
                            const qteReelle = Number(l.qte_reelle || l.qteReelle || l.quantite_reelle || 0);
                            const prixUnitaire = Number(l.prix_unitaire || l.prixUnitaire || produitInfo.prix_vente || 0);
                            const ecartQte = totalEcartArticle(l);
                            const ecartValeur = ecartQte * prixUnitaire;
                            
                            return (
                              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {produitInfo.nom || l.produit || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {produitInfo.reference || l.reference || 'N/R'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                    {l.categorie || l.categorie_id || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {l.fournisseur || l.fournisseur_id || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{qteTheorique}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{qteReelle}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    ecartQte < 0 
                                      ? 'bg-red-100 text-red-800'
                                      : ecartQte > 0
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {ecartQte < 0 ? <ArrowDownRight className="w-3 h-3" /> :
                                     ecartQte > 0 ? <ArrowUpRight className="w-3 h-3" /> :
                                     <MinusCircle className="w-3 h-3" />}
                                    {ecartQte} ({formatFCFA(ecartValeur)})
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {ecartQte < 0 ? (
                                      <>
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-gray-600">Perte</span>
                                      </>
                                    ) : ecartQte > 0 ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-gray-600">Gain</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm text-gray-600">OK</span>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <Filter className="w-12 h-12 mb-3 opacity-30" />
                                <p className="text-sm">Aucun produit trouvé avec les filtres actuels</p>
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
                  {lignesFiltrees.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-700">
                          Affichage de <span className="font-medium">1</span> à{" "}
                          <span className="font-medium">{lignesFiltrees.length}</span> sur{" "}
                          <span className="font-medium">{lignesFiltrees.length}</span> résultats
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
                        <div className="p-1.5 bg-purple-50 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Analyses avancées</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Taux de précision</h4>
                        <div className="text-2xl font-bold text-gray-800">
                          {formatPercent(1 - Math.abs(stats.tauxEcart))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Exactitude de l'inventaire</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Produits sans écart</h4>
                        <div className="text-2xl font-bold text-gray-800">
                          {lignesFiltrees.filter(l => totalEcartArticle(l) === 0).length}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sur {lignesFiltrees.length} produits</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Valeur moyenne/écart</h4>
                        <div className="text-2xl font-bold text-gray-800">
                          {formatFCFA(lignesFiltrees.length ? Math.abs(stats.ecartGlobal) / lignesFiltrees.length : 0)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Par produit en moyenne</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <FileDown className="w-4 h-4 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800">Rapports disponibles</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">Rapport complet</h4>
                            <p className="text-sm text-gray-500 mt-1">PDF détaillé avec toutes les données</p>
                          </div>
                          <button
                            onClick={exportPDF}
                            disabled={generatingPDF || !lignesFiltrees.length}
                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition disabled:opacity-50"
                          >
                            {generatingPDF ? 'Génération...' : 'Générer'}
                          </button>
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">Synthèse financière</h4>
                            <p className="text-sm text-gray-500 mt-1">KPI et analyses principales</p>
                          </div>
                          <button className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            Bientôt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER INFORMATIF */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Données en temps réel depuis l'API Stock</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
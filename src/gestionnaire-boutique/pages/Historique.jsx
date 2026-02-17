import React, { useState, useEffect } from "react";
import { FileText, Filter, Download, Eye, Search, FileDown, Loader2 } from "lucide-react";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast, Toaster } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Historique = () => {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [filtreAction, setFiltreAction] = useState("Tous");
  const [detailEntry, setDetailEntry] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [recherche, setRecherche] = useState("");
  const debouncedRecherche = useDebouncedValue(recherche);

  // États pour les statistiques globales
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    valides: 0,
    enAttente: 0,
    totalQuantite: 0,
  });

  // États pour le filtre de période
  const [periodFilter, setPeriodFilter] = useState("Tous");
  
  // Génération dynamique des options de période
  const generatePeriodOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed
    
    const options = [
      { value: "Tous", label: "Choisissez une periode" },
      { value: "today", label: "Aujourd'hui" }
    ];
    
    // Générer les mois de l'année en cours jusqu'au mois actuel
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    
    for (let i = 0; i <= currentMonth; i++) {
      options.push({
        value: `${currentYear}-${String(i).padStart(2, '0')}`,
        label: `${months[i]} ${currentYear}`
      });
    }
    
    return options;
  };

  const periodOptions = generatePeriodOptions();

  const actions = ["Tous", "Reçu", "Validé"];

  // Charger les statistiques globales (indépendamment de la pagination)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    
    const loadGlobalStats = async () => {
      try {
        // Déterminer la plage de dates si un filtre de période est appliqué
        let startDate, endDate;
        if (periodFilter === "today") {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
        } else if (periodFilter !== "Tous") {
          const [year, month] = periodFilter.split("-");
          startDate = new Date(parseInt(year), parseInt(month), 1);
          endDate = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999);
        }

        // Récupérer toutes les données pour calculer les stats
        const allData = [];
        let currentPage = 1;
        let hasMore = true;
        
        while (hasMore && currentPage <= 50) { // Limite de sécurité
          const response = await gestionnaireBoutiqueAPI.getAllProduitsTransfer(currentPage, debouncedRecherche, {
            signal: controller.signal,
          });
          
          if (!mounted) return;
          
          const transferts = Array.isArray(response?.data) ? response.data : [];
          if (transferts.length === 0) break;
          
          for (const t of transferts) {
            const isValide = t.status === 'valide' || t.status === 'validé';
            const itemDate = new Date(isValide ? (t.updated_at || t.created_at) : t.created_at);
            
            // Filtrer par date si nécessaire
            if (periodFilter !== "Tous") {
              if (itemDate < startDate || itemDate > endDate) {
                continue;
              }
            }
            
            const item = {
              action: isValide ? 'Validé' : 'Reçu',
              statut: isValide ? 'validé' : 'en_attente',
              quantite: t.quantite || 0,
            };
            
            // Appliquer le filtre d'action
            if (filtreAction === "Tous" || item.action === filtreAction) {
              allData.push(item);
            }
          }
          
          // Vérifier s'il y a une page suivante
          if (response.last_page && currentPage < response.last_page) {
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        
        if (!mounted) return;
        
        // Calculer les statistiques
        const stats = {
          total: allData.length,
          valides: allData.filter(h => h.statut === "validé").length,
          enAttente: allData.filter(h => h.statut === "en_attente").length,
          totalQuantite: allData.reduce((sum, h) => sum + h.quantite, 0),
        };
        
        setGlobalStats(stats);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return;
        }
      }
    };
    
    loadGlobalStats();
    
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [periodFilter, filtreAction, debouncedRecherche]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        
        // Utiliser le nouvel endpoint qui récupère tous les transferts (validés et en attente)
        const response = await gestionnaireBoutiqueAPI.getAllProduitsTransfer(page, debouncedRecherche, {
          signal: controller.signal,
        });
        
        if (!mounted) return;
        
        // Le backend retourne déjà une structure paginée avec data, current_page, etc.
        const transferts = Array.isArray(response?.data) ? response.data : [];
        
        // Mapper les données vers le format attendu par l'interface
        const mapped = transferts.map((t) => {
          // Déterminer l'action et le statut en fonction de etat
          const isValide = t.status === 'valide' || t.status === 'validé';
          
          return {
            id: `${isValide ? 'v' : 'p'}-${t.id}`,
            date: isValide ? (t.updated_at || t.created_at) : t.created_at || new Date().toISOString(),
            action: isValide ? 'Validé' : 'Reçu',
            produit: t.produit?.nom || t.nom || `#${t.produit_id}`,
            code_produit: t.produit?.code || 'N/A',
            quantite: t.quantite,
            cartons: t.nombre_carton,
            utilisateur: isValide ? 'Gestionnaire boutique' : 'Gestionnaire dépôt',
            statut: isValide ? 'validé' : 'en_attente',
          };
        });
        
        // Trier par date décroissante
        const sorted = mapped.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setHistorique(sorted);
        setPagination(response);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return;
        }
        toast.error('Erreur de chargement', { description: "Impossible de charger l'historique" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    // Ne charger que s'il y a des données dans la réponse
    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, debouncedRecherche]);

  const handlePageChange = (nextPage) => {
    if (nextPage && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const handleRechercheChange = (event) => {
    const value = event.target.value;
    setRecherche(value);
    if (page !== 1) {
      setPage(1);
    }
  };

  const handleClearRecherche = () => {
    setRecherche("");
    if (page !== 1) {
      setPage(1);
    }
  };

  const historiqueFiltres = historique.filter((h) => {
    const q = recherche.trim().toLowerCase();
    const matchAction = filtreAction === "Tous" || h.action === filtreAction;
    const matchRecherche =
      !q ||
      h.produit?.toLowerCase().includes(q) ||
      h.code_produit?.toLowerCase().includes(q) ||
      h.action?.toLowerCase().includes(q);
    
    // Filtre par période
    let matchPeriod = true;
    if (periodFilter !== "Tous") {
      const entryDate = new Date(h.date);
      
      if (periodFilter === "today") {
        const today = new Date();
        matchPeriod = entryDate.toDateString() === today.toDateString();
      } else {
        // Format: "YYYY-MM"
        const [year, month] = periodFilter.split("-");
        matchPeriod = entryDate.getFullYear() === parseInt(year) && 
                      entryDate.getMonth() === parseInt(month);
      }
    }
    
    return matchAction && matchRecherche && matchPeriod;
  });

  // Fonction pour récupérer les données du mois sélectionné pour l'export
  const fetchDataForExport = async () => {
    // Si "Tous" est sélectionné, ne pas permettre l'export
    if (periodFilter === "Tous") {
      toast.warning("Veuillez sélectionner une période spécifique (Aujourd'hui ou un mois)");
      return [];
    }
    
    // Déterminer la plage de dates pour la période sélectionnée
    let startDate, endDate;
      if (periodFilter === "today") {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      } else {
        const [year, month] = periodFilter.split("-");
        startDate = new Date(parseInt(year), parseInt(month), 1);
        endDate = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999);
      }
      
      // Récupérer TOUTES les pages sans limite pour l'export
      const allData = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await gestionnaireBoutiqueAPI.getAllProduitsTransfer(currentPage, "");
        const transferts = Array.isArray(response?.data) ? response.data : [];
        
        // Si pas de données, arrêter
        if (transferts.length === 0) {
          break;
        }
        
        // Mapper et filtrer en une seule passe
        for (const t of transferts) {
          const isValide = t.status === 'valide' || t.status === 'validé';
          const itemDate = new Date(isValide ? (t.updated_at || t.created_at) : t.created_at);
          
          // Filtrer par date dès la récupération
          if (itemDate < startDate || itemDate > endDate) {
            continue;
          }
          
          const item = {
            id: `${isValide ? 'v' : 'p'}-${t.id}`,
            date: itemDate.toISOString(),
            action: isValide ? 'Validé' : 'Reçu',
            produit: t.produit?.nom || t.nom || `#${t.produit_id}`,
            code_produit: t.produit?.code || 'N/A',
            quantite: t.quantite,
            cartons: t.nombre_carton,
            utilisateur: isValide ? 'Gestionnaire boutique' : 'Gestionnaire dépôt',
            statut: isValide ? 'validé' : 'en_attente',
          };
          
          // Appliquer les autres filtres
          const q = recherche.trim().toLowerCase();
          const matchAction = filtreAction === "Tous" || item.action === filtreAction;
          const matchRecherche =
            !q ||
            item.produit?.toLowerCase().includes(q) ||
            item.code_produit?.toLowerCase().includes(q) ||
            item.action?.toLowerCase().includes(q);
          
          if (matchAction && matchRecherche) {
            allData.push(item);
          }
        }
        
        // Vérifier s'il y a une page suivante
        if (response.last_page && currentPage < response.last_page) {
          currentPage++;
        } else {
          hasMore = false;
        }
      }
      
      // Trier par date décroissante
      allData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return allData;
  };

  const downloadCSV = async () => {
    if (periodFilter === "Tous") {
      toast.warning("Veuillez sélectionner une période spécifique (Aujourd'hui ou un mois)");
      return;
    }
    
    setExportLoading(true);
    try {
      const data = await fetchDataForExport();
      
      if (data.length === 0) {
        toast.warning("Aucune donnée à exporter pour cette période");
        return;
      }
      
      const headers = ["Date", "Action", "Produit", "Code", "Quantité", "Cartons", "Utilisateur", "Statut"];
      const rows = data.map((h) => [
        new Date(h.date).toLocaleString("fr-FR"),
        h.action,
        h.produit,
        h.code_produit,
        h.quantite || "-",
        h.cartons || "-",
        h.utilisateur,
        h.statut || "-",
      ]);
      const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      
      // Nom de fichier avec période
      let filename = "historique";
      if (periodFilter === "today") {
        filename += `_${new Date().toISOString().split("T")[0]}`;
      } else if (periodFilter !== "Tous") {
        filename += `_${periodFilter}`;
      }
      link.download = `${filename}.csv`;
      link.click();
      
      toast.success(`Export CSV réussi : ${data.length} enregistrement(s)`);
    } catch {
      toast.error("Erreur lors de l'export CSV");
    } finally {
      setExportLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (periodFilter === "Tous") {
      toast.warning("Veuillez sélectionner une période spécifique (Aujourd'hui ou un mois)");
      return;
    }
    
    setExportLoading(true);
    try {
      const data = await fetchDataForExport();
      
      if (data.length === 0) {
        toast.warning("Aucune donnée à exporter pour cette période");
        return;
      }
      
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(18);
      doc.setTextColor(71, 46, 173);
      doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Historique des Transferts", 105, 30, { align: "center" });
      
      // Période
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      let periodText = "Période: ";
      if (periodFilter === "today") {
        periodText += new Date().toLocaleDateString("fr-FR");
      } else if (periodFilter !== "Tous") {
        const [year, month] = periodFilter.split("-");
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        periodText += `${months[parseInt(month)]} ${year}`;
      }
      doc.text(periodText, 105, 38, { align: "center" });
      
      doc.text(`Date d'impression: ${new Date().toLocaleString("fr-FR")}`, 105, 44, { align: "center" });
      
      // Ligne séparatrice
      doc.setDrawColor(71, 46, 173);
      doc.setLineWidth(0.5);
      doc.line(15, 48, 195, 48);
      
      // Statistiques résumées
      const totalEntries = data.length;
      const totalValides = data.filter(h => h.statut === "validé").length;
      const totalEnAttente = data.filter(h => h.statut === "en_attente").length;
      const totalQuantite = data.reduce((sum, h) => sum + (h.quantite || 0), 0);
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total entrées: ${totalEntries}`, 15, 56);
      doc.text(`Validés: ${totalValides}`, 70, 56);
      doc.text(`En attente: ${totalEnAttente}`, 125, 56);
      doc.text(`Total unités: ${totalQuantite}`, 170, 56);
      
      // Tableau
      autoTable(doc, {
        startY: 62,
        head: [["Date", "Action", "Produit", "Code", "Qté", "Cartons", "Statut"]],
        body: data.map((h) => [
          new Date(h.date).toLocaleString("fr-FR", { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          h.action,
          h.produit.length > 25 ? h.produit.substring(0, 22) + "..." : h.produit,
          h.code_produit,
          h.quantite || "-",
          h.cartons || "-",
          h.statut || "-",
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: { 
          fillColor: [71, 46, 173],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
        margin: { top: 62, left: 15, right: 15 },
      });
      
      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} sur ${pageCount}`, 105, 285, { align: "center" });
        doc.text("LPD - Gestion Boutique", 15, 285);
      }
      
      // Nom de fichier avec période
      let filename = "historique_transferts";
      if (periodFilter === "today") {
        filename += `_${new Date().toISOString().split("T")[0]}`;
      } else if (periodFilter !== "Tous") {
        filename += `_${periodFilter}`;
      }
      
      doc.save(`${filename}.pdf`);
      
      toast.success(`Export PDF réussi : ${data.length} enregistrement(s)`);
    } catch {
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "Validé":
        return "bg-green-100 text-green-800";
      case "Reçu":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case "validé":
        return "text-green-600 font-semibold";
      case "en_attente":
        return "text-[#F58020] font-semibold";
      case "rejeté":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
              <FileText size={32} className="text-[#472EAD]" />
              Historique et Audit
            </h2>
            <p className="text-gray-600 mt-1">Tous les changements et validations sont enregistrés</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadCSV}
              disabled={exportLoading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Download size={18} />
              Exporter CSV
            </button>
            <button
              onClick={downloadPDF}
              disabled={exportLoading}
              className="flex items-center gap-2 bg-[#472EAD] text-white px-4 py-2 rounded-lg hover:bg-[#3b2594] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FileDown size={18} />
              Exporter PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit, un code, une action..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={recherche}
                onChange={handleRechercheChange}
              />
            </div>
            {recherche && (
              <button
                type="button"
                onClick={handleClearRecherche}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Effacer
              </button>
            )}
            <div className="flex items-center gap-2">
              <label className="text-gray-700 font-medium">Période:</label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD] bg-white"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Résumé statistiques */}
        {globalStats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
              <h4 className="text-sm text-gray-600 font-medium">Total d'entrées</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">{globalStats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
              <h4 className="text-sm text-gray-600 font-medium">Validés</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {globalStats.valides}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600">
              <h4 className="text-sm text-gray-600 font-medium">En attente</h4>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {globalStats.enAttente}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-[#472EAD]">
              <h4 className="text-sm text-gray-600 font-medium">Total reçu</h4>
              <p className="text-2xl font-bold text-[#472EAD] mt-1">
                {globalStats.totalQuantite}
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <label className="font-medium text-[#111827]">Filtrer par action:</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {actions.map((action) => (
                <button
                  key={action}
                  onClick={() => setFiltreAction(action)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filtreAction === action
                      ? "bg-[#472EAD] text-white"
                      : "bg-gray-100 text-[#111827] hover:bg-gray-200"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tableau d'historique */}
        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner />
          ) : historiqueFiltres.length === 0 ? (
            <EmptyState message="Aucun enregistrement trouvé" />
          ) : (
            <DataTable
              columns={[
                {
                  label: "Date & Heure",
                  key: "date",
                  render: (d) => new Date(d).toLocaleString("fr-FR"),
                },
                {
                  label: "Action",
                  key: "action",
                  render: (action) => (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(action)}`}>
                      {action}
                    </span>
                  ),
                },
                { label: "Produit", key: "produit" },
                { label: "Code", key: "code_produit" },
                {
                  label: "Quantité",
                  key: "quantite",
                  render: (q) => q ? `${q} unités` : "-",
                },
                {
                  label: "Cartons",
                  key: "cartons",
                  render: (c) => c ? `${c}` : "-",
                },
                { label: "Utilisateur", key: "utilisateur" },
                {
                  label: "Statut",
                  key: "statut",
                  render: (s) => <span className={getStatutColor(s)}>{s || "-"}</span>,
                },
              ]}
              data={historiqueFiltres}
              actions={[
                {
                  title: "Détails",
                  icon: <Eye size={16} />,
                  color: "text-blue-600",
                  hoverBg: "bg-blue-50",
                  onClick: (row) => setDetailEntry(row),
                },
              ]}
            />
          )}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>



        {/* Modal détails */}
        {detailEntry && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex items-center justify-center">
            <div className="relative z-50 bg-white p-6 rounded-lg w-[500px] shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails de l'enregistrement</h3>
              <div className="space-y-3 text-sm">
                <div className="border-b pb-3">
                  <p className="text-gray-600">Date et heure</p>
                  <p className="font-semibold text-[#111827] mt-1">{new Date(detailEntry.date).toLocaleString("fr-FR")}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600">Action</p>
                  <p className={`font-semibold mt-1 px-3 py-1 rounded-full inline-block ${getActionColor(detailEntry.action)}`}>
                    {detailEntry.action}
                  </p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600">Produit</p>
                  <p className="font-semibold text-[#111827] mt-1">{detailEntry.produit}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600">Code Produit</p>
                  <p className="font-semibold text-[#111827] mt-1">{detailEntry.code_produit}</p>
                </div>
                {detailEntry.quantite && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Quantité</p>
                    <p className="font-semibold text-[#111827] mt-1">{detailEntry.quantite} unités</p>
                  </div>
                )}
                {detailEntry.cartons && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Cartons</p>
                    <p className="font-semibold text-[#111827] mt-1">{detailEntry.cartons}</p>
                  </div>
                )}
                <div className="border-b pb-3">
                  <p className="text-gray-600">Utilisateur</p>
                  <p className="font-semibold text-[#111827] mt-1">{detailEntry.utilisateur}</p>
                </div>
                {detailEntry.statut && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Statut</p>
                    <p className={`font-semibold mt-1 ${getStatutColor(detailEntry.statut)}`}>{detailEntry.statut}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setDetailEntry(null)}
                  className="px-4 py-2 bg-[#472EAD] text-white rounded hover:bg-[#3b2594]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Popup de téléchargement en cours */}
        {exportLoading && (
          <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform animate-fadeIn">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <Loader2 size={64} className="text-[#472EAD] animate-spin" />
                  <div className="absolute inset-0 bg-[#472EAD]/10 rounded-full blur-xl"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#111827] mb-2">
                    Téléchargement en cours...
                  </h3>
                  <p className="text-gray-600">
                    Veuillez patienter pendant la génération de votre fichier
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-[#472EAD] rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Toaster pour les notifications */}
        <Toaster position="top-right" richColors expand={true} />
      </div>
    </div>
  );
};

export default Historique;

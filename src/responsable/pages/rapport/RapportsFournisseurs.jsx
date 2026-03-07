// ==========================================================
// 📊 RapportsFournisseurs.jsx — Journal d'audit des fournisseurs
// Version journal d'activité (Audit Log) pour le module Rapports
// Affichage des actions CRUD sur les fournisseurs
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Eye,
  Calendar,
  User,
  FileEdit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  BarChart3,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import des services API
import { rapportsAPI } from '@/services/api';

// ==========================================================
// 🧮 Helpers
// ==========================================================
const formatDateHeure = (dateString) => {
  if (!dateString) return "Date inconnue";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const formatDateOnly = (dateString) => {
  if (!dateString) return "Date inconnue";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const formatActionLabel = (action) => {
  if (!action) return 'Action';
  
  // Capitalize first letter and handle French accents
  const formatted = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  
  // Replace underscores with spaces
  return formatted.replace(/_/g, ' ');
};

const formatFieldName = (fieldName) => {
  const fieldMap = {
    'nom': 'Nom',
    'contact': 'Contact',
    'adresse': 'Adresse',
    'type_produit': 'Type de produits',
    'typeProduit': 'Type de produits',
    'derniere_livraison': 'Dernière livraison',
    'derniereLivraison': 'Dernière livraison',
    'total_achats': 'Total achats',
    'totalAchats': 'Total achats',
    'created_at': 'Date de création',
    'updated_at': 'Date de mise à jour',
  };
  
  return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatFieldValue = (fieldName, value) => {
  if (value === null || value === undefined || value === '') {
    return <span className="italic text-gray-400">Non renseigné</span>;
  }
  
  // Format dates
  if (fieldName.includes('date') || fieldName.includes('livraison') || 
      fieldName.includes('created') || fieldName.includes('updated')) {
    try {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  }
  
  // Format currency
  if (fieldName.includes('achats') || fieldName.includes('prix') || fieldName.includes('montant')) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(Number(value));
  }
  
  return value;
};

// Fonction pour obtenir la couleur du badge selon le type d'action
const getActionColor = (actionType) => {
  const action = actionType?.toLowerCase();
  
  switch (action) {
    case 'creation':
    case 'création':
      return { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-700', 
        badge: 'bg-emerald-500',
        icon: <Plus className="w-3 h-3" />
      };
    case 'modification':
      return { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        badge: 'bg-blue-500',
        icon: <FileEdit className="w-3 h-3" />
      };
    case 'suppression':
      return { 
        bg: 'bg-rose-100', 
        text: 'text-rose-700', 
        badge: 'bg-rose-500',
        icon: <Trash2 className="w-3 h-3" />
      };
    default:
      return { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        badge: 'bg-gray-500',
        icon: <FileEdit className="w-3 h-3" />
      };
  }
};

// ==========================================================
// 📊 Composant principal — Rapports Fournisseurs (Audit Log)
// ==========================================================
export default function RapportsFournisseurs({ 
  dateDebut, 
  dateFin, 
  recherche,
  onDateDebutChange,
  onDateFinChange,
  onRechercheChange 
}) {
  // États
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    creations: 0,
    modifications: 0,
    suppressions: 0,
  });
  const [globalStats, setGlobalStats] = useState(null);

  // Filtres spécifiques au module
  const [filterAction, setFilterAction] = useState("tous"); // "tous", "creation", "modification", "suppression"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null); // Pour le modal de détails
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Types d'actions disponibles
  const actionsTypes = [
    { id: "tous", label: "Toutes les actions" },
    { id: "creation", label: "Créations" },
    { id: "modification", label: "Modifications" },
    { id: "suppression", label: "Suppressions" },
  ];

  // Charger toutes les données d'audit une seule fois
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger tous les logs d'audit des fournisseurs sans pagination
        const response = await rapportsAPI.getLogsFournisseurs({
          dateDebut,
          dateFin,
          action: filterAction !== "tous" ? filterAction : undefined,
          // Pas de recherche, pas de page, pas de perPage
        });
        
        // Vérifier la structure de la réponse
        let logsData = [];
        let totalItems = 0;
        let statsData = null;
        
        if (Array.isArray(response)) {
          logsData = response;
          totalItems = response.length;
        } else if (response && response.data) {
          logsData = response.data;
          totalItems = response.total || logsData.length;
          statsData = response.stats;
        } else if (response && response.logs) {
          logsData = response.logs;
          totalItems = response.total || logsData.length;
          statsData = response.stats;
        }
        
        // Normaliser les données de log
        const normalized = logsData.map((log) => ({
          id: log.id,
          date: log.created_at || log.date || "",
          action: log.action || "",
          fournisseur: log.cible_nom || log.fournisseur || "",
          utilisateur: log.utilisateur || "Responsable",
          details: log.details || "",
          avant: log.avant || {},
          apres: log.apres || {},
        }));
        
        setLogs(normalized);
        
        // Récupérer les stats globales
        if (statsData) {
          setGlobalStats(statsData);
          setStats({
            total: statsData.total || totalItems,
            creations: statsData.creations || 0,
            modifications: statsData.modifications || 0,
            suppressions: statsData.suppressions || 0,
          });
        } else {
          // Calculer les statistiques sur toutes les données
          const totalCreations = normalized.filter(log => 
            log.action?.toLowerCase().includes('creation') || 
            log.action?.toLowerCase().includes('création')
          ).length;
          const totalModifications = normalized.filter(log => 
            log.action?.toLowerCase().includes('modification')
          ).length;
          const totalSuppressions = normalized.filter(log => 
            log.action?.toLowerCase().includes('suppression')
          ).length;
          
          setStats({
            total: totalItems,
            creations: totalCreations,
            modifications: totalModifications,
            suppressions: totalSuppressions,
          });
        }
        
      } catch (error) {
        console.error("Erreur chargement logs fournisseurs:", error);
        toast.error("Erreur lors du chargement de rapport fournisseurs");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Dépendances : uniquement les filtres qui nécessitent un rechargement backend
  }, [dateDebut, dateFin, filterAction]);

  // ✅ FILTRAGE FRONTEND (instantané)
  const logsFiltres = useMemo(() => {
    return logs
      .filter(log => {
        // Filtre par recherche texte (nom du fournisseur)
        if (recherche && recherche.trim() !== '') {
          return log.fournisseur?.toLowerCase().includes(recherche.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Plus récent d'abord
  }, [logs, recherche]);

  // ✅ PAGINATION FRONTEND
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return logsFiltres.slice(start, start + itemsPerPage);
  }, [logsFiltres, currentPage, itemsPerPage]);

  // Recalculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(logsFiltres.length / itemsPerPage);
  }, [logsFiltres.length, itemsPerPage]);

  // Mettre à jour currentPage si elle dépasse le nombre total de pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Fonction pour ouvrir le modal de détails
  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Helper pour la date du jour
  const todayISO = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Export PDF - Fonction améliorée avec le nouveau template
  const exportPDF = async () => {
    try {
      if (!logsFiltres.length) {
        toast.info("Aucune donnée à exporter");
        return;
      }

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // En-tête LPD
      doc.setFillColor(71, 46, 173);
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(245, 128, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("LPD", pageWidth / 2, 15, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Librairie Papeterie Daradji", pageWidth / 2, 21, {
        align: "center",
      });

      let y = 34;
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Journal d'audit des fournisseurs", 14, y);

      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Généré le : ${todayISO()}`, 14, y);

      y += 4;
      doc.setDrawColor(228, 224, 255);
      doc.line(14, y, pageWidth - 14, y);

      y += 6;

      const boxX = 14.7;
      const boxY = y;
      const boxW = pageWidth - 32;
      const boxH = 40; // Augmenté pour tout contenir proprement

      doc.setDrawColor(228, 224, 255);
      doc.setFillColor(247, 246, 255);
      doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "FD");

      const textX = boxX + 4;
      const rightColX = boxX + boxW - 8;
      let lineY = boxY + 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 80);
      doc.text("Récapitulatif des actions", textX, lineY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);

      // Ligne 1 : Total et Période
      lineY += 5;
      doc.text(`Total : ${stats.total}`, textX, lineY);
      
      // Gestion de la période sur la droite
      const periodeLabel = dateDebut && dateFin 
        ? `Période :` 
        : "Période : Non sélectionnée";
      
      doc.text(periodeLabel, rightColX, lineY, { align: "right" });

      // Ligne 2 : Créations et Date de début (si période spécifiée)
      lineY += 5;
      doc.text(`Créations : ${stats.creations}`, textX, lineY);
      
      if (dateDebut && dateFin) {
        doc.text(dateDebut, rightColX, lineY, { align: "right" });
      }

      // Ligne 3 : Modifications et Date de fin (si période spécifiée)
      lineY += 5;
      doc.text(`Modifications : ${stats.modifications}`, textX, lineY);
      
      if (dateDebut && dateFin) {
        doc.text(dateFin, rightColX, lineY, { align: "right" });
      }

      // Ligne 4 : Suppressions et Filtre
      lineY += 5;
      doc.text(`Suppressions : ${stats.suppressions}`, textX, lineY);
      
      // Filtre d'action actuel
      const currentActionFilter = filterAction !== "tous" 
        ? actionsTypes.find(a => a.id === filterAction)?.label 
        : "Toutes actions";
      
      // Vérifier si le filtre est trop long
      let filtreDisplay = `Filtre : ${currentActionFilter}`;
      const maxFiltreWidth = 60; // mm
      
      if (doc.getStringUnitWidth(filtreDisplay) * 2.834 > maxFiltreWidth) {
        // Tronquer si trop long
        filtreDisplay = `Filtre : ${currentActionFilter.substring(0, 20)}...`;
      }
      
      doc.text(filtreDisplay, rightColX, lineY, { align: "right" });

      const startTableY = y + boxH + 8;

      autoTable(doc, {
        startY: startTableY,
        margin: { top: startTableY, left: 14, right: 14 },
        head: [["Date", "Action", "Fournisseur", "Utilisateur", "Détails"]],
        body: logsFiltres.map(log => [
          formatDateHeure(log.date),
          formatActionLabel(log.action),
          log.fournisseur || "-",
          log.utilisateur || "-",
          log.details?.substring(0, 50) + (log.details?.length > 50 ? "..." : "") || "-"
        ]),
        styles: { 
          fontSize: 8, 
          cellPadding: 2, 
          textColor: [55, 65, 81],
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [71, 46, 173], 
          textColor: 255, 
          fontStyle: "bold" 
        },
        alternateRowStyles: { 
          fillColor: [247, 245, 255] 
        },
        theme: "striped",
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 50 }
        },
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} sur ${pageCount} - ERP System`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      const fileName = `Journal_Audit_Fournisseurs_${todayISO()}.pdf`;
      doc.save(fileName);
      toast.success("Journal d'audit exporté en PDF avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de l'export du PDF");
    }
  };

  // Pagination
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Loader initial
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <RefreshCw className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement du rapport fournisseurs...
          </span>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* STATISTIQUES DU MODULE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Module : Fournisseurs</h2>
              <p className="text-sm text-gray-500">Journal d'audit des actions du responsable</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Bouton export PDF amélioré */}
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-[#472EAD] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5A3CF5] shadow-md transition"
            >
              <FileText className="w-4 h-4" />
              Exporter journal Fournisseurs
            </button>
          </div>
        </div>

        {/* CARTES DE STATISTIQUES AMÉLIORÉES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total actions - Carte améliorée */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total actions</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <FileEdit className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="flex-1 border-t border-gray-200 pt-3">
                <span>Actions enregistrées</span>
              </div>
            </div>
          </div>

          {/* Créations - Carte améliorée */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-xl border border-emerald-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Créations
                </p>
                <p className="text-2xl font-bold text-emerald-700">{stats.creations}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="flex-1 border-t border-emerald-100 pt-3">
                <span className="text-emerald-600 font-medium">
                  {stats.total > 0 ? Math.round((stats.creations / stats.total) * 100) : 0}% du total
                </span>
              </div>
            </div>
          </div>

          {/* Modifications - Carte améliorée */}
          <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Modifications
                </p>
                <p className="text-2xl font-bold text-blue-700">{stats.modifications}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileEdit className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="flex-1 border-t border-blue-100 pt-3">
                <span className="text-blue-600 font-medium">
                  {stats.total > 0 ? Math.round((stats.modifications / stats.total) * 100) : 0}% du total
                </span>
              </div>
            </div>
          </div>

          {/* Suppressions - Carte améliorée */}
          <div className="bg-gradient-to-br from-rose-50/50 to-white rounded-xl border border-rose-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Suppressions
                </p>
                <p className="text-2xl font-bold text-rose-700">{stats.suppressions}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <div className="flex-1 border-t border-rose-100 pt-3">
                <span className="text-rose-600 font-medium">
                  {stats.total > 0 ? Math.round((stats.suppressions / stats.total) * 100) : 0}% du total
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FILTRES SPÉCIFIQUES AU MODULE */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtre par type d'action */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Type d'action
              </label>
              <div className="inline-flex rounded-xl bg-[#F7F5FF] border border-[#E4E0FF] p-1">
                {actionsTypes.map((opt) => {
                  const isActive = filterAction === opt.id;
                  const color = getActionColor(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFilterAction(opt.id);
                        setCurrentPage(1); // Reset à la première page
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? `${color.bg} ${color.text} font-semibold shadow-sm`
                          : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Période personnalisée */}
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Date début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => onDateDebutChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Date fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => onDateFinChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche - FILTRAGE FRONTEND INSTANTANÉ */}
        <div className="mt-5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => {
                onRechercheChange(e.target.value);
                setCurrentPage(1); // Reset à la première page
              }}
              placeholder="Rechercher par nom du fournisseur..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-2">
            🔍 Recherche instantanée • {logsFiltres.length} résultat{logsFiltres.length > 1 ? 's' : ''} trouvé{logsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* TABLEAU DU JOURNAL D'AUDIT */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* EN-TÊTE TABLEAU */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800">Journal d'activité des fournisseurs</h3>
              <span className="bg-[#472EAD] text-white text-xs font-medium px-3 py-1.5 rounded-full">
                {paginatedLogs.length} action{paginatedLogs.length > 1 ? 's' : ''} affichée{paginatedLogs.length > 1 ? 's' : ''} sur {logsFiltres.length}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Trié par : <span className="font-medium text-gray-700">Date (plus récent)</span>
            </div>
          </div>
        </div>

        {/* TABLEAU */}
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type d'action
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLogs.length ? (
                paginatedLogs.map((log) => {
                  const color = getActionColor(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDateOnly(log.date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateHeure(log.date).split(' ')[1]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${color.bg}`}>
                          <div className={`w-2 h-2 rounded-full ${color.badge}`}></div>
                          <span className={`text-sm font-medium ${color.text}`}>
                            {formatActionLabel(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {log.fournisseur || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{log.utilisateur}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openDetailsModal(log)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileEdit className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-base font-medium text-gray-500 mb-2">
                        Aucune action enregistrée avec les filtres actuels
                      </p>
                      <p className="text-sm text-gray-400">
                        Essayez de modifier les filtres ou la période
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {logsFiltres.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Page <span className="font-semibold text-gray-900">{currentPage}</span> sur{" "}
                <span className="font-semibold text-gray-900">{totalPages}</span>
              </p>
              <p className="text-sm text-gray-500">
                {paginatedLogs.length} action{paginatedLogs.length > 1 ? 's' : ''} affichée{paginatedLogs.length > 1 ? 's' : ''} sur {logsFiltres.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DÉTAILS */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${getActionColor(selectedLog.action).bg}`}>
                    <div className={`${getActionColor(selectedLog.action).text}`}>
                      {getActionColor(selectedLog.action).icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Détails de l'action</h3>
                    <p className="text-sm text-gray-500">
                      {selectedLog.fournisseur} • {formatDateHeure(selectedLog.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu modal */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Type d'action</p>
                    <div className="inline-block">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(selectedLog.action).bg} ${getActionColor(selectedLog.action).text}`}>
                        {formatActionLabel(selectedLog.action)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Fournisseur</p>
                    <p className="text-sm font-medium text-gray-800">{selectedLog.fournisseur}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Utilisateur</p>
                    <p className="text-sm font-medium text-gray-800">{selectedLog.utilisateur}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Date et heure</p>
                    <p className="text-sm font-medium text-gray-800">{formatDateHeure(selectedLog.date)}</p>
                  </div>
                </div>

                {/* Détails spécifiques selon le type d'action */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Détails de l'action</h4>
                  
                  {selectedLog.action?.toLowerCase().includes('modification') && (
                    <div className="space-y-4">
                      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                        <p className="text-xs font-medium text-blue-600 mb-3 flex items-center gap-2">
                          <FileEdit className="w-3 h-3" />
                          Modifications effectuées
                        </p>
                        <div className="space-y-4">
                          {Object.keys(selectedLog.avant || {}).map((key) => (
                            <div key={key} className="text-sm">
                              <div className="font-medium text-gray-700 mb-2">
                                {formatFieldName(key)} :
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded border">
                                <div className="space-y-1">
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span>Avant</span>
                                  </div>
                                  <div className="font-medium text-gray-600">
                                    {formatFieldValue(key, selectedLog.avant?.[key])}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-blue-500 flex items-center gap-1">
                                    <span>Après</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                  <div className="font-medium text-blue-700">
                                    {formatFieldValue(key, selectedLog.apres?.[key])}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {Object.keys(selectedLog.avant || {}).length === 0 && (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              Aucun détail de modification disponible
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLog.action?.toLowerCase().includes('creation') && (
                    <div className="space-y-4">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
                        <p className="text-xs font-medium text-emerald-600 mb-3 flex items-center gap-2">
                          <Plus className="w-3 h-3" />
                          Informations créées
                        </p>
                        <div className="space-y-3">
                          {Object.keys(selectedLog.apres || {}).map((key) => (
                            <div key={key} className="flex justify-between items-center text-sm py-2 border-b border-emerald-100 last:border-0">
                              <span className="font-medium text-gray-700">{formatFieldName(key)}</span>
                              <span className="text-gray-800 font-medium ml-2 text-right">
                                {formatFieldValue(key, selectedLog.apres?.[key])}
                              </span>
                            </div>
                          ))}
                          {Object.keys(selectedLog.apres || {}).length === 0 && (
                            <div className="text-center py-2 text-gray-400 text-sm">
                              Aucune information de création disponible
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLog.action?.toLowerCase().includes('suppression') && (
                    <div className="space-y-4">
                      <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4">
                        <p className="text-xs font-medium text-rose-600 mb-3 flex items-center gap-2">
                          <Trash2 className="w-3 h-3" />
                          Informations supprimées
                        </p>
                        <div className="space-y-3">
                          {Object.keys(selectedLog.avant || {}).map((key) => (
                            <div key={key} className="flex justify-between items-center text-sm py-2 border-b border-rose-100 last:border-0">
                              <span className="font-medium text-gray-700">{formatFieldName(key)}</span>
                              <span className="text-gray-800 font-medium ml-2 text-right">
                                {formatFieldValue(key, selectedLog.avant?.[key])}
                              </span>
                            </div>
                          ))}
                          {Object.keys(selectedLog.avant || {}).length === 0 && (
                            <div className="text-center py-2 text-gray-400 text-sm">
                              Aucune information de suppression disponible
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commentaire général */}
                  {selectedLog.details && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Description de l'action</p>
                      <p className="text-sm text-gray-700">{selectedLog.details}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
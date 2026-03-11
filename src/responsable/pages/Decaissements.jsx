// ==========================================================
// 💸 Decaissements.jsx — Interface Responsable (LPD Manager)
// ✅ Architecture 100% backend : pagination, filtres, recherche, KPI
// ✅ Recherche instantanée (pas de debounce)
// ✅ Version simplifiée avec montant unique
// ✅ Suppression des mentions "Annulé"
// ==========================================================

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // ← AJOUT AnimatePresence
import {
  FileDown,
  PlusCircle,
  Eye,
  X,
  Search,
  BadgeDollarSign,
  CheckCircle2,
  AlertCircle,
  Clock3,
  User,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { decaissementsAPI } from '@/responsable/services/api';
import FormModal from "../components/FormModal";
import DecaissementForm from "../components/DecaissementForm";
import Pagination from "../components/Pagination";
import { Toaster, toast } from "sonner";

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

// ——————————————————————————————————————————————————
// 🔧 Helpers
// ——————————————————————————————————————————————————
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(
    Number(n || 0)
  );

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatDateSN = (dateString) => {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("fr-SN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
};

// ✅ Normalisation des statuts pour affichage - SANS ANNULÉ
const statutLabel = (s) => {
  if (s === "en_attente") return "En attente";
  if (s === "valide") return "Validé";
  return s;
};

// ✅ Normalisation pour l'API (backend attend "en_attente")
const statutApi = (s) => {
  if (s === "en attente") return "en_attente";
  return s;
};

// ——————————————————————————————————————————————————
// 🧾 Modal de détail décaissement
// ——————————————————————————————————————————————————
function DetailDecaissementModal({ open, onClose, decaissement }) {
  if (!open || !decaissement) return null;

  const {
    motifGlobal,
    methodePaiement,
    datePrevue,
    statut,
    montantTotal,
    caissier,
  } = decaissement;

  // ✅ Formatage du nom du caissier
  const caissierName = caissier 
    ? `${caissier.prenom || ''} ${caissier.nom || ''}`.trim() 
    : "-";

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center px-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#472EAD] flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Détail de la demande de décaissement
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Motif global</div>
              <div className="font-semibold text-gray-800">{motifGlobal || "-"}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Méthode prévue</div>
              <div className="font-medium text-gray-800">{methodePaiement || "-"}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Date prévue</div>
              <div className="text-gray-800">
                {formatDateSN(datePrevue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Statut</div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F7F5FF] text-[#472EAD] border border-[#E3E0FF]">
                {statutLabel(statut).toUpperCase()}
              </span>
            </div>
            {/* ✅ Ajout du caissier dans la modal */}
            <div className="sm:col-span-2">
              <div className="text-[11px] text-gray-500 mb-0.5 flex items-center gap-1">
                <User className="w-3 h-3" /> Caissier responsable
              </div>
              <div className="font-medium text-gray-800">{caissierName}</div>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F5FF] text-[#472EAD]">
                <tr>
                  <th className="px-3 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-3 py-2 text-right font-medium">
                    {formatFCFA(montantTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="bg-[#F9FAFF] border border-[#E4E0FF] rounded-xl px-4 py-3 text-sm w-full sm:w-64">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant total</span>
                <span className="font-bold text-[#472EAD]">
                  {formatFCFA(montantTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// 💰 Composant principal
// ——————————————————————————————————————————————————
export default function Decaissements() {
  const [isFetching, setIsFetching] = useState(true); // ← UN SEUL ÉTAT POUR TOUS LES CHARGEMENTS
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [demandes, setDemandes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  // ✅ État pour les stats venant de l'API
  const [statsFromApi, setStatsFromApi] = useState(null);

  // ✅ États de filtre
  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Recherche directe sans debounce

  // ✅ Pagination backend
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // ——————————————————————————————————————————————————
  // 📥 Chargement initial avec stats API et pagination
  // ——————————————————————————————————————————————————
  const loadData = async () => {
    try {
      setIsFetching(true); // ← ACTIVE LE LOADER

      const data = await decaissementsAPI.getAllResponsable({
        page,
        statut: filterStatut !== "tous" ? statutApi(filterStatut) : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
        search: searchTerm || undefined, // ✅ Recherche directe
      });

      // Pagination Laravel
      const total = data.total || 0;
      const pages = data.last_page || 1;

      setTotalItems(total);
      setTotalPages(pages <= 1 ? 1 : pages);

      // 🔥 Normalisation snake_case → camelCase
      const normalized = (data.data || []).map(d => ({
        ...d,
        montantTotal: d.montant,
        methodePaiement: d.methode_paiement ?? null,
        datePrevue: d.date,
        motifGlobal: d.motif,
      }));

      setDemandes(normalized);

      // KPI backend
      const statsData = await decaissementsAPI.getStats({
        statut: filterStatut !== "tous" ? statutApi(filterStatut) : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
        search: searchTerm || undefined, // ✅ Recherche directe
      });

      setStatsFromApi(statsData);

    } catch (e) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsFetching(false); // ← DÉSACTIVE LE LOADER
    }
  };

  // ✅ Chargement quand les filtres changent (recherche instantanée)
  useEffect(() => {
    loadData();
  }, [page, filterStatut, filterStartDate, filterEndDate, searchTerm]); // ✅ searchTerm direct

  // ——————————————————————————————————————————————————
  // 💾 Ajout (POST API) — VERSION SIMPLIFIÉE AVEC MONTANT UNIQUE
  // ——————————————————————————————————————————————————
  const handleAdd = async (form) => {
    if (submitting) return;

    // ———————————————————————————
    // ✅ VALIDATION FRONT (AVANT API)
    // ———————————————————————————
    const motifGlobal = String(form?.motifGlobal || "").trim();
    if (!motifGlobal || motifGlobal.length < 3) {
      toast.error("Le motif global est obligatoire (au moins 3 caractères).");
      return;
    }

    if (!form?.caissier_id) {
      toast.error("Veuillez sélectionner un caissier.");
      return;
    }
    
    const datePrevue = form?.datePrevue || todayISO();
    if (!datePrevue) {
      toast.error("La date prévue est obligatoire.");
      return;
    }

    // ✅ Validation du montant unique
    const montant = Number(form?.montant || 0);
    if (!montant || montant <= 0) {
      toast.error("Le montant doit être supérieur à 0.");
      return;
    }

    // ———————————————————————————
    // ✅ PAYLOAD FINAL SIMPLIFIÉ
    // ———————————————————————————
    const payload = {
      motif: form.motifGlobal.trim(),
      date: form.datePrevue || todayISO(),
      caissier_id: form.caissier_id,
      montant: Number(form.montant),
    };
    const toastId = toast.loading("Envoi à la caisse...");

    try {
      setSubmitting(true);

      await decaissementsAPI.create(payload);

      setOpenModal(false);
      toast.success("Demande envoyée à la caisse ✅", { id: toastId });

      if (page !== 1) {
        setPage(1);
      } else {
        loadData();
      }

    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      if (status === 422 && data?.errors) {
        const firstField = Object.keys(data.errors)[0];
        const firstMsg =
          data.errors[firstField]?.[0] || "Données invalides.";
        toast.error(firstMsg, { id: toastId });
      } 
      // ✅ Cas solde insuffisant (400)
      else if (status === 400) {
        toast.error(
          "Solde insuffisant. Le montant demandé dépasse le total encaissé aujourd’hui.",
          { id: toastId }
        );
      } else {
        toast.error(
          "Une erreur est survenue lors de l’envoi de la demande.",
          { id: toastId }
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ——————————————————————————————————————————————————
  // 📊 Stats depuis l'API backend (KPI globaux) - SANS ANNULÉ
  // ——————————————————————————————————————————————————
  const stats = statsFromApi || {
    total: 0,
    montant_total: 0,
    valides: 0,
    montant_valides: 0,
    attente: 0,
    montant_attente: 0,
  };

  // ——————————————————————————————————————————————————
  // 🔎 Filtres + recherche
  // ——————————————————————————————————————————————————
  // ✅ Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [filterStatut, filterStartDate, filterEndDate, searchTerm]); // ✅ searchTerm direct

  // ——————————————————————————————————————————————————
  // 📤 Export PDF aligné avec les filtres backend - SANS ANNULÉ
  // ——————————————————————————————————————————————————
  const exportPDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      const formatFCFAPdf = (value) => {
        const n = Number(value || 0);
        if (Number.isNaN(n)) return "0 FCFA";
        const formatted = new Intl.NumberFormat("fr-FR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
          .format(n)
          .replace(/\u00A0/g, " ")
          .replace(/\u202F/g, " ");
        return `${formatted} FCFA`;
      };

      // ✅ Utilisation des stats API pour le PDF (données globales) - SANS ANNULÉ
      const totalDemandes = stats.total;
      const montantGlobal = stats.montant_total;

      const nbValid = stats.valides;
      const montantValide = stats.montant_valides;

      const nbAttente = stats.attente;
      const montantAttente = stats.montant_attente;

      // ✅ Récupération des données filtrées pour le tableau PDF
      const allData = await decaissementsAPI.exportAll({
        statut: filterStatut !== "tous" ? statutApi(filterStatut) : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
        search: searchTerm || undefined, // ✅ Recherche directe
      });

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
      doc.text("Historique des décaissements", 14, y);

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
      const boxH = 26;

      doc.setDrawColor(228, 224, 255);
      doc.setFillColor(247, 246, 255);
      doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "FD");

      const textX = boxX + 4;
      const rightColX = boxX + boxW - 8;
      let lineY = boxY + 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 80);
      doc.text("Récapitulatif des décaissements", textX, lineY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);

      lineY += 5;
      doc.text(`Total : ${totalDemandes}`, textX, lineY);
      doc.text(`Montant : ${formatFCFAPdf(montantGlobal)}`, rightColX, lineY, {
        align: "right",
      });

      lineY += 5;
      doc.text(
        `Validées : ${nbValid} (${formatFCFAPdf(montantValide)})`,
        textX,
        lineY
      );
      doc.text(
        `En attente : ${nbAttente} (${formatFCFAPdf(montantAttente)})`,
        rightColX,
        lineY,
        { align: "right" }
      );

      const startTableY = y + 24;

      autoTable(doc, {
        startY: startTableY,
        margin: { top: startTableY, left: 14, right: 14 },
        head: [["Date", "Caissier", "Méthode", "Montant total", "Statut"]],        
        body: allData.map((d) => [
          formatDateSN(d.date_prevue ?? d.date),
          `${d.caissier?.prenom || ""} ${d.caissier?.nom || ""}`.trim() || "-",
          d.methode_prevue ?? d.methode_paiement,
          formatFCFAPdf(
            d.montant_total && d.montant_total > 0
              ? d.montant_total
              : d.montant
          ),
          statutLabel(d.statut).toUpperCase(),
        ]) || [],
        styles: { fontSize: 9, cellPadding: 2, textColor: [55, 65, 81] },
        headStyles: { fillColor: [71, 46, 173], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [247, 245, 255] },
        theme: "striped",
      });

      doc.save(`Decaissements_LPD_${todayISO()}.pdf`);
      toast.success("Export PDF généré avec succès.");
    } catch (e) {
      toast.error("Erreur lors de l'export PDF des décaissements.");
    }
  };

  // ——————————————————————————————————————————————————
  // 🏷️ Badge statut - SANS ANNULÉ
  // ——————————————————————————————————————————————————
  const statutBadge = (s) =>
    ({
      valide: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      en_attente: "bg-amber-100 text-amber-700 border border-amber-300",
    }[s] || "bg-gray-100 text-gray-600 border border-gray-300");

  // ✅ Formatage du nom du caissier pour le tableau
  const formatCaissierName = (caissier) => {
    if (!caissier) return "-";
    return `${caissier.prenom || ''} ${caissier.nom || ''}`.trim() || "-";
  };

  return (
    <>
      {/* ✅ Nécessaire pour afficher les toast Sonner */}
      <Toaster position="top-right" richColors />

      <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
        
        {/* 🌀 Loader LPD subtil en haut à droite - POUR TOUS LES CHARGEMENTS */}
        <AnimatePresence>
          <LPDLoader visible={isFetching} />
        </AnimatePresence>

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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                  Module Décaissements — Responsable
                </span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                  Décaissements &amp; suivi budgétaire
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez vos sorties d'argent, suivez leur statut et exportez vos
                  rapports en un clic.
                </p>
              </div>
              {/* ✅ Compteur total corrigé */}
              <p className="text-[11px] text-gray-400">
                Vue consolidée au {todayISO()} • {totalItems} demande
                {totalItems > 1 && "s"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-end">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 bg-[#472EAD] hover:bg-[#5A3CF5] text-white px-4 py-2 rounded-lg shadow-md text-sm transition"
              >
                <FileDown size={18} />
                Export PDF
              </button>

              <button
                onClick={() => setOpenModal(true)}
                className="flex items-center gap-2 bg-[#472EAD] hover:bg-[#5A3CF5] text-white px-4 py-2 rounded-lg shadow-md text-sm transition"
              >
                <PlusCircle size={18} /> Nouvelle demande
              </button>
            </div>
          </motion.header>

          {/* CARTES STATS - SANS ANNULÉ */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6 mb-8" 
          >
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 px-3 py-2.5 shadow-sm">
              <div className="text-[13px] sm:text-[15px] font-semibold text-indigo-900 mb-0.5">
                Total demandes
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-indigo-800">
                  {stats.total}
                </span>
                <BadgeDollarSign className="w-5 h-5 text-indigo-700" />
              </div>
              <div className="mt-1 text-[11px] text-gray-700">
                {formatFCFA(stats.montant_total)}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 shadow-sm">
              <div className="text-[13px] sm:text-[15px] font-semibold text-emerald-900 mb-0.5">
                Demandes validées
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-emerald-700">
                  {stats.valides}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="mt-1 text-[11px] text-emerald-800">
                {formatFCFA(stats.montant_valides)}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 px-3 py-2.5 shadow-sm">
              <div className="text-[13px] sm:text-[15px] font-semibold text-amber-900 mb-0.5">
                Demandes en attente
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-amber-700">
                  {stats.attente}
                </span>
                <Clock3 className="w-5 h-5 text-amber-600" />
              </div>
              <div className="mt-1 text-[11px] text-amber-800">
                {formatFCFA(stats.montant_attente)}
              </div>
            </div>
          </motion.div>

          {/* TABLEAU + FILTRES */}
          <section className="relative bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] overflow-x-auto mt-8">

            {/* ✅ SUPPRESSION DU LOADER OVERLAY - maintenant géré par le loader LPD en haut à droite */}

            <div className="px-4 pt-4 pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-500 font-medium">Filtrer par statut :</span>
                <div className="inline-flex rounded-full bg-[#F7F5FF] border border-[#E4E0FF] p-0.5">
                  {[
                    { id: "tous", label: "Tous" },
                    { id: "en_attente", label: "En attente" },
                    { id: "valide", label: "Validés" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFilterStatut(opt.id);
                      }}
                      className={
                        "px-3 py-1 rounded-full transition " +
                        (filterStatut === opt.id
                          ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                          : "text-gray-500 hover:text-gray-700")
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Période :</span>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                    }}
                    className="border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] bg-white"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 min-w-[230px]">
                  <div className="relative flex-1">
                    {/* ✅ Plus de spinner, juste l'icône Search */}
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom caissier ..."
                      className="pl-7 pr-6 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] bg-white text-sm" 
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[11px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé affichage */}
            <div className="px-4 mb-3 text-[11px] text-gray-500">
              <span>
                Affichage : <span className="font-semibold">{demandes.length}</span> sur{" "}
                <span className="font-semibold">{totalItems}</span>
              </span>
            </div>

            <table className="min-w-full text-sm">
              <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Caissier</th>
                  <th className="px-4 py-3 text-left">Méthode</th>
                  <th className="px-4 py-3 text-left">Montant total</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {demandes.length ? (
                  demandes.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-gray-100 hover:bg-[#F9F9FF] transition"
                    >
                      <td className="px-4 py-2">
                        {formatDateSN(d.datePrevue)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatCaissierName(d.caissier)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{d.methodePaiement}</td>
                      <td className="px-4 py-2 font-medium">
                        {formatFCFA(d.montantTotal)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutBadge(
                            d.statut
                          )}`}
                        >
                          {statutLabel(d.statut).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelected(d);
                            setOpenDetail(true);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]"
                          title="Voir le détail"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-400 py-6 text-sm">
                      {searchTerm || filterStatut !== "tous" || filterStartDate || filterEndDate
                        ? "Aucun décaissement ne correspond aux filtres."
                        : "Aucun décaissement trouvé."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ✅ Pagination footer corrigée */}
            <div className="mt-6 mb-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  if (p < 1 || p > totalPages) return;
                  if (p === page) return;
                  setPage(p);
                }}
              />
            </div>

          </section>

          {/* MODALE CRÉATION */}
          <FormModal
            open={openModal}
            onClose={() => (submitting ? null : setOpenModal(false))}
            title="Nouvelle demande de décaissement"
          >
            <DecaissementForm
              onSubmit={handleAdd}
              onCancel={() => (submitting ? null : setOpenModal(false))}
              submitting={submitting}
            />
          </FormModal>

          {/* MODALE DÉTAIL */}
          <DetailDecaissementModal
            open={openDetail}
            onClose={() => setOpenDetail(false)}
            decaissement={selected}
          />
        </div>
      </div>
    </>
  );
}
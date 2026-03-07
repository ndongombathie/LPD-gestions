// ==========================================================
// 🧍‍♂️ ClientsSpeciaux.jsx — Interface Responsable (LPD Manager)
// Gestion des clients privilégiés (vente en gros + paiements par tranches)
// Version FINALE corrigée avec backend Laravel - SYNCHRONISÉ
// ==========================================================

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ListChecks,
  BadgeDollarSign,
  Phone,
} from "lucide-react";
import { useRef } from "react";
import QRCode from "react-qr-code";
import { jsPDF } from "jspdf";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import VoirDetailClient from "../components/VoirDetailClient.jsx";
import { logger } from "@/utils/logger";
import Pagination from "../components/Pagination.jsx";
import { useClientsSpeciaux } from "@/hooks/useClientsSpeciaux";
import { usePaiementsClients } from "@/hooks/usePaiementsClients";
import NouvelleTrancheModal from "../components/NouvelleTrancheModal.jsx";
import { commandesAPI } from '@/services/api';
import { normalizeCommande } from "@/utils/normalizeCommande";

const cls = (...a) => a.filter(Boolean).join(" ");
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));
const getPaiementEffectiveStatus = (paiement) =>
  String(paiement?.statut_paiement || "inconnu").toLowerCase();


// ==========================================================
// ✅ Toasts Premium
// ==========================================================
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[120] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cls(
              "min-w-[280px] max-w-[360px] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 backdrop-blur-sm",
              t.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
                : "bg-rose-50/95 border-rose-200 text-rose-800"
            )}
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
                <div className="text-xs mt-0.5 opacity-90">{t.message}</div>
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
      </AnimatePresence>
    </div>
  );
}



// ==========================================================
// 🧾 Formulaire client spécial - CORRIGÉ AVEC CHAMPS COMPLETS
// ==========================================================
function ClientForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial ?? { 
      nom: "",
      prenom: "",
      telephone: "",
      contact: "",
      numero_cni: "",
      entreprise: "",
      adresse: ""
    }
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        prenom: initial.prenom || "",
        nom: initial.nom || "",
        telephone: initial.telephone || "",
        contact: initial.contact || "",
        numero_cni: initial.numero_cni || "",
        entreprise: initial.entreprise || "",
        adresse: initial.adresse || "",
      });
    }
  }, [initial]);

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};

    if (!form.nom.trim())
      e.nom = "Le nom est requis.";

    if (!form.prenom.trim())
      e.prenom = "Le prénom est requis.";

    // ✅ SÉCURISÉ : Vérifie que le téléphone existe et ne contient que des chiffres
    if (!form.telephone || !/^[0-9]+$/.test(form.telephone))
      e.telephone = "Le téléphone doit contenir uniquement des chiffres.";

    if (!form.adresse.trim())
      e.adresse = "L'adresse est requise.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    console.log("CLIENT UPDATE FORM:", initial);

    if (validate()) onSubmit({
      ...form,
      id: initial?.id
    });
  };

  const base = (err) =>
    `mt-1 w-full rounded-xl border px-3 py-2.5 text-sm bg-white shadow-sm focus:ring-2 transition ${
      err
        ? "border-rose-500 focus:ring-rose-200"
        : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ex : DIOP"
            className={base(errors.nom)}
            required
          />
          {errors.nom && (
            <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>
          )}
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Prénom <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.prenom}
            onChange={(e) => update("prenom", e.target.value)}
            placeholder="Ex : Mamadou"
            className={base(errors.prenom)}
            required
          />
          {errors.prenom && (
            <p className="text-xs text-rose-600 mt-1">{errors.prenom}</p>
          )}
        </div>

        {/* Téléphone (nouveau champ) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Téléphone <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.telephone}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "");
              update("telephone", clean);
            }}
            placeholder="Ex : 771234567"
            className={base(errors.telephone)}
            required
          />
          {errors.telephone && (
            <p className="text-xs text-rose-600 mt-1">{errors.telephone}</p>
          )}
        </div>

        {/* Contact (champ existant) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact (optionnel)
          </label>
          <input
            value={form.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="Ex : Email ou autre"
            className={base(errors.contact)}
          />
        </div>

        {/* Numéro CNI (nouveau champ) - AVEC NETTOYAGE 13 CHIFFRES MAX */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Numéro CNI (optionnel)
          </label>
          <input
            value={form.numero_cni}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "").slice(0, 13);
              update("numero_cni", clean);
            }}
            placeholder="Ex : 1 234 5678 9012 3"
            className={base(errors.numero_cni)}
            maxLength={13}
          />
        </div>

        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Entreprise (optionnel)
          </label>
          <input
            value={form.entreprise}
            onChange={(e) => update("entreprise", e.target.value)}
            placeholder="Ex : Imprisol SARL"
            className={base(errors.entreprise)}
          />
        </div>

        {/* Adresse */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Adresse <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex : Dakar Plateau"
            className={base(errors.adresse)}
            required
          />
          {errors.adresse && (
            <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>
          )}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={cls(
            "px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm shadow-sm",
            submitting
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-gray-50"
          )}
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={submitting}
          className={cls(
            "px-4 py-2.5 rounded-lg text-sm text-white bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition",
            submitting && "opacity-70 cursor-not-allowed"
          )}
        >
          {submitting
            ? "Enregistrement..."
            : initial
            ? "Mettre à jour"
            : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// ==========================================================
// 🧾 Modal QR Code Commande (ticket)
// ==========================================================

function QrCommandeModal({ open, onClose, commande, qrPayload }) {
  const qrWrapperRef = useRef(null);

  if (!open || !commande || !qrPayload) return null;

  const handlePrint = () => {
    try {
      const canvas = qrWrapperRef.current?.querySelector("canvas");
      if (!canvas) {
        window.print();
        return;
      }

      const dataUrl = canvas.toDataURL("image/png");

      // 📏 VRAI FORMAT TICKET (80 mm de large)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 130], // largeur ticket, hauteur ~13 cm
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;

      // ================= HEADER VIOLET =================
      const headerHeight = 36;
      doc.setFillColor(71, 46, 173);
      doc.setDrawColor(71, 46, 173);
      doc.rect(0, 0, pageWidth, headerHeight, "F");

      // --- Logo "ellipse" + LPD ---
      const logoEllipseY = 10; // un peu en haut du header
      doc.setFillColor(71, 46, 173);
      doc.setDrawColor(255, 255, 255);
      doc.ellipse(centerX, logoEllipseY, 16, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(245, 128, 32);
      const logoText = "LPD";
      const logoTextWidth = doc.getTextWidth(logoText);
      doc.text(logoText, centerX - logoTextWidth / 2, logoEllipseY + 4);

      // --- Texte sous le logo ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      const title1 = "LIBRAIRIE PAPETERIE DARADJI";
      doc.text(title1, centerX, 22, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(229, 231, 235);
      const title2 = `#${commande.numero}`;
      doc.text(title2, centerX, 28.5, { align: "center" });

      // ================= QR CODE =================
      const qrSize = 40; // mm
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = headerHeight + 6;
      doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // ================= INFOS COMMANDE =================
      const infoStartY = qrY + qrSize + 8;
      const leftX = 8;

      // Badge "Client spécial" à droite
      const badgeText = "Client spécial";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const badgeTextWidth = doc.getTextWidth(badgeText);
      const badgeWidth = badgeTextWidth + 10;
      const badgeHeight = 8;
      const badgeX = pageWidth - badgeWidth - 8;
      const badgeY = infoStartY - 5;

      doc.setFillColor(254, 249, 195);
      doc.setDrawColor(234, 179, 8);
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4, 4, "FD");

      doc.setTextColor(202, 138, 4);
      doc.text(badgeText, badgeX + 5, badgeY + 5);

      // Texte à gauche
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      doc.text(
        `Client : ${commande.clientNom || "Client spécial"}`,
        leftX,
        infoStartY
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Date : ${commande.dateCommande}`, leftX, infoStartY + 5);

      // ================= TEXTE D'AIDE BAS DE TICKET =================
      const aideY = pageHeight - 12;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const aideText =
        "Présentez ce QR code à la caisse pour retrouver la commande.";
      doc.text(aideText, centerX, aideY, { align: "center" });

      const noteY = aideY + 5;
      doc.setFontSize(7);
      doc.setTextColor(202, 138, 4);
      const noteText = "Ticket spécial LPD — Client privilégié";
      doc.text(noteText, centerX, noteY, { align: "center" });

      // ================= SAUVEGARDE =================
      doc.save(`Ticket_commande_${commande.numero}.pdf`);
    } catch (e) {
      logger.error("commande.qr.print", e);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[115] bg-black/40 backdrop-blur-sm flex items-center justify-center px-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header compact avec logo LPD */}
        <div className="h-16 flex flex-col justify-center border-b border-gray-200 bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white shadow-md">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="26"
                viewBox="0 0 200 120"
                fill="none"
              >
                <ellipse cx="100" cy="60" rx="90" ry="45" fill="#472EAD" />
                <text
                  x="50%"
                  y="66%"
                  textAnchor="middle"
                  fill="#F58020"
                  fontFamily="Arial Black, sans-serif"
                  fontSize="48"
                  fontWeight="900"
                  dy=".1em"
                >
                  LPD
                </text>
              </svg>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold tracking-wider uppercase leading-none">
                  Librairie Papeterie Daradji
                </span>
                <span className="text-[10px] text-white/80">
                  #{commande.numero}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-sm font-semibold text-[#472EAD]">
              QR de la commande
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">
              À présenter à la caisse pour charger automatiquement la commande.
            </p>
          </div>

          {/* QR + infos commande */}
          <div
            ref={qrWrapperRef}
            className="flex flex-col items-center justify-center gap-2 mt-1"
          >
            <div className="p-2 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <QRCode value={qrPayload} size={160} includeMargin />
            </div>

            <div className="text-xs text-gray-600 text-center space-y-0.5">
              <div className="font-semibold text-gray-800">
                Commande #{commande.numero}
              </div>
              <div className="truncate max-w-[220px]">
                {commande.clientNom || "Client spécial"}
              </div>
              <div className="text-[11px] text-gray-500">
                Montant TTC :{" "}
                <span className="font-semibold text-emerald-600">
                  {formatFCFA(commande.totalTTC)}
                </span>
              </div>
              {commande.montantTranche && (
                <div className="text-[11px] text-[#472EAD] font-semibold">
                  Montant à encaisser : {formatFCFA(commande.montantTranche)}
                </div>
              )}
              <div className="text-[11px] text-gray-400">
                Date : {commande.dateCommande}
              </div>
            </div>
          </div>

          {/* Texte d'aide */}
          <div className="bg-[#F9FAFF] border border-[#E4E0FF] rounded-xl px-3 py-2 text-[11px] text-gray-600">
            Le QR contient le numéro de commande. 
            La caisse recharge automatiquement les informations depuis le système.
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] text-white text-xs sm:text-sm font-semibold shadow-sm hover:opacity-95"
            >
              Imprimer le QR
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 📋 Page principale Clients Spéciaux - CORRIGÉE AVEC STATUTS LARAVEL
// Version avec le même cadre visuel que Utilisateurs.jsx
// ==========================================================
export default function ClientsSpeciaux() {
  // ✅ 1️⃣ Ajouter page et searchInput
  const [page, setPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [etatFilter, setEtatFilter] = useState("tous"); 
// "tous" | "endettes" | "a_jour"
  const [statsCommandes, setStatsCommandes] = useState({
  totalTTC: 0,
  totalPaye: 0,
  reste: 0,
});
  
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [historiqueClient, setHistoriqueClient] = useState(null);
  const [openHistorique, setOpenHistorique] = useState(false);
  const [trancheClient, setTrancheClient] = useState(null);
  const [openTranche, setOpenTranche] = useState(false);
  const [lastCreatedCommande, setLastCreatedCommande] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    setPage(1);
    setSearchTerm(searchInput);
  }, [searchInput]);
  useEffect(() => {
  const loadStats = async () => {
    try {
      const response = await commandesAPI.getStatsSpecial();
      setStatsCommandes({
  totalTTC: response.data.totalTTC,
  totalPaye: response.data.totalPaye,
  reste: response.data.dette, // 👈 mapping ici
});
      
    } catch (e) {
      console.error("Erreur stats commandes", e);
    }
  };

  loadStats();
}, []);


  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // ✅ 1️⃣ Appel du hook corrigé avec etatFilter
const {
  clients,
  commandes,
  totalPages,
  totalClients, // ✅ AJOUT ICI
  loading,
  handleAdd,
  handleEdit,
  handleDelete,
} = useClientsSpeciaux(toast, {
  page,
  search: searchTerm,
  etat: etatFilter,
});

  // Gestionnaire de changement de page avec loader
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (newPage === page) return;
    if (loadingPage) return; // Éviter les clics multiples
    
    setLoadingPage(true);
    setPage(newPage);
  };

  // Désactiver le loader de page quand les données sont chargées
  useEffect(() => {
    if (!loading) {
      setLoadingPage(false);
      setInitialLoad(false);
    }
  }, [loading]);

  // ✅ 6️⃣ Désactiver le loader de page quand les données arrivent
  useEffect(() => {
    if (clients.length > 0) {
      setLoadingPage(false);
    }
  }, [clients]);

  const {
    loadPaiementsForClient,
    handleTrancheSubmit,
    handleVoirDetailEditTranche,
    handleVoirDetailDeleteTranche,
  } = usePaiementsClients(toast);

  const openHistoriqueClient = (client) => {
    setHistoriqueClient(client);
    setOpenHistorique(true);
    loadPaiementsForClient(client.id);
  };

const openTrancheClient = async (client) => {
  try {
    const raw =
      await commandesAPI.getCommandesAvecResteClientSpecial(client.id);

    const normalized = raw
      .map(normalizeCommande)
      .filter(Boolean);

    setTrancheClient({
      ...client,
      commandesSpecifiques: normalized,
    });

    setOpenTranche(true);

  } catch (e) {
    toast("error", "Erreur", "Impossible de charger les commandes du client.");
  }
};

  // ✅ Ouvrir modal uniquement si dette globale > 0
  const isTrancheDisabled = (client) => {
    return Number(client.dette || 0) <= 0;
  };
  
  // ✅ 5️⃣ Corrige suppression
  const isDeleteDisabled = (client) => {
    const dette = Number(client.dette || 0);
    return dette > 0;
  };

  // ✅ 6️⃣ Loader d'affichage initial - UNIQUEMENT au premier chargement
  if (initialLoad && loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des clients spéciaux...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-3 sm:px-4 lg:px-6 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER avec badge intégré */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-8"
        >
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Clients spéciaux — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Clients spéciaux
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestion des clients privilégiés, commandes en gros et
                paiements par tranches (préparation côté Responsable,{" "}
                <span className="font-semibold">
                  encaissement côté caisse
                </span>
                ).
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              {/* ✅ 7️⃣ Supprimé statsGlobales.nbClients */}
            </p>
          </div>

          {/* BADGE TOTAL aligné à droite au même niveau */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => setOpenAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#472EAD] text-white rounded-lg shadow-md hover:bg-[#5A3CF5] hover:shadow-lg text-xs sm:text-sm transition"
            >
              <UserPlus size={16} />
              Nouveau client
            </button>
          </div>
        </motion.header>

        {/* CARTES STATS GLOBALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Clients spéciaux */}
          <div className="rounded-xl border border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 px-3 py-2.5 shadow-sm">
            <div className="text-[15px] font-semibold text-yellow-800 mb-0.5">
              Clients spéciaux
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-yellow-700">
                {totalClients}
              </span>
              <BadgeDollarSign className="w-5 h-5 text-yellow-600" />
            </div>
          </div>

          {/* Total TTC commandes */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <div className="text-[15px] text-gray-500 mb-0.5">
              Total TTC commandes
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-lg font-extrabold text-emerald-700">
                {formatFCFA(statsCommandes.totalTTC)}
              </span>
            </div>
          </div>

          {/* Total payé */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <div className="text-[15px] text-gray-500 mb-0.5">
              Total payé (encaissé)
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-lg font-extrabold text-emerald-700">
                {formatFCFA(statsCommandes.totalPaye)}
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Dette globale */}
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <div className="text-[15px] text-gray-500 mb-0.5">
              Dette globale
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-lg font-extrabold text-rose-700">
                {formatFCFA(statsCommandes.reste)}
              </span>
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>

        {/* RECHERCHE + TABLEAU */}
        <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-4 sm:py-5 space-y-4">
          
        {/* Barre recherche + filtre état */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom ou contact ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
            />
          </div>

          {/* Filtre état */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEtatFilter("tous")}
              className={cls(
                "px-3 py-2 text-xs rounded-lg border transition",
                etatFilter === "tous"
                  ? "bg-[#472EAD] text-white border-[#472EAD]"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              )}
            >
              Tous
            </button>

            <button
              onClick={() => setEtatFilter("endettes")}
              className={cls(
                "px-3 py-2 text-xs rounded-lg border transition",
                etatFilter === "endettes"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              )}
            >
              Endettés
            </button>

            <button
              onClick={() => setEtatFilter("a_jour")}
              className={cls(
                "px-3 py-2 text-xs rounded-lg border transition",
                etatFilter === "a_jour"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              )}
            >
              À jour
            </button>
          </div>
        </div>

          {/* Résumé affichage */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
            <span>
              Affichage :{" "}
              <span className="font-semibold">{clients.length}</span>
            </span>
            <span>
              Page <span className="font-semibold">{page}</span> /{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
          </div>

          {/* TABLEAU PRINCIPAL */}
          <div className="mt-2 relative">
            {clients.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
                <Search className="w-8 h-8 mb-3 opacity-60" />
                <p className="text-sm font-medium">
                  Aucun client spécial trouvé
                </p>
                <p className="text-xs mt-1">
                  Essayez de modifier votre recherche.
                </p>
              </div>
            ) : (
              <>
                <DataTable
                  columns={[
                    {
                      key: "nom",
                      label: "Client",
                      render: (_, row) => (
                        <div className="space-y-[2px]">
                          <div className="font-semibold text-sm text-gray-800">
                            {row.nom} {row.prenom}
                          </div>

                          <div className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3"/>
                            {row.telephone}
                          </div>

                          <div className="text-[11px] text-gray-400">
                            {row.adresse}
                          </div>
                        </div>
                      )
                    },
                    {
                      key: "totalTTC",
                      label: "Total TTC",
                      render: (v) => (
                        <span className="text-xs font-semibold text-gray-700">
                          {formatFCFA(v || 0)}
                        </span>
                      ),
                    },
                    {
                      key: "totalPaye",
                      label: "Total payé",
                      render: (v) => (
                        <span className="text-xs font-semibold text-emerald-700">
                          {formatFCFA(v || 0)}
                        </span>
                      ),
                    },
                    {
                      // ✅ 4️⃣ Corrigé detteTotale → dette
                      key: "dette",
                      label: "Dette",
                      render: (v) =>
                        v > 0 ? (
                          <span className="text-xs font-semibold text-rose-700">
                            {formatFCFA(v)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            A jour
                          </span>
                        ),
                    },
                    {
                      key: "tranches",
                      label: "Tranches",
                      render: (_, row) => {
                        const nbTranches = row.nbTranchesEnAttente || 0;
                        const montantTranches = row.montantTranchesEnAttente || 0;
                        
                        return nbTranches > 0 ? (
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-amber-700">
                              {nbTranches} en attente
                            </span>

                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Aucune tranche en attente
                          </span>
                        );
                      },
                    },
                    {
                      key: "commandes_count",
                      label: "Commandes",
                      render: (_, row) => {
                        const total = row.commandes_count ?? 0;
                        const enDette = row.commandes_en_dette_count ?? 0;

                        return (
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-gray-800">
                              {total} total
                            </span>

                            {enDette > 0 ? (
                              <span className="text-rose-600 font-medium">
                                {enDette} en dette
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">
                                0 en dette
                              </span>
                            )}
                          </div>
                        );
                      },
                    }
                  ]}
                  // ✅ 3️⃣ filteredClients → clients
                  data={clients}
                  actions={[
                    {
                      icon: <BadgeDollarSign size={16} />,
                      title: "Nouvelle tranche (en attente caisse)",
                      color: "text-emerald-700",
                      hoverBg: "bg-emerald-50",
                      onClick: (row) => {
                        if (isTrancheDisabled(row)) {
                          toast(
                            "error",
                            "Nouvelle tranche impossible",
                            "Ce client n'a aucune commande avec un reste à payer."
                          );
                          return;
                        }
                        openTrancheClient(row);
                      },
                      disabled: false,                  
                    },
                    {
                      icon: <ListChecks size={16} />,
                      title: "Historique commandes / paiements",
                      color: "text-[#472EAD]",
                      hoverBg: "bg-[#F7F5FF]",
                      onClick: (row) => openHistoriqueClient(row),
                    },
                    {
                      icon: <Edit2 size={16} />,
                      title: "Modifier",
                      color: "text-[#472EAD]",
                      hoverBg: "bg-[#F7F5FF]",
                      onClick: (row) => setEditTarget(row),
                    },
                    {
                      icon: <Trash2 size={16} />,
                      title: "Supprimer",
                      color: "text-rose-600",
                      hoverBg: "bg-rose-50",
                      onClick: (row) => {
                        if (isDeleteDisabled(row)) {
                          toast(
                            "error",
                            "Suppression impossible",
                            "Ce client possède encore une dette. Veuillez solder ses commandes avant suppression."
                          );
                          return;
                        }
                        setDeleteTarget(row);
                      },
                    },
                  ]}
                />

                
                <div className="mt-6">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                  
                  {/* Indicateur de chargement pendant le changement de page - UNIQUEMENT CELUI-CI */}
                  {loadingPage && (
                    <div className="flex justify-center py-2 text-xs text-gray-400 mt-2">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin text-[#472EAD]" />
                      Chargement de la page...
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* MODALES CRUD */}
        <FormModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          title="Nouveau client spécial"
        >
          <ClientForm
            onSubmit={(data) => {
              setSubmitting(true);
              handleAdd({
                ...data,
                onSuccess: () => {
                  setSubmitting(false);
                  setOpenAdd(false);
                  setPage(1); // Retour à la première page pour voir le nouveau client
                },
                onError: () => setSubmitting(false),
              });
            }}
            onCancel={() => setOpenAdd(false)}
            submitting={submitting}
          />
        </FormModal>

        <FormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title={`Modifier : ${[editTarget?.prenom, editTarget?.nom].filter(Boolean).join(" ")}`}
        >
          {editTarget && (
            <ClientForm
              initial={editTarget}
              onSubmit={(data) => {
                setSubmitting(true);
                handleEdit({
                  ...data,
                  onSuccess: () => {
                    setSubmitting(false);
                    setEditTarget(null);
                  },
                  onError: () => setSubmitting(false),
                });
              }}
              onCancel={() => setEditTarget(null)}
              submitting={submitting}
            />
          )}
        </FormModal>

        <FormModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Confirmer la suppression"
          width="max-w-md"
        >
          <p className="text-sm text-gray-600 mb-4">
            Voulez-vous vraiment supprimer{" "}
            <span className="font-semibold">
                {[deleteTarget?.prenom, deleteTarget?.nom].filter(Boolean).join(" ")}
              </span>
              ?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={submitting}
              className={cls(
                "px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm",
                submitting
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-50"
              )}
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setSubmitting(true);
                handleDelete(deleteTarget.id, () => {
                  setSubmitting(false);
                  setDeleteTarget(null);
                });
              }}
              disabled={submitting}
              className={cls(
                "px-4 py-2 rounded-lg text-sm text-white bg-rose-600 shadow-sm",
                submitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-rose-700"
              )}
            >
              {submitting ? "Suppression en cours..." : "Supprimer"}
            </button>
          </div>
        </FormModal>

        {/* MODALE HISTORIQUE CLIENT */}
        <VoirDetailClient
          open={openHistorique}
          onClose={() => setOpenHistorique(false)}
          client={historiqueClient}
          commandes={trancheClient?.commandesSpecifiques || []}
          onEditTranche={handleVoirDetailEditTranche}
          onDeleteTranche={handleVoirDetailDeleteTranche}
        />

        {/* MODALE NOUVELLE TRANCHE */}
        <NouvelleTrancheModal
          open={openTranche}
          onClose={() => {
            setOpenTranche(false);
            setTrancheClient(null);
          }}
          client={trancheClient}
          commandes={trancheClient?.commandesSpecifiques || []}
          onSubmit={async (commande, paiement, done) => {
            try {
              await handleTrancheSubmit(commande, paiement, done);
              const nouveauMontantPaye =
                Number(commande.montantPaye || 0) + Number(paiement);

              const nouveauReste =
                Math.max(
                  Number(commande.resteAPayer ?? commande.totalTTC ?? 0) - Number(paiement),
                  0
                );

              setLastCreatedCommande({
                ...commande,
                montantPaye: nouveauMontantPaye,
                montantTranche: paiement,
                resteAPayer: nouveauReste,
              });
              setOpenTranche(false);
              setShowQrModal(true);

            } catch (e) {
              done();
              toast("error", "Erreur", "Impossible d'enregistrer la tranche.");
            }
          }}
          toast={toast}
        />
        <QrCommandeModal
          open={showQrModal}
          onClose={() => {
            setShowQrModal(false);
            setLastCreatedCommande(null);
          }}
          commande={lastCreatedCommande}
          qrPayload={
            lastCreatedCommande
              ? String(lastCreatedCommande.numero || lastCreatedCommande.id)
              : ""
          }
        />

        {/* TOASTS */}
        <Toasts toasts={toasts} remove={removeToast} />
      </div>
    </div>
  );
}
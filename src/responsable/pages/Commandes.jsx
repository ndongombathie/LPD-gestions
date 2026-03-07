// ==========================================================
// 🛒 Commandes.jsx — Interface Responsable (LPD Manager)
// Branché sur l'API Laravel (clients, produits, commandes)
// ✅ Corrections : annulation UI, stats dette, message "aucune commande"
// ✅ Correction stats : mêmes filtres que la table
// ✅ CORRECTION CRITIQUE : Normalisation API unique avec unwrapApi()
// ✅ RECHERCHE PRODUITS DYNAMIQUE : recherche backend comme pour les clients
// ✅ CORRECTIONS APPLIQUÉES :
//   - Suppression reset période dans handleChangeStatut
//   - Suppression debounce recherche
//   - Recherche instantanée
//   - Validation période
//   - Optimisation loader pagination
//   - Loader tableau pour : pagination, statut, période
//   - Pas de loader pour la recherche
// ==========================================================

import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileDown,
  PlusCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package, 
  Box,
  X,
  Receipt,
  BadgeDollarSign,
  Eye,
  Search,
  Loader2,
  Pencil,
  Check,
  XCircle,
  Info,
} from "lucide-react";
import jsPDF from "jspdf";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import "jspdf-autotable";
import { useLocation } from "react-router-dom";
import { commandesAPI, produitsAPI, clientsAPI } from '@/services/api';
import { logger } from "@/utils/logger";
import Pagination from "@/responsable/components/Pagination";
import { normalizeCommande } from "@/utils/normalizeCommande";
import NouvelleTrancheModal from "@/responsable/components/NouvelleTrancheModal";


// === Utils ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);
const cls = (...a) => a.filter(Boolean).join(" ");

// ==========================================================
// 🔧 FONCTION DE NORMALISATION UNIFIÉE POUR LES RÉPONSES API
// ==========================================================
function unwrapApi(res) {
  if (!res) return { data: [], total: 0, current_page: 1, last_page: 1 };

  // Axios response
  if (res.data !== undefined) {
    // Laravel pagination
    if (res.data.data !== undefined) return res.data;

    // API already unwrapped but paginated
    if (Array.isArray(res.data) && res.total !== undefined) {
      return {
        data: res.data,
        total: res.total,
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
      };
    }

    // Raw array
    if (Array.isArray(res.data)) {
      return {
        data: res.data,
        total: res.data.length,
        current_page: 1,
        last_page: 1,
      };
    }

    return res.data;
  }

  // Already unwrapped
  return {
    data: [],
    total: 0,
    current_page: 1,
    last_page: 1,
  };
}

// ==========================================================
// ✅ Toasts Premium (avec support INFO)
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
                : t.type === "info"
                ? "bg-blue-50/95 border-blue-200 text-blue-800"
                : "bg-rose-50/95 border-rose-200 text-rose-800"
            )}
          >
            <div className="pt-0.5">
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : t.type === "info" ? (
                <Info className="w-5 h-5" />
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
      const logoEllipseY = 10;
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
// 🧾 Modal de détail / pseudo facture
// ==========================================================

function FactureModal({ open, onClose, commande }) {
  if (!open || !commande) return null;

  const tauxTVA =
    typeof commande.tauxTVA === "number"
      ? commande.tauxTVA
      : commande.totalHT
      ? commande.totalTVA / commande.totalHT || 0
      : 0.18;

  const tauxTVAPourcent = Math.round(tauxTVA * 100);

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center px-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Détail commande #{commande.numero}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 rounded-full p-1 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Infos client / en-tête */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Client spécial</div>

            <div className="font-semibold text-sm text-gray-800">
              {commande.clientPrenom && commande.clientNomSeul
                ? `${commande.clientPrenom} ${commande.clientNomSeul}`
                : commande.clientNom}
            </div>

            {commande.clientContact && (
              <div className="text-xs text-gray-500 mt-0.5">
                Contact : <span className="font-medium">{commande.clientContact}</span>
              </div>
            )}

            {commande.clientEntreprise && (
              <div className="text-xs text-gray-400">
                {commande.clientEntreprise}
              </div>
            )}
          </div>
          <div className="text-right text-sm">
            <div>Date : {commande.dateCommande}</div>
            <div className="text-xs text-gray-500">
              Statut caisse :{" "}
              <span className="font-semibold">{commande.statutLabel}</span>
            </div>
          </div>
        </div>

        {/* Lignes produits */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F5FF] text-[#472EAD]">
              <tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">PU (libre)</th>
                <th className="px-3 py-2 text-right">Total HT</th>
                <th className="px-3 py-2 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {commande.lignes.map((l) => (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <div className="font-medium">{l.libelle}</div>
                    {l.ref && (
                      <div className="text-[10px] text-gray-500">
                        Réf : {l.ref}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-left text-[11px] text-gray-600">
                    {l.modeVente === "gros"
                      ? "Gros (cartons/boîtes)"
                      : "Détail (unités)"}
                  </td>
                  <td className="px-3 py-2 text-right">{l.qte}</td>
                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.prixUnitaire)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.totalHT)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.totalTTC)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-4">
          <div className="sm:w-64 bg-[#F9FAFF] rounded-xl border border-[#E4E0FF] p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Total HT</span>
              <span className="font-semibold">
                {formatFCFA(commande.totalHT)}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">TVA ({tauxTVAPourcent}%)</span>
              <span className="font-semibold">
                {formatFCFA(commande.totalTVA)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="font-semibold text-[#472EAD]">Total TTC</span>
              <span className="font-bold text-[#472EAD]">
                {formatFCFA(commande.totalTTC)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ======================================================================
// 🧩 Formulaire Commande (multi-lignes produits + dropdown client instantané)
// ======================================================================
function CommandeForm({ clientInitial, onCreate, toast }) {
  // ✅ REF pour l'input produit
  const produitInputRef = useRef(null);
  const [stockError, setStockError] = useState("");
  // ✅ CLIENT - States pour dropdown client
  const [allClients, setAllClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [searchClient, setSearchClient] = useState("");
  const [hasLoadedClients, setHasLoadedClients] = useState(false);
 
  // ✅ CLIENT - State dédié pour le client sélectionné
  const [selectedClient, setSelectedClient] = useState(null);
  
  // ✅ PRODUIT - Chargement unique
  const [catalogue, setCatalogue] = useState([]);
  const [produitsLoading, setProduitsLoading] = useState(false);
  const [hasLoadedProduits, setHasLoadedProduits] = useState(false);

  // ✅ PRODUIT - States pour dropdown produit (comme le client)
  const [isProduitOpen, setIsProduitOpen] = useState(false);
  const [searchProduit, setSearchProduit] = useState("");
  const [selectedProduit, setSelectedProduit] = useState(null);

  const [dateCommande] = useState(todayISO());

  // TVA activée ou non
  const [applyTVA, setApplyTVA] = useState(false);

  // ✅ OPTIONNEL : spinner sur le bouton d'envoi
  const [submitting, setSubmitting] = useState(false);

  // Champ de saisie "ligne en cours"
  const [ligneProduitId, setLigneProduitId] = useState("");
  const [ligneLibelle, setLigneLibelle] = useState("");
  const [ligneQte, setLigneQte] = useState("");
  const [lignePrix, setLignePrix] = useState("");
  const [ligneMode, setLigneMode] = useState("gros");

  const qteInputRef = useRef(null);

  // Lignes de la commande
  const [lignes, setLignes] = useState([]);

  // ✅ FILTRAGE SIMPLE DES PRODUITS (comme pour les clients)
  const filteredProduits = catalogue.filter((p) => {
    const term = searchProduit.toLowerCase();

    return (
      (p.libelle || "").toLowerCase().includes(term) ||
      (p.ref || "").toLowerCase().includes(term)
    );
  });

  // ✅ Chargement unique de tous les clients spéciaux
  const loadAllClients = async () => {
    if (hasLoadedClients || clientsLoading) return;

    try {
      setClientsLoading(true);
      const res = await clientsAPI.getAllSpeciaux();
      const payload = unwrapApi(res);
      const produits = Array.isArray(payload)
        ? payload
        : payload.data || [];

        const normalized = produits.map((p) => {
          const prenom = p.prenom || "";
          const nomSeul = p.nom || "";
          const fullName =
            prenom && nomSeul
              ? `${prenom} ${nomSeul}`
              : nomSeul;

          return {
            id: p.id,

            // 🔥 pour affichage
            nom: fullName,

            // 🔥 pour recherche intelligente
            prenom,
            nomSeul,

            contact: p.contact || "",

            code:
              p.code_client ||
              p.code ||
              (p.id ? `CL-${String(p.id).padStart(3, "0")}` : ""),
          };
        });

      setAllClients(normalized);
      setHasLoadedClients(true);
    } catch (e) {
      logger.error("clients.load.all", e);
      toast(
        "error",
        "Erreur de chargement",
        "Impossible de charger la liste des clients."
      );
    } finally {
      setClientsLoading(false);
    }
  };

  // ✅ Chargement unique de tous les produits
  useEffect(() => {
    const loadAllProduits = async () => {
      if (hasLoadedProduits) return;

      try {
        setProduitsLoading(true);

          const res = await produitsAPI.getAllProduits();
          const payload = unwrapApi(res);

          const data = Array.isArray(payload)
            ? payload
            : payload?.data || [];

          const normalized = data.map((t) => {
            const produit = t.produit ?? t;

            const stockUnites = Number(t.quantite ?? 0);
            const unitesParCarton = Number(produit.unite_carton ?? 1);
            const stockCartons = Math.floor(stockUnites / unitesParCarton);

            const prixDetail = Number(
              t.prix_vente_detail ??
              produit.prix_vente_detail ??
              0
            );

            const prixGros = Number(
              t.prix_vente_gros ??
              produit.prix_unite_carton ??
              produit.prix_vente_gros ??
              0
            );

            return {
              id: produit.id,

              // 🔥 CODE BARRE UNIQUEMENT
              ref: produit.code ?? null,

              libelle: produit.nom ?? "",

              prixDetail,
              prixGros,
              prix: prixDetail || prixGros || 0,

              unitesParCarton,

              // 🔥 STOCK BOUTIQUE RÉEL
              stockGlobal: stockUnites,
              nombreCartons: stockCartons,
            };
          });

        setCatalogue(normalized);
        setHasLoadedProduits(true);
      } catch (error) {
        logger.error("produits.load.all", error);
        toast(
          "error",
          "Erreur de chargement",
          "Impossible de charger le catalogue produits."
        );
      } finally {
        setProduitsLoading(false);
      }
    };

    loadAllProduits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadedProduits]);
useEffect(() => {
  if (!selectedProduit || !ligneQte) {
    setStockError("");
    return;
  }

  const qteNum = Number(ligneQte);

  if (!Number.isInteger(qteNum) || qteNum < 1) {
    setStockError("");
    return;
  }

  const stockUnites = selectedProduit.stockGlobal ?? 0;
  const unitsPerCarton = selectedProduit.unitesParCarton ?? 1;
  const stockCartons = selectedProduit.nombreCartons ?? Math.floor(stockUnites / unitsPerCarton);

  if (ligneMode === "detail") {
    if (qteNum > stockUnites) {
      setStockError(
        `Stock insuffisant : seulement ${stockUnites} unité(s) disponible(s)`
      );
      return;
    }
  }

  if (ligneMode === "gros") {
    if (qteNum > stockCartons) {
      setStockError(
        `Stock insuffisant : seulement ${stockCartons} carton(s) disponible(s)`
      );
      return;
    }
  }

  setStockError("");
}, [ligneQte, ligneMode, selectedProduit]);

  // ✅ Rafraîchir la liste des clients (optionnel)
  const refreshClients = async () => {
    setHasLoadedClients(false);
    await loadAllClients();
  };

  // ✅ Filtrage instantané frontend clients
  const filteredClients = allClients.filter((c) => {
    const term = searchClient
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const prenom = (c.prenom || "").toLowerCase();
    const nom = (c.nomSeul || "").toLowerCase();
    const full1 = `${prenom} ${nom}`;
    const full2 = `${nom} ${prenom}`;
    const contact = (c.contact || "").toLowerCase();

    return (
      prenom.includes(term) ||
      nom.includes(term) ||
      full1.includes(term) ||
      full2.includes(term) ||
      contact.includes(term)
    );
  });
  // ✅ Initialisation du client sélectionné à partir de clientInitial
  useEffect(() => {
    if (clientInitial && !selectedClient) {
      const fetchInitialClient = async () => {
        try {
          const res = await clientsAPI.getById(clientInitial);
          if (res?.data) {
            const client = {
              id: res.data.id,
              nom: res.data.nom || res.data.entreprise || "",
              code: res.data.code_client || res.data.code || "",
            };
            setSelectedClient(client);
            setSearchClient(client.nom);
          }
        } catch (e) {
          logger.error("client.fetch.initial", e);
        }
      };
      
      fetchInitialClient();
    }
  }, [clientInitial, selectedClient]);

  const totalHT = useMemo(
    () => lignes.reduce((sum, l) => sum + Number(l.totalHT || 0), 0),
    [lignes]
  );
  const totalTVA = useMemo(() => (applyTVA ? totalHT * 0.18 : 0), [
    totalHT,
    applyTVA,
  ]);
  const totalTTC = useMemo(() => totalHT + totalTVA, [totalHT, totalTVA]);

  const resetLigne = () => {
    setLigneProduitId("");
    setLigneLibelle("");
    setSelectedProduit(null);
    setSearchProduit("");
    setLigneQte("");
    setLignePrix("");
  };

  const baseInput =
    "w-full rounded-xl border px-3 py-2 text-sm bg-white shadow-sm border-gray-300 focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]";

  const handleChangeMode = (mode) => {
    setLigneMode(mode);
    const p = selectedProduit;
    if (!p) return;

    if (mode === "detail" && p.prixDetail) {
      setLignePrix(String(p.prixDetail));
    } else if (mode === "gros" && p.prixGros) {
      setLignePrix(String(p.prixGros));
    }
  };

  const handleAddLigne = () => {
    if (!selectedProduit || !ligneQte || !lignePrix) {
      toast(
        "error",
        "Ligne incomplète",
        "Veuillez sélectionner un produit, renseigner quantité et prix."
      );
      return;
    }

    const qteNum = Number(ligneQte);
    const prixNum = Number(lignePrix);

    if (!Number.isInteger(qteNum) || qteNum < 1) {
      toast(
        "error",
        "Quantité invalide",
        "La quantité doit être un nombre entier supérieur à 0."
      );
      return;
    }

    const p = selectedProduit;
    if (p) {
      const unitsPerCarton = p.unitesParCarton || 1;
      const stockGlobal = p.stockGlobal ?? null;
      const nbCartons =
        p.nombreCartons ??
        (stockGlobal != null ? Math.floor(stockGlobal / unitsPerCarton) : null);

      if (ligneMode === "detail" && stockGlobal != null) {
        if (qteNum > stockGlobal) {
          toast(
            "error",
            "Stock insuffisant",
            `Stock disponible : ${stockGlobal} unité(s).`
          );
          return;
        }
      }

      if (ligneMode === "gros" && nbCartons != null) {
        if (qteNum > nbCartons) {
          toast(
            "error",
            "Stock cartons insuffisant",
            `Stock disponible : ${nbCartons} carton(s).`
          );
          return;
        }
      }
    }

    const unitsPerCarton = selectedProduit?.unitesParCarton || 1;
    const quantiteUnites = ligneMode === "gros" ? qteNum * unitsPerCarton : qteNum;

    const totalHTLigne = qteNum * prixNum;
    const totalTTCLigne = applyTVA ? totalHTLigne * 1.18 : totalHTLigne;

    const ref = selectedProduit?.ref || null;

    const nouvelle = {
      id: Date.now(),
      produitId: selectedProduit.id,
      libelle: selectedProduit.libelle,
      ref,
      qte: qteNum,
      prixUnitaire: prixNum,
      totalHT: totalHTLigne,
      totalTTC: totalTTCLigne,
      modeVente: ligneMode,
      quantiteUnites,
    };

    setLignes((prev) => [...prev, nouvelle]);
    resetLigne();
    
    if (produitInputRef.current) {
      produitInputRef.current.focus();
    }
  };

  const handleRemoveLigne = (id) =>
    setLignes((prev) => prev.filter((l) => l.id !== id));

  // 🔧 Édition d'une ligne
  const [editingId, setEditingId] = useState(null);
  const [editingQte, setEditingQte] = useState("");
  const [editingPrix, setEditingPrix] = useState("");

  const handleStartEditLigne = (ligne) => {
    setEditingId(ligne.id);
    setEditingQte(String(ligne.qte));
    setEditingPrix(String(ligne.prixUnitaire));
  };

  const handleCancelEditLigne = () => {
    setEditingId(null);
    setEditingQte("");
    setEditingPrix("");
  };

  const handleSaveEditLigne = () => {
    if (!editingId) return;

    const ligne = lignes.find((l) => l.id === editingId);
    if (!ligne) return;

    const qteNum = Number(editingQte);
    const prixNum = Number(editingPrix);

    if (!Number.isInteger(qteNum) || qteNum < 1 || !prixNum || prixNum <= 0) {
      toast(
        "error",
        "Valeurs invalides",
        "La quantité doit être un entier supérieur à 0 et le prix positif."
      );
      return;
    }

    const produit = catalogue.find((p) => String(p.id) === String(ligne.produitId));

    if (produit) {
      const unitsPerCarton = produit.unitesParCarton || 1;
      const stockGlobal = produit.stockGlobal ?? null;
      const nbCartons =
        produit.nombreCartons ??
        (stockGlobal != null ? Math.floor(stockGlobal / unitsPerCarton) : null);

      if (ligne.modeVente === "detail" && stockGlobal != null) {
        if (qteNum > stockGlobal) {
          toast(
            "error",
            "Stock insuffisant",
            `Stock disponible : ${stockGlobal} unité(s).`
          );
          return;
        }
      }

      if (ligne.modeVente === "gros" && nbCartons != null) {
        if (qteNum > nbCartons) {
          toast(
            "error",
            "Stock cartons insuffisant",
            `Stock disponible : ${nbCartons} carton(s).`
          );
          return;
        }
      }
    }

    const unitsPerCarton = produit?.unitesParCarton || 1;
    const quantiteUnites =
      ligne.modeVente === "gros" ? qteNum * unitsPerCarton : qteNum;

    const totalHTLigne = qteNum * prixNum;
    const totalTTCLigne = applyTVA ? totalHTLigne * 1.18 : totalHTLigne;

    setLignes((prev) =>
      prev.map((l) =>
        l.id === editingId
          ? {
              ...l,
              qte: qteNum,
              prixUnitaire: prixNum,
              totalHT: totalHTLigne,
              totalTTC: totalTTCLigne,
              quantiteUnites,
            }
          : l
      )
    );

    setEditingId(null);
    setEditingQte("");
    setEditingPrix("");
  };

  // ✅ Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient) {
      toast(
        "error",
        "Client manquant",
        "Veuillez sélectionner un client spécial avant d'envoyer la commande."
      );
      return;
    }

    if (!lignes.length) {
      toast(
        "error",
        "Aucune ligne",
        "Ajoutez au moins un produit à la commande."
      );
      return;
    }

    setSubmitting(true);

    try {
      const commandeDraft = {
        clientId: selectedClient.id,
        clientNom: selectedClient.nom,
        clientCode: selectedClient.code,
        dateCommande,
        appliquerTVA: applyTVA,
        totalHT,
        totalTVA,
        totalTTC,
        lignes,
      };

      await onCreate(commandeDraft);

      refreshClients();

      setLignes([]);
      setLigneProduitId("");
      setLigneLibelle("");
      setLigneQte("");
      setLignePrix("");
      setLigneMode("gros");
      setSelectedClient(null);
      setSearchClient("");
      setSelectedProduit(null);
      setSearchProduit("");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".client-combobox")) {
        setIsClientOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".produit-combobox")) {
        setIsProduitOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] px-3 sm:px-4 py-4 sm:py-5 space-y-5 mt-6"
      >
        <h2 className="text-lg font-semibold text-[#472EAD] mb-1 flex items-center gap-2">
          <PlusCircle size={18} /> Nouvelle commande client spécial
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Préparez la commande en gros ici. Elle sera ensuite{" "}
          <span className="font-semibold text-[#472EAD]">envoyée à la caisse</span>{" "}
          pour encaissement (acomptes / soldes).
        </p>

        {/* Ligne client + date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* BLOC CLIENT */}
          <div className="sm:col-span-2 relative client-combobox">
            <label className="block text-xs text-gray-500 mb-1">
              Client spécial
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchClient}
                onClick={() => {
                  setIsClientOpen(prev => !prev);
                  loadAllClients();
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchClient(value);
                  
                  if (!value) {
                    setSelectedClient(null);
                  }
                  
                  setIsClientOpen(true);
                }}
                placeholder="Rechercher un client spécial..."
                className={baseInput}
              />

              <button
                type="button"
                onClick={() => {
                  setIsClientOpen((prev) => !prev);
                  loadAllClients();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isClientOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {clientsLoading && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-9 top-1/2 -translate-y-1/2 text-[#472EAD]" />
              )}
            </div>

            {isClientOpen && (
              <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedClient(c);
                        setSearchClient(c.nom);
                        setIsClientOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F5FF]"
                    >
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium border border-amber-200">
                        VIP
                      </span>
                      <span className="font-medium">{c.nom}</span>
                      {c.contact && (
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <svg 
                            className="w-3 h-3" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                            />
                          </svg>
                          {c.contact}
                        </span>
                      )}
                    </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Aucun client trouvé
                  </div>
                )}
              </div>
            )}

            {selectedClient && (
              <div className="mt-1 text-[11px] text-gray-500">
                Code client :{" "}
                <span className="font-semibold">{selectedClient.code}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <div className="px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200">
              {dateCommande}
            </div>
          </div>
        </div>

        {/* Saisie ligne produit */}
        <div className="border border-[#E4E0FF] rounded-xl p-4 bg-[#F9FAFF] space-y-3 mt-4">
          {/* Mode de vente */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Mode de vente
              </label>
              <div className="inline-flex rounded-full border border-[#E4E0FF] bg-white p-1">
                <button
                  type="button"
                  onClick={() => handleChangeMode("gros")}
                  className={cls(
                    "px-3 py-1.5 text-xs rounded-full transition",
                    ligneMode === "gros"
                      ? "bg-[#472EAD] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  En Gros (cartons/boîtes)
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeMode("detail")}
                  className={cls(
                    "px-3 py-1.5 text-xs rounded-full transition",
                    ligneMode === "detail"
                      ? "bg-[#472EAD] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Détail (unités)
                </button>
              </div>
            </div>

            {selectedProduit && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Stock disponible
                  </span>

                  {stockError ? (
                    <span className="text-xs font-semibold text-rose-600">
                      Dépassement détecté
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-semibold">
                      Quantité valide
                    </span>
                  )}
                </div>

                {/* Stock chiffres */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Unités</div>
                    <div className="font-bold text-lg text-gray-900">
                      {selectedProduit.stockGlobal}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-xs">Cartons</div>
                    <div className="font-bold text-lg text-gray-900">
                      {selectedProduit.nombreCartons}
                    </div>
                  </div>
                </div>

                {/* Barre dynamique */}
                {ligneQte && (
                  <div className="mt-4">
                    {(() => {
                      const qte = Number(ligneQte);
                      const max =
                        ligneMode === "gros"
                          ? selectedProduit.nombreCartons
                          : selectedProduit.stockGlobal;

                      if (!max) return null;

                      const percent = Math.min((qte / max) * 100, 100);

                      return (
                        <>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Saisi : {qte}</span>
                            <span>Max : {max}</span>
                          </div>

                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.3 }}
                                className={
                                  qte > max
                                    ? "h-full bg-rose-600"
                                    : percent >= 70
                                    ? "h-full bg-amber-500"
                                    : "h-full bg-emerald-500"
                                }
                            />
                          </div>

                          {qte > max && (
                            <div className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Quantité supérieure au stock disponible
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Info carton */}
                {ligneMode === "gros" && selectedProduit.unitesParCarton && (
                  <div className="mt-3 text-xs text-gray-500">
                    1 carton = {selectedProduit.unitesParCarton} unité(s)
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start mt-3">
            {/* BLOC PRODUIT */}
            <div className="sm:col-span-2 relative produit-combobox">
              <label className="block text-xs text-gray-500 mb-1">
                Produit
              </label>

              <div className="relative">
              <input
                ref={produitInputRef}
                type="text"
                value={searchProduit}
                onClick={() => setIsProduitOpen(prev => !prev)}
                onChange={(e) => {
                  setSearchProduit(e.target.value);
                  setIsProduitOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();

                    const term = searchProduit.trim().toLowerCase();
                    if (!term) return;

                    // 🔥 Recherche EXACTE par code barre
                    const produit = catalogue.find(
                      (p) => (p.ref || "").toLowerCase() === term
                    );

                    if (!produit) {
                      toast(
                        "error",
                        "Produit introuvable",
                        "Aucun produit ne correspond à ce code barre."
                      );
                      return;
                    }

                    // 🔥 Sélection automatique
                    setSelectedProduit(produit);
                    setSearchProduit(produit.libelle);
                    setLigneProduitId(produit.id);
                    setLigneLibelle(produit.libelle);

                    const prix =
                      ligneMode === "gros"
                        ? produit.prixGros || produit.prixDetail
                        : produit.prixDetail || produit.prixGros;

                    setLignePrix(String(prix || 0));
                    setIsProduitOpen(false);

                    // Focus quantité
                    setTimeout(() => {
                      qteInputRef.current?.focus();
                    }, 50);
                  }
                }}
                placeholder="Scanner ou rechercher un produit..."
                className={baseInput}
                disabled={produitsLoading}
              />

                <button
                  type="button"
                  onClick={() => setIsProduitOpen(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isProduitOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {produitsLoading && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-9 top-1/2 -translate-y-1/2 text-[#472EAD]" />
                )}
              </div>

              {isProduitOpen && (
                <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
                  {filteredProduits.length > 0 ? (
                    filteredProduits.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduit(p);
                          setSearchProduit(p.libelle);
                          setLigneProduitId(p.id);
                          setLigneLibelle(p.libelle);

                          const prix =
                            ligneMode === "gros"
                              ? p.prixGros || p.prixDetail
                              : p.prixDetail || p.prixGros;

                          setLignePrix(String(prix || 0));
                          setIsProduitOpen(false);
                          
                          if (qteInputRef.current) {
                            qteInputRef.current.focus();
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F5FF]"
                      >
                        {p.libelle}
                        {p.ref && (
                          <span className="ml-2 text-[10px] text-gray-500">
                            ({p.ref})
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Aucun produit trouvé
                    </div>
                  )}
                </div>
              )}

              {selectedProduit && (
                <div className="mt-1 text-[10px] text-gray-500">
                  Réf : {selectedProduit.ref || "—"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Quantité {ligneMode === "gros" ? "(cartons/boîtes)" : "(unités)"}
              </label>
                <input
                  ref={qteInputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={ligneQte}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Empêche 0 et négatif immédiatement
                    if (Number(value) < 1) {
                      setLigneQte("");
                      return;
                    }

                    setLigneQte(value);
                  }}
                  className={cls(
                    baseInput,
                    stockError && "border-rose-400 focus:ring-rose-200 focus:border-rose-500"
                  )}
                />

              {ligneMode === "gros" &&
                selectedProduit &&
                selectedProduit.unitesParCarton && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    1 carton = {selectedProduit.unitesParCarton} unité(s)
                  </div>
                )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Prix unitaire (libre)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={lignePrix}
                onChange={(e) => {
                  const value = e.target.value;

                  if (Number(value) <= 0) {
                    setLignePrix("");
                    return;
                  }

                  setLignePrix(value);
                }}
                className={baseInput}
                placeholder="Ex: 12000"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleAddLigne}
            disabled={
              !!stockError ||
              !selectedProduit ||
              !ligneQte ||
              !Number.isInteger(Number(ligneQte)) ||
              Number(ligneQte) < 1 ||
              !lignePrix ||
              Number(lignePrix) <= 0
            }
            className={cls(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm transition",
              !!stockError ||
              !selectedProduit ||
              !ligneQte ||
              !Number.isInteger(Number(ligneQte)) ||
              Number(ligneQte) < 1 ||
              !lignePrix ||
              Number(lignePrix) <= 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#472EAD] text-white shadow-md hover:bg-[#5A3CF5] hover:shadow-lg"
            )}
          >
            Ajouter à la commande
          </button>
          </div>
        </div>

        {/* Tableau des lignes de la commande */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white mt-4">
          <table className="min-w-full text-xs">
            <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">PU (libre)</th>
                <th className="px-3 py-2 text-right">Total HT</th>
                <th className="px-3 py-2 text-right">Total TTC</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length ? (
                lignes.map((l) => {
                  const isEditing = editingId === l.id;

                  return (
                    <tr
                      key={l.id}
                      className="border-t border-gray-100 hover:bg-[#F9F9FF]"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{l.libelle}</div>
                        {l.ref && (
                          <div className="text-[10px] text-gray-500">
                            Réf : {l.ref}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-600">
                        {l.modeVente === "gros"
                          ? "Gros (cartons/boîtes)"
                          : "Détail (unités)"}
                      </td>

                      <td className="px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editingQte}
                            onChange={(e) => setEditingQte(e.target.value)}
                            className="w-20 text-right border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                          />
                        ) : (
                          l.qte
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={editingPrix}
                            onChange={(e) => setEditingPrix(e.target.value)}
                            className="w-24 text-right border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                          />
                        ) : (
                          formatFCFA(l.prixUnitaire)
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">{formatFCFA(l.totalHT)}</td>
                      <td className="px-3 py-2 text-right">{formatFCFA(l.totalTTC)}</td>

                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSaveEditLigne}
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              title="Valider les modifications"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditLigne}
                              className="p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                              title="Annuler"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditLigne(l)}
                              className="p-1.5 rounded-md hover:bg-indigo-50 text-[#472EAD]"
                              title="Modifier quantité et PU"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLigne(l.id)}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                              title="Retirer la ligne"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-gray-400 text-xs">
                    Aucune ligne ajoutée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux + bouton envoyer à la caisse */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <span>
              Cette commande sera envoyée à la{" "}
              <span className="font-semibold text-[#472EAD]">caisse</span> pour
              encaissement (acomptes / soldes). Les paiements par tranches
              seront gérés côté caisse.
            </span>
            <label className="inline-flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={applyTVA}
                onChange={(e) => setApplyTVA(e.target.checked)}
                className="rounded border-gray-400"
              />
              <span>Appliquer la TVA de 18 %</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="bg-[#F9FAFF] border border-[#E4E0FF] rounded-xl px-4 py-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Total HT</span>
                <span className="font-semibold">{formatFCFA(totalHT)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">TVA ({applyTVA ? "18" : "0"}%)</span>
                <span className="font-semibold">{formatFCFA(totalTVA)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-semibold text-[#472EAD]">Total TTC</span>
                <span className="font-bold text-[#472EAD]">{formatFCFA(totalTTC)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedClient || !lignes.length || submitting}
              className={cls(
                "px-5 py-2 rounded-lg bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] text-white text-sm font-semibold hover:opacity-95 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2",
                submitting && "opacity-80"
              )}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Création en cours..." : "Créer commande "}
            </button>
          </div>
        </div>
      </motion.form>
    </>
  );
}

// ======================================================================
// 🔐 Construction du payload QR
// ======================================================================
function buildQrPayloadFromCommande(commande) {
  if (!commande) return "";

  const numero =
    commande.numero ??
    commande.numero_commande ??
    commande.reference ??
    commande.id ??
    "";

  return numero ? String(numero) : "";
}

// ==========================================================
// 📦 Page Commandes (Responsable)
// ==========================================================
export default function Commandes() {
  const { state } = useLocation();
  const [highlightedId, setHighlightedId] = useState(null);

  const clientIdFromState = state?.clientId || null;
  const clientNameFromState = state?.clientNom || state?.client || "";

  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [commandes, setCommandes] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [openFacture, setOpenFacture] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrancheModal, setShowTrancheModal] = useState(false);

  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState(todayISO());
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [clientsMap, setClientsMap] = useState({});
  const [lastCreatedCommande, setLastCreatedCommande] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const handleTrancheSuccess = () => {
    setShowTrancheModal(false);
    setShowQrModal(true);
  };

  const [statsFromBackend, setStatsFromBackend] = useState(null);
  
  // ✅ Refs pour détecter les changements
  const previousPageRef = useRef(1);
  const previousSearchRef = useRef("");

  const qrPayload = useMemo(
    () =>
      lastCreatedCommande ? buildQrPayloadFromCommande(lastCreatedCommande) : "",
    [lastCreatedCommande]
  );

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // 🔗 Chargement des commandes depuis le backend
  const fetchCommandes = async () => {
    if (filterStartDate && filterEndDate && filterStartDate > filterEndDate) {
      toast(
        "error",
        "Période invalide",
        "La date de début doit être avant la date de fin."
      );
      return;
    }

    try {
      // ✅ Détection si c'est un changement de recherche
      const isSearchChange = previousSearchRef.current !== searchTerm;

      // ✅ Loader UNIQUEMENT pour :
      // - Premier chargement : full screen
      // - Pagination, statut, période : loader tableau
      // - Recherche : PAS de loader
      if (isFirstLoad) {
        setLoading(true);
      } else if (!isSearchChange) {
        setLoadingPage(true);
      }

      // ✅ Paramètres envoyés à Laravel - Utilisation directe de filterStatut
      const params = {
        type_client: "special",
        page,
        ...(filterStatut !== "tous" && { statut: filterStatut }),
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(searchTerm && { search: searchTerm }),
        ...(clientIdFromState && { client_id: clientIdFromState }),
      };

      const res = await commandesAPI.getAll(params);
      
      // ✅ Appel séparé pour les statistiques avec les mêmes filtres de date
      const statsRes = await commandesAPI.getStatsSpecial({
        ...(filterStatut !== "tous" && { statut: filterStatut }),
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(searchTerm && { search: searchTerm }),
        ...(clientIdFromState && { client_id: clientIdFromState }),
      });

      const payload = unwrapApi(res);
      const commandesData = payload.data || [];

      const paginationData = {
        current_page: Number(payload.current_page || 1),
        last_page: Number(payload.last_page || 1),
        total: Number(payload.total || commandesData.length || 0),
      };

      const normalized = commandesData.map(normalizeCommande);
      setCommandes(normalized);

      if (paginationData.current_page !== page) {
        setPage(paginationData.current_page);
      }
      setLastPage(paginationData.last_page);
      setTotal(paginationData.total);

      // ✅ Utilisation des stats de l'appel séparé
      setStatsFromBackend(statsRes?.data || {});

    } catch (error) {
      logger.error("commandes.fetch", error);
      toast(
        "error",
        "Erreur de chargement",
        "Impossible de charger les commandes clients spéciaux."
      );
    } finally {
      setLoading(false);
      setLoadingPage(false);
      setIsFirstLoad(false);
      
      // ✅ Mise à jour des refs
      previousPageRef.current = page;
      previousSearchRef.current = searchTerm;
    }
  };

  // 🔗 Chargement des clients spéciaux pour retrouver les noms
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await clientsAPI.getAll({ type_client: "special" });
        const clientsPayload = unwrapApi(res);

        const map = {};
        (clientsPayload.data || []).forEach((c) => {
          const nom =
            c.nom ||
            c.nom_client ||
            c.nom_client_special ||
            c.raison_sociale ||
            c.raisonSociale ||
            "";
          if (c.id && nom) {
            map[c.id] = nom;
          }
        });

        setClientsMap(map);
      } catch (error) {
        logger.error("clients.fetch.special", error);
      }
    };

    fetchClients();
  }, []);

  // Compléter les commandes sans nom
  useEffect(() => {
    if (!clientsMap || !Object.keys(clientsMap).length) return;

    setCommandes((prev) =>
      prev.map((c) => {
        if (c.clientNom && c.clientNom.trim() !== "") return c;
        if (!c.clientId) return c;

        const nom = clientsMap[c.clientId];
        if (!nom) return c;

        return { ...c, clientNom: nom };
      })
    );
  }, [clientsMap]);

  // ✅ Agrégation des stats globales
  const statsGlobales = {
    nbCommandes: Number(statsFromBackend?.nb ?? 0),
    nbAnnulees: Number(statsFromBackend?.annulees ?? 0),
    totalTTC: Number(statsFromBackend?.totalTTC ?? 0),
    totalPaye: Number(statsFromBackend?.totalPaye ?? 0),
    detteTotale: Number(statsFromBackend?.dette ?? 0),
  };

  const handleAnnuler = async (commande) => {
    if (commande.statut === "soldee" || commande.statut === "annulee") {
      toast(
        "error",
        "Annulation impossible",
        `Une commande ${commande.statut === "soldee" ? "soldée" : "déjà annulée"} ne peut plus être modifiée.`
      );
      return;
    }

    try {
      await commandesAPI.cancel(commande.id);

      setCommandes((prev) =>
        prev.map((c) =>
          c.id === commande.id
            ? { ...c, statut: "annulee", statutLabel: "Annulée" }
            : c
        )
      );

      toast(
        "success",
        "Commande annulée",
        `Commande #${commande.numero} pour ${commande.clientNom}`
      );
      
    } catch (error) {
      logger.error("commandes.cancel", error);
      toast(
        "error",
        "Erreur",
        "Impossible d'annuler cette commande pour le moment."
      );
    }
  };

  const handleCreateCommande = async (commandeDraft) => {
    try {

      // 🔎 1️⃣ Détection automatique du type global
      const modes = new Set(
        commandeDraft.lignes.map(l => l.modeVente)
      );

      let typeVenteGlobal;

      if (modes.size === 1) {
        typeVenteGlobal = [...modes][0]; // "gros" ou "detail"
      } else {
        typeVenteGlobal = "mixte";
      }

      // 📦 2️⃣ Construction du payload
      const payload = {
        client_id: commandeDraft.clientId,
        type_vente: typeVenteGlobal,
        tva_appliquee: commandeDraft.appliquerTVA ? true : false,
        items: commandeDraft.lignes.map((l) => ({
          produit_id: l.produitId,
          quantite: l.qte,
          prix_unitaire: l.prixUnitaire,
          mode_vente: l.modeVente,
        })),
      };

      const raw = await commandesAPI.create(payload);


      const response =
        raw?.data?.data ??
        raw?.data ??
        raw;

      let normalized;

      if (response && typeof response === "object") {
        normalized = normalizeCommande(response);

        if (!normalized.clientNom && commandeDraft.clientNom) {
          normalized = {
            ...normalized,
            clientId: commandeDraft.clientId,
            clientNom: commandeDraft.clientNom,
            clientCode: commandeDraft.clientCode,
          };
        }
      } else {
        normalized = {
          ...commandeDraft,
          id: Date.now(),
          numero: `CMD-TEMP-${Date.now()}`,
        };
      }

      setLastCreatedCommande({
        ...normalized,
        totalTTC:
          normalized.totalTTC !== undefined && normalized.totalTTC !== null
            ? Number(normalized.totalTTC)
            : Number(commandeDraft.totalTTC || 0),

        resteAPayer:
          normalized.totalTTC !== undefined && normalized.totalTTC !== null
            ? Number(normalized.totalTTC)
            : Number(commandeDraft.totalTTC || 0),
        montantPaye: 0,
      });
      setShowTrancheModal(true);

      toast(
        "success",
        "Commande créée",
        `${normalized.clientNom || "Client"} — ${formatFCFA(normalized.totalTTC)}`
      );

      setPage(1);
      await fetchCommandes();

      // ✅ Highlight APRÈS que la liste soit rechargée
      setHighlightedId(normalized.id);

      setTimeout(() => {
        setHighlightedId(null);
      }, 2000);

    } catch (error) {
      logger.error("commandes.create", error);
      
      if (error.response?.status === 422 && error.response.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0]?.[0] || 
                          "Vérifiez les champs obligatoires.";
        toast("error", "Création impossible", firstError);
      } else {
        toast(
          "error",
          "Erreur",
          error.response?.data?.message || 
          "Impossible de créer cette commande pour le moment."
        );
      }
    }
  };

  const badgeStatut = (statut) => {
    switch (statut) {
      case "attente":
        return "bg-gray-100 text-gray-700 border border-gray-300";
      case "partiellement_payee":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case "payee":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "annulee":
        return "bg-rose-100 text-rose-700 border-rose-300 border";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  // ✅ CORRECTION : plus de reset de période ici
  const handleChangeStatut = (s) => {
    setFilterStatut(s);
    setPage(1);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Commandes clients spéciaux — LPD Manager", 14, 16);
    doc.autoTable({
      startY: 24,
      head: [["N°", "Client", "Date", "Total TTC", "Payé", "Reste", "Statut"]],
      body: commandes.map((c) => [
        c.numero,
        c.clientNom,
        c.dateCommande,
        formatFCFA(c.totalTTC),
        formatFCFA(c.montantPaye),
        formatFCFA(Math.max(c.resteAPayer, 0)),
        c.statutLabel,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save(`Commandes_LPD_${todayISO()}.pdf`);
    toast("success", "Export PDF", "Fichier téléchargé avec succès.");
  };

  // reset page quand filtres changent
useEffect(() => {
  setPage(1);
}, [
  filterStatut,
  filterStartDate,
  filterEndDate,
  searchTerm,
  clientIdFromState,
]);

  useEffect(() => {
    if (filterStatut === "annulee") {
      toast(
        "info",
        "Commandes annulées",
        "Ces commandes ne sont plus actives. Elles sont affichées uniquement pour la traçabilité."
      );
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchCommandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    filterStatut,
    filterStartDate,
    filterEndDate,
    searchTerm,
    clientIdFromState,
  ]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-xs font-medium text-[#472EAD]">
            Chargement des commandes...
          </span>
        </div>
      </div>
    );

  return (
    <>
      <div className="w-full h-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-3 sm:px-4 lg:px-6 py-4 sm:py-5 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                  Module Commandes — Responsable
                </span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2F1F7A]">
                  {clientNameFromState
                    ? `Commandes de ${clientNameFromState}`
                    : "Commandes clients spéciaux"}
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
                  Création de commandes en gros, envoi à la caisse et suivi des
                  encaissements (acomptes / soldes).
                </p>
              </div>
              <p className="text-[11px] text-gray-400">
                {statsGlobales.nbCommandes} commande{statsGlobales.nbCommandes > 1 ? "s" : ""} ({statsGlobales.nbAnnulees} annulée{statsGlobales.nbAnnulees > 1 ? "s" : ""})
                enregistrée{statsGlobales.nbCommandes > 1 ? "s" : ""}.
              </p>
            </div>
          </motion.header>

          {/* CARTES STATS GLOBALES */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 mb-8"
          >
            <div className="rounded-xl border border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 px-3 py-2.5 shadow-sm">
              <div className="text-[15px] font-semibold text-yellow-800 mb-0.5">
                Nombre de commandes
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-yellow-700">
                  {statsGlobales.nbCommandes}
                </span>
                <BadgeDollarSign className="w-5 h-5 text-yellow-600" />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Total TTC global
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-lg font-extrabold text-emerald-700">
                  {formatFCFA(statsGlobales.totalTTC)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Montant payé (caisse)
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-lg font-extrabold text-emerald-700">
                  {formatFCFA(statsGlobales.totalPaye)}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Dette globale (reste)
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-lg font-extrabold text-rose-700">
                  {formatFCFA(statsGlobales.detteTotale)}
                </span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </motion.div>

          {/* FORMULAIRE DE CRÉATION */}
          <CommandeForm
            clientInitial={clientIdFromState || ""}
            onCreate={handleCreateCommande}
            toast={toast}
          />

          {/* TABLE DES COMMANDES + FILTRES/RECHERCHE/PAGINATION */}
          <section className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] px-3 sm:px-4 py-4 sm:py-5 space-y-4 mt-8">
            
            {/* FILTRES + RECHERCHE */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {/* Filtre statut (pills) */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-500 font-medium">Filtrer par statut :</span>
                  <div className="inline-flex rounded-full bg-[#F7F5FF] border border-[#E4E0FF] p-0.5">
                    {[
                      { id: "tous", label: "Tous" },
                      { id: "attente", label: "En attentes" },
                      { id: "partiellement_payee", label: "Partiellement payées" },
                      { id: "payee", label: "Totalement payées" },
                      { id: "annulee", label: "Annulées" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChangeStatut(opt.id)}
                        className={cls(
                          "px-3 py-1 rounded-full transition",
                          filterStatut === opt.id
                            ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Période */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-medium">Période :</span>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
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
                </div>
              </div>

              {/* ✅ RECHERCHE INSTANTANÉE (plus de debounce) */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une commande (numéro commande ou nom client)"
                  value={searchInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchInput(value);
                    setSearchTerm(value.trim());
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    title="Effacer"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {/* Résumé affichage */}
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  Affichage :{" "}
                  <span className="font-semibold">{commandes.length}</span> sur{" "}
                  <span className="font-semibold">{total}</span>
                </span>
                <span>
                  Page <span className="font-semibold">{page}</span> /{" "}
                  <span className="font-semibold">{lastPage}</span>
                </span>
              </div>
            </div>

            {/* TABLEAU AVEC LOADER DE SURCOUCHE */}
            <div className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white mt-2">
              {loadingPage && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-[#472EAD] text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </div>
                </div>
              )}
              <table className="min-w-full text-sm">
                <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">N° commande</th>
                    <th className="px-4 py-3 text-left">Client Spécial</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Total TTC</th>
                    <th className="px-4 py-3 text-right">Payé (caisse)</th>
                    <th className="px-4 py-3 text-right">Reste</th>
                    <th className="px-4 py-3 text-left">Statut caisse</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.length ? (
                    commandes.map((c) => (
                        <motion.tr
                          key={c.id}
                          initial={false}
                          animate={
                            highlightedId === c.id
                              ? {
                                  backgroundColor: "#EDE9FE",
                                }
                              : {
                                  backgroundColor: "#FFFFFF",
                                }
                          }
                          transition={{ duration: 0.4 }}
                          className="border-b border-gray-100 hover:bg-[#F9F9FF]"
                        >
                        <td className="px-4 py-3 font-medium">{c.numero}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium text-gray-800">
                              {c.clientPrenom && c.clientNomSeul
                                ? `${c.clientPrenom} ${c.clientNomSeul}`
                                : c.clientNom || "—"}
                            </span>

                            {c.clientEntreprise && (
                              <span className="text-[11px] text-gray-400 truncate max-w-[180px]">
                                {c.clientEntreprise}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{c.dateCommande}</td>
                        <td className="px-4 py-3 text-right">
                          {formatFCFA(c.totalTTC)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.statut === "attente" ? (
                            <div className="flex flex-col items-end">
                              <span className="text-gray-400 text-xs">
                                {formatFCFA(0)}
                              </span>
                              <span className="text-amber-600 text-xs font-semibold">
                                À encaisser : {formatFCFA(c.totalTTC)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-600">
                              {formatFCFA(c.montantPaye)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600">
                          {formatFCFA(Math.max(c.resteAPayer, 0))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cls(
                              "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                              badgeStatut(c.statut)
                            )}
                          >
                            {c.statutLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedCommande(c);
                                setOpenFacture(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]"
                              title="Voir le détail"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-400 py-6 text-sm">
                        {total > 0
                          ? "Aucune commande ne correspond aux filtres."
                          : "Aucune commande enregistrée."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={lastPage}
                onPageChange={(p) => {
                  if (p >= 1 && p <= lastPage) {
                    setPage(p);
                  }
                }}
              />
            </div>
          </section>

          {/* MODAL DÉTAIL / FACTURE */}
          <FactureModal
            open={openFacture}
            onClose={() => setOpenFacture(false)}
            commande={selectedCommande}
          />

          {/* MODAL QR CODE COMMANDE */}
          <QrCommandeModal
            open={showQrModal}
            onClose={() => setShowQrModal(false)}
            commande={lastCreatedCommande}
            qrPayload={qrPayload}
          />
          
          <NouvelleTrancheModal
            open={showTrancheModal}
            onClose={() => setShowTrancheModal(false)}
            lockedCommande={lastCreatedCommande}
            toast={toast}
            onSubmit={async (commande, paiement, done) => {
              try {
                  await commandesAPI.sendTranche(commande.id, {
                    montant: paiement,
                  });

                const fresh = await commandesAPI.getById(commande.id);
                const normalized = normalizeCommande(
                  fresh?.data?.data ?? fresh?.data ?? fresh
                );

                setLastCreatedCommande({
                  ...normalized,
                  montantTranche: paiement,
                });

                setShowTrancheModal(false);
                setShowQrModal(true);
                toast(
                  "success",
                  "Commande envoyée à la caisse",
                  `Commande #${normalized.numero} prête pour encaissement`
                );
                
                await fetchCommandes();

                done();
              } catch (e) {
                done();
                toast("error", "Erreur paiement", "Impossible d'enregistrer la tranche.");
              }
            }}
          />

          {/* TOASTS */}
          <Toasts toasts={toasts} remove={removeToast} />
        </div>
      </div>
    </>
  );
}
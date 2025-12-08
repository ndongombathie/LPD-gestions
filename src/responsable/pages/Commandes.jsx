// ==========================================================
// 🛒 Commandes.jsx — Interface Responsable (LPD Manager)
// Branché sur l’API Laravel (clients, produits, commandes)
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
  X,
  Receipt,
  Eye,
  Search,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useLocation } from "react-router-dom";
import { instance as axios } from "../../utils/axios.jsx";

// === Utils ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);
const cls = (...a) => a.filter(Boolean).join(" ");

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
// 🔎 Modal de recherche (Clients / Produits)
// ==========================================================
function SearchModal({
  open,
  title,
  items,
  onClose,
  onSelect,
  getLabel,
  getSubLabel,
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;

  const lower = query.toLowerCase();
  const filtered = items.filter((item) => {
    const label = (getLabel(item) || "").toLowerCase();
    const sub = (getSubLabel?.(item) || "").toLowerCase();
    return label.includes(lower) || sub.includes(lower);
  });

  return (
    <div className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm flex items-center justify-center px-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#472EAD] flex items-center gap-2">
            <Search className="w-4 h-4" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 rounded-full p-1 hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Résultats :{" "}
            <span className="font-semibold">{filtered.length}</span>
          </div>
        </div>

        {/* Liste des résultats */}
        <div className="flex-1 overflow-auto">
          {filtered.length ? (
            <ul className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className="px-4 py-3 hover:bg-[#F7F5FF] cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {getLabel(item)}
                    </div>
                    {getSubLabel && (
                      <div className="text-[11px] text-gray-500">
                        {getSubLabel(item)}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-[#F7F5FF] text-[#472EAD] border border-[#E4E0FF]">
                    Sélectionner
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 py-8">
              Aucun résultat trouvé. Affinez votre recherche.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t text-right">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            Fermer
          </button>
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
            <div className="font-semibold text-sm">{commande.clientNom}</div>
            {commande.clientCode && (
              <div className="text-xs text-gray-500">
                Code : {commande.clientCode}
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
              <span className="text-gray-600">
                TVA ({tauxTVAPourcent}%)
              </span>
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
// 🧩 Formulaire Commande (multi-lignes produits + branché sur API refs)
// ======================================================================
function CommandeForm({ clientInitial, onCreate, toast }) {
  // Clients spéciaux & catalogue produits depuis l’API
  const [clients, setClients] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [clientId, setClientId] = useState(clientInitial || "");
  const [dateCommande] = useState(todayISO());

  // TVA activée ou non
  const [applyTVA, setApplyTVA] = useState(true);

  // Modals de recherche
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openProduitSearch, setOpenProduitSearch] = useState(false);

  // Champ de saisie "ligne en cours"
  const [ligneProduitId, setLigneProduitId] = useState("");
  const [ligneLibelle, setLigneLibelle] = useState("");
  const [ligneQte, setLigneQte] = useState("");
  const [lignePrix, setLignePrix] = useState("");
  const [ligneMode, setLigneMode] = useState("gros"); // "detail" | "gros" (défaut : gros)

  // Scan code-barres (scanner ou saisie manuelle)
  const [scanCode, setScanCode] = useState("");
  const qteInputRef = useRef(null);

  // Lignes de la commande
  const [lignes, setLignes] = useState([]);

  const produitSelectionne = useMemo(
    () =>
      catalogue.find((p) => String(p.id) === String(ligneProduitId)) || null,
    [catalogue, ligneProduitId]
  );

  // 🔗 Charger clients spéciaux + produits
  useEffect(() => {
    const loadRefs = async () => {
      try {
        setLoadingRefs(true);

        const [clientsRes, produitsRes] = await Promise.all([
          axios.get("/clients", { params: { type_client: "special" } }),
          axios.get("/produits"),
        ]);

        const clientsPayload = Array.isArray(clientsRes.data?.data)
          ? clientsRes.data.data
          : clientsRes.data;

        const produitsPayload = Array.isArray(produitsRes.data?.data)
          ? produitsRes.data.data
          : produitsRes.data;

        const normalizedClients = (clientsPayload || []).map((c) => ({
          id: c.id,
          nom: c.nom || c.razon_social || "",
          code:
            c.code_client ||
            c.code ||
            (c.id ? `CL-${String(c.id).padStart(3, "0")}` : ""),
        }));

        const normalizedProduits = (produitsPayload || []).map((p) => {
          const prixDetail = Number(
            p.prix_basique_detail ??
              p.prix_vente ??
              p.prix_unitaire ??
              p.prix ??
              0
          );
          const prixGros = Number(
            p.prix_basique_gros ??
              p.prix_gros ??
              p.prix_unitaire ??
              p.prix ??
              0
          );

          return {
            id: p.id,
            ref:
              p.code_barre ||
              p.code_produit ||
              p.reference ||
              p.ref ||
              null,
            codeBarre:
              p.code_barre || p.code_produit || p.code || p.barcode || null,
            libelle:
              p.nom ||
              p.nom_produit ||
              p.libelle ||
              p.designation ||
              "",
            prixDetail,
            prixGros,
            prix: prixDetail || prixGros || 0,
            prixSeuilDetail:
              p.prix_seuil_detail != null ? Number(p.prix_seuil_detail) : null,
            prixSeuilGros:
              p.prix_seuil_gros != null ? Number(p.prix_seuil_gros) : null,
            unitesParCarton: Number(p.unites_par_carton ?? 1),
            stockGlobal: Number(p.stock_global ?? 0),
            nombreCartons: Number(p.nombre_cartons ?? 0),
          };
        });

        setClients(normalizedClients);
        setCatalogue(normalizedProduits);
      } catch (error) {
        console.error("Erreur chargement références:", error);
        toast(
          "error",
          "Erreur de chargement",
          "Impossible de charger les clients ou les produits."
        );
      } finally {
        setLoadingRefs(false);
      }
    };

    loadRefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientActuel = useMemo(
    () => clients.find((c) => String(c.id) === String(clientId)) || null,
    [clientId, clients]
  );

  const totalHT = useMemo(
    () => lignes.reduce((sum, l) => sum + Number(l.totalHT || 0), 0),
    [lignes]
  );
  const totalTVA = useMemo(
    () => (applyTVA ? totalHT * 0.18 : 0),
    [totalHT, applyTVA]
  );
  const totalTTC = useMemo(() => totalHT + totalTVA, [totalHT, totalTVA]);

  const resetLigne = () => {
    setLigneProduitId("");
    setLigneLibelle("");
    setLigneQte("");
    setLignePrix("");
  };

  const baseInput =
    "w-full rounded-xl border px-3 py-2 text-sm bg-white shadow-sm border-gray-300 focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]";

  const handleChangeMode = (mode) => {
    setLigneMode(mode);
    const p = produitSelectionne;
    if (!p) return;

    if (mode === "detail" && p.prixDetail) {
      setLignePrix(String(p.prixDetail));
    } else if (mode === "gros" && p.prixGros) {
      setLignePrix(String(p.prixGros));
    }
  };

  // 🔍 Scan code-barres (scanner ou saisie clavier)
  const handleScanBarcode = (e) => {
    if (e) e.preventDefault();
    const value = (scanCode || "").trim();
    if (!value) return;

    const produit = catalogue.find((p) => {
      const ref = (p.ref || "").toString().trim();
      const code = (p.codeBarre || "").toString().trim();
      return ref === value || code === value;
    });

    if (!produit) {
      toast(
        "error",
        "Produit introuvable",
        "Aucun produit ne correspond à ce code-barres."
      );
      return;
    }

    setLigneProduitId(produit.id);
    setLigneLibelle(produit.libelle);

    const prixPropose =
      ligneMode === "gros"
        ? produit.prixGros || produit.prixDetail || produit.prix || 0
        : produit.prixDetail || produit.prixGros || produit.prix || 0;

    setLignePrix(String(prixPropose || 0));
    setScanCode("");

    // Focus sur la quantité pour enchaîner rapidement
    if (qteInputRef.current) {
      qteInputRef.current.focus();
    }
  };

  const handleAddLigne = () => {
    if (!ligneLibelle.trim() || !ligneQte || !lignePrix) {
      toast(
        "error",
        "Ligne incomplète",
        "Veuillez renseigner produit, quantité et prix."
      );
      return;
    }

    const qteNum = Number(ligneQte);
    const prixNum = Number(lignePrix);

    if (qteNum <= 0 || prixNum <= 0) {
      toast(
        "error",
        "Valeurs invalides",
        "La quantité et le prix doivent être positifs."
      );
      return;
    }

    const p = produitSelectionne;
    if (p) {
      const unitsPerCarton = p.unitesParCarton || 1;
      const stockGlobal = p.stockGlobal ?? null;
      const nbCartons =
        p.nombreCartons ??
        (stockGlobal != null ? Math.floor(stockGlobal / unitsPerCarton) : null);

      // Détail : stock en unités
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

      // Gros : stock en cartons
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

    const unitsPerCarton = produitSelectionne?.unitesParCarton || 1;
    const quantiteUnites =
      ligneMode === "gros" ? qteNum * unitsPerCarton : qteNum;

    const totalHTLigne = qteNum * prixNum;
    const totalTTCLigne = applyTVA ? totalHTLigne * 1.18 : totalHTLigne;

    const ref = produitSelectionne?.ref || null;

    const nouvelle = {
      id: Date.now(),
      produitId: ligneProduitId || null,
      libelle: ligneLibelle.trim(),
      ref,
      qte: qteNum,
      prixUnitaire: prixNum,
      totalHT: totalHTLigne,
      totalTTC: totalTTCLigne,
      modeVente: ligneMode, // "detail" | "gros"
      quantiteUnites,
    };

    setLignes((prev) => [...prev, nouvelle]);
    resetLigne();
  };

  const handleRemoveLigne = (id) =>
    setLignes((prev) => prev.filter((l) => l.id !== id));

  const handleSelectProduitFromModal = (p) => {
    setLigneProduitId(p.id);
    setLigneLibelle(p.libelle);

    const prixPropose =
      ligneMode === "gros"
        ? p.prixGros || p.prixDetail || p.prix || 0
        : p.prixDetail || p.prixGros || p.prix || 0;

    setLignePrix(String(prixPropose));
  };

  // ✅ Soumission du formulaire : on construit un brouillon et on délègue au parent
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!clientActuel) {
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

    const commandeDraft = {
      clientId,
      clientNom: clientActuel.nom,
      clientCode: clientActuel.code,
      dateCommande,
      appliquerTVA: applyTVA,
      totalHT,
      totalTVA,
      totalTTC,
      lignes,
    };

    onCreate(commandeDraft);

    // Option : reset formulaire
    setLignes([]);
    setLigneProduitId("");
    setLigneLibelle("");
    setLigneQte("");
    setLignePrix("");
    setLigneMode("gros");
    setScanCode("");
  };

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] px-3 sm:px-4 py-3 sm:py-4 space-y-4"
      >
        <h2 className="text-lg font-semibold text-[#472EAD] mb-1 flex items-center gap-2">
          <PlusCircle size={18} /> Nouvelle commande client spécial
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          Préparez la commande en gros ici. Elle sera ensuite{" "}
          <span className="font-semibold text-[#472EAD]">
            envoyée à la caisse
          </span>{" "}
          pour encaissement (acomptes / soldes).
        </p>

        {/* Ligne client + date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">
              Client spécial
            </label>
            <button
              type="button"
              onClick={() => setOpenClientSearch(true)}
              className={cls(
                "w-full px-3 py-2 text-sm rounded-xl flex items-center justify-between border bg-white shadow-sm",
                clientActuel
                  ? "border-gray-300"
                  : "border-dashed border-gray-300 bg-gray-50 text-gray-500"
              )}
              disabled={loadingRefs}
            >
              <span>
                {loadingRefs
                  ? "Chargement des clients..."
                  : clientActuel
                  ? clientActuel.nom
                  : "Rechercher un client spécial..."}
              </span>
              <Search className="w-4 h-4 text-gray-400" />
            </button>
            {clientActuel && (
              <div className="mt-1 text-[11px] text-gray-500">
                Code client :{" "}
                <span className="font-semibold">{clientActuel.code}</span>
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
        <div className="border border-[#E4E0FF] rounded-xl p-4 bg-[#F9FAFF] space-y-3">
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

            {produitSelectionne && (
              <div className="text-[11px] text-gray-600 space-y-0.5">
                <div>
                  Stock :{" "}
                    <span className="font-semibold">
                      {produitSelectionne.stockGlobal} unité(s)
                    </span>{" "}
                    —{" "}
                    <span className="font-semibold">
                      {produitSelectionne.nombreCartons} carton(s)
                    </span>
                </div>
                <div>
                  Prix ref. détail :{" "}
                  <span className="font-semibold">
                    {formatFCFA(produitSelectionne.prixDetail || 0)}
                  </span>{" "}
                  | gros :{" "}
                  <span className="font-semibold">
                    {formatFCFA(produitSelectionne.prixGros || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mt-2">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Produit
              </label>
              <button
                type="button"
                onClick={() => setOpenProduitSearch(true)}
                className={cls(
                  "w-full px-3 py-2 text-sm rounded-xl flex items-center justify-between border bg-white shadow-sm mb-2",
                  ligneLibelle
                    ? "border-gray-300"
                    : "border-dashed border-gray-300 bg-gray-50 text-gray-500"
                )}
                disabled={loadingRefs}
              >
                <span>
                  {loadingRefs
                    ? "Chargement du catalogue..."
                    : ligneLibelle ||
                      "Rechercher un produit dans le catalogue..."}
                </span>
                <Search className="w-4 h-4 text-gray-400" />
              </button>

              <input
                type="text"
                placeholder="Ou saisir manuellement le libellé du produit"
                value={ligneLibelle}
                onChange={(e) => setLigneLibelle(e.target.value)}
                className={baseInput}
              />

              {/* Scan code-barres */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Scan code-barres (facultatif)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "NumpadEnter") {
                        handleScanBarcode(e);
                      }
                    }}
                    placeholder="Placez le curseur ici et scannez, ou tapez le code puis Entrée"
                    className={baseInput}
                  />
                  <button
                    type="button"
                    onClick={handleScanBarcode}
                    className="px-3 py-2 rounded-xl border border-[#472EAD] text-xs text-[#472EAD] bg-white hover:bg-[#F7F5FF] shadow-sm"
                  >
                    Scanner
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-gray-500">
                  Compatible lecteur code-barres et saisie manuelle (chiffres
                  tapés au clavier).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Quantité{" "}
                {ligneMode === "gros"
                  ? "(cartons/boîtes)"
                  : "(unités)"}
              </label>
              <input
                ref={qteInputRef}
                type="number"
                min="1"
                value={ligneQte}
                onChange={(e) => setLigneQte(e.target.value)}
                className={baseInput}
                placeholder={
                  ligneMode === "gros" ? "Ex: 3 cartons" : "Ex: 24 unités"
                }
              />
              {ligneMode === "gros" &&
                produitSelectionne &&
                produitSelectionne.unitesParCarton && (
                  <div className="mt-1 text-[10px] text-gray-500">
                    1 carton = {produitSelectionne.unitesParCarton} unité(s)
                  </div>
                )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Prix unitaire (libre)
              </label>
              <input
                type="number"
                min="0"
                value={lignePrix}
                onChange={(e) => setLignePrix(e.target.value)}
                className={baseInput}
                placeholder="Ex: 12000"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleAddLigne}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#472EAD] text-white rounded-lg shadow-md hover:bg-[#5A3CF5] hover:shadow-lg text-xs sm:text-sm transition"
            >
              Ajouter à la commande
            </button>
          </div>
        </div>

        {/* Tableau des lignes de la commande */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
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
                lignes.map((l) => (
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
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLigne(l.id)}
                        className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                        title="Retirer la ligne"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-gray-400 text-xs"
                  >
                    Aucune ligne ajoutée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux + bouton envoyer à la caisse */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                <span className="text-gray-600">
                  TVA ({applyTVA ? "18" : "0"}%)
                </span>
                <span className="font-semibold">{formatFCFA(totalTVA)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-semibold text-[#472EAD]">
                  Total TTC
                </span>
                <span className="font-bold text-[#472EAD]">
                  {formatFCFA(totalTTC)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] text-white text-sm font-semibold hover:opacity-95 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!clientActuel || !lignes.length}
            >
              Envoyer à la caisse
            </button>
          </div>
        </div>
      </motion.form>

      {/* MODALS DE RECHERCHE */}
      <SearchModal
        open={openClientSearch}
        onClose={() => setOpenClientSearch(false)}
        title="Rechercher un client spécial"
        items={clients}
        onSelect={(client) => setClientId(client.id)}
        getLabel={(c) => c.nom}
        getSubLabel={(c) => c.code}
      />

      <SearchModal
        open={openProduitSearch}
        onClose={() => setOpenProduitSearch(false)}
        title="Rechercher un produit"
        items={catalogue}
        onSelect={handleSelectProduitFromModal}
        getLabel={(p) => p.libelle}
        getSubLabel={(p) =>
          `${p.ref || "—"} • Détail: ${formatFCFA(
            p.prixDetail
          )} • Gros: ${p.prixGros ? formatFCFA(p.prixGros) : "--"}`
        }
      />
    </>
  );
}

// ======================================================================
// 🔧 Helper : normaliser une commande provenant du backend
// ======================================================================
function normalizeCommande(cmd) {
  // 1) Normaliser les infos client
  const client =
    cmd.client ||
    cmd.client_special ||
    cmd.clientSpecial ||
    cmd.client_speciale ||
    cmd.client_speciale_detail ||
    {};

  let clientNom =
    cmd.client_nom ||
    cmd.nom_client ||
    cmd.nom_client_special ||
    cmd.client_name ||
    cmd.customer_name ||
    client.nom ||
    client.nom_client ||
    client.nom_client_special ||
    client.raison_sociale ||
    client.raisonSociale ||
    client.name ||
    client.libelle ||
    client.intitule ||
    "";

  if (!clientNom && client && typeof client === "object") {
    const firstStringValue = Object.values(client).find(
      (v) => typeof v === "string" && v.trim() !== ""
    );
    if (firstStringValue) clientNom = firstStringValue;
  }

  const clientCode =
    cmd.client_code ||
    cmd.code_client ||
    client.code_client ||
    client.codeClient ||
    client.code ||
    cmd.code ||
    undefined;

  // 2) Normaliser les lignes
  const lignesSource =
    cmd.lignes || cmd.ligne_commandes || cmd.details || cmd.items || [];

  const lignes = (lignesSource || []).map((l) => {
    const qte = Number(l.quantite || l.qte || l.qty || 0);
    const pu = Number(l.prix_unitaire || l.prix || l.price || 0);
    const modeVente = l.mode_vente || l.modeVente || l.mode || "detail";

    const totalHTLigne = Number(
      l.total_ht || l.totalHT || (qte && pu ? qte * pu : 0)
    );
    const totalTTCLigne = Number(
      l.total_ttc || l.totalTTC || l.total || totalHTLigne * 1.18 || 0
    );

    const quantiteUnites = Number(
      l.quantite_unites ||
        l.quantiteUnites ||
        (modeVente === "gros"
          ? qte * (l.unites_par_carton || 1)
          : qte)
    );

    return {
      id: l.id,
      produitId: l.produit_id || l.produitId || null,
      libelle: l.libelle || l.nom_produit || l.designation || l.nom || "",
      ref: l.ref || l.code_produit || l.reference || l.code || null,
      qte,
      prixUnitaire: pu,
      totalHT: totalHTLigne,
      totalTTC: totalTTCLigne,
      modeVente,
      quantiteUnites,
    };
  });

  // 3) Totaux
  let totalHT = Number(
    cmd.total_ht ?? cmd.totalHT ?? cmd.montant_ht ?? 0
  );
  let totalTTC = Number(
    cmd.total_ttc ?? cmd.totalTTC ?? cmd.montant_total ?? cmd.total ?? 0
  );

  if ((!totalHT || Number.isNaN(totalHT)) && lignes.length) {
    totalHT = lignes.reduce(
      (s, l) => s + (Number(l.totalHT) || l.qte * l.prixUnitaire || 0),
      0
    );
  }

  if ((!totalTTC || Number.isNaN(totalTTC)) && lignes.length) {
    totalTTC = lignes.reduce(
      (s, l) => s + (Number(l.totalTTC) || Number(l.totalHT) || 0),
      0
    );
  }

  let totalTVA = Number(
    cmd.total_tva ?? cmd.totalTVA ?? cmd.montant_tva ?? (totalTTC - totalHT)
  );
  if (Number.isNaN(totalTVA)) {
    totalTVA = totalTTC - totalHT;
  }

  // 4) Paiements
  const montantPaye = Number(
    cmd.montant_paye || cmd.montantPaye || cmd.total_paye || 0
  );
  const resteAPayer = Number(
    cmd.reste_a_payer ||
      cmd.resteAPayer ||
      cmd.montant_restant ||
      totalTTC - montantPaye
  );

  // 5) Statut
  const statut = cmd.statut || "en_attente_caisse";
  const statutLabelMap = {
    en_attente_caisse: "En attente caisse",
    partiellement_payee: "Partiellement payée",
    soldee: "Soldée",
    annulee: "Annulée",
  };
  const statutLabel =
    cmd.statut_label || cmd.statutLabel || statutLabelMap[statut] || statut;

  return {
    id: cmd.id,
    numero: cmd.numero || cmd.reference || cmd.code || `CMD-${cmd.id}`,
    clientId: cmd.client_id || cmd.clientId || client.id || null,
    clientNom,
    clientCode,
    dateCommande:
      cmd.date_commande ||
      cmd.dateCommande ||
      (cmd.created_at ? String(cmd.created_at).slice(0, 10) : todayISO()),
    lignes,
    totalHT,
    totalTVA,
    totalTTC,
    tauxTVA: totalHT ? totalTVA / totalHT : 0.18,
    paiements: (cmd.paiements || []).map((p) => ({
      id: p.id,
      date: p.date_paiement || p.date || null,
      montant: Number(p.montant || p.montant_paye || 0),
      mode: p.mode_paiement || p.mode || "",
      commentaire: p.commentaire || "",
    })),
    montantPaye,
    resteAPayer,
    statut,
    statutLabel,
  };
}

// ==========================================================
// 📦 Page Commandes (Responsable)
// ==========================================================
export default function Commandes() {
  const { state } = useLocation();

  // Quand on vient depuis ClientsSpeciaux :
  // navigate("/responsable/commandes", { state: { clientId, clientNom } })
  const clientIdFromState = state?.clientId || null;
  const clientNameFromState = state?.clientNom || state?.client || "";

  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [openFacture, setOpenFacture] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // map id client -> nom client pour compléter ce que le backend n’envoie pas
  const [clientsMap, setClientsMap] = useState({});

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // 🔗 Chargement des commandes depuis le backend
  const fetchCommandes = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/commandes");
      const payload = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data;

      const normalized = (payload || []).map(normalizeCommande);
      setCommandes(normalized);
    } catch (error) {
      console.error("Erreur chargement commandes :", error);
      toast(
        "error",
        "Erreur de chargement",
        "Impossible de charger les commandes clients spéciaux."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔗 Chargement des clients spéciaux pour retrouver les noms
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get("/clients", {
          params: { type_client: "special" },
        });

        const clientsPayload = Array.isArray(res.data?.data)
          ? res.data.data
          : res.data;

        const map = {};
        (clientsPayload || []).forEach((c) => {
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
        console.error("Erreur chargement clients spéciaux :", error);
      }
    };

    fetchClients();
  }, []);

  // Compléter les commandes sans nom dès qu’on a la map des clients
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

  // Stats globales
  const statsGlobales = useMemo(() => {
    const nb = commandes.length;
    const totalTTC = commandes.reduce((s, c) => s + (c.totalTTC || 0), 0);
    const totalPaye = commandes.reduce((s, c) => s + (c.montantPaye || 0), 0);
    const detteTotale = commandes.reduce(
      (s, c) => s + Math.max(c.resteAPayer || 0, 0),
      0
    );
    return { nbCommandes: nb, totalTTC, totalPaye, detteTotale };
  }, [commandes]);

  // ✅ Unique handleCreateCommande : envoi à la caisse
  const handleCreateCommande = async (commandeDraft) => {
    try {
      const payload = {
        client_id: commandeDraft.clientId,
        date_commande: commandeDraft.dateCommande,
        total_ht: commandeDraft.totalHT,
        total_tva: commandeDraft.totalTVA,
        total_ttc: commandeDraft.totalTTC,
        appliquer_tva: commandeDraft.appliquerTVA ? 1 : 0,
        statut: "en_attente_caisse",
        lignes: commandeDraft.lignes.map((l) => ({
          produit_id: l.produitId,
          libelle: l.libelle,
          quantite: l.qte,
          quantite_unites: l.quantiteUnites,
          mode_vente: l.modeVente,
          prix_unitaire: l.prixUnitaire,
          total_ht: l.totalHT,
          total_ttc: l.totalTTC,
        })),
      };

      const res = await axios.post("/commandes", payload);

      let raw = res.data;
      if (Array.isArray(res.data?.data)) {
        raw = res.data.data[0];
      } else if (res.data?.data && typeof res.data.data === "object") {
        raw = res.data.data;
      }

      let normalized;

      if (raw && !Array.isArray(raw)) {
        normalized = normalizeCommande(raw);

        if (!normalized.clientNom && commandeDraft.clientNom) {
          normalized = {
            ...normalized,
            clientId: commandeDraft.clientId,
            clientNom: commandeDraft.clientNom,
            clientCode: commandeDraft.clientCode,
          };
        }
      } else {
        normalized = commandeDraft;
      }

      setCommandes((prev) => [normalized, ...prev]);

      toast(
        "success",
        "Commande envoyée à la caisse",
        `${normalized.clientNom || "Client"} — ${formatFCFA(
          normalized.totalTTC
        )}`
      );
    } catch (error) {
      console.error("Erreur création commande :", error);
      if (error.response?.status === 422 && error.response.data?.errors) {
        const firstError =
          Object.values(error.response.data.errors)[0]?.[0] ||
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
      case "en_attente_caisse":
        return "bg-gray-100 text-gray-700 border border-gray-300";
      case "partiellement_payee":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case "soldee":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      case "annulee":
        return "bg-rose-100 text-rose-700 border-rose-300 border";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const handleAnnuler = async (commande) => {
    if (commande.montantPaye > 0) {
      toast(
        "error",
        "Annulation impossible",
        "Cette commande a déjà des paiements enregistrés en caisse."
      );
      return;
    }

    try {
      await axios.post(`/commandes/${commande.id}/annuler`);

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
      console.error("Erreur annulation commande :", error);
      toast(
        "error",
        "Erreur",
        "Impossible d'annuler cette commande pour le moment."
      );
    }
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

  const commandesFiltrees = useMemo(() => {
    let list = commandes;

    if (clientIdFromState) {
      list = list.filter(
        (c) => String(c.clientId) === String(clientIdFromState)
      );
    } else if (clientNameFromState) {
      list = list.filter((c) => c.clientNom === clientNameFromState);
    }

    const q = (searchTerm || "").toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.numero.toLowerCase().includes(q) ||
          (c.clientNom || "").toLowerCase().includes(q) ||
          c.statutLabel.toLowerCase().includes(q)
      );
    }

    return list;
  }, [commandes, clientIdFromState, clientNameFromState, searchTerm]);

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
        <div className="max-w-6xl mx-auto space-y-5">
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
                {statsGlobales.nbCommandes} commande
                {statsGlobales.nbCommandes > 1 && "s"} enregistrée
                {statsGlobales.nbCommandes > 1 && "s"}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={exportPDF}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileDown size={16} />
                Exporter en PDF
              </button>
              <button
                onClick={fetchCommandes}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
            </div>
          </motion.header>

          {/* CARTES STATS GLOBALES */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <div className="rounded-xl border bg-amber-50 border-amber-200 px-3 py-2.5">
              <div className="text-[15px] text-rose-700 mb-0.5">
                Nombre de commandes
              </div>
              <div className="text-lg font-bold text-rose-700">
                {statsGlobales.nbCommandes}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Total TTC global
              </div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-700 truncate">
                {formatFCFA(statsGlobales.totalTTC)}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Montant payé (caisse)
              </div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-700 truncate">
                {formatFCFA(statsGlobales.totalPaye)}
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <div className="text-[15px] text-gray-500 mb-0.5">
                Dette globale
              </div>
              <div className="text-xs sm:text-sm font-semibold text-rose-700 truncate">
                {formatFCFA(statsGlobales.detteTotale)}
              </div>
            </div>
          </motion.div>

          {/* FORMULAIRE DE CRÉATION */}
          <CommandeForm
            clientInitial={clientIdFromState || ""}
            onCreate={handleCreateCommande}
            toast={toast}
          />

          {/* TABLE DES COMMANDES + RECHERCHE */}
          <section className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] px-3 sm:px-4 py-3 sm:py-4 space-y-3">
            {/* RECHERCHE */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une commande par numéro, client ou statut..."
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
              />
            </div>

            {/* TABLEAU */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">N° commande</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Total TTC</th>
                    <th className="px-4 py-3 text-right">Payé (caisse)</th>
                    <th className="px-4 py-3 text-right">Reste</th>
                    <th className="px-4 py-3 text-left">Statut caisse</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commandesFiltrees.length ? (
                    commandesFiltrees.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-gray-100 hover:bg-[#F9F9FF]"
                      >
                        <td className="px-4 py-3 font-medium">{c.numero}</td>
                        <td className="px-4 py-3">{c.clientNom}</td>
                        <td className="px-4 py-3">{c.dateCommande}</td>
                        <td className="px-4 py-3 text-right">
                          {formatFCFA(c.totalTTC)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          {formatFCFA(c.montantPaye)}
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
                            {c.statut === "en_attente_caisse" && (
                              <button
                                onClick={() => handleAnnuler(c)}
                                className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                                title="Annuler la commande"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center text-gray-400 py-6 text-sm"
                      >
                        Aucune commande enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* MODAL DÉTAIL / FACTURE */}
          <FactureModal
            open={openFacture}
            onClose={() => setOpenFacture(false)}
            commande={selectedCommande}
          />

          {/* TOASTS */}
          <Toasts toasts={toasts} remove={removeToast} />
        </div>
      </div>
    </>
  );
}

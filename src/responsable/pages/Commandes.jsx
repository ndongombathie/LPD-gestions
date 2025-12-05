// ==========================================================
// 🛒 Commandes.jsx — Interface Responsable (LPD Manager)
// Commandes Clients Spéciaux → Envoi à la Caisse
// - Prix libres (même sous le seuil)
// - Calcul automatique HT / TVA / TTC (18% ou 0%)
// - Multi-lignes produits
// - Sélection Clients / Produits via Modal de recherche (Option B)
// - Statuts : en attente caisse / partiellement payée / soldée / annulée
// - Export PDF
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
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

  // Taux TVA dynamique (18% par défaut si non précisé)
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
                  <td className="px-3 py-2 text-right">{l.qte}</td>
                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.prixUnitaire)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.totalHT)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatFCFA(
                      typeof l.totalTTC === "number"
                        ? l.totalTTC
                        : l.totalHT * (1 + tauxTVA)
                    )}
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

// ==========================================================
// 🧩 Formulaire Commande (multi-lignes produits + recherche modal)
// ==========================================================
function CommandeForm({ clientInitial, onCreate, toast }) {
  // Clients simulés pour l’instant (mêmes IDs que ClientsSpeciaux)
  const [clients] = useState([
    { id: 1, nom: "DIOP Mamadou", code: "CL-DIOP-001" },
    { id: 2, nom: "SOW Aissatou", code: "CL-SOW-002" },
    { id: 3, nom: "NDIAYE Cheikh", code: "CL-NDI-003" },
  ]);

  // Produits simulés (pour l’instant en front)
  const [catalogue] = useState([
    { id: 101, ref: "LPD-CAR-001", libelle: "Carton cahiers 200p", prix: 1500 },
    { id: 102, ref: "LPD-STY-010", libelle: "Lot stylos premium", prix: 500 },
    { id: 103, ref: "LPD-CLS-025", libelle: "Classeur archives A4", prix: 2000 },
  ]);

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

  // Lignes de la commande
  const [lignes, setLignes] = useState([]);

  const clientActuel = useMemo(
    () => clients.find((c) => String(c.id) === String(clientId)) || null,
    [clientId, clients]
  );

  const totalHT = useMemo(
    () =>
      lignes.reduce(
        (sum, l) => sum + Number(l.qte || 0) * Number(l.prixUnitaire || 0),
        0
      ),
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

    const totalHTLigne = qteNum * prixNum;
    const totalTTCLigne = applyTVA ? totalHTLigne * 1.18 : totalHTLigne;

    const ref =
      catalogue.find((p) => String(p.id) === String(ligneProduitId))?.ref ||
      null;

    const nouvelle = {
      id: Date.now(),
      produitId: ligneProduitId || null,
      libelle: ligneLibelle.trim(),
      ref,
      qte: qteNum,
      prixUnitaire: prixNum,
      totalHT: totalHTLigne,
      totalTTC: totalTTCLigne,
    };

    setLignes((prev) => [...prev, nouvelle]);
    resetLigne();
  };

  const handleRemoveLigne = (id) =>
    setLignes((prev) => prev.filter((l) => l.id !== id));

  const handleSelectProduitFromModal = (p) => {
    setLigneProduitId(p.id);
    setLigneLibelle(p.libelle);
    setLignePrix(p.prix); // prix catalogue proposé, mais modifiable (libre)
  };

  const handleCreateCommande = (e) => {
    e.preventDefault();
    if (!clientActuel) {
      toast(
        "error",
        "Client manquant",
        "Veuillez sélectionner un client spécial."
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

    const tauxTVA = applyTVA ? 0.18 : 0;

    const commande = {
      id: Date.now(),
      numero: `CMD-${new Date().getFullYear()}-${Math.floor(
        Math.random() * 9000 + 1000
      )}`,
      clientId: clientActuel.id,
      clientNom: clientActuel.nom,
      clientCode: clientActuel.code,
      dateCommande,
      lignes,
      totalHT,
      totalTVA,
      totalTTC,
      tauxTVA,
      appliquerTVA: applyTVA,
      // Côté caisse : suivra les paiements réels (par tranches)
      paiements: [], // à remplir côté caisse
      montantPaye: 0,
      resteAPayer: totalTTC,
      statut: "en_attente_caisse",
      statutLabel: "En attente Caisse",
    };

    onCreate(commande);
    // reset
    setLignes([]);
  };

  return (
    <>
      <motion.form
        onSubmit={handleCreateCommande}
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
            >
              <span>
                {clientActuel
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
        <div className="border border-[#E4E0FF] rounded-xl p-4 bg-[#F9FAFF]">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
              >
                <span>
                  {ligneLibelle ||
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
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Quantité
              </label>
              <input
                type="number"
                min="1"
                value={ligneQte}
                onChange={(e) => setLigneQte(e.target.value)}
                className={baseInput}
                placeholder="Ex: 10"
              />
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
                placeholder="Ex: 1200"
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
                    colSpan={6}
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
        getSubLabel={(p) => `${p.ref} • ${formatFCFA(p.prix)}`}
      />
    </>
  );
}

// ==========================================================
// 📦 Page Commandes (Responsable)
// ==========================================================
export default function Commandes() {
  const { state } = useLocation();

  // Quand on vient depuis ClientsSpeciaux : navigate("/responsable/commandes", { state: { clientId, clientNom } })
  const clientIdFromState = state?.clientId || null;
  const clientNameFromState = state?.clientNom || state?.client || "";

  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [openFacture, setOpenFacture] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Simulation initiale de commandes (quand la caisse aura encaissé)
  useEffect(() => {
    const simulated = [
      {
        id: 1,
        numero: "CMD-2025-1001",
        clientId: 1,
        clientNom: "DIOP Mamadou",
        clientCode: "CL-DIOP-001",
        dateCommande: "2025-11-03",
        lignes: [
          {
            id: 11,
            libelle: "Carton cahiers 200p",
            ref: "LPD-CAR-001",
            qte: 20,
            prixUnitaire: 1200,
            totalHT: 24000,
            totalTTC: 24000 * 1.18,
          },
        ],
        totalHT: 24000,
        totalTVA: 24000 * 0.18,
        totalTTC: 24000 * 1.18,
        tauxTVA: 0.18,
        paiements: [],
        montantPaye: 30000,
        resteAPayer: 24000 * 1.18 - 30000,
        statut: "partiellement_payee",
        statutLabel: "Partiellement payée",
      },
      {
        id: 2,
        numero: "CMD-2025-1002",
        clientId: 2,
        clientNom: "SOW Aissatou",
        clientCode: "CL-SOW-002",
        dateCommande: "2025-11-02",
        lignes: [
          {
            id: 21,
            libelle: "Lot stylos premium",
            ref: "LPD-STY-010",
            qte: 50,
            prixUnitaire: 400,
            totalHT: 20000,
            totalTTC: 20000 * 1.18,
          },
        ],
        totalHT: 20000,
        totalTVA: 20000 * 0.18,
        totalTTC: 20000 * 1.18,
        tauxTVA: 0.18,
        paiements: [],
        montantPaye: 20000 * 1.18,
        resteAPayer: 0,
        statut: "soldee",
        statutLabel: "Soldée",
      },
    ];
    setTimeout(() => {
      setCommandes(simulated);
      setLoading(false);
    }, 500);
  }, []);

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

  // Quand le Responsable crée une commande
  const handleCreateCommande = (commande) => {
    setCommandes((prev) => [commande, ...prev]);
    toast(
      "success",
      "Commande envoyée à la caisse",
      `${commande.clientNom} — ${formatFCFA(commande.totalTTC)}`
    );
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
        return "bg-rose-100 text-rose-700 border border-rose-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const handleAnnuler = (commande) => {
    // Ici, côté backend, on vérifiera l'état des paiements avant d'autoriser
    if (commande.montantPaye > 0) {
      toast(
        "error",
        "Annulation impossible",
        "Cette commande a déjà des paiements enregistrés en caisse."
      );
      return;
    }

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

    const q = searchTerm.toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.numero.toLowerCase().includes(q) ||
          c.clientNom.toLowerCase().includes(q) ||
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


          </motion.header>

          {/* CARTES STATS GLOBALES */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <div className="rounded-xl border  bg-amber-50 border border-amber-200 px-3 py-2.5">
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
                value={searchTerm}
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

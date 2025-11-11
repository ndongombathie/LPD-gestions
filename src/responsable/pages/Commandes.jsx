// ==========================================================
// 🛒 Commandes.jsx — Interface Responsable (LPD Manager)
// Gestion des commandes clients spéciaux (paiements par tranches)
// Intègre PaiementModal + FactureModal + Toasts Premium
// ==========================================================

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useLocation } from "react-router-dom";
import PaiementModal from "../components/PaiementModal";
import FactureModal from "../components/FactureModal";

// === Utils ===
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(n || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);
const cls = (...a) => a.filter(Boolean).join(" ");

// ————————————————————————————————————————————
// ✅ Toasts Premium
// ————————————————————————————————————————————
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
              "min-w-[280px] max-w-[360px] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3",
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
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
              {t.message && <div className="text-xs mt-0.5 opacity-90">{t.message}</div>}
            </div>
            <button className="opacity-60 hover:opacity-100" onClick={() => remove(t.id)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ————————————————————————————————————————————
// 📦 Page Commandes
// ————————————————————————————————————————————
export default function Commandes() {
  const { state } = useLocation();
  const clientSelectionne = state?.client || "";
  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState([]);
  const [clients] = useState(["DIOP Mamadou", "SOW Aissatou", "NDIAYE Cheikh"]);
  const [form, setForm] = useState({
    client: clientSelectionne,
    montantTotal: "",
    montantPaye: "",
    statut: "En attente",
    date: todayISO(),
  });
  const [message, setMessage] = useState("");
  const [openPaiement, setOpenPaiement] = useState(false);
  const [openFacture, setOpenFacture] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ✅ Toasts
  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Chargement simulé
  useEffect(() => {
    const simulated = [
      { id: 1, client: "DIOP Mamadou", date: "2025-11-03", montantTotal: 80000, montantPaye: 30000, statut: "Partiellement payée" },
      { id: 2, client: "SOW Aissatou", date: "2025-11-02", montantTotal: 50000, montantPaye: 50000, statut: "Payée" },
      { id: 3, client: "NDIAYE Cheikh", date: "2025-11-01", montantTotal: 60000, montantPaye: 0, statut: "En attente" },
    ];
    setTimeout(() => {
      setCommandes(simulated);
      setLoading(false);
    }, 500);
  }, []);

  const updateField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Ajout commande
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.client || !form.montantTotal) {
      setMessage("Veuillez sélectionner un client et indiquer le montant total !");
      return;
    }
    const nouvelle = {
      id: Date.now(),
      client: form.client,
      date: form.date,
      montantTotal: parseFloat(form.montantTotal),
      montantPaye: parseFloat(form.montantPaye || 0),
      statut:
        parseFloat(form.montantPaye || 0) >= parseFloat(form.montantTotal)
          ? "Payée"
          : parseFloat(form.montantPaye || 0) === 0
          ? "En attente"
          : "Partiellement payée",
    };
    setCommandes((prev) => [nouvelle, ...prev]);
    toast("success", "Commande ajoutée", `${form.client} — ${formatFCFA(form.montantTotal)}`);
    setForm({
      client: clientSelectionne,
      montantTotal: "",
      montantPaye: "",
      statut: "En attente",
      date: todayISO(),
    });
    setMessage("");
  };

  // Suppression
  const handleDelete = (id) => {
    setCommandes((prev) => prev.filter((c) => c.id !== id));
    toast("success", "Commande supprimée", `Commande #${id} supprimée.`);
  };

  // Badge
  const badge = (statut) => {
    const map = {
      Payée: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      "Partiellement payée": "bg-amber-100 text-amber-700 border border-amber-300",
      "En attente": "bg-gray-100 text-gray-600 border border-gray-300",
      Annulée: "bg-rose-100 text-rose-700 border border-rose-300",
    };
    return map[statut] || "bg-gray-100 text-gray-700 border border-gray-300";
  };

  // Paiement cumulé
  const handlePaiementSave = (montant, methode, date) => {
    setCommandes((prev) =>
      prev.map((c) =>
        c.id === selectedCommande.id
          ? {
              ...c,
              montantPaye: c.montantPaye + montant,
              statut:
                c.montantPaye + montant >= c.montantTotal
                  ? "Payée"
                  : c.montantPaye + montant === 0
                  ? "En attente"
                  : "Partiellement payée",
            }
          : c
      )
    );
    toast("success", "Paiement ajouté", `${selectedCommande.client} — ${formatFCFA(montant)} (${methode})`);
    setSelectedCommande(null);
    setOpenPaiement(false);
  };

  // Export PDF (liste)
  const exportPDF = () => {
    const doc = new jsPDF();
    const titre = clientSelectionne
      ? `Commandes de ${clientSelectionne}`
      : "Liste des commandes — LPD Manager";
    doc.text(titre, 14, 16);
    doc.autoTable({
      startY: 24,
      head: [["Client", "Date", "Montant Total", "Payé", "Statut"]],
      body: commandes.map((c) => [
        c.client,
        c.date,
        formatFCFA(c.montantTotal),
        formatFCFA(c.montantPaye),
        c.statut,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save(`Commandes_${todayISO()}.pdf`);
  };

  // ————————————————————————————————————————————
  // Rendu principal
  // ————————————————————————————————————————————
  if (loading)
    return (
      <div className="flex items-center justify-center h-[70vh] text-[#472EAD]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Chargement des commandes...
      </div>
    );

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#472EAD]">
            {clientSelectionne ? `Commandes de ${clientSelectionne}` : "Commandes clients spéciaux"}
          </h1>
          <p className="text-sm text-gray-500">
            Gérer les ventes, paiements par tranches et suivi des clients privilégiés.
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-[#472EAD] text-white px-4 py-2 rounded-lg hover:scale-[1.02] transition"
        >
          <FileDown size={16} /> Export PDF
        </button>
      </div>

      {/* FORM */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-8"
      >
        <h2 className="text-lg font-semibold text-[#472EAD] mb-4 flex items-center gap-2">
          <PlusCircle size={18} /> Nouvelle commande
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Client spécial</label>
            <select
              value={form.client}
              onChange={(e) => updateField("client", e.target.value)}
              className="w-full border border-black rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Montant total (FCFA)</label>
            <input
              type="number"
              value={form.montantTotal}
              onChange={(e) => updateField("montantTotal", e.target.value)}
              className="w-full border border-black rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: 80000"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Montant payé (acompte)</label>
            <input
              type="number"
              value={form.montantPaye}
              onChange={(e) => updateField("montantPaye", e.target.value)}
              className="w-full border border-black rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: 30000"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">Date : {form.date}</div>
          <button
            type="submit"
            className="px-5 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#5A3CF5] transition"
          >
            Enregistrer
          </button>
        </div>
      </motion.form>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Montant total</th>
              <th className="px-4 py-3 text-left">Payé</th>
              <th className="px-4 py-3 text-left">Reste</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandes.length ? (
              commandes
                .filter((c) => (clientSelectionne ? c.client === clientSelectionne : true))
                .map((c) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-gray-100 hover:bg-[#F9F9FF]"
                  >
                    <td className="px-4 py-3 font-medium">{c.client}</td>
                    <td className="px-4 py-3">{c.date}</td>
                    <td className="px-4 py-3">{formatFCFA(c.montantTotal)}</td>
                    <td className="px-4 py-3 text-emerald-600">{formatFCFA(c.montantPaye)}</td>
                    <td className="px-4 py-3 text-rose-600">
                      {formatFCFA(c.montantTotal - c.montantPaye)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${badge(c.statut)}`}
                      >
                        {c.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCommande(c);
                            setOpenPaiement(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]"
                          title="Enregistrer paiement"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCommande(c);
                            setOpenFacture(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]"
                          title="Générer facture"
                        >
                          <Receipt size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                          title="Supprimer commande"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-400 py-6">
                  Aucune commande enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES */}
      <PaiementModal
        open={openPaiement}
        onClose={() => setOpenPaiement(false)}
        commande={selectedCommande}
        onSave={handlePaiementSave}
      />

      <FactureModal
        open={openFacture}
        onClose={() => setOpenFacture(false)}
        commande={selectedCommande}
      />

      {/* TOASTS */}
      <Toasts toasts={toasts} remove={removeToast} />
    </div>
  );
}

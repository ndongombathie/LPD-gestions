// ==========================================================
// 📦 Inventaire.jsx — Interface Responsable (LPD Manager)
// Version PRO harmonisée (Dashboard/Fournisseurs/Utilisateurs)
// KPI dynamiques + Toasts + Charts + Modale + Export PDF
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  PlusCircle,
  Scale,
  FileDown,
  PackageSearch,
  RefreshCw,
  Calendar,
  Package,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { instance } from "../../utils/axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

// === Components réutilisables ===
import KpiCard from "../components/KpiCard.jsx";
import FormModal from "../components/FormModal.jsx";

// ————————————————————————————————————————————————
// Utils / style
// ————————————————————————————————————————————————
const cls = (...a) => a.filter(Boolean).join(" ");
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(n || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);

// Couleurs charts
const COLORS = ["#472EAD", "#F58020", "#10B981", "#EF4444", "#3B82F6", "#F59E0B"];

// ————————————————————————————————————————————————
// ✅ Toasts (local au fichier pour éviter une dépendance)
// ————————————————————————————————————————————————
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

// ————————————————————————————————————————————————
// 💼 Modale de comptage / ajustement (FormModal)
// ————————————————————————————————————————————————
function AjustementModal({ open, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    produit: "",
    categorie: "",
    fournisseur: "",
    stockTheorique: "",
    stockReel: "",
    motif: "",
    prixUnitaire: "",
    date: todayISO(),
  });

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, date: todayISO() }));
  }, [open]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const ecart = useMemo(() => {
    const t = Number(form.stockTheorique || 0);
    const r = Number(form.stockReel || 0);
    return r - t;
  }, [form.stockTheorique, form.stockReel]);

  const valeurEcart = useMemo(() => {
    const e = Number(ecart || 0);
    const pu = Number(form.prixUnitaire || 0);
    return e * pu;
  }, [ecart, form.prixUnitaire]);

  return (
    <FormModal open={open} onClose={onClose} title="Nouveau comptage & ajustement">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ ...form, ecart, valeurEcart });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["Produit", "produit", "Ex: Cahier 200p", true],
            ["Catégorie", "categorie", "Ex: Papeterie", false],
            ["Fournisseur", "fournisseur", "Ex: SEN Distribution", false],
            ["Prix unitaire (XOF)", "prixUnitaire", "Ex: 1500", false, "number"],
            ["Stock théorique", "stockTheorique", "Ex: 300", true, "number"],
            ["Stock réel (comptage)", "stockReel", "Ex: 320", true, "number"],
          ].map(([label, key, ph, req, type]) => (
            <div key={key}>
              <label className="block text-sm font-medium">{label}</label>
              <input
                type={type || "text"}
                min={type === "number" ? "0" : undefined}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder={ph}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                required={req}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium">Date du comptage</label>
            <input
              type="date"
              max={todayISO()}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Motif / Observation</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex: Casse, vol, erreur de saisie…"
              value={form.motif}
              onChange={(e) => update("motif", e.target.value)}
            />
          </div>
        </div>

        {/* Résumé écart */}
        <div className="bg-[#F7F5FF] border border-[#E9E6FF] rounded-xl p-3 text-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#472EAD]" />
            <span>
              Écart :{" "}
              <b className={ecart === 0 ? "text-gray-700" : ecart > 0 ? "text-emerald-600" : "text-rose-600"}>
                {ecart > 0 ? `+${ecart}` : ecart}
              </b>
            </span>
          </div>
          <div>
            Valeur de l’écart :{" "}
            <b
              className={
                valeurEcart === 0 ? "text-gray-700" : valeurEcart > 0 ? "text-emerald-600" : "text-rose-600"
              }
            >
              {formatFCFA(valeurEcart)}
            </b>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cls(
              "px-4 py-2 text-sm text-white rounded-lg bg-[#472EAD] hover:bg-[#3d26a5]",
              submitting && "opacity-70 cursor-not-allowed"
            )}
          >
            {submitting ? "Enregistrement…" : "Enregistrer l’ajustement"}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

// ————————————————————————————————————————————————
// 📊 Page principale Inventaire
// ————————————————————————————————————————————————
export default function Inventaire() {
  // Filtres
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());
  const [cat, setCat] = useState("Toutes");
  const [fourn, setFourn] = useState("Tous");

  // Données
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openAjust, setOpenAjust] = useState(false);
  const [toasts, setToasts] = useState([]);

  // KPI + tableaux + charts
  const [stats, setStats] = useState({
    stockTheo: 0,
    stockReel: 0,
    totalEcarts: 0,
    valeurEcarts: 0,
  });

  const [ajustements, setAjustements] = useState([]); // journal des ajustements
  const [ecartsParCategorie, setEcartsParCategorie] = useState([]); // chart bar
  const [repartitionPosNeg, setRepartitionPosNeg] = useState([]); // chart pie
  const [evolutionValeur, setEvolutionValeur] = useState([]); // chart area

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // ————————————————————————
  // Chargement (simulation + hooks API prêts)
  // ————————————————————————
  const loadData = async () => {
    try {
      setLoading(true);

      // 🔗 Quand le backend est prêt, décommente et ajuste :
      // const { data: kpi } = await instance.get("/inventaire/kpi", { params: { from: dateDebut, to: dateFin, cat, fourn }});
      // const { data: aj }  = await instance.get("/inventaire/ajustements", { params: { from: dateDebut, to: dateFin, cat, fourn }});
      // const { data: ec }  = await instance.get("/inventaire/ecarts-par-categorie", { params: { from: dateDebut, to: dateFin }});
      // const { data: rep } = await instance.get("/inventaire/repartition-ecarts", { params: { from: dateDebut, to: dateFin }});
      // const { data: evo } = await instance.get("/inventaire/evolution-valeur-ecarts", { params: { from: dateDebut, to: dateFin }});

      // ——— Simulation locale pour démo UI ———
      const kpi = { stockTheo: 12470, stockReel: 12310, totalEcarts: -160, valeurEcarts: -125000 };
      const aj = [
        {
          id: 1,
          date: "2025-10-06",
          produit: "Cahier 200p",
          categorie: "Papeterie",
          fournisseur: "SEN Distribution",
          theorique: 320,
          reel: 300,
          ecart: -20,
          valeur: -14000,
          motif: "Casse",
          user: "Responsable",
        },
        {
          id: 2,
          date: "2025-10-08",
          produit: "Stylo bleu x50",
          categorie: "Fournitures",
          fournisseur: "Fournil Office",
          theorique: 120,
          reel: 140,
          ecart: +20,
          valeur: +3000,
          motif: "Erreur stock",
          user: "Responsable",
        },
        {
          id: 3,
          date: "2025-10-12",
          produit: "Ramette A4",
          categorie: "Papier",
          fournisseur: "Imprisol",
          theorique: 80,
          reel: 60,
          ecart: -20,
          valeur: -60000,
          motif: "Vol supposé",
          user: "Responsable",
        },
      ];
      const ecCat = [
        { categorie: "Papeterie", ecart: -20 },
        { categorie: "Fournitures", ecart: 20 },
        { categorie: "Papier", ecart: -20 },
      ];
      const rep = [
        { name: "Écarts positifs", value: 1 },
        { name: "Écarts négatifs", value: 2 },
      ];
      const evol = [
        { date: "S-4", valeur: -15000 },
        { date: "S-3", valeur: -20000 },
        { date: "S-2", valeur: -25000 },
        { date: "S-1", valeur: -30000 },
        { date: "Cette semaine", valeur: -35000 },
      ];

      // set via backend quand dispo
      setStats(kpi);
      setAjustements(aj);
      setEcartsParCategorie(ecCat);
      setRepartitionPosNeg(rep);
      setEvolutionValeur(evol);
    } catch (e) {
      console.error("Inventaire load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebut, dateFin, cat, fourn]);

  // ————————————————————————
  // Création d’un ajustement
  // ————————————————————————
  const handleAjustement = async (payload) => {
    try {
      setSubmitting(true);

      // 🔗 Backend :
      // await instance.post("/inventaire/ajustements", payload);

      const next = {
        id: Date.now(),
        date: payload.date,
        produit: payload.produit,
        categorie: payload.categorie || "N/A",
        fournisseur: payload.fournisseur || "N/A",
        theorique: Number(payload.stockTheorique),
        reel: Number(payload.stockReel),
        ecart: Number(payload.ecart),
        valeur: Number(payload.valeurEcart || 0),
        motif: payload.motif || "",
        user: "Responsable",
      };

      setAjustements((prev) => [next, ...prev]);

      // recalcul KPI (simple agrégat)
      setStats((s) => ({
        ...s,
        totalEcarts: s.totalEcarts + next.ecart,
        valeurEcarts: s.valeurEcarts + next.valeur,
      }));

      setOpenAjust(false);
      toast("success", "Ajustement enregistré", `${next.produit} — ${formatFCFA(next.valeur)}`);
    } catch (e) {
      console.error("Ajustement error:", e);
      toast("error", "Erreur", "Impossible d’enregistrer l’ajustement.");
    } finally {
      setSubmitting(false);
    }
  };

  // ————————————————————————
  // Export PDF (KPI + tableau ajustements)
  // ————————————————————————
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventaire — Bilan & Ajustements", 14, 16);
    doc.setFontSize(10);
    doc.text(`Période: ${dateDebut} → ${dateFin}`, 14, 22);
    if (cat !== "Toutes") doc.text(`Catégorie: ${cat}`, 14, 27);
    if (fourn !== "Tous") doc.text(`Fournisseur: ${fourn}`, 14, 32);

    // KPI
    doc.setFontSize(12);
    doc.text("KPI", 14, 42);
    doc.setFontSize(10);
    doc.autoTable({
      startY: 45,
      head: [["Stock théorique", "Stock réel", "Écarts (Qté)", "Valeur des écarts"]],
      body: [[stats.stockTheo, stats.stockReel, stats.totalEcarts, formatFCFA(stats.valeurEcarts)]],
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    // Journal ajustements
    const rows = ajustements.map((a) => [
      a.date,
      a.produit,
      a.categorie,
      a.fournisseur,
      a.theorique,
      a.reel,
      a.ecart,
      formatFCFA(a.valeur),
      a.motif,
      a.user,
    ]);

    const y = doc.lastAutoTable.finalY + 10;
    doc.text("Journal des ajustements", 14, y);
    doc.autoTable({
      startY: y + 3,
      head: [["Date", "Produit", "Catégorie", "Fournisseur", "Théo", "Réel", "Écart", "Valeur", "Motif", "User"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save(`Inventaire_${dateDebut}_au_${dateFin}.pdf`);
  };

  // ————————————————————————
  // Filtres (front)
  // ————————————————————————
  const categories = ["Toutes", "Papeterie", "Fournitures", "Papier"];
  const fournisseurs = ["Tous", "SEN Distribution", "Fournil Office", "Imprisol"];

  const filteredAjustements = useMemo(() => {
    return ajustements.filter((a) => {
      const okDate = (!dateDebut || a.date >= dateDebut) && (!dateFin || a.date <= dateFin);
      const okCat = cat === "Toutes" || a.categorie === cat;
      const okF = fourn === "Tous" || a.fournisseur === fourn;
      return okDate && okCat && okF;
    });
  }, [ajustements, dateDebut, dateFin, cat, fourn]);

  // ——————————————————————————
  // 🧭 UI
  // ——————————————————————————
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-[#472EAD]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Chargement des données d’inventaire…
      </div>
    );
  }

  return (
    <>
      {/* Header & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#472EAD]">Inventaire & Bilan des stocks</h1>
          <p className="text-sm text-gray-500">
            Comptage, écarts, ajustements journalisés, bénéfices/pertes & graphiques.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenAjust(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg shadow hover:scale-[1.02] transition"
          >
            <PlusCircle size={18} /> Nouveau comptage
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#472EAD] border border-[#E3E0FF] rounded-lg hover:bg-[#F7F5FF]"
          >
            <FileDown size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex items-center gap-2 text-[#472EAD] font-semibold mb-3">
          <Filter size={16} /> Filtres
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Période</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
                <input
                  type="date"
                  value={dateDebut}
                  max={dateFin}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="pl-7 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
                <input
                  type="date"
                  value={dateFin}
                  min={dateDebut}
                  max={todayISO()}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="pl-7 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Fournisseur</label>
            <select
              value={fourn}
              onChange={(e) => setFourn(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {fournisseurs.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
            >
              <PackageSearch size={16} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KpiCard
          label="Stock théorique"
          value={stats.stockTheo}
          icon={<Package size={20} />}
          gradient="from-[#472EAD] to-[#7A5BF5]"
          trend="Stable"
          trendValue={0}
        />
        <KpiCard
          label="Stock réel"
          value={stats.stockReel}
          icon={<ClipboardCheck size={20} />}
          gradient="from-[#10B981] to-[#34D399]"
          trend="Variation"
          trendValue={(((stats.stockReel - stats.stockTheo) / (stats.stockTheo || 1)) * 100).toFixed(2)}
        />
        <KpiCard
          label="Écart (Qté)"
          value={stats.totalEcarts}
          icon={<AlertTriangle size={20} />}
          gradient="from-[#F58020] to-[#FF995A]"
          trend="vs période"
          trendValue={-2.5}
        />
        <KpiCard
          label="Valeur des écarts"
          value={formatFCFA(stats.valeurEcarts)}
          icon={<Scale size={20} />}
          gradient="from-[#EF4444] to-[#FB7185]"
          trend="Évolution"
          trendValue={-8.5}
        />
      </section>

      {/* Graphiques */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Bar: écarts par catégorie */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[#472EAD] font-semibold mb-3">Écarts par catégorie</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ecartsParCategorie}>
                <XAxis dataKey="categorie" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Legend />
                <Bar dataKey="ecart" fill="#472EAD" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie: répartition positifs/négatifs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[#472EAD] font-semibold mb-3">Répartition des écarts</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={repartitionPosNeg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {repartitionPosNeg.map((e, i) => (
                    <Cell key={`pie-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Area: évolution valeur écarts */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
        <h3 className="text-[#472EAD] font-semibold mb-3">Évolution de la valeur des écarts</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionValeur}>
              <defs>
                <linearGradient id="val" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#472EAD" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#472EAD" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Area type="monotone" dataKey="valeur" stroke="#472EAD" fillOpacity={1} fill="url(#val)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Journal des ajustements */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#472EAD] font-semibold">Journal des ajustements</h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Produit</th>
                <th className="px-4 py-3 text-left">Catégorie</th>
                <th className="px-4 py-3 text-left">Fournisseur</th>
                <th className="px-4 py-3 text-right">Théo</th>
                <th className="px-4 py-3 text-right">Réel</th>
                <th className="px-4 py-3 text-right">Écart</th>
                <th className="px-4 py-3 text-right">Valeur</th>
                <th className="px-4 py-3 text-left">Motif</th>
                <th className="px-4 py-3 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {filteredAjustements.length ? (
                filteredAjustements.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-[#F9F9FF]">
                    <td className="px-4 py-2">{a.date}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{a.produit}</td>
                    <td className="px-4 py-2">{a.categorie}</td>
                    <td className="px-4 py-2">{a.fournisseur}</td>
                    <td className="px-4 py-2 text-right">{a.theorique}</td>
                    <td className="px-4 py-2 text-right">{a.reel}</td>
                    <td className={cls("px-4 py-2 text-right", a.ecart >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {a.ecart > 0 ? `+${a.ecart}` : a.ecart}
                    </td>
                    <td className={cls("px-4 py-2 text-right", a.valeur >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {formatFCFA(a.valeur)}
                    </td>
                    <td className="px-4 py-2">{a.motif || "-"}</td>
                    <td className="px-4 py-2">{a.user}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-4 py-6 text-center text-gray-400">
                    Aucun ajustement pour cette période / ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modale d’ajustement & Toasts */}
      <AjustementModal open={openAjust} onClose={() => setOpenAjust(false)} onSubmit={handleAjustement} submitting={submitting} />
      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}

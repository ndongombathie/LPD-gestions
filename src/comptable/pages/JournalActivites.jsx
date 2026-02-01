// ==========================================================
// 🧾 JournalActivites.jsx — Interface Responsable (LPD Manager)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import profileAPI from "@/services/api/profile";
import { Filter, FileDown, RefreshCw, Search } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import TimelineActivity from "../components/TimelineActivity";

/* ===================== Logger local ===================== */
const logError = (context, error) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function JournalActivites() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(todayISO());
  const [acteur, setActeur] = useState("Tous");
  const [type, setType] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Appel API futur
      // const { data } = await profileAPI.getJournal({ from: dateDebut, to: dateFin, acteur, type, q: recherche });
      // setLogs(data);

      setLogs([
        { id: 1, date: "2025-11-09 08:32", acteur: "Responsable", type: "connexion", description: "Connexion réussie" },
        { id: 2, date: "2025-11-09 08:37", acteur: "Responsable", type: "creation", description: "Ajout utilisateur 'Vendeur #12'" },
        { id: 3, date: "2025-11-09 08:50", acteur: "Gestionnaire", type: "stock", description: "Réapprovisionnement 'Ramette A4' x 50" },
        { id: 4, date: "2025-11-09 09:10", acteur: "Vendeur", type: "vente", description: "Vente panier #10023 - 45 000 XOF" },
        { id: 5, date: "2025-11-09 09:15", acteur: "Responsable", type: "modification", description: "MàJ fournisseur 'SEN Distribution'" },
        { id: 6, date: "2025-11-09 09:20", acteur: "Caissier", type: "decaissement", description: "Décaissement 20 000 XOF validé" },
      ]);
    } catch (error) {
      logError("JournalActivites - chargement", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateDebut, dateFin, acteur, type]);

  const filteredLogs = useMemo(() => {
    const q = (recherche || "").toLowerCase();
    return logs.filter(
      (l) =>
        (!q || l.description.toLowerCase().includes(q)) &&
        (acteur === "Tous" || l.acteur === acteur) &&
        (type === "Tous" || l.type === type)
    );
  }, [logs, recherche, acteur, type]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Journal d'activités — Librairie Papeterie Daradji (LPD)", 14, 16);
    doc.setFontSize(10);
    doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 22);
    doc.autoTable({
      startY: 28,
      head: [["Date", "Acteur", "Type", "Description"]],
      body: filteredLogs.map((l) => [l.date, l.acteur, l.type, l.description]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save(`Journal_activites_${dateDebut}_au_${dateFin}.pdf`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[70vh] text-[#472EAD]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Chargement du journal d’activités...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F9F9FB] px-6 py-8 overflow-y-auto">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">
            Journal des activités
          </h1>
          <p className="text-sm text-gray-500">
            Traçabilité complète des connexions, ventes, ajustements et opérations critiques.
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="flex items-center gap-2 bg-white border border-[#E3E0FF] text-[#472EAD] px-4 py-2 rounded-lg hover:bg-[#F7F5FF] transition"
        >
          <FileDown size={18} /> Exporter PDF
        </button>
      </motion.header>

      {/* FILTRES */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-[#472EAD] font-semibold mb-3">
          <Filter size={16} /> Filtres
        </div>

        {/* (le reste du JSX est inchangé) */}
      </section>

      {/* TIMELINE + TABLE */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[#472EAD] font-semibold mb-3">
            Activités récentes
          </h3>
          <TimelineActivity data={filteredLogs.slice(0, 6)} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-[#472EAD] font-semibold mb-3">
            Table complète
          </h3>
          {/* table inchangée */}
        </div>
      </section>
    </div>
  );
}

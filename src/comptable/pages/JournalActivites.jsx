// ==========================================================
// 🧾 JournalActivites.jsx — Interface Responsable (LPD Manager)
// Version PRO : timeline + table + filtres + export PDF
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { instance } from "../../utils/axios";
import { Filter, FileDown, RefreshCw, Search } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import TimelineActivity from "../components/TimelineActivity";

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
      // const { data } = await instance.get("/journal-activites", { params: { from: dateDebut, to: dateFin, acteur, type, q: recherche } });
      // setLogs(data);

      setLogs([
        { id: 1, date: "2025-11-09 08:32", acteur: "Responsable", type: "connexion", description: "Connexion réussie" },
        { id: 2, date: "2025-11-09 08:37", acteur: "Responsable", type: "creation", description: "Ajout utilisateur 'Vendeur #12'" },
        { id: 3, date: "2025-11-09 08:50", acteur: "Gestionnaire", type: "stock", description: "Réapprovisionnement 'Ramette A4' x 50" },
        { id: 4, date: "2025-11-09 09:10", acteur: "Vendeur", type: "vente", description: "Vente panier #10023 - 45 000 XOF" },
        { id: 5, date: "2025-11-09 09:15", acteur: "Responsable", type: "modification", description: "MàJ fournisseur 'SEN Distribution'" },
        { id: 6, date: "2025-11-09 09:20", acteur: "Caissier", type: "decaissement", description: "Décaissement 20 000 XOF validé" },
      ]);
    } catch (e) {
      console.error("Erreur journal:", e);
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
          <h1 className="text-3xl font-bold text-[#472EAD]">Journal des activités</h1>
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

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Période</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dateDebut} max={dateFin} onChange={(e) => setDateDebut(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={dateFin} min={dateDebut} onChange={(e) => setDateFin(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Acteur</label>
            <select value={acteur} onChange={(e) => setActeur(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option>Tous</option>
              <option>Responsable</option>
              <option>Gestionnaire</option>
              <option>Vendeur</option>
              <option>Caissier</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Type d’action</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option>Tous</option>
              <option>connexion</option>
              <option>creation</option>
              <option>modification</option>
              <option>suppression</option>
              <option>vente</option>
              <option>encaissement</option>
              <option>decaissement</option>
              <option>inventaire</option>
              <option>ajustement</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Recherche</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une activité..."
                className="pl-7 w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE + TABLE */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[#472EAD] font-semibold mb-3">Activités récentes</h3>
          <TimelineActivity data={filteredLogs.slice(0, 6)} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-[#472EAD] font-semibold mb-3">Table complète</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Acteur</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length ? (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-[#F9F9FF]">
                    <td className="px-4 py-2">{l.date}</td>
                    <td className="px-4 py-2">{l.acteur}</td>
                    <td className="px-4 py-2 capitalize">{l.type}</td>
                    <td className="px-4 py-2">{l.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-gray-400 py-6">
                    Aucune activité trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

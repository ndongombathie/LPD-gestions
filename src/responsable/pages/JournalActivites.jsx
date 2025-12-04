// ========================================================== 
// 🧾 JournalActivites.jsx — Interface Responsable (LPD Manager)
// Version PRO : timeline + table + filtres + export PDF
// Style harmonisé avec Dashboard / Décaissements / Utilisateurs
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
      // Exemple quand l'API sera prête :
      // const { data } = await instance.get("/journal-activites", {
      //   params: { from: dateDebut, to: dateFin, acteur, type, q: recherche },
      // });
      // setLogs(data);

      // 👉 Données simulées
      setLogs([
        {
          id: 1,
          date: "2025-11-09 08:32",
          acteur: "Responsable",
          type: "connexion",
          description: "Connexion réussie",
        },
        {
          id: 2,
          date: "2025-11-09 08:37",
          acteur: "Responsable",
          type: "creation",
          description: "Ajout utilisateur 'Vendeur #12'",
        },
        {
          id: 3,
          date: "2025-11-09 08:50",
          acteur: "Gestionnaire",
          type: "stock",
          description: "Réapprovisionnement 'Ramette A4' x 50",
        },
        {
          id: 4,
          date: "2025-11-09 09:10",
          acteur: "Vendeur",
          type: "vente",
          description: "Vente panier #10023 - 45 000 XOF",
        },
        {
          id: 5,
          date: "2025-11-09 09:15",
          acteur: "Responsable",
          type: "modification",
          description: "MàJ fournisseur 'SEN Distribution'",
        },
        {
          id: 6,
          date: "2025-11-09 09:20",
          acteur: "Caissier",
          type: "decaissement",
          description: "Décaissement 20 000 XOF validé",
        },
      ]);
    } catch (e) {
      console.error("Erreur journal:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Loader harmonisé
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <RefreshCw className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement du journal d’activités...
          </span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Journal d’activités — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Journal des activités
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Traçabilité complète des connexions, ventes, ajustements et
                opérations critiques.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période du{" "}
              <span className="font-semibold">{dateDebut}</span> au{" "}
              <span className="font-semibold">{dateFin}</span> •{" "}
              {filteredLogs.length} activité
              {filteredLogs.length > 1 && "s"} trouvée
            </p>
          </div>


        </motion.header>

        {/* FILTRES */}
        <section className="bg-white/90 rounded-2xl border border-[#E4E0FF] shadow-[0_18px_45px_rgba(15,23,42,0.06)] p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-[#472EAD] font-semibold text-sm">
            <Filter size={16} />
            Filtres
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            {/* Période */}
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Période
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateDebut}
                  max={dateFin}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                />
                <input
                  type="date"
                  value={dateFin}
                  min={dateDebut}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                />
              </div>
            </div>

            {/* Acteur */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Acteur
              </label>
              <select
                value={acteur}
                onChange={(e) => setActeur(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
              >
                <option>Tous</option>
                <option>Responsable</option>
                <option>Gestionnaire</option>
                <option>Vendeur</option>
                <option>Caissier</option>
              </select>
            </div>

            {/* Type d’action */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Type d’action
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
              >
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
                <option>stock</option>
              </select>
            </div>

            {/* Recherche */}
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Recherche
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher une activité (description, type, acteur)…"
                  className="pl-9 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* TIMELINE + TABLE (empilés) */}
        <section className="space-y-6 mt-2">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5"
          >
            <h3 className="text-sm sm:text-base font-semibold text-[#2F1F7A] mb-2">
              Activités récentes
            </h3>
            <p className="text-[11px] text-gray-400 mb-3">
              Dernières actions sur la période sélectionnée (jusqu’à 8 entrées).
            </p>
            <TimelineActivity data={filteredLogs.slice(0, 8)} />
          </motion.div>

          {/* Table complète */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white/95 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5 overflow-x-auto"
          >
            <h3 className="text-sm sm:text-base font-semibold text-[#2F1F7A] mb-3">
              Tableau complet
            </h3>
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Acteur
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left border-b border-[#E4E0FF]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length ? (
                  filteredLogs.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.date}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {l.acteur}
                      </td>
                      <td className="px-4 py-2.5 capitalize whitespace-nowrap">
                        {l.type}
                      </td>
                      <td className="px-4 py-2.5">{l.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-gray-400 py-6 text-xs sm:text-sm"
                    >
                      Aucune activité trouvée sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

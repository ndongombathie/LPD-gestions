// ==========================================================
// 📊 VentesControle.jsx — Filtre complet + statistiques + graphique animé
// ==========================================================

import React, { useState, useMemo } from "react";
import { Printer, Calendar, User, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

// ===============================
// 🔧 Données simulées
// ===============================
const mockVentes = [
  { id: 1, vendeur: "Moussa Ndiaye", telephone: "771234567", role: "vendeur", date: "2025-01-12", mois: "Janvier", total: 55000 },
  { id: 2, vendeur: "Aissatou Diop", telephone: "781112233", role: "vendeur", date: "2025-01-12", mois: "Janvier", total: 35000 },
  { id: 3, vendeur: "Moussa Ndiaye", telephone: "771234567", role: "vendeur", date: "2025-02-03", mois: "Février", total: 82000 },
  { id: 4, vendeur: "Fatou Ndour", telephone: "761234555", role: "vendeur", date: "2025-02-03", mois: "Février", total: 61000 },
  { id: 5, vendeur: "Responsable Général", telephone: "700000000", role: "responsable", date: "2025-02-10", mois: "Février", total: 120000 },
];

// Format CFA
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(n || 0);

const COLORS = ["#472EAD", "#F58020"];

// Animation des tranches du graphique
const sliceVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2 + i * 0.1,
      type: "spring",
      stiffness: 120,
      damping: 12,
    },
  }),
};

export default function VentesControle() {
  const [mode, setMode] = useState("journalier");
  const [selectedVendeur, setSelectedVendeur] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const vendeurs = [...new Set(mockVentes.map((v) => v.vendeur))];

  // ==================================================
  // 🔍 Filtrage GLOBAL
  // ==================================================
  const filteredData = useMemo(() => {
    let data = [...mockVentes];

    if (mode === "journalier") {
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (selectedVendeur) data = data.filter((v) => v.vendeur === selectedVendeur);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (v) =>
          v.vendeur.toLowerCase().includes(q) ||
          (v.telephone && v.telephone.includes(q))
      );
    }

    if (dateDebut) data = data.filter((v) => v.date >= dateDebut);
    if (dateFin) data = data.filter((v) => v.date <= dateFin);

    return data;
  }, [mode, selectedVendeur, searchTerm, dateDebut, dateFin]);

  // ==================================================
  // 📊 STATISTIQUES
  // ==================================================
  const totalGeneral = filteredData.reduce((s, v) => s + v.total, 0);
  const nombreOperations = filteredData.length;

  // Meilleur vendeur
  const meilleurVendeur = useMemo(() => {
    const scores = {};
    filteredData.forEach((v) => {
      scores[v.vendeur] = (scores[v.vendeur] || 0) + v.total;
    });

    let best = null;
    let max = 0;
    Object.keys(scores).forEach((vendeur) => {
      if (scores[vendeur] > max) {
        best = vendeur;
        max = scores[vendeur];
      }
    });

    return best ? `${best} (${formatFCFA(max)})` : "-";
  }, [filteredData]);

  // Répartition vendeur / responsable
  const ventesParRole = useMemo(() => {
    const roleData = [
      {
        role: "Vendeurs",
        total: mockVentes
          .filter((v) => v.role === "vendeur")
          .reduce((s, v) => s + v.total, 0),
      },
      {
        role: "Responsable",
        total: mockVentes
          .filter((v) => v.role === "responsable")
          .reduce((s, v) => s + v.total, 0),
      },
    ];
    return roleData;
  }, []);

  // ==================================================
  // 🖨 Impression PDF
  // ==================================================
  const imprimerPDF = () => {
    if (!filteredData.length) {
      alert("Aucune donnée à imprimer.");
      return;
    }

    const doc = new jsPDF();

    doc.text("Rapport des Ventes — LPD Manager", 14, 16);

    autoTable(doc, {
      startY: 30,
      head: [["Vendeur", "Téléphone", "Date", "Montant"]],
      body: filteredData.map((v) => [
        v.vendeur,
        v.telephone,
        v.date,
        formatFCFA(v.total),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    const y = doc.lastAutoTable.finalY + 10;
    doc.text(`TOTAL : ${formatFCFA(totalGeneral)}`, 14, y);

    doc.save("Rapport_Ventes_LPD.pdf");
  };

  // ==================================================
  // 🖥 Rendu
  // ==================================================
  return (
    <div className="p-5 space-y-5">

      <h1 className="text-xl font-semibold text-[#472EAD]">Contrôle des Ventes</h1>

      {/* === FILTRES === */}
      <div className="p-4 bg-white rounded-xl shadow border flex flex-wrap gap-4 items-center">

        {/* Mode */}
        <div>
          <Calendar size={18} className="text-[#472EAD]" />
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="px-2 py-1 border rounded">
            <option value="journalier">Journalier</option>
            <option value="mensuel">Mensuel</option>
          </select>
        </div>

        {/* Vendeur */}
        <div>
          <User size={18} className="text-[#472EAD]" />
          <select value={selectedVendeur} onChange={(e) => setSelectedVendeur(e.target.value)} className="px-2 py-1 border rounded">
            <option value="">Tous</option>
            {vendeurs.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Recherche */}
        <div className="flex-1 flex items-center gap-2">
          <Search size={18} className="text-[#472EAD]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom ou téléphone…"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Dates */}
        <div>
          <label className="text-sm">Date début</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="px-2 py-1 border rounded" />
        </div>

        <div>
          <label className="text-sm">Date fin</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="px-2 py-1 border rounded" />
        </div>

        {/* Bouton PDF */}
        <button onClick={imprimerPDF} className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2">
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* === TABLEAU === */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2 text-left">Vendeur</th>
              <th className="px-3 py-2">Téléphone</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="px-3 py-2">{v.vendeur}</td>
                <td className="px-3 py-2">{v.telephone}</td>
                <td className="px-3 py-2">{v.date}</td>
                <td className="px-3 py-2 text-right">{formatFCFA(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === STATISTIQUES + GRAPHIQUE === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Total */}
        <div className="p-3 bg-white rounded shadow border text-center">
          <p className="text-gray-500 text-sm">Total Général</p>
          <p className="text-xl font-bold">{formatFCFA(totalGeneral)}</p>
        </div>

        {/* Meilleur vendeur */}
        <div className="p-3 bg-white rounded shadow border text-center">
          <p className="text-gray-500 text-sm">Meilleur vendeur</p>
          <p className="text-lg font-semibold">{meilleurVendeur}</p>
        </div>

        {/* Nombre opérations */}
        <div className="p-3 bg-white rounded shadow border text-center">
          <p className="text-gray-500 text-sm">Opérations</p>
          <p className="text-xl font-bold">{nombreOperations}</p>
        </div>
      </div>

      {/* === GRAPHIQUE ANIMÉ === */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="bg-white p-4 rounded-xl shadow border"
      >
        <h3 className="text-sm font-medium mb-2 text-gray-700">
          Répartition des ventes par rôle
        </h3>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ventesParRole}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="total"
                nameKey="role"
              >
                {ventesParRole.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]}>
                    <motion.g custom={index} initial="hidden" animate="visible" variants={sliceVariants} />
                  </Cell>
                ))}
              </Pie>

              <Tooltip formatter={(v) => formatFCFA(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </div>
  );
}

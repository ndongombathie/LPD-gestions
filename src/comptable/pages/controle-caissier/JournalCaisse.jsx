// ==========================================================
// 🧾 JournalCaisse.jsx — Journal des caisses (Comptable)
// - Date du jour auto
// - Filtre nom / téléphone
// - Filtre intervalle de dates
// - Calcul des écarts
// - Export PDF (Imprimer)
// ==========================================================

import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Search, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Données simulées (mock)
const mockCaisses = [
  {
    id: 1,
    caissier: "Moussa Ndiaye",
    telephone: "771234567",
    date: "2025-01-12",
    totalVentes: 150000,
    totalDeclare: 148000,
  },
  {
    id: 2,
    caissier: "Aissatou Diop",
    telephone: "781112233",
    date: "2025-01-12",
    totalVentes: 170000,
    totalDeclare: 170000,
  },
  {
    id: 3,
    caissier: "Moussa Ndiaye",
    telephone: "771234567",
    date: "2025-02-01",
    totalVentes: 210000,
    totalDeclare: 209500,
  },
];

// Format monnaie
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(n || 0);

export default function JournalCaisse() {
  const [search, setSearch] = useState("");
  const [dateJour, setDateJour] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // 📌 Mettre la date du jour automatiquement
  useEffect(() => {
    setDateJour(new Date().toISOString().split("T")[0]);
  }, []);

  // ============================================
  // 🔍 Filtrage GLOBAL
  // ============================================
  const filtered = useMemo(() => {
    let data = [...mockCaisses];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (c) =>
          c.caissier.toLowerCase().includes(q) ||
          (c.telephone && c.telephone.includes(q))
      );
    }

    if (dateJour) {
      data = data.filter((c) => c.date === dateJour);
    }

    if (dateDebut) data = data.filter((c) => c.date >= dateDebut);
    if (dateFin) data = data.filter((c) => c.date <= dateFin);

    data.sort((a, b) => (a.date < b.date ? 1 : -1));

    return data;
  }, [search, dateJour, dateDebut, dateFin]);

  // Totaux
  const totalVentes = filtered.reduce((s, v) => s + (v.totalVentes || 0), 0);
  const totalDeclare = filtered.reduce((s, v) => s + (v.totalDeclare || 0), 0);
  const totalEcart = totalDeclare - totalVentes;

  // ======================================================
  // 🖨 Fonction : IMPRIMER PDF
  // ======================================================
  const imprimerPDF = () => {
    if (!filtered.length) {
      alert("Aucune caisse à imprimer.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "A4",
    });

    doc.setFontSize(16);
    doc.text("Journal des Caisses — LPD Manager", 40, 40);

    doc.setFontSize(11);
    doc.text(`Date du jour : ${dateJour}`, 40, 60);

    if (dateDebut) doc.text(`Début : ${dateDebut}`, 40, 75);
    if (dateFin) doc.text(`Fin : ${dateFin}`, 40, 90);

    autoTable(doc, {
      startY: 110,
      head: [["Caissier", "Téléphone", "Date", "Ventes", "Déclaré", "Écart"]],
      body: filtered.map((c) => [
        c.caissier,
        c.telephone,
        c.date,
        formatFCFA(c.totalVentes),
        formatFCFA(c.totalDeclare),
        formatFCFA(c.totalDeclare - c.totalVentes),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    const y = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(12);
    doc.text(`TOTAL Ventes : ${formatFCFA(totalVentes)}`, 40, y);
    doc.text(`TOTAL Déclaré : ${formatFCFA(totalDeclare)}`, 40, y + 15);
    doc.text(`ÉCART GLOBAL : ${formatFCFA(totalEcart)}`, 40, y + 30);

    doc.save("Journal_Caisses_LPD.pdf");
  };

  return (
    <div className="p-5 space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#472EAD]">Journal des Caisses</h1>
          <p className="text-sm text-gray-500">Caisse du jour + filtre par date & export PDF</p>
        </div>

        <button
          onClick={imprimerPDF}
          className="px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2 shadow hover:bg-[#5A3BE6]"
        >
          <Printer size={18} /> Imprimer
        </button>
      </div>

      {/* === FILTRES === */}
      <div className="bg-white shadow rounded-xl p-4 border flex flex-wrap gap-4 items-center">

        {/* Recherche */}
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <Search size={18} className="text-[#472EAD]" />
          <input
            placeholder="Rechercher caissier / téléphone..."
            className="px-3 py-2 border rounded w-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date du jour */}
        <div>
          <label className="text-sm text-gray-600">Date du jour</label>
          <input
            type="date"
            className="px-3 py-2 border rounded text-sm"
            value={dateJour}
            onChange={(e) => setDateJour(e.target.value)}
          />
        </div>

        {/* Date début */}
        <div>
          <label className="text-sm text-gray-600">Début</label>
          <input
            type="date"
            className="px-3 py-2 border rounded text-sm"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
        </div>

        {/* Date fin */}
        <div>
          <label className="text-sm text-gray-600">Fin</label>
          <input
            type="date"
            className="px-3 py-2 border rounded text-sm"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
        </div>
      </div>

      {/* === TABLEAU === */}
      <div className="bg-white shadow rounded-xl p-4 border">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2 text-left">Caissier</th>
              <th className="px-3 py-2">Téléphone</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Ventes</th>
              <th className="px-3 py-2 text-right">Déclaré</th>
              <th className="px-3 py-2 text-right">Écart</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length ? (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2">{c.caissier}</td>
                  <td className="px-3 py-2">{c.telephone}</td>
                  <td className="px-3 py-2">{c.date}</td>
                  <td className="px-3 py-2 text-right">{formatFCFA(c.totalVentes)}</td>
                  <td className="px-3 py-2 text-right">{formatFCFA(c.totalDeclare)}</td>
                  <td className="px-3 py-2 text-right">{formatFCFA(c.totalDeclare - c.totalVentes)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-400">
                  Aucune caisse trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Résumé global */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="p-3 bg-[#F7F5FF] rounded">
            <p className="text-gray-600 text-sm">Total Ventes</p>
            <p className="font-bold text-[#472EAD]">{formatFCFA(totalVentes)}</p>
          </div>

          <div className="p-3 bg-[#F7F5FF] rounded">
            <p className="text-gray-600 text-sm">Total Déclaré</p>
            <p className="font-bold text-[#472EAD]">{formatFCFA(totalDeclare)}</p>
          </div>

          <div className="p-3 bg-[#F7F5FF] rounded">
            <p className="text-gray-600 text-sm">Écart</p>
            <p
              className={`font-bold ${
                totalEcart === 0
                  ? "text-green-600"
                  : totalEcart > 0
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {formatFCFA(totalEcart)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

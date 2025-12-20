// ==========================================================
// 🧾 JournalCaisse.jsx — Journal de Caisse PRO (Comptable)
// DESIGN SHADOW FINAL (SANS BORDURES)
// ==========================================================

import React, { useState, useMemo, useEffect } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===============================
// 🔧 CONFIG
// ===============================
const FOND_CAISSE = 50000;

// ===============================
// 🔧 DONNÉES MOCK
// ===============================
const caissesMock = [
  {
    id: 1,
    caissier: "Moussa Ndiaye",
    date: "2025-02-22",
    paiements: [10000, 15000, 5000],
    encaissements: [5000],
    decaissements: [3000],
  },
  {
    id: 2,
    caissier: "Aissatou Diop",
    date: "2025-02-22",
    paiements: [20000, 12000],
    encaissements: [],
    decaissements: [2000],
  },
];

// ===============================
// 🔧 FORMAT ÉCRAN
// ===============================
const fcfa = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(n || 0);

// ===============================
// 🔧 FORMAT PDF (POINTS)
// ===============================
const fcfaPDF = (n) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " FCFA";

// ===============================
// 📌 COMPOSANT
// ===============================
export default function JournalCaisse() {
  const [search, setSearch] = useState("");
  const [dateExacte, setDateExacte] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    setDateExacte(new Date().toISOString().split("T")[0]);
  }, []);

  // ===============================
  // 🔍 FILTRAGE + CALCUL
  // ===============================
  const caisses = useMemo(() => {
    let data = [...caissesMock];

    if (search) {
      data = data.filter((c) =>
        c.caissier.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateDebut || dateFin) {
      data = data.filter((c) => {
        if (dateDebut && c.date < dateDebut) return false;
        if (dateFin && c.date > dateFin) return false;
        return true;
      });
    } else if (dateExacte) {
      data = data.filter((c) => c.date === dateExacte);
    }

    return data.map((c) => {
      const sommePaiements = c.paiements.reduce((s, v) => s + v, 0);
      const nbPaiements = c.paiements.length;
      const totalEncaisse = c.encaissements.reduce((s, v) => s + v, 0);
      const totalDecaisse = c.decaissements.reduce((s, v) => s + v, 0);

      const caisseFinale =
        FOND_CAISSE + sommePaiements + totalEncaisse - totalDecaisse;

      return {
        ...c,
        nbPaiements,
        sommePaiements,
        totalEncaisse,
        totalDecaisse,
        caisseFinale,
      };
    });
  }, [search, dateExacte, dateDebut, dateFin]);

  // ===============================
  // 📊 TOTAUX
  // ===============================
  const totalEncaissements = caisses.reduce((s, c) => s + c.totalEncaisse, 0);
  const totalDecaissements = caisses.reduce((s, c) => s + c.totalDecaisse, 0);
  const totalCaisses = caisses.reduce((s, c) => s + c.caisseFinale, 0);

  // ===============================
  // 🖨 PDF
  // ===============================
  const imprimerPDF = () => {
    if (!caisses.length) {
      alert("Aucune donnée à imprimer");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Journal de Caisse — Toutes les caisses", 14, 16);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Caissier",
          "Date",
          "Fond",
          "Paiements",
          "Total paiements",
          "Décaissements",
          "Encaissements",
          "Caisse finale",
        ],
      ],
      body: caisses.map((c) => [
        c.caissier,
        c.date,
        fcfaPDF(FOND_CAISSE),
        c.nbPaiements,
        fcfaPDF(c.sommePaiements),
        fcfaPDF(c.totalDecaisse),
        fcfaPDF(c.totalEncaisse),
        fcfaPDF(c.caisseFinale),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    let y = doc.lastAutoTable.finalY + 14;
    doc.text(`Total encaissements : ${fcfaPDF(totalEncaissements)}`, 14, y);
    doc.text(`Total décaissements : ${fcfaPDF(totalDecaissements)}`, 14, y + 12);
    doc.text(`Total caisses : ${fcfaPDF(totalCaisses)}`, 14, y + 24);

    doc.save("Journal_Caisse_LPD.pdf");
  };

  return (
    <div className="space-y-8">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Journal de Caisse
        </h1>
        <p className="text-sm text-gray-500">
          Suivi détaillé des caisses journalières
        </p>
      </div>

      {/* ================= FILTRES ================= */}
      <div className="bg-white rounded-2xl shadow-md p-5 flex flex-wrap gap-4">
        <input
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          placeholder="Rechercher caissier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          value={dateExacte}
          onChange={(e) => {
            setDateExacte(e.target.value);
            setDateDebut("");
            setDateFin("");
          }}
        />

        <input
          type="date"
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          value={dateDebut}
          onChange={(e) => {
            setDateDebut(e.target.value);
            setDateExacte("");
          }}
        />

        <input
          type="date"
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          value={dateFin}
          onChange={(e) => {
            setDateFin(e.target.value);
            setDateExacte("");
          }}
        />

        <button
          onClick={imprimerPDF}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-xl shadow hover:shadow-lg transition"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th>Caissier</th>
              <th>Date</th>
              <th>Fond</th>
              <th>Paiements</th>
              <th>Total paiements</th>
              <th>Décaissements</th>
              <th>Encaissements</th>
              <th>Caisse finale</th>
            </tr>
          </thead>
          <tbody>
            {caisses.map((c) => (
              <tr key={c.id} className="odd:bg-gray-50">
                <td>{c.caissier}</td>
                <td>{c.date}</td>
                <td>{fcfa(FOND_CAISSE)}</td>
                <td className="text-center">{c.nbPaiements}</td>
                <td>{fcfa(c.sommePaiements)}</td>
                <td>{fcfa(c.totalDecaisse)}</td>
                <td>{fcfa(c.totalEncaisse)}</td>
                <td className="font-semibold">{fcfa(c.caisseFinale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= TOTAUX ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total encaissements"
          value={fcfa(totalEncaissements)}
          color="text-green-600"
        />
        <StatCard
          label="Total décaissements"
          value={fcfa(totalDecaissements)}
          color="text-red-600"
        />
        <StatCard
          label="Total des caisses"
          value={fcfa(totalCaisses)}
          color="text-[#472EAD]"
        />
      </div>
    </div>
  );
}

/* ================== STAT CARD ================== */
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-bold text-lg mt-1 ${color}`}>{value}</p>
    </div>
  );
}

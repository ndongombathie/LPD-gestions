// ==========================================================
// 🧾 JournalCaisse.jsx — Journal de Caisse PRO (Comptable)
// ==========================================================

import React, { useState, useMemo, useEffect } from "react";
import { Search, Printer } from "lucide-react";
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
// 🔧 FORMAT
// ===============================
const fcfa = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(n || 0);

// ===============================
// 📌 COMPOSANT
// ===============================
export default function JournalCaisse() {
  const [search, setSearch] = useState("");
  const [dateJour, setDateJour] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    setDateJour(new Date().toISOString().split("T")[0]);
  }, []);

  // ===============================
  // 🔍 FILTRAGE + CALCULS
  // ===============================
  const caisses = useMemo(() => {
    return caissesMock
      .filter(
        (c) =>
          !search ||
          c.caissier.toLowerCase().includes(search.toLowerCase())
      )
      .filter((c) => (!dateJour ? true : c.date === dateJour))
      .filter((c) => (!dateDebut ? true : c.date >= dateDebut))
      .filter((c) => (!dateFin ? true : c.date <= dateFin))
      .map((c) => {
        const sommePaiements = c.paiements.reduce((s, v) => s + v, 0);
        const nbPaiements = c.paiements.length;
        const totalEncaisse = c.encaissements.reduce((s, v) => s + v, 0);
        const totalDecaisse = c.decaissements.reduce((s, v) => s + v, 0);

        const caisseFinale =
          FOND_CAISSE +
          sommePaiements +
          totalEncaisse -
          totalDecaisse;

        return {
          ...c,
          nbPaiements,
          sommePaiements,
          totalEncaisse,
          totalDecaisse,
          caisseFinale,
        };
      });
  }, [search, dateJour, dateDebut, dateFin]);

  // ===============================
  // 📊 TOTAUX GLOBAUX
  // ===============================
  const totalCaisseGlobale = caisses.reduce(
    (s, c) => s + c.caisseFinale,
    0
  );

  const totalEncaissementsGlobaux = caisses.reduce(
    (s, c) => s + c.totalEncaisse,
    0
  );

  const totalDecaissementsGlobaux = caisses.reduce(
    (s, c) => s + c.totalDecaisse,
    0
  );

  // ===============================
  // 🖨 PDF
  // ===============================
  const imprimerPDF = () => {
    if (!caisses.length) {
      alert("Aucune donnée à imprimer.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Journal de Caisse — LPD Manager", 14, 16);

    doc.setFontSize(10);
    if (dateDebut || dateFin) {
      doc.text(
        `Période : ${dateDebut || "..."} → ${dateFin || "..."}`,
        14,
        26
      );
    }

    autoTable(doc, {
      startY: 35,
      head: [
        [
          "Caissier",
          "Date",
          "Fond",
          "Nb paiements",
          "Somme paiements",
          "Décaissements",
          "Encaissements",
          "Caisse finale",
        ],
      ],
      body: caisses.map((c) => [
        c.caissier,
        c.date,
        fcfa(FOND_CAISSE),
        c.nbPaiements,
        fcfa(c.sommePaiements),
        fcfa(c.totalDecaisse),
        fcfa(c.totalEncaisse),
        fcfa(c.caisseFinale),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    let y = doc.lastAutoTable.finalY + 10;

    doc.text(`Total encaissements : ${fcfa(totalEncaissementsGlobaux)}`, 14, y);
    doc.text(`Total décaissements : ${fcfa(totalDecaissementsGlobaux)}`, 14, y + 14);
    doc.text(`Total caisses : ${fcfa(totalCaisseGlobale)}`, 14, y + 28);

    doc.save("Journal_Caisse_LPD.pdf");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Journal de Caisse (détaillé)
      </h1>

      {/* FILTRES */}
      <div className="bg-white p-4 rounded-xl shadow border flex flex-wrap gap-4">
        <input
          className="border px-3 py-2 rounded w-full md:w-64"
          placeholder="Rechercher caissier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
        />

        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
        />

        <button
          onClick={imprimerPDF}
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded flex gap-2"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th>Caissier</th>
              <th>Date</th>
              <th>Fond</th>
              <th>Paiements</th>
              <th>Somme paiements</th>
              <th>Décaissements</th>
              <th>Encaissements</th>
              <th>Caisse finale</th>
            </tr>
          </thead>
          <tbody>
            {caisses.map((c) => (
              <tr key={c.id} className="border-b">
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

      {/* RÉCAP GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow border text-center">
          <p className="text-gray-500 text-sm">Total encaissements</p>
          <p className="text-lg font-bold text-green-600">
            {fcfa(totalEncaissementsGlobaux)}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow border text-center">
          <p className="text-gray-500 text-sm">Total décaissements</p>
          <p className="text-lg font-bold text-red-600">
            {fcfa(totalDecaissementsGlobaux)}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow border text-center">
          <p className="text-gray-500 text-sm">Total de toutes les caisses</p>
          <p className="text-xl font-bold text-[#472EAD]">
            {fcfa(totalCaisseGlobale)}
          </p>
        </div>
      </div>
    </div>
  );
}

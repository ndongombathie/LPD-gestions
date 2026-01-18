// ==========================================================
// 🧾 ControleVendeur.jsx — Contrôle des ventes vendeurs
// Comptable (Journalier / Mensuel / Impression PDF)
// DESIGN SHADOW FINAL
// ==========================================================

import React, { useMemo, useState } from "react";
import { Search, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DataTable from "../components/DataTable.jsx";

/* 🔧 FORMAT FCFA (points comme séparateurs) */
const formatFCFA = (value) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* 🔧 DONNÉES MOCK */
const ventesMock = [
  {
    id: 1,
    vendeur: "Aïcha Fall",
    date: "2025-01-18",
    produit: "Cahier",
    quantite: 3,
    montant: 1500,
  },
  {
    id: 2,
    vendeur: "Moussa Diop",
    date: "2025-01-18",
    produit: "Stylo",
    quantite: 5,
    montant: 1000,
  },
  {
    id: 3,
    vendeur: "Aïcha Fall",
    date: "2025-01-05",
    produit: "Livre",
    quantite: 1,
    montant: 3500,
  },
];

export default function ControleVendeur() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("journalier");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));

  /* 🔍 FILTRAGE */
  const ventesFiltrees = useMemo(() => {
    return ventesMock.filter((v) => {
      const matchNom = v.vendeur
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchDate =
        mode === "journalier"
          ? v.date === date
          : v.date.startsWith(mois);

      return matchNom && matchDate;
    });
  }, [search, date, mois, mode]);

  /* 📊 TOTAUX */
  const totalVentes = ventesFiltrees.length;
  const totalMontant = ventesFiltrees.reduce(
    (s, v) => s + v.montant,
    0
  );

  /* 🖨️ IMPRESSION PDF */
  const imprimerPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Contrôle des ventes vendeurs", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Période : ${
        mode === "journalier" ? `Jour ${date}` : `Mois ${mois}`
      }`,
      14,
      22
    );

    autoTable(doc, {
      startY: 28,
      head: [["Vendeur", "Date", "Produit", "Quantité", "Montant (FCFA)"]],
      body: ventesFiltrees.map((v) => [
        v.vendeur,
        v.date,
        v.produit,
        v.quantite,
        formatFCFA(v.montant),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(
      `Total des ventes : ${formatFCFA(totalMontant)} FCFA`,
      14,
      finalY
    );

    doc.save(
      `ventes_${mode}_${mode === "journalier" ? date : mois}.pdf`
    );
  };

  return (
    <div className="space-y-8">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-2xl font-bold text-[#472EAD]">
          Contrôle des ventes vendeurs
        </h1>
        <p className="text-sm text-gray-500">
          Suivi journalier et mensuel des ventes validées
        </p>
      </div>

      {/* ================= FILTRES ================= */}
      <div className="bg-white rounded-2xl shadow-md p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-gray-400"
            size={16}
          />
          <input
            className="pl-9 pr-3 py-2 rounded-lg w-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
            placeholder="Nom du vendeur"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
        >
          <option value="journalier">Journalier</option>
          <option value="mensuel">Mensuel</option>
        </select>

        {mode === "journalier" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          />
        ) : (
          <input
            type="month"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          />
        )}

        <button
          onClick={imprimerPDF}
          className="flex items-center justify-center gap-2 bg-[#472EAD] text-white rounded-xl px-4 py-2 shadow hover:shadow-lg transition"
        >
          <Printer size={16} /> Imprimer PDF
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Nombre de ventes" value={totalVentes} />
        <StatCard
          label="Montant total"
          value={`${formatFCFA(totalMontant)} FCFA`}
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <DataTable
          data={ventesFiltrees}
          columns={[
            { label: "Vendeur", key: "vendeur" },
            { label: "Date", key: "date" },
            { label: "Produit", key: "produit" },
            { label: "Quantité", key: "quantite" },
            {
              label: "Montant (FCFA)",
              key: "montant",
              render: (v) => formatFCFA(v),
            },
          ]}
        />
      </div>
    </div>
  );
}

/* ================== STAT CARD ================== */
function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

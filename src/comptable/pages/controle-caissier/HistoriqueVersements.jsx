// ==========================================================
// 📜 HistoriqueVersements.jsx — PRO
// DESIGN SHADOW FINAL (SANS BORDURES)
// ==========================================================

import React, { useEffect, useState, useMemo } from "react";
import { Search, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===============================
// 🔧 FORMAT FCFA (ÉCRAN)
// ===============================
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(n || 0);

// ===============================
// 📌 COMPOSANT
// ===============================
export default function HistoriqueVersements() {
  const [versements, setVersements] = useState([]);
  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // ===============================
  // 🔁 CHARGEMENT
  // ===============================
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("versements") || "[]");
    setVersements(data);
  }, []);

  // ===============================
  // 🔍 FILTRAGE
  // ===============================
  const dataFiltre = useMemo(() => {
    let data = [...versements];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.caissier.toLowerCase().includes(q) ||
          (v.commentaire && v.commentaire.toLowerCase().includes(q))
      );
    }

    if (dateDebut) data = data.filter((v) => v.date >= dateDebut);
    if (dateFin) data = data.filter((v) => v.date <= dateFin);

    return data;
  }, [search, dateDebut, dateFin, versements]);

  const totalGeneral = dataFiltre.reduce((s, v) => s + v.montant, 0);

  // ===============================
  // 🖨 PDF
  // ===============================
  const imprimerPDF = () => {
    if (!dataFiltre.length) {
      alert("Aucun versement à imprimer.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Historique des Versements — LPD Manager", 14, 20);

    autoTable(doc, {
      startY: 40,
      head: [["Caissier", "Date", "Montant", "Commentaire"]],
      body: dataFiltre.map((v) => [
        v.caissier,
        v.date,
        v.montant
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " FCFA",
        v.commentaire || "-",
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    const y = doc.lastAutoTable.finalY + 14;
    doc.text(
      `TOTAL : ${totalGeneral
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} FCFA`,
      14,
      y
    );

    doc.save("Historique_Versements_LPD.pdf");
  };

  return (
    <div className="space-y-8">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Historique des Versements
        </h1>
        <p className="text-sm text-gray-500">
          Suivi détaillé des versements enregistrés
        </p>
      </div>

      {/* ================= FILTRES ================= */}
      <div className="bg-white rounded-2xl shadow-md p-5 flex flex-wrap gap-4">

        {/* Recherche */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search size={18} className="text-[#472EAD]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher caissier ou commentaire…"
            className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
          />
        </div>

        {/* Date début */}
        <input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
        />

        {/* Date fin */}
        <input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
        />

        {/* PDF */}
        <button
          onClick={imprimerPDF}
          className="ml-auto flex items-center gap-2 px-4 py-2
                     bg-[#472EAD] text-white rounded-xl shadow
                     hover:shadow-lg transition"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2 text-left">Caissier</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2 text-left">Commentaire</th>
            </tr>
          </thead>

          <tbody>
            {dataFiltre.length ? (
              dataFiltre.map((v) => (
                <tr key={v.id} className="odd:bg-gray-50">
                  <td className="px-3 py-2">{v.caissier}</td>
                  <td className="px-3 py-2">{v.date}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatFCFA(v.montant)}
                  </td>
                  <td className="px-3 py-2">{v.commentaire || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  Aucun versement trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Général"
          value={formatFCFA(totalGeneral)}
        />
        <StatCard
          label="Nombre de versements"
          value={dataFiltre.length}
        />
        <StatCard
          label="Dernière mise à jour"
          value={new Date().toLocaleDateString()}
        />
      </div>
    </div>
  );
}

/* ================== STAT CARD ================== */
function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-bold text-lg mt-1">{value}</p>
    </div>
  );
}

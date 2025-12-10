// ==========================================================
// 📜 HistoriqueVersements.jsx — Complet + Commentaire + PDF
// ==========================================================

import React, { useEffect, useState, useMemo } from "react";
import { Search, Calendar, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(n || 0);

export default function HistoriqueVersements() {
  const [versements, setVersements] = useState([]);
  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // Charger les données du localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("versements") || "[]");
    setVersements(data);
  }, []);

  // 🔍 FILTRAGE GLOBAL
  const dataFiltre = useMemo(() => {
    let data = [...versements];

    // Recherche (caissier + commentaire)
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.caissier.toLowerCase().includes(q) ||
          (v.commentaire && v.commentaire.toLowerCase().includes(q))
      );
    }

    // Filtre date début
    if (dateDebut) data = data.filter((v) => v.date >= dateDebut);

    // Filtre date fin
    if (dateFin) data = data.filter((v) => v.date <= dateFin);

    return data;
  }, [search, dateDebut, dateFin, versements]);

  const totalGeneral = dataFiltre.reduce((s, v) => s + v.montant, 0);

  // 🖨 PDF PROFESSIONNEL
  const imprimerPDF = () => {
    if (!dataFiltre.length) {
      alert("Aucun versement à imprimer.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });

    doc.setFontSize(14);
    doc.text("Historique des Versements - LPD Manager", 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [["Caissier", "Date", "Montant", "Commentaire"]],
      body: dataFiltre.map((v) => [
        v.caissier,
        v.date,
        formatFCFA(v.montant),
        v.commentaire || "-",
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text(`TOTAL : ${formatFCFA(totalGeneral)}`, 40, finalY);

    doc.save("Historique_Versements_LPD.pdf");
  };

  return (
    <div className="p-5 space-y-5">

      <h1 className="text-xl font-semibold text-[#472EAD]">
        Historique des Versements
      </h1>

      {/* ====================== FILTRES ====================== */}
      <div className="p-4 bg-white rounded-xl shadow border flex flex-wrap gap-4">

        {/* Recherche */}
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-[#472EAD]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher caissier ou commentaire…"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Date début */}
        <div>
          <label className="text-sm text-gray-700">Date début</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="px-2 py-1 border rounded"
          />
        </div>

        {/* Date fin */}
        <div>
          <label className="text-sm text-gray-700">Date fin</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-2 py-1 border rounded"
          />
        </div>

        {/* Bouton PDF */}
        <button
          onClick={imprimerPDF}
          className="ml-auto px-4 py-2 bg-[#472EAD] text-white rounded-lg flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* ====================== TABLEAU ====================== */}
      <div className="bg-white p-4 rounded-xl shadow border">
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
                <tr key={v.id} className="border-b last:border-0">
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
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                  Aucun versement trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====================== STATISTIQUES ====================== */}
      <div className="bg-white p-4 rounded-xl shadow border grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="p-3 bg-[#F7F5FF] rounded">
          <p className="text-gray-500 text-sm">Total Général</p>
          <p className="text-xl font-bold">{formatFCFA(totalGeneral)}</p>
        </div>

        <div className="p-3 bg-[#F7F5FF] rounded">
          <p className="text-gray-500 text-sm">Nombre de versements</p>
          <p className="text-xl font-bold">{dataFiltre.length}</p>
        </div>

        <div className="p-3 bg-[#F7F5FF] rounded">
          <p className="text-gray-500 text-sm">Dernière mise à jour</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
        </div>

      </div>
    </div>
  );
}

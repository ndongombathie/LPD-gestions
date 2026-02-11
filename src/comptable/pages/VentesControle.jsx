// ==========================================================
// 🧾 ControleVendeur.jsx — Contrôle des ventes vendeurs
// Comptable (Journalier / Mensuel / Impression PDF)
// VERSION API + STABLE (SANS SUPERPOSITION)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Search, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DataTable from "../components/DataTable.jsx";
import controleVenteAPI from "@/services/api/controleVente";

/* ================= UTILS ================= */
const formatFCFA = (value = 0) =>
  Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ================= COMPOSANT ================= */
export default function ControleVendeur() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("journalier");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));

  /* ================= FETCH API ================= */
  useEffect(() => {
    const fetchVentes = async () => {
      try {
        setLoading(true);

        const params =
          mode === "journalier"
            ? { date_debut: date, date_fin: date }
            : {
                date_debut: `${mois}-01`,
                date_fin: `${mois}-31`,
              };

        const data = await controleVenteAPI.getHistoriqueVentes(params);

        // 🔐 Normalisation FRONT
        const normalized = data.map((v) => ({
          id: v.id,
          date: v.date,
          quantite: v.quantite,
          montant: v.montant,
          vendeur: `${v.vendeur?.prenom ?? ""} ${v.vendeur?.nom ?? ""}`.trim(),
          produit: v.produit?.nom ?? "-",
        }));

        setVentes(normalized);
      } catch (e) {
        console.error(e);
        setVentes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVentes();
  }, [date, mois, mode]);

  /* ================= FILTRAGE ================= */
  const ventesFiltrees = useMemo(() => {
    return ventes.filter((v) =>
      v.vendeur.toLowerCase().includes(search.toLowerCase())
    );
  }, [ventes, search]);

  /* ================= STATS ================= */
  const totalVentes = ventesFiltrees.length;
  const totalMontant = ventesFiltrees.reduce(
    (s, v) => s + Number(v.montant || 0),
    0
  );

  /* ================= PDF ================= */
  const imprimerPDF = () => {
    const doc = new jsPDF();
    let y = 18;

    /* ===== LOGO LPD ===== */
    doc.setFillColor(71, 46, 173);
    doc.rect(10, 8, 190, 22, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 22, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 28, { align: "center" });

    y = 42;
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("CONTRÔLE DES VENTES VENDEURS", 14, y);

    y += 7;
    doc.setFontSize(10);
    doc.text(
      `Période : ${
        mode === "journalier" ? `Jour ${date}` : `Mois ${mois}`
      }`,
      14,
      y
    );

    autoTable(doc, {
      startY: y + 6,
      head: [["Vendeur", "Date", "Produit", "Quantité", "Montant (FCFA)"]],
      body: ventesFiltrees.map((v) => [
        v.vendeur,
        v.date,
        v.produit,
        v.quantite,
        formatFCFA(v.montant),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(
      `Total : ${formatFCFA(totalMontant)} FCFA`,
      14,
      finalY
    );

    doc.save(
      `controle_ventes_${mode}_${mode === "journalier" ? date : mois}.pdf`
    );
  };

  /* ================= UI ================= */
  if (loading) return <p className="p-6">Chargement des ventes…</p>;

  return (
    <div className="flex flex-col gap-8 p-6 min-h-screen overflow-x-hidden">

      {/* ===== TITRE ===== */}
      <div>
        <h1 className="text-2xl font-bold text-[#472EAD]">
          Contrôle des ventes vendeurs
        </h1>
        <p className="text-sm text-gray-500">
          Suivi journalier et mensuel des ventes validées
        </p>
      </div>

      {/* ===== FILTRES ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
          placeholder="Nom du vendeur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
        >
          <option value="journalier">Journalier</option>
          <option value="mensuel">Mensuel</option>
        </select>

        {mode === "journalier" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
          />
        ) : (
          <input
            type="month"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
          />
        )}

        <button
          onClick={imprimerPDF}
          className="flex items-center justify-center gap-2 bg-[#472EAD] text-white rounded-xl px-4 py-2 shadow"
        >
          <Printer size={16} /> Imprimer PDF
        </button>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Nombre de ventes" value={totalVentes} />
        <StatCard
          label="Montant total"
          value={`${formatFCFA(totalMontant)} FCFA`}
        />
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded-2xl shadow-md p-4 overflow-x-auto">
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

/* ================= STAT CARD ================= */
function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

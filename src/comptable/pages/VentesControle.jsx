// ==========================================================
// 🧾 ControleVendeur.jsx — VERSION COMPLETE PRO
// Journalier + Mensuel dynamique + Pagination + PDF Global
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DataTable from "../components/DataTable.jsx";
import controleVenteAPI from "@/services/api/controleVente";

/* ================= UTILS ================= */
const formatFCFA = (value = 0) =>
  Number(value).toLocaleString("fr-FR");

const getLastDayOfMonth = (year, month) =>
  new Date(year, month, 0).getDate();

/* ================= COMPOSANT ================= */
export default function ControleVendeur() {
  const [ventes, setVentes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("journalier");

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [date, setDate] = useState(today);
  const [mois, setMois] = useState(currentMonth);
  const [page, setPage] = useState(1);

  /* ================= FETCH API ================= */
  useEffect(() => {
    const fetchVentes = async () => {
      try {
        setLoading(true);

        let params = {};

        if (mode === "journalier") {
          params = {
            date_debut: date || today,
            date_fin: date || today,
            page,
          };
        } else {
          const [year, month] = (mois || currentMonth).split("-");
          const lastDay = getLastDayOfMonth(year, month);

          params = {
            date_debut: `${year}-${month}-01`,
            date_fin: `${year}-${month}-${lastDay}`,
            page,
          };
        }

        const { data, pagination } =
          await controleVenteAPI.getHistoriqueVentes(params);

        const normalized = data.map((v) => ({
          id: v.id,
          date: v.created_at?.slice(0, 10),
          quantite: v.quantite,
          montant: v.montant,
          vendeur: `${v.vendeur?.prenom ?? ""} ${v.vendeur?.nom ?? ""}`.trim(),
          produit: v.produit?.nom ?? "-",
        }));

        setVentes(normalized);
        setPagination(pagination);
      } catch (e) {
        console.error(e);
        setVentes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVentes();
  }, [date, mois, mode, page]);

  /* ================= FILTRE FRONT ================= */
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

  /* ================= PDF GLOBAL ================= */
  const imprimerPDF = async () => {
    try {
      let params = {};

      if (mode === "journalier") {
        params = {
          date_debut: date || today,
          date_fin: date || today,
        };
      } else {
        const [year, month] = (mois || currentMonth).split("-");
        const lastDay = getLastDayOfMonth(year, month);

        params = {
          date_debut: `${year}-${month}-01`,
          date_fin: `${year}-${month}-${lastDay}`,
        };
      }

      const { data } =
        await controleVenteAPI.getHistoriqueVentes(params);

      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("CONTROLE GLOBAL DES VENTES", 14, 20);

      doc.setFontSize(10);
      doc.text(
        `Période : ${
          mode === "journalier"
            ? `Jour ${date}`
            : `Mois ${mois}`
        }`,
        14,
        28
      );

      autoTable(doc, {
        startY: 35,
        head: [["Vendeur", "Date", "Produit", "Quantité", "Montant"]],
        body: data.map((v) => [
          `${v.vendeur?.prenom ?? ""} ${v.vendeur?.nom ?? ""}`,
          v.created_at?.slice(0, 10),
          v.produit?.nom ?? "-",
          v.quantite,
          formatFCFA(v.montant),
        ]),
        styles: { fontSize: 9 },
      });

      const total = data.reduce(
        (s, v) => s + Number(v.montant || 0),
        0
      );

      doc.text(
        `Total Général : ${formatFCFA(total)} FCFA`,
        14,
        doc.lastAutoTable.finalY + 10
      );

      doc.save("controle_global_ventes.pdf");
    } catch (error) {
      console.error("Erreur impression :", error);
    }
  };

  /* ================= UI ================= */
  if (loading) return <p className="p-6">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6 p-6">

      <h1 className="text-2xl font-bold text-[#472EAD]">
        Contrôle des ventes vendeurs
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow">
        <input
          placeholder="Recherche vendeur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-gray-100 text-sm"
        />

        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded bg-gray-100 text-sm"
        >
          <option value="journalier">Journalier</option>
          <option value="mensuel">Mensuel</option>
        </select>

        {mode === "journalier" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded bg-gray-100 text-sm"
          />
        ) : (
          <input
            type="month"
            value={mois}
            onChange={(e) => {
              setMois(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded bg-gray-100 text-sm"
          />
        )}

        <button
          onClick={imprimerPDF}
          className="flex items-center justify-center gap-2 bg-[#472EAD] text-white rounded px-4 py-2"
        >
          <Printer size={16} /> Impression Globale
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Nombre de ventes" value={totalVentes} />
        <StatCard
          label="Montant total"
          value={`${formatFCFA(totalMontant)} FCFA`}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <DataTable
          data={ventesFiltrees}
          columns={[
            { label: "Vendeur", key: "vendeur" },
            { label: "Date", key: "date" },
            { label: "Produit", key: "produit" },
            { label: "Quantité", key: "quantite" },
            {
              label: "Montant",
              key: "montant",
              render: (v) => formatFCFA(v),
            },
          ]}
        />
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center">
        <button
          disabled={!pagination.prev_page_url}
          onClick={() => setPage((p) => p - 1)}
          className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          <ChevronLeft size={16} /> Précédent
        </button>

        <span>
          Page {pagination.current_page} / {pagination.last_page}
        </span>

        <button
          disabled={!pagination.next_page_url}
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Suivant <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

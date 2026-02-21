// ==========================================================
// 🧾 ControleVendeur.jsx — VERSION ENTERPRISE STABLE
// Filtre date fiable + Pagination stable + Stats réelles + PDF logo
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DataTable from "../components/DataTable.jsx";
import controleVenteAPI from "@/services/api/controleVente";

/* ================= UTILITIES ================= */

const formatFCFA = (value = 0) =>
  Number(value || 0)
    .toLocaleString("fr-FR")
    .replace(/\s/g, ".") + " FCFA";

const formatDateFR = (value) =>
  value ? new Date(value).toLocaleDateString("fr-FR") : "-";

const getLastDayOfMonth = (year, month) =>
  new Date(Number(year), Number(month), 0).getDate();

/* ========================================================== */

export default function ControleVendeur() {

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [ventes, setVentes] = useState([]);
  const [ventesGlobales, setVentesGlobales] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("journalier");
  const [date, setDate] = useState(today);
  const [mois, setMois] = useState(currentMonth);
  const [page, setPage] = useState(1);

  /* ================= DATE PARAMS ================= */

  const getDateParams = () => {

    if (mode === "journalier") {
      return { date_debut: date, date_fin: date };
    }

    const [year, month] = mois.split("-");
    const lastDay = getLastDayOfMonth(year, month);

    return {
      date_debut: `${year}-${month}-01`,
      date_fin: `${year}-${month}-${lastDay}`,
    };
  };

  /* ================= FETCH PAGE ================= */

  useEffect(() => {

    const fetchPage = async () => {

      try {
        setLoading(true);

        const { items, pagination } =
          await controleVenteAPI.getCommandes({
            page,
            per_page: 15,
            ...getDateParams(),
          });

        setVentes(items);
        setPagination(pagination || {});
      } catch (error) {
        console.error("Erreur fetch page :", error);
        setVentes([]);
        setPagination({});
      } finally {
        setLoading(false);
      }
    };

    fetchPage();

  }, [page, mode, date, mois]);

  /* ================= FETCH GLOBAL ================= */

  useEffect(() => {

    const fetchGlobal = async () => {

      try {

        let current = 1;
        let last = 1;
        let all = [];

        do {

          const { items, pagination } =
            await controleVenteAPI.getCommandes({
              page: current,
              per_page: 100,
              ...getDateParams(),
            });

          all = [...all, ...items];
          last = pagination.lastPage;
          current++;

        } while (current <= last);

        setVentesGlobales(all);

      } catch (error) {
        console.error("Erreur fetch global :", error);
        setVentesGlobales([]);
      }
    };

    fetchGlobal();

  }, [mode, date, mois]);

  /* ================= FILTER FRONT ================= */

  const ventesFiltrees = useMemo(() => {
    return ventes.filter((v) =>
      (v.vendeurNom || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [ventes, search]);

  /* ================= GLOBAL STATS ================= */

  const totalVentes = ventesGlobales.length;

  const totalMontant = useMemo(() => {
    return ventesGlobales.reduce(
      (sum, v) => sum + Number(v.total || 0),
      0
    );
  }, [ventesGlobales]);

  /* ================= PAGINATION ================= */

  const currentPage = pagination?.currentPage || 1;
  const lastPage = pagination?.lastPage || 1;
  const total = pagination?.total || 0;
  const perPage = pagination?.perPage || 15;

  const hasPagination = total > perPage && lastPage > 1;

  /* ================= PDF ================= */

  const imprimerPDF = async () => {

    if (!ventesGlobales.length) return;

    const doc = new jsPDF();

    // Logo sécurisé
    const img = new Image();
    img.src = "/lpd-logo.png";

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    doc.addImage(img, "PNG", 14, 10, 30, 30);

    doc.setFontSize(18);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text("CONTROLE GLOBAL DES VENTES", 105, 28, { align: "center" });

    const now = new Date();
    doc.setFontSize(10);
    doc.text(
      `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      45
    );

    autoTable(doc, {
      startY: 55,
      head: [["Vendeur", "Client", "Date", "Produits", "Total", "Payé", "Reste"]],
      body: ventesGlobales.map((v) => [
        v.vendeurNom,
        v.clientNom,
        formatDateFR(v.date),
        v.nombreProduits,
        formatFCFA(v.total),
        formatFCFA(v.totalPaye),
        formatFCFA(v.reste),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save("controle_global_ventes.pdf");
  };

  /* ================= UI ================= */

  return (
    <div className="flex flex-col gap-6 p-6">

      <h1 className="text-2xl font-bold text-[#472EAD]">
        Contrôle des ventes vendeurs
      </h1>

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

      {ventesGlobales.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Nombre de ventes" value={totalVentes} />
            <StatCard label="Montant total" value={formatFCFA(totalMontant)} />
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <DataTable
              data={ventesFiltrees}
              columns={[
                { label: "Vendeur", key: "vendeurNom" },
                { label: "Client", key: "clientNom" },
                { label: "Date", key: "date", render: formatDateFR },
                { label: "Produits", key: "nombreProduits" },
                { label: "Total", key: "total", render: formatFCFA },
                { label: "Payé", key: "totalPaye", render: formatFCFA },
                { label: "Reste", key: "reste", render: formatFCFA },
              ]}
            />
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          Aucune vente trouvée pour la période sélectionnée
        </div>
      )}

      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={loading || currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Précédent
          </button>

          <span>Page {currentPage} / {lastPage}</span>

          <button
            disabled={loading || currentPage >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-40"
          >
            Suivant <ChevronRight size={16} />
          </button>
        </div>
      )}

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
// ==========================================================
// 🧾 ControleVendeur.jsx — VERSION ENTERPRISE STABLE
// Filtre deux dates + Loading + Pagination stable + Stats réelles + PDF logo
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Printer, ChevronLeft, ChevronRight, Loader } from "lucide-react";
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

/* ========================================================== */

export default function ControleVendeur() {

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [ventes, setVentes] = useState([]);
  const [ventesGlobales, setVentesGlobales] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState(firstDayOfMonth);
  const [dateFin, setDateFin] = useState(today);
  const [page, setPage] = useState(1);

  /* ================= FETCH PAGE ================= */

  useEffect(() => {

    const fetchPage = async () => {

      try {
        setLoading(true);

        const { items, pagination } =
          await controleVenteAPI.getCommandes({
            page,
            per_page: 15,
            date_debut: dateDebut,
            date_fin: dateFin,
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

  }, [page, dateDebut, dateFin]);

  /* ================= FETCH GLOBAL ================= */

  useEffect(() => {

    const fetchGlobal = async () => {

      try {
        setLoadingGlobal(true);

        let current = 1;
        let last = 1;
        let all = [];

        do {

          const { items, pagination } =
            await controleVenteAPI.getCommandes({
              page: current,
              per_page: 100,
              date_debut: dateDebut,
              date_fin: dateFin,
            });

          all = [...all, ...items];
          last = pagination.lastPage;
          current++;

        } while (current <= last);

        setVentesGlobales(all);

      } catch (error) {
        console.error("Erreur fetch global :", error);
        setVentesGlobales([]);
      } finally {
        setLoadingGlobal(false);
      }
    };

    fetchGlobal();

  }, [dateDebut, dateFin]);

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
      img.onerror = resolve;
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

    // Ajouter la période
    doc.setFontSize(10);
    doc.text(
      `Période du ${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}`,
      14,
      52
    );

    autoTable(doc, {
      startY: 60,
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
      didDrawPage: function(data) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Total: ${ventesGlobales.length} ventes - Montant: ${formatFCFA(totalMontant)}`,
          105,
          285,
          { align: "center" }
        );
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${i} / ${pageCount}`, 190, 290, { align: "right" });
    }

    doc.save("controle_global_ventes.pdf");
  };

  /* ================= UI ================= */

  return (
    <div className="flex flex-col gap-6 p-6">

      <h1 className="text-2xl font-bold text-[#472EAD]">
        Contrôle des ventes vendeurs
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow">

        <input
          placeholder="Recherche vendeur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-gray-100 text-sm"
        />

        <div className="flex items-center gap-2 col-span-2">
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => {
              setDateDebut(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded bg-gray-100 text-sm flex-1"
          />
          <span className="text-gray-500">au</span>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => {
              setDateFin(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded bg-gray-100 text-sm flex-1"
          />
        </div>

        <button
          onClick={imprimerPDF}
          disabled={!ventesGlobales.length || loadingGlobal}
          className="flex items-center justify-center gap-2 bg-[#472EAD] text-white rounded px-4 py-2 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
        >
          {loadingGlobal ? (
            <>
              <Loader size={16} className="animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <Printer size={16} /> Impression Globale
            </>
          )}
        </button>

      </div>

      {/* LOADING GLOBAL */}
      {loadingGlobal && (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          <Loader size={32} className="animate-spin mx-auto mb-4 text-[#472EAD]" />
          Chargement des données globales...
        </div>
      )}

      {/* STATS */}
      {!loadingGlobal && ventesGlobales.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Nombre de ventes" value={totalVentes} />
            <StatCard label="Montant total" value={formatFCFA(totalMontant)} />
          </div>

          {/* LOADING PAGE */}
          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
              <Loader size={32} className="animate-spin mx-auto mb-4 text-[#472EAD]" />
              Chargement des données...
            </div>
          ) : (
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
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!loadingGlobal && !ventesGlobales.length && (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
          Aucune vente trouvée pour la période du {formatDateFR(dateDebut)} au {formatDateFR(dateFin)}
        </div>
      )}

      {/* PAGINATION */}
      {hasPagination && (
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={loading || currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-300 transition-colors"
          >
            <ChevronLeft size={16} /> Précédent
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} / {lastPage} ({total} ventes)
          </span>

          <button
            disabled={loading || currentPage >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-300 transition-colors"
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
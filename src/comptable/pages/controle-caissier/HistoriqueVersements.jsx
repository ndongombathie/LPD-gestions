// ==========================================================
// 📜 HistoriqueVersements.jsx — VERSION API PRO ULTRA STABLE
// ==========================================================

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Search, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import historiqueVersementAPI from "@/services/api/historiqueVersement";

/* ================= FORMAT ================= */

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("fr-FR");
};

const normalizeDate = (d) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

/* ========================================================== */
/* COMPONENT */
/* ========================================================== */

export default function HistoriqueVersements() {
  const [versements, setVersements] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await historiqueVersementAPI.getHistorique({
        page,
        per_page: 10,
      });

      setVersements(res?.items || []);
      setPagination(res?.pagination || null);

      if (res?.pagination?.lastPage && page > res.pagination.lastPage) {
        setPage(1);
      }
    } catch (error) {
      console.error("Erreur chargement versements:", error);
      setVersements([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= FILTRAGE ================= */

  const dataFiltre = useMemo(() => {
    let data = [...versements];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (v) =>
          (v.caissier_nom || "").toLowerCase().includes(q) ||
          (v.observation || "").toLowerCase().includes(q)
      );
    }

    if (dateDebut) {
      data = data.filter(
        (v) => normalizeDate(v.date) >= dateDebut
      );
    }

    if (dateFin) {
      data = data.filter(
        (v) => normalizeDate(v.date) <= dateFin
      );
    }

    return data;
  }, [search, dateDebut, dateFin, versements]);

  const totalGeneral = useMemo(
    () =>
      dataFiltre.reduce(
        (s, v) => s + Number(v.montant || 0),
        0
      ),
    [dataFiltre]
  );

  /* ================= PDF ================= */

  const genererPDF = (data, filename) => {
    if (!data.length) {
      alert("Aucune donnée à imprimer.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Historique des Versements — LPD", 14, 20);

    autoTable(doc, {
      startY: 35,
      head: [["Caissier", "Date", "Montant", "Observation"]],
      body: data.map((v) => [
        v.caissier_nom || "-",
        formatDate(v.date),
        formatFCFA(v.montant),
        v.observation || "-",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    const total = data.reduce(
      (s, v) => s + Number(v.montant || 0),
      0
    );

    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`TOTAL : ${formatFCFA(total)}`, 14, y);

    doc.save(filename);
  };

  const imprimerPage = () =>
    genererPDF(dataFiltre, "Historique_Versements_Page.pdf");

  const imprimerGlobal = async () => {
    try {
      setLoading(true);
      const allData =
        await historiqueVersementAPI.getAllHistorique();
      genererPDF(
        allData || [],
        "Historique_Versements_Global.pdf"
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const disablePrev =
    loading ||
    !pagination ||
    pagination.currentPage <= 1;

  const disableNext =
    loading ||
    !pagination ||
    pagination.currentPage >= pagination.lastPage;

  /* ========================================================== */
  /* UI */
  /* ========================================================== */

  return (
    <div className="bg-gray-50 min-h-screen py-12">

      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-12">

        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#472EAD]">
            Historique des Versements
          </h1>
          <p className="text-sm text-gray-500">
            Suivi détaillé des versements enregistrés
          </p>
        </div>

        {/* FILTER CARD */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-wrap gap-4 items-center">

            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <Search size={18} className="text-[#472EAD]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher caissier ou observation…"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
              />
            </div>

            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
            />

            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-50 text-sm"
            />

            <div className="flex gap-3 ml-auto">
              <button
                onClick={imprimerPage}
                className="flex items-center gap-2 px-4 py-2
                           bg-[#472EAD] text-white rounded-xl shadow"
              >
                <Printer size={16} /> Page
              </button>

              <button
                onClick={imprimerGlobal}
                className="flex items-center gap-2 px-4 py-2
                           bg-emerald-600 text-white rounded-xl shadow"
              >
                <Printer size={16} /> Global
              </button>
            </div>

          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">

              <thead className="bg-[#EFEAFF] text-[#472EAD]">
                <tr>
                  <th className="w-1/4 px-4 py-4 text-left">Caissier</th>
                  <th className="w-1/4 px-4 py-4 text-center">Date</th>
                  <th className="w-1/4 px-4 py-4 text-right">Montant</th>
                  <th className="w-1/4 px-4 py-4 text-left">Observation</th>
                </tr>
              </thead>

              <tbody>
                {dataFiltre.length ? (
                  dataFiltre.map((v) => (
                    <tr key={v.id} className="odd:bg-gray-50 border-t">
                      <td className="px-4 py-4">{v.caissier_nom || "-"}</td>
                      <td className="px-4 py-4 text-center">
                        {formatDate(v.date)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {formatFCFA(v.montant)}
                      </td>
                      <td className="px-4 py-4 truncate">
                        {v.observation || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Aucun versement trouvé
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {pagination && pagination.lastPage > 1 && (
          <div className="bg-white rounded-2xl shadow-md p-5 flex justify-between items-center">
            <button
              disabled={disablePrev}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Précédent
            </button>

            <span>
              Page {pagination.currentPage} / {pagination.lastPage}
            </span>

            <button
              disabled={disableNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-500">
            Chargement...
          </div>
        )}

      </div>
    </div>
  );
}

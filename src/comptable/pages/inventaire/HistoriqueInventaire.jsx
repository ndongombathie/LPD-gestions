import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Printer, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import historiqueInventaireAPI from "@/services/api/historiqueInventaire";

/* ====================================================== */
/* UTILS */
/* ====================================================== */

const fcfa = (v) =>
  `${Number(v || 0)
    .toLocaleString("fr-FR")
    .replace(/\s/g, ".")} FCFA`;

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("fr-FR");
};

/* ====================================================== */
/* COMPOSANT */
/* ====================================================== */

export default function HistoriqueInventaires() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("tous");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH PAGE COURANTE ================= */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await historiqueInventaireAPI.getHistorique({
        page,
        per_page: 15,
        type: type !== "tous" ? type : undefined,
      });

      setItems(res.items);
      setPagination(res.pagination);

      if (res.pagination?.lastPage && page > res.pagination.lastPage) {
        setPage(1);
      }
    } catch (err) {
      console.error("Erreur historique:", err);
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= FILTRE RECHERCHE ================= */

  const itemsFiltres = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((h) =>
      `${h.type} ${h.date_debut} ${h.date_fin}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  /* ================= PDF GENERATOR ================= */

  const generatePDF = (data, filename) => {
    const doc = new jsPDF();

    doc.setFillColor(71, 46, 173);
    doc.rect(10, 8, 190, 22, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(24);
    doc.text("LPD", 105, 22, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 28, { align: "center" });

    doc.setTextColor(0);

    autoTable(doc, {
      startY: 48,
      head: [[
        "Type",
        "Date Début",
        "Date Fin",
        "Prix Achat Total",
        "Valeur Sortie",
        "Valeur Estimée",
        "Bénéfice",
      ]],
      body: data.map((h) => [
        h.type,
        formatDate(h.date_debut),
        formatDate(h.date_fin),
        fcfa(h.prix_achat_total),
        fcfa(h.prix_valeur_sortie_total),
        fcfa(h.valeur_estimee_total),
        fcfa(h.benefice_total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save(filename);
  };

  /* ================= IMPRESSION PAGE ACTUELLE ================= */

  const imprimerPage = () => {
    if (!itemsFiltres.length) {
      alert("Aucune donnée à imprimer");
      return;
    }

    generatePDF(itemsFiltres, `Historique_Page_${page}.pdf`);
  };

  /* ================= IMPRESSION TOUTES LES PAGES ================= */

  const imprimerToutesLesPages = async () => {
    try {
      setLoading(true);

      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res = await historiqueInventaireAPI.getHistorique({
          page: currentPage,
          per_page: 50,
          type: type !== "tous" ? type : undefined,
        });

        allData = [...allData, ...res.items];
        lastPage = res.pagination?.lastPage || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      if (!allData.length) {
        alert("Aucune donnée à imprimer");
        return;
      }

      generatePDF(allData, "Historique_Complet_Toutes_Pages.pdf");

    } catch (error) {
      console.error("Erreur impression globale:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PAGINATION ================= */

  const hasPagination =
    pagination &&
    pagination.total > 0 &&
    pagination.lastPage > 1;

  const disablePrev =
    loading ||
    !pagination ||
    pagination.currentPage <= 1;

  const disableNext =
    loading ||
    !pagination ||
    pagination.currentPage >= pagination.lastPage;

  /* ====================================================== */
  /* UI */
  /* ====================================================== */

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-700 mb-10">
        Historique des Inventaires
      </h1>

      {/* BARRE OUTILS */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-12">
        <div className="flex flex-wrap gap-6 items-center">

          <select
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
            className="border px-4 py-2 rounded-lg shadow-sm"
          >
            <option value="tous">Tous</option>
            <option value="Boutique">Boutique</option>
            <option value="Depot">Dépôt</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              className="border pl-10 px-4 py-2 rounded-lg shadow-sm w-64"
              placeholder="Recherche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={imprimerPage}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow flex gap-2 items-center"
          >
            <Printer size={18} />
            Imprimer page actuelle
          </button>

          <button
            onClick={imprimerToutesLesPages}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg shadow flex gap-2 items-center"
          >
            <Printer size={18} />
            Imprimer toutes les pages
          </button>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-md rounded-xl overflow-x-auto mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Date Début</th>
              <th className="p-4 text-left">Date Fin</th>
              <th className="p-4 text-right">Prix Achat</th>
              <th className="p-4 text-right">Valeur Sortie</th>
              <th className="p-4 text-right">Valeur Estimée</th>
              <th className="p-4 text-right">Bénéfice</th>
            </tr>
          </thead>

          <tbody>
            {itemsFiltres.map((h) => (
              <tr key={h.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{h.type}</td>
                <td className="p-4">{formatDate(h.date_debut)}</td>
                <td className="p-4">{formatDate(h.date_fin)}</td>
                <td className="p-4 text-right">{fcfa(h.prix_achat_total)}</td>
                <td className="p-4 text-right">{fcfa(h.prix_valeur_sortie_total)}</td>
                <td className="p-4 text-right">{fcfa(h.valeur_estimee_total)}</td>
                <td className="p-4 text-right font-semibold text-green-600">
                  {fcfa(h.benefice_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {hasPagination && (
        <div className="flex justify-between items-center mt-8">
          <button
            disabled={disablePrev}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            Précédent
          </button>

          <span className="font-medium">
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>

          <button
            disabled={disableNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {loading && <p className="mt-4">Chargement...</p>}
    </div>
  );
}

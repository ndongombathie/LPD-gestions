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

  /* ================= FETCH ================= */

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

      // 🔥 Sécurité : si page dépasse dernière page
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
      `${h.produit?.nom || ""} ${h.vendeur?.nom || ""} ${h.vendeur?.prenom || ""} ${h.date || ""}`
        .toLowerCase()
        .includes(q)
    );

  }, [items, search]);

  /* ================= IMPRESSION ================= */

  const imprimer = async () => {

    try {
      setLoading(true);

      // 🔥 Utilise version ALL si dispo
      const allItems = await historiqueInventaireAPI.getAllHistorique({
        per_page: 15,
        type: type !== "tous" ? type : undefined,
      });

      if (!allItems.length) {
        alert("Aucune donnée à imprimer");
        return;
      }

      const doc = new jsPDF();

      // HEADER LPD
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
          "Date",
          "Produit",
          "Vendeur",
          "Quantité",
          "Prix Unitaire",
          "Montant",
        ]],
        body: allItems.map((h) => [
          formatDate(h.date),
          h.produit?.nom || "-",
          `${h.vendeur?.nom || ""} ${h.vendeur?.prenom || ""}`,
          h.quantite,
          fcfa(h.prix_unitaire),
          fcfa(h.montant),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 46, 173] },
      });

      doc.save("Historique_Complet.pdf");

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= PAGINATION CONDITIONS ================= */

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
            <option value="boutique">Boutique</option>
            <option value="depot">Dépôt</option>
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
            onClick={imprimer}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow flex gap-2 items-center"
          >
            <Printer size={18} />
            Imprimer toutes les pages
          </button>

        </div>
      </div>

      {/* CARTES */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-14">
        <StatCard title="Total lignes affichées" value={itemsFiltres.length} />
        <StatCard title="Page actuelle" value={pagination?.currentPage || 1} />
        <StatCard title="Total en base" value={pagination?.total || 0} />
        <StatCard title="Type sélectionné" value={type.toUpperCase()} />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-md rounded-xl overflow-x-auto mb-10">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Produit</th>
              <th className="p-4 text-left">Vendeur</th>
              <th className="p-4 text-center">Quantité</th>
              <th className="p-4 text-right">Prix Unitaire</th>
              <th className="p-4 text-right">Montant</th>
            </tr>
          </thead>

          <tbody>
            {itemsFiltres.map((h) => (
              <tr key={h.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{formatDate(h.date)}</td>
                <td className="p-4">{h.produit?.nom || "-"}</td>
                <td className="p-4">
                  {h.vendeur?.nom || ""} {h.vendeur?.prenom || ""}
                </td>
                <td className="p-4 text-center">{h.quantite}</td>
                <td className="p-4 text-right">{fcfa(h.prix_unitaire)}</td>
                <td className="p-4 text-right font-semibold">
                  {fcfa(h.montant)}
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

/* ====================================================== */
/* CARD COMPONENT */
/* ====================================================== */

function StatCard({ title, value }) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}

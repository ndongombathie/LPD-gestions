// ==========================================================
// 📦 InventaireDepot.jsx — VERSION PRO COMPLETE
// ==========================================================

import React, { useEffect, useState, useCallback } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import inventaireDepotAPI from "@/services/api/inventaireDepot";

const fcfa = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

export default function InventaireDepot() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const perPage = 25;

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await inventaireDepotAPI.getInventaire({
        page,
        per_page: perPage,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
      });

      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      setError("Erreur chargement inventaire dépôt");
    } finally {
      setLoading(false);
    }
  }, [page, dateDebut, dateFin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FILTRE =================
  const appliquerFiltre = () => {
    if (dateDebut && dateFin && dateDebut > dateFin) {
      alert("Date début invalide.");
      return;
    }
    setPage(1);
  };

  // ================= IMPRESSION PAGE =================
  const imprimerPage = () => {
    const doc = new jsPDF();

    doc.setFillColor(71, 46, 173);
    doc.rect(10, 8, 190, 22, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 22, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 28, {
      align: "center",
    });

    doc.setTextColor(0);
    doc.setFontSize(11);

    const periode =
      dateDebut && dateFin
        ? `${dateDebut} → ${dateFin}`
        : "Toutes périodes";

    doc.text(`Période : ${periode}`, 14, 40);
    doc.text(`Page : ${pagination?.currentPage}`, 150, 40);

    autoTable(doc, {
      startY: 48,
      head: [[
        "Produit",
        "Catégorie",
        "Entrées",
        "Sorties",
        "Stock",
        "Valeur sortie",
        "Valeur estimée",
      ]],
      body: items.map((p) => [
        p.nom,
        p.categorie,
        p.total_entree,
        p.total_sortie,
        p.stock_restant,
        fcfa(p.valeur_sortie),
        fcfa(p.valeur_estimee),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save(`Inventaire_Depot_Page_${pagination?.currentPage}.pdf`);
  };

  // ================= IMPRESSION GLOBALE =================
  const imprimerGlobal = async () => {
    try {
      const doc = new jsPDF();

      doc.setFillColor(71, 46, 173);
      doc.rect(10, 8, 190, 22, "F");

      doc.setTextColor(245, 128, 32);
      doc.setFontSize(26);
      doc.text("LPD", 105, 22, { align: "center" });

      doc.setTextColor(255);
      doc.setFontSize(10);
      doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 28, {
        align: "center",
      });

      doc.setTextColor(0);
      doc.setFontSize(11);

      const periode =
        dateDebut && dateFin
          ? `${dateDebut} → ${dateFin}`
          : "Toutes périodes";

      doc.text(`Période : ${periode}`, 14, 40);

      let current = 1;
      let lastPage = 1;
      let allItems = [];

      do {
        const res = await inventaireDepotAPI.getInventaire({
          page: current,
          per_page: perPage,
          date_debut: dateDebut || undefined,
          date_fin: dateFin || undefined,
        });

        allItems = [...allItems, ...res.items];
        lastPage = res.pagination.lastPage;
        current++;
      } while (current <= lastPage);

      autoTable(doc, {
        startY: 48,
        head: [[
          "Produit",
          "Catégorie",
          "Entrées",
          "Sorties",
          "Stock",
          "Valeur sortie",
          "Valeur estimée",
        ]],
        body: allItems.map((p) => [
          p.nom,
          p.categorie,
          p.total_entree,
          p.total_sortie,
          p.stock_restant,
          fcfa(p.valeur_sortie),
          fcfa(p.valeur_estimee),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 46, 173] },
      });

      doc.save("Inventaire_Depot_GLOBAL.pdf");
    } catch (err) {
      alert("Erreur lors de l'impression globale.");
    }
  };

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER + BOUTONS */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-700">
          Inventaire Dépôt — Comptable
        </h1>

        <div className="flex gap-3">
          <button
            onClick={imprimerPage}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimer page
          </button>

          <button
            onClick={imprimerGlobal}
            className="bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimer global
          </button>
        </div>
      </div>

      {/* FILTRE */}
      <div className="flex gap-4 bg-white p-4 rounded shadow">
        <input
          type="date"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <button
          onClick={appliquerFiltre}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Appliquer filtre
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Produit</th>
              <th className="p-3 text-left">Catégorie</th>
              <th className="p-3 text-center">Entrées</th>
              <th className="p-3 text-center">Sorties</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-right">Valeur sortie</th>
              <th className="p-3 text-right">Valeur estimée</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.nom}</td>
                <td className="p-3">{p.categorie}</td>
                <td className="p-3 text-center">{p.total_entree}</td>
                <td className="p-3 text-center">{p.total_sortie}</td>
                <td className="p-3 text-center font-semibold">
                  {p.stock_restant}
                </td>
                <td className="p-3 text-right">
                  {fcfa(p.valeur_sortie)}
                </td>
                <td className="p-3 text-right font-semibold">
                  {fcfa(p.valeur_estimee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="flex justify-between items-center text-sm">
          <button
            disabled={!pagination.prevPageUrl}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Précédent
          </button>

          <span>
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>

          <button
            disabled={!pagination.nextPageUrl}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================================
// 🏪 InventaireBoutique.jsx — VERSION PRO COMPLETE
// ==========================================================

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import inventaireBoutiqueAPI from "@/services/api/inventaireBoutique";

const fcfa = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

export default function InventaireBoutique() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [dateApi, setDateApi] = useState(null);

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

      const res = await inventaireBoutiqueAPI.getInventaire({
        page,
        per_page: perPage,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
      });

      setItems(res.items);
      setPagination(res.pagination);
      setDateApi(res.date);
    } catch {
      setError("Erreur chargement inventaire boutique");
    } finally {
      setLoading(false);
    }
  }, [page, dateDebut, dateFin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FUSION DOUBLONS =================
  const rows = useMemo(() => {
    const map = new Map();

    items.forEach((p) => {
      if (!map.has(p.produit_id)) {
        map.set(p.produit_id, { ...p });
      } else {
        const existing = map.get(p.produit_id);
        existing.stock_initial += p.stock_initial;
        existing.quantite_vendue += p.quantite_vendue;
        existing.total_vendu += p.total_vendu;
        existing.total_restant += p.total_restant;
      }
    });

    return Array.from(map.values()).map((p) => ({
      ...p,
      restant: p.stock_initial - p.quantite_vendue,
      resultat: p.total_vendu - p.stock_initial * p.prix_achat,
    }));
  }, [items]);

  // ================= FILTRE =================
  const appliquerFiltre = () => {
    if (dateDebut && dateFin && dateDebut > dateFin) {
      alert("Date invalide");
      return;
    }
    setPage(1);
  };

  // ================= PDF PAGE =================
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
    doc.text(`Date inventaire : ${dateApi ?? ""}`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [[
        "Produit",
        "Stock initial",
        "Vendu",
        "Restant",
        "Total vendu",
        "Résultat",
      ]],
      body: rows.map((p) => [
        p.nom,
        p.stock_initial,
        p.quantite_vendue,
        p.restant,
        fcfa(p.total_vendu),
        fcfa(p.resultat),
      ]),
    });

    doc.save("Inventaire_Boutique_Page.pdf");
  };

  if (loading) return <p className="p-6">Chargement...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-700">
          Inventaire Boutique — Comptable
        </h1>

        <button
          onClick={imprimerPage}
          className="bg-indigo-600 text-white px-4 py-2 rounded flex gap-2"
        >
          <Printer size={16} />
          Imprimer page
        </button>
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
              <th className="p-3 text-center">Stock initial</th>
              <th className="p-3 text-center">Vendu</th>
              <th className="p-3 text-center">Restant</th>
              <th className="p-3 text-right">Total vendu</th>
              <th className="p-3 text-right">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.produit_id} className="border-t">
                <td className="p-3">{p.nom}</td>
                <td className="p-3 text-center">{p.stock_initial}</td>
                <td className="p-3 text-center">{p.quantite_vendue}</td>
                <td className="p-3 text-center">{p.restant}</td>
                <td className="p-3 text-right">{fcfa(p.total_vendu)}</td>
                <td className="p-3 text-right font-semibold">
                  {fcfa(p.resultat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="flex justify-between text-sm">
          <button
            disabled={!pagination.prevPageUrl}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded"
          >
            Précédent
          </button>

          <span>
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>

          <button
            disabled={!pagination.nextPageUrl}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

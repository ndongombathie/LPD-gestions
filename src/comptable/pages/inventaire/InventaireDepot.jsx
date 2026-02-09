import React, { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { inventaireDepotAPI } from "@/services/api/inventaireDepot";

/* ===================== UTILS ===================== */
const fcfa = (v) =>
  `${Number(v || 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

const formatDate = (d) => d.replace(/-/g, ".");

/* ===================== COMPONENT ===================== */
export default function InventaireDepot() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ============ FETCH API ============ */
  useEffect(() => {
    const fetchInventaire = async () => {
      try {
        setLoading(true);
        const data = await inventaireDepotAPI.getInventaire();
        setProduits(data);
      } catch (err) {
        setError("Erreur lors du chargement de l’inventaire dépôt");
      } finally {
        setLoading(false);
      }
    };

    fetchInventaire();
  }, []);

  /* ============ CALCULS ============ */
  const statsProduits = useMemo(() => {
    return produits.map((p) => {
      const entrees = p.quantite_entree || 0;
      const sorties = p.quantite_sortie || 0;
      const restant = entrees - sorties;

      const totalVentes = sorties * (p.prix_vente_depot || 0);
      const totalAchats = entrees * (p.prix_achat || 0);
      const resultat = totalVentes - totalAchats;

      return {
        nom: p.nom,
        entrees,
        sorties,
        restant,
        nbReappro: p.nb_reappro || 0,
        fournisseurs: p.fournisseurs || "-",
        totalVentes,
        totalAchats,
        resultat,
      };
    });
  }, [produits]);

  /* ============ TOTAUX ============ */
  const totalVentesGlobal = statsProduits.reduce(
    (s, p) => s + p.totalVentes,
    0
  );
  const totalAchatsGlobal = statsProduits.reduce(
    (s, p) => s + p.totalAchats,
    0
  );
  const resultatGlobal = totalVentesGlobal - totalAchatsGlobal;

  /* ============ PDF ============ */
  const imprimerInventaire = () => {
    if (!dateDebut || !dateFin) {
      alert("Veuillez renseigner une date de début et de fin.");
      return;
    }

    if (dateDebut > dateFin) {
      alert("La date de début ne peut pas être supérieure à la date de fin.");
      return;
    }

    const doc = new jsPDF();

    /* ===== LOGO LPD ===== */
    doc.setFillColor(71, 46, 173);
    doc.roundedRect(14, 10, 180, 24, 3, 3, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("LPD", 105, 26, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(
      "LIBRAIRIE PAPETERIE DARADJI",
      105,
      32,
      { align: "center" }
    );

    let startY = 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("INVENTAIRE DÉPÔT", 14, startY);

    doc.setFontSize(11);
    doc.text(
      `Période : ${formatDate(dateDebut)} → ${formatDate(dateFin)}`,
      14,
      startY + 7
    );

    autoTable(doc, {
      startY: startY + 14,
      head: [[
        "Produit",
        "Entrées",
        "Sorties",
        "Restant",
        "Réappro",
        "Fournisseurs",
        "Total ventes",
        "Résultat",
      ]],
      body: statsProduits.map((p) => [
        p.nom,
        p.entrees,
        p.sorties,
        p.restant,
        p.nbReappro,
        p.fournisseurs,
        fcfa(p.totalVentes),
        fcfa(p.resultat),
      ]),
    });

    let y = doc.lastAutoTable.finalY + 10;

    doc.text(`Total ventes : ${fcfa(totalVentesGlobal)}`, 14, y);
    doc.text(`Total achats : ${fcfa(totalAchatsGlobal)}`, 14, y + 6);
    doc.text(`Résultat global : ${fcfa(resultatGlobal)}`, 14, y + 12);

    doc.save("Inventaire_Depot.pdf");
  };

  /* ============ UI ============ */
  if (loading) return <p className="p-6">Chargement de l’inventaire dépôt…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 flex flex-col gap-8 min-h-screen overflow-x-auto">
      <h1 className="text-2xl font-bold text-indigo-700">
        Inventaire Dépôt — Comptable
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
        />
        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
        />
        <button
          onClick={imprimerInventaire}
          className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 justify-center"
        >
          <Printer size={18} /> Imprimer inventaire
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Produit</th>
              <th className="p-2">Entrées</th>
              <th className="p-2">Sorties</th>
              <th className="p-2">Restant</th>
              <th className="p-2">Réappro</th>
              <th className="p-2">Fournisseurs</th>
              <th className="p-2">Total ventes</th>
              <th className="p-2">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {statsProduits.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{p.nom}</td>
                <td className="p-2 text-center">{p.entrees}</td>
                <td className="p-2 text-center">{p.sorties}</td>
                <td className="p-2 text-center">{p.restant}</td>
                <td className="p-2 text-center">{p.nbReappro}</td>
                <td className="p-2">{p.fournisseurs}</td>
                <td className="p-2 text-right">{fcfa(p.totalVentes)}</td>
                <td
                  className={`p-2 text-right font-semibold ${
                    p.resultat < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {fcfa(p.resultat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

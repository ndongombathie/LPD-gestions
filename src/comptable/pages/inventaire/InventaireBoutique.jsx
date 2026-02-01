import React, { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =========================================================
   DONNÉES SIMULÉES (API PLUS TARD)
========================================================= */

const produits = [
  {
    id: 1,
    nom: "Bic",
    prixAchat: 50,
    prixMin: 100,
    seuilStock: 10,
    reapprovisionnements: [
      { date: "2025-01-01", quantite: 100 },
      { date: "2025-01-10", quantite: 50 },
    ],
  },
];

const ventes = [
  {
    produitId: 1,
    date: "2025-01-12",
    quantite: 10,
    prixVente: 120,
    vendeur: "vendeur",
  },
  {
    produitId: 1,
    date: "2025-01-13",
    quantite: 5,
    prixVente: 80,
    vendeur: "responsable",
  },
];

/* =========================================================
   UTILS
========================================================= */
const fcfa = (v) =>
  `${Number(v || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} FCFA`;

const formatDate = (d) => d.replace(/-/g, ".");

/* =========================================================
   COMPOSANT
========================================================= */
export default function InventaireBoutique() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [historique, setHistorique] = useState([]);

  /* ================= FILTRAGE VENTES ================= */
  const ventesFiltrees = useMemo(() => {
    return ventes.filter((v) => {
      if (!dateDebut && !dateFin) return true;
      if (dateDebut && !dateFin) return v.date === dateDebut;
      if (dateDebut && dateFin)
        return v.date >= dateDebut && v.date <= dateFin;
      return true;
    });
  }, [dateDebut, dateFin]);

  /* ================= CALCULS PRODUITS ================= */
  const statsProduits = produits.map((p) => {
    const totalAppro = p.reapprovisionnements.reduce(
      (s, r) => s + r.quantite,
      0
    );

    const ventesProduit = ventesFiltrees.filter(
      (v) => v.produitId === p.id
    );

    const totalVendu = ventesProduit.reduce(
      (s, v) => s + v.quantite,
      0
    );

    const restant = totalAppro - totalVendu;

    const totalVentes = ventesProduit.reduce(
      (s, v) => s + v.quantite * v.prixVente,
      0
    );

    const totalAchats = totalAppro * p.prixAchat;
    const resultat = totalVentes - totalAchats;

    return {
      nom: p.nom,
      totalAppro,
      totalVendu,
      restant,
      nbReappro: p.reapprovisionnements.length,
      totalVentes,
      totalAchats,
      resultat,
      prixMin: p.prixMin,
      seuilStock: p.seuilStock,
    };
  });

  /* ================= TOTAUX ================= */
  const totalVentesGlobal = statsProduits.reduce(
    (s, p) => s + p.totalVentes,
    0
  );
  const totalAchatsGlobal = statsProduits.reduce(
    (s, p) => s + p.totalAchats,
    0
  );
  const resultatGlobal = totalVentesGlobal - totalAchatsGlobal;

  /* ================= ALERTES ================= */
  const alertes = [];

  statsProduits.forEach((p) => {
    if (p.resultat < 0) {
      alertes.push({
        type: "danger",
        message: `Perte sur ${p.nom} : ${fcfa(p.resultat)}`,
      });
    }
    if (p.restant <= p.seuilStock) {
      alertes.push({
        type: "warning",
        message: `Stock critique : ${p.nom} (${p.restant} unités restantes)`,
      });
    }
  });

  ventesFiltrees.forEach((v) => {
    const produit = produits.find((p) => p.id === v.produitId);
    if (v.prixVente < produit.prixMin && v.vendeur === "vendeur") {
      alertes.push({
        type: "danger",
        message: `Vente INTERDITE sous prix minimum (${produit.nom})`,
      });
    }
    if (v.prixVente < produit.prixMin && v.vendeur === "responsable") {
      alertes.push({
        type: "info",
        message: `Vente responsable sous prix minimum (${produit.nom})`,
      });
    }
  });

  /* ================= IMPRESSION PDF ================= */
  const imprimerInventaire = () => {
    // ✅ VALIDATION
    if (!dateDebut || !dateFin) {
      alert("Veuillez renseigner une date de début et une date de fin.");
      return;
    }

    if (dateDebut > dateFin) {
      alert("La date de début ne peut pas être supérieure à la date de fin.");
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    const periode = `${formatDate(dateDebut)} → ${formatDate(dateFin)}`;

    doc.setFontSize(14);
    doc.text("INVENTAIRE BOUTIQUE", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Période : ${periode}`, 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [[
        "Produit",
        "Entrées",
        "Vendus",
        "Restant",
        "Réappro",
        "Total ventes",
        "Résultat",
      ]],
      body: statsProduits.map((p) => [
        p.nom,
        p.totalAppro,
        p.totalVendu,
        p.restant,
        p.nbReappro,
        fcfa(p.totalVentes),
        fcfa(p.resultat),
      ]),
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.text(`Total ventes : ${fcfa(totalVentesGlobal)}`, 14, y);
    doc.text(`Total achats : ${fcfa(totalAchatsGlobal)}`, 14, y + 6);
    doc.text(`Résultat global : ${fcfa(resultatGlobal)}`, 14, y + 12);

    doc.save("Inventaire_Boutique.pdf");

    setHistorique((h) => [
      ...h,
      {
        date: new Date().toISOString(),
        periode,
        totalVentesGlobal,
        resultatGlobal,
      },
    ]);
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-indigo-700">
        Inventaire Boutique — Comptable
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="date"
          className="border px-3 py-2"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
        />
        <input
          type="date"
          className="border px-3 py-2"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
        />
        <button
          onClick={imprimerInventaire}
          className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-2 justify-center"
        >
          <Printer size={18} /> Imprimer inventaire
        </button>
      </div>

      {/* ALERTES */}
      <div className="space-y-2">
        {alertes.map((a, i) => (
          <div
            key={i}
            className={`p-3 rounded ${
              a.type === "danger"
                ? "bg-red-100 text-red-700"
                : a.type === "warning"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {a.message}
          </div>
        ))}
      </div>

      {/* TABLEAU */}
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Produit</th>
            <th className="p-2">Entrées</th>
            <th className="p-2">Vendus</th>
            <th className="p-2">Restant</th>
            <th className="p-2">Réappro</th>
            <th className="p-2">Total ventes</th>
            <th className="p-2">Résultat</th>
          </tr>
        </thead>
        <tbody>
          {statsProduits.map((p, i) => (
            <tr key={i}>
              <td className="p-2">{p.nom}</td>
              <td className="p-2 text-center">{p.totalAppro}</td>
              <td className="p-2 text-center">{p.totalVendu}</td>
              <td className="p-2 text-center">{p.restant}</td>
              <td className="p-2 text-center">{p.nbReappro}</td>
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
  );
}

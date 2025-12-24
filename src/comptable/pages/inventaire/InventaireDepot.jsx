import React, { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =====================================================
   DONNÉES SIMULÉES (API PLUS TARD)
===================================================== */

const produits = [
  {
    id: 1,
    nom: "Bic",
    prixAchat: 50,
    prixVenteDepot: 120,
    reapprovisionnements: [
      { date: "2025-01-01", quantite: 100, fournisseur: "Fournisseur A" },
      { date: "2025-01-15", quantite: 50, fournisseur: "Fournisseur B" },
    ],
  },
];

const sorties = [
  {
    produitId: 1,
    date: "2025-01-20",
    quantite: 30,
    prixVente: 120,
    destination: "boutique",
  },
];

/* =====================================================
   UTILS
===================================================== */
const fcfa = (v) =>
  `${Number(v || 0)
    .toLocaleString("fr-FR")
    .replace(/\s/g, ".")} FCFA`;

const formatDate = (d) => d.replace(/-/g, ".");

/* =====================================================
   COMPOSANT
===================================================== */
export default function InventaireDepot() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [historiqueInventaires, setHistoriqueInventaires] = useState([]);

  /* ================= FILTRAGE SORTIES ================= */
  const sortiesFiltrees = useMemo(() => {
    return sorties.filter((s) => {
      if (!dateDebut && !dateFin) return true;
      if (dateDebut && !dateFin) return s.date === dateDebut;
      if (dateDebut && dateFin)
        return s.date >= dateDebut && s.date <= dateFin;
      return true;
    });
  }, [dateDebut, dateFin]);

  /* ================= CALCULS PAR PRODUIT ================= */
  const statsProduits = produits.map((p) => {
    const entrees = p.reapprovisionnements.reduce(
      (s, r) => s + r.quantite,
      0
    );

    const sortiesProduit = sortiesFiltrees.filter(
      (s) => s.produitId === p.id
    );

    const totalSorties = sortiesProduit.reduce(
      (s, srt) => s + srt.quantite,
      0
    );

    const restant = entrees - totalSorties;

    const totalVentes = sortiesProduit.reduce(
      (s, srt) => s + srt.quantite * srt.prixVente,
      0
    );

    const totalAchats = entrees * p.prixAchat;
    const resultat = totalVentes - totalAchats;

    const fournisseurs = [
      ...new Set(p.reapprovisionnements.map((r) => r.fournisseur)),
    ];

    return {
      nom: p.nom,
      entrees,
      sorties: totalSorties,
      restant,
      nbReappro: p.reapprovisionnements.length,
      fournisseurs: fournisseurs.join(", "),
      totalVentes,
      totalAchats,
      resultat,
    };
  });

  /* ================= TOTAUX GLOBAUX ================= */
  const totalVentesGlobal = statsProduits.reduce(
    (s, p) => s + p.totalVentes,
    0
  );

  const totalAchatsGlobal = statsProduits.reduce(
    (s, p) => s + p.totalAchats,
    0
  );

  const resultatGlobal = totalVentesGlobal - totalAchatsGlobal;

  /* ================= IMPRESSION + HISTORIQUE ================= */
  const imprimerInventaire = () => {
    const doc = new jsPDF();
    let y = 20;

    const periode = `${dateDebut ? formatDate(dateDebut) : "Début"} → ${
      dateFin ? formatDate(dateFin) : "Aujourd’hui"
    }`;

    /* ===== PDF ===== */
    doc.setFontSize(14);
    doc.text("INVENTAIRE DÉPÔT", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(`Période : ${periode}`, 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
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

    y = doc.lastAutoTable.finalY + 10;

    doc.text(`Total ventes : ${fcfa(totalVentesGlobal)}`, 14, y);
    doc.text(`Total achats : ${fcfa(totalAchatsGlobal)}`, 14, y + 6);
    doc.text(`Résultat global : ${fcfa(resultatGlobal)}`, 14, y + 12);

    doc.save("Inventaire_Depot.pdf");

    /* ===== 🔥 ENREGISTREMENT AUTOMATIQUE HISTORIQUE ===== */
    setHistoriqueInventaires((prev) => [
      ...prev,
      {
        dateImpression: new Date().toLocaleString("fr-FR"),
        periode,
        totalVentes: totalVentesGlobal,
        totalAchats: totalAchatsGlobal,
        resultatGlobal,
        details: statsProduits,
      },
    ]);
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-indigo-700">
        Inventaire Dépôt — Comptable
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

      {/* TABLEAU */}
      <table className="w-full border-collapse">
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
            <tr key={i}>
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
  );
}

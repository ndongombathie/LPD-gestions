import React, { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { inventaireBoutiqueAPI } from "@/services/api/inventaireBoutique";

/* =========================================================
   UTILS
========================================================= */
const fcfa = (v) =>
  `${Number(v || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} FCFA`;

const formatDate = (d) => (d ? d.replace(/-/g, ".") : "");

/* =========================================================
   COMPOSANT
========================================================= */
export default function InventaireBoutique() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [historique, setHistorique] = useState([]);

  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= FETCH API ================= */
  useEffect(() => {
    const fetchInventaire = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await inventaireBoutiqueAPI.getInventaire();

        // ✅ GARANTIR UN TABLEAU
        const inventaireArray = Array.isArray(data)
          ? data
          : data?.inventaire || data?.data || [];

        setProduits(inventaireArray);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l’inventaire");
      } finally {
        setLoading(false);
      }
    };

    fetchInventaire();
  }, []);

  /* ================= CALCULS ================= */
  const statsProduits = useMemo(() => {
    if (!Array.isArray(produits)) return [];

    return produits.map((p) => {
      const totalAppro = Number(p.quantite_entree || 0);
      const totalVendu = Number(p.quantite_vendue || 0);
      const restant = totalAppro - totalVendu;

      const prixMin = Number(p.prix_min || 0);
      const prixAchat = Number(p.prix_achat || 0);

      const totalVentes = totalVendu * prixMin;
      const totalAchats = totalAppro * prixAchat;
      const resultat = totalVentes - totalAchats;

      return {
        nom: p.nom || "—",
        totalAppro,
        totalVendu,
        restant,
        nbReappro: Number(p.nb_reappro || 0),
        totalVentes,
        totalAchats,
        resultat,
        prixMin,
        seuilStock: Number(p.seuil_stock || 0),
      };
    });
  }, [produits]);

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

  /* ================= LOGO ENTREPRISE ================= */
  const logoX = 14;
  const logoY = 10;
  const logoWidth = 180;
  const logoHeight = 22;

  // Fond dégradé simulé (violet)
  doc.setFillColor(71, 46, 173); // #472EAD
  doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 3, 3, "F");

  // Texte LPD
  doc.setTextColor(245, 128, 32); // #F58020
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("LPD", logoX + logoWidth / 2, logoY + 13, {
    align: "center",
  });

  // Slogan
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(
    "LIBRAIRIE PAPETERIE DARADJI",
    logoX + logoWidth / 2,
    logoY + 19,
    { align: "center" }
  );

  /* ================= TITRE ================= */
  let startY = logoY + logoHeight + 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("INVENTAIRE BOUTIQUE", 14, startY);

  doc.setFontSize(10);
  doc.text(
    `Période : ${formatDate(dateDebut)} → ${formatDate(dateFin)}`,
    14,
    startY + 6
  );

  /* ================= TABLE ================= */
  autoTable(doc, {
    startY: startY + 12,
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

  doc.save("Inventaire_Boutique.pdf");
};


  /* ================= UI ================= */
  if (loading) {
    return <p className="p-6">Chargement de l’inventaire...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6 flex flex-col gap-8 min-h-screen overflow-x-auto">
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
      {alertes.length > 0 && (
        <div className="space-y-2">
          {alertes.map((a, i) => (
            <div
              key={i}
              className={`p-3 rounded ${
                a.type === "danger"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
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
              <tr key={i} className="border-t">
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
    </div>
  );
}

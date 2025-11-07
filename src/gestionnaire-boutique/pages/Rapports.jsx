import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";

const CardStat = ({ title, value, color }) => (
  <div className={`rounded-lg shadow p-4 text-center ${color} text-white`}>
    <h3 className="text-sm">{title}</h3>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const Rapports = () => {
  const [periode, setPeriode] = useState("7");
  const [typeRapport, setTypeRapport] = useState("produits");
  const [rapport, setRapport] = useState(null);

  // Exemple de génération de données statiques
  const genererRapport = () => {
    setRapport({
      totalVentes: 230000,
      topProduits: ["Savon OMO", "Riz 50kg", "Huile 5L"],
      stockFaible: ["Savon OMO", "Huile 5L"],
      totalDemandes: 15,
      demandesEnAttente: 5,
      demandesValidees: 7,
      demandesRejetees: 3,
      produitsEnStock: 25,
      produitsFaible: 3,
      produitsEpuises: 2,
    });
  };

  const genererPDF = () => {
    if (!rapport) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rapport & Statistiques", 14, 20);
    doc.setFontSize(12);
    doc.text(`Type: ${typeRapport}`, 14, 30);
    doc.text(`Période: ${periode} jours`, 14, 38);
    doc.text(`Total ventes: ${rapport.totalVentes} FCFA`, 14, 46);
    doc.text("Top produits:", 14, 54);
    rapport.topProduits.forEach((p, i) => doc.text(`- ${p}`, 18, 62 + i * 8));
    doc.text("Produits en dessous du seuil:", 14, 62 + rapport.topProduits.length * 8);
    rapport.stockFaible.forEach((p, i) => doc.text(`- ${p}`, 18, 70 + rapport.topProduits.length * 8 + i * 8));
    doc.save("rapport.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="fixed top-0 left-64 right-0 h-16 bg-white z-50 shadow">
        <Navbar />
      </div>

      <div className="pt-[100px] px-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#111827]">Rapports & Statistiques</h2>

        {/* Sélection de période et type */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="bg-white p-4 rounded-lg shadow w-64">
            <label className="block mb-2 text-sm text-gray-700">Période :</label>
            <select
              className="border p-2 rounded w-full"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg shadow w-64">
            <label className="block mb-2 text-sm text-gray-700">Type de rapport :</label>
            <select
              className="border p-2 rounded w-full"
              value={typeRapport}
              onChange={(e) => setTypeRapport(e.target.value)}
            >
              <option value="produits">Produits</option>
              <option value="reapprovisionnement">Reprovisionnement</option>
              <option value="stock">Stock</option>
            </select>
          </div>

          <button
            onClick={genererRapport}
            className="bg-[#472EAD] text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FileText size={16} /> Générer
          </button>
        </div>

        {/* Statistiques principales */}
        {rapport && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CardStat title="Total ventes" value={`${rapport.totalVentes} FCFA`} color="bg-[#472EAD]" />
            <CardStat title="Top produits" value={rapport.topProduits.length} color="bg-green-600" />
            <CardStat title="Produits en dessous du seuil" value={rapport.stockFaible.length} color="bg-[#F58020]" />
            {typeRapport === "reapprovisionnement" && (
              <>
                <CardStat title="Demandes en attente" value={rapport.demandesEnAttente} color="bg-[#F58020]" />
                <CardStat title="Demandes validées" value={rapport.demandesValidees} color="bg-green-600" />
                <CardStat title="Demandes rejetées" value={rapport.demandesRejetees} color="bg-red-600" />
              </>
            )}
            {typeRapport === "stock" && (
              <>
                <CardStat title="Produits en stock" value={rapport.produitsEnStock} color="bg-[#472EAD]" />
                <CardStat title="Produits faibles" value={rapport.produitsFaible} color="bg-[#F58020]" />
                <CardStat title="Produits épuisés" value={rapport.produitsEpuises} color="bg-red-600" />
              </>
            )}
          </div>
        )}

        {/* Bouton PDF */}
        {rapport && (
          <button
            onClick={genererPDF}
            className="mt-4 bg-[#472EAD] text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FileText size={16} /> Télécharger PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default Rapports;

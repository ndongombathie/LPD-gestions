import React, { useEffect, useState, useCallback } from "react";
import { Printer, Save } from "lucide-react";
import inventaireBoutiqueAPI from "@/services/api/inventaireBoutique";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PER_PAGE = 15;

const fcfa = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

export default function InventaireBoutique() {

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [totals, setTotals] = useState({
    prix_achat_total: 0,
    prix_valeur_sortie_total: 0,
    valeur_estimee_total: 0,
    benefice_total: 0,
  });

  const [page, setPage] = useState(1);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState("");

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
  try {
    setLoading(true);

    // 🔥 1. Charger produits
    const res = await inventaireBoutiqueAPI.getInventaire({
      page,
      per_page: PER_PAGE,
      date_debut: dateDebut || undefined,
      date_fin: dateFin || undefined,
    });

    setItems(res.items);
    setPagination(res.pagination);

    // 🔥 2. Charger totaux (APRÈS)
    if (dateDebut && dateFin) {
      try {
        const totalsRes = await inventaireBoutiqueAPI.enregistrerInventaire({
          date_debut: dateDebut,
          date_fin: dateFin,
        });

        setTotals({
          prix_achat_total: totalsRes.prix_achat_total || 0,
          prix_valeur_sortie_total: totalsRes.prix_valeur_sortie_total || 0,
          valeur_estimee_total: totalsRes.valeur_estimee_total || 0,
          benefice_total: totalsRes.benefice_total || 0,
        });

      } catch (err) {
        console.error("Erreur chargement totaux:", err);
      }
    }

  } catch (err) {
    console.error("Erreur inventaire boutique:", err);
  } finally {
    setLoading(false);
  }
}, [page, dateDebut, dateFin]);

  /* ================= VALIDER DATES ================= */
  const validerDates = () => {
    if (!dateDebut || !dateFin) {
      setDateError("⚠️ Sélectionnez une période exacte.");
      return false;
    }

    if (dateDebut > dateFin) {
      setDateError("⚠️ La date de début ne peut pas être supérieure à la date de fin.");
      return false;
    }

    setDateError("");
    return true;
  };
useEffect(() => {
  fetchData();
}, [fetchData]);
  /* ================= ENREGISTRER ================= */
  const enregistrerInventaire = async () => {
  if (!validerDates()) return;

  try {
    setSaving(true);

    const res = await inventaireBoutiqueAPI.enregistrerInventaire({
      date_debut: dateDebut,
      date_fin: dateFin,
    });

    console.log("RESULTAT API:", res); // 🔥 debug

    setTotals({
      prix_achat_total: res.prix_achat_total || 0,
      prix_valeur_sortie_total: res.prix_valeur_sortie_total || 0,
      valeur_estimee_total: res.valeur_estimee_total || 0,
      benefice_total: res.benefice_total || 0,
    });

    alert("✅ Inventaire boutique enregistré avec succès");

  } catch (err) {
    console.error(err);
    alert("❌ Erreur enregistrement");
  } finally {
    setSaving(false);
  }
};

  /* ================= IMPRIMER GLOBAL ================= */
  const imprimer = async () => {
    if (!validerDates()) {
      return;
    }

    try {
      setLoading(true);

      let current = 1;
      let lastPage = 1;
      let allItems = [];

      do {
        const res = await inventaireBoutiqueAPI.getInventaire({
          page: current,
          per_page: PER_PAGE,
          date_debut: dateDebut,
          date_fin: dateFin,
        });

        allItems = [...allItems, ...res.items];
        lastPage = res.pagination.lastPage;
        current++;

      } while (current <= lastPage);

      if (!allItems.length) {
        alert("Aucune donnée à imprimer");
        return;
      }

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
      doc.setFontSize(11);
      doc.text(`Période : ${dateDebut} → ${dateFin}`, 14, 40);
      doc.text(`Édité le : ${new Date().toLocaleDateString("fr-FR")}`, 140, 40);

      autoTable(doc, {
        startY: 48,
        head: [[
          "Produit",
          "Stock Initial",
          "Qté Vendue",
          "Écart",
          "Total Vendu",
        ]],
        body: allItems.map((p) => [
          p.nom,
          p.stock_initial,
          p.quantite_vendue,
          p.ecart,
          fcfa(p.total_vendu),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 46, 173] },
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text("RÉCAPITULATIF FINANCIER", 14, 20);

      doc.setFontSize(12);
      doc.text(`Achat total : ${fcfa(totals.prix_achat_total)}`, 14, 40);
      doc.text(`Valeur sortie : ${fcfa(totals.prix_valeur_sortie_total)}`, 14, 55);
      doc.text(`Valeur stock : ${fcfa(totals.valeur_estimee_total)}`, 14, 70);
      doc.text(`Bénéfice : ${fcfa(totals.benefice_total)}`, 14, 85);

      doc.save("Inventaire_Boutique_GLOBAL.pdf");

    } catch (err) {
      console.error(err);
      alert("Erreur impression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="w-full">
        
        {/* HEADER - ESPACEMENT EN HAUT */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-md">
            <h1 className="text-2xl font-bold text-indigo-700">
              Inventaire Boutique — Comptable
            </h1>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={enregistrerInventaire}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex gap-2 shadow-md hover:bg-green-700 transition-colors font-medium"
              >
                <Save size={18}/>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>

              <button
                onClick={imprimer}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex gap-2 shadow-md hover:bg-indigo-700 transition-colors font-medium"
              >
                <Printer size={18}/>
                Imprimer Global
              </button>
            </div>
          </div>
        </div>

        {/* CARTES FINANCIÈRES - GRAND ESPACEMENT AVANT/APRÈS */}
        <div className="mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-8 border-b border-gray-200 pb-4">
              Récapitulatif financier
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card title="Achat Total" value={fcfa(totals.prix_achat_total)} />
              <Card title="Valeur Sortie" value={fcfa(totals.prix_valeur_sortie_total)} />
              <Card title="Valeur Stock" value={fcfa(totals.valeur_estimee_total)} />
              <Card title="Bénéfice" value={fcfa(totals.benefice_total)} />
            </div>
          </div>
        </div>

        {/* FILTRE - GRAND ESPACEMENT AVANT/APRÈS */}
        <div className="mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-4">
              Période d'inventaire
            </h2>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-6 items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Du</label>
                  <input 
                    type="date"
                    value={dateDebut}
                    onChange={(e) => {
                      setDateDebut(e.target.value);
                      setDateError("");
                      setPage(1);
                    }}
                    className="border-2 px-5 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600">Au</label>
                  <input 
                    type="date"
                    value={dateFin}
                    onChange={(e) => {
                      setDateFin(e.target.value);
                      setDateError("");
                      setPage(1);
                    }}
                    className="border-2 px-5 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
                  />
                </div>
              </div>
              
              {/* AFFICHAGE DE L'ERREUR */}
              {dateError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">
                    {dateError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLEAU - GRAND ESPACEMENT AVANT/APRÈS */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-8 py-6 border-b-2 border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                Détail des produits
              </h2>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Produit</th>
                    <th className="px-8 py-5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Initial</th>
                    <th className="px-8 py-5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qté Vendue</th>
                    <th className="px-8 py-5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Écart</th>
                    <th className="px-8 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Vendu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-8 py-5 text-gray-900 font-medium">{p.nom}</td>
                      <td className="px-8 py-5 text-center text-gray-900">{p.stock_initial}</td>
                      <td className="px-8 py-5 text-center text-gray-900">{p.quantite_vendue}</td>
                      <td className="px-8 py-5 text-center text-gray-900">{p.ecart}</td>
                      <td className="px-8 py-5 text-right font-semibold text-indigo-700">{fcfa(p.total_vendu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PAGINATION - GRAND ESPACEMENT AVANT/APRÈS */}
        {pagination && pagination.lastPage > 1 && (
          <div className="mb-8">
            <div className="bg-white px-8 py-5 rounded-2xl shadow-md flex justify-between items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 hover:border-gray-400 transition-all text-sm font-medium"
              >
                ← Précédent
              </button>

              <span className="text-base text-gray-700 bg-gray-100 px-6 py-3 rounded-xl">
                Page <span className="font-bold text-indigo-700">{pagination.currentPage}</span> / {pagination.lastPage}
              </span>

              <button
                disabled={page >= pagination.lastPage}
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 hover:border-gray-400 transition-all text-sm font-medium"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* CHARGEMENT */}
        {loading && (
          <div className="bg-white p-12 rounded-2xl shadow-md flex justify-center items-center">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="text-gray-700 text-lg font-medium">Chargement en cours...</p>
            </div>
          </div>
        )}

        {/* ESPACE SUPPLEMENTAIRE EN BAS */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

/* ===== CARD COMPONENT ===== */
function Card({ title, value }) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-7 border-2 border-indigo-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
      <p className="text-sm text-indigo-700 mb-3 font-bold uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl lg:text-3xl font-extrabold text-gray-800 break-words">
        {value}
      </p>
    </div>
  );
}
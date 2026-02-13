import React, { useEffect, useState, useCallback } from "react";
import { Printer, Save } from "lucide-react";
import inventaireDepotAPI from "@/services/api/inventaireDepot";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PER_PAGE = 15;

const fcfa = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

export default function InventaireDepot() {

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

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await inventaireDepotAPI.getInventaire({
        page,
        per_page: PER_PAGE,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
      });

      setItems(res.items);
      setPagination(res.pagination);

    } catch (err) {
      console.error("Erreur inventaire dépôt:", err);
    } finally {
      setLoading(false);
    }
  }, [page, dateDebut, dateFin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= VALIDATION DATES ================= */
  const validerDates = () => {
    if (!dateDebut || !dateFin) {
      setDateError("Sélectionnez une période complète.");
      return false;
    }

    if (dateDebut > dateFin) {
      setDateError("La date de début ne peut pas être supérieure à la date de fin.");
      return false;
    }

    setDateError("");
    return true;
  };

  /* ================= CHARGER LES CARTES ================= */
  const chargerCartes = useCallback(async () => {
    if (!validerDates()) {
      setTotals({
        prix_achat_total: 0,
        prix_valeur_sortie_total: 0,
        valeur_estimee_total: 0,
        benefice_total: 0,
      });
      return;
    }

    try {
      const res = await inventaireDepotAPI.enregistrerInventaire({
        date_debut: dateDebut,
        date_fin: dateFin,
      });
      setTotals(res);
    } catch (err) {
      console.error("Erreur chargement des cartes:", err);
    }
  }, [dateDebut, dateFin]);

  // Charger les cartes quand les dates changent
  useEffect(() => {
    chargerCartes();
  }, [dateDebut, dateFin, chargerCartes]);

  /* ================= ENREGISTRER INVENTAIRE ================= */
  const enregistrerInventaire = async () => {
    if (!validerDates()) {
      return;
    }

    try {
      setSaving(true);

      const res = await inventaireDepotAPI.enregistrerInventaire({
        date_debut: dateDebut,
        date_fin: dateFin,
      });

      setTotals(res);
      alert("✅ Inventaire enregistré avec succès");

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
        const res = await inventaireDepotAPI.getInventaire({
          page: current,
          per_page: PER_PAGE,
          date_debut: dateDebut || undefined,
          date_fin: dateFin || undefined,
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

      // HEADER
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

      const periode =
        dateDebut && dateFin
          ? `${dateDebut} → ${dateFin}`
          : "Toutes périodes";

      doc.text(`Période : ${periode}`, 14, 40);
      doc.text(`Édité le : ${new Date().toLocaleDateString("fr-FR")}`, 140, 40);

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

      doc.addPage();
      doc.setFontSize(14);
      doc.text("RÉCAPITULATIF FINANCIER", 14, 20);

      doc.setFontSize(12);
      doc.text(`Achat total : ${fcfa(totals.prix_achat_total)}`, 14, 40);
      doc.text(`Valeur sortie : ${fcfa(totals.prix_valeur_sortie_total)}`, 14, 55);
      doc.text(`Valeur stock : ${fcfa(totals.valeur_estimee_total)}`, 14, 70);
      doc.text(`Bénéfice : ${fcfa(totals.benefice_total)}`, 14, 85);

      doc.save("Inventaire_Depot_GLOBAL.pdf");

    } catch (err) {
      console.error(err);
      alert("Erreur impression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ESPACEMENT HEADER */}
        <div className="mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="text-2xl font-bold text-indigo-700">
                Inventaire Dépôt — Comptable
              </h1>

              <div className="flex gap-4">
                <button
                  onClick={enregistrerInventaire}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl flex gap-2 shadow-md hover:bg-green-700 transition-colors font-medium"
                >
                  <Save size={18}/>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>

                <button
                  onClick={imprimer}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex gap-2 shadow-md hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Printer size={18}/>
                  Imprimer Global
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ESPACEMENT CARTES */}
        <div className="mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-4">
              Récapitulatif financier
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card title="ACHAT TOTAL" value={fcfa(totals.prix_achat_total)} />
              <Card title="VALEUR SORTIE" value={fcfa(totals.prix_valeur_sortie_total)} />
              <Card title="VALEUR STOCK" value={fcfa(totals.valeur_estimee_total)} />
              <Card title="BÉNÉFICE" value={fcfa(totals.benefice_total)} />
            </div>
          </div>
        </div>

        {/* ESPACEMENT FILTRE */}
        <div className="mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Période d'inventaire
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Du</span>
                  <input 
                    type="date"
                    value={dateDebut}
                    onChange={(e) => {
                      setDateDebut(e.target.value);
                      setPage(1);
                      setDateError("");
                    }}
                    className="border-2 border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-56"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">au</span>
                  <input 
                    type="date"
                    value={dateFin}
                    onChange={(e) => {
                      setDateFin(e.target.value);
                      setPage(1);
                      setDateError("");
                    }}
                    className="border-2 border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-56"
                  />
                </div>
              </div>
              
              {/* MESSAGE D'ERREUR */}
              {dateError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ {dateError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ESPACEMENT TABLEAU */}
        <div className="mb-10">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Détail des produits
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Catégorie</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Entrées</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Sorties</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valeur sortie</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valeur estimée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((p)=>(
                    <tr key={p.id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.nom}</td>
                      <td className="px-6 py-4 text-gray-600">{p.categorie}</td>
                      <td className="px-6 py-4 text-center text-gray-900">{p.total_entree}</td>
                      <td className="px-6 py-4 text-center text-gray-900">{p.total_sortie}</td>
                      <td className="px-6 py-4 text-center text-gray-900">{p.stock_restant}</td>
                      <td className="px-6 py-4 text-right font-medium text-indigo-700">{fcfa(p.valeur_sortie)}</td>
                      <td className="px-6 py-4 text-right font-medium text-indigo-700">{fcfa(p.valeur_estimee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ESPACEMENT PAGINATION */}
        {pagination && pagination.lastPage > 1 && (
          <div className="mb-6">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-md flex justify-between items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 hover:border-gray-300 transition-all font-medium flex items-center gap-2"
              >
                ← Précédent
              </button>

              <span className="text-gray-700 bg-gray-100 px-5 py-2.5 rounded-xl font-medium">
                Page <span className="font-bold text-indigo-700">{pagination.currentPage}</span> / {pagination.lastPage}
              </span>

              <button
                disabled={page >= pagination.lastPage}
                onClick={() => setPage(p => p + 1)}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 hover:border-gray-300 transition-all font-medium flex items-center gap-2"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* CHARGEMENT */}
        {loading && (
          <div className="bg-white p-8 rounded-2xl shadow-md flex justify-center items-center">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-indigo-600 border-t-transparent"></div>
              <p className="text-gray-700 font-medium">Chargement en cours...</p>
            </div>
          </div>
        )}

        {/* ESPACE SUPPLEMENTAIRE EN BAS */}
        <div className="h-6"></div>

      </div>
    </div>
  );
}

/* ===== CARD COMPONENT ===== */
function Card({ title, value }) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all">
      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className="text-xl lg:text-2xl font-extrabold text-gray-800 break-words">
        {value}
      </p>
    </div>
  );
}
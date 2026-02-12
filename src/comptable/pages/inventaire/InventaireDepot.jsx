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

  /* ================= FETCH DATA ================= */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        per_page: PER_PAGE,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
      };

      const res = await inventaireDepotAPI.getInventaire(params);

      setItems(res.items);
      setPagination(res.pagination);

      if (dateDebut && dateFin) {
        const totaux = await inventaireDepotAPI.calculerTotaux({
          date_debut: dateDebut,
          date_fin: dateFin,
        });
        setTotals(totaux);
      } else {
        setTotals({
          prix_achat_total: 0,
          prix_valeur_sortie_total: 0,
          valeur_estimee_total: 0,
          benefice_total: 0,
        });
      }

    } catch (err) {
      console.error("Erreur inventaire:", err);
    } finally {
      setLoading(false);
    }
  }, [page, dateDebut, dateFin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= APPLIQUER FILTRE ================= */
  const appliquerFiltre = () => {
    if (dateDebut && dateFin && dateDebut > dateFin) {
      alert("Date début invalide");
      return;
    }

    setPage(1);
    fetchData();
  };

  /* ================= ENREGISTRER INVENTAIRE ================= */
  const enregistrerInventaire = async () => {
    if (!dateDebut || !dateFin) {
      alert("Sélectionne une période.");
      return;
    }

    try {
      setSaving(true);

      await inventaireDepotAPI.enregistrerInventaire({
        date_debut: dateDebut,
        date_fin: dateFin,
      });

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

      // PAGE RÉCAP
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
    <div className="p-6 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-700">
          Inventaire Dépôt — Comptable
        </h1>

        <div className="flex gap-3">
          <button
            onClick={enregistrerInventaire}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded flex gap-2"
          >
            <Save size={16}/>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>

          <button
            onClick={imprimer}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex gap-2"
          >
            <Printer size={16}/>
            Imprimer Global
          </button>

          <button
            onClick={appliquerFiltre}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Appliquer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card title="Achat Total" value={fcfa(totals.prix_achat_total)} />
        <Card title="Valeur Sortie" value={fcfa(totals.prix_valeur_sortie_total)} />
        <Card title="Valeur Stock" value={fcfa(totals.valeur_estimee_total)} />
        <Card title="Bénéfice" value={fcfa(totals.benefice_total)} />
      </div>

      <div className="flex gap-4">
        <input type="date" value={dateDebut}
          onChange={(e)=>setDateDebut(e.target.value)}
          className="border px-3 py-2 rounded"/>

        <input type="date" value={dateFin}
          onChange={(e)=>setDateFin(e.target.value)}
          className="border px-3 py-2 rounded"/>
      </div>

      <div className="bg-white shadow rounded">
        <table className="w-full text-sm">
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
            {items.map((p)=>(
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.nom}</td>
                <td className="p-3">{p.categorie}</td>
                <td className="p-3 text-center">{p.total_entree}</td>
                <td className="p-3 text-center">{p.total_sortie}</td>
                <td className="p-3 text-center">{p.stock_restant}</td>
                <td className="p-3 text-right">{fcfa(p.valeur_sortie)}</td>
                <td className="p-3 text-right">{fcfa(p.valeur_estimee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-between items-center">
          <button
            disabled={page <= 1}
            onClick={()=>setPage(p=>p-1)}
            className="px-3 py-1 border rounded"
          >
            Précédent
          </button>

          <span>
            Page {pagination.currentPage} / {pagination.lastPage}
          </span>

          <button
            disabled={page >= pagination.lastPage}
            onClick={()=>setPage(p=>p+1)}
            className="px-3 py-1 border rounded"
          >
            Suivant
          </button>
        </div>
      )}

      {loading && <p>Chargement...</p>}

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-4 bg-white shadow rounded">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-lg font-bold text-indigo-700">{value}</p>
    </div>
  );
}

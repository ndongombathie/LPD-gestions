import React, { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import inventaireDepotAPI from "@/services/api/inventaireDepot";

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
        setProduits(Array.isArray(data) ? data : []);
      } catch {
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
      const entrees = p.quantite_entree ?? 0;
      const sorties = p.quantite_sortie ?? 0;
      const restant = entrees - sorties;

      const totalVentes = sorties * (p.prix_vente_depot ?? 0);
      const totalAchats = entrees * (p.prix_achat ?? 0);

      return {
        nom: p.nom ?? "-",
        entrees,
        sorties,
        restant,
        nbReappro: p.nb_reappro ?? 0,
        fournisseurs: p.fournisseurs ?? "-",
        totalVentes,
        resultat: totalVentes - totalAchats,
      };
    });
  }, [produits]);

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
        <input type="date" className="border px-3 py-2 rounded" value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)} />
        <input type="date" className="border px-3 py-2 rounded" value={dateFin}
          onChange={(e) => setDateFin(e.target.value)} />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded flex gap-2 justify-center">
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
                <td className="p-2 text-right font-semibold">
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

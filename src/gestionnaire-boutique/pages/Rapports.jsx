import React, { useState, useEffect, useCallback } from "react";
import { FileText, Package, AlertTriangle } from "lucide-react";
import DataTable from "../components/DataTable";
import jsPDF from "jspdf";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const CardStat = ({ title, value, color, subtitle }) => (
  <div className={`rounded-lg shadow p-4 text-left ${color} text-white`}>
    <h3 className="text-xs uppercase tracking-wide text-white/90">{title}</h3>
    <p className="text-2xl font-bold leading-tight mt-1">{value}</p>
    {subtitle && <p className="text-xs opacity-85 mt-1">{subtitle}</p>}
  </div>
);

const Rapports = () => {
  const [periode, setPeriode] = useState("7");
  const [typeRapport, setTypeRapport] = useState("produits");
  const [sousSeuil, setSousSeuil] = useState([]);
  const [pending, setPending] = useState([]);
  const [valides, setValides] = useState([]);
  const [nombreProduits, setNombreProduits] = useState(0);
  const [quantiteTotale, setQuantiteTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rapport, setRapport] = useState(null);

  const formatNumber = (n) => n?.toLocaleString?.("fr-FR") ?? n;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [nb, qty, ss, pend, val] = await Promise.all([
          gestionnaireBoutiqueAPI.getNombreProduitsTotal(),
          gestionnaireBoutiqueAPI.getQuantiteTotaleProduit(),
          gestionnaireBoutiqueAPI.getProduitsSousSeuil(),
          gestionnaireBoutiqueAPI.getProduitsTransfer(),
          gestionnaireBoutiqueAPI.getTransfertsValides(),
        ]);
        if (!mounted) return;
        
        const nbValue = typeof nb === 'object' ? (nb.total || nb.nombre || 0) : (Number(nb) || 0);
        const qtyValue = typeof qty === 'object' ? (qty.total_quantity || qty.quantite || 0) : (Number(qty) || 0);
        
        setNombreProduits(nbValue);
        setQuantiteTotale(qtyValue);
        setSousSeuil(ss?.data || []);
        setPending(pend?.data || []);
        setValides(val?.data || []);
      } catch {
        toast.error('Erreur de chargement', { description: 'Impossible de charger les données des rapports' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  const genererRapport = useCallback(() => {
    if (!nombreProduits && !pending.length && !valides.length) {
      setRapport(null);
      return;
    }
    const totalProduits = nombreProduits;
    const valeurStock = 0; // Non disponible via endpoints actuels
    const produitsSousSeuil = sousSeuil;
    const produitsEpuises = [];

    const allTransferts = [
      ...pending.map((t) => ({ ...t, statut: t.statut || 'en_attente' })),
      ...valides.map((t) => ({ ...t, statut: 'validé' })),
    ];
    const totalTransferts = allTransferts.length;
    const transfertsEnAttente = allTransferts.filter((t) => t.statut === 'en_attente');
    const transfertsValides = allTransferts.filter((t) => t.statut === 'validé').length;
    const quantiteAttente = transfertsEnAttente.reduce((sum, t) => sum + (t.quantite || 0), 0);
    const quantiteValide = allTransferts
      .filter((t) => t.statut === 'validé')
      .reduce((sum, t) => sum + (t.quantite || 0), 0);

    const categoryDistribution = [];

    setRapport({
      totalProduits,
      quantiteTotale,
      valeurStock,
      produitsSousSeuil,
      produitsEpuises,
      categoryDistribution,
      totalTransferts,
      transfertsEnAttente,
      transfertsValides,
      quantiteAttente,
      quantiteValide,
    });
  }, [nombreProduits, pending, valides, sousSeuil, quantiteTotale, typeRapport, periode]);

  // Recompute report whenever data or type changes
  useEffect(() => {
    genererRapport();
  }, [genererRapport]);

  const exportFullPDF = () => {
    if (!rapport) return;
    const doc = new jsPDF({ unit: "pt" });
    const margin = 40;
    let y = 60;
    doc.setFontSize(18);
    doc.text("Rapport dynamique — LPD Gestion", margin, y);
    y += 22;
    doc.setFontSize(12);
    doc.text(`Période: ${periode} jours`, margin, y);
    y += 16;
    doc.text(`Total produits: ${formatNumber(rapport.totalProduits)}`, margin, y);
    y += 14;
    doc.text(`Quantité totale: ${formatNumber(rapport.quantiteTotale)}`, margin, y);
    y += 14;
    doc.text(`Valeur stock estimée: ${formatNumber(rapport.valeurStock)} FCFA`, margin, y);
    y += 14;
    doc.text(`Transferts reçus: ${rapport.totalTransferts} (en attente: ${rapport.transfertsEnAttente.length}, validés: ${rapport.transfertsValides})`, margin, y);
    y += 18;

    doc.setFontSize(11);
    doc.text("Produits sous seuil", margin, y);
    y += 12;
    rapport.produitsSousSeuil.slice(0, 25).forEach((p, idx) => {
      if (y > 740) { doc.addPage(); y = 60; }
      doc.text(`${idx + 1}. ${p.nom} (${p.quantite * p.nbr_pieces} unités)`, margin, y);
      y += 12;
    });

    doc.save("rapport-dynamique.pdf");
  };

  const tableData = () => {
    if (!rapport) return { rows: [], columns: [] };
    if (typeRapport === "transferts") {
      return {
        rows: [...pending, ...valides].map((t) => ({
          id: t.id,
          produit: t.produit?.nom || t.nom || 'N/A',
          code: t.produit?.code || t.code || 'N/A',
          statut: t.status || t.statut || (valides.find(v => v.id === t.id) ? 'validé' : 'en_attente'),
          quantite: t.quantite || 0,
          date: t.updated_at || t.created_at || '-',
        })),
        columns: [
          { label: "Produit", key: "produit" },
          { label: "Code", key: "code" },
          { label: "Quantité", key: "quantite" },
          {
            label: "Statut",
            key: "statut",
            render: (s) => (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                s === "validé" ? "bg-green-100 text-green-700" : "bg-[#FFF4E6] text-[#F58020]"
              }`}>
                {s}
              </span>
            ),
          },
          {
            label: "Date",
            key: "date",
            render: (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "-",
          },
        ],
      };
    }

    // Produits sous seuil
    return {
      rows: sousSeuil.map((p) => ({
        id: p.id,
        nom: p.produit?.nom || p.nom || 'N/A',
        code: p.produit?.code || p.code || 'N/A',
        categorie: p.produit?.categorie || p.categorie || '-',
        quantite: p.quantite || p.stock_global || 0,
        seuil: p.seuil || p.stock_seuil || 0,
        date: p.updated_at || p.created_at || '-',
      })),
      columns: [
        { label: "Produit", key: "nom" },
        { label: "Code", key: "code" },
        { label: "Quantité", key: "quantite" },
        { label: "Seuil", key: "seuil" },
        {
          label: "Date",
          key: "date",
          render: (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "-",
        },
      ],
    };
  };

  const { rows, columns } = tableData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 space-y-6 py-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-bold text-[#111827]">Rapports & Statistiques</h2>
            <p className="text-gray-600 text-sm">Données dynamiques basées sur vos stocks et transferts</p>
          </div>
          {rapport && (
            <button
              onClick={exportFullPDF}
              className="inline-flex items-center gap-2 bg-[#111827] hover:bg-black text-white px-4 py-2 rounded-md text-sm shadow"
            >
              <FileText size={14} />
              Exporter PDF
            </button>
          )}
        </div>

        {/* Sélection de période et type */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[160px]">
              <label className="block mb-1 text-xs text-gray-500">Période</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">3 derniers mois</option>
              </select>
            </div>

            <div className="min-w-[200px]">
              <label className="block mb-1 text-xs text-gray-500">Type de rapport</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={typeRapport}
                onChange={(e) => setTypeRapport(e.target.value)}
              >
                <option value="produits">Produits / Stock</option>
                <option value="transferts">Transferts</option>
              </select>
            </div>

            <div className="ml-1">
              <label className="block mb-1 text-xs text-transparent">Action</label>
              <button
                onClick={genererRapport}
                className="inline-flex items-center gap-2 bg-[#472EAD] hover:bg-[#3b2594] text-white px-4 py-2 rounded-md text-sm shadow"
              >
                <FileText size={16} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        {!rapport && !loading && (
          <div className="bg-white p-4 rounded-lg shadow text-gray-600 text-sm">Aucune donnée disponible.</div>
        )}

        {rapport && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {typeRapport === "transferts" ? (
              <>
                <CardStat title="Transferts reçus" value={formatNumber(rapport.totalTransferts)} color="bg-[#472EAD]" subtitle={`${formatNumber(rapport.quantiteAttente + rapport.quantiteValide)} unités`} />
                <CardStat title="En attente" value={formatNumber(rapport.transfertsEnAttente.length)} color="bg-[#F58020]" subtitle={`${formatNumber(rapport.quantiteAttente)} unités`} />
                <CardStat title="Validés" value={formatNumber(rapport.transfertsValides)} color="bg-green-600" subtitle={`${formatNumber(rapport.quantiteValide)} unités`} />
              </>
            ) : (
              <>
                <CardStat title="Total produits" value={formatNumber(rapport.totalProduits)} color="bg-[#472EAD]" />
                <CardStat title="Quantité totale" value={formatNumber(rapport.quantiteTotale)} color="bg-indigo-600" subtitle="unités" />
                <CardStat title="Sous seuil" value={formatNumber(rapport.produitsSousSeuil.length)} color="bg-[#F58020]" subtitle="à surveiller" />
                <CardStat title="Valeur stock" value={`${formatNumber(rapport.valeurStock)} FCFA`} color="bg-gray-800" subtitle="estimée (prix gros)" />
              </>
            )}
          </div>
        )}

        {rapport && typeRapport === "transferts" && (
          <div className="bg-white p-4 rounded shadow grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Package size={18} /> Volumétrie</h4>
              <p className="text-sm text-gray-700">Quantité en attente: <span className="font-semibold">{formatNumber(rapport.quantiteAttente)} u</span></p>
              <p className="text-sm text-gray-700">Quantité validée: <span className="font-semibold">{formatNumber(rapport.quantiteValide)} u</span></p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Points de contrôle</h4>
              <p className="text-sm text-gray-700">En attente: {rapport.transfertsEnAttente.length} transfert(s)</p>
              <p className="text-sm text-gray-700">Validés: {rapport.transfertsValides}</p>
            </div>
          </div>
        )}

        {/* Tableau détaillé */}
        {rapport && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Détails</h3>
            <DataTable data={rows} columns={columns} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Rapports;

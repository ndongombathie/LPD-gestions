// ==========================================================
// 💸 Decaissements.jsx — Interface Responsable (LPD Manager)
// Gestion complète des demandes et historiques de décaissement
// Design premium, animations fluides & composants modulaires
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileDown, PlusCircle, RefreshCw, TrendingDown } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { instance } from "../../utils/axios";

// 🧩 Composants internes
import FormModal from "../components/FormModal";
import DecaissementForm from "../components/DecaissementForm";
import KpiCard from "../components/KpiCard";
import { toast } from "sonner";

// ——————————————————————————————————————————————————
// 🔧 Helpers
// ——————————————————————————————————————————————————
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);

// ——————————————————————————————————————————————————
// 💰 Composant principal
// ——————————————————————————————————————————————————
export default function Decaissements() {
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [demandes, setDemandes] = useState([]);

  // Simulation initiale
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // const { data } = await instance.get("/decaissements");
        // setDemandes(data);
        setDemandes([
          { id: 1, date: "2025-11-01", montant: 20000, motif: "Règlement fournisseur", methode: "Virement", statut: "validé" },
          { id: 2, date: "2025-11-02", montant: 15000, motif: "Achat matériel bureau", methode: "Espèces", statut: "en attente" },
          { id: 3, date: "2025-11-04", montant: 10000, motif: "Frais transport", methode: "Mobile Money", statut: "refusé" },
        ]);
      } catch (e) {
        console.error("Erreur chargement décaissements:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ——————————————————————————————————————————————————
  // 💾 Ajout d’un nouveau décaissement
  // ——————————————————————————————————————————————————
  const handleAdd = async (form) => {
    try {
      // await instance.post("/decaissements", form);
      const nouveau = { ...form, id: Date.now(), statut: "en attente" };
      setDemandes((prev) => [nouveau, ...prev]);
      setOpenModal(false);
      toast.success("Décaissement ajouté avec succès !");
    } catch (e) {
      console.error("Erreur enregistrement:", e);
      toast.error("Impossible d’ajouter le décaissement.");
    }
  };

  // ——————————————————————————————————————————————————
  // 📊 Calcul des KPI
  // ——————————————————————————————————————————————————
  const stats = useMemo(() => {
    const total = demandes.reduce((sum, d) => sum + d.montant, 0);
    const enAttente = demandes.filter((d) => d.statut === "en attente").length;
    const valides = demandes.filter((d) => d.statut === "validé").length;
    const refuses = demandes.filter((d) => d.statut === "refusé").length;
    const moyenne = demandes.length ? total / demandes.length : 0;
    return { total, enAttente, valides, refuses, moyenne };
  }, [demandes]);

  // ——————————————————————————————————————————————————
  // 📤 Export PDF
  // ——————————————————————————————————————————————————
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historique des décaissements — LPD Manager", 14, 16);
    doc.setFontSize(10);
    doc.text(`Généré le : ${todayISO()}`, 14, 22);

    doc.autoTable({
      startY: 30,
      head: [["Date", "Montant", "Motif", "Méthode", "Statut"]],
      body: demandes.map((d) => [
        d.date,
        formatFCFA(d.montant),
        d.motif,
        d.methode,
        d.statut.toUpperCase(),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save(`Decaissements_${todayISO()}.pdf`);
  };

  // ——————————————————————————————————————————————————
  // 🏷️ Couleurs statut
  // ——————————————————————————————————————————————————
  const statutBadge = (s) =>
    ({
      validé: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      refusé: "bg-rose-100 text-rose-700 border border-rose-300",
      "en attente": "bg-amber-100 text-amber-700 border border-amber-300",
    }[s] || "bg-gray-100 text-gray-600 border border-gray-300");

  // ——————————————————————————————————————————————————
  // 🧠 UI
  // ——————————————————————————————————————————————————
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-[#472EAD]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Chargement des décaissements...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F9F9FB] px-6 py-8 overflow-y-auto">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#472EAD]">Décaissements & Suivi</h1>
          <p className="text-sm text-gray-500">Gérez vos sorties d’argent, suivez leur validation et exportez vos rapports.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 bg-[#472EAD] hover:bg-[#5A3CF5] text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <PlusCircle size={18} /> Nouvelle demande
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-white text-[#472EAD] border border-[#E3E0FF] rounded-lg px-4 py-2 hover:bg-[#F7F5FF] transition"
          >
            <FileDown size={18} /> Exporter PDF
          </button>
        </div>
      </motion.header>

      {/* KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard label="Total dépensé" value={formatFCFA(stats.total)} icon={<TrendingDown size={20} />} color="from-[#472EAD] to-[#7A5BF5]" />
        <KpiCard label="Moyenne / opération" value={formatFCFA(stats.moyenne)} icon={<TrendingDown size={20} />} color="from-[#F58020] to-[#FF995A]" />
        <KpiCard label="Validés" value={stats.valides} icon={<TrendingDown size={20} />} color="from-[#10B981] to-[#34D399]" />
        <KpiCard label="En attente" value={stats.enAttente} icon={<TrendingDown size={20} />} color="from-[#FBBF24] to-[#F59E0B]" />
      </section>

      {/* TABLEAU HISTORIQUE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Montant</th>
              <th className="px-4 py-3 text-left">Motif</th>
              <th className="px-4 py-3 text-left">Méthode</th>
              <th className="px-4 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {demandes.length ? (
              demandes.map((d) => (
                <tr key={d.id} className="border-t border-gray-100 hover:bg-[#F9F9FF] transition">
                  <td className="px-4 py-2">{d.date}</td>
                  <td className="px-4 py-2 font-medium">{formatFCFA(d.montant)}</td>
                  <td className="px-4 py-2">{d.motif}</td>
                  <td className="px-4 py-2">{d.methode}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutBadge(d.statut)}`}>
                      {d.statut.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-400 py-6">
                  Aucun décaissement trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE */}
      <FormModal open={openModal} onClose={() => setOpenModal(false)} title="Nouvelle demande de décaissement">
        <DecaissementForm onSubmit={handleAdd} onCancel={() => setOpenModal(false)} submitting={false} />
      </FormModal>

      {/* FOOTER */}
      <div className="text-center text-xs text-gray-500 mt-8 pb-4">
        © 2025 <span className="text-[#472EAD] font-semibold">LPD Consulting</span> — Module Décaissements v2.0
      </div>
    </div>
  );
}

// ========================================================== 
// 💸 Decaissements.jsx — Interface Responsable (LPD Manager)
// Gestion des demandes de décaissement (simple & claire)
// - En-tête : motif global, méthode prévue, date
// - Détail : plusieurs lignes (libellé + montant)
// - Statut : en attente / validé / refusé
// - KPI + export PDF + modal de détail
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileDown,
  PlusCircle,
  RefreshCw,
  TrendingDown,
  Eye,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
// import { instance } from "../../utils/axios"; // à réactiver quand l'API sera prête

// 🧩 Composants internes
import FormModal from "../components/FormModal";
import DecaissementForm from "../components/DecaissementForm";
import KpiCard from "../components/KpiCard";
import { toast } from "sonner";

// ——————————————————————————————————————————————————
// 🔧 Helpers
// ——————————————————————————————————————————————————
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const todayISO = () => new Date().toISOString().slice(0, 10);

// ——————————————————————————————————————————————————
// 🧾 Modal de détail décaissement
// ——————————————————————————————————————————————————
function DetailDecaissementModal({ open, onClose, decaissement }) {
  if (!open || !decaissement) return null;

  const {
    motifGlobal,
    methodePrevue,
    datePrevue,
    statut,
    lignes,
    montantTotal,
  } = decaissement;

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center px-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#472EAD] flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Détail de la demande de décaissement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Infos générales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">
                Motif global
              </div>
              <div className="font-semibold text-gray-800">
                {motifGlobal || "-"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">
                Méthode prévue
              </div>
              <div className="font-medium text-gray-800">
                {methodePrevue || "-"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">
                Date prévue
              </div>
              <div className="text-gray-800">{datePrevue}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Statut</div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F7F5FF] text-[#472EAD] border border-[#E3E0FF]">
                {String(statut || "").toUpperCase()}
              </span>
            </div>
          </div>

          {/* Lignes détaillées */}
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F5FF] text-[#472EAD]">
                <tr>
                  <th className="px-3 py-2 text-left">Libellé</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {lignes && lignes.length ? (
                  lignes.map((l, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-100 hover:bg-[#F9F9FF]"
                    >
                      <td className="px-3 py-2 text-xs sm:text-[13px]">
                        {l.libelle}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatFCFA(l.montant)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-3 text-center text-gray-400"
                    >
                      Aucune ligne détaillée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-[#F9FAFF] border border-[#E4E0FF] rounded-xl px-4 py-3 text-sm w-full sm:w-64">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant total</span>
                <span className="font-bold text-[#472EAD]">
                  {formatFCFA(montantTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// 💰 Composant principal
// ——————————————————————————————————————————————————
export default function Decaissements() {
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  // ——————————————————————————————————————————————————
  // 📥 Chargement initial (simulation pour l'instant)
  // ——————————————————————————————————————————————————
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Exemple quand l'API sera prête :
        // const { data } = await instance.get("/decaissements");
        // setDemandes(data);

        // 👉 Données simulées avec la nouvelle structure
        setDemandes([
          {
            id: 1,
            datePrevue: "2025-11-01",
            motifGlobal: "Règlement fournisseur PAPDISK",
            methodePrevue: "Virement",
            statut: "validé",
            lignes: [
              { libelle: "Facture PAPDISK N°F-2025-001", montant: 20000 },
            ],
            montantTotal: 20000,
          },
          {
            id: 2,
            datePrevue: "2025-11-02",
            motifGlobal: "Achat matériel de bureau",
            methodePrevue: "Espèces",
            statut: "en attente",
            lignes: [{ libelle: "Cartouches + ramettes A4", montant: 15000 }],
            montantTotal: 15000,
          },
          {
            id: 3,
            datePrevue: "2025-11-04",
            motifGlobal: "Frais de transport",
            methodePrevue: "Mobile Money",
            statut: "refusé",
            lignes: [{ libelle: "Course Dakar → Rufisque", montant: 10000 }],
            montantTotal: 10000,
          },
        ]);
      } catch (e) {
        console.error("Erreur chargement décaissements:", e);
        toast.error("Impossible de charger les décaissements.");
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
      const montantTotal = form.lignes.reduce(
        (sum, l) => sum + Number(l.montant || 0),
        0
      );

      const nouveau = {
        id: Date.now(),
        motifGlobal: form.motifGlobal,
        methodePrevue: form.methodePrevue,
        datePrevue: form.datePrevue,
        lignes: form.lignes,
        montantTotal,
        statut: "en attente", // toujours en attente au moment de la demande
      };

      // Quand l'API sera prête :
      // await instance.post("/decaissements", nouveau);

      setDemandes((prev) => [nouveau, ...prev]);
      setOpenModal(false);
      toast.success("Demande de décaissement ajoutée avec succès !");
    } catch (e) {
      console.error("Erreur enregistrement décaissement:", e);
      toast.error("Impossible d’ajouter le décaissement.");
    }
  };

  // ——————————————————————————————————————————————————
  // 📊 Calcul des KPI
  // ——————————————————————————————————————————————————
  const stats = useMemo(() => {
    const total = demandes.reduce(
      (sum, d) => sum + Number(d.montantTotal || 0),
      0
    );
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
      head: [["Date", "Montant total", "Motif global", "Méthode", "Statut"]],
      body: demandes.map((d) => [
        d.datePrevue,
        formatFCFA(d.montantTotal),
        d.motifGlobal,
        d.methodePrevue,
        d.statut.toUpperCase(),
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 9 },
    });

    doc.save(`Decaissements_${todayISO()}.pdf`);
    toast.success("Export PDF généré avec succès.");
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
  // 🧠 Loader harmonisé avec les autres modules
  // ——————————————————————————————————————————————————
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <RefreshCw className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des décaissements...
          </span>
        </div>
      </div>
    );

  // ——————————————————————————————————————————————————
  // 🧠 UI principale alignée avec ClientsSpeciaux / Utilisateurs
  // ——————————————————————————————————————————————————
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Décaissements — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Décaissements &amp; suivi budgétaire
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez vos sorties d’argent, suivez leur statut et exportez vos
                rapports en un clic.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Vue consolidée au {todayISO()} • {demandes.length} demande
              {demandes.length > 1 && "s"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-end">
            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 bg-[#472EAD] hover:bg-[#5A3CF5] text-white px-4 py-2 rounded-lg shadow-md text-sm transition"
            >
              <PlusCircle size={18} /> Nouvelle demande
            </button>

          </div>
        </motion.header>

        {/* KPI */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <KpiCard
            label="Total demandé"
            value={formatFCFA(stats.total)}
            icon={<TrendingDown size={20} />}
            color="from-[#472EAD] to-[#7A5BF5]"
          />
          <KpiCard
            label="Moyenne / demande"
            value={formatFCFA(stats.moyenne)}
            icon={<TrendingDown size={20} />}
            color="from-[#F58020] to-[#FF995A]"
          />
          <KpiCard
            label="Validés"
            value={stats.valides}
            icon={<TrendingDown size={20} />}
            color="from-[#10B981] to-[#34D399]"
          />
          <KpiCard
            label="En attente"
            value={stats.enAttente}
            icon={<TrendingDown size={20} />}
            color="from-[#FBBF24] to-[#F59E0B]"
          />
        </section>

        {/* TABLEAU HISTORIQUE */}
        <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Motif global</th>
                <th className="px-4 py-3 text-left">Méthode</th>
                <th className="px-4 py-3 text-left">Montant total</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandes.length ? (
                demandes.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-gray-100 hover:bg-[#F9F9FF] transition"
                  >
                    <td className="px-4 py-2">{d.datePrevue}</td>
                    <td className="px-4 py-2">{d.motifGlobal}</td>
                    <td className="px-4 py-2">{d.methodePrevue}</td>
                    <td className="px-4 py-2 font-medium">
                      {formatFCFA(d.montantTotal)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutBadge(
                          d.statut
                        )}`}
                      >
                        {d.statut.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          setSelected(d);
                          setOpenDetail(true);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]"
                        title="Voir le détail"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-6">
                    Aucun décaissement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* FOOTER */}


        {/* MODALE CRÉATION */}
        <FormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          title="Nouvelle demande de décaissement"
        >
          <DecaissementForm
            onSubmit={handleAdd}
            onCancel={() => setOpenModal(false)}
            submitting={false}
          />
        </FormModal>

        {/* MODALE DÉTAIL */}
        <DetailDecaissementModal
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          decaissement={selected}
        />
      </div>
    </div>
  );
}

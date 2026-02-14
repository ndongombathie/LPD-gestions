import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Card, { CardHeader } from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";

import { formatCurrency, formatDate } from "../../../utils/formatters.js";
import journalCaisseAPI from "@/services/api/journalCaisse";

/* =========================================================
   FORMAT FCFA PDF SAFE
========================================================= */
const formatFCFA_PDF = (value) =>
  Number(value || 0)
    .toLocaleString("fr-FR")
    .replace(/\s/g, ".") + " FCFA";

export default function JournalCaisse() {

  /* ================== STATE ================== */

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================== FETCH API ================== */

  useEffect(() => {

    const fetchJournal = async () => {
      try {
        setLoading(true);

        const data = await journalCaisseAPI.getJournalComplet(selectedDate);

        const encaissement = Number(data?.totalEncaissement || 0);
        const decaissement = Number(data?.totalDecaissement || 0);

        setRapport({
          fond_ouverture: 0,
          total_encaissements: encaissement,
          total_decaissements: decaissement,
          solde_cloture: encaissement - decaissement,
          cloture: true,
          ventes_par_moyen: data?.ventesParMoyen || {},
        });

      } catch (error) {
        console.error("Erreur journal caisse:", error);
        setRapport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();

  }, [selectedDate]);

  /* ================== EXPORT PDF PRO ================== */

  const handleExportPDF = () => {

    if (!rapport) return;

    const doc = new jsPDF("p", "mm", "a4");

    /* ===== HEADER LPD ===== */
    doc.setFillColor(71, 46, 173);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("LPD", 105, 18, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "LIBRAIRIE PAPETERIE DARADJI",
      105,
      24,
      { align: "center" }
    );

    doc.setTextColor(0);

    let y = 40;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("JOURNAL DE CAISSE — COMPTABLE", 14, y);

    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Date : ${formatDate(selectedDate)}`, 14, y);

    y += 10;

    /* ===== TABLEAU ===== */
    autoTable(doc, {
      startY: y,
      head: [["Libellé", "Montant"]],
      body: [
        ["Encaissements", formatFCFA_PDF(rapport.total_encaissements)],
        ["Décaissements", formatFCFA_PDF(rapport.total_decaissements)],
        ["Solde", formatFCFA_PDF(rapport.solde_cloture)],
      ],
      headStyles: {
        fillColor: [71, 46, 173],
        textColor: 255,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
      },
      styles: {
        fontSize: 11,
      },
    });

    /* ===== FOOTER ===== */
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Document généré le ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.height - 10
    );

    doc.save(`Journal_Caisse_${selectedDate}.pdf`);
  };

  /* ================== UI ================== */

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-[#472EAD]">
              Journal de caisse — Comptable
            </h1>
            {rapport?.cloture && <Badge variant="success">Clôturé</Badge>}
          </div>
          <p className="text-gray-600 mt-1">
            Consultation des mouvements du {formatDate(selectedDate)}
          </p>
        </div>

        <div className="flex gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!rapport}
            className="border-2 border-[#472EAD] text-[#472EAD]"
          >
            Exporter PDF
          </Button>
        </div>

      </div>

      {/* LOADING */}
      {loading && (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Chargement en cours...
          </div>
        </Card>
      )}

      {/* EMPTY */}
      {!loading && !rapport && (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Aucun rapport disponible
          </div>
        </Card>
      )}

      {/* CONTENT */}
      {!loading && rapport && (
        <Card>
          <CardHeader title={`Résumé du ${formatDate(selectedDate)}`} />

          {/* GRID RESPONSIVE FIXÉ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">

            <Resume
              label="Encaissements"
              value={rapport.total_encaissements}
              color="green"
            />

            <Resume
              label="Décaissements"
              value={rapport.total_decaissements}
              color="red"
            />

            <Resume
              label="Solde"
              value={rapport.solde_cloture}
              color="orange"
            />

          </div>
        </Card>
      )}

    </div>
  );
}

/* =========================================================
   RESUME COMPONENT PROPRE ET STABLE
========================================================= */

function Resume({ label, value, color }) {

  const colors = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
  };

  return (
    <div className="w-full bg-gray-50 rounded-xl p-6 text-center shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${colors[color] || ""}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

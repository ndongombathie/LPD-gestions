import React, { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Card, { CardHeader } from "../../../components/ui/Card.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";

import { formatCurrency, formatDate } from "../../../utils/formatters.js";

/* =========================================================
   ✅ FORMAT FCFA COMPATIBLE PDF (PAS DE CARACTÈRES BIZARRES)
========================================================= */
const formatFCFA_PDF = (value) => {
  return (
    Number(value || 0)
      .toLocaleString("fr-FR")
      .replace(/\s/g, ".") + " FCFA"
  );
};

export default function JournalCaisse() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const previousDateRef = useRef(selectedDate);

  // ⚠️ Données simulées (API plus tard)
  const [rapportsParDate, setRapportsParDate] = useState({
    [selectedDate]: {
      fond_ouverture: 50000,
      total_encaissements: 245000,
      total_decaissements: 15000,
      solde_cloture: 280000,
      cloture: true,
      ventes_par_moyen: {
        especes: 120000,
        carte: 80000,
        wave: 25000,
        om: 20000,
      },
      tickets_encaisses: [],
      decaissements: [],
    },
  });

  const rapport = rapportsParDate[selectedDate] || null;

  // 🔄 Gestion changement de date
  useEffect(() => {
    const prev = previousDateRef.current;

    if (prev !== selectedDate) {
      setRapportsParDate((prevState) => {
        if (prevState[selectedDate]) return prevState;

        return {
          ...prevState,
          [selectedDate]: {
            fond_ouverture: 0,
            total_encaissements: 0,
            total_decaissements: 0,
            solde_cloture: 0,
            cloture: true,
            ventes_par_moyen: {},
            tickets_encaisses: [],
            decaissements: [],
          },
        };
      });
    }

    previousDateRef.current = selectedDate;
  }, [selectedDate]);

  /* =========================================================
     🖨️ EXPORT PDF PRO (CORRIGÉ)
  ========================================================= */
  const handleExportPDF = () => {
    if (!rapport) return;

    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;

    // TITRE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("JOURNAL DE CAISSE — COMPTABLE", 14, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Date : ${formatDate(selectedDate)}`, 14, y);

    y += 6;
    doc.text(
      `Statut : ${rapport.cloture ? "Clôturé" : "En cours"}`,
      14,
      y
    );

    y += 10;

    // TABLEAU RÉSUMÉ
    autoTable(doc, {
      startY: y,
      head: [["Libellé", "Montant"]],
      body: [
        ["Fond d'ouverture", formatFCFA_PDF(rapport.fond_ouverture)],
        ["Encaissements", formatFCFA_PDF(rapport.total_encaissements)],
        ["Décaissements", formatFCFA_PDF(rapport.total_decaissements)],
        ["Solde de clôture", formatFCFA_PDF(rapport.solde_cloture)],
      ],
      headStyles: {
        fillColor: [71, 46, 173],
        textColor: 255,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 11,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    // VENTES PAR MOYEN
    if (Object.keys(rapport.ventes_par_moyen).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Ventes par moyen de paiement", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Moyen de paiement", "Montant"]],
        body: Object.entries(rapport.ventes_par_moyen).map(
          ([moyen, montant]) => [
            moyen.toUpperCase(),
            formatFCFA_PDF(montant),
          ]
        ),
        headStyles: {
          fillColor: [40, 120, 180],
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
    }

    // PIED DE PAGE
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Document généré le ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.height - 10
    );

    doc.save(`Journal_Caisse_${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#472EAD]">
              Journal de caisse — Comptable
            </h1>
            {rapport?.cloture && <Badge variant="success">Clôturé</Badge>}
          </div>
          <p className="text-gray-600 mt-1">
            Consultation des mouvements de caisse du{" "}
            {formatDate(selectedDate)}
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
            className="border-2 border-[#472EAD] text-[#472EAD]"
          >
            Exporter PDF
          </Button>
        </div>
      </div>

      {!rapport ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            Aucun rapport disponible
          </div>
        </Card>
      ) : (
        <>
          {/* RÉSUMÉ */}
          <Card>
            <CardHeader title={`Résumé du ${formatDate(selectedDate)}`} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Resume label="Fond d'ouverture" value={rapport.fond_ouverture} />
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
                label="Solde clôture"
                value={rapport.solde_cloture}
                color="orange"
              />
            </div>
          </Card>

          {/* VENTES PAR MOYEN */}
          <Card>
            <CardHeader title="Ventes par moyen de paiement" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(rapport.ventes_par_moyen).map(
                ([moyen, montant]) => (
                  <div
                    key={moyen}
                    className="text-center p-4 bg-gray-50 rounded"
                  >
                    <p className="text-sm text-gray-600">{moyen}</p>
                    <p className="font-bold">
                      {formatCurrency(montant)}
                    </p>
                  </div>
                )
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* 🔹 Sous-composant résumé (HTML uniquement) */
function Resume({ label, value, color }) {
  const colors = {
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
  };

  return (
    <div className="text-center p-4 bg-gray-50 rounded">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] || ""}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

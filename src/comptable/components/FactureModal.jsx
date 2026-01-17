// ==========================================================
// 🧾 FactureModal.jsx — Génération de facture professionnelle
// ==========================================================

import React from "react";
import FormModal from "./FormModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";

/* ===================== Logger local ===================== */
const logWarning = (context, error) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[${context}]`, error);
  }
};

export default function FactureModal({ open, onClose, commande }) {
  if (!commande) return null;

  const formatFCFA = (n) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(Number(n || 0));

  // ————————————————————————————————————————
  // Génération du PDF
  // ————————————————————————————————————————
  const generatePDF = async () => {
    const doc = new jsPDF();
    const logo = "/logo-lpd.png";
    const qrData = `Client: ${commande.client} | Total: ${commande.montantTotal} | Payé: ${commande.montantPaye} | Date: ${commande.date}`;
    const qrCode = await QRCode.toDataURL(qrData, { width: 100 });

    // === En-tête LPD ===
    if (logo) {
      try {
        doc.addImage(logo, "PNG", 14, 10, 25, 25);
      } catch (error) {
        logWarning("FactureModal - Logo PDF", error);
      }
    }

    doc.setFontSize(18);
    doc.setTextColor(71, 46, 173);
    doc.text("Facture Client — LPD Manager", 45, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date : ${commande.date}`, 45, 27);
    doc.text(`Référence : CMD-${commande.id || "0000"}`, 45, 32);

    doc.line(14, 38, 195, 38);

    // === Infos client ===
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text(`Client : ${commande.client}`, 14, 46);
    doc.text(`Date : ${commande.date}`, 14, 52);
    doc.text(`Statut : ${commande.statut}`, 14, 58);

    // === Tableau des montants ===
    doc.autoTable({
      startY: 66,
      head: [["Description", "Montant (FCFA)"]],
      body: [
        ["Montant total", formatFCFA(commande.montantTotal)],
        ["Montant payé", formatFCFA(commande.montantPaye)],
        [
          "Reste à payer",
          formatFCFA(commande.montantTotal - commande.montantPaye),
        ],
      ],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [71, 46, 173], textColor: 255 },
      theme: "grid",
    });

    // === QR Code ===
    const y = doc.lastAutoTable.finalY + 10;
    doc.addImage(qrCode, "PNG", 160, y, 30, 30);
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Scannez le QR code pour vérifier cette facture.", 14, y + 10);

    // === Pied de page ===
    const footerY = doc.lastAutoTable.finalY + 50;
    doc.setTextColor(120);
    doc.setFontSize(9);
    doc.text(
      "LPD Consulting — Logiciel de gestion professionnelle",
      14,
      footerY
    );
    doc.text(
      "www.lpd-consulting.com | support@lpd-consulting.com",
      14,
      footerY + 5
    );

    doc.save(`Facture_${commande.client}_${commande.date}.pdf`);
  };

  // ————————————————————————————————————————
  // Rendu visuel
  // ————————————————————————————————————————
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Facture — ${commande.client}`}
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p><b>Client :</b> {commande.client}</p>
          <p><b>Date :</b> {commande.date}</p>
          <p>
            <b>Statut :</b>{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                commande.statut === "Payée"
                  ? "bg-emerald-100 text-emerald-700"
                  : commande.statut === "Partiellement payée"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {commande.statut}
            </span>
          </p>
          <p><b>Montant total :</b> {formatFCFA(commande.montantTotal)}</p>
          <p><b>Montant payé :</b> {formatFCFA(commande.montantPaye)}</p>
          <p>
            <b>Reste à payer :</b>{" "}
            {formatFCFA(commande.montantTotal - commande.montantPaye)}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-black rounded-lg text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
          <button
            onClick={generatePDF}
            className="px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] hover:opacity-95"
          >
            Télécharger PDF
          </button>
        </div>
      </div>
    </FormModal>
  );
}

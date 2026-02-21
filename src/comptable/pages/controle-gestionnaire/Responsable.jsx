import { useState, useMemo } from "react";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =======================
   DONNÉES
======================= */
const data = [
  { id: 1, type: "decaissement", date: "2025-01-12", motif: "Achat carburant", montant: 50000 },
  { id: 2, type: "encaissement", date: "2025-01-12", motif: "Paiement client", montant: 200000 },
  { id: 3, type: "vente_speciale", date: "2025-04-12", client: "Client A", montant: 120000 },
  { id: 4, type: "dette", client: "Client B", dette: 100000, paye: 70000 },
];

/* =======================
   UTILS
======================= */
const fcfa = (v) =>
  Number(v || 0).toLocaleString("de-DE") + " FCFA";

export default function Responsable() {

  const [typeFiltre, setTypeFiltre] = useState("tous");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  /* =======================
     DETTES
  ======================= */
  const dettes = useMemo(() => {
    return data
      .filter(d => d.type === "dette" && d.dette > d.paye)
      .map(d => ({
        client: d.client,
        dette: d.dette,
        paye: d.paye,
        reste: d.dette - d.paye,
      }));
  }, []);

  /* =======================
     MOUVEMENTS FILTRÉS
  ======================= */
  const mouvementsFiltres = useMemo(() => {
    return data.filter(item => {

      if (item.type === "dette") return false;

      if (
        typeFiltre !== "tous" &&
        typeFiltre !== "clients_endettes" &&
        item.type !== typeFiltre
      ) return false;

      if (dateDebut && item.date < dateDebut) return false;
      if (dateFin && item.date > dateFin) return false;

      return true;
    });
  }, [typeFiltre, dateDebut, dateFin]);

  const totalMontant = mouvementsFiltres.reduce(
    (s, m) => s + (m.montant || 0),
    0
  );

  /* =======================
     IMPRESSION PDF
  ======================= */
  const imprimerPDF = async () => {

    const doc = new jsPDF();
    let cursorY = 15;

    const img = new Image();
    img.src = "/lpd-logo.png";

    await new Promise(resolve => {
      img.onload = resolve;
    });

    doc.addImage(img, "PNG", 14, cursorY, 40, 20);
    cursorY += 30;

    doc.setFontSize(16);
    doc.text("RAPPORT FINANCIER LPD", 14, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, cursorY);
    cursorY += 10;

    if (typeFiltre === "tous") {

      autoTable(doc, {
        startY: cursorY,
        head: [["Date", "Type", "Description", "Montant"]],
        body: mouvementsFiltres.map(m => [
          m.date,
          m.type.replace("_", " "),
          m.motif || m.client,
          fcfa(m.montant),
        ]),
      });

      cursorY = doc.lastAutoTable.finalY + 10;

      autoTable(doc, {
        startY: cursorY,
        head: [["Client", "Dette", "Payé", "Reste"]],
        body: dettes.map(d => [
          d.client,
          fcfa(d.dette),
          fcfa(d.paye),
          fcfa(d.reste),
        ]),
      });

      doc.save("Rapport_Complet_LPD.pdf");
      return;
    }

    if (typeFiltre === "clients_endettes") {

      autoTable(doc, {
        startY: cursorY,
        head: [["Client", "Dette", "Payé", "Reste"]],
        body: dettes.map(d => [
          d.client,
          fcfa(d.dette),
          fcfa(d.paye),
          fcfa(d.reste),
        ]),
      });

      doc.save("Clients_Endettes_LPD.pdf");
      return;
    }

    autoTable(doc, {
      startY: cursorY,
      head: [["Date", "Type", "Description", "Montant"]],
      body: mouvementsFiltres.map(m => [
        m.date,
        m.type.replace("_", " "),
        m.motif || m.client,
        fcfa(m.montant),
      ]),
      foot: [["", "", "TOTAL", fcfa(totalMontant)]],
    });

    doc.save(`Rapport_${typeFiltre}_LPD.pdf`);
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="p-6 space-y-10">

      <h1 className="text-2xl font-bold text-indigo-700">
        Suivi des activités du Responsable
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow">

        <select
          className="border px-3 py-2 rounded-lg"
          value={typeFiltre}
          onChange={(e) => setTypeFiltre(e.target.value)}
        >
          <option value="tous">Tous</option>
          <option value="decaissement">Décaissement</option>
          <option value="encaissement">Encaissement</option>
          <option value="vente_speciale">Vente spéciale</option>
          <option value="clients_endettes">Clients endettés</option>
        </select>

        <input
          type="date"
          className="border px-3 py-2 rounded-lg"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
        />

        <input
          type="date"
          className="border px-3 py-2 rounded-lg"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
        />

        <button
          onClick={imprimerPDF}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center justify-center"
        >
          <Printer size={18} /> Imprimer PDF
        </button>
      </div>

      {/* MOUVEMENTS */}
      {typeFiltre !== "clients_endettes" && (
        <div className="space-y-6">

          <div className="bg-indigo-50 p-4 rounded-xl shadow text-right font-semibold text-indigo-700">
            Total mouvements : {fcfa(totalMontant)}
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {mouvementsFiltres.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{m.date}</td>
                    <td className="p-4">{m.type.replace("_", " ")}</td>
                    <td className="p-4">{m.motif || m.client}</td>
                    <td className="p-4 text-right font-semibold">
                      {fcfa(m.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETTES */}
      {(typeFiltre === "tous" || typeFiltre === "clients_endettes") && (
        <div className="space-y-6">

          <h2 className="text-lg font-bold text-red-600">
            Clients Endettés
          </h2>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="p-4 text-left">Client</th>
                  <th className="p-4 text-right">Dette</th>
                  <th className="p-4 text-right">Payé</th>
                  <th className="p-4 text-right">Reste</th>
                </tr>
              </thead>
              <tbody>
                {dettes.map((d, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-4">{d.client}</td>
                    <td className="p-4 text-right">{fcfa(d.dette)}</td>
                    <td className="p-4 text-right">{fcfa(d.paye)}</td>
                    <td className="p-4 text-right text-red-600 font-bold">
                      {fcfa(d.reste)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
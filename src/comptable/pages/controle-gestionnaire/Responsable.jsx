import React, { useState, useMemo } from "react";
import { Search, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =======================
   DONNÉES (EXEMPLE)
======================= */
const data = [
  {
    id: 1,
    type: "decaissement",
    date: "2025-01-12",
    motif: "Achat de carburant",
    montant: 50000,
    statut: "Validé",
  },
  {
    id: 2,
    type: "vente_speciale",
    date: "2025-01-12",
    client: "Client A",
    montant: 120000,
  },
  {
    id: 3,
    type: "vente_speciale",
    date: "2025-04-12",
    client: "Client A",
    montant: 120000,
  },
  {
    id: 4,
    type: "dette",
    client: "Client B",
    dette: 100000,
    paye: 70000,
  },
];

/* =======================
        UTILS
======================= */
const fcfaPoint = (v) =>
  `${Number(v || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} FCFA`;

export default function Responsable() {
  const [search, setSearch] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [imprimerDettes, setImprimerDettes] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  /* =======================
     MOUVEMENTS FILTRÉS
  ======================= */
  const mouvementsFiltres = useMemo(() => {
    return data.filter((item) => {
      if (item.type === "dette") return false;

      const texte = JSON.stringify(item).toLowerCase();
      const matchSearch = texte.includes(search.toLowerCase());

      let matchDate = false;
      if (!dateDebut && !dateFin) matchDate = item.date === today;
      else if (dateDebut && !dateFin) matchDate = item.date === dateDebut;
      else if (dateDebut && dateFin)
        matchDate = item.date >= dateDebut && item.date <= dateFin;

      return matchSearch && matchDate;
    });
  }, [search, dateDebut, dateFin, today]);

  const decaissements = mouvementsFiltres.filter(
    (m) => m.type === "decaissement"
  );
  const ventes = mouvementsFiltres.filter(
    (m) => m.type === "vente_speciale"
  );

  /* =======================
     CLIENTS ENDETTÉS
  ======================= */
  const dettes = useMemo(() => {
    return data
      .filter((d) => d.type === "dette" && d.dette > d.paye)
      .map((d) => ({
        client: d.client,
        dette: d.dette,
        paye: d.paye,
      }));
  }, []);

  /* =======================
     TOTAUX
  ======================= */
  const totalDecaissements = decaissements.reduce(
    (s, d) => s + d.montant,
    0
  );
  const totalVentes = ventes.reduce((s, v) => s + v.montant, 0);
  const totalDette = dettes.reduce((s, d) => s + d.dette, 0);
  const totalPaye = dettes.reduce((s, d) => s + d.paye, 0);
  const totalReste = dettes.reduce(
    (s, d) => s + (d.dette - d.paye),
    0
  );

  /* =======================
     IMPRESSION PDF (STABLE)
  ======================= */
  const imprimerPDF = () => {
    const doc = new jsPDF();
    let cursorY = 20;
    doc.setFontSize(14);

    /* ===== CAS 1 : DETTES UNIQUEMENT ===== */
    if (imprimerDettes) {
      if (!dettes.length) {
        alert("Aucun client endetté à imprimer");
        return;
      }

      doc.text("RAPPORT — CLIENTS ENDETTÉS", 14, cursorY);
      cursorY += 10;

      autoTable(doc, {
        startY: cursorY,
        head: [["Client", "Dette", "Payé", "Reste"]],
        body: dettes.map((d) => [
          d.client,
          fcfaPoint(d.dette),
          fcfaPoint(d.paye),
          fcfaPoint(d.dette - d.paye),
        ]),
        foot: [[
          "TOTAL",
          fcfaPoint(totalDette),
          fcfaPoint(totalPaye),
          fcfaPoint(totalReste),
        ]],
        styles: { fontSize: 11 },
      });

      doc.save("Clients_Endettes.pdf");
      return;
    }

    /* ===== CAS 2 : MOUVEMENTS ===== */
    if (!mouvementsFiltres.length) {
      alert("Aucun mouvement à imprimer");
      return;
    }

    let titre = "RAPPORT DES MOUVEMENTS DU RESPONSABLE";
    if (dateDebut && !dateFin) titre += ` — ${dateDebut}`;
    if (dateDebut && dateFin)
      titre += ` — DU ${dateDebut} AU ${dateFin}`;

    doc.text(titre, 14, cursorY);
    cursorY += 12;

    /* ---- DÉCAISSEMENTS ---- */
    if (decaissements.length) {
      doc.text("DÉCAISSEMENTS", 14, cursorY);
      cursorY += 6;

      autoTable(doc, {
        startY: cursorY,
        head: [["Date", "Motif", "Montant"]],
        body: decaissements.map((d) => [
          d.date,
          d.motif,
          fcfaPoint(d.montant),
        ]),
        foot: [["", "TOTAL", fcfaPoint(totalDecaissements)]],
        styles: { fontSize: 11 },
      });

      cursorY = doc.lastAutoTable.finalY + 12;
    }

    /* ---- VENTES SPÉCIALES ---- */
    if (ventes.length) {
      doc.text("VENTES SPÉCIALES", 14, cursorY);
      cursorY += 6;

      autoTable(doc, {
        startY: cursorY,
        head: [["Date", "Client", "Montant"]],
        body: ventes.map((v) => [
          v.date,
          v.client,
          fcfaPoint(v.montant),
        ]),
        foot: [["", "TOTAL", fcfaPoint(totalVentes)]],
        styles: { fontSize: 11 },
      });
    }

    doc.save("Mouvements_Responsable.pdf");
  };

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-indigo-700">
        Suivi des activités du Responsable
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <input
          className="border px-3 py-2"
          placeholder="Recherche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input type="date" className="border px-3 py-2" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        <input type="date" className="border px-3 py-2" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={imprimerDettes} onChange={(e) => setImprimerDettes(e.target.checked)} />
          Imprimer clients endettés
        </label>
        <button onClick={imprimerPDF} className="bg-indigo-600 text-white px-4 py-2 flex gap-2 items-center">
          <Printer size={18} /> Imprimer PDF
        </button>
      </div>

      <SectionDecaissements data={decaissements} total={totalDecaissements} />
      <SectionVentes data={ventes} total={totalVentes} />
      <SectionDettes data={dettes} totalDette={totalDette} totalPaye={totalPaye} totalReste={totalReste} />
    </div>
  );
}

/* =======================
   SECTIONS
======================= */

function SectionDecaissements({ data, total }) {
  if (!data.length) return null;
  return (
    <section>
      <h2 className="font-semibold text-indigo-700 mb-2">Décaissements</h2>
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 w-1/4 text-left">Date</th>
            <th className="p-3 w-1/2 text-left">Motif</th>
            <th className="p-3 w-1/4 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <td className="p-3">{d.date}</td>
              <td className="p-3">{d.motif}</td>
              <td className="p-3 text-right">{fcfaPoint(d.montant)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td></td>
            <td className="text-right">Total</td>
            <td className="text-right text-indigo-700">{fcfaPoint(total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function SectionVentes({ data, total }) {
  if (!data.length) return null;
  return (
    <section>
      <h2 className="font-semibold text-indigo-700 mb-2">Ventes spéciales</h2>
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 w-1/4 text-left">Date</th>
            <th className="p-3 w-1/2 text-left">Client</th>
            <th className="p-3 w-1/4 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {data.map((v) => (
            <tr key={v.id}>
              <td className="p-3">{v.date}</td>
              <td className="p-3">{v.client}</td>
              <td className="p-3 text-right">{fcfaPoint(v.montant)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td></td>
            <td className="text-right">Total</td>
            <td className="text-right text-indigo-700">{fcfaPoint(total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function SectionDettes({ data, totalDette, totalPaye, totalReste }) {
  if (!data.length) return null;
  return (
    <section>
      <h2 className="font-semibold text-indigo-700 mb-2">Clients endettés</h2>
      <table className="w-full table-fixed border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 w-1/4 text-left">Client</th>
            <th className="p-3 w-1/4 text-right">Dette</th>
            <th className="p-3 w-1/4 text-right">Payé</th>
            <th className="p-3 w-1/4 text-right">totalReste</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td className="p-3">{d.client}</td>
              <td className="p-3 text-right">{fcfaPoint(d.dette)}</td>
              <td className="p-3 text-right">{fcfaPoint(d.paye)}</td>
              <td className="p-3 text-right text-red-600 font-bold">
                {fcfaPoint(d.dette - d.paye)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td className="text-right">Total</td>
            <td className="text-right text-indigo-700">{fcfaPoint(totalDette)}</td>
            <td className="text-right text-green-700">{fcfaPoint(totalPaye)}</td>
            <td className="text-right text-red-700">{fcfaPoint(totalReste)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

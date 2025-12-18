// ======================================================================
// 📌 ControleResponsable.jsx — Page PRO pour Comptable (LPD Manager)
// Comptable visualise :
// - Demandes (décaissement / encaissement)
// - Ventes spéciales
// - Clients spéciaux + dettes
// - Filtres + Graphiques + PDF PRO
// ======================================================================

import React, { useState, useMemo } from "react";
import { Search, Printer, CheckCircle, XCircle, Clock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ======================================================================
// 🔧 MOCK — DONNÉES SIMULÉES
// ======================================================================

// --- Demandes du responsable
const demandesMock = [
  { id: 1, type: "décaissement", montant: 50000, motif: "Achat urgent stock", date: "2025-02-12", statut: "en attente" },
  { id: 2, type: "encaissement", montant: 35000, motif: "Paiement client spécial", date: "2025-02-14", statut: "validé" },
  { id: 3, type: "décaissement", montant: 78000, motif: "Fournisseur cahiers", date: "2025-02-15", statut: "refusé" },
];

// --- Ventes spéciales
const ventesSpecialesMock = [
  { id: 1, client: "Client A", montant: 120000, date: "2025-02-12" },
  { id: 2, client: "Client B", montant: 45000, date: "2025-02-13" },
  { id: 3, client: "Client C", montant: 70000, date: "2025-02-14" },
];

// --- Clients spéciaux
const clientsSpeciauxMock = [
  { id: 1, nom: "Client A", telephone: "771234567", totalAchat: 200000, totalPaye: 80000 },
  { id: 2, nom: "Client B", telephone: "780112233", totalAchat: 150000, totalPaye: 150000 },
  { id: 3, nom: "Client C", telephone: "760998877", totalAchat: 300000, totalPaye: 120000 },
];

// ======================================================================
// 📌 PAGE PRINCIPALE
// ======================================================================
export default function ControleResponsable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyDebts, setOnlyDebts] = useState(false);

  // ======================================================================
  // 🔍 FILTRES
  // ======================================================================
  const demandesFiltrees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return demandesMock.filter(
      (d) =>
        d.motif.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const ventesFiltrees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return ventesSpecialesMock.filter(
      (v) =>
        v.client.toLowerCase().includes(q) ||
        v.date.includes(q)
    );
  }, [searchTerm]);

  const clientsFiltres = useMemo(() => {
    const q = searchTerm.toLowerCase();
    let data = clientsSpeciauxMock.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.telephone.includes(q)
    );

    if (onlyDebts) {
      data = data.filter((c) => c.totalAchat - c.totalPaye > 0);
    }

    return data;
  }, [searchTerm, onlyDebts]);

  // ======================================================================
  // 📄 PDF — TOUTES LES DEMANDES
  // ======================================================================
  const imprimerDemandesPDF = () => {
    const doc = new jsPDF();
    doc.text("Toutes les demandes — Responsable LPD Manager", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Type", "Montant", "Motif", "Date", "Statut"]],
      body: demandesMock.map((d) => [
        d.type,
        d.montant + " FCFA",
        d.motif,
        d.date,
        d.statut,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Demandes_Responsable.pdf");
  };

  // ======================================================================
  // 📄 PDF — ENCAISSEMENTS
  // ======================================================================
  const imprimerEncaissementsPDF = () => {
    const data = demandesMock.filter((d) => d.type === "encaissement");

    const doc = new jsPDF();
    doc.text("Encaissements — Responsable LPD Manager", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Montant", "Motif", "Date", "Statut"]],
      body: data.map((d) => [
        d.montant + " FCFA",
        d.motif,
        d.date,
        d.statut,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Encaissements_Responsable.pdf");
  };

  // ======================================================================
  // 📄 PDF — DÉCAISSEMENTS
  // ======================================================================
  const imprimerDecaissementsPDF = () => {
    const data = demandesMock.filter((d) => d.type === "décaissement");

    const doc = new jsPDF();
    doc.text("Décaissements — Responsable LPD Manager", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Montant", "Motif", "Date", "Statut"]],
      body: data.map((d) => [
        d.montant + " FCFA",
        d.motif,
        d.date,
        d.statut,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Decaissements_Responsable.pdf");
  };

  // ======================================================================
  // 📄 PDF — VENTES SPÉCIALES
  // ======================================================================
  const imprimerVentesPDF = () => {
    const doc = new jsPDF();
    doc.text("Ventes Spéciales — Responsable", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Client", "Montant", "Date"]],
      body: ventesSpecialesMock.map((v) => [
        v.client,
        v.montant + " FCFA",
        v.date,
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Ventes_Speciales_Responsable.pdf");
  };

  // ======================================================================
  // 📄 PDF — CLIENTS EN DETTE
  // ======================================================================
  const imprimerDettesPDF = () => {
    const data = clientsSpeciauxMock.filter((c) => c.totalAchat - c.totalPaye > 0);

    const doc = new jsPDF();
    doc.text("Clients en Dette — Responsable LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Client", "Téléphone", "Achat", "Payé", "Reste"]],
      body: data.map((c) => [
        c.nom,
        c.telephone,
        c.totalAchat + " FCFA",
        c.totalPaye + " FCFA",
        c.totalAchat - c.totalPaye + " FCFA",
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Clients_en_Dette.pdf");
  };

  // ======================================================================
  // 📄 PDF — TOUS LES CLIENTS SPÉCIAUX
  // ======================================================================
  const imprimerClientsPDF = () => {
    const doc = new jsPDF();
    doc.text("Clients Spéciaux — Responsable LPD", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Client", "Téléphone", "Achat", "Payé", "Reste"]],
      body: clientsSpeciauxMock.map((c) => [
        c.nom,
        c.telephone,
        c.totalAchat + " FCFA",
        c.totalPaye + " FCFA",
        c.totalAchat - c.totalPaye + " FCFA",
      ]),
      headStyles: { fillColor: [71, 46, 173] },
    });

    doc.save("Clients_Speciaux.pdf");
  };

  // ======================================================================
  // 🎨 GRAPHIQUES
  // ======================================================================
  const colors = ["#472EAD", "#F58020", "#5A3BE6", "#00C49F"];

  const chartVentes = ventesSpecialesMock.map((v) => ({
    name: v.client,
    montant: v.montant,
  }));

  const chartDettes = clientsSpeciauxMock.map((c) => ({
    name: c.nom,
    dette: c.totalAchat - c.totalPaye,
  }));

  return (
    <div className="p-6 space-y-6">

      {/* ===================================================================================== */}
      {/* 🔎 BARRE DE RECHERCHE + BOUTONS PDF */}
      {/* ===================================================================================== */}
      <div className="p-4 bg-white shadow rounded-xl border space-y-3">

        <div className="flex items-center gap-3">
          <Search className="text-[#472EAD]" />
          <input
            className="flex-1 border px-3 py-2 rounded-lg"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Boutons PDF */}
        <div className="flex flex-wrap gap-2 pt-2">

          <button onClick={imprimerDemandesPDF} className="bg-[#472EAD] text-white px-3 py-2 rounded text-sm">
            Toutes les demandes
          </button>

          <button onClick={imprimerEncaissementsPDF} className="bg-emerald-600 text-white px-3 py-2 rounded text-sm">
            Encaissements
          </button>

          <button onClick={imprimerDecaissementsPDF} className="bg-red-600 text-white px-3 py-2 rounded text-sm">
            Décaissements
          </button>

          <button onClick={imprimerVentesPDF} className="bg-orange-500 text-white px-3 py-2 rounded text-sm">
            Ventes spéciales
          </button>

          <button onClick={imprimerClientsPDF} className="bg-blue-500 text-white px-3 py-2 rounded text-sm">
            Clients spéciaux
          </button>

          <button onClick={imprimerDettesPDF} className="bg-red-700 text-white px-3 py-2 rounded text-sm">
            Clients en dette
          </button>

        </div>
      </div>

      {/* ===================================================================================== */}
      {/* 1️⃣ DEMANDES DU RESPONSABLE */}
      {/* ===================================================================================== */}
      <div className="bg-white shadow rounded-xl p-5 border">
        <h2 className="text-lg font-semibold text-[#472EAD]">Demandes du responsable</h2>

        <table className="w-full text-sm mt-4">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Montant</th>
              <th className="px-3 py-2">Motif</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {demandesFiltrees.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="px-3 py-2">{d.type}</td>
                <td className="px-3 py-2">{d.montant} FCFA</td>
                <td className="px-3 py-2">{d.motif}</td>
                <td className="px-3 py-2">{d.date}</td>
                <td className="px-3 py-2">
                  {d.statut === "validé" && <span className="text-green-600 font-semibold"><CheckCircle size={14}/> Validé</span>}
                  {d.statut === "refusé" && <span className="text-red-600 font-semibold"><XCircle size={14}/> Refusé</span>}
                  {d.statut === "en attente" && <span className="text-orange-500 font-semibold"><Clock size={14}/> En attente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===================================================================================== */}
      {/* 2️⃣ VENTES SPÉCIALES + GRAPHE */}
      {/* ===================================================================================== */}
      <div className="bg-white shadow rounded-xl p-5 border">
        <h2 className="text-lg font-semibold text-[#472EAD]">Ventes spéciales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

          <table className="text-sm border rounded-xl overflow-hidden">
            <thead className="bg-[#EFEAFF] text-[#472EAD]">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {ventesFiltrees.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="px-3 py-2">{v.client}</td>
                  <td className="px-3 py-2">{v.date}</td>
                  <td className="px-3 py-2 text-right">{v.montant} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartVentes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="montant" fill="#472EAD" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===================================================================================== */}
      {/* 3️⃣ CLIENTS SPÉCIAUX + DETTES + GRAPHE */}
      {/* ===================================================================================== */}
      <div className="bg-white shadow rounded-xl p-5 border">
        <h2 className="text-lg font-semibold text-[#472EAD]">Clients spéciaux & dettes</h2>

        {/* Filtre dette */}
        <div className="flex items-center gap-3 mt-2 mb-3">
          <input
            type="checkbox"
            checked={onlyDebts}
            onChange={(e) => setOnlyDebts(e.target.checked)}
          />
          <span className="text-sm text-[#472EAD] font-medium">Afficher uniquement les clients en dette</span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#EFEAFF] text-[#472EAD]">
            <tr>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Téléphone</th>
              <th className="px-3 py-2 text-right">Total Achat</th>
              <th className="px-3 py-2 text-right">Payé</th>
              <th className="px-3 py-2 text-right">Reste</th>
            </tr>
          </thead>
          <tbody>
            {clientsFiltres.map((c) => {
              const reste = c.totalAchat - c.totalPaye;
              return (
                <tr key={c.id} className="border-b">
                  <td className="px-3 py-2">{c.nom}</td>
                  <td className="px-3 py-2">{c.telephone}</td>
                  <td className="px-3 py-2 text-right">{c.totalAchat} FCFA</td>
                  <td className="px-3 py-2 text-right">{c.totalPaye} FCFA</td>
                  <td className={`px-3 py-2 text-right font-semibold ${reste > 0 ? "text-red-600" : "text-green-600"}`}>
                    {reste} FCFA
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Graphe des dettes */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartDettes}
                dataKey="dette"
                nameKey="name"
                outerRadius={100}
                label
              >
                {chartDettes.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

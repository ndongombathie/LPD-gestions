// ==========================================================
// 🧍‍♂️ ClientsSpeciauxComptable.jsx — Interface Comptable (LPD)
// Version simplifiée : lecture uniquement + historique client
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ListChecks } from "lucide-react";
import DataTable from "../../comptable/components/DataTable.jsx";
import { Loader2 } from "lucide-react";

// Utilitaire format FCFA
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

// ==========================================================
// 🧾 Modal Historique Client
// ==========================================================
function HistoriqueClientModal({ open, onClose, client, commandes }) {
  if (!open || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6"
      >
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h2 className="text-lg font-semibold text-[#472EAD]">
            Historique — {client.nom}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          Visualisation des commandes et paiements du client.
        </p>

        <div className="max-h-[450px] overflow-y-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">Total TTC</th>
                <th className="p-2 text-right">Payé</th>
                <th className="p-2 text-right">Reste</th>
                <th className="p-2 text-left">Statut</th>
              </tr>
            </thead>

            <tbody>
              {commandes.length ? (
                commandes.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.dateCommande}</td>
                    <td className="p-2 text-right">{formatFCFA(c.totalTTC)}</td>
                    <td className="p-2 text-right text-emerald-600">
                      {formatFCFA(c.montantPaye)}
                    </td>
                    <td className="p-2 text-right text-rose-600">
                      {formatFCFA(c.resteAPayer)}
                    </td>
                    <td className="p-2">{c.statutLabel}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-3 text-gray-500">
                    Aucun historique disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 text-sm"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 📌 Page Principale Comptable
// ==========================================================
export default function ClientsSpeciauxComptable() {
  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openHistorique, setOpenHistorique] = useState(false);
  const [clientSelectionne, setClientSelectionne] = useState(null);

  // Simulation DEMO
  useEffect(() => {
    setTimeout(() => {
      setClients([
        { id: 1, nom: "DIOP Mamadou", contact: "771234567", entreprise: "BAS", adresse: "Dakar" },
        { id: 2, nom: "SOW Aissatou", contact: "781112233", entreprise: "Imprisol", adresse: "Thiès" },
      ]);

      setCommandes([
        {
          id: 1,
          clientId: 1,
          dateCommande: "2025-11-02",
          totalTTC: 45000,
          montantPaye: 30000,
          resteAPayer: 15000,
          statutLabel: "Partiellement payée",
        },
      ]);

      setLoading(false);
    }, 600);
  }, []);

  // Fusion clients + commandes
  const clientsAvecStats = useMemo(() => {
    return clients.map((c) => {
      const cs = commandes.filter((x) => x.clientId === c.id);

      const totalTTC = cs.reduce((s, x) => s + (x.totalTTC || 0), 0);
      const totalPaye = cs.reduce((s, x) => s + (x.montantPaye || 0), 0);
      const dette = cs.reduce((s, x) => s + (x.resteAPayer || 0), 0);

      return {
        ...c,
        totalTTC,
        totalPaye,
        dette,
        nbCommandes: cs.length,
      };
    });
  }, [clients, commandes]);

  const filtered = clientsAvecStats.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin w-6 h-6 text-[#472EAD]" />
        <span className="ml-2 text-sm text-[#472EAD]">
          Chargement des clients spéciaux...
        </span>
      </div>
    );

  return (
    <>
      <div className="px-5 py-4">
        {/* 📌 Header */}
        <h1 className="text-2xl font-bold text-[#472EAD] mb-1">
          Clients spéciaux (Comptable)
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Consultation uniquement — historique accessible.
        </p>

        {/* 🔍 Recherche */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 border rounded-xl w-full text-sm"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 📋 Tableau */}
        <DataTable
          columns={[
            { key: "nom", label: "Nom" },
            { key: "entreprise", label: "Entreprise" },
            { key: "contact", label: "Contact" },
            {
              key: "totalTTC",
              label: "Total TTC",
              render: (v) => <span className="font-semibold">{formatFCFA(v)}</span>,
            },
            {
              key: "totalPaye",
              label: "Payé",
              render: (v) => (
                <span className="text-emerald-600 font-semibold">{formatFCFA(v)}</span>
              ),
            },
            {
              key: "dette",
              label: "Dette",
              render: (v) =>
                v > 0 ? (
                  <span className="text-rose-600 font-semibold">{formatFCFA(v)}</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">A jour</span>
                ),
            },
            { key: "nbCommandes", label: "Cmds" },
          ]}
          data={filtered}
          actions={[
            {
              title: "Voir historique",
              icon: <ListChecks size={16} />,
              color: "text-[#472EAD]",
              onClick: (row) => {
                setClientSelectionne(row);
                setOpenHistorique(true);
              },
            },
          ]}
        />
      </div>

      {/* Modal Historique */}
      <HistoriqueClientModal
        open={openHistorique}
        onClose={() => setOpenHistorique(false)}
        client={clientSelectionne}
        commandes={commandes.filter((c) => c.clientId === clientSelectionne?.id)}
      />
    </>
  );
}

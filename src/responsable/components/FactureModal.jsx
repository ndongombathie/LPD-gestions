// ==========================================================
// 📦 FactureModal.jsx — Modal détail commande
// Compatible normalizeCommande
// ==========================================================

import React from "react";
import FormModal from "./FormModal";

export default function FactureModal({ open, onClose, commande }) {
  if (!commande) return null;

  const formatFCFA = (n) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(Number(n || 0));

  const lignes = commande.lignes || [];

  const totalArticles = lignes.reduce((s, l) => s + Number(l.qte || 0), 0);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Détail commande #${commande.numero}`}
    >
      <div className="space-y-6 text-sm text-gray-700">

        {/* ================= CLIENT ================= */}

        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex justify-between">

          <div>
            <div className="text-xs text-gray-500">Client spécial</div>
            <div className="font-semibold text-base">
              {commande.clientNom}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              Contact : {commande.clientContact || "—"}
            </div>
          </div>

          <div className="text-right">
            <div>
              <span className="text-gray-500">Date :</span>{" "}
              {commande.dateCommande}
            </div>

            <div className="text-xs text-gray-500">
              Statut caisse :{" "}
              <span className="font-semibold">
                {commande.statutLabel}
              </span>
            </div>
          </div>

        </div>

        {/* ================= PRODUITS ================= */}

        <div className="border border-gray-200 rounded-xl overflow-hidden">

          <table className="min-w-full text-xs">

            <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="px-3 py-2 text-left">Mode</th>
                <th className="px-3 py-2 text-right">Qté</th>
                <th className="px-3 py-2 text-right">PU</th>
                <th className="px-3 py-2 text-right">Total HT</th>
                <th className="px-3 py-2 text-right">Total TTC</th>
              </tr>
            </thead>

            <tbody>

              {lignes.map((l) => (

                <tr key={l.id} className="border-t hover:bg-gray-50">

                  {/* PRODUIT */}

                  <td className="px-3 py-2">

                    <div className="font-medium">
                      {l.libelle}
                    </div>

                    {l.ref && (
                      <div className="font-mono text-[10px] text-gray-500 tracking-wider">
                        {l.ref}
                      </div>
                    )}

                  </td>

                  {/* MODE */}

                  <td className="px-3 py-2 text-gray-600">

                    {l.modeVente === "gros"
                      ? "Gros (cartons/boîtes)"
                      : "Détail (unités)"}

                  </td>

                  {/* QTE */}

                  <td className="px-3 py-2 text-right">
                    {l.qte}
                  </td>

                  {/* PRIX */}

                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.prixUnitaire)}
                  </td>

                  {/* TOTAL HT */}

                  <td className="px-3 py-2 text-right">
                    {formatFCFA(l.totalHT)}
                  </td>

                  {/* TOTAL TTC */}

                  <td className="px-3 py-2 text-right font-semibold">
                    {formatFCFA(l.totalTTC)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* ================= TOTAUX ================= */}

        <div className="flex justify-end">

          <div className="border border-[#E4E0FF] rounded-xl p-4 bg-[#F9FAFF] text-sm w-[260px]">

            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Articles</span>
              <span className="font-semibold">{totalArticles}</span>
            </div>

            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Total HT</span>
              <span>{formatFCFA(commande.totalHT)}</span>
            </div>

            <div className="flex justify-between mb-1">
              <span className="text-gray-600">TVA</span>
              <span>{formatFCFA(commande.totalTVA)}</span>
            </div>

            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-[#472EAD]">
              <span>Total TTC</span>
              <span>{formatFCFA(commande.totalTTC)}</span>
            </div>

          </div>

        </div>

        {/* ================= ACTION ================= */}

        <div className="flex justify-end">

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Fermer
          </button>

        </div>

      </div>
    </FormModal>
  );
}
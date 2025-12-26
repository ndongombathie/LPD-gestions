// ==========================================================
// 💸 PaiementModal.jsx — Gestion des paiements clients
// Réutilisable dans Commandes.jsx
// ==========================================================

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import FormModal from "./FormModal";

export default function PaiementModal({ open, onClose, commande, onSave }) {
  const [form, setForm] = useState({
    montant: "",
    methode: "Espèces",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.montant) return alert("Veuillez saisir un montant !");
    setLoading(true);
    setTimeout(() => {
      onSave(Number(form.montant), form.methode, form.date);
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <FormModal open={open} onClose={onClose} title={`Paiement — ${commande?.client}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Total : <b>{commande?.montantTotal} FCFA</b></p>
          <p>Déjà payé : <b>{commande?.montantPaye} FCFA</b></p>
          <p>Reste : <b>{commande ? commande.montantTotal - commande.montantPaye : 0} FCFA</b></p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Montant à payer</label>
          <input
            type="number"
            className="mt-1 w-full border border-black rounded-lg px-3 py-2 text-sm"
            value={form.montant}
            onChange={(e) => update("montant", e.target.value)}
            placeholder="Ex : 20000"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Méthode</label>
          <select
            className="mt-1 w-full border border-black rounded-lg px-3 py-2 text-sm"
            value={form.methode}
            onChange={(e) => update("methode", e.target.value)}
          >
            <option>Espèces</option>
            <option>Mobile Money</option>
            <option>Virement</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            className="mt-1 w-full border border-black rounded-lg px-3 py-2 text-sm"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-black rounded-lg text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] hover:opacity-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider le paiement"}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

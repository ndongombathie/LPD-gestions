// ==========================================================
// 💰 EnregistrerVersement.jsx — Ajout avec COMMENTAIRE optionnel
// ==========================================================

import React, { useState } from "react";

export default function EnregistrerVersement() {
  const [caissier, setCaissier] = useState("");
  const [montant, setMontant] = useState("");
  const [commentaire, setCommentaire] = useState(""); // ✅ Nouveau
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const enregistrer = () => {
    if (!caissier || !montant) {
      alert("Veuillez remplir le nom du caissier et le montant.");
      return;
    }

    const nouveauVersement = {
      id: Date.now(),
      caissier,
      montant: Number(montant),
      date,
      commentaire: commentaire.trim() || "", // ✅ Commentaire optionnel
    };

    // 🔥 Récupération des anciens données
    const anciens = JSON.parse(localStorage.getItem("versements") || "[]");

    // 🔥 Ajout du nouveau versement
    const updated = [...anciens, nouveauVersement];

    // 🔥 Sauvegarde
    localStorage.setItem("versements", JSON.stringify(updated));

    alert("Versement enregistré avec succès !");

    // Réinitialiser les champs sauf la date
    setMontant("");
    setCommentaire("");
  };

  return (
    <div className="p-5 space-y-4">
      <h1 className="text-xl font-semibold text-[#472EAD]">Enregistrer un Versement</h1>

      <div className="bg-white p-4 rounded-xl shadow border space-y-4">

        {/* Champ Caissier */}
        <input
          type="text"
          placeholder="Nom du caissier"
          value={caissier}
          onChange={(e) => setCaissier(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        {/* Montant */}
        <input
          type="number"
          placeholder="Montant du versement"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        {/* Commentaire optionnel */}
        <textarea
          placeholder="Commentaire (optionnel)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="w-full px-3 py-2 border rounded h-20"
        />

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border rounded"
        />

        {/* Bouton */}
        <button
          onClick={enregistrer}
          className="px-4 py-2 bg-[#472EAD] text-white rounded-lg"
        >
          Enregistrer
        </button>

      </div>
    </div>
  );
}

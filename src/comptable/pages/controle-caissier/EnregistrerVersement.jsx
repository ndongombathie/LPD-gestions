// ==========================================================
// 💰 EnregistrerVersement.jsx — PRO
// DESIGN SHADOW FINAL (SANS BORDURES)
// ==========================================================

import React, { useState } from "react";

export default function EnregistrerVersement() {
  const [caissier, setCaissier] = useState("");
  const [montant, setMontant] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // ===============================
  // 📌 ENREGISTREMENT
  // ===============================
  const enregistrer = () => {
    if (!caissier.trim() || !montant) {
      alert("Veuillez remplir le nom du caissier et le montant.");
      return;
    }

    const nouveauVersement = {
      id: Date.now(),
      caissier: caissier.trim(),
      montant: Number(montant),
      date,
      commentaire: commentaire.trim() || "",
    };

    const anciens = JSON.parse(localStorage.getItem("versements") || "[]");
    const updated = [...anciens, nouveauVersement];
    localStorage.setItem("versements", JSON.stringify(updated));

    alert("Versement enregistré avec succès !");

    // Reset (on garde la date)
    setMontant("");
    setCommentaire("");
  };

  return (
    <div className="space-y-8">

      {/* ================= TITRE ================= */}
      <div>
        <h1 className="text-xl font-semibold text-[#472EAD]">
          Enregistrer un versement
        </h1>
        <p className="text-sm text-gray-500">
          Ajout d’un versement avec commentaire optionnel
        </p>
      </div>

      {/* ================= FORMULAIRE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">

        {/* Caissier */}
        <input
          type="text"
          placeholder="Nom du caissier"
          value={caissier}
          onChange={(e) => setCaissier(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-50 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
        />

        {/* Montant */}
        <input
          type="number"
          placeholder="Montant du versement"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-50 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
        />

        {/* Commentaire */}
        <textarea
          placeholder="Commentaire (optionnel)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-50 text-sm h-24
                     resize-none focus:outline-none
                     focus:ring-2 focus:ring-[#472EAD]/30"
        />

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-50 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#472EAD]/30"
        />

        {/* Bouton */}
        <div className="flex justify-end">
          <button
            onClick={enregistrer}
            className="px-6 py-2 bg-[#472EAD] text-white rounded-xl
                       shadow hover:shadow-lg transition"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

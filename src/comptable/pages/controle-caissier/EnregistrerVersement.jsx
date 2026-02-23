// ==========================================================
// 💰 EnregistrerVersement.jsx — VERSION ENTREPRISE STABLE
// Liste déroulante caissiers via api/caissiers/all
// Durable 100 ans
// ==========================================================

import React, { useEffect, useState } from "react";
import versementAPI from "@/services/api/versementAPI";

export default function EnregistrerVersement() {

  /* ================= STATE ================= */

  const [caissiers, setCaissiers] = useState([]);
  const [caissierId, setCaissierId] = useState("");
  const [montant, setMontant] = useState("");
  const [observation, setObservation] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /* =========================================================
     🔄 CHARGEMENT DES CAISSIERS (API PROPRE)
  ========================================================= */

  useEffect(() => {

    const fetchCaissiers = async () => {

      try {

        setLoadingUsers(true);
        setError(null);

        const result = await versementAPI.getAllCaissiers();

        if (result.success) {
          setCaissiers(result.data || []);
        } else {
          setError(result.message);
        }

      } catch (err) {

        console.error("Erreur chargement caissiers:", err);
        setError("Impossible de charger les caissiers.");

      } finally {

        setLoadingUsers(false);

      }
    };

    fetchCaissiers();

  }, []);

  /* =========================================================
     💾 ENREGISTRER VERSEMENT
  ========================================================= */

  const enregistrer = async () => {

    if (!caissierId || !montant) {
      setError("Veuillez sélectionner un caissier et entrer un montant.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await versementAPI.enregistrerVersement({
      caissier_id: caissierId,
      montant,
      observation,
      date,
    });

    if (result.success) {

      setSuccess(result.message);
      setMontant("");
      setObservation("");

    } else {

      if (result.validationErrors?.caissier_id) {
        setError(result.validationErrors.caissier_id[0]);
      } else if (result.validationErrors?.montant) {
        setError(result.validationErrors.montant[0]);
      } else {
        setError(result.message);
      }

    }

    setLoading(false);
  };

  /* =========================================================
     🎨 UI
  ========================================================= */

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#472EAD]">
          Enregistrer un versement
        </h1>
        <p className="text-sm text-gray-500">
          Ajout d’un encaissement dans la caisse
        </p>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl">

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">

          {/* SELECT CAISSIER */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Caissier
            </label>

            <select
              value={caissierId}
              onChange={(e) => setCaissierId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50
                         focus:outline-none focus:ring-2
                         focus:ring-[#472EAD]/30"
            >
              <option value="">
                {loadingUsers
                  ? "Chargement..."
                  : "Sélectionner un caissier"}
              </option>

              {caissiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom_complet}
                </option>
              ))}
            </select>
          </div>

          {/* MONTANT */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Montant (FCFA)
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50
                         focus:outline-none focus:ring-2
                         focus:ring-[#472EAD]/30"
              placeholder="Montant du versement"
            />
          </div>

          {/* OBSERVATION */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Observation (optionnel)
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 h-24 resize-none
                         focus:outline-none focus:ring-2
                         focus:ring-[#472EAD]/30"
              placeholder="Commentaire..."
            />
          </div>

          {/* DATE */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 rounded-lg bg-gray-50
                         focus:outline-none focus:ring-2
                         focus:ring-[#472EAD]/30"
            />
          </div>

          {/* BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={enregistrer}
              disabled={loading}
              className="px-6 py-2 bg-[#472EAD] text-white rounded-xl
                         shadow hover:shadow-lg transition
                         disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
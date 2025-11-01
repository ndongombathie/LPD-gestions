import React, { useState } from "react";
import logo from "../../../src/assets/logo.png";

export default function Inscription() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    numeroCNI: "",
    role: "",
    cartePhoto: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Gestion du changement des champs
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "cartePhoto") {
      setFormData((prev) => ({ ...prev, cartePhoto: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔹 Validation & soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.email ||
      !formData.motDePasse ||
      !formData.numeroCNI ||
      !formData.role
    ) {
      alert("⚠️ Veuillez remplir tous les champs obligatoires !");
      return;
    }

    // Vérifie que le numéro CNI fait bien 13 chiffres
    if (!/^\d{13}$/.test(formData.numeroCNI)) {
      alert("⚠️ Le numéro de carte d'identité doit contenir exactement 13 chiffres !");
      return;
    }

    setIsLoading(true);

    try {
      // Prépare les données à envoyer
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });

      // Appel API (à adapter à ton backend)
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription !");
      }

      alert("✅ Utilisateur inscrit avec succès !");
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        motDePasse: "",
        numeroCNI: "",
        role: "",
        cartePhoto: null,
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-orange-500 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center border border-white/20">
        <img src={logo} alt="Logo LPD" className="mx-auto mb-4 w-24 h-24" />
        <h1 className="text-3xl font-bold text-white mb-6">
          Formulaire d’inscription
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Nom */}
          <div>
            <label className="block text-white mb-2 font-semibold">Nom</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex : Diallo"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Prénom */}
          <div>
            <label className="block text-white mb-2 font-semibold">Prénom</label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              placeholder="Ex : Malick"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-white mb-2 font-semibold">Adresse e-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemple@lpd.com"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-white mb-2 font-semibold">Mot de passe</label>
            <input
              type="password"
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Numéro de CNI */}
          <div>
            <label className="block text-white mb-2 font-semibold">
              Numéro de carte d'identité (13 chiffres)
            </label>
            <input
              type="text"
              name="numeroCNI"
              value={formData.numeroCNI}
              onChange={handleChange}
              placeholder="Ex : 1234567890123"
              maxLength={13}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Upload photocopie CNI */}
          <div>
            <label className="block text-white mb-2 font-semibold">
              Photocopie de la carte (optionnelle)
            </label>
            <input
              type="file"
              name="cartePhoto"
              accept="image/*,application/pdf"
              onChange={handleChange}
              className="w-full text-white"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-white mb-2 font-semibold">Rôle</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring-2 focus:ring-white"
            >
              <option value="">-- Sélectionner un rôle --</option>
              <option value="vendeur">Vendeur</option>
              <option value="gestionnaire_depot">Gestionnaire de Dépôt</option>
              <option value="gestionnaire_stock">Gestionnaire de Stock</option>
              <option value="caissier">Caissier</option>
            </select>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-bold text-white 
                       bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 
                       hover:from-orange-500 hover:to-blue-600 
                       transition-all duration-500 shadow-lg hover:shadow-2xl"
          >
            {isLoading ? "Enregistrement..." : "Créer le compte"}
          </button>
        </form>

        <p className="mt-6 text-white/80 text-sm text-center">
          © 2025 <span className="font-semibold">LPD Entreprise</span> — Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

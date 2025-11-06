import React, { useState } from "react";
import axios from "axios";
import logo from "../../../src/assets/logo.png";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Fonction de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("⚠️ Veuillez remplir tous les champs.");
      return;
    }

    try {
      // Appel vers ton API Laravel
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login", {
        email,
        password,
      });

      // Si connexion réussie
      setMessage("✅ Connexion réussie !");
      console.log("Utilisateur :", response.data);

      // Stocker le token si ton API en renvoie un
      localStorage.setItem("token", response.data.token);

      // Rediriger vers le tableau de bord
      window.location.href = "/dashboard";
    } catch (error) {
      // En cas d’erreur
      setMessage("❌ Identifiants incorrects ou compte inexistant.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-orange-500 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-white/20">
        <img src={logo} alt="Logo LPD" className="mx-auto mb-4 w-24 h-24" />

        <h1 className="text-3xl font-bold text-white mb-6">
          Librairie Papeterie Daraadj
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-white 
                       bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 
                       hover:from-orange-500 hover:to-blue-600 
                       transition-all duration-500 shadow-lg hover:shadow-2xl"
          >
            Se connecter
          </button>
        </form>

        {message && (
          <p className="mt-4 text-white font-semibold">{message}</p>
        )}

        <p className="mt-6 text-white/80 text-sm">
          © 2025 <span className="font-semibold">LPD Entreprise</span> — Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

// ==========================================================
// 🔐 Connexion.jsx — Authentification Sanctum (Frontend LPD)
// ==========================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { instance } from "../../utils/axios";

// ----------- Normalisation des rôles ----------
const normalizeRole = (role) => {
  if (!role) return "";

  const r = role.toString().toLowerCase();

  // Rôles principaux
  if (r.includes("respons")) return "responsable";
  if (r.includes("compt")) return "comptable";
  if (r.includes("cais")) return "caissier";
  if (r.includes("vend")) return "vendeur";

  // Variantes gestionnaire boutique/dépôt (underscore ou tiret)
  if (r.includes("gestionnaire_boutique") || (r.includes("gest") && r.includes("bout"))) return "gestionnaire-boutique";
  if (r.includes("gestionnaire_depot") || r.includes("gestionnaire-depot") || (r.includes("gest") && r.includes("depot"))) return "gestionnaire-depot";

  // Administrateur
  if (r === "admin") return "admin";

  return r;
};

// ----------- Redirection selon rôle ----------
const redirectByRole = (role = "") => {
  switch (role.toLowerCase()) {
    case "responsable":
      return "/responsable/dashboard";
    case "comptable":
      return "/comptable/dashboard";
    case "gestionnaire-boutique":
      return "/gestionnaire-boutique/dashboard";
    case "gestionnaire-depot":
      return "/depot/dashboard";
    case "vendeur":
      return "/vendeur";
    case "caissier":
      return "/caissier/dashboard";
    case "admin":
      // Par défaut, on redirige l'admin vers le dashboard responsable
      return "/responsable/dashboard";
    default:
      return "/login";
  }
};

export default function Connexion() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      return setMessage("⚠️ Veuillez remplir tous les champs.");
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim();

      // 🔹 APPEL API NORMAL → /api/auth/login
      const { data } = await instance.post("auth/login", {
        email: trimmedEmail,
        password,
      });

      if (!data?.token || !data?.user) {
        setLoading(false);
        return setMessage("❌ Réponse inattendue du serveur.");
      }

      // 🔹 Normaliser le rôle
      const normalizedRole = normalizeRole(data.user.role);

      // 🔹 Sauvegarder token + user
      localStorage.setItem("token", data.token);
      instance.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      const userToStore = { ...data.user, role: normalizedRole };
      localStorage.setItem("user", JSON.stringify(userToStore));

      setMessage("✅ Connexion réussie !");

      // 🔹 Redirection selon rôle
      setTimeout(() => {
        navigate(redirectByRole(normalizedRole), { replace: true });
      }, 800);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "❌ Identifiants incorrects.";

      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-orange-500 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-white/20">

        {/* === Logo === */}
        <div className="flex flex-col items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="50" viewBox="0 0 200 120">
            <ellipse cx="100" cy="60" rx="90" ry="45" fill="#472EAD" />
            <text
              x="50%"
              y="66%"
              textAnchor="middle"
              fill="#F58020"
              fontFamily="Arial Black"
              fontSize="60"
              fontWeight="900"
              dy=".1em"
            >
              LPD
            </text>
          </svg>

          <p className="text-[12px] uppercase tracking-wider text-white/80 font-medium">
            Librairie Papeterie Daradji
          </p>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-6">
          Connexion au tableau de bord
        </h1>

        {/* === Formulaire === */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
            required
          />

          {/* Mot de passe */}
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-500 shadow-lg ${
              loading
                ? "opacity-80 cursor-not-allowed bg-gray-400"
                : "bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 hover:from-orange-500 hover:to-blue-600 hover:shadow-2xl"
            }`}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {message && <p className="mt-4 text-white font-semibold">{message}</p>}

        <p className="mt-6 text-white/80 text-sm">
          © 2025 <span className="font-semibold">LPD Entreprise</span> — Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

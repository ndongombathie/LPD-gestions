import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // 👈 on utilise le client Laravel

const defaultLogo =
  "https://tse4.mm.bing.net/th?id=OIP.8MjlJKnlA_5B9FfULuEK4QHaHa&pid=Api";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!email || !password) {
      setMessage("⚠️ Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    try {
      // 🔐 Appel à Laravel
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("Réponse login Laravel :", response.data);

      // On récupère proprement ce que renvoie ton backend
      const user = response.data.user || response.data.data || null;
      const token =
        response.data.token ||
        response.data.access_token ||
        response.data.authorization?.token ||
        null;

      if (token) {
        localStorage.setItem("token", token);
      }

      if (user) {
        // On garde la version brute
        localStorage.setItem("user", JSON.stringify(user));

        // Et la version formatée pour ton interface vendeur
        localStorage.setItem(
          "lpd_user",
          JSON.stringify({
            ...user,
            name: user.name || user.nom || user.fullname || "Vendeur",
            role: user.role || "Vendeur",
            store: user.store || "Boutique Principale",
            telephone:
              user.telephone ||
              user.phone ||
              user.tel ||
              "+221 77 000 00 00",
            photo: user.photo || user.avatar || null,
            last_login: new Date().toISOString(),
          })
        );
      }

      setMessage("✅ Connexion réussie ! Redirection...");
      setTimeout(() => navigate("/vendeur"), 400);
    } catch (error) {
      console.error("Erreur de connexion:", error);

      if (error.response) {
        const status = error.response.status;
        const backendMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Erreur de connexion";

        if (status === 401) {
          setMessage("❌ Identifiants incorrects.");
        } else if (status === 422) {
          setMessage("❌ Format des données invalide.");
        } else if (status === 500) {
          setMessage("❌ Erreur serveur. Veuillez réessayer.");
        } else {
          setMessage(`❌ Erreur ${status} : ${backendMessage}`);
        }
      } else if (error.request) {
        setMessage(
          "❌ Impossible de se connecter au serveur. Vérifiez que :\n" +
            "• Laravel est démarré (php artisan serve)\n" +
            "• L'URL http://127.0.0.1:8000 est bien accessible\n" +
            "• Le CORS est bien configuré dans Laravel (config/cors.php)"
        );
      } else {
        setMessage("❌ Erreur: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-orange-500 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-white/20">
        <img
          src={defaultLogo}
          alt="Logo LPD"
          className="mx-auto mb-4 w-24 h-24 rounded-full object-cover border-2 border-white/30"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://via.placeholder.com/100/667eea/ffffff?text=LPD";
          }}
        />

        <h1 className="text-3xl font-bold text-white mb-2">
          Librairie Papeterie Daraadj
        </h1>
        <br />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white border border-white/30"
              required
              disabled={loading}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white border border-white/30"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white 
                       bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 
                       hover:from-orange-500 hover:to-blue-600 
                       transition-all duration-500 shadow-lg hover:shadow-2xl
                       ${
                         loading
                           ? "opacity-50 cursor-not-allowed"
                           : "hover:scale-105"
                       }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connexion...
              </div>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-semibold whitespace-pre-line ${
              message.includes("✅") || message.includes("ℹ️")
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {message}
          </div>
        )}

        <p className="mt-6 text-white/80 text-sm">
          © 2025 <span className="font-semibold">LPD Entreprise</span> — Tous
          droits réservés.
        </p>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import axios from "axios";

// Si vous avez un logo local, importez-le depuis votre dossier assets
// import logo from "../../assets/logo.png";

// Ou utilisez une image par défaut
const defaultLogo = "https://tse4.mm.bing.net/th?id=OIP.8MjlJKnlA_5B9FfULuEK4QHaHa&pid=Api";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fonction de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      setMessage("⚠️ Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    try {
      // Appel vers l'API Laravel
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login", {
        email,
        password,
      });

      // Si connexion réussie
      setMessage("✅ Connexion réussie ! Redirection...");
      console.log("Utilisateur :", response.data);

      // Stocker le token
      localStorage.setItem("token", response.data.token);
      
      // Stocker les infos utilisateur si disponibles
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Rediriger vers le tableau de bord après un délai
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);

    } catch (error) {
      // En cas d'erreur
      console.error("Erreur de connexion:", error);
      
      if (error.response) {
        // Erreur avec réponse du serveur
        if (error.response.status === 401) {
          setMessage("❌ Identifiants incorrects.");
        } else if (error.response.status === 422) {
          setMessage("❌ Format des données invalide.");
        } else if (error.response.status === 500) {
          setMessage("❌ Erreur serveur. Veuillez réessayer.");
        } else {
          setMessage(`❌ Erreur ${error.response.status}: ${error.response.data.message || "Erreur de connexion"}`);
        }
      } else if (error.request) {
        // Pas de réponse du serveur
        setMessage("❌ Impossible de se connecter au serveur. Vérifiez que :");
        setMessage(prev => prev + "\n• Laravel est démarré (php artisan serve)");
        setMessage(prev => prev + "\n• L'URL http://127.0.0.1:8000 est accessible");
      } else {
        // Erreur de configuration
        setMessage("❌ Erreur: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour remplir les champs de test
  const fillTestCredentials = () => {
    setEmail("admin@lpd.com");
    setPassword("password");
    setMessage("ℹ️ Identifiants de test remplis. Cliquez sur 'Se connecter'.");
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
            e.target.src = "https://via.placeholder.com/100/667eea/ffffff?text=LPD";
          }}
        />

        <h1 className="text-3xl font-bold text-white mb-2">
          Librairie Papeterie Daraadj
        </h1><br/>
        {/* <p className="text-white/80 mb-6">Interface de gestion</p> */}

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
                       ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connexion...
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>


        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-semibold whitespace-pre-line ${
            message.includes('✅') || message.includes('ℹ️') 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        <p className="mt-6 text-white/80 text-sm">
          © 2025 <span className="font-semibold">LPD Entreprise</span> — Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
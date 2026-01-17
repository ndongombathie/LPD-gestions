// ==========================================================
// 🧠 Header.jsx — LPD Manager (Vendeur)
// ==========================================================

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  LogOut,
  Key,
  X,
  Banknote,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import useAuth from "../hooks/useAuth";

// ================= Utils =================
const getDisplayName = (user) => {
  if (!user) return "Utilisateur";
  
  if (user.prenom && user.nom) {
    return `${user.prenom} ${user.nom}`;
  }
  
  if (user.name) {
    return user.name;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return "Utilisateur";
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ================= Password Validation =================
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 6) errors.push("6 caractères minimum");
  return errors;
};

// ================= Password Modal =================
function PasswordModal({ open, onClose }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const { changePassword } = useAuth();

  // Validation en temps réel
  const handleNewPasswordChange = (value) => {
    setNewPwd(value);
    if (value) {
      const errors = validatePassword(value);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    // Réinitialiser les messages
    setError("");
    setSuccess("");

    // Validation basique
    if (!oldPwd.trim()) {
      setError("L'ancien mot de passe est requis");
      return false;
    }

    if (!newPwd.trim()) {
      setError("Le nouveau mot de passe est requis");
      return false;
    }

    if (validationErrors.length > 0) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }

    if (newPwd !== confirmPwd) {
      setError("Les nouveaux mots de passe ne correspondent pas");
      return false;
    }

    if (oldPwd === newPwd) {
      setError("Le nouveau mot de passe doit être différent de l'ancien");
      return false;
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await changePassword(oldPwd, newPwd, confirmPwd);
      
      // Succès
      setSuccess("Mot de passe changé avec succès !");
      
      // Réinitialiser le formulaire
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setValidationErrors([]);
      
      // Fermer automatiquement après 2 secondes
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
      
    } catch (err) {
      // Gestion des erreurs spécifiques
      if (err.response?.status === 401) {
        setError("L'ancien mot de passe est incorrect");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Données invalides");
      } else if (err.response?.status === 429) {
        setError("Trop de tentatives. Veuillez réessayer plus tard");
      } else {
        setError("Erreur lors du changement de mot de passe. Veuillez réessayer.");
      }
      
      // Log en développement seulement
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur changement mot de passe:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Réinitialiser tout à la fermeture
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setError("");
    setSuccess("");
    setValidationErrors([]);
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[95%] sm:w-[420px] rounded-2xl shadow-2xl p-5">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <Key size={18} /> Changer le mot de passe
          </h2>
          <button 
            onClick={handleClose}
            className="hover:bg-gray-100 p-1 rounded-full"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Ancien mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ancien mot de passe *
            </label>
            <input
              type="password"
              placeholder="Entrez votre mot de passe actuel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              placeholder="Minimum 6 caractères"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                newPwd && validationErrors.length > 0
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#472EAD]"
              }`}
              value={newPwd}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              disabled={loading}
              required
            />
            
            {/* Indicateur de validation simple */}
            {newPwd && validationErrors.length > 0 && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> Minimum 6 caractères requis
              </p>
            )}
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              placeholder="Retapez le nouveau mot de passe"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                confirmPwd && newPwd !== confirmPwd
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#472EAD]"
              }`}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              disabled={loading}
              required
            />
            {confirmPwd && newPwd !== confirmPwd && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || validationErrors.length > 0}
              className="bg-[#472EAD] text-white px-4 py-2 rounded-lg hover:bg-[#3a2399] disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= HEADER =================
export default function Header({ user, commandes = [], onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const ventesDuJour = useMemo(() => {
    return commandes
      .filter(
        (c) =>
          c.statut === "complétée" &&
          new Date(c.created_at).toDateString() ===
            new Date().toDateString()
      )
      .reduce((s, c) => s + (c.total_ttc || 0), 0);
  }, [commandes]);

  const formatMoney = (v) =>
    new Intl.NumberFormat("fr-FR").format(v) + " FCFA";

  // Récupérer le nom complet
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <>
      <header className="fixed top-0 left-64 right-0 z-20 bg-white">
        <div className="h-[6px] bg-gradient-to-r from-[#472EAD] to-[#F58020]" />

        <div className="h-16 border-b shadow-sm">
          <div className="h-full px-4 flex items-center justify-between">
            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-[#472EAD] font-extrabold text-xl">LP</span>
                <span className="text-[#F58020] font-extrabold text-xl">D</span>
              </div>

              <div>
                <h1 className="text-base font-semibold text-[#472EAD]">
                  LPD Manager
                  <span className="text-gray-500 font-normal text-sm">
                    {" "} | Interface Vendeur
                  </span>
                </h1>
                <p className="hidden sm:block text-xs text-gray-400">
                  Gestion des ventes 
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                  <Banknote size={12} /> Ventes du jour
                </span>
                <span className="font-semibold text-emerald-600">
                  {formatMoney(ventesDuJour)}
                </span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                  aria-expanded={menuOpen}
                  aria-label="Menu utilisateur"
                >
                  <div 
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white flex items-center justify-center text-sm font-semibold"
                    title={displayName}
                  >
                    {initials}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 leading-tight">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-500 leading-tight">
                      {user?.role === 'vendeur' ? 'Vendeur' : 'Utilisateur'}
                    </span>
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={`text-gray-500 transition-transform ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {menuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-lg p-2 z-20">
                      <div className="px-3 py-2 border-b mb-2">
                        <p className="font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'Aucun email'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <User size={10} className="text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {user?.store || 'Boutique par défaut'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setPwdOpen(true);
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex gap-2 items-center rounded-md"
                      >
                        <Key size={14} /> Changer mot de passe
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Voulez-vous vous déconnecter ?")) {
                            onLogout();
                          }
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-[#F58020] hover:bg-orange-50 flex gap-2 items-center rounded-md mt-1"
                      >
                        <LogOut size={14} /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <PasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </>
  );
}
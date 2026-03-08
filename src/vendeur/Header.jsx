import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  LogOut,
  Key,
  X,
  Banknote,
  AlertCircle,
  CheckCircle,
  User,
  Menu,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { commandesAPI } from "../services/api/commandes";
import profileAPI from "../services/api/profile";

const getDisplayName = (user) => {
  if (!user) return "Utilisateur";
  
  if (user.prenom && user.nom) {
    return `${user.prenom} ${user.nom}`;
  }
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  if (user.name) {
    return user.name;
  }
  
  if (user.username) {
    return user.username;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return "Utilisateur";
};

const getInitials = (name = "") => {
  if (!name || name === "Utilisateur") return "U";
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 6) errors.push("6 caractères minimum");
  return errors;
};

function PasswordModal({ open, onClose, onSuccess }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const { changePassword } = useAuth();

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
    setError("");
    setSuccess("");

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
      
      setSuccess("Mot de passe changé avec succès !");
      
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setValidationErrors([]);
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
      
    } catch (err) {
      if (err.response?.status === 401) {
        setError("L'ancien mot de passe est incorrect");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Données invalides");
      } else if (err.response?.status === 422) {
        const errors = err.response.data?.errors;
        if (errors?.current_password) {
          setError(errors.current_password[0]);
        } else if (errors?.new_password) {
          setError(errors.new_password[0]);
        } else {
          setError("Erreur de validation");
        }
      } else if (err.response?.status === 429) {
        setError("Trop de tentatives. Veuillez réessayer plus tard");
      } else {
        setError("Erreur lors du changement de mot de passe. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
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
            
            {newPwd && validationErrors.length > 0 && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> Minimum 6 caractères requis
              </p>
            )}
          </div>

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

export default function Header({ 
  user, 
  onLogout, 
  onMenuClick, 
  sidebarOpen,
  sectionActive,
  setSectionActive 
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [loading, setLoading] = useState({
    stats: false,
    profile: false
  });
  const [ventesDuJour, setVentesDuJour] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const { logout } = useAuth();

  const estAujourdhui = (dateString) => {
    try {
      const aujourdhui = new Date();
      const dateCommande = new Date(dateString);
      return (
        dateCommande.getDate() === aujourdhui.getDate() &&
        dateCommande.getMonth() === aujourdhui.getMonth() &&
        dateCommande.getFullYear() === aujourdhui.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const estCompletee = (statut) => {
    const statutsComplete = ['complétée', 'completed', 'payee', 'paid', 'delivered', 'livree', 'validée'];
    const statutLower = String(statut || '').toLowerCase().trim();
    return statutsComplete.includes(statutLower);
  };

  const fetchVentesDuJour = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      
      const response = await commandesAPI.getAll({
        perPage: 100,
        page: 1,
        sort: 'desc',
        orderBy: 'date'
      });
      
      let commandesData = [];
      if (response.data && Array.isArray(response.data)) {
        commandesData = response.data;
      } else if (Array.isArray(response)) {
        commandesData = response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        commandesData = response.data.data;
      }
      
      if (commandesData && commandesData.length > 0) {
        const commandesAujourdhui = commandesData.filter(cmd => {
          const date = cmd.date || cmd.created_at;
          return estAujourdhui(date);
        });
        
        const ventes = commandesAujourdhui
          .filter(cmd => estCompletee(cmd.statut || cmd.status))
          .reduce((sum, cmd) => {
            return sum + (cmd.total_ttc || cmd.total || 0);
          }, 0);
        
        setVentesDuJour(ventes);
      }
      
    } catch (error) {
      setVentesDuJour(0);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const profile = await profileAPI.getProfile();
      setUserProfile(profile);
      
      if (profile) {
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          const updatedUser = {
            ...userData,
            prenom: profile.prenom || userData.prenom,
            nom: profile.nom || userData.nom,
            email: profile.email || userData.email,
            telephone: profile.telephone || userData.telephone,
            boutique_nom: profile.boutique_nom || userData.boutique_nom,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      setUserProfile(user);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const refreshData = () => {
    setLastUpdate(Date.now());
    fetchVentesDuJour();
    fetchUserProfile();
  };

  useEffect(() => {
    fetchVentesDuJour();
    fetchUserProfile();
  }, [lastUpdate]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      refreshData();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        refreshData();
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatMoney = (v) =>
    new Intl.NumberFormat("fr-FR").format(v || 0) + " FCFA";

  const displayName = useMemo(() => {
    const userData = userProfile || user;
    return getDisplayName(userData);
  }, [userProfile, user, lastUpdate]);

  const initials = useMemo(() => getInitials(displayName), [displayName, lastUpdate]);

  const handleLogout = async () => {
    if (window.confirm("Voulez-vous vous déconnecter ?")) {
      try {
        await logout();
        if (onLogout) onLogout();
      } catch (error) {
      }
    }
    setMenuOpen(false);
  };

  const handlePasswordChangeSuccess = () => {
    refreshData();
  };

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-64 right-0 z-20 bg-white transition-all duration-300">
        <div className="h-[6px] bg-gradient-to-r from-[#472EAD] to-[#F58020]" />

        <div className="h-16 border-b shadow-sm">
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu size={24} className="text-[#472EAD]" />
              </button>

              <div className="flex items-center">
                <span className="text-[#472EAD] font-extrabold text-xl">LP</span>
                <span className="text-[#F58020] font-extrabold text-xl">D</span>
              </div>

              <div className="hidden sm:block">
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

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                  <Banknote size={12} /> Ventes du jour
                </span>
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-semibold text-emerald-600">
                    {formatMoney(ventesDuJour)}
                  </span>
                  {loading.stats && (
                    <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                  aria-expanded={menuOpen}
                  aria-label="Menu utilisateur"
                >
                  <div 
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-[#472EAD] to-[#F58020] text-white flex items-center justify-center text-sm font-semibold"
                    title={displayName}
                  >
                    {initials}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 leading-tight">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-500 leading-tight">
                      {(userProfile?.role || user?.role) === 'vendeur' ? 'Vendeur' : 'Utilisateur'}
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
                        <p className="font-medium text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {(userProfile?.email || user?.email) || 'Aucun email'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <User size={10} className="text-gray-400" />
                          <span className="text-xs text-gray-600 truncate">
                            {userProfile?.store_name || user?.store || userProfile?.boutique_nom || 'Boutique'}
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
                        onClick={handleLogout}
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

      <PasswordModal 
        open={pwdOpen} 
        onClose={() => setPwdOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
}
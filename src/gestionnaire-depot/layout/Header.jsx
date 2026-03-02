import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  LogOut,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/* ==========================================================
   MODAL CHANGEMENT MOT DE PASSE
========================================================== */
function PasswordModal({ isOpen, onClose, onSubmit, changePassword }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Mot de passe actuel requis";
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "Nouveau mot de passe requis";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Minimum 6 caractères";
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      onSubmit({ success: true, message: "Mot de passe modifié avec succès" });
      
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      
    } catch (error) {
      const msg = error?.response?.data?.message || "Erreur lors de la modification";
      onSubmit({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Changer le mot de passe
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD] ${
                  errors.currentPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Entrez votre mot de passe actuel"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD] ${
                  errors.newPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Minimum 6 caractères"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD] ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Retapez le nouveau mot de passe"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3a2590] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier le mot de passe"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* ==========================================================
   TOASTS
========================================================== */
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[999] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`flex gap-3 px-4 py-3 rounded-xl shadow border ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {t.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs">{t.message}</p>
            </div>
            <button onClick={() => remove(t.id)}>
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================
   HEADER
========================================================== */
export default function Header() {
  const navigate = useNavigate();
  const { user: authUser, logout, changePassword } = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      sessionStorage.setItem("user", JSON.stringify(authUser));
    } else {
      try {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        setUser(null);
      }
    }
  }, [authUser]);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fermer avec Echap
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Erreur déconnexion:', e);
    }
    
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    addToast("success", "Déconnexion", "Vous avez été déconnecté avec succès");
    setShowMenu(false);
    
    window.location.href = "/";
  };

  const handlePasswordSubmit = (result) => {
    setShowPasswordModal(false);
    addToast(
      result.success ? "success" : "error",
      "Modification du mot de passe",
      result.message
    );
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Initiales de l'utilisateur
  const userInitials = user?.prenom?.[0] && user?.nom?.[0] 
    ? `${user.prenom[0]}${user.nom[0]}` 
    : "??";

  return (
    <>
      <header className="sticky top-0 z-20 bg-white">
        <div className="h-[6px] bg-gradient-to-r from-[#472EAD] to-[#F58020]" />

        <div className="h-16 border-b shadow-sm px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="text-xl font-extrabold cursor-pointer"
              onClick={() => navigate("/depot/dashboard")}
            >
              <span className="text-[#472EAD]">LP</span>
              <span className="text-[#F58020]">D</span>
            </div>

            <div>
              <h1 className="text-sm font-semibold text-[#472EAD]">
                LPD Manager
                <span className="text-gray-500 font-normal">
                  {" "} | Dépôt
                </span>
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                Gestion du stock & mouvements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Menu utilisateur */}
            <div className="relative menu-container">
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full border hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center font-bold">
                  {userInitials}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold">
                    {user?.prenom} {user?.nom}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {user?.role || 'Gestionnaire de Dépôt'}
                  </span>
                </div>

                <ChevronDown size={14} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-lg p-2 text-sm z-30">
                  <button
                    onClick={() => {
                      setShowPasswordModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 hover:bg-gray-50 flex gap-2 items-center rounded-md hover:bg-[#F7F5FF]"
                  >
                    <Key size={14} className="text-[#472EAD]" /> 
                    <span>Changer mot de passe</span>
                  </button>

                  <div className="border-t my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 hover:bg-gray-50 flex gap-2 items-center rounded-md hover:bg-red-50 text-[#F58020]"
                  >
                    <LogOut size={14} /> 
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        changePassword={changePassword}
      />

      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}
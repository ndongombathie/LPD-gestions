import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {  AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/* ==========================================================
   CURRENT USER (depuis localStorage ou API)
========================================================== */
const getCurrentUser = () => {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

/* ==========================================================
   RACCOURCIS AVEC VOS VRAIES ROUTES
========================================================== */
const RACCOURCIS = [
  { 
    name: "Produits", 
    path: "/depot/products",
    available: true
  },
  { 
    name: "Mouvements", 
    path: "/depot/movementStock",
    available: true
  },
  { 
    name: "Fournisseurs", 
    path: "/depot/suppliers",
    available: true
  },
  { 
    name: "Rapports", 
    path: "/depot/rapports",
    available: true
  },
];

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
      
      // Réinitialiser le formulaire
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
    // Effacer l'erreur quand l'utilisateur tape
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
            {t.type === "success" ? <CheckCircle2 /> : <AlertCircle />}
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
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user: authUser, logout, changePassword } = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(() => authUser || getCurrentUser());

  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // Navigation vers une route
  const handleNavigate = (path, available) => {
    if (!available) {
      addToast("error", "Page non disponible", "Cette page n'est pas encore implémentée");
      setShowQuick(false);
      return;
    }
    navigate(path);
    setShowQuick(false);
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Erreur déconnexion:', e);
    }
    addToast("success", "Déconnexion", "Vous avez été déconnecté avec succès");
    setShowMenu(false);
    navigate("/login");
  };


  // Gestion du changement de mot de passe
  const handlePasswordSubmit = (result) => {
    setShowPasswordModal(false);
    addToast(
      result.success ? "success" : "error",
      "Modification du mot de passe",
      result.message
    );
  };

  // Fermer menus au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowNotif(false);
        setShowQuick(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header ref={menuRef} className="sticky top-0 z-20 bg-white">
        {/* Bande couleur */}
        <div className="h-[6px] bg-gradient-to-r from-[#472EAD] to-[#F58020]" />

        <div className="h-16 border-b shadow-sm px-6 flex items-center justify-between">
          {/* LOGO */}
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

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {/* RACCOURCIS - seulement Produits, Mouvements, Fournisseurs, Rapports */}
            <div className="relative">
            
              {showQuick && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg z-30 p-2 text-sm">
                  <p className="text-xs text-gray-500 px-3 py-2 mb-1 border-b">
                    Navigation rapide
                  </p>
                  <ul className="max-h-80 overflow-y-auto">
                    {RACCOURCIS.map((item) => (
                      <li key={item.path}>
                        <button
                          onClick={() => handleNavigate(item.path, item.available)}
                          className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                            item.available
                              ? "hover:bg-[#F7F5FF] hover:text-[#472EAD] text-gray-700"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!item.available}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            item.available ? "bg-[#472EAD]" : "bg-gray-300"
                          }`} />
                          <span className="font-medium text-sm">{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="px-3 pt-2 mt-2 border-t text-xs text-gray-500">
                    <p>Appuyez sur <span className="font-bold">Esc</span> pour fermer</p>
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFS (FAKE) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotif(!showNotif);
                  setShowMenu(false);
                  setShowQuick(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Bell className="text-[#472EAD]" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  2
                </span>
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg z-30 p-3 text-xs">
                  <p className="font-semibold mb-2">Notifications</p>
                  <ul className="space-y-2">
                    <li className="bg-[#F7F5FF] p-2 rounded">
                      Stock faible sur <strong>Cahier A4</strong>
                    </li>
                    <li className="p-2 rounded hover:bg-gray-50">
                      Nouveau mouvement enregistré
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* PROFIL */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMenu(!showMenu);
                  setShowNotif(false);
                  setShowQuick(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full border hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center font-bold">{(user?.prenom?.[0] || '')}{(user?.nom?.[0] || '')}</div>

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

      {/* MODAL CHANGEMENT MOT DE PASSE */}
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
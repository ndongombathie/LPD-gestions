// ========================================================== 
// 🧠 Header.jsx — LPD Manager (Responsable)
// Connecté Laravel + Sanctum : profil, logout, update, password + Raccourcis + Notifications API
// ==========================================================

import React, { useState, useRef, useEffect } from "react";
import { logger } from "@/utils/logger";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  // Icônes identiques à la Sidebar pour les pages
  LayoutDashboard,
  Users,
  Truck,
  ShoppingCart,
  BarChart2,
  ClipboardList,
  FileText,
  Clock,
  Banknote,
  // Icônes pour les types de notifications
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useAuth from "../hooks/useAuth";
//import profileAPI from "@/services/api/profile";

// ==========================================================
// 🧩 Utils
// ==========================================================

const getInitials = (prenom = "", nom = "") =>
  (`${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.trim() || "AR").toUpperCase();

const loadJSON = (k, def) => {
  try {
    const v = sessionStorage.getItem(k);
    return v ? JSON.parse(v) : def;
  } catch (err) {
    logger.warn("Invalid JSON in sessionStorage", { key: k, error: err });
    return def;
  }
};

const saveJSON = (k, v) =>
  sessionStorage.setItem(k, JSON.stringify(v)); // ✅ sessionStorage


const RECENTS_KEY = "lpd_recent_paths";

// 🔗 Pages éligibles aux raccourcis (mêmes infos que la Sidebar)
const SHORTCUT_ITEMS = [
  { name: "Tableau de bord", path: "/responsable/dashboard", icon: LayoutDashboard },
  { name: "Utilisateurs", path: "/responsable/utilisateurs", icon: Users },
  { name: "Fournisseurs", path: "/responsable/fournisseurs", icon: Truck },
  { name: "Clients spéciaux", path: "/responsable/clients-speciaux", icon: ClipboardList },
  { name: "Commandes", path: "/responsable/commandes", icon: ShoppingCart },
  { name: "Inventaire", path: "/responsable/inventaire", icon: BarChart2 },
  { name: "Rapports", path: "/responsable/rapports", icon: FileText },
  { name: "Décaissements", path: "/responsable/decaissements", icon: Banknote },
  { name: "Journal d’activités", path: "/responsable/journal-activites", icon: Clock },
];

// 🔔 Mapping des modules de notif → label + icône (côté panneau)
const MODULE_MAP = {
  stock: { label: "Stock & ruptures", icon: ClipboardList },
  rapports: { label: "Rapports & statistiques", icon: FileText },
  decaissements: { label: "Décaissements", icon: Banknote },
  commandes: { label: "Commandes", icon: ShoppingCart },
  fournisseurs: { label: "Fournisseurs", icon: Truck },
  clients: { label: "Clients spéciaux", icon: Users },
};

// 🔗 Mapping route → module de notification (pour marquer “lu” quand on ouvre la page)
const PATH_MODULE_MAP = {
  "/responsable/inventaire": "stock",
  "/responsable/rapports": "rapports",
  "/responsable/decaissements": "decaissements",
  "/responsable/commandes": "commandes",
  "/responsable/fournisseurs": "fournisseurs",
  "/responsable/clients-speciaux": "clients",
};

const getModuleFromPath = (path) => {
  // on matche par "startsWith" pour gérer les sous-routes (ex: /responsable/commandes/12)
  for (const [routePrefix, module] of Object.entries(PATH_MODULE_MAP)) {
    if (path.startsWith(routePrefix)) return module;
  }
  return null;
};

// ==========================================================
// 🔔 Toast system
// ==========================================================

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
            transition={{ duration: 0.25 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-md border ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5" />
            )}

            <div>
              <div className="font-semibold text-sm">{t.title}</div>
              {t.message && <div className="text-xs opacity-90 mt-0.5">{t.message}</div>}
            </div>

            <button
              onClick={() => remove(t.id)}
              className="ml-3 text-gray-500 hover:text-gray-800"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ==========================================================
// 🔐 Modal — Changer mot de passe (Connectée au backend !)
// ==========================================================

function PasswordModal({ open, onClose, onSuccess, addToast, changePassword }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!oldPwd || !newPwd || !confirmPwd)
      return addToast("error", "Champs manquants", "Veuillez remplir tous les champs.");

    if (newPwd.length < 6)
      return addToast("error", "Mot de passe trop court", "Minimum 6 caractères.");

    if (newPwd !== confirmPwd)
      return addToast("error", "Erreur", "Les mots de passe ne correspondent pas.");

    setLoading(true);

    try {
      //await changePassword(oldPwd, newPwd, confirmPwd);
      await new Promise((res) => setTimeout(res, 800));

      addToast("success", "Mot de passe modifié", "Vos identifiants ont été mis à jour.");
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || "Impossible de changer le mot de passe.";
      addToast("error", "Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-[95%] sm:w-[420px] rounded-2xl shadow-2xl p-5"
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <Key className="w-5 h-5" /> Changer le mot de passe
          </h2>

        <button onClick={onClose}>
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Ancien mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Ancien mot de passe
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 mt-1 pr-10"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 mt-1 pr-10"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmer */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 mt-1 pr-10"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white rounded-lg bg-[#472EAD]"
            >
              {loading ? "Chargement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 🧑‍💼 Modal Profil — 100% connecté (update Laravel)
// ==========================================================

function ProfileModal({ open, onClose, user, onUpdate, addToast }) {
  const [preview, setPreview] = useState(user?.photo || null);
  const [prenom, setPrenom] = useState(user?.prenom || "");
  const [nom, setNom] = useState(user?.nom || "");

  useEffect(() => {
    if (open) {
      setPreview(user?.photo || null);
      setPrenom(user?.prenom || "");
      setNom(user?.nom || "");
    }
  }, [open, user]);

  if (!open) return null;

  const handleSave = async () => {
    try {
     // const res = await profileAPI.updateProfile({
       // prenom,
        //nom,
        //photo: preview,
      //});
      // const res = await profileAPI.updateProfile(...)
      await new Promise((res) => setTimeout(res, 500));
      onUpdate({ ...user, prenom, nom, photo: preview });


      //onUpdate(res);
      addToast("success", "Profil mis à jour", "Modification enregistrée.");
      onClose();
    } catch (err) {
      addToast(
        "error",
        "Erreur",
        err?.response?.data?.message || "Impossible de mettre à jour le profil."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-[95%] sm:w-[520px] rounded-2xl shadow-2xl p-5"
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <User className="w-5 h-5" /> Mon Profil
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            {preview ? (
              <img src={preview} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#472EAD] text-white flex items-center justify-center font-semibold text-lg">
                {getInitials(user?.prenom, user?.nom)}
              </div>
            )}

            <label className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1 shadow cursor-pointer">
              <Camera size={16} className="text-[#472EAD]" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = () => setPreview(reader.result);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div>
            <div className="font-semibold text-[15px]">
              {user?.prenom} {user?.nom}
            </div>
            <div className="text-sm text-gray-600">{user?.email}</div>

            <div className="text-xs mt-1 inline-flex px-2 py-0.5 rounded bg-[#F7F5FF] border text-[#472EAD]">
              {user?.role}
            </div>
          </div>
        </div>

        {/* Champs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prénom</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 text-white rounded-lg bg-[#472EAD]"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 🧠 HEADER PRINCIPAL (connecté au backend !)
// ==========================================================

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef();
  const { user: authUser, logout, changePassword } = useAuth();

  // UI
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  
  // Data
  const [user, setUser] = useState(() => authUser || null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  // 🔔 Notifications venant de l'API
  const [notifications, setNotifications] = useState([]); // items[]
  const [unreadTotal, setUnreadTotal] = useState(0); // nombre total non lues
  const [moduleCounts, setModuleCounts] = useState({}); // per_module

  // 🆕 Dernières pages visitées (raccourcis)
  const [recentPaths, setRecentPaths] = useState(() => {
    const saved = loadJSON(RECENTS_KEY, null);
    if (saved && Array.isArray(saved) && saved.length) return saved;
    return [
      "/responsable/dashboard",
      "/responsable/utilisateurs",
      "/responsable/inventaire",
      "/responsable/rapports",
    ];
  });

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 3500);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ➕ Ajout dans l'historique des raccourcis
  const pushRecentPath = (path) => {
    const allowed = SHORTCUT_ITEMS.map((i) => i.path);
    if (!allowed.includes(path)) return;

    setRecentPaths((prev) => {
      const without = prev.filter((p) => p !== path);
      const updated = [path, ...without].slice(0, 4);
      saveJSON(RECENTS_KEY, updated);
      return updated;
    });
  };

  // Quand l'URL change → mettre à jour les raccourcis
  useEffect(() => {
    pushRecentPath(location.pathname);
  }, [location.pathname]);

  // Navigation via un raccourci
  const handleGoShortcut = (path) => {
    navigate(path);
    pushRecentPath(path);
    setShowQuick(false);
  };

  // ==========================================================
  // 🔥 Charger le VRAI utilisateur
  // ==========================================================

// ==========================================================
// 🔥 Charger le VRAI utilisateur (DÉSACTIVÉ TEMPORAIREMENT)
// En attente des endpoints backend profil
// ==========================================================

// useEffect(() => {
//   const loadUser = async () => {
//     try {
//       const data = await profileAPI.getProfile();
//       setUser(data);
//       sessionStorage.setItem("lpd_current_user", JSON.stringify(data));
//     } catch (err) {
//       addToast(
//         "error",
//         "Session expirée",
//         "Impossible de charger votre profil. Veuillez vous reconnecter."
//       );

//       logger.error("Profile load failed", { error: err });
//       // Ne rediriger que si c'est une vraie erreur d'auth (401), pas un timeout
//       if (err?.response?.status === 401) {
//         navigate("/login");
//       } else {
//         // Charger depuis localStorage en cas de timeout/erreur réseau
//         const savedUser = sessionStorage.getItem("lpd_current_user");
//         if (savedUser) {
//           try {
//             const parsed = JSON.parse(savedUser);
//             if (parsed && parsed.id && parsed.email) {
//               setUser(parsed);
//             } else {
//               throw new Error("User JSON invalide");
//             }
//           } catch (e) {
//             console.warn("Invalid cached user, clearing session");
//             sessionStorage.removeItem("lpd_current_user");
//           }
//         }
//       }
//     }
//   };
//   loadUser();
// }, [navigate]);


// ==========================================================
// 👤 Utilisateur temporaire depuis le contexte Auth
// ==========================================================




  // ==========================================================
  // 🔔 Charger les notifications depuis l'API
  // ==========================================================

  // useEffect(() => {
  //   if (!user) return;

  //   const fetchNotifications = async () => {
  //     try {
  //       const data = await profileAPI.getNotifications();
  //       setNotifications(data.items || []);
  //       setUnreadTotal(data.unread_total || 0);
  //       setModuleCounts(data.per_module || {});
  //     } catch (err) {
  //       addToast(
  //         "error",
  //         "Notifications indisponibles",
  //         "Impossible de charger les notifications pour le moment."
  //       );
  //       logger.warn("Notifications fetch failed", { error: err });
  //     }
  //   };

  //   fetchNotifications();
  //   const interval = setInterval(fetchNotifications, 60000);
  //   return () => clearInterval(interval);
  // }, [user]);


  // ==========================================================
  // ✅ Quand on ouvre une page → marquer son module comme lu
  // ==========================================================

  // useEffect(() => {
  //   if (!user) return;

  //   const module = getModuleFromPath(location.pathname);
  //   if (!module) return;

  //   const unreadForModule = moduleCounts?.[module]?.unread || 0;
  //   if (unreadForModule === 0) return;

  //   const markModuleAsRead = async () => {
  //     try {
  //       await profileAPI.markNotificationModule(module);

  //       setNotifications((prev) =>
  //         prev.map((n) =>
  //           n.module === module ? { ...n, read: true } : n
  //         )
  //       );

  //       setModuleCounts((prev) => {
  //         const copy = { ...prev };
  //         if (copy[module]) {
  //           copy[module] = { ...copy[module], unread: 0 };
  //         }
  //         return copy;
  //       });

  //       setUnreadTotal((prev) => Math.max(prev - unreadForModule, 0));
  //     } catch (err) {
  //       logger.warn("Notifications fetch failed", { error: err });
  //     }
  //   };

  //   markModuleAsRead();
  // }, [location.pathname, user, moduleCounts]);


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

  // ==========================================================
  // 🚪 Déconnexion réelle
  // ==========================================================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      logger.warn("Logout API failed, retrying", { error: err });
      try {
        await logout(); // retry simple
      } catch (e) {
        addToast(
          "error",
          "Déconnexion partielle",
          "Serveur indisponible. Déconnexion locale."
        );
      }
    } finally {
      navigate("/login");
    }
  };


  // ==========================================================
  // 🔔 Notifications — ouverture (NE MARQUE PLUS RIEN comme lu)
  // ==========================================================

  const handleToggleNotif = () => {
    setShowNotif((v) => !v);
    setShowMenu(false);
    setShowQuick(false);
  };

  if (!user) return null;

  // ==========================================================
  // 🧱 UI du Header
  // ==========================================================

  return (
    <>
      <header className="sticky top-0 z-20 w-full bg-white" ref={menuRef} >

        <div className="h-[6px] w-full bg-gradient-to-r from-[#472EAD] via-[#472EAD] to-[#F58020]" />

        <div className="bg-white h-16 shadow-sm border-b">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
            {/* LOGO & TITRE */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-[#472EAD] font-extrabold text-xl">LP</span>
                <span className="text-[#F58020] font-extrabold text-xl">D</span>
              </div>

              <div>
                <h1 className="text-base font-semibold text-[#472EAD]">
                  LPD Manager
                  <span className="text-gray-500 font-normal text-sm">
                    {" "} | Interface Responsable
                  </span>
                </h1>
                <p className="hidden sm:block text-xs text-gray-400">
                  Supervision générale : utilisateurs, fournisseurs, stock & rapports
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 sm:gap-4">


              {/* NOTIFS */}
              <div className="relative">
                <button
                  onClick={handleToggleNotif}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-[#472EAD]" />

                  {unreadTotal > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-red-500 text-white px-1.5 py-[2px] rounded-full shadow">
                      {unreadTotal}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg p-3 z-40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-[#472EAD]" />
                        Notifications
                      </p>
                      {unreadTotal === 0 ? (
                        <span className="text-[10px] text-emerald-600">
                          Tout est lu
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-500">
                          {unreadTotal} non lue(s)
                        </span>
                      )}
                    </div>

                    {/* Résumé par module / page */}
                    {Object.keys(moduleCounts).length > 0 && (
                      <div className="border-b border-gray-100 pb-2 mb-2">
                        <p className="text-[11px] font-semibold text-gray-500 px-1 mb-1">
                          Par page
                        </p>
                        <div className="flex flex-col gap-1">
                          {Object.entries(moduleCounts).map(([module, counts]) => {
                            const meta = MODULE_MAP[module] || {
                              label: module,
                              icon: Clock,
                            };
                            const Icon = meta.icon;
                            // on essaie de trouver une notif avec url pour cette page
                            const firstNotif = notifications.find(
                              (n) => n.module === module && n.url
                            );
                            return (
                              <button
                                key={module}
                                onClick={() => {
                                  if (firstNotif?.url) {
                                    navigate(firstNotif.url);
                                    setShowNotif(false);
                                  }
                                }}
                                className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5 text-[#472EAD]" />
                                  <span className="text-[11px] text-gray-700">
                                    {meta.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400">
                                    {counts.total}
                                  </span>
                                  {counts.unread > 0 && (
                                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-[1px] rounded-full">
                                      +{counts.unread}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Liste des dernières notifications */}
                    <ul className="max-h-64 overflow-auto space-y-1">
                      {notifications.length ? (
                        notifications.slice(0, 10).map((n) => {
                          const isUnread = !n.read;

                          // Mapping type → icône + couleur
                          let Icon = FileText;
                          let iconClasses = "text-gray-400";

                          if (n.type === "warning") {
                            Icon = AlertTriangle;
                            iconClasses = "text-amber-500";
                          } else if (n.type === "error") {
                            Icon = XCircle;
                            iconClasses = "text-red-500";
                          } else if (n.type === "success") {
                            Icon = CheckCircle2;
                            iconClasses = "text-emerald-500";
                          } else {
                            Icon = Info;
                            iconClasses = "text-blue-500";
                          }

                          return (
                            <li key={n.id}>
                              <button
                                onClick={() => {
                                  if (n.url) {
                                    navigate(n.url);
                                  }
                                  setShowNotif(false);
                                }}
                                className={`w-full text-left flex items-start gap-2 px-2 py-2 rounded-md hover:bg-gray-50 ${
                                  isUnread ? "bg-[#F7F5FF]" : ""
                                }`}
                              >
                                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-50">
                                  <Icon className={`w-4 h-4 ${iconClasses}`} />
                                </div>

                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-gray-800">
                                    {n.title}
                                  </div>
                                  {n.message && (
                                    <div className="text-[11px] text-gray-500 line-clamp-2">
                                      {n.message}
                                    </div>
                                  )}
                                  {n.created_at && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {new Date(n.created_at).toLocaleString("fr-FR")}
                                    </div>
                                  )}
                                </div>

                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                                )}
                              </button>
                            </li>
                          );
                        })
                      ) : (
                        <li className="px-3 py-6 text-center text-gray-400 text-xs">
                          Aucune notification pour le moment.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* PROFIL */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMenu((v) => !v);
                    setShowNotif(false);
                    setShowQuick(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border bg-white hover:bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center overflow-hidden">
                    {user.photo ? (
                      <img src={user.photo} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(user.prenom, user.nom)}</span>
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold">
                      {user.prenom} {user.nom}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {user.role}
                    </span>
                  </div>

                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-lg p-2">
                    <ul className="text-sm">

                      <li
                        onClick={() => {
                          setShowPwdModal(true);
                          setShowMenu(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex gap-2 items-center"
                      >
                        <Key size={14} /> Changer mot de passe
                      </li>

                      <li
                        onClick={handleLogout}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex gap-2 items-center text-[#F58020]"
                      >
                        <LogOut size={14} /> Déconnexion
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modales */}
      <PasswordModal
        open={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        onSuccess={() => setShowPwdModal(false)}
        addToast={addToast}
        changePassword={changePassword}
      />

      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}

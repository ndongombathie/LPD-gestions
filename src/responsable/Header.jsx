// ==========================================================  
// 🧠 Header.jsx — Interface Responsable (LPD Manager)
// Version Premium Interactive : menus déroulants animés + navigation + sécurité
// ==========================================================

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  LogOut,
  User,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// =============== Utils (ajouts non intrusifs) ===============
const getInitials = (prenom = "", nom = "") =>
  (`${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.trim() || "AR").toUpperCase();

const loadJSON = (k, def) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; }
};
const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ✅ Simule un utilisateur connecté (photo optionnelle)
const currentUserDefault = {
  id: 1,
  prenom: "Admin",
  nom: "Responsable",
  email: "admin@lpd.com",
  role: "Responsable",
  photo: null // ou DataURL/URL string
};

// ✅ Raccourcis dynamiques : top 3 chemins récents (sans doublons)
const RECENTS_KEY = "lpd_recent_paths";
const pushRecentPath = (path) => {
  const arr = loadJSON(RECENTS_KEY, []);
  const without = arr.filter((p) => p !== path);
  const updated = [path, ...without].slice(0, 3);
  saveJSON(RECENTS_KEY, updated);
  return updated;
};

// ✅ Toast système simple
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
              {t.message && (
                <div className="text-xs opacity-90 mt-0.5">{t.message}</div>
              )}
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

// ✅ Modal Changement mot de passe (avec œil pour afficher/masquer)
function PasswordModal({ open, onClose, onSuccess, addToast }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!oldPwd || !newPwd || !confirmPwd) {
      addToast("error", "Champs requis", "Veuillez remplir tous les champs.");
      return;
    }
    if (newPwd.length < 6) {
      addToast(
        "error",
        "Mot de passe trop court",
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }
    if (newPwd !== confirmPwd) {
      addToast(
        "error",
        "Incohérence",
        "Les deux mots de passe ne correspondent pas."
      );
      return;
    }

    setLoading(true);
    try {
      // 🔜 Simulation API
      console.log("🔐 Envoi API:", { oldPwd, newPwd });
      setTimeout(() => {
        addToast("success", "Mot de passe modifié", "Vos identifiants ont été mis à jour.");
        setLoading(false);
        onSuccess();
      }, 1200);
    } catch (e) {
      addToast("error", "Erreur", "Impossible de changer le mot de passe.");
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-[95%] sm:w-[420px] rounded-2xl shadow-2xl p-5"
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <Key className="w-5 h-5" /> Changer le mot de passe
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Ancien mot de passe
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm pr-10"
                placeholder="•••••••"
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm pr-10"
                placeholder="•••••••"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm pr-10"
                placeholder="•••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white rounded-lg bg-[#472EAD] hover:bg-[#3d26a5]"
            >
              {loading ? "Enregistrement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ✅ Modal Mon Profil (photo ou initiales) — édition prénom/nom + suppression photo
function ProfileModal({ open, onClose, user, onSave }) {
  const [preview, setPreview] = useState(user?.photo || null);
  const [prenom, setPrenom] = useState(user?.prenom || "");
  const [nom, setNom] = useState(user?.nom || "");

  useEffect(() => {
    if (!open) return;
    setPreview(user?.photo || null);
    setPrenom(user?.prenom || "");
    setNom(user?.nom || "");
  }, [open, user]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-[95%] sm:w-[520px] rounded-2xl shadow-2xl p-5"
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-[#472EAD] flex items-center gap-2">
            <User className="w-5 h-5" /> Mon Profil
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Profil"
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#472EAD] text-white flex items-center justify-center font-semibold text-lg">
                {getInitials(user?.prenom, user?.nom)}
              </div>
            )}

            <label
              className="absolute -bottom-1 -right-1 bg-white border rounded-full p-1 shadow cursor-pointer"
              title="Changer la photo"
            >
              <Camera size={16} className="text-[#472EAD]" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPreview(reader.result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div>
            <div className="font-semibold text-[15px]">{user?.prenom} {user?.nom}</div>
            <div className="text-sm text-gray-600">{user?.email}</div>
            <div className="text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F7F5FF] text-[#472EAD] border">
              {user?.role}
            </div>
          </div>
        </div>

        {/* Champs éditables : prénom/nom (pas email/role) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prénom</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">E-mail</label>
            <div className="text-sm font-medium">{user?.email}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rôle</label>
            <div className="text-sm font-medium">{user?.role}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPreview(null)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Supprimer la photo
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave({ prenom, nom, photo: preview })}
              className="px-4 py-2 text-sm text-white rounded-lg bg-[#472EAD] hover:bg-[#3d26a5]"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
// ==========================================================
// 🧠 HEADER PRINCIPAL
// ==========================================================
export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(loadJSON("lpd_current_user", currentUserDefault));
  const [recentPaths, setRecentPaths] = useState(
    loadJSON(RECENTS_KEY, [
      "/responsable/inventaire",
      "/responsable/utilisateurs",
      "/responsable/rapports",
    ])
  );

  // 🔔 Notifications simulées (badge dynamique)
  const [notifications, setNotifications] = useState(
    loadJSON("lpd_notifications", [
      { id: 1, type: "rapport", text: "Nouveau rapport mensuel disponible", read: false },
      { id: 2, type: "stock", text: "Alerte stock faible : 3 produits", read: false },
      { id: 3, type: "journal", text: "Journal d’activités mis à jour", read: false },
    ])
  );
  const unreadCount = notifications.filter(n => !n.read).length;

  const navigate = useNavigate();
  const menuRef = useRef();

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

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

  // Init recents avec la page courante
  useEffect(() => {
    const p = window.location?.pathname || "/responsable";
    const updated = pushRecentPath(p);
    setRecentPaths(updated);
  }, []);

  // Persist user & notifications
  useEffect(() => saveJSON("lpd_current_user", user), [user]);
  useEffect(() => saveJSON("lpd_notifications", notifications), [notifications]);

  // Déconnexion simulée
  const handleLogout = () => {
    addToast("success", "Déconnexion réussie", "À bientôt 👋");
    setTimeout(() => navigate("/login"), 1500);
  };

  // Navigation + push recents
  const go = (path) => {
    const updated = pushRecentPath(path);
    setRecentPaths(updated);
    navigate(path);
    setShowQuick(false);
  };

  // Ouvrir notif => marquer comme lues
  const toggleNotif = () => {
    const newShow = !showNotif;
    setShowNotif(newShow);
    if (newShow) {
      // Marque tout lu après l’ouverture
      setTimeout(() => {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      }, 300);
    }
  };

  return (
    <>
      <header className="relative z-20 w-full" ref={menuRef}>
        {/* Bande supérieure */}
        <div className="h-[6px] w-full bg-gradient-to-r from-[#472EAD] via-[#472EAD] to-[#F58020]" />

        {/* Barre principale */}
        <div className="bg-white h-16 shadow-sm border-b border-lpd-border">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            
            {/* === GAUCHE : Logo + Titre === */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-[#472EAD] font-extrabold text-xl tracking-tight">LP</span>
                <span className="text-[#F58020] font-extrabold text-xl tracking-tight">D</span>
              </div>
              <div className="leading-tight">
                <h1 className="text-[15px] sm:text-base font-semibold text-[#472EAD]">
                  LPD Manager
                  <span className="text-lpd-muted font-normal"> | Interface Responsable</span>
                </h1>
                <p className="hidden sm:block text-xs text-lpd-muted">
                  Supervision générale : utilisateurs, fournisseurs, inventaires & rapports
                </p>
              </div>
            </div>

            {/* === DROITE : Actions === */}
            <div className="flex items-center gap-3 sm:gap-4 relative">
              
              {/* --- Bouton Raccourcis --- */}
              <div className="relative">
                <button
                  onClick={() => { setShowQuick(!showQuick); setShowNotif(false); setShowMenu(false); }}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-lpd-border text-sm text-lpd-text hover:bg-[#F9F9FF] transition"
                >
                  <LayoutGrid className="w-4 h-4 text-[#472EAD]" />
                  <span className="hidden md:inline">Raccourcis</span>
                </button>

                {showQuick && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-lpd-border rounded-lg shadow-lg p-2 animate-fadeIn">
                    <p className="text-xs font-semibold text-lpd-muted px-2 py-1">Accès rapide (Top récents)</p>
                    <ul className="text-sm text-lpd-text">
                      {recentPaths.length ? recentPaths.map((p) => (
                        <li
                          key={p}
                          onClick={() => go(p)}
                          className="hover:bg-lpd-light px-3 py-2 rounded-md cursor-pointer"
                          title={p}
                        >
                          {p === "/responsable/inventaire" ? "📦 Inventaire"
                          : p === "/responsable/utilisateurs" ? "👥 Utilisateurs"
                          : p === "/responsable/rapports" ? "📊 Rapports"
                          : `➡ ${p}`}
                        </li>
                      )) : (
                        <>
                          <li onClick={() => go("/responsable/inventaire")} className="hover:bg-lpd-light px-3 py-2 rounded-md cursor-pointer">📦 Inventaire</li>
                          <li onClick={() => go("/responsable/utilisateurs")} className="hover:bg-lpd-light px-3 py-2 rounded-md cursor-pointer">👥 Utilisateurs</li>
                          <li onClick={() => go("/responsable/rapports")} className="hover:bg-lpd-light px-3 py-2 rounded-md cursor-pointer">📊 Rapports</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* --- Notifications --- */}
              <div className="relative">
                <button onClick={toggleNotif} className="p-2 rounded-lg hover:bg-[#F9F9FF] transition relative">
                  <Bell className="w-5 h-5 text-[#472EAD]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-[#F58020] text-white px-1.5 py-[2px] rounded-full shadow-soft">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-lpd-border rounded-lg shadow-lg p-2 animate-fadeIn">
                    <p className="text-xs font-semibold text-lpd-muted px-2 py-1">Notifications récentes</p>
                    <ul className="text-sm text-lpd-text divide-y divide-lpd-border max-h-64 overflow-auto">
                      {notifications.length ? notifications.map((n) => (
                        <li key={n.id} className="px-3 py-2 hover:bg-lpd-light cursor-pointer flex items-start gap-2">
                          <span className="mt-0.5">{n.type === "stock" ? "⚠️" : n.type === "journal" ? "🗒️" : "📈"}</span>
                          <span className={n.read ? "text-gray-500" : "font-medium"}>{n.text}</span>
                        </li>
                      )) : (
                        <li className="px-3 py-6 text-center text-gray-400">Aucune notification</li>
                      )}
                    </ul>
                    <div
                      onClick={() => navigate("/responsable/notifications")}
                      className="text-center text-xs text-lpd-muted mt-2 cursor-pointer hover:underline"
                    >
                      Voir tout
                    </div>
                  </div>
                )}
              </div>

              {/* --- Capsule Profil --- */}
              <div className="relative">
                <button
                  onClick={() => { setShowMenu(!showMenu); setShowQuick(false); setShowNotif(false); }}
                  className="group flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full bg-white border border-lpd-border hover:bg-[#F9F9FF] transition shadow-soft"
                >
                  <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center font-semibold overflow-hidden">
                    {user?.photo ? (
                      <img src={user.photo} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(user?.prenom, user?.nom)}</span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col leading-tight text-left mr-1">
                    <span className="text-[13px] font-semibold text-lpd-text">{user?.prenom} {user?.nom}</span>
                    <span className="text-[11px] text-lpd-muted -mt-0.5">{user?.role || "Responsable"}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-lpd-muted group-hover:text-[#472EAD] transition" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-lpd-border rounded-lg shadow-lg p-2 animate-fadeIn">
                    <ul className="text-sm text-lpd-text">
                      <li
                        onClick={() => { setShowProfileModal(true); setShowMenu(false); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-lpd-light cursor-pointer"
                      >
                        <User size={15} /> Mon Profil
                      </li>
                      <li
                        onClick={() => { setShowPwdModal(true); setShowMenu(false); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-lpd-light cursor-pointer"
                      >
                        <Key size={15} /> Changer mot de passe
                      </li>
                      <li
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-lpd-light cursor-pointer text-[#F58020] font-medium"
                      >
                        <LogOut size={15} /> Déconnexion
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modale changement mot de passe */}
      <PasswordModal
        open={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        onSuccess={() => setShowPwdModal(false)}
        addToast={(...a) => {
          const id = Date.now();
          setToasts((prev) => [...prev, { id, type: a[0], title: a[1], message: a[2] }]);
          setTimeout(() => removeToast(id), 4000);
        }}
      />

      {/* Modale mon profil */}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSave={({ prenom, nom, photo }) => {
          setUser((u) => ({ ...u, prenom, nom, photo: photo || null }));
          setShowProfileModal(false);
          addToast("success", "Profil mis à jour", "Vos informations ont été enregistrées.");
        }}
      />

      {/* Toasts */}
      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}

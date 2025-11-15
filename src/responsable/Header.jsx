// ==========================================================
// 🧠 Header.jsx — Version 100% Fonctionnelle (LPD Manager)
// Connecté Laravel + Sanctum : profil, logout, update, password
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
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { instance } from "../utils/axios";


// ==========================================================
// 🧩 Utils
// ==========================================================

const getInitials = (prenom = "", nom = "") =>
  (`${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.trim() || "AR").toUpperCase();

const loadJSON = (k, def) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
};

const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const RECENTS_KEY = "lpd_recent_paths";

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

function PasswordModal({ open, onClose, onSuccess, addToast }) {
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
      await instance.put("/auth/change-password", {
        old_password: oldPwd,
        new_password: newPwd,
        new_password_confirmation: confirmPwd,
      });

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
            <label className="block text-sm font-medium text-gray-600">Ancien mot de passe</label>
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
            <label className="block text-sm font-medium text-gray-600">Nouveau mot de passe</label>
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
      const res = await instance.put("/mon-profil", {
        prenom,
        nom,
        photo: preview,
      });

      onUpdate(res.data);
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
  const menuRef = useRef();

  // UI
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Data
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState(
    loadJSON("lpd_notifications", [
      { id: 1, type: "stock", text: "3 produits presque en rupture", read: false },
      { id: 2, type: "rapport", text: "Nouveau rapport disponible", read: false },
    ])
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 3500);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ==========================================================
  // 🔥 Charger le VRAI utilisateur
  // ==========================================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await instance.get("/mon-profil");
        setUser(data);
        localStorage.setItem("lpd_current_user", JSON.stringify(data));
      } catch (err) {
        console.error("Erreur profil :", err);
        navigate("/login");
      }
    };
    loadUser();
  }, []);

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
      await instance.post("/auth/logout");
    } catch {}

    localStorage.removeItem("token");
    localStorage.removeItem("lpd_current_user");

    navigate("/login");
  };

  // ==========================================================
  // 🔔 Notifications
  // ==========================================================

  const toggleNotif = () => {
    setShowNotif((v) => !v);
    setShowMenu(false);
    setShowQuick(false);

    if (!showNotif) {
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      }, 400);
    }
  };

  if (!user) return null;

  // ==========================================================
  // 🧱 UI du Header
  // ==========================================================

  return (
    <>
      <header className="relative z-20 w-full" ref={menuRef}>
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
            <div className="flex items-center gap-4">

              {/* NOTIFS */}
              <div className="relative">
                <button
                  onClick={toggleNotif}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-[#472EAD]" />

                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-[#F58020] text-white px-1.5 py-[2px] rounded-full shadow">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-2">
                    <p className="text-xs font-semibold px-2 py-1 text-gray-500">Notifications</p>

                    <ul className="max-h-64 overflow-auto divide-y">
                      {notifications.length ? (
                        notifications.map((n) => (
                          <li
                            key={n.id}
                            className="px-3 py-2 hover:bg-gray-50 flex gap-2 items-start cursor-pointer"
                          >
                            <span>{n.type === "stock" ? "⚠️" : "📄"}</span>
                            <span className={n.read ? "text-gray-500" : "font-medium"}>
                              {n.text}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-6 text-center text-gray-400">
                          Aucune notification
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
                          setShowProfileModal(true);
                          setShowMenu(false);
                        }}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex gap-2 items-center"
                      >
                        <User size={14} /> Mon Profil
                      </li>

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
      />

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdate={(updatedUser) => {
          setUser(updatedUser);
          localStorage.setItem("lpd_current_user", JSON.stringify(updatedUser));
        }}
        addToast={addToast}
      />

      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}

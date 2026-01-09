// ==========================================================
// 🔝 Header.jsx — Comptable LPD (SIMPLIFIÉ & PRO)
// - Sans Raccourcis
// - Sans Notifications
// - Sans Mon Profil
// - Avec Changer mot de passe + Déconnexion
// ==========================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Key, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../hooks/useAuth";

// ==========================================================
// 🔧 Utils
// ==========================================================
const getInitials = (prenom = "", nom = "") =>
  (`${prenom?.[0] || ""}${nom?.[0] || ""}` || "U").toUpperCase();

// ==========================================================
// 🔐 Modal — Changer mot de passe
// ==========================================================
function PasswordModal({ open, onClose, changePassword }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();

    if (!oldPwd || !newPwd || !confirmPwd) return alert("Tous les champs sont requis");
    if (newPwd !== confirmPwd) return alert("Les mots de passe ne correspondent pas");

    setLoading(true);
    try {
      await changePassword(oldPwd, newPwd, confirmPwd);
      alert("Mot de passe modifié avec succès");
      onClose();
    } catch (e) {
      alert("Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-[400px] rounded-xl p-5 shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-[#472EAD] flex items-center gap-2">
            <Key size={18} /> Changer mot de passe
          </h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            placeholder="Ancien mot de passe"
            className="w-full border px-3 py-2 rounded"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />

          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              className="w-full border px-3 py-2 rounded pr-10"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-2"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <input
            type="password"
            placeholder="Confirmer mot de passe"
            className="w-full border px-3 py-2 rounded"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#472EAD] text-white rounded"
            >
              {loading ? "..." : "Confirmer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================================
// 🔝 HEADER PRINCIPAL
// ==========================================================
export default function Header() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { user: authUser, logout, changePassword } = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [user, setUser] = useState(() => authUser || null);

  // Charger utilisateur
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      return;
    }
    navigate("/login");
  }, [authUser, navigate]);

  // Fermer menu au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Déconnexion
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="bg-white border-b shadow-sm px-6 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-[#472EAD]">LP</span>
          <span className="text-xl font-extrabold text-[#F58020]">D</span>
          <span className="text-sm text-gray-500 ml-2">Interface Comptable</span>
        </div>

        {/* USER MENU */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 border rounded-full px-3 py-1.5"
          >
            <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center">
              {getInitials(user.prenom, user.nom)}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold">
                {user.prenom} {user.nom}
              </span>
              <span className="text-[10px] text-gray-500">{user.role}</span>
            </div>

            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg p-2"
              >
                <button
                  onClick={() => {
                    setShowPwdModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <Key size={14} /> Changer mot de passe
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-[#F58020]"
                >
                  <LogOut size={14} /> Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* MODAL */}
      <PasswordModal
        open={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        changePassword={changePassword}
      />
    </>
  );
}

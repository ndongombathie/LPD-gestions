// ==========================================================
// 🔝 HeaderComptable.jsx — Comptable LPD (AVEC NOTIFICATIONS)
// DESIGN IDENTIQUE AU GESTIONNAIRE
// ==========================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Key,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import useAuth from "../hooks/useAuth";

/* ===================== Utils ===================== */
const getInitials = (prenom = "", nom = "") =>
  (`${prenom?.[0] || ""}${nom?.[0] || ""}` || "U").toUpperCase();

/* ===================== MODAL MOT DE PASSE ===================== */
function PasswordModal({ open, onClose, changePassword }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [show, setShow] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();

    if (!oldPwd || !newPwd || !confirmPwd) {
      alert("Tous les champs sont requis");
      return;
    }

    if (newPwd !== confirmPwd) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await changePassword(oldPwd, newPwd, confirmPwd);
      alert("Mot de passe modifié avec succès");
      onClose();
    } catch (error) {
      console.error("[HeaderComptable] Erreur changement mot de passe :", error);
      alert("Erreur lors du changement de mot de passe");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[400px] rounded-xl p-5 shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold text-[#472EAD] flex gap-2">
            <Key size={18} /> Changer mot de passe
          </h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            placeholder="Ancien mot de passe"
            className="w-full px-3 py-2 rounded border"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />

          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              className="w-full px-3 py-2 rounded border pr-10"
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
            className="w-full px-3 py-2 rounded border"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#472EAD] text-white rounded"
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== HEADER ===================== */
export default function HeaderComptable() {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuth();

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    try {
      const data =
        JSON.parse(
          sessionStorage.getItem("notificationsComptable")
        ) || [
          { id: 1, text: "Nouvelle demande de décaissement (Boutique)" },
          { id: 2, text: "Vente spéciale validée (Dépôt)" },
        ];
      setNotifications(data);
    } catch (error) {
      console.error("[HeaderComptable] Erreur chargement notifications :", error);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !notifRef.current?.contains(e.target)
      ) {
        setShowMenu(false);
        setShowNotif(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [navigate]);

  if (!user) return null;

  return (
    <>
      {/* HEADER */}
      <header className="bg-white h-16 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-xl font-extrabold text-[#472EAD]">
            LP<span className="text-[#F58020]">D</span>
          </div>
          <div>
            <p className="font-semibold text-[#472EAD]">Interface Comptable</p>
            <p className="text-xs text-gray-500">
              Suivi financier & mouvements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* NOTIFICATIONS */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg p-3 z-50">
                  <h4 className="font-semibold mb-2 text-[#472EAD]">
                    Notifications
                  </h4>

                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune alerte</p>
                  ) : (
                    <ul className="space-y-2">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className="text-sm p-2 rounded bg-gray-50"
                        >
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* USER MENU */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 border rounded-full px-3 py-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center">
                {getInitials(user.prenom, user.nom)}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>

              <ChevronDown size={14} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-2">
                  <button
                    onClick={() => {
                      setShowPwdModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex gap-2"
                  >
                    <Key size={14} /> Changer mot de passe
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full px-3 py-2 text-sm hover:bg-gray-50 text-[#F58020] flex gap-2"
                  >
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="h-[1px] bg-gradient-to-r from-[#472EAD] via-[#5A3BE6] to-[#F58020]" />

      <PasswordModal
        open={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        changePassword={changePassword}
      />
    </>
  );
}

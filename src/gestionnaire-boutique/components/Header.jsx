import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,

} from "lucide-react";
// framer-motion removed to avoid optional peer dep on react/jsx-runtime in dev
import useAuth from "../../hooks/useAuth";
import profileAPI from "@/services/api/profile";

const getInitials = (prenom = "", nom = "") =>
  (`${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.trim() || "AR").toUpperCase();

// Normalise la structure utilisateur pour garantir prenom/nom même si l'API renvoie seulement `name`
const normalizeUser = (u) => {
  try {
    if (!u || typeof u !== "object") {
      return { prenom: "", nom: "", email: "", role: "", photo: null };
    }
    const name = u.name || "";
    const [first, ...rest] = name.split(" ").filter(Boolean);
    const prenom = u.prenom ?? first ?? "";
    const nom = u.nom ?? (rest.join(" ") || "");
    return {
      ...u,
      prenom,
      nom,
      email: u.email || "",
      role: u.role || "",
      photo: u.photo || null,
    };
  } catch {
    return { prenom: "", nom: "", email: "", role: "", photo: null };
  }
};


function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-9999 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-md bg-white border border-gray-100 ${
            t.type === "success" ? "border-l-4 border-emerald-500" : "border-l-4 border-rose-500"
          } w-80`}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 text-rose-500" />
          )}

          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">{t.title}</div>
            {t.message && <div className="text-xs text-gray-600 mt-0.5">{t.message}</div>}
          </div>

          <button
            onClick={() => remove(t.id)}
            className="ml-3 text-gray-400 hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

//  Modal — Changer mot de passe (Connectée au backend !)
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
      await changePassword(oldPwd, newPwd, confirmPwd);
      addToast("success", "Mot de passe modifié", "Vos identifiants ont été mis à jour.");
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || "Impossible de changer le mot de passe.";
      addToast("error", "Erreur", msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[95%] sm:w-[420px] rounded-2xl shadow-2xl p-5">
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
      </div>
    </div>
  );
}


// HEADER PRINCIPAL (connecté au backend !)

export default function Header() {
  const navigate = useNavigate();
  const menuRef = useRef();
  const { user: authUser, logout, changePassword } = useAuth();

  // UI
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);


  const [user, setUser] = useState(() => authUser);
  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);
  const [toasts, setToasts] = useState([]);



  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 3500);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));



  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await profileAPI.getProfile();
        const normalized = normalizeUser(data);
        setUser(normalized);
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch (err) {
        // Fallback sur localStorage si l'API n'est pas dispo
        const saved = localStorage.getItem("user");
        if (saved) {
          try {
            setUser(normalizeUser(JSON.parse(saved)));
          } catch {
            console.error("Erreur parsing user:", err);
          }
        } else {
          console.error("Erreur chargement user:", err);
        }
      }
    };
    loadUser();
  }, [navigate]);

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

  // Déconnexion réelle
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  return (
    <>
      <header className="relative z-20 w-full" ref={menuRef}>
        <div className="h-1.5 w-full bg-gradient-to-r from-[#472EAD] via-[#472EAD] to-[#F58020]" />

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
                    {" "} | Interface Gestionnaire Boutique
                  </span>
                </h1>
                <p className="hidden sm:block text-xs text-gray-400">
                  Supervision générale : produits, stock & rapports
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4">


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

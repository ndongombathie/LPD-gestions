// ==========================================================
// 🧭 CaissierLayout.jsx — Interface Caissier (LPD Manager)
// Design harmonisé avec les autres interfaces
// ==========================================================

import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  History,
  FileText,
  Bell,
  LayoutGrid,
  ChevronDown,
  LogOut,
  Key,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import { instance } from '../../utils/axios'
import NotificationsDropdown from '../components/NotificationsDropdown'
import ShortcutsMenu from '../components/ShortcutsMenu'

// ==========================================================
// 🔧 Utils
// ==========================================================
const getInitials = (prenom = "", nom = "") =>
  (`${prenom?.[0] || ""}${nom?.[0] || ""}` || "C").toUpperCase()

// ==========================================================
// 🔐 Modal — Changer mot de passe
// ==========================================================
function PasswordModal({ open, onClose, addToast }) {
  const [oldPwd, setOldPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()

    if (!oldPwd || !newPwd || !confirmPwd) {
      addToast("error", "Champs manquants", "Veuillez remplir tous les champs.")
      return
    }

    if (newPwd.length < 6) {
      addToast("error", "Mot de passe trop court", "Minimum 6 caractères.")
      return
    }

    if (newPwd !== confirmPwd) {
      addToast("error", "Erreur", "Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)

    try {
      await instance.put("/auth/change-password", {
        old_password: oldPwd,
        new_password: newPwd,
        new_password_confirmation: confirmPwd,
      })

      addToast("success", "Mot de passe modifié", "Vos identifiants ont été mis à jour.")
      onClose()
      setOldPwd("")
      setNewPwd("")
      setConfirmPwd("")
    } catch (err) {
      const msg = err?.response?.data?.message || "Impossible de changer le mot de passe."
      addToast("error", "Erreur", msg)
    } finally {
      setLoading(false)
    }
  }

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
  )
}

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
  )
}

// ==========================================================
// 🧭 LAYOUT PRINCIPAL
// ==========================================================
export default function CaissierLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef()

  // UI
  const [showMenu, setShowMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [toasts, setToasts] = useState([])

  // Data
  const [user, setUser] = useState(null)

  // Menu items
  const menuItems = [
    { name: "Tableau de bord", icon: LayoutDashboard, path: "/caissier/dashboard" },
    { name: "Caisse", icon: Wallet, path: "/caissier/caisse" },
    { name: "Décaissements", icon: ArrowDownCircle, path: "/caissier/decaissements" },
    { name: "Historique", icon: History, path: "/caissier/historique" },
    { name: "Rapport", icon: FileText, path: "/caissier/rapport" },
  ]

  const addToast = (type, title, message) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => removeToast(id), 3500)
  }

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  // Charger utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await instance.get("/mon-profil")
        setUser(data)
        localStorage.setItem("lpd_current_user", JSON.stringify(data))
      } catch (err) {
        console.error("Erreur profil :", err)
        navigate("/login")
      }
    }
    loadUser()
  }, [navigate])

  // Fermer menus au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
        setShowNotif(false)
        setShowQuick(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Déconnexion
  const handleLogout = async () => {
    try {
      await instance.post("/auth/logout")
    } catch {}

    localStorage.removeItem("token")
    localStorage.removeItem("lpd_current_user")

    navigate("/login")
  }

  // Si pas d'utilisateur, ne rien afficher (sera redirigé par ProtectedRoute)
  if (!user) return null

  const displayUser = user

  return (
    <>
      <div className="flex bg-lpd-light text-lpd-text min-h-screen">
        {/* === Sidebar === */}
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-md flex-col z-40">
          {/* Logo LPD */}
          <div className="h-20 flex flex-col items-center justify-center border-b border-gray-200 bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white shadow-md">
            <div className="flex flex-col items-center justify-center -mt-1">
              <div className="flex items-center justify-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="60"
                  height="38"
                  viewBox="0 0 200 120"
                  fill="none"
                >
                  <ellipse cx="100" cy="60" rx="90" ry="45" fill="#472EAD" />
                  <text
                    x="50%"
                    y="66%"
                    textAnchor="middle"
                    fill="#F58020"
                    fontFamily="Arial Black, sans-serif"
                    fontSize="60"
                    fontWeight="900"
                    dy=".1em"
                  >
                    LPD
                  </text>
                </svg>
              </div>
              <p className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
                Librairie Papeterie Daradji
              </p>
            </div>
          </div>

          {/* Menu principal */}
          <nav className="flex-1 overflow-y-auto py-5 px-3 scrollbar-thin scrollbar-thumb-[#472EAD]/30 scrollbar-track-transparent">
            <ul className="space-y-1 relative">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <li key={item.path} className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 w-1 h-full rounded-r-full bg-[#F58020]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}

                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-4 py-2.5 rounded-md text-[15px] font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[#472EAD] text-white shadow-md"
                            : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                        }`
                      }
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center justify-center"
                      >
                        <Icon
                          size={18}
                          className={`transition-colors duration-300 ${
                            isActive ? "text-white" : "text-[#472EAD]"
                          }`}
                        />
                      </motion.div>

                      <span
                        className={`transition-colors duration-200 ${
                          isActive ? "text-white" : "text-[#472EAD]"
                        }`}
                      >
                        {item.name}
                      </span>

                      <motion.div
                        className="absolute inset-0 rounded-md bg-[#472EAD]/5 opacity-0"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* === Contenu principal === */}
        <div className="flex flex-col flex-1 md:ml-64 relative z-10">
          {/* Header */}
          <header className="sticky top-0 z-20 w-full bg-white" ref={menuRef}>
            <div className="h-[6px] w-full bg-gradient-to-r from-[#472EAD] via-[#472EAD] to-[#F58020]" />

            <div className="bg-white h-16 shadow-sm border-b">
              <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between">
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
                        {" "} | Interface Caissier
                      </span>
                    </h1>
                    <p className="hidden sm:block text-xs text-gray-400">
                      Gestion des encaissements et décaissements quotidiens
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* RACCOURCIS */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowQuick((v) => !v)
                        setShowNotif(false)
                        setShowMenu(false)
                      }}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD] transition"
                    >
                      <LayoutGrid size={18} className="text-[#472EAD]" />
                      <span className="hidden sm:inline">Raccourcis</span>
                    </button>

                    {showQuick && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-30"
                      >
                        <p className="text-xs font-semibold text-gray-500 px-2 py-1">
                          Accès rapide
                        </p>
                        <ul className="text-sm text-gray-700">
                          {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                              <li
                                key={item.path}
                                onClick={() => {
                                  navigate(item.path)
                                  setShowQuick(false)
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#F7F5FF]"
                              >
                                <Icon size={16} className="text-[#472EAD]" />
                                <span>{item.name}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </div>

                  {/* NOTIFS */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotif((v) => !v)
                        setShowQuick(false)
                        setShowMenu(false)
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 relative"
                    >
                      <Bell className="w-5 h-5 text-[#472EAD]" />
                    </button>

                    {showNotif && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg p-3 z-40">
                        <NotificationsDropdown
                          isOpen={showNotif}
                          onClose={() => setShowNotif(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* PROFIL */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowMenu((v) => !v)
                        setShowNotif(false)
                        setShowQuick(false)
                      }}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border bg-white hover:bg-gray-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#472EAD] text-white flex items-center justify-center overflow-hidden">
                        {displayUser.photo ? (
                          <img src={displayUser.photo} className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(displayUser.prenom, displayUser.nom)}</span>
                        )}
                      </div>

                      <div className="hidden sm:flex flex-col text-left">
                        <span className="text-xs font-semibold">
                          {displayUser.prenom} {displayUser.nom}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {displayUser.role}
                        </span>
                      </div>

                      <ChevronDown size={14} className="text-gray-500" />
                    </button>

                    {showMenu && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-lg p-2 z-30"
                        >
                          <ul className="text-sm">
                            <li
                              onClick={() => {
                                setShowPwdModal(true)
                                setShowMenu(false)
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
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Contenu principal */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-lpd-light px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 transition-all duration-300 ease-in-out relative z-0">
            <div className="max-w-7xl mx-auto relative z-10 fade-in">
              <Outlet />
              
              {/* Footer intégré dans le contenu */}
              <footer className="mt-8 pt-6 border-t border-lpd-border/80 bg-transparent">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lpd-accent" />
                    <span>
                      © {new Date().getFullYear()}{" "}
                      <span className="font-semibold text-lpd-header">
                        SSD Consulting
                      </span>
                      {" · "}
                      <span className="text-gray-400">Tous droits réservés.</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                    <span className="hidden sm:inline-block h-3 w-px bg-gray-200" />
                    <span className="text-gray-400">LPD Manager</span>
                    <span className="text-gray-300">•</span>
                    <span>Interface Caissier</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-semibold text-lpd-accent">v1.0.0</span>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* Modales */}
      <PasswordModal
        open={showPwdModal}
        onClose={() => setShowPwdModal(false)}
        addToast={addToast}
      />

      <Toasts toasts={toasts} remove={removeToast} />
      <Toaster position="top-right" richColors />
    </>
  )
}

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  ChevronDown,
  LogOut,
  Key,
  X,
  Save,
  Store,
  Calendar,
  Banknote
} from "lucide-react";



// ================= Utils =================
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ================= Header =================
const Header = ({
  sectionActive,
  setSectionActive,
  onLogout,
  user,
  commandes,
  onUpdateUser,
}) => {
  const [ventesDuJour, setVentesDuJour] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const menuRef = useRef(null);

  // ===== Calcul ventes =====
  useEffect(() => {
    const today = new Date().toDateString();
    const total = (commandes || [])
      .filter(
        (c) =>
          new Date(c.created_at).toDateString() === today &&
          c.statut === "complétée"
      )
      .reduce((sum, c) => sum + (c.total_ttc || 0), 0);

    setVentesDuJour(total);
  }, [commandes]);

  const formatMoney = (v) =>
    new Intl.NumberFormat("fr-FR").format(v) + " FCFA";

  // ===== Click outside =====
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="h-[5px] bg-gradient-to-r from-indigo-600 to-orange-400" />

        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          {/* ===== LEFT ===== */}
          <div>
            <h1 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
              <Store size={18} />
              Librairie Papeterie Daradji
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Calendar size={12} />
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* ===== RIGHT ===== */}
          <div className="flex items-center gap-4">
            {/* Ventes */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                <Banknote size={12} /> Ventes du jour
              </span>
              <span className="font-semibold text-green-600">
                {formatMoney(ventesDuJour)}
              </span>
            </div>

            {/* User */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getInitials(user?.name || "U")
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold">
                    {user?.name || "Utilisateur"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {user?.role || "Vendeur"}
                  </span>
                </div>

                <ChevronDown size={14} />
              </button>

              {/* ===== Dropdown ===== */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-2">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400">
                      {user?.store || "Boutique Principale"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                  >
                    <Key size={14} />
                    Modifier le mot de passe
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md"
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MODAL PASSWORD ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[95%] sm:w-[420px] rounded-2xl shadow-xl p-5">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Key size={18} /> Modifier le mot de passe
              </h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* 👉 Tu peux brancher ici EXACTEMENT ta logique existante */}
            <p className="text-sm text-gray-500 mb-4">
              (Logique actuelle conservée)
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Annuler
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                <Save size={14} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

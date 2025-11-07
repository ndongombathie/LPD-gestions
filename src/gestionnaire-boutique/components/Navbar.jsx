import React, { useState } from "react";
import { Bell, Sun, Moon, Search, ChevronDown, Settings, LogOut, User } from "lucide-react";

const Navbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Si user n'est pas passé en props, utiliser des données par défaut
  const currentUser = user || {
    firstName: "Fatou",
    lastName: "Sall",
    role: "Gestionnaire Boutique",
    avatar: null
  };

  return (
    <div className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-lg border-b border-gray-700">
      {/* Partie gauche - Message de bienvenue */}
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-xl font-semibold">Bienvenue, {currentUser.firstName}</h2>
          <p className="text-sm text-gray-400">Bon retour sur votre espace de gestion</p>
        </div>
      </div>

      {/* Partie droite - Actions et profil */}
      <div className="flex items-center gap-3">
        {/* Barre de recherche (optionnel - peut être masqué) */}
        <div className="hidden lg:flex items-center bg-[#2d3e56] rounded-lg px-4 py-2 w-64">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-400 w-full"
          />
        </div>

        {/* Bouton Mode Clair/Sombre */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:bg-[#2d3e56] rounded-lg transition-colors"
          title={darkMode ? "Mode clair" : "Mode sombre"}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-300" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 hover:bg-[#2d3e56] rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-gray-300" />
          {/* Badge de notification */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Séparateur */}
        <div className="h-8 w-px bg-gray-700"></div>

        {/* Profil utilisateur avec dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-[#2d3e56] rounded-lg px-3 py-2 transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#472EAD] to-[#F58020] rounded-full flex items-center justify-center font-bold text-white shadow-lg">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </div>

            {/* Info utilisateur */}
            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold text-white">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-gray-400">{currentUser.role}</p>
            </div>

            {/* Icône dropdown */}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menu dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-[#2d3e56] rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-30">
              {/* Info utilisateur dans le dropdown */}
              <div className="px-4 py-3 border-b border-gray-700 bg-[#1e293b]">
                <p className="text-sm font-semibold text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-gray-400">{currentUser.role}</p>
              </div>

              {/* Options du menu */}
              <div className="py-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#374151] transition-colors text-left">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Mon profil</span>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#374151] transition-colors text-left">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Paramètres</span>
                </button>

                <div className="border-t border-gray-700 my-2"></div>

                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 transition-colors text-left group">
                  <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                  <span className="text-sm text-white group-hover:text-red-500">
                    Déconnexion
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
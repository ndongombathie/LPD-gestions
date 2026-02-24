import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ sectionActive, setSectionActive, user, isOpen, onClose }) => {
  const menuItems = [
    {
      id: "tableau-de-bord",
      label: "Tableau de bord",
      icon: LayoutDashboard,
    },
    {
      id: "nouvelle-commande",
      label: "Nouvelle commande",
      icon: ShoppingCart,
    },
    {
      id: "historique-commandes",
      label: "Historique",
      icon: Clock,
    },
  ];

  const getInitialesUtilisateur = () => {
    if (!user?.name) return "LZ";
    const mots = user.name.trim().split(" ");
    return mots.length === 1
      ? mots[0].substring(0, 2).toUpperCase()
      : (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  };

  const handleSectionChange = (id) => {
    setSectionActive(id);
    if (window.innerWidth <= 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Sidebar pour desktop - SANS FOOTER */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-lg flex-col z-40">
        {/* LOGO */}
        <div className="h-20 flex flex-col items-center justify-center bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white">
          <div className="text-3xl font-extrabold tracking-wide text-[#F58020]">
            LPD
          </div>
          <span className="text-[11px] uppercase tracking-wider text-white/80">
            Librairie Papeterie Daradji
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            Navigation
          </span>

          <ul className="mt-3 space-y-1 relative">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = sectionActive === item.id;

              return (
                <li key={item.id} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 h-full w-1 bg-[#F58020] rounded-r-full"
                    />
                  )}

                  <button
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition ${
                      isActive
                        ? "bg-[#472EAD] text-white shadow-md"
                        : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : "text-[#472EAD]"}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Plus de footer ici */}
      </aside>

      {/* Sidebar mobile avec animation - SANS FOOTER */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-xl flex-col z-50"
          >
            {/* Bouton de fermeture */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} className="text-gray-600" />
            </button>

            {/* LOGO */}
            <div className="h-20 flex flex-col items-center justify-center bg-gradient-to-r from-[#472EAD] to-[#4e33c9] text-white">
              <div className="text-3xl font-extrabold tracking-wide text-[#F58020]">
                LPD
              </div>
              <span className="text-[11px] uppercase tracking-wider text-white/80">
                Librairie Papeterie Daradji
              </span>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-3 py-5 overflow-y-auto">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                Navigation
              </span>

              <ul className="mt-3 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = sectionActive === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSectionChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition ${
                          isActive
                            ? "bg-[#472EAD] text-white shadow-md"
                            : "text-gray-700 hover:bg-[#F7F5FF] hover:text-[#472EAD]"
                        }`}
                      >
                        <Icon
                          size={18}
                          className={isActive ? "text-white" : "text-[#472EAD]"}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            
            {/* Plus de footer ici */}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
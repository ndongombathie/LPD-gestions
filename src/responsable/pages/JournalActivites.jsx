// ==========================================================
// 🧾 JournalActivites.jsx — Version alignée avec l'architecture
// - Affichage des sous-pages des rôles DANS JournalActivites
// ==========================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Banknote,
  Store,
} from "lucide-react";

// Import des sous-pages des rôles
import VendeursPage from "./roles/VendeursPage.jsx";
import CaissiersPage from "./roles/CaissiersPage.jsx";
import GestionnairesBoutiquePage from "./roles/GestionnairesBoutiquePage.jsx";

// ==========================================================
// 🧩 Profils suivis par le journal
// ==========================================================
const ROLE_CARDS = [
  {
    id: "vendeur",
    label: "Vendeurs",
    description: "Ventes, paniers, annulations",
    icon: ShoppingCart,
    color: "emerald",
  },
  {
    id: "caissier",
    label: "Caissiers",
    description: "Encaissements, décaissements",
    icon: Banknote,
    color: "amber",
  },
  {
    id: "gestionnaire_boutique",
    label: "Gestionnaire Boutique",
    description: "Stock et réappro",
    icon: Store,
    color: "blue",
  },
];

// ==========================================================
// 💰 Composant principal
// ==========================================================
export default function JournalActivites() {
  const [activeRole, setActiveRole] = useState("vendeur");
  const [activeRolePage, setActiveRolePage] = useState("vendeur");

 

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-50/50 to-white px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Journal d'activités — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Journal des activités
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Traçabilité complète des connexions, ventes, mouvements de stock, encaissements et décaissements.
                <br />
                <span className="text-[#2F1F7A] font-medium">Cliquez sur une carte pour voir les détails par rôle</span>
              </p>
            </div>
          </div>
        </motion.header>

        {/* CARTES PROFILS (CLIQUABLES) - ONGLETS MÉTIER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {ROLE_CARDS.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            const colorClasses = {
              emerald: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-200',
                ring: 'ring-emerald-300',
                dot: 'bg-emerald-500'
              },
              amber: {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-200',
                ring: 'ring-amber-300',
                dot: 'bg-amber-500'
              },
              blue: {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-200',
                ring: 'ring-blue-300',
                dot: 'bg-blue-500'
              },
            };
            
            const colors = colorClasses[role.color];
            
            return (
              <motion.button
                key={role.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveRole(role.id);       // pour les stats
                  setActiveRolePage(role.id);  // pour la sous-page
                }}
                className={`relative group text-left rounded-xl border px-4 py-4 transition-all duration-300 shadow-sm hover:shadow-md ${
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-opacity-50 ${colors.ring}`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? colors.bg : 'bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? colors.text : 'text-gray-500'}`} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-sm font-semibold ${isActive ? colors.text : 'text-gray-700'}`}>
                      {role.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {role.description}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${colors.dot}`} />
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className={`absolute inset-0 rounded-xl ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
              </motion.button>
            );
          })}
        </motion.div>

        {/* ZONE D'AFFICHAGE DES SOUS-PAGES */}
        {activeRolePage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            {activeRolePage === "vendeur" && <VendeursPage />}
            {activeRolePage === "caissier" && <CaissiersPage />}
            {activeRolePage === "gestionnaire_boutique" && <GestionnairesBoutiquePage />}
          </motion.div>
        )}
      </div>
    </div>
  );
}
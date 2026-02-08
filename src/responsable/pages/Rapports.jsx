// ==========================================================
// 📊 Rapports.jsx — Version FINALE (2 modules seulement)
// Page principale qui affiche les journaux d'audit
// ==========================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Star,
  ChevronRight,
} from "lucide-react";

// ==========================================================
// 📦 Import des sous-pages
// ==========================================================
import RapportsFournisseurs from "./rapport/RapportsFournisseurs";
import RapportsClients from "./rapport/RapportsClients";

// ==========================================================
// 🧮 Helpers
// ==========================================================
const todayISO = () => new Date().toISOString().slice(0, 10);

// Cartes de navigation (2 modules seulement)
const MODULE_CARDS = [
  { 
    id: "fournisseurs", 
    label: "Fournisseurs", 
    description: "Journal des actions fournisseurs", 
    icon: Truck, 
    color: "green"
  },
  { 
    id: "clients", 
    label: "Clients spéciaux", 
    description: "Journal des actions clients", 
    icon: Star, 
    color: "amber"
  },
];

// ==========================================================
// 📊 Composant principal — RAPPORTS VERSION FINALE
// ==========================================================
export default function Rapports() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  
  const [dateFin, setDateFin] = useState(todayISO());
  const [recherche, setRecherche] = useState("");
  const [moduleActif, setModuleActif] = useState("fournisseurs");

  // Options pour le module actif
  const moduleActifData = MODULE_CARDS.find(m => m.id === moduleActif);

  // Composant à afficher selon le module actif
  const renderModuleContent = () => {
    const props = {
      dateDebut,
      dateFin,
      recherche,
      onDateDebutChange: setDateDebut,
      onDateFinChange: setDateFin,
      onRechercheChange: setRecherche,
    };

    switch (moduleActif) {
      case "fournisseurs":
        return <RapportsFournisseurs {...props} />;
      case "clients":
        return <RapportsClients {...props} />;
      default:
        return <RapportsFournisseurs {...props} />;
    }
  };

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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Rapports — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Journal d'activités du Responsable
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Traçabilité complète de toutes vos actions sur les fournisseurs et clients spéciaux.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Période du{" "}
              <span className="font-semibold">{dateDebut}</span> au{" "}
              <span className="font-semibold">{dateFin}</span> •{" "}
              Module actif : <span className="font-semibold">{moduleActifData?.label}</span>
            </p>
          </div>
        </motion.header>

        {/* CARTES DE NAVIGATION ÉLARGIES - 2 modules seulement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {MODULE_CARDS.map((module) => {
            const Icon = module.icon;
            const isActive = moduleActif === module.id;
            
            // Classes Tailwind COMPLÈTES pour chaque couleur
            const getColorClasses = (color) => {
              switch (color) {
                case 'green':
                  return {
                    bg: 'bg-green-50',
                    text: 'text-green-600',
                    border: 'border-green-200',
                    bgLight: 'bg-green-50',
                    textLight: 'text-green-500',
                    dot: 'bg-green-500',
                    ring: 'ring-green-500'
                  };
                case 'amber':
                  return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-600',
                    border: 'border-amber-200',
                    bgLight: 'bg-amber-50',
                    textLight: 'text-amber-500',
                    dot: 'bg-amber-500',
                    ring: 'ring-amber-500'
                  };
                default:
                  return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-600',
                    border: 'border-gray-200',
                    bgLight: 'bg-gray-50',
                    textLight: 'text-gray-500',
                    dot: 'bg-gray-500',
                    ring: 'ring-gray-500'
                  };
              }
            };
            
            const colors = getColorClasses(module.color);
            
            return (
              <button
                key={module.id}
                onClick={() => {
                  setModuleActif(module.id);
                }}
                className={`relative text-left rounded-xl border px-6 py-5 transition-all duration-300 shadow-sm hover:shadow-md w-full
                  ${isActive 
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-opacity-50 ${colors.ring} transform scale-[1.02]`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${isActive ? colors.bgLight : 'bg-gray-50'}`}>
                      <Icon className={`w-6 h-6 ${isActive ? colors.text : 'text-gray-500'}`} />
                    </div>
                    <div className="flex flex-col text-left flex-1">
                      <span className={`text-base font-semibold ${isActive ? colors.text : 'text-gray-700'}`}>
                        {module.label}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        {module.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isActive ? colors.text : 'text-gray-400'} ml-4`} />
                </div>
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className="text-xs font-medium text-gray-600">
                        Module actif
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENU DYNAMIQUE DE LA SOUS-PAGE */}
        <motion.div
          key={moduleActif}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          {renderModuleContent()}
        </motion.div>
      </div>
    </div>
  );
}
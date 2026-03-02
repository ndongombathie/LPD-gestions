// src/gestionnaire-depot/layout/Footer.jsx (version simple)
import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
      © {currentYear} <span className="font-semibold text-[#472EAD]">LPD</span> - Gestion de Stock. Tous droits réservés.
    </footer>
  );
}
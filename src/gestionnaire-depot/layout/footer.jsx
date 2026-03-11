// src/gestionnaire-depot/layout/Footer.jsx (version adaptée)
import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="
        fixed
        bottom-0
        left-0
        right-0
        md:left-64
        border-t border-slate-200
        bg-white
        z-20
        py-3
        px-6
      "
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center text-xs text-slate-500">
        <span>
          © {currentYear}{" "}
          <span className="font-semibold text-[#472EAD]"> SSD </span> -Consulting
        </span>
        <span className="font-semibold text-[#472EAD]">
         LPD Manager v1.0.0
        </span>
      </div>
    </footer>
  );
}
// src/gestionnaire-depot/layout/SidebarFooter.jsx
import React from "react";

const SidebarFooter = () => {
  return (
    <div className="border-t border-gray-200 bg-white py-3 px-4">
      <div className="text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Librairie Papeterie Daradji
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Développé par <span className="text-[#472EAD] font-medium">SSD CONSULTING</span>
        </p>
      </div>
    </div>
  );
};

export default SidebarFooter;
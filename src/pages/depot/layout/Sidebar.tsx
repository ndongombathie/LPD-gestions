import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const menuItems = [
    { icon: '📊', label: 'Tableau de bord', path: '/depot' },
    { icon: '📦', label: 'Produits', path: '/depot/products' },
    { icon: '📋', label: 'Mouvements de Stock', path: '/depot/mouvementStock' },
    { icon: '🏢', label: 'Fournisseurs', path: '/depot/fournisseurs' },
    { icon: '📈', label: 'Rapport Stock', path: '/depot/reports' },
    { icon: '📊', label: 'Inventaire', path: '/depot/inventaire' },
  ];

  return (
    <div className={`bg-[#472EAD] text-white fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ${isOpen ? 'translate-x-0 w-64' : '-translate-x-48 w-20'}`}>
      {/* En-tête avec logo LPD Manager */}
      <div className="flex items-center justify-center h-16 border-b border-[#5A3BC0] bg-[#472EAD]">
        {isOpen ? (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white">LPD</h1>
            <p className="text-sm text-[#F58020] font-semibold mt-1">
              LPD Manager
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">LPD</span>
            <span className="text-[10px] text-[#F58020] font-semibold mt-1">MGR</span>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="mt-8">
        {menuItems.map((item) => (
          <div key={item.path}>
            <Link
              to={item.path}
              className="flex items-center px-4 py-3 text-white hover:bg-[#5A3BC0] transition-colors group relative"
            >
              <span className="text-lg">{item.icon}</span>
              {isOpen && <span className="ml-4 font-medium">{item.label}</span>}
              
              {/* Effet d'accent orange au survol */}
              <div className="absolute right-0 w-1 h-8 bg-transparent group-hover:bg-[#F58020] transition-colors rounded-l"></div>
            </Link>
          </div>
        ))}
      </nav>

      {/* Section bas avec accent orange */}
      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#5A3BC0]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white opacity-80">Version 1.0</span>
            <span className="text-[#F58020] font-semibold">LABORATEL</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
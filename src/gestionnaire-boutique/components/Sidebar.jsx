import React from "react";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  RefreshCw, 
  Users, 
  FileText,
  AlertTriangle 
} from "lucide-react";

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const links = [
    { id: "dashboard", name: "Tableau de bord", icon: Home },
    { id: "produits", name: "Produits", icon: Package },
    { id: "stock", name: "Stock", icon: ClipboardList },
    { id: "transferts", name: "Transferts", icon: RefreshCw },
    { id: "alertes", name: "Alertes", icon: AlertTriangle },
    { id: "rapports", name: "Rapports", icon: FileText },
  ];

  return (
    <div className="w-64 bg-[#1e293b] text-white min-h-screen p-4 fixed left-0 top-0 bottom-0 shadow-xl">
      {/* Logo / Titre */}
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-white">LPD Manager</h1>
      </div>
      
      {/* Menu de navigation */}
      <nav>
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;
            
            return (
              <li key={link.id}>
                <button
                  onClick={() => setCurrentPage(link.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 ease-in-out
                    ${isActive 
                      ? "bg-[#2d3e56] text-white font-semibold shadow-md" 
                      : "text-gray-300 hover:bg-[#2d3e56] hover:text-white"
                    }
                  `}
                >
                  <Icon 
                    className={`w-5 h-5 ${isActive ? "text-[#F58020]" : ""}`} 
                    strokeWidth={2}
                  />
                  <span className="text-sm">{link.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer optionnel (badge version ou aide) */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="bg-[#2d3e56] rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Version 1.0.0</p>
          <p className="text-xs text-[#F58020] mt-1 font-medium">Gestionnaire Pro</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
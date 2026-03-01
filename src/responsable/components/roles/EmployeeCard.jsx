import React from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Eye,
  ShoppingCart,
  Banknote,
  Store,
  Warehouse,
  FileText
} from "lucide-react";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const roleIcons = {
  vendeur: ShoppingCart,
  caissier: Banknote,
  gestionnaire_boutique: Store,
  gestionnaire_depot: Warehouse,
  comptable: FileText,
};

export default function EmployeeCard({ 
  employee, 
  role, 
  onViewHistory,
  stats = {}
}) {
  const RoleIcon = roleIcons[role] || User;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <RoleIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{employee.name}</h3>
            <p className="text-sm text-gray-500">{employee.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                employee.status === 'actif' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {employee.status === 'actif' ? 'Actif' : 'Inactif'}
              </span>
              {employee.boutique && (
                <span className="text-xs text-gray-500">
                  {employee.boutique}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onViewHistory(employee)}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          title="Voir l'historique"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.totalVentes !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              Ventes
            </div>
            <div className="text-lg font-bold text-gray-800">
              {stats.totalVentes}
            </div>
          </div>
        )}

        {stats.montantTotal !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              Chiffre
            </div>
            <div className="text-lg font-bold text-emerald-600">
              {formatFCFA(stats.montantTotal)}
            </div>
          </div>
        )}

        {stats.tauxReussite !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Réussite
            </div>
            <div className="text-lg font-bold text-indigo-600">
              {stats.tauxReussite}%
            </div>
          </div>
        )}

        {stats.actionsTotal !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Actions
            </div>
            <div className="text-lg font-bold text-gray-800">
              {stats.actionsTotal}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span>ID: {employee.id}</span>
          <span>Créé le: {employee.createdAt}</span>
        </div>
        <div className="flex items-center gap-2">
          {employee.lastActivity && (
            <span className="text-emerald-600">
              Dernière activité: {employee.lastActivity}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
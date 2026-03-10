import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Target,
  Clock,
  CheckCircle,   // ← AJOUT ICI
} from "lucide-react";


const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function RoleStats({ role, stats = {} }) {
  const getRoleConfig = (roleName) => {
    const configs = {
      vendeur: {
        color: "emerald",
        icon: ShoppingCart,
        title: "Performances commerciales",
        metrics: [
          { key: "totalVentes", label: "Ventes totales", icon: ShoppingCart },
          { key: "montantTotal", label: "Chiffre d'affaires", icon: DollarSign, isCurrency: true },
          { key: "ticketMoyen", label: "Ticket moyen", icon: Target, isCurrency: true },
          { key: "tauxReussite", label: "Taux de réussite", icon: TrendingUp, isPercent: true },
        ],
      },
      caissier: {
        color: "amber",
        icon: DollarSign,
        title: "Performances caisse",
        metrics: [
          { key: "encaissements", label: "Encaissements", icon: TrendingUp, isCurrency: true },
          { key: "decaissements", label: "Décaissements", icon: TrendingDown, isCurrency: true },
          { key: "fluxNet", label: "Flux net", icon: BarChart3, isCurrency: true },
          { key: "operations", label: "Opérations", icon: Clock },
        ],
      },
      gestionnaire_boutique: {
        color: "blue",
        icon: Package,
        title: "Gestion stock boutique",
        metrics: [
          { key: "reapprovisionnements", label: "Réapprovisionnements", icon: Package },
          { key: "inventaires", label: "Inventaires", icon: FileText },
          { key: "alertes", label: "Alertes stock", icon: TrendingDown },
          { key: "tauxRemplissage", label: "Taux remplissage", icon: TrendingUp, isPercent: true },
        ],
      },
      gestionnaire_depot: {
        color: "purple",
        icon: Package,
        title: "Gestion dépôt",
        metrics: [
          { key: "transferts", label: "Transferts", icon: Package },
          { key: "inventaires", label: "Inventaires", icon: FileText },
          { key: "receptions", label: "Réceptions", icon: TrendingUp },
          { key: "expeditions", label: "Expéditions", icon: TrendingDown },
        ],
      },
      comptable: {
        color: "indigo",
        icon: FileText,
        title: "Suivi comptable",
        metrics: [
          { key: "rapports", label: "Rapports générés", icon: FileText },
          { key: "audits", label: "Audits réalisés", icon: BarChart3 },
          { key: "validations", label: "Validations", icon: CheckCircle },
          { key: "budgets", label: "Budgets gérés", icon: DollarSign },
        ],
      },
    };
    return configs[roleName] || configs.vendeur;
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[config.color].split(' ')[0]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{config.title}</h3>
            <p className="text-sm text-gray-500">
              Statistiques globales pour ce rôle
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Données mises à jour quotidiennement
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {config.metrics.map((metric) => {
          const value = stats[metric.key] || 0;
          const displayValue = metric.isCurrency
            ? formatFCFA(value)
            : metric.isPercent
            ? `${value}%`
            : value;

          return (
            <div key={metric.key} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${colorClasses[config.color].split(' ')[0]}`}>
                  <metric.icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-gray-500">{metric.label}</div>
              </div>
              <div className={`text-2xl font-bold ${
                metric.key.includes("taux") || metric.key.includes("reussite")
                  ? "text-emerald-600"
                  : "text-gray-800"
              }`}>
                {displayValue}
              </div>
              {/* Indicateur de tendance (simulé) */}
              <div className="flex items-center gap-1 mt-2">
                {Math.random() > 0.5 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">
                      +{Math.floor(Math.random() * 15)}% vs mois dernier
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-600">
                      -{Math.floor(Math.random() * 10)}% vs mois dernier
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Performance positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Performance normale</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Attention requise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
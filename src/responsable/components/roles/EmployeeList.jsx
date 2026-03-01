import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  Users,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
} from "lucide-react";
import EmployeeCard from "./EmployeeCard";

export default function EmployeeList({
  employees = [],
  role,
  title = "Employés",
  onViewHistory,
  loading = false,
  filters = {},
  onFilterChange = () => {},
}) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({});

  // Filtrage avancé
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Recherche textuelle
      if (search && !emp.name?.toLowerCase().includes(search.toLowerCase()) &&
          !emp.email?.toLowerCase().includes(search.toLowerCase()) &&
          !emp.id?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Filtres personnalisés
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && value !== "tous" && emp[key] !== value) {
          return false;
        }
      }

      return true;
    });
  }, [employees, search, activeFilters]);

  // Options de filtre basées sur les données
  const filterOptions = useMemo(() => {
    const options = {};
    
    if (employees.length > 0) {
      // Boutique (si disponible)
      const boutiques = [...new Set(employees.map(e => e.boutique).filter(Boolean))];
      if (boutiques.length > 0) {
        options.boutique = {
          label: "Boutique",
          options: ["tous", ...boutiques],
        };
      }

      // Statut
      const statuses = [...new Set(employees.map(e => e.status).filter(Boolean))];
      if (statuses.length > 0) {
        options.status = {
          label: "Statut",
          options: ["tous", ...statuses],
        };
      }

      // Dépôt (pour gestionnaires dépôt)
      const depots = [...new Set(employees.map(e => e.depot).filter(Boolean))];
      if (depots.length > 0) {
        options.depot = {
          label: "Dépôt",
          options: ["tous", ...depots],
        };
      }
    }

    return options;
  }, [employees]);

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value === "tous" ? "" : value,
    }));
  };

  const resetFilters = () => {
    setSearch("");
    setActiveFilters({});
  };

  const hasActiveFilters = search || Object.values(activeFilters).some(v => v);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-gray-500">Chargement des employés...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec compteurs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">
            {employees.length} employé{employees.length > 1 ? "s" : ""} • 
            {filteredEmployees.length} affiché{filteredEmployees.length > 1 ? "s" : ""}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Rechercher un ${role}...`}
              className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtres rapides */}
          {Object.keys(filterOptions).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(filterOptions).map(([key, config]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {config.label}
                  </label>
                  <select
                    value={activeFilters[key] || "tous"}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
                  >
                    {config.options.map(option => (
                      <option key={option} value={option}>
                        {option === "tous" ? `Tous ${config.label.toLowerCase()}` : option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Liste des employés */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              role={role}
              onViewHistory={() => onViewHistory?.(employee)}
              stats={employee.stats || {}}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Aucun employé trouvé
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters
              ? "Aucun employé ne correspond à vos critères de recherche."
              : `Aucun ${role} n'est enregistré pour le moment.`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
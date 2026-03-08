// src/responsable/components/HistoriqueEncaissements.jsx
import React from "react";
import {
  Receipt,
  Calendar,
  User,
  CreditCard,
  Smartphone,
  Search,
  X,
  BanknoteArrowDown,
  WalletCards
} from "lucide-react";
import { formatFCFA } from "@/utils/formatUtils";

// === SOUS-COMPOSANTS ===

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-violet-500 rounded-full border-t-transparent animate-spin" />
    </div>
    <p className="mt-4 text-sm text-gray-500">Chargement des encaissements...</p>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="p-3 bg-gray-100 rounded-full mb-3">
      <Receipt className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-sm font-medium text-gray-700 mb-1">
      Aucun encaissement trouvé
    </p>
    <p className="text-xs text-gray-500 text-center max-w-[200px]">
      Aucun encaissement pour ce client
    </p>
  </div>
);

const FilterTabs = ({ filterType, onFilterTypeChange }) => {
  const filters = [
    { id: "tous", label: "Tous" },
    { id: "especes", label: "Espèces", icon: BanknoteArrowDown },
    { id: "carte", label: "Carte bancaire", icon: CreditCard },
    { id: "wave", label: "Wave", icon: Smartphone },
    { id: "orange", label: "Orange Money", icon: Smartphone },
    { id: "cheque", label: "Chèque", icon: WalletCards },
    { id: "autre", label: "Autre", icon: CreditCard },
  ];
  
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs flex-shrink-0">
      {filters.map((filter) => {
        const Icon = filter.icon || Receipt;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterTypeChange(filter.id)}
            className={`px-2.5 py-1.5 rounded-lg transition font-medium whitespace-nowrap text-[11px] flex items-center gap-1
              ${
                filterType === filter.id
                  ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

const SearchBar = ({ searchInput, onSearchChange }) => (
  <div className="relative w-full sm:w-48">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
    <input
      type="text"
      value={searchInput}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 shadow-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] placeholder:text-gray-400"
      placeholder="N° commande..."
    />
    {searchInput && (
      <button
        type="button"
        onClick={() => onSearchChange("")}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const getModeIcon = (mode) => {
  const m = (mode || "").toLowerCase();
  if (m.includes("espece")) return <BanknoteArrowDown className="w-4 h-4 text-emerald-600" />;
  if (m.includes("carte")) return <CreditCard className="w-4 h-4 text-blue-600" />;
  if (m.includes("wave")) return <Smartphone className="w-4 h-4 text-orange-600" />;
  if (m.includes("orange")) return <Smartphone className="w-4 h-4 text-orange-600" />;
  if (m.includes("cheque")) return <WalletCards className="w-4 h-4 text-purple-600" />;
  return <CreditCard className="w-4 h-4 text-gray-600" />;
};

// === COMPOSANT PRINCIPAL ===
export default function HistoriqueEncaissements({
  encaissements = [],
  loading = false,
  filterType = "tous",
  onFilterTypeChange,
  searchInput = "",
  onSearchChange,
  dateDebut = "",
  dateFin = "",
  setDateDebut,
  setDateFin,
}) {
  if (loading) return <LoadingState />;

  // Trier par date récente
  const encaissementsTries = [...encaissements].sort((a, b) => 
    (b.date || "").localeCompare(a.date || "")
  );

  // Filtrer
  const encaissementsFiltres = encaissementsTries.filter(p => {
    // Filtre recherche (numéro commande)
    if (searchInput) {
      const numero = String(p.commande?.numero || "").toLowerCase();
      if (!numero.includes(searchInput.toLowerCase())) return false;
    }

    // Filtre dates - version robuste avec conversion Date
    if (dateDebut && p.date && new Date(p.date) < new Date(dateDebut)) return false;
    if (dateFin && p.date && new Date(p.date) > new Date(dateFin + "T23:59:59")) return false;

    // Filtre mode
    const mode = (p.type_paiement || "").toLowerCase();
    if (filterType === "especes" && !mode.includes("espece")) return false;
    if (filterType === "carte" && !mode.includes("carte")) return false;
    if (filterType === "wave" && !mode.includes("wave")) return false;
    if (filterType === "orange" && !mode.includes("orange")) return false;
    if (filterType === "cheque" && !mode.includes("cheque")) return false;
    if (filterType === "autre") {
      const modesConnus = ["espece", "carte", "wave", "orange", "cheque"];
      if (modesConnus.some(m => mode.includes(m))) return false;
    }

    return true;
  });

  if (encaissementsFiltres.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 w-full">
          <div className="w-full overflow-x-auto pb-1">
            <FilterTabs filterType={filterType} onFilterTypeChange={onFilterTypeChange} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-xs">
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut?.(e.target.value)} className="px-2 py-1 border rounded-lg w-32" />
              <span>→</span>
              <input type="date" value={dateFin} onChange={(e) => setDateFin?.(e.target.value)} className="px-2 py-1 border rounded-lg w-32" />
            </div>
            <SearchBar searchInput={searchInput} onSearchChange={onSearchChange} />
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col gap-3">
        <FilterTabs filterType={filterType} onFilterTypeChange={onFilterTypeChange} />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 text-xs">
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut?.(e.target.value)} className="px-2 py-1 border rounded-lg w-32" />
            <span>→</span>
            <input type="date" value={dateFin} onChange={(e) => setDateFin?.(e.target.value)} className="px-2 py-1 border rounded-lg w-32" />
          </div>
          <SearchBar searchInput={searchInput} onSearchChange={onSearchChange} />
        </div>
      </div>

      {/* Liste des encaissements */}
      <div className="space-y-2">
        {encaissementsFiltres.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50/50">
            <div className="flex items-center justify-between">
              {/* Quand + Quoi */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {p.date ? p.date.slice(0, 16).replace('T', ' ') : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-[#472EAD]">
                    N° {p.commande?.numero || "—"}
                  </span>
                </div>
              </div>

              {/* Montant */}
              <div className="text-sm font-bold text-gray-900">
                {formatFCFA(p.montant)}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              {/* Qui + Comment */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{p.caissier ? `${p.caissier.nom ?? ""} ${p.caissier.prenom ?? ""}` : "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getModeIcon(p.type_paiement)}
                  <span className="text-xs text-gray-600">{p.type_paiement || "—"}</span>
                </div>
              </div>

              {/* TTC / Reste */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-gray-500">
                  TTC: {formatFCFA(p.commande?.total || 0)}
                </span>
                <span className={(p.commande?.reste || 0) > 0 ? "text-rose-600" : "text-emerald-600"}>
                  Reste: {formatFCFA(p.commande?.reste || 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total - version robuste avec Number() */}
      <div className="text-xs text-gray-500 text-right pt-2">
        {encaissementsFiltres.length} encaissement(s) · Total {formatFCFA(
          encaissementsFiltres.reduce((s, p) => s + Number(p.montant || 0), 0)
        )}
      </div>
    </div>
  );
}
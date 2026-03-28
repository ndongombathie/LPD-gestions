// src/responsable/components/HistoriqueCommandes.jsx
import React, { useState } from "react";
import { 
  BadgeDollarSign,
  Package,
  Calendar,
  Receipt,
  CreditCard,
  Search,
  X,
  Eye
} from "lucide-react";
import { formatFCFA, getCommandeStatusClasses } from "@/utils/formatUtils";
import FactureModal from "./FactureModal";

// === SOUS-COMPOSANTS ===

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-violet-500 rounded-full border-t-transparent animate-spin" />
    </div>
    <p className="mt-4 text-sm text-gray-500">Chargement des commandes...</p>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="p-3 bg-gray-100 rounded-full mb-3">
      <Package className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-sm font-medium text-gray-700 mb-1">
      Aucune commande trouvée
    </p>
    <p className="text-xs text-gray-500 text-center max-w-[200px]">
      Ce client n'a pas encore de commande ou aucun résultat ne correspond à votre recherche
    </p>
  </div>
);

const FilterTabs = ({ statutCmd, onStatutChange }) => {
  const filters = [
    { id: "tous", label: "Toutes" },
    { id: "payee", label: "Payées" },
    { id: "partiellement_payee", label: "Partiellement payées" },
    { id: "attente", label: "En attente" },
  ];
  
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs flex-shrink-0">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onStatutChange(filter.id)}
          className={`px-2.5 py-1.5 rounded-lg transition font-medium whitespace-nowrap text-[11px]
            ${
              statutCmd === filter.id
                ? "bg-white text-[#472EAD] font-semibold shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

const SearchBar = ({ searchInput, onSearchChange }) => (
  <div className="relative w-full sm:w-56">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
    <input
      type="text"
      value={searchInput}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 shadow-sm focus:outline-none focus:border-[#472EAD] focus:ring-1 focus:ring-[#472EAD] placeholder:text-gray-400"
      placeholder="ID, n° ou scan ticket"
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

const CommandeCard = ({ commande, onVoirDetail }) => {
  const paiements = commande.paiements || [];
  const lignes = commande.lignes || [];
  
  // CORRECTION 4: Compteur de paiements corrigé
const nbPaiements = commande.paiements?.length ?? 0;
  
  const tranchesEnAttente = paiements.filter((p) => {
    const type = p.type_paiement;
    const statut = String(p?.statut_paiement || "").toLowerCase();
    return type === "tranche" && statut === "en_attente_caisse" && p.montant;
  });

  const statutClasses = getCommandeStatusClasses(commande.statut);
  const statutLabel = commande.statutLabel || commande.statut;

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header de la carte (toujours visible) */}
      <div className="px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors duration-150">
        <div className="flex items-start justify-between gap-4">
          {/* Info gauche */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <BadgeDollarSign className="w-4 h-4 text-[#472EAD] flex-shrink-0" />
              {/* CORRECTION 2: "Commande" → "N°" */}
              <span className="text-sm font-semibold text-[#2F1F7A] truncate">
                N° {commande.numero}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statutClasses}`}>
                {statutLabel}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {commande.dateCommande || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {lignes.length} produit{lignes.length > 1 ? "s" : ""}
              </span>
                <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                {nbPaiements} paiement(s)
                </span>
            </div>
          </div>

          {/* Infos financières */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-500">Total TTC</div>
              <div className="text-sm font-bold text-gray-900">
                {formatFCFA(commande.totalTTC || 0)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Reste</div>
              <div className={`text-sm font-bold ${(commande.resteAPayer || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {formatFCFA(commande.resteAPayer || 0)}
              </div>
            </div>
            <button
              onClick={() => onVoirDetail(commande)}
              className="p-2 rounded-lg hover:bg-[#F7F5FF] text-[#472EAD]"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges supplémentaires */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* CORRECTION 5: Ajout du || 0 pour éviter undefined */}
          <span className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
            Payé : {formatFCFA(commande.montantPaye || 0)}
          </span>
          {tranchesEnAttente.length > 0 && (
            <span className="text-[11px] px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
              {tranchesEnAttente.length} tranche(s) : {formatFCFA(
                tranchesEnAttente.reduce((s, p) => s + Number(p.montant || 0), 0)
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Précédent
      </button>
      <span className="text-xs text-gray-600 px-2">
        Page {page} sur {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Suivant
      </button>
    </div>
  );
};

// === COMPOSANT PRINCIPAL ===
export default function HistoriqueCommandes({
  commandes = [],
  loading = false,
  totalPages = 1,
  page = 1,
  onPageChange,
  searchInput = "",
  onSearchChange,
  statutCmd = "tous",
  onStatutChange,
  dateDebut = "",
  dateFin = "",
  setDateDebut,
  setDateFin,
}) {
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [openFacture, setOpenFacture] = useState(false);

  // Gestion des états de chargement et vide
  if (loading) {
    return <LoadingState />;
  }

  if (commandes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 w-full">
          {/* STATUT - Pleine largeur sur mobile, ajusté sur desktop */}
          <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex justify-start">
              <FilterTabs
                statutCmd={statutCmd}
                onStatutChange={onStatutChange}
              />
            </div>
          </div>
          
          {/* PERIODE et RECHERCHE - En colonne sur mobile, ligne sur desktop */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
            {/* PERIODE */}
            <div className="flex flex-col text-xs w-full sm:w-auto">
              <span className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Période
              </span>
              <div className="flex flex-col sm:flex-row gap-1 w-full">
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut && setDateDebut(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-full sm:w-32"
                />
                <div className="hidden sm:flex items-center justify-center px-1">→</div>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin && setDateFin(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-full sm:w-32"
                />
              </div>
            </div>

            {/* RECHERCHE */}
            <div className="w-full sm:w-auto sm:flex-1">
              <SearchBar
                searchInput={searchInput}
                onSearchChange={onSearchChange}
              />
            </div>
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col gap-3 w-full">
        {/* STATUT - Pleine largeur sur mobile, ajusté sur desktop */}
        <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex justify-start">
            <FilterTabs
              statutCmd={statutCmd}
              onStatutChange={onStatutChange}
            />
          </div>
        </div>
        
        {/* PERIODE et RECHERCHE - En colonne sur mobile, ligne sur desktop */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
          {/* PERIODE */}
          <div className="flex flex-col text-xs w-full sm:w-auto">
            <span className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Période
            </span>
            <div className="flex flex-col sm:flex-row gap-1 w-full">
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut && setDateDebut(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-full sm:w-32"
              />
              <div className="hidden sm:flex items-center justify-center px-1">→</div>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin && setDateFin(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-full sm:w-32"
              />
            </div>
          </div>

          {/* RECHERCHE */}
          <div className="w-full sm:w-auto sm:flex-1">
            <SearchBar
              searchInput={searchInput}
              onSearchChange={onSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-3">
        {commandes.map((commande) => (
          <CommandeCard
            key={commande.id}
            commande={commande}
            onVoirDetail={(cmd) => {
              setSelectedCommande(cmd);
              setOpenFacture(true);
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* Modal Facture */}
      <FactureModal
        open={openFacture}
        onClose={() => setOpenFacture(false)}
        commande={selectedCommande}
      />
    </div>
  );
}
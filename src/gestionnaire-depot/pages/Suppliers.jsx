// src/gestionnaire-depot/pages/Suppliers.jsx
import React, { useState, useMemo } from "react";
import { useFournisseurs } from "../hooks/useFournisseurs";
import "../styles/depot-fix.css";
import {
  Package, User, Phone, Store, Search as SearchIcon,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Loader, Building2, X
} from "lucide-react";

const generateAvatar = (name) => {
  const initials = name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md"
      style={{
        background: "linear-gradient(135deg, #472EAD, #f97316)",
      }}
    >
      {initials}
    </div>
  );
};

export default function Suppliers() {
  // États locaux pour la pagination (ils sont synchronisés avec le hook)
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Hook avec pagination serveur
  const {
    suppliers,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    goToPage,
  } = useFournisseurs(1, itemsPerPage);

  // Filtrage côté client (sur les données de la page courante)
  const filteredSuppliers = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((s) =>
      [s.name, s.contactName, s.email, s.phone].some((field) =>
        field.toLowerCase().includes(term)
      )
    );
  }, [suppliers, searchInput]);

  // Pour la pagination, on utilise les données du hook
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, total);

  const handleItemsPerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setItemsPerPage(newPerPage);
    // Le hook va recharger avec la nouvelle taille
    goToPage(1); // retour à la première page
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin text-[#472EAD] mx-auto" size={40} />
          <p className="mt-4 text-gray-600 font-medium">Chargement des fournisseurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-lg font-semibold text-gray-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3b2491] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Building2 className="text-[#472EAD]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fournisseurs</h1>
            <p className="text-sm text-gray-500">Gérez vos fournisseurs et leurs coordonnées</p>
          </div>
        </div>

        {/* STAT CARD : Fournisseurs totaux (maintenant via le hook) */}
        <div className="grid grid-cols-1 md:grid-cols-1">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#472EAD] to-[#f97316] rounded-xl shadow-lg">
                <Store className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total fournisseurs</p>
                <p className="text-4xl font-bold text-gray-800">{total}</p>
                <p className="text-xs text-gray-400 mt-1">enregistrés dans la base</p>
              </div>
            </div>
          </div>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, contact, email ou téléphone..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-transparent transition"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                // Pas de changement de page ici car la recherche est côté client
              }}
            />
          </div>
        </div>

        {/* TABLEAU FOURNISSEURS */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50">
            <span className="font-semibold text-gray-700">
              Liste des fournisseurs{" "}
              <span className="ml-1 px-2 py-0.5 bg-[#472EAD] text-white text-xs rounded-full">
                {filteredSuppliers.length} sur cette page
              </span>
            </span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Afficher :</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-transparent bg-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-4">Fournisseur</th>
                <th className="text-left px-6 py-4">Contact</th>
                <th className="text-center px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {generateAvatar(s.name)}
                      <div>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Package size={14} className="text-[#472EAD]" />
                          {s.name}
                        </p>
                        {s.email && (
                          <p className="text-xs text-gray-500">{s.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <User size={14} className="text-[#472EAD]" />
                      {s.contactName || "—"}
                    </p>
                    {s.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} className="text-[#472EAD]" />
                        {s.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedSupplier(s)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#472EAD] bg-[#f0ebff] hover:bg-[#e5d9ff] px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-[#472EAD]"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">
                    Aucun fournisseur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION (utilise les données du hook) */}
          {total > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-xs text-gray-500">
                Affichage de <span className="font-medium text-gray-700">{startIndex}</span> à{" "}
                <span className="font-medium text-gray-700">{endIndex}</span> sur{" "}
                <span className="font-medium text-gray-700">{total}</span> fournisseurs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-[#e5d9ff] hover:text-[#472EAD]"
                  }`}
                >
                  <ChevronsLeft size={18} />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-[#e5d9ff] hover:text-[#472EAD]"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">Page</span>
                  <span className="font-semibold text-[#472EAD]">{currentPage}</span>
                  <span className="text-gray-500">sur</span>
                  <span className="font-semibold text-gray-700">{totalPages}</span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-[#e5d9ff] hover:text-[#472EAD]"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-[#e5d9ff] hover:text-[#472EAD]"
                  }`}
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Aller à :</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) goToPage(page);
                  }}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* MODALE DÉTAILS (inchangée) */}
        {selectedSupplier && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#472EAD] to-[#f97316] px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 size={20} />
                  Détails du fournisseur
                </h3>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</p>
                  <p className="text-lg font-semibold text-gray-800">{selectedSupplier.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</p>
                  <p className="text-lg text-gray-700">{selectedSupplier.contactName || "Non renseigné"}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="px-5 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3b2491] transition-colors shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
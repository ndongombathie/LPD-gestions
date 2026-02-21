// src/gestionnaire-depot/pages/Suppliers.jsx
import React, { useState, useMemo } from "react";
import "../styles/depot-fix.css";
import { 
  Store, User, Phone, Search, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, CheckCircle, XCircle, 
  MapPin, Truck 
} from "lucide-react";
import { useStock } from "./StockContext";

/* =========================================================================
   AVATAR GÉNÉRÉ AUTOMATIQUEMENT
   ========================================================================= */
const generateAvatar = (name) => {
  const initials = name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
      style={{
        background: "linear-gradient(135deg, #472EAD, #f97316)",
      }}
    >
      {initials}
    </div>
  );
};

/* =========================================================================
   PAGE PRINCIPALE
   ========================================================================= */
export default function Suppliers() {
  const { fournisseurs: contextFournisseurs } = useStock(); // plus de loading
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Formatage des fournisseurs
  const suppliers = useMemo(() => {
    return contextFournisseurs.map((item) => ({
      id: item.id,
      name: item.name || item.nom || "Nom inconnu",
      email: item.email || "",
      contact: item.contactName || item.contact || "",
      phone: item.phone || "",
      status: item.status || "Actif",
      address: item.address || "",
      city: item.city || "",
    }));
  }, [contextFournisseurs]);

  // Statistiques
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "Actif").length;

  // Recherche
  const filteredSuppliers = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(term) ||
        s.contact.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.phone.toLowerCase().includes(term)
      );
    });
  }, [suppliers, searchInput]);

  // Pagination
  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Plus de vérification de chargement – la page s'affiche directement

  return (
    <div className="depot-page space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-[#472EAD]" size={28} />
            Gestion des Fournisseurs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez et gérez vos partenaires
          </p>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Truck className="text-[#472EAD]" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total fournisseurs</p>
            <p className="text-2xl font-bold text-gray-900">{totalSuppliers}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Fournisseurs actifs</p>
            <p className="text-2xl font-bold text-gray-900">{activeSuppliers}</p>
          </div>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fournisseur, contact, email..."
            className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#472EAD] focus:border-transparent"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* GRILLE DES FOURNISSEURS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 cursor-pointer"
            onClick={() => setSelectedSupplier(supplier)}
          >
            <div className="flex items-start gap-3">
              {generateAvatar(supplier.name)}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{supplier.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <User size={12} />
                  <span className="truncate">{supplier.contact || "Contact non spécifié"}</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Phone size={12} />
                  <span>{supplier.phone || "—"}</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                supplier.status === "Actif" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
              }`}>
                {supplier.status === "Actif" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {supplier.status}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSupplier(supplier);
                }}
                className="text-xs text-[#472EAD] hover:underline"
              >
                Détails
              </button>
            </div>
          </div>
        ))}
        {currentSuppliers.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400">
            Aucun fournisseur trouvé.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border">
          <div className="text-xs text-gray-500">
            Affichage de {startIndex + 1} à {endIndex} sur {totalItems} fournisseurs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronsLeft size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-700">
              Page <span className="font-semibold text-[#472EAD]">{safeCurrentPage}</span> sur {totalPages}
            </span>
            <button
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronsRight size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Afficher :</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
            >
              <option value="4">4</option>
              <option value="8">8</option>
              <option value="12">12</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      )}

      {/* MODALE DÉTAILS */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-[#472EAD] to-[#f97316] px-6 py-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Store size={22} />
                  Détails du fournisseur
                </h3>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {generateAvatar(selectedSupplier.name)}
                <div>
                  <p className="text-xl font-semibold text-gray-800">{selectedSupplier.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <User size={18} className="text-[#472EAD]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Personne de contact</p>
                    <p className="font-medium text-gray-800">{selectedSupplier.contact || "Non renseigné"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <MapPin size={18} className="text-[#f97316]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="font-medium text-gray-800">
                      {selectedSupplier.address 
                        ? `${selectedSupplier.address}${selectedSupplier.city ? `, ${selectedSupplier.city}` : ''}` 
                        : "Non renseignée"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`p-2 rounded-full ${selectedSupplier.status === "Actif" ? "bg-green-100" : "bg-gray-200"}`}>
                    {selectedSupplier.status === "Actif" ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <XCircle size={18} className="text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Statut</p>
                    <p className={`font-medium ${selectedSupplier.status === "Actif" ? "text-green-600" : "text-gray-600"}`}>
                      {selectedSupplier.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-5 py-2 bg-gradient-to-r from-[#472EAD] to-[#f97316] text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
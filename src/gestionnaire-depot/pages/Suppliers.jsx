// src/gestionnaire-depot/pages/Suppliers.jsx
import React, { useState, useMemo } from "react";
// MODIFICATION: on garde l'import de l'API pour d'éventuelles actions futures, mais on ne l'utilise pas dans ce fichier
// import { fournisseursAPI } from "../../services/api/fournisseurs";
import "../styles/depot-fix.css";
import { 
  Package, User, Phone, Store, Search as SearchIcon, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Loader 
} from "lucide-react";

// MODIFICATION: import du contexte
import { useStock } from "./StockContext";

/* =========================================================================
   AVATAR GÉNÉRÉ AUTOMATIQUEMENT (inchangé)
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
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
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
  // MODIFICATION: récupération des fournisseurs depuis le contexte
  const { fournisseurs: contextFournisseurs, loading: contextLoading } = useStock();

  // MODIFICATION: plus d'états pour fournisseurs, loading, error
  // On garde un état d'erreur local pour les actions futures (optionnel)
  const [localError, setLocalError] = useState(null);

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // champ recherche direct
  const [searchInput, setSearchInput] = useState("");

  // modale détails
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // -----------------------------------------------------------------------
  // 1. FORMATAGE DES DONNÉES DES FOURNISSEURS (à partir du contexte)
  // -----------------------------------------------------------------------
  const suppliers = useMemo(() => {
    // On applique le même mapping que dans le code original
    return contextFournisseurs.map((item) => ({
      id: item.id,
      name: item.name || item.nom || "Nom inconnu",
      email: item.email || "",
      contact: item.contactName || item.contact || "",
      phone: item.phone || "",
      products: item.products || item.produits || "",
      delay: item.deliveryDelay || item.delai || "",
      orders: item.ordersCount ? `${item.ordersCount} commandes` : "0 commande",
      status: item.status || "Actif",
    }));
  }, [contextFournisseurs]);

  // -----------------------------------------------------------------------
  // 2. CALCUL DES STATISTIQUES DYNAMIQUES
  // -----------------------------------------------------------------------
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "Actif").length;
  
  const totalOrders = suppliers.reduce((acc, s) => {
    const match = s.orders.match(/(\d+)/);
    const num = match ? parseInt(match[0], 10) : 0;
    return acc + num;
  }, 0);

  const lastUpdate = new Date().toLocaleDateString("fr-FR");

  // -----------------------------------------------------------------------
  // 3. RECHERCHE, PAGINATION (inchangé)
  // -----------------------------------------------------------------------
  const filteredSuppliers = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return suppliers;

    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(term) ||
        s.contact.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.phone.toLowerCase().includes(term) ||
        s.products.toLowerCase().includes(term)
      );
    });
  }, [suppliers, searchInput]);

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

  // -----------------------------------------------------------------------
  // 4. RENDU AVEC GESTION DU CHARGEMENT ET DES ERREURS
  // -----------------------------------------------------------------------
  if (contextLoading) {
    return (
      <div className="depot-page flex items-center justify-center h-64">
        <Loader className="animate-spin text-[#472EAD]" size={32} />
        <p className="ml-3 text-gray-600">Chargement des fournisseurs...</p>
      </div>
    );
  }

  // Gestion d'erreur locale (si jamais on a besoin d'afficher une erreur liée à une action)
  if (localError) {
    return (
      <div className="depot-page flex flex-col items-center justify-center h-64 text-red-600">
        <p className="text-lg font-semibold">❌ {localError}</p>
        <button
          onClick={() => setLocalError(null)}
          className="mt-4 px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3b2491]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="depot-page space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Store className="text-[#472EAD]" />
          Gestion des Fournisseurs
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gérer la liste des fournisseurs, leurs contacts et informations de livraison.
        </p>
      </div>

      {/* STAT CARDS DYNAMIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Fournisseurs</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalSuppliers}</p>
          <p className="text-xs text-gray-500">totaux</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Actifs</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeSuppliers}</p>
          <p className="text-xs text-gray-500">actifs</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Commandes totales</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</p>
          <p className="text-xs text-gray-500">commandes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Dernière maj</p>
          <p className="text-sm font-semibold text-gray-800 mt-2">{lastUpdate}</p>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fournisseur, contact, email, téléphone..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* TABLEAU FOURNISSEURS */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold text-gray-700 flex justify-between items-center">
          <span>Liste des Fournisseurs ({filteredSuppliers.length})</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Afficher :</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-gray-500">éléments</span>
          </div>
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Fournisseur</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Produits</th>
              <th className="text-center px-4 py-3">Délai</th>
              <th className="text-center px-4 py-3">Commandes</th>
              <th className="text-center px-4 py-3">Statut</th>
              <th className="text-center px-4 py-3">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currentSuppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {generateAvatar(s.name)}
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Package size={14} className="text-gray-400" />
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 flex items-center gap-1">
                    <User size={14} className="text-gray-400" />
                    {s.contact}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone size={12} className="text-gray-400" />
                    {s.phone}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{s.products}</td>
                <td className="px-4 py-3 text-center text-xs text-green-600">{s.delay}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-700">{s.orders}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedSupplier(s)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
            {currentSuppliers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400 italic">
                  Aucun fournisseur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {totalItems > 0 && (
          <div className="border-t px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-gray-500">
              Affichage de {startIndex + 1} à {endIndex} sur {totalItems} fournisseurs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={safeCurrentPage === 1}
                className={`p-1 rounded-md ${safeCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className={`p-1 rounded-md ${safeCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-700">Page</span>
                <span className="font-semibold text-[#472EAD]">{safeCurrentPage}</span>
                <span className="text-gray-700">sur</span>
                <span className="font-semibold">{totalPages}</span>
              </div>
              <button
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className={`p-1 rounded-md ${safeCurrentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className={`p-1 rounded-md ${safeCurrentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Aller à :</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={safeCurrentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) goToPage(page);
                }}
                className="w-12 border rounded-md px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
              />
            </div>
          </div>
        )}
      </div>

      {/* MODALE DETAILS */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="text-[#472EAD]" />
                Détails du Fournisseur
              </h3>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-xl text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong>Nom :</strong> {selectedSupplier.name}</p>
              <p><strong>Email :</strong> {selectedSupplier.email}</p>
              <p><strong>Contact :</strong> {selectedSupplier.contact}</p>
              <p><strong>Téléphone :</strong> {selectedSupplier.phone}</p>
              <p><strong>Produits :</strong> {selectedSupplier.products}</p>
              <p><strong>Délai :</strong> {selectedSupplier.delay}</p>
              <p><strong>Commandes :</strong> {selectedSupplier.orders}</p>
              <p>
                <strong>Statut :</strong>{" "}
                <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs">
                  {selectedSupplier.status}
                </span>
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3b2491]"
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
// src/gestionnaire-depot/pages/Suppliers.jsx
import React, { useMemo, useState } from "react";
import { Package, User, Phone, Store, Search as SearchIcon } from "lucide-react";

/* =========================================================================
   DONNÉES DE DÉPART
   ========================================================================= */
const suppliersData = [
  {
    id: 1,
    name: "Papeterie Plus",
    email: "contact@papeterieplus.sn",
    contact: "M. Abdoulaye Diop",
    phone: "+221 33 824 45 67",
    products: "Cahiers, Stylos, Classeurs",
    delay: "2 à 3 jours",
    orders: "24 commandes",
    status: "Actif",
  },
  {
    id: 2,
    name: "Papeterie Moderne",
    email: "info@papeteriemoderne.sn",
    contact: "Mme Aïcha Sow",
    phone: "+221 33 822 89 10",
    products: "Ramettes A4, Enveloppes, Chemises",
    delay: "1-2 jours",
    orders: "18 commandes",
    status: "Actif",
  },
];

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
  const [suppliers] = useState(suppliersData);

  // champ recherche direct
  const [searchInput, setSearchInput] = useState("");

  // modale détails
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  /* =========================================================================
     RECHERCHE AUTOMATIQUE (LIVE SEARCH)
     ========================================================================= */
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

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Store className="text-[#472EAD]" />
          Gestion des Fournisseurs
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gérer la liste des fournisseurs, leurs contacts et informations de
          livraison.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Fournisseurs</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {suppliers.length}
          </p>
          <p className="text-xs text-gray-500">totaux</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Actifs</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {suppliers.filter((s) => s.status === "Actif").length}
          </p>
          <p className="text-xs text-gray-500">actifs</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Commandes totales</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">42</p>
          <p className="text-xs text-gray-500">commandes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Dernière maj</p>
          <p className="text-sm font-semibold text-gray-800 mt-2">
            04/12/2025
          </p>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un fournisseur, contact, email, téléphone..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#472EAD]"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* TABLEAU FOURNISSEURS */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
          Liste des Fournisseurs ({filteredSuppliers.length})
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
            {filteredSuppliers.map((s) => (
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

            {filteredSuppliers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-gray-400 italic"
                >
                  Aucun fournisseur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

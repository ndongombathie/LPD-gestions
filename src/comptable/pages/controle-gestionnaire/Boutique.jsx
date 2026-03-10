// ==========================================================
// 🏪 Boutique.jsx — VERSION SIMPLE SANS IMPRESSION
// Regroupement + Recherche globale
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, AlertTriangle, CheckCircle } from "lucide-react";
import boutiqueAPI from "@/services/api/boutique";
import useDebouncedValue from "@/hooks/useDebouncedValue";

const PER_PAGE = 25;

/* ================= FORMAT PRIX ================= */
const formatFCFA = (v) =>
  `${Number(v ?? 0).toLocaleString("fr-FR").replace(/\s/g, ".")} FCFA`;

/* ================= ÉTAT STOCK ================= */
const getEtat = (quantite, seuil) => {
  if (quantite === 0) return "rupture";
  if (quantite <= seuil) return "faible";
  return "ok";
};

export default function Boutique() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  
  // État pour la fiche sélectionnée
  const [selectedProduit, setSelectedProduit] = useState(null);

  /* ================= FETCH PAGINÉ ================= */
  const fetchPaginated = useCallback(async () => {
    try {
      setLoading(true);

      const res = await boutiqueAPI.getProduitsControle({
        page,
        per_page: PER_PAGE,
        search: debouncedSearchTerm,
      });

      setRows(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch {
      setError("Erreur lors du chargement des produits boutique");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    fetchPaginated();
  }, [fetchPaginated]);

  /* ================= NORMALISATION + REGROUPEMENT ================= */
  const normalizeAndGroup = (data) => {
    const map = new Map();

    data.forEach((row) => {
      const produit = row.produit ?? {};
      
      // Utilisation de l'ID du produit comme clé pour le regroupement
      // (plus fiable que nom + catégorie_id)
      const key = produit.id || `${produit.nom}-${produit.categorie_id}`;

      const quantite = Number(row.quantite ?? 0);
      const seuil = Number(row.seuil ?? 0);
      const nombre_carton = Number(row.nombre_carton ?? 0);
      
      // Récupérer la catégorie depuis produit.categorie (structure JSON correcte)
      const categorie = produit.categorie ?? {};
      const nom_categorie = categorie.nom ?? "Non catégorisé";

      if (!map.has(key)) {
        map.set(key, {
          id: produit.id ?? key,
          nom: produit.nom ?? "—",
          categorie_id: produit.categorie_id,
          categorie_nom: nom_categorie,
          prix_achat: produit.prix_achat ?? 0,
          nombre_carton,
          quantite,
          seuil,
          // Informations supplémentaires pour la fiche
          description: produit.description ?? "Aucune description",
          code_barre: produit.code_barre ?? "N/A",
          date_creation: produit.created_at ?? null,
          date_modification: produit.updated_at ?? null,
          fournisseur: produit.fournisseur?.nom ?? "Non spécifié"
        });
      } else {
        const existing = map.get(key);
        existing.nombre_carton += nombre_carton;
        existing.quantite += quantite;
      }
    });

    return Array.from(map.values());
  };

  const pageData = useMemo(() => normalizeAndGroup(rows), [rows]);

  /* ================= RECHERCHE GLOBALE ================= */
  // Désormais gérée par l'API, pageData contient déjà les bons résultats
  const filteredData = pageData;


  // Fonction pour afficher la fiche produit
  const afficherFiche = (produit) => {
    setSelectedProduit(produit);
  };

  // Fonction pour fermer la fiche
  const fermerFiche = () => {
    setSelectedProduit(null);
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Boutique
      </h1>

      {/* RECHERCHE SEULEMENT (sans bouton d'impression) */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-[#472EAD]" />
          <input
            className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm"
            placeholder="Rechercher un produit ou une catégorie dans toute la boutique…"
            value={searchTerm}
            onChange={(e) => {
              setPage(1);
              setSearchTerm(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABLE */}
        <div className={`${selectedProduit ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl shadow-md p-4 overflow-x-auto`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              Affichage page {pagination?.currentPage || 1} / {pagination?.lastPage || 1}
              {searchTerm && " - Résultats filtrés"}
            </span>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#F5F3FF] text-[#472EAD]">
              <tr>
                <th className="px-4 py-2 text-left">Produit</th>
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-4 py-2 text-center">Prix Achat</th>
                <th className="px-4 py-2 text-center">Cartons</th>
                <th className="px-4 py-2 text-center">Seuil</th>
                <th className="px-4 py-2 text-center">État</th>
                <th className="px-4 py-2 text-center">Fiche</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((p) => {
                const etat = getEtat(p.quantite, p.seuil);

                return (
                  <tr key={p.id} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-2 font-medium">{p.nom}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {p.categorie_nom}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{formatFCFA(p.prix_achat)}</td>
                    <td className="px-4 py-2 text-center">{p.nombre_carton}</td>
                    <td className="px-4 py-2 text-center">{p.seuil}</td>
                    <td className="px-4 py-2 text-center">
                      {etat === "rupture" && <AlertTriangle size={16} className="text-red-600 mx-auto" />}
                      {etat === "faible" && <AlertTriangle size={16} className="text-orange-500 mx-auto" />}
                      {etat === "ok" && <CheckCircle size={16} className="text-emerald-600 mx-auto" />}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => afficherFiche(p)}
                        className="px-3 py-1 bg-[#472EAD] text-white rounded-lg text-xs hover:bg-[#5a3bc9] transition-colors"
                      >
                        Voir fiche
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun produit trouvé
            </div>
          )}
        </div>

        {/* FICHE PRODUIT */}
        {selectedProduit && (
          <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-[#472EAD]">
                Fiche Produit
              </h2>
              <button
                onClick={fermerFiche}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* En-tête avec catégorie */}
              <div className="bg-gradient-to-r from-[#472EAD] to-[#5a3bc9] text-white p-4 rounded-xl">
                <h3 className="text-xl font-bold mb-1">{selectedProduit.nom}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-90">Catégorie:</span>
                  <span className="px-3 py-1 bg-white text-[#472EAD] rounded-full text-xs font-semibold">
                    {selectedProduit.categorie_nom}
                  </span>
                </div>
              </div>

              {/* Informations générales */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Informations générales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Code barre:</span>
                    <span className="font-medium">{selectedProduit.code_barre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fournisseur:</span>
                    <span className="font-medium">{selectedProduit.fournisseur}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix d'achat:</span>
                    <span className="font-medium text-[#472EAD]">
                      {formatFCFA(selectedProduit.prix_achat)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Stock</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité:</span>
                    <span className="font-bold text-lg">{selectedProduit.quantite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cartons:</span>
                    <span>{selectedProduit.nombre_carton}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seuil d'alerte:</span>
                    <span>{selectedProduit.seuil}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">État:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${getEtat(selectedProduit.quantite, selectedProduit.seuil) === 'rupture' ? 'bg-red-100 text-red-800' : 
                        getEtat(selectedProduit.quantite, selectedProduit.seuil) === 'faible' ? 'bg-orange-100 text-orange-800' : 
                        'bg-emerald-100 text-emerald-800'}`}>
                      {getEtat(selectedProduit.quantite, selectedProduit.seuil)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Description</h4>
                <p className="text-gray-600 text-sm">
                  {selectedProduit.description}
                </p>
              </div>

              {/* Dates */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-1 text-xs text-gray-500">
                  {selectedProduit.date_creation && (
                    <div className="flex justify-between">
                      <span>Créé le:</span>
                      <span>{new Date(selectedProduit.date_creation).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {selectedProduit.date_modification && (
                    <div className="flex justify-between">
                      <span>Modifié le:</span>
                      <span>{new Date(selectedProduit.date_modification).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-between items-center text-sm bg-white rounded-2xl shadow-md p-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Précédent
          </button>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#472EAD]">
              Page {pagination.currentPage} / {pagination.lastPage}
            </span>
          </div>

          <button
            disabled={page === pagination.lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
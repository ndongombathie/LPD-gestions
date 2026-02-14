// ==========================================================
// 🏭 DepotControle.jsx — VERSION COMPLETE AVEC MOUVEMENTS + PRINT GLOBAL + FOURNISSEUR + SEUIL
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Printer, Eye, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import depotAPI from "@/services/api/depot";

export default function DepotControle() {
  const [produits, setProduits] = useState([]);
  const [allProduits, setAllProduits] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filteredResults, setFilteredResults] = useState([]);

  const [page, setPage] = useState(1);
  const perPage = 15;

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const [mouvements, setMouvements] = useState([]);
  const [loadingMouvements, setLoadingMouvements] = useState(false);

  /* ================= FETCH PRODUITS ================= */

  const fetchPaginated = useCallback(async () => {
    try {
      setLoading(true);
      const res = await depotAPI.getProduitsControle({
        page,
        per_page: perPage,
      });
      setProduits(res.data ?? []);
      setPagination(res.pagination ?? null);
    } catch {
      setError("Erreur lors du chargement des produits dépôt");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchAllProduits = useCallback(async () => {
    try {
      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res = await depotAPI.getProduitsControle({
          page: currentPage,
          per_page: 100,
        });

        const pageData = res.data ?? [];
        allData = [...allData, ...pageData];
        lastPage = res.pagination?.lastPage || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      setAllProduits(allData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchPaginated();
    fetchAllProduits();
  }, [fetchPaginated, fetchAllProduits]);

  /* ================= RECHERCHE ================= */

  const globalGroupedProduits = useMemo(() => {
    const map = new Map();

    allProduits.forEach((p) => {
      const key = `${p.nom}-${p.categorie_id}`;

      if (!map.has(key)) {
        map.set(key, { ...p });
      } else {
        const existing = map.get(key);
        existing.nombre_carton += p.nombre_carton || 0;
      }
    });

    return Array.from(map.values());
  }, [allProduits]);

  useEffect(() => {
    if (search.trim()) {
      setIsSearching(true);
      const filtered = globalGroupedProduits.filter((p) =>
        p.nom?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredResults(filtered);
      setPage(1);
    } else {
      setIsSearching(false);
      setFilteredResults([]);
    }
  }, [search, globalGroupedProduits]);

  const displayedProduits = useMemo(() => {
    if (isSearching) {
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      return filteredResults.slice(startIndex, endIndex);
    }
    return produits;
  }, [isSearching, filteredResults, produits, page]);

  const totalPages = useMemo(() => {
    if (isSearching) {
      return Math.ceil(filteredResults.length / perPage);
    }
    return pagination?.lastPage || 1;
  }, [isSearching, filteredResults.length, pagination?.lastPage]);

  /* ================= FORMAT ================= */

  const formatFCFA = (value) => {
    if (!value) return "0 FCFA";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " FCFA";
  };

  /* ================= IMPRESSION GLOBALE ================= */

  const imprimerGlobal = () => {
  const doc = new jsPDF();
  const now = new Date();

  // ✅ Logo depuis public
  doc.addImage("/lpd-logo.png", "PNG", 14, 10, 30, 30);

  // Titre
  doc.setFontSize(18);
  doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(
    `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
    14,
    45
  );

  autoTable(doc, {
    startY: 55,
    head: [["Produit", "Fournisseur", "Prix Achat", "Cartons", "Seuil"]],
    body: globalGroupedProduits.map((p) => [
      p.nom,
      p.fournisseur_nom || p.fournisseur?.nom || "Non défini",
      formatFCFA(p.prix_achat),
      p.nombre_carton,
      p.stock_seuil || 0,
    ]),
    headStyles: { fillColor: [71, 46, 173] },
    styles: { fontSize: 8 },
  });

  doc.save("Depot_Global_Complet.pdf");
};


  /* ================= MOUVEMENTS ================= */

  const afficherFiche = async (produit) => {
    try {
      setSelectedProduit(produit);
      setLoadingMouvements(true);
      setMouvements([]);

      const res = await depotAPI.getMouvementsProduit(produit.id);
      setMouvements(res.data || []);
    } catch (error) {
      console.error("Erreur chargement mouvements:", error);
    } finally {
      setLoadingMouvements(false);
    }
  };

  const fermerFiche = () => {
    setSelectedProduit(null);
    setMouvements([]);
  };

  /* ================= PAGINATION ================= */

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      if (!isSearching) fetchPaginated();
    }
  };

  if (loading && !produits.length)
    return <p className="p-6">Chargement…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Dépôt
      </h1>

      {/* ===== RECHERCHE + PRINT ===== */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par nom de produit..."
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={imprimerGlobal}
          className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Printer size={16} /> Imprimer Global
        </button>
      </div>

      {/* ===== TABLE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${selectedProduit ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="bg-[#F5F3FF] text-[#472EAD]">
              <tr>
                <th className="p-3 text-left">Produit</th>
                <th className="p-3 text-left">Fournisseur</th>
                <th className="p-3 text-center">Prix Achat</th>
                <th className="p-3 text-center">Cartons</th>
                <th className="p-3 text-center">Seuil</th>
                <th className="p-3 text-center">Fiche</th>
              </tr>
            </thead>
            <tbody>
              {displayedProduits.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 border-b">
                  <td className="p-3 font-medium">{p.nom}</td>
                  <td className="p-3">
                    {p.fournisseur_nom || p.fournisseur?.nom || "Non défini"}
                  </td>
                  <td className="p-3 text-center">{formatFCFA(p.prix_achat)}</td>
                  <td className="p-3 text-center">{p.nombre_carton}</td>
                  <td className="p-3 text-center">{p.stock_seuil || 0}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => afficherFiche(p)}
                      className="p-1.5 bg-[#472EAD] text-white rounded-lg"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== FICHE ===== */}
        {selectedProduit && (
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#472EAD]">
                Fiche Produit
              </h2>
              <button onClick={fermerFiche}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold">{selectedProduit.nom}</h3>

              <div>
                <strong>Fournisseur:</strong>{" "}
                {selectedProduit.fournisseur_nom ||
                  selectedProduit.fournisseur?.nom ||
                  "Non défini"}
              </div>

              <div>
                <strong>Prix Achat:</strong>{" "}
                {formatFCFA(selectedProduit.prix_achat)}
              </div>

              <div>
                <strong>Seuil:</strong>{" "}
                {selectedProduit.stock_seuil || 0}
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">
                  Mouvements du produit
                </h4>

                {loadingMouvements ? (
                  <p className="text-sm text-gray-500">
                    Chargement des mouvements...
                  </p>
                ) : mouvements.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucun mouvement enregistré
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                    {mouvements.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2 rounded border ${
                          m.type === "entree"
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="font-medium">
                          {m.type === "entree"
                            ? "Entrée"
                            : "Sortie"}{" "}
                          — {m.quantite}
                        </div>
                        <div className="text-gray-500">
                          {m.source} → {m.destination}
                        </div>
                        <div className="text-gray-400">
                          {new Date(m.date).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm bg-white p-4 rounded-xl shadow">
          <button
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            ← Précédent
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

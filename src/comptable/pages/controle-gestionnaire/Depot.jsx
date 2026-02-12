// ==========================================================
// 🏭 DepotControle.jsx — CORRIGÉ avec fournisseur_id SEULEMENT
// ==========================================================

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Printer, AlertTriangle, CheckCircle, Eye, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import depotAPI from "@/services/api/depot";

export default function DepotControle() {
  const [produits, setProduits] = useState([]);
  const [allProduits, setAllProduits] = useState([]);
  const [allPaginatedProduits, setAllPaginatedProduits] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filteredResults, setFilteredResults] = useState([]);
  const [fournisseurs, setFournisseurs] = useState({}); // Cache des fournisseurs
  
  const [page, setPage] = useState(1);
  const perPage = 15;
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);

  // ================= FETCH FOURNISSEURS =================
  const fetchFournisseurs = useCallback(async () => {
    try {
      // Appel API pour récupérer tous les fournisseurs
      const response = await depotAPI.getFournisseurs(); // À adapter selon votre API
      const fournisseursMap = {};
      response.data.forEach(f => {
        fournisseursMap[f.id] = f.nom;
      });
      setFournisseurs(fournisseursMap);
    } catch (error) {
      console.error("Erreur chargement fournisseurs:", error);
    }
  }, []);

  // ================= FETCH PAGINÉ =================
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

  // ================= FETCH TOUS LES PRODUITS =================
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
      return allData;
    } catch (error) {
      console.error("Erreur fetch all produits:", error);
      return [];
    }
  }, []);

  // ================= FETCH TOUTES LES PAGES PAGINÉES =================
  const fetchAllPaginatedProduits = useCallback(async () => {
    try {
      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res = await depotAPI.getProduitsControle({
          page: currentPage,
          per_page: perPage,
        });

        const pageData = res.data ?? [];
        allData = [...allData, ...pageData];
        lastPage = res.pagination?.lastPage || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      setAllPaginatedProduits(allData);
      return allData;
    } catch (error) {
      console.error("Erreur fetch all paginated produits:", error);
      return [];
    }
  }, []);

  // ================= USE EFFECT =================
  useEffect(() => {
    fetchFournisseurs();
    fetchPaginated();
    fetchAllProduits();
    fetchAllPaginatedProduits();
  }, [fetchPaginated, fetchAllProduits, fetchAllPaginatedProduits, fetchFournisseurs]);

  // ================= FONCTION POUR OBTENIR LE NOM DU FOURNISSEUR =================
  const getFournisseurNom = (produit) => {
    // À partir du fournisseur_id
    const fournisseurId = produit.fournisseur_id;
    if (fournisseurId && fournisseurs[fournisseurId]) {
      return fournisseurs[fournisseurId];
    }
    return "Non spécifié";
  };

  // ================= FONCTION POUR OBTENIR LE NOMBRE DE RÉAPPRO =================
  const getNombreReappro = (produit) => {
    // À partir de entree_sortie ou entreees_sorties
    if (produit.entree_sortie?.nombre_fois) {
      return produit.entree_sortie.nombre_fois;
    }
    if (produit.entreees_sorties?.length > 0) {
      // Somme de tous les réapprovisionnements
      return produit.entreees_sorties.reduce((sum, e) => sum + (e.nombre_fois || 0), 0);
    }
    return 0;
  };

  // ================= REGROUPEMENT GLOBAL =================
  const globalGroupedProduits = useMemo(() => {
    const map = new Map();
    
    allProduits.forEach((p) => {
      const key = `${p.nom}-${p.categorie_id}`;
      
      const nomFournisseur = getFournisseurNom(p);
      const nombreReappro = getNombreReappro(p);
      
      if (!map.has(key)) {
        map.set(key, { 
          id: p.id,
          nom: p.nom || "—",
          code: p.code || "N/A",
          nom_fournisseur: nomFournisseur,
          fournisseur_id: p.fournisseur_id,
          categorie_id: p.categorie_id,
          unite_carton: p.unite_carton || 0,
          prix_unite_carton: p.prix_unite_carton || 0,
          prix_achat: p.prix_achat || 0,
          nombre_carton: p.nombre_carton || 0,
          stock_global: p.stock_global || 0,
          stock_seuil: p.stock_seuil || 0,
          nombre_reappro: nombreReappro,
          description: `Produit ${p.nom}`,
          code_barre: p.code || "N/A",
          date_creation: p.created_at || null,
          date_modification: p.updated_at || null
        });
      } else {
        const existing = map.get(key);
        existing.nombre_carton += p.nombre_carton || 0;
        existing.stock_global += p.stock_global || 0;
        existing.nombre_reappro += nombreReappro;
      }
    });
    
    return Array.from(map.values()).map(p => ({
      ...p,
      etat_stock: p.stock_global === 0 
        ? "Rupture" 
        : p.stock_global <= p.stock_seuil 
          ? "Stock faible" 
          : "Disponible"
    }));
  }, [allProduits, fournisseurs]);

  // ================= REGROUPEMENT PAGE =================
  const pageGroupedProduits = useMemo(() => {
    const map = new Map();
    
    produits.forEach((p) => {
      const key = `${p.nom}-${p.categorie_id}`;
      
      const nomFournisseur = getFournisseurNom(p);
      const nombreReappro = getNombreReappro(p);
      
      if (!map.has(key)) {
        map.set(key, { 
          id: p.id,
          nom: p.nom || "—",
          code: p.code || "N/A",
          nom_fournisseur: nomFournisseur,
          fournisseur_id: p.fournisseur_id,
          categorie_id: p.categorie_id,
          unite_carton: p.unite_carton || 0,
          prix_unite_carton: p.prix_unite_carton || 0,
          prix_achat: p.prix_achat || 0,
          nombre_carton: p.nombre_carton || 0,
          stock_global: p.stock_global || 0,
          stock_seuil: p.stock_seuil || 0,
          nombre_reappro: nombreReappro,
          description: `Produit ${p.nom}`,
          code_barre: p.code || "N/A",
          date_creation: p.created_at || null,
          date_modification: p.updated_at || null
        });
      } else {
        const existing = map.get(key);
        existing.nombre_carton += p.nombre_carton || 0;
        existing.stock_global += p.stock_global || 0;
        existing.nombre_reappro += nombreReappro;
      }
    });
    
    return Array.from(map.values()).map(p => ({
      ...p,
      etat_stock: p.stock_global === 0 
        ? "Rupture" 
        : p.stock_global <= p.stock_seuil 
          ? "Stock faible" 
          : "Disponible"
    }));
  }, [produits, fournisseurs]);

  // ================= FILTRE =================
  useEffect(() => {
    if (search.trim()) {
      setIsSearching(true);
      const filtered = globalGroupedProduits.filter((p) =>
        p.nom.toLowerCase().includes(search.toLowerCase()) ||
        p.nom_fournisseur.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredResults(filtered);
      setPage(1);
    } else {
      setIsSearching(false);
      setFilteredResults([]);
    }
  }, [search, globalGroupedProduits]);

  // ================= PRODUITS AFFICHÉS =================
  const displayedProduits = useMemo(() => {
    if (isSearching) {
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      return filteredResults.slice(startIndex, endIndex);
    }
    return pageGroupedProduits;
  }, [isSearching, filteredResults, pageGroupedProduits, page]);

  // ================= TOTAL PAGES =================
  const totalPages = useMemo(() => {
    if (isSearching) {
      return Math.ceil(filteredResults.length / perPage);
    }
    return pagination?.lastPage || 1;
  }, [isSearching, filteredResults.length, pagination?.lastPage]);

  // ================= FORMAT PRIX =================
  const formatFCFA = (value) => {
    if (!value) return "0 FCFA";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " FCFA";
  };

  // ================= PDF PAGE ACTUELLE =================
  const generatePagePDF = (data, filename) => {
    const doc = new jsPDF();
    const now = new Date();

    doc.setFillColor(71, 46, 173);
    doc.roundedRect(14, 10, 180, 24, 3, 3, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 26, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 32, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(
      `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      42
    );
    
    doc.text(`DÉPÔT - Page ${pagination?.currentPage || page} / ${pagination?.lastPage || totalPages}`, 14, 48);

    autoTable(doc, {
      startY: 55,
      head: [[
        "Produit",
        "Code",
        "Fournisseur",
        "Prix Achat",
        "Cartons",
        "Stock",
        "Seuil",
        "État",
        "Réappro"
      ]],
      body: data.map((p) => [
        p.nom,
        p.code,
        p.nom_fournisseur,
        formatFCFA(p.prix_achat),
        p.nombre_carton || 0,
        p.stock_global || 0,
        p.stock_seuil || 0,
        p.etat_stock || "Non défini",
        p.nombre_reappro || 0
      ]),
      headStyles: { fillColor: [71, 46, 173] },
      styles: { fontSize: 8 },
    });

    doc.save(filename);
  };

  // ================= PDF TOUTES LES PAGES =================
  const generateAllPagesPDF = async () => {
    const doc = new jsPDF();
    const now = new Date();
    let currentPage = 1;
    let lastPage = pagination?.lastPage || 1;

    doc.setFillColor(71, 46, 173);
    doc.roundedRect(14, 10, 180, 24, 3, 3, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(26);
    doc.text("LPD", 105, 26, { align: "center" });

    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 32, { align: "center" });

    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(
      `Date impression globale : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      42
    );
    
    doc.text(`DÉPÔT - Total: ${allPaginatedProduits.length} produits sur ${lastPage} pages`, 14, 48);

    for (let pageNum = 1; pageNum <= lastPage; pageNum++) {
      try {
        const res = await depotAPI.getProduitsControle({
          page: pageNum,
          per_page: perPage,
        });

        const pageRows = res.data ?? [];
        
        const pagePrintData = pageRows.map((p) => {
          const nomFournisseur = getFournisseurNom(p);
          const nombreReappro = getNombreReappro(p);
          
          return {
            nom: p.nom || "—",
            code: p.code || "N/A",
            nom_fournisseur: nomFournisseur,
            prix_achat: p.prix_achat || 0,
            nombre_carton: p.nombre_carton || 0,
            stock_global: p.stock_global || 0,
            stock_seuil: p.stock_seuil || 0,
            nombre_reappro: nombreReappro,
            etat_stock: p.stock_global === 0 
              ? "Rupture" 
              : p.stock_global <= p.stock_seuil 
                ? "Stock faible" 
                : "Disponible"
          };
        });

        if (pageNum > 1) {
          doc.addPage();
        }

        doc.setFillColor(71, 46, 173, 0.1);
        doc.setFontSize(10);
        doc.setTextColor(71, 46, 173);
        doc.text(`DÉPÔT - Page ${pageNum} / ${lastPage}`, 14, pageNum === 1 ? 55 : 20);

        autoTable(doc, {
          startY: pageNum === 1 ? 60 : 25,
          head: [[
            "Produit",
            "Code",
            "Fournisseur",
            "Prix Achat",
            "Cartons",
            "Stock",
            "Seuil",
            "État",
            "Réappro"
          ]],
          body: pagePrintData.map((p) => [
            p.nom,
            p.code,
            p.nom_fournisseur,
            formatFCFA(p.prix_achat),
            p.nombre_carton,
            p.stock_global,
            p.stock_seuil,
            p.etat_stock,
            p.nombre_reappro
          ]),
          headStyles: { fillColor: [71, 46, 173] },
          styles: { fontSize: 8 },
          didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
              `LPD - Dépôt - ${now.toLocaleDateString("fr-FR")}`,
              14,
              doc.internal.pageSize.height - 10
            );
          }
        });
      } catch (error) {
        console.error(`Erreur chargement page ${pageNum}:`, error);
      }
    }

    doc.addPage();
    
    doc.setFillColor(71, 46, 173);
    doc.roundedRect(14, 20, 180, 24, 3, 3, "F");
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.text("RÉCAPITULATIF DÉPÔT", 105, 35, { align: "center" });
    
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Total pages: ${lastPage}`, 14, 60);
    doc.text(`Total produits: ${allPaginatedProduits.length}`, 14, 70);
    doc.text(`Date d'impression: ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`, 14, 80);

    const stats = allPaginatedProduits.reduce((acc, p) => {
      const etat = p.stock_global === 0 
        ? "Rupture" 
        : p.stock_global <= p.stock_seuil 
          ? "Stock faible" 
          : "Disponible";
      acc[etat] = (acc[etat] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(10);
    doc.setTextColor(71, 46, 173);
    doc.text("État des stocks:", 14, 100);
    doc.setTextColor(0);
    
    let yPos = 110;
    Object.entries(stats).forEach(([etat, count]) => {
      const pourcentage = ((count / allPaginatedProduits.length) * 100).toFixed(1);
      doc.text(`- ${etat}: ${count} produits (${pourcentage}%)`, 20, yPos);
      yPos += 10;
    });

    doc.save("Controle_Depot_Toutes_Pages.pdf");
  };

  // ================= IMPRESSION PAGE =================
  const imprimerPage = () => {
    generatePagePDF(displayedProduits, "Controle_Depot_Page.pdf");
  };

  // ================= IMPRESSION TOUTES PAGES =================
  const imprimerToutesPages = () => {
    generateAllPagesPDF();
  };

  // ================= IMPRESSION GLOBALE REGROUPÉE =================
  const imprimerGlobalRegroupe = () => {
    generatePagePDF(globalGroupedProduits, "Controle_Depot_Global_Regroupe.pdf");
  };

  // ================= FICHE PRODUIT =================
  const afficherFiche = (produit) => {
    setSelectedProduit(produit);
  };

  const fermerFiche = () => {
    setSelectedProduit(null);
  };

  // ================= GESTION CHANGEMENT PAGE =================
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      if (!isSearching) {
        fetchPaginated();
      }
    }
  };

  // ================= RESET RECHERCHE =================
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (e.target.value === "") {
      setPage(1);
    }
  };

  if (loading && !produits.length && !allProduits.length) 
    return <p className="p-6">Chargement…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[#472EAD]">
        Contrôle Gestionnaire — Dépôt
      </h1>

      {/* FILTRE + ACTIONS */}
      <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <Search size={18} className="text-gray-500" />
          <input
            className="w-full px-3 py-2 bg-gray-50 rounded border focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
            placeholder="Rechercher un produit, fournisseur ou code..."
            value={search}
            onChange={handleSearchChange}
          />
          {isSearching && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {filteredResults.length} résultat(s)
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={imprimerPage}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Printer size={16} /> Page actuelle
          </button>

          <button
            onClick={imprimerToutesPages}
            className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700 transition-colors"
            title="Imprime TOUTES les pages du dépôt"
          >
            <Printer size={16} /> Toutes les pages ({pagination?.lastPage || 0})
          </button>

          <button
            onClick={imprimerGlobalRegroupe}
            className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Printer size={16} /> Global regroupé
          </button>
        </div>
      </div>

      {/* INFORMATION */}
      <div className="text-sm text-gray-600 flex justify-between items-center">
        <span>
          {isSearching ? (
            <>Recherche dans tous les produits • {filteredResults.length} produit(s) trouvé(s)</>
          ) : (
            <>Affichage des produits de la page {page} • {globalGroupedProduits.length} produits au total</>
          )}
        </span>
        <span className="bg-gray-100 px-3 py-1 rounded">
          Stock total: {globalGroupedProduits.reduce((acc, p) => acc + (p.stock_global || 0), 0)} unités
        </span>
      </div>

      {/* TABLE + FICHE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABLE */}
        <div className={`${selectedProduit ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl shadow overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="bg-[#F5F3FF] text-[#472EAD]">
              <tr>
                <th className="p-3 text-left">Produit</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Fournisseur</th>
                <th className="p-3 text-center">Prix Achat</th>
                <th className="p-3 text-center">Cartons</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Seuil</th>
                <th className="p-3 text-center">État</th>
                <th className="p-3 text-center">Réappro</th>
                <th className="p-3 text-center">Fiche</th>
              </tr>
            </thead>
            <tbody>
              {displayedProduits.length > 0 ? (
                displayedProduits.map((p, index) => (
                  <tr key={p.id || index} className="hover:bg-gray-50 border-b">
                    <td className="p-3 font-medium">{p.nom}</td>
                    <td className="p-3 text-xs text-gray-500">{p.code}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {p.nom_fournisseur}
                      </span>
                    </td>
                    <td className="p-3 text-center">{formatFCFA(p.prix_achat)}</td>
                    <td className="p-3 text-center">{p.nombre_carton || 0}</td>
                    <td className="p-3 text-center font-semibold">{p.stock_global || 0}</td>
                    <td className="p-3 text-center">{p.stock_seuil || 0}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.etat_stock === "Rupture" && (
                          <>
                            <AlertTriangle size={16} className="text-red-600" />
                            <span className="text-red-600 text-xs">Rupture</span>
                          </>
                        )}
                        {p.etat_stock === "Stock faible" && (
                          <>
                            <AlertTriangle size={16} className="text-orange-500" />
                            <span className="text-orange-500 text-xs">Faible</span>
                          </>
                        )}
                        {p.etat_stock === "Disponible" && (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-600 text-xs">Dispo</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={p.nombre_reappro > 0 ? "text-blue-600 font-semibold" : ""}>
                        {p.nombre_reappro || 0}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => afficherFiche(p)}
                        className="p-1.5 bg-[#472EAD] text-white rounded-lg hover:bg-[#5a3bc9] transition-colors"
                        title="Voir fiche produit"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    {isSearching ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-gray-400" />
                        <p>Aucun produit ne correspond à votre recherche</p>
                        <button 
                          onClick={() => setSearch("")}
                          className="text-[#472EAD] hover:underline text-sm"
                        >
                          Effacer la recherche
                        </button>
                      </div>
                    ) : (
                      "Aucun produit disponible"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FICHE PRODUIT */}
        {selectedProduit && (
          <div className="bg-white rounded-xl shadow p-5 lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#472EAD]">
                Fiche Produit
              </h2>
              <button
                onClick={fermerFiche}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* En-tête produit */}
              <div className="bg-gradient-to-r from-[#472EAD] to-[#5a3bc9] text-white p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{selectedProduit.nom}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                    Code: {selectedProduit.code}
                  </span>
                </div>
              </div>

              {/* Informations générales */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#472EAD] rounded"></span>
                  Informations générales
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Code:</span>
                    <span className="font-medium">{selectedProduit.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fournisseur:</span>
                    <span className="font-medium text-blue-700">{selectedProduit.nom_fournisseur}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fournisseur ID:</span>
                    <span className="text-xs text-gray-500">{selectedProduit.fournisseur_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix d'achat:</span>
                    <span className="font-bold text-[#472EAD]">
                      {formatFCFA(selectedProduit.prix_achat)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix unité/carton:</span>
                    <span>{formatFCFA(selectedProduit.prix_unite_carton)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unité par carton:</span>
                    <span>{selectedProduit.unite_carton}</span>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#472EAD] rounded"></span>
                  Stock
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stock global:</span>
                    <span className="font-bold text-lg">{selectedProduit.stock_global || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cartons:</span>
                    <span>{selectedProduit.nombre_carton || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seuil d'alerte:</span>
                    <span>{selectedProduit.stock_seuil || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">État:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${selectedProduit.etat_stock === "Rupture" ? 'bg-red-100 text-red-800' : 
                        selectedProduit.etat_stock === "Stock faible" ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {selectedProduit.etat_stock}
                    </span>
                  </div>
                </div>
              </div>

              {/* Réapprovisionnement */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#472EAD] rounded"></span>
                  Réapprovisionnement
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre de fois:</span>
                    <span className={`font-semibold ${selectedProduit.nombre_reappro > 0 ? 'text-blue-600' : ''}`}>
                      {selectedProduit.nombre_reappro || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                {selectedProduit.date_creation && (
                  <div className="flex justify-between">
                    <span>Créé le:</span>
                    <span>{new Date(selectedProduit.date_creation).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {selectedProduit.date_modification && (
                  <div className="flex justify-between mt-1">
                    <span>Modifié le:</span>
                    <span>{new Date(selectedProduit.date_modification).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm bg-white p-4 rounded-xl shadow">
          <button
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Précédent
          </button>

          <div className="flex items-center gap-3">
            <span className="font-medium">
              Page {page} / {totalPages}
            </span>
            {isSearching && (
              <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                {filteredResults.length} produits
              </span>
            )}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="px-4 py-2 border rounded disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
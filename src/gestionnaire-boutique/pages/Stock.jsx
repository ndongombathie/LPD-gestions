import React, { useEffect, useState } from "react";
import { Search, Eye, AlertTriangle, Filter, BarChart3 } from "lucide-react";
import CardStat from "../components/CardStat";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import * as api from "../services/apiMock";

const Stock = () => {
  const [recherche, setRecherche] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("Toutes");
  const [produitDetail, setProduitDetail] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const stats = {
    totalProduits: stocks.length,
    totalQuantite: stocks.reduce((sum, s) => sum + (s.quantite * s.nbr_pieces), 0),
    disponible: stocks.filter(s => s.quantite > s.seuil).length,
    faible: stocks.filter(s => s.quantite > 0 && s.quantite <= s.seuil).length,
    epuisse: stocks.filter(s => s.quantite === 0).length,
  };

  const categories = ["Toutes", ...new Set(stocks.map(s => s.categorie))];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.fetchStocks().then((res) => {
      if (!mounted) return;
      setStocks(res);
      setLoading(false);
    });
    return () => (mounted = false);
  }, []);

  const stocksFiltres = stocks.filter(s => {
    const q = recherche.trim().toLowerCase();
    const matchRecherche = !q || s.nom.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    const matchCategorie = categorieFiltre === "Toutes" || s.categorie === categorieFiltre;
    return matchRecherche && matchCategorie;
  });

  const handleView = (row) => setProduitDetail(row);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 space-y-6 py-6">
        {/* En-tête */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
              <BarChart3 size={32} className="text-[#472EAD]" />
              Gestion du Stock
            </h2>
            <p className="text-gray-600 mt-1">Vue d'ensemble et détails des stocks</p>
          </div>
        </div>

        {/* Card Statistiques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardStat title="Nombre de produits" value={stats.totalProduits} color="bg-[#472EAD]" />
          <CardStat title="Quantité totale" value={stats.totalQuantite.toLocaleString("fr-FR")} color="bg-blue-600" subtitle="unités" />
          <CardStat title="Disponibles" value={stats.disponible} color="bg-green-600" />
          <CardStat title="Stock faible" value={stats.faible} color="bg-[#F58020]" />
        </div>

        {/* Recherche et filtres */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                className="border rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={categorieFiltre}
                onChange={(e) => setCategorieFiltre(e.target.value)}
              >
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DataTable centralisée */}
        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner />
          ) : stocksFiltres.length === 0 ? (
            <EmptyState message="Aucun produit trouvé" />
          ) : (
            <DataTable
              columns={[
                { label: "Produit", key: "nom" },
                { label: "Code", key: "code" },
                { label: "Catégorie", key: "categorie" },
                {
                  label: "Quantité par unité",
                  key: "quantite",
                  render: (v, row) => `${v} x${row.nbr_pieces}`,
                },
                {
                  label: "Total unités",
                  key: "quantite",
                  render: (v, row) => `${v * row.nbr_pieces}`,
                },
                { label: "Seuil", key: "seuil" },
                {
                  label: "Valeur stock",
                  key: "valeur",
                  render: (_, row) => `${(row.quantite * row.nbr_pieces * row.prix_gros).toLocaleString("fr-FR")} FCFA`,
                },
                {
                  label: "Statut",
                  key: "statut",
                  render: (_, row) => {
                    const quantiteTotale = row.quantite * row.nbr_pieces;
                    if (quantiteTotale === 0) {
                      return <span className="flex items-center gap-2 text-red-600 font-semibold"><AlertTriangle size={16} /> Épuisé</span>;
                    } else if (quantiteTotale <= row.seuil) {
                      return <span className="flex items-center gap-2 text-[#F58020] font-semibold"><AlertTriangle size={16} /> Faible</span>;
                    } else {
                      return <span className="text-green-600 font-semibold">OK</span>;
                    }
                  },
                },
              ]}
              data={stocksFiltres}
              actions={[
                {
                  title: "Détails",
                  icon: <Eye size={16} />,
                  color: "text-blue-600",
                  hoverBg: "bg-blue-50",
                  onClick: handleView,
                },
              ]}
              onRowClick={(row) => setProduitDetail(row)}
            />
          )}
        </div>

        {/* Modal Détails */}
        {produitDetail && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[650px] rounded-lg shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-[#111827]">Détails du produit</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Nom</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.nom}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Code</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.code}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Catégorie</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.categorie}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Fournisseur</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.fournisseur}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Quantité (unités)</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.quantite}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Nombre de pièces</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.nbr_pieces}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Quantité totale</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.quantite * produitDetail.nbr_pieces}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Seuil d'alerte</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.seuil}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Prix gros</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.prix_gros.toLocaleString("fr-FR")} FCFA</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Prix détail</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.prix_detail.toLocaleString("fr-FR")} FCFA</p>
                </div>
                <div className="col-span-2 border-b pb-3">
                  <p className="text-gray-600 font-medium">Valeur du stock</p>
                  <p className="text-[#472EAD] font-bold text-lg mt-1">
                    {(produitDetail.quantite * produitDetail.nbr_pieces * produitDetail.prix_gros).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setProduitDetail(null)}
                  className="px-4 py-2 bg-[#472EAD] text-white rounded hover:bg-[#3b2594]"
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
};

export default Stock;

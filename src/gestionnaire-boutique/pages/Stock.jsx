import React, { useEffect, useState } from "react";
import { Search, Eye, AlertTriangle, Filter, Trash2, Edit } from "lucide-react";
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
    total: stocks.length,
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

  // Supprimer un produit (mock)
  const supprimerProduit = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    const res = await api.deleteStock(id);
    if (res && res.ok) setStocks((prev) => prev.filter(s => s.id !== id));
  };

  const handleView = (row) => setProduitDetail(row);

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="px-6 space-y-6">
        {/* En-tête et recherche */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-[#111827]">Gestion du Stock</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-64 pl-10 pr-3 py-2 border rounded-lg"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                className="border rounded-lg py-2 px-3 bg-white"
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

        {/* Card Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <CardStat title="Total produits" value={stats.total} color="bg-[#472EAD]" />
          <CardStat title="Disponibles" value={stats.disponible} color="bg-green-600" />
          <CardStat title="Faible stock" value={stats.faible} color="bg-[#F58020]" />
          <CardStat title="Épuisés" value={stats.epuisse} color="bg-red-600" />
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
                { label: "Nom", key: "nom" },
                { label: "Code", key: "code" },
                { label: "Catégorie", key: "categorie" },
                { label: "Quantité", key: "quantite", render: (v, row) => `${v} (x${row.nbr_pieces})` },
                { label: "Seuil", key: "seuil" },
                { label: "Valeur stock", key: "valeur", render: (_, row) => `${row.quantite * row.nbr_pieces * row.prix_gros} FCFA` },
                { label: "Statut", key: "statut", render: (_, row) => {
                    const quantiteTotale = row.quantite * row.nbr_pieces;
                    return quantiteTotale <= row.seuil ? (
                      <span className="flex items-center gap-2 text-[#F58020] font-medium"><AlertTriangle size={16} /> Faible</span>
                    ) : (
                      <span className="text-green-600 font-medium">OK</span>
                    );
                  }
                },
              ]}
              data={stocksFiltres}
              actions={[
                { title: 'Voir', icon: <Eye size={16} />, color: "text-blue-600", hoverBg: "bg-gray-100", onClick: handleView },
                { title: 'Supprimer', icon: <Trash2 size={16} />, hoverBg: "bg-gray-100", color: "text-red-600", onClick: (row) => supprimerProduit(row.id) },
              ]}
              onRowClick={(row) => setProduitDetail(row)}
            />
          )}
        </div>

        {/* Modal Détails */}
        {produitDetail && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails du produit</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Nom :</span> {produitDetail.nom}</p>
                <p><span className="font-medium">Code :</span> {produitDetail.code}</p>
                <p><span className="font-medium">Catégorie :</span> {produitDetail.categorie}</p>
                <p><span className="font-medium">Fournisseur :</span> {produitDetail.fournisseur}</p>
                <p><span className="font-medium">Quantité en stock :</span> {produitDetail.quantite}</p>
                <p><span className="font-medium">Nombre de pièces :</span> {produitDetail.nbr_pieces}</p>
                <p><span className="font-medium">Quantité totale :</span> {produitDetail.quantite * produitDetail.nbr_pieces}</p>
                <p><span className="font-medium">Seuil d’alerte :</span> {produitDetail.seuil}</p>
                <p><span className="font-medium">Prix gros :</span> {produitDetail.prix_gros} FCFA</p>
                <p><span className="font-medium">Prix détail :</span> {produitDetail.prix_detail} FCFA</p>
                <p><span className="font-medium">Valeur du stock :</span> {produitDetail.quantite * produitDetail.nbr_pieces * produitDetail.prix_gros} FCFA</p>
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

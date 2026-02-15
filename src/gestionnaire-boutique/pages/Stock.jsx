import React, { useEffect, useState } from "react";
import { Search, Eye, Filter, BarChart3 } from "lucide-react";
import CardStat from "../components/CardStat";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Stock = () => {
  const [recherche, setRecherche] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("Toutes");
  const [produitDetail, setProduitDetail] = useState(null);
  const [produits, setProduits] = useState([]); // Produits validés
  const [stocksFaibles, setStocksFaibles] = useState([]); // Produits sous seuil
  const [produitsRupture, setProduitsRupture] = useState([]); // Produits en rupture
  const [nombreProduits, setNombreProduits] = useState(0);
  const [quantiteTotale, setQuantiteTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Stats
  const stats = {
    totalProduits: nombreProduits,
    totalQuantite: quantiteTotale,
    faible: stocksFaibles.length,
    rupture: produitsRupture.length,
  };

  const categories = ["Toutes", ...new Set(produits.map(p => p.categorie).filter(Boolean))];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [nb, qty, sousSeuil, rupture, produitsDispo] = await Promise.all([
          gestionnaireBoutiqueAPI.getNombreProduitsTotal(),
          gestionnaireBoutiqueAPI.getQuantiteTotaleProduit(),
          gestionnaireBoutiqueAPI.getProduitsSousSeuil(),
          gestionnaireBoutiqueAPI.getProduitsRupture(),
          gestionnaireBoutiqueAPI.getProduitsDisponiblesBoutique(page),
        ]);
        if (!mounted) return;
        
        const nbValue = typeof nb === 'object' ? (nb.total || nb.nombre || 0) : (Number(nb) || 0);
        const qtyValue = typeof qty === 'object' ? (qty.total_quantity || qty.quantite || 0) : (Number(qty) || 0);
        
        setNombreProduits(nbValue);
        setQuantiteTotale(qtyValue);
        setStocksFaibles(sousSeuil?.data || []);
        setProduitsRupture(rupture?.data || []);
        
        // Extraire les produits depuis la réponse paginée ou array direct
        console.log('📦 Produits disponibles boutique - structure:', produitsDispo);
        let produitsData = Array.isArray(produitsDispo) 
          ? produitsDispo 
          : (produitsDispo?.data || []);
        
        // Normaliser: si chaque item a une propriété 'produit', l'extraire
        produitsData = produitsData.map(item => {
          if (item.produit) {
            // Fusionner les données du produit avec les autres champs (quantite, cartons, etc.)
            return { ...item.produit, ...item };
          }
          return item;
        });
        
        console.log('📦 Produits extraits:', produitsData.length, 'produits');
        console.log('📦 Premier produit:', produitsData[0]);
        setProduits(produitsData);
        setPagination(produitsDispo);
      } catch (error) {
        console.error('❌ Erreur chargement stock:', error);
        toast.error('Erreur de chargement', { description: 'Impossible de charger les informations de stock' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [page]);

  const handlePageChange = (nextPage) => {
    if (nextPage && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const stocksFiltres = produits.filter(s => {
    const q = recherche.trim().toLowerCase();
    const matchRecherche = !q || s.nom?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
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
          <CardStat title="Quantité totale" value={stats.totalQuantite.toLocaleString("fr-FR")} color="bg-blue-600" subtitle="unités (globale)" />
          <CardStat title="Produits en rupture" value={stats.rupture} color="bg-red-600" />
          <CardStat title="Produits sous seuil" value={stats.faible} color="bg-[#F58020]" />
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
                { label: "Quantité", key: "quantite", render: (v, row) => row.quantite ?? row.quantite ?? '-' },
                { label: "Seuil", key: "seuil", render: (v, row) => row.seuil ?? row.seuil ?? '-' },
                { label: "Cartons", key: "nombre_carton", render: (v, row) => row.nombre_carton ?? '-' },
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
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
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
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.categorie_id || produitDetail.categorie || '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Unité par carton</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.unite_carton ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Quantité (unités)</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.quantite ?? produitDetail.quantite ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Seuil d'alerte</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.seuil ?? produitDetail.seuil ?? '-'}</p>
                </div>
                {produitDetail.nombre_carton != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Cartons</p>
                    <p className="text-[#111827] font-semibold mt-1">{produitDetail.nombre_carton}</p>
                  </div>
                )}
                {produitDetail.prix_unite_carton != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix unité carton</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(produitDetail.prix_unite_carton).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {produitDetail.prix_achat != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix achat</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(produitDetail.prix_achat).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {produitDetail.prix_vente_gros != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix vente gros</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(produitDetail.prix_vente_gros).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {produitDetail.prix_vente_detail != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix vente détail</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(produitDetail.prix_vente_detail).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {produitDetail.prix_seuil_detail != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Seuil prix détail</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(produitDetail.prix_seuil_detail).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {produitDetail.prix_seuil_gros != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Seuil prix gros</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(produitDetail.prix_seuil_gros).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {produitDetail.created_at && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Créé le</p>
                    <p className="text-[#111827] font-semibold mt-1">{new Date(produitDetail.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                {produitDetail.updated_at && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Mis à jour le</p>
                    <p className="text-[#111827] font-semibold mt-1">{new Date(produitDetail.updated_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
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

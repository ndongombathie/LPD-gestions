import React, { useEffect, useState } from "react";
import { Search, Eye, BarChart3 } from "lucide-react";
import CardStat from "../components/CardStat";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast, Toaster } from "sonner";

const Stock = () => {
  const [recherche, setRecherche] = useState("");
  const [produitDetail, setProduitDetail] = useState(null);
  const [produits, setProduits] = useState([]); // Produits validés
  const [stocksFaibles, setStocksFaibles] = useState([]); // Produits sous seuil
  const [produitsRupture, setProduitsRupture] = useState([]); // Produits en rupture
  const [nombreProduits, setNombreProduits] = useState(0);
  const [quantiteTotale, setQuantiteTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    code: '',
    categorie_id: '',
    fournisseur_id: '',
    unite_carton: '',
    prix_unite_carton: '',
    nombre_carton: '',
    stock_seuil: '5',
    prix_vente_detail: '',
    prix_vente_gros: '',
    prix_seuil_detail: '',
    prix_seuil_gros: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const debouncedRecherche = useDebouncedValue(recherche);

  const getPrixVenteDetail = (produit) =>
    produit?.prix_vente_detail ?? produit?.prix_detail ?? produit?.prix ?? 0;

  const getPrixVenteGros = (produit) =>
    produit?.prix_vente_gros ?? produit?.prix_gros ?? produit?.prix_unite_carton ?? 0;

  const getPrixSeuilDetail = (produit) =>
    produit?.prix_seuil_detail ?? produit?.prix_seuil ?? 0;

  const getPrixSeuilGros = (produit) =>
    produit?.prix_seuil_gros ?? produit?.prix_seuil ?? 0;

  const getStockSeuil = (produit) =>
    produit?.stock_seuil ?? produit?.seuil ?? 0;

  const dedupeById = (items = []) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = item?.id ?? item?._id;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Stats
  const stats = {
    totalProduits: nombreProduits,
    totalQuantite: quantiteTotale,
    faible: stocksFaibles.length,
    rupture: produitsRupture.length,
  };


  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const [nb, qty, sousSeuil, rupture, produitsDispo] = await Promise.all([
          gestionnaireBoutiqueAPI.getNombreProduitsTotal({ signal: controller.signal }),
          gestionnaireBoutiqueAPI.getQuantiteTotaleProduit({ signal: controller.signal }),
          gestionnaireBoutiqueAPI.getProduitsSousSeuil(1, "", { signal: controller.signal }),
          gestionnaireBoutiqueAPI.getProduitsRupture(1, "", { signal: controller.signal }),
          gestionnaireBoutiqueAPI.getProduitsDisponiblesBoutique(page, debouncedRecherche, { signal: controller.signal }),
        ]);
        if (!mounted) return;
        
        const nbValue = typeof nb === 'object' ? (nb.total || nb.nombre || 0) : (Number(nb) || 0);
        const qtyValue = typeof qty === 'object' ? (qty.total_quantity || qty.quantite || 0) : (Number(qty) || 0);
        
        setNombreProduits(nbValue);
        setQuantiteTotale(qtyValue);
        setStocksFaibles(sousSeuil?.data || []);
        setProduitsRupture(rupture?.data || []);
        
        // Extraire les produits depuis la réponse paginée ou array direct
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
        
        setProduits(dedupeById(produitsData));
        setPagination(produitsDispo);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return;
        }
        toast.error('Erreur de chargement', { description: 'Impossible de charger les informations de stock' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [page, debouncedRecherche, refreshKey]);

  // Charger catégories et fournisseurs pour le formulaire "Ajouter produit"
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      try {
        const [cats, fous] = await Promise.all([
          gestionnaireBoutiqueAPI.getCategories({ signal: controller.signal }),
          gestionnaireBoutiqueAPI.getFournisseurs({ signal: controller.signal }),
        ]);
        if (!mounted) return;
        setCategories(dedupeById(Array.isArray(cats) ? cats : []));
        setFournisseurs(dedupeById(Array.isArray(fous) ? fous : []));
      } catch (err) {
        console.warn('Impossible de charger catégories/fournisseurs', err?.message || err);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const handlePageChange = (nextPage) => {
    if (nextPage && nextPage !== page) {
      setPage(nextPage);
    }
  };

  const handleRechercheChange = (event) => {
    const value = event.target.value;
    setRecherche(value);
    if (page !== 1) {
      setPage(1);
    }
  };

  const handleClearRecherche = () => {
    setRecherche("");
    if (page !== 1) {
      setPage(1);
    }
  };

  const stocksFiltres = produits.filter(s => {
    const q = recherche.trim().toLowerCase();
    const matchRecherche = !q || s.nom?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    return matchRecherche ;
  });

  const handleView = (row) => setProduitDetail(row);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.code) {
      toast.error('Les champs Nom et Code sont requis');
      return;
    }
    setSubmitting(true);
    try {
      // Préparer payload en convertissant les nombres si fournis
      const payload = {
        nom: form.nom,
        code: form.code,
        categorie_id: form.categorie_id || null,
        fournisseur_id: form.fournisseur_id || null,
        unite_carton: form.unite_carton ? parseInt(form.unite_carton, 10) : null,
        prix_unite_carton: form.prix_unite_carton ? parseFloat(form.prix_unite_carton) : null,
        nombre_carton: form.nombre_carton ? parseInt(form.nombre_carton, 10) : null,
        stock_seuil: form.stock_seuil ? parseInt(form.stock_seuil, 10) : 5,
        prix_vente_detail: form.prix_vente_detail ? parseFloat(form.prix_vente_detail) : null,
        prix_detail: form.prix_vente_detail ? parseFloat(form.prix_vente_detail) : null,
        prix_vente_gros: form.prix_vente_gros ? parseFloat(form.prix_vente_gros) : null,
        prix_gros: form.prix_vente_gros ? parseFloat(form.prix_vente_gros) : null,
        prix_seuil_detail: form.prix_seuil_detail ? parseFloat(form.prix_seuil_detail) : null,
        prix_seuil_gros: form.prix_seuil_gros ? parseFloat(form.prix_seuil_gros) : null,
        prix_seuil: form.prix_seuil_detail ? parseFloat(form.prix_seuil_detail) : null,
        seuil: form.stock_seuil ? parseInt(form.stock_seuil, 10) : 5,
      };

      await gestionnaireBoutiqueAPI.storeProduitValider(payload);
      toast.success('Produit créé avec succès');
      setShowAddModal(false);
      // reset form
      setForm({
        nom: '', code: '', categorie_id: '', fournisseur_id: '', unite_carton: '', prix_unite_carton: '', nombre_carton: '', stock_seuil: '5',
        prix_vente_detail: '', prix_vente_gros: '', prix_seuil_detail: '', prix_seuil_gros: ''
      });
      // Rafraîchir la liste
      setRefreshKey(k => k + 1);
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      const firstFieldError = apiErrors && typeof apiErrors === 'object'
        ? Object.values(apiErrors).flat().find(Boolean)
        : null;
      const msg = firstFieldError || err?.response?.data?.message || err?.message || 'Erreur lors de la création';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
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
            {/* Bouton Ajouter produit */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-linear-to-r from-[#6b3be6] to-[#f97316] text-white rounded-lg shadow hover:opacity-95"
              >
                Ajouter produit
              </button>
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
            <div className="relative flex-1 ">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit, un code..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                value={recherche}
                onChange={handleRechercheChange}
              />
            </div>
            {recherche && (
              <button
                type="button"
                onClick={handleClearRecherche}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Effacer
              </button>
            )}
          
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
                { label: "Quantité", key: "quantite", render: (v, row) => row.quantite ?? '-' },
                { label: "Seuil", key: "seuil", render: (v, row) => getStockSeuil(row) ?? '-' },
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

        {/* Modal Ajouter Produit */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 bg-black/40 flex justify-center items-start pt-20">
            <div className="relative z-50 w-225 bg-white rounded-lg shadow-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">📦 Nouveau Produit</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Nom du produit *</label>
                  <input name="nom" value={form.nom} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Catégorie</label>
                  <select name="categorie_id" value={form.categorie_id} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded">
                    <option value="">-- Sélectionnez une catégorie --</option>
                    {categories.map((c) => (
                      <option key={c.id ?? c._id} value={c.id ?? c._id}>{c.nom || c.name || c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Fournisseur</label>
                  <select name="fournisseur_id" value={form.fournisseur_id} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded">
                    <option value="">-- Aucun fournisseur --</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id ?? f._id} value={f.id ?? f._id}>{f.nom || f.name || f.raison_sociale}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Code *</label>
                  <input name="code" value={form.code} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Prix par carton (FCFA)</label>
                  <input name="prix_unite_carton" value={form.prix_unite_carton} onChange={handleFormChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Cartons en stock</label>
                  <input name="nombre_carton" value={form.nombre_carton} onChange={handleFormChange} type="number" className="w-full mt-1 p-2 border rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Unités par carton</label>
                  <input name="unite_carton" value={form.unite_carton} onChange={handleFormChange} type="number" className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Stock minimum (cartons)</label>
                  <input name="stock_seuil" value={form.stock_seuil} onChange={handleFormChange} type="number" min="0" className="w-full mt-1 p-2 border rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Prix vente détail (FCFA)</label>
                  <input name="prix_vente_detail" value={form.prix_vente_detail} onChange={handleFormChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Prix vente gros (FCFA)</label>
                  <input name="prix_vente_gros" value={form.prix_vente_gros} onChange={handleFormChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Seuil prix détail</label>
                  <input name="prix_seuil_detail" value={form.prix_seuil_detail} onChange={handleFormChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Seuil prix gros</label>
                  <input name="prix_seuil_gros" value={form.prix_seuil_gros} onChange={handleFormChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded" />
                </div>

                <div className="col-span-2 flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Annuler</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-linear-to-r from-[#472EAD] to-[#f97316] text-white rounded">
                    {submitting ? 'Création...' : 'Créer le produit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Détails */}
        {produitDetail && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex justify-center items-center">
            <div className="relative z-50 w-200 bg-white rounded-lg shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
                  <p className="text-gray-600 font-medium">Unité par carton</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.unite_carton ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Quantité (unités)</p>
                  <p className="text-[#111827] font-semibold mt-1">{produitDetail.quantite ?? '-'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600 font-medium">Seuil d'alerte</p>
                  <p className="text-[#111827] font-semibold mt-1">{getStockSeuil(produitDetail) ?? '-'}</p>
                </div>
                {getPrixVenteGros(produitDetail) != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix unité carton</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(getPrixVenteGros(produitDetail)).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {getPrixVenteGros(produitDetail) != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix vente gros</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(getPrixVenteGros(produitDetail)).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {getPrixVenteDetail(produitDetail) != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Prix vente détail</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(getPrixVenteDetail(produitDetail)).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {getPrixSeuilDetail(produitDetail) != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Seuil prix détail</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(getPrixSeuilDetail(produitDetail)).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                )}
                {getPrixSeuilGros(produitDetail) != null && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600 font-medium">Seuil prix gros</p>
                    <p className="text-[#111827] font-semibold mt-1">{Number(getPrixSeuilGros(produitDetail)).toLocaleString("fr-FR")} FCFA</p>
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

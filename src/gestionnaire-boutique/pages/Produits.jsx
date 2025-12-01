import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Search, CheckCircle2, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import * as api from "../services/apiMock";

const Produits = () => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Local toasts pour notifications (succès/erreur)
  const [toasts, setToasts] = useState([]);
  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const [recherche, setRecherche] = useState("");
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState({
    nom: "",
    code: "",
    code_barre: "",
    categorie: "",
    prix_vente: "",
    prix_basique: "",
    prix_seuil: "",
    prix_gros: "",
    prix_gros_basique: "",
    prix_gros_seuil: "",
    quantite: "",
    nbr_paquets: "",
  });

  const produitsFiltres = produits.filter(
    (p) =>
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.code.toLowerCase().includes(recherche.toLowerCase())
  );

  const ouvrirAjout = () => {
    setFormData({
      nom: "",
      code: "",
      code_barre: "",
      categorie: "",
      nbr_pieces: "",
      prix_basique: "",
      prix_seuil: "",
      prix_gros: "",
      prix_gros_basique: "",
      prix_gros_seuil: "",
      quantite: "",
      nbr_paquets: "",
    });
    setEditId(null);
    setShowModal(true);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.fetchProducts()
      .then((res) => {
        if (!mounted) return;
        setProduits(res || []);
      })
      .catch((err) => {
        console.error(err);
        addToast("error", "Erreur", "Impossible de charger les produits.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const modifierProduit = (id) => {
    const prod = produits.find((p) => p.id === id);
    setFormData(prod);
    setEditId(id);
    setShowModal(true);
  };

  const enregistrerProduit = () => {
    // validations simples
    if (!formData.nom || !formData.code) {
      addToast("error", "Champs manquants", "Le nom et le code sont requis.");
      return;
    }

    const quantiteNum = parseInt(formData.quantite || 0, 10);
    if (Number.isNaN(quantiteNum) || quantiteNum < 0) {
      addToast("error", "Quantité invalide", "Entrez un nombre valide pour la quantité.");
      return;
    }

    const payload = {
      nom: formData.nom,
      code: formData.code,
      code_barre: formData.code_barre || "",
      categorie: formData.categorie || "",
      prix_vente: parseInt(formData.prix_vente || 0, 10),
      quantite: quantiteNum,
      prix_seuil: parseInt(formData.prix_seuil || 0, 10),
    };

    setLoading(true);

    if (editId) {
      api.updateProduct(editId, payload)
        .then((updated) => {
          setProduits((prev) => prev.map((p) => (p.id === editId ? updated || p : p)));
          addToast("success", "Produit mis à jour", "Le produit a été modifié.");
          setShowModal(false);
        })
        .catch((err) => {
          console.error(err);
          addToast("error", "Erreur", "Impossible de mettre à jour le produit.");
        })
        .finally(() => setLoading(false));
    } else {
      api.addProduct(payload)
        .then((newProd) => {
          setProduits((prev) => [newProd, ...prev]);
          addToast("success", "Produit ajouté", "Nouveau produit ajouté à la liste.");
          setShowModal(false);
        })
        .catch((err) => {
          console.error(err);
          addToast("error", "Erreur", "Impossible d'ajouter le produit.");
        })
        .finally(() => setLoading(false));
    }
  };

  const supprimerProduit = () => {
    setLoading(true);
    api.deleteProduct(confirmDelete)
      .then(() => {
        setProduits((prev) => prev.filter((p) => p.id !== confirmDelete));
        addToast("success", "Supprimé", "Produit supprimé.");
        setConfirmDelete(null);
      })
      .catch((err) => {
        console.error(err);
        addToast("error", "Erreur", "Impossible de supprimer le produit.");
      })
      .finally(() => setLoading(false));
  };

  return (
  <div className="min-h-screen bg-gray-50 overflow-y-auto scrollbar-hide">

    {/* Contenu principal défilable */}
    <div className="px-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
  <h2 className="text-2xl font-bold text-[#111827]">
    Gestion des Produits
  </h2>

  <div className="flex items-center gap-4">
    {/* Barre de recherche */}
    <div className="relative">
      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      <input
        type="text"
        placeholder="Rechercher..."
        className="pl-10 pr-3 py-2 border rounded-lg"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
    </div>

    {/* Filtre par catégorie */}
    <div className="relative">
      <label htmlFor="categorieFilter" className="sr-only">Filtrer par catégorie</label>
      <select
        id="categorieFilter"
        className="border rounded-lg py-2 px-3 pr-10 appearance-none"
        value={formData.categorie}
        onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
      >
        <option value="">Toutes les catégories</option>
        <option value="Hygiène">Hygiène</option>
        <option value="Alimentation">Alimentation</option>
        <option value="Électronique">Électronique</option>

      </select>
      <svg
        className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    {/* Bouton Nouveau Produit */}
    <button
      onClick={ouvrirAjout}
      className="bg-[#472EAD] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#3b2594]"
    >
      <Plus size={18} /> Nouveau Produit
    </button>
  </div>
</div>


      {/* Tableau produits (DataTable réutilisable) */}
      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto scrollbar-hide">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            data={produitsFiltres}
            columns={[
              { label: "Nom", key: "nom" },
              { label: "Code", key: "code" },
              { label: "Catégorie", key: "categorie" },
              {
                label: "Prix vente",
                key: "prix_vente",
                render: (val) => `${val} FCFA`,
              },
              {
                label: "Quantité",
                key: "quantite",
                render: (val, row) => (
                  <div className="flex items-center gap-2">
                    <span>{val}</span>
                    {val <= row.prix_seuil && (
                      <AlertTriangle className="text-[#F58020]" size={16} />
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                title: "Modifier",
                icon: <Edit size={16} />,
                onClick: (row) => modifierProduit(row.id),
                hoverBg: "bg-gray-100",
                color: "text-blue-600",
              },
              {
                title: "Supprimer",
                icon: <Trash2 size={16} />,
                onClick: (row) => setConfirmDelete(row.id),
                hoverBg: "bg-gray-100",
                color: "text-red-600",
              },
            ]}
          />
        )}
      </div>

      {/* Toasts locaux */}
      <div className="fixed top-4 right-4 z-9999 space-y-3">
        {toasts.map((t) => {
          const border = t.type === "success" ? "border-l-4 border-emerald-500" : "border-l-4 border-rose-500";
          const Icon = t.type === "success" ? CheckCircle2 : AlertCircle;
          return (
            <div key={t.id} className={`${border} bg-white text-gray-900 px-4 py-3 rounded-lg shadow-md w-80 flex gap-3 items-start`}>
              <div className="mt-0.5"><Icon size={18} className={t.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} /></div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.message && <div className="text-xs opacity-90 mt-0.5">{t.message}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals (inchangés) */}
      {showModal && (
        <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex items-center justify-center">
          <div className="relative z-50 bg-white p-6 rounded-lg w-[700px] shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-[#111827]">
              {editId ? "Modifier le produit" : "Ajouter un produit"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries({
                nom: "Nom",
                code_barre: "Code barre",
                categorie: "Catégorie",
                quantite: "Quantités",
                nbr_pieces: "Nombre de pièces",
                prix_seuil_detail: "Prix Seuil (Détail)",
                prix_seuil_gros: "Prix Seuil (Gros)",
                prix_seuil: "Prix normal en détail (FCFA)",
                prix_gros: "Prix normal en gros (FCFA)",
              }).map(([key, label]) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium text-[#111827] mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border"
              >
                Annuler
              </button>
              <button
                onClick={enregistrerProduit}
                className="px-4 py-2 rounded bg-[#472EAD] text-white"
              >
                {editId ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex items-center justify-center">
          <div className="relative z-50 bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
            <AlertTriangle className="text-[#F58020] mx-auto" size={40} />
            <p>Voulez-vous vraiment supprimer ce produit ?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={supprimerProduit}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default Produits;

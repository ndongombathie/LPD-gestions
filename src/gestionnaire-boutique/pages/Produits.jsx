import React, { useState } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Search } from "lucide-react";
import Navbar from "../components/Navbar";

const Produits = () => {
  const [produits, setProduits] = useState([
    {
      id: 1,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 2,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 3,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 4,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 5,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 6,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 7,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 8,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 9,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
    {
      id: 10,
      nom: "Savon OMO",
      code: "PR001",
      code_barre: "123456789",
      categorie: "Hygiène",
      prix_vente: 1000,
      prix_basique: 950,
      prix_seuil: 10,
      prix_gros: 900,
      prix_gros_basique: 850,
      prix_gros_seuil: 800,
      quantite: 5,
      nbr_paquets: 1,
      unite_par_paquet: 5,
    },
  ]);

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

  const modifierProduit = (id) => {
    const prod = produits.find((p) => p.id === id);
    setFormData(prod);
    setEditId(id);
    setShowModal(true);
  };

  const enregistrerProduit = () => {
    if (!formData.nom || !formData.code) return;

    const produitFinal = {
      ...formData,
      prix_vente: parseInt(formData.prix_vente || 0),
      prix_basique: parseInt(formData.prix_basique || 0),
      prix_seuil: parseInt(formData.prix_seuil || 0),
      prix_gros: parseInt(formData.prix_gros || 0),
      prix_gros_basique: parseInt(formData.prix_gros_basique || 0),
      prix_gros_seuil: parseInt(formData.prix_gros_seuil || 0),
      quantite: parseInt(formData.quantite || 0),
      nbr_paquets: parseInt(formData.nbr_paquets || 0),
    };

    if (editId) {
      setProduits(produits.map((p) => (p.id === editId ? produitFinal : p)));
    } else {
      setProduits([...produits, { id: Date.now(), ...produitFinal }]);
    }

    setShowModal(false);
  };

  const supprimerProduit = () => {
    setProduits(produits.filter((p) => p.id !== confirmDelete));
    setConfirmDelete(null);
  };

  return (
  <div className="min-h-screen bg-gray-50 overflow-y-auto scrollbar-hide">
    {/* Navbar fixe */}
    <div className="fixed top-0 left-64 right-0 h-16 bg-white z-50 shadow">
      <Navbar />
    </div>

    {/* Contenu principal défilable */}
    <div className="pt-[100px] px-6 space-y-6">
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


      {/* Tableau produits */}
      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-white z-10 border-b">
            <tr className="text-left text-[#111827]">
              <th className="py-2">Nom</th>
              <th>Code</th>
              <th>Catégorie</th>
              <th>Prix vente</th>
              <th>Quantité</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.map((p) => (
              <tr key={p.id} className="border-b hover:bg-[#F3F4F6]">
                <td className="py-2">{p.nom}</td>
                <td>{p.code}</td>
                <td>{p.categorie}</td>
                <td>{p.prix_vente} FCFA</td>
                <td>
                  <div className="flex items-center gap-2">
                    {p.quantite}
                    {p.quantite <= p.prix_seuil && (
                      <AlertTriangle className="text-[#F58020]" size={16} />
                    )}
                  </div>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => modifierProduit(p.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals (inchangés) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[700px] shadow-xl space-y-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
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

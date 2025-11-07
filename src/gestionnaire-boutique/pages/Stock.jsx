import React, { useState } from "react";
import { Search, Eye, AlertTriangle, Filter, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import CardStat from "../components/CardStat";


const Stock = () => {
  const [recherche, setRecherche] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("Toutes");
  const [produitDetail, setProduitDetail] = useState(null);
  const [stocks, setStocks] = useState([
    {
      id: 1,
      nom: "Savon OMO",
      code: "PR001",
      categorie: "Hygiène",
      quantite: 10,
      nbr_pieces: 5,
      prix_gros: 900,
      prix_detail: 1000,
      seuil: 15,
      fournisseur: "Distribution Dakar",
    },
    {
      id: 2,
      nom: "Riz Royal 50kg",
      code: "PR002",
      categorie: "Alimentation",
      quantite: 4,
      nbr_pieces: 1,
      prix_gros: 30000,
      prix_detail: 32000,
      seuil: 3,
      fournisseur: "SunuRiz",
    },
    {
      id: 3,
      nom: "Huile Awa 5L",
      code: "PR003",
      categorie: "Alimentation",
      quantite: 2,
      nbr_pieces: 6,
      prix_gros: 6500,
      prix_detail: 7000,
      seuil: 10,
      fournisseur: "Senhuile SA",
    },
  ]);

  // Stats
  const stats = {
    total: stocks.length,
    disponible: stocks.filter(s => s.quantite > s.seuil).length,
    faible: stocks.filter(s => s.quantite > 0 && s.quantite <= s.seuil).length,
    epuisse: stocks.filter(s => s.quantite === 0).length,
  };

  const categories = ["Toutes", ...new Set(stocks.map(s => s.categorie))];

  const stocksFiltres = stocks.filter(s => {
    const matchRecherche =
      s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      s.code.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie = categorieFiltre === "Toutes" || s.categorie === categorieFiltre;
    return matchRecherche && matchCategorie;
  });

  // Supprimer un produit avec confirmation
  const supprimerProduit = (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    setStocks(stocks.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-64 right-0 h-16 bg-white z-50 shadow">
        <Navbar />
      </div>

      <div className="pt-[100px] px-6 space-y-6">
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

        {/* Tableau des stocks */}
        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b z-10">
              <tr className="text-left text-[#111827]">
                <th className="py-2">Nom</th>
                <th>Code</th>
                <th>Catégorie</th>
                <th>Quantité totale</th>
                <th>Seuil</th>
                <th>Valeur stock</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocksFiltres.length > 0 ? (
                stocksFiltres.map(s => {
                  const quantiteTotale = s.quantite * s.nbr_pieces;
                  return (
                    <tr key={s.id} className="border-b hover:bg-[#F3F4F6]">
                      <td className="py-2">{s.nom}</td>
                      <td>{s.code}</td>
                      <td>{s.categorie}</td>
                      <td>{quantiteTotale}</td>
                      <td>{s.seuil}</td>
                      <td>{quantiteTotale * s.prix_gros} FCFA</td>
                      <td>
                        {quantiteTotale <= s.seuil ? (
                          <span className="flex items-center gap-2 text-[#F58020] font-medium">
                            <AlertTriangle size={16} /> Faible
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">OK</span>
                        )}
                      </td>
                      <td className="text-right flex justify-end gap-2">
                        <button
                          onClick={() => setProduitDetail(s)}
                          className="text-[#472EAD] hover:text-[#3b2594]"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => supprimerProduit(s.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500 italic">
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Détails */}
        {produitDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
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

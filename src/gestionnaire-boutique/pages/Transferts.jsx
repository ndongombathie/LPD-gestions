import React, { useState } from "react";
import { Plus, Search, FileText, Trash2, X , Eye} from "lucide-react";
import Navbar from "../components/Navbar";
import CardStat from "../components/CardStat";

const Transferts = () => {
  const [transferts, setTransferts] = useState([
    { id: 1, produit: "Savon OMO", source: "Boutique A", destination: "Boutique B", quantite: 10, statut: "en_attente" },
    { id: 2, produit: "Riz 5kg", source: "Boutique B", destination: "Boutique C", quantite: 5, statut: "validé" },
    { id: 3, produit: "Lait", source: "Boutique A", destination: "Boutique C", quantite: 8, statut: "rejeté" },
    { id: 3, produit: "Lait", source: "Boutique A", destination: "Boutique C", quantite: 8, statut: "rejeté" },
    { id: 3, produit: "Lait", source: "Boutique A", destination: "Boutique C", quantite: 8, statut: "rejeté" },

  ]);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [nouveau, setNouveau] = useState({ produit: "", source: "", destination: "", quantite: "" });
  const [detailTransfert, setDetailTransfert] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const transfertsFiltres = transferts.filter(
    t =>
      (t.produit.toLowerCase().includes(recherche.toLowerCase()) ||
       t.source.toLowerCase().includes(recherche.toLowerCase()) ||
       t.destination.toLowerCase().includes(recherche.toLowerCase())) &&
      (filtreStatut ? t.statut === filtreStatut : true)
  );

  const stats = {
    total: transferts.length,
    en_attente: transferts.filter(t => t.statut === "en_attente").length,
    valide: transferts.filter(t => t.statut === "validé").length,
    rejete: transferts.filter(t => t.statut === "rejeté").length,
  };

  const ajouterTransfert = () => {
    if (!nouveau.produit || !nouveau.source || !nouveau.destination) return;
    setTransferts([...transferts, { id: Date.now(), ...nouveau, statut: "en_attente" }]);
    setNouveau({ produit: "", source: "", destination: "", quantite: "" });
    setShowModal(false);
  };

  const supprimerTransfert = () => {
    setTransferts(transferts.filter(t => t.id !== confirmDelete));
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto scrollbar-hide">
      {/* Navbar fixe */}
      <div className="fixed top-0 left-64 right-0 h-16 bg-white z-50 shadow">
        <Navbar />
      </div>

      <div className="pt-[100px] px-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#111827]">Demandes de Reprovisionnement</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <CardStat title="Total demandes" value={stats.total} color="bg-[#472EAD]" />
          <CardStat title="En attente" value={stats.en_attente} color="bg-[#F58020]" />
          <CardStat title="Validé" value={stats.valide} color="bg-green-600" />
          <CardStat title="Rejeté" value={stats.rejete} color="bg-red-600" />
        </div>


        {/* Recherche, filtre et ajout sur la même ligne */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="relative w-48">
            <select
              className="border rounded-lg py-2 px-3 w-full"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="">Tous statuts</option>
              <option value="en_attente">En attente</option>
              <option value="validé">Validé</option>
              <option value="rejeté">Rejeté</option>
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#472EAD] text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {/* Tableau demandes */}
        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white border-b z-10">
              <tr className="text-left text-[#111827]">
                <th>Produit</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Quantité</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfertsFiltres.map(t => (
                <tr key={t.id} className="border-b hover:bg-[#F3F4F6]">
                  <td className="py-2">{t.produit}</td>
                  <td>{t.source}</td>
                  <td>{t.destination}</td>
                  <td>{t.quantite}</td>
                  <td
                    className={
                      t.statut === "validé"
                        ? "text-green-600"
                        : t.statut === "rejeté"
                        ? "text-red-600"
                        : "text-[#F58020]"
                    }
                  >
                    {t.statut}
                  </td>
                  <td className="text-right flex justify-end gap-2">
                    <button onClick={() => setDetailTransfert(t)} className="text-blue-600 hover:text-blue-800">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => setConfirmDelete(t.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal création */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Nouvelle demande</h3>
              <div className="grid grid-cols-2 gap-4">
                {["produit", "source", "destination", "quantite"].map(f => (
                  <input
                    key={f}
                    type="text"
                    placeholder={f}
                    className="border p-2 rounded"
                    value={nouveau[f]}
                    onChange={(e) => setNouveau({ ...nouveau, [f]: e.target.value })}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Annuler</button>
                <button onClick={ajouterTransfert} className="px-4 py-2 bg-[#472EAD] text-white rounded">Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal détails */}
        {detailTransfert && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-[600px] rounded-lg shadow-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Produit :</span> {detailTransfert.produit}</p>
                <p><span className="font-medium">Source :</span> {detailTransfert.source}</p>
                <p><span className="font-medium">Destination :</span> {detailTransfert.destination}</p>
                <p><span className="font-medium">Quantité :</span> {detailTransfert.quantite}</p>
                <p><span className="font-medium">Statut :</span> {detailTransfert.statut}</p>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setDetailTransfert(null)} className="px-4 py-2 bg-[#472EAD] text-white rounded">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmation suppression */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-[400px] rounded-lg shadow-lg p-6 space-y-4 text-center">
              <p className="text-lg">Voulez-vous vraiment supprimer cette demande ?</p>
              <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded">Annuler</button>
                <button onClick={supprimerTransfert} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transferts;

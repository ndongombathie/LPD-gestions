import React, { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";

const Alertes = () => {
  // --- Données fictives statiques ---
  const [produits] = useState([
    {
      id: 1,
      nom: "Savon OMO",
      categorie: "Hygiène",
      quantite: 5,
      prix_seuil: 10,
    },
    {
      id: 2,
      nom: "Lait en poudre",
      categorie: "Alimentation",
      quantite: 2,
      prix_seuil: 4,
    },
    {
      id: 3,
      nom: "Chargeur Type-C",
      categorie: "Électronique",
      quantite: 15,
      prix_seuil: 10,
    },
  ]);

  // Produits en alerte
  const alertes = produits.filter((p) => p.quantite <= p.prix_seuil);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto scrollbar-hide">
      
      {/* Navbar fixe */}
      <div className="fixed top-0 left-64 right-0 h-16 bg-white z-50 shadow">
        <Navbar />
      </div>

      {/* Contenu principal */}
      <div className="pt-[100px] px-6 space-y-6">

        <h2 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
          <AlertTriangle className="text-[#F58020]" />
          Produits en alerte
        </h2>

        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white z-10 border-b">
              <tr className="text-left text-[#111827]">
                <th className="py-2">Nom</th>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Seuil</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {/* Aucun produit */}
              {alertes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-gray-500"
                  >
                    Aucun produit en alerte
                  </td>
                </tr>
              )}

              {/* Produits en alerte */}
              {alertes.map((p) => (
                <tr key={p.id} className="border-b hover:bg-[#F3F4F6]">
                  <td className="py-3">{p.nom}</td>
                  <td>{p.categorie}</td>
                  <td>{p.quantite}</td>
                  <td>{p.prix_seuil}</td>
                  <td className="text-right">
                    <button
                    
                      className="px-4 py-1 bg-[#472EAD] text-white rounded-lg flex items-center gap-2 hover:bg-[#3b2594] ml-auto"
                    >
                      <RefreshCw size={16} />
                      Réapprovisionner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
};

export default Alertes;

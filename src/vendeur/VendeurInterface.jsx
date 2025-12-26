import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import TableauDeBord from "./TableauDeBord";
import NouvelleCommande from "./pages/NouvelleCommande";
import HistoriqueCommandes from "./pages/HistoriqueCommandes";
import Footer from "./Footer";
import "./css/VendeurInterface.css";

const VendeurInterface = () => {
  const [sectionActive, setSectionActive] = useState("tableau-de-bord");
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // 🔐 Charger l'utilisateur connecté
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    chargerProduitsDepuisStock();
    chargerHistoriqueCommandes();
  }, []);

  /* ======================================================
     👤 UTILISATEUR
  ====================================================== */
  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  /* ======================================================
     📦 PRODUITS
  ====================================================== */
  const chargerProduitsDepuisStock = async () => {
    const produitsSimules = [
      {
        id: 1,
        nom: "Bloc Note",
        code_barre: "694689174174",
        reference: "Mood diary",
        prix: 350,
        stock: 15,
        categorie: "Etudes",
        tva: 18,
      },
      {
        id: 2,
        nom: "Bouteille d'eau 1.5L",
        code_barre: "6044000268101",
        reference: "Paix-peace-1.5L",
        prix: 400,
        stock: 50,
        categorie: "Alimentaires",
        tva: 18,
      },
    ];
    setProduits(produitsSimules);
  };

  /* ======================================================
     🧾 COMMANDES
  ====================================================== */
  const chargerHistoriqueCommandes = async () => {
    const commandesSimulees = [
      {
        id: 1,
        numero_commande: "CMD-2024-001",
        total_ttc: 47200,
        statut: "complétée",
        created_at: "2024-01-15T10:30:00",
      },
    ];
    setHistoriqueCommandes(commandesSimulees);
  };

  const gererCommandeValidee = (nouvelleCommande) => {
    setHistoriqueCommandes((prev) => [nouvelleCommande, ...prev]);
    setPanier([]);
    alert(`✅ Commande ${nouvelleCommande.numero_commande} envoyée`);
  };

  /* ======================================================
     🚪 DÉCONNEXION (LA PARTIE LA + IMPORTANTE)
  ====================================================== */
  const handleLogout = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;

    console.log("🔒 Déconnexion...");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirection forcée
    window.location.replace("/login");
  };

  // ⛔ Sécurité : tant que l'user n'est pas chargé
  if (!currentUser) return null;

  return (
    <div className="vendeur-interface">
      <Sidebar
        sectionActive={sectionActive}
        setSectionActive={setSectionActive}
        user={currentUser}
      />

      <div className="main-content">
        <Header
          onLogout={handleLogout}
          user={currentUser}
          commandes={historiqueCommandes}
          onUpdateUser={handleUpdateUser}
        />

        <main className="vendeur-contenu-principal">
          {sectionActive === "tableau-de-bord" && (
            <TableauDeBord
              user={currentUser}
              commandes={historiqueCommandes}
              produits={produits}
            />
          )}

          {sectionActive === "nouvelle-commande" && (
            <NouvelleCommande
              panier={panier}
              setPanier={setPanier}
              produits={produits}
              onCommandeValidee={gererCommandeValidee}
              user={currentUser}
            />
          )}

          {sectionActive === "historique-commandes" && (
            <HistoriqueCommandes
              commandes={historiqueCommandes}
              user={currentUser}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default VendeurInterface;

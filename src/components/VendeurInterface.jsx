import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import TableauDeBord from './TableauDeBord';
import NouvelleCommande from './NouvelleCommande';
import HistoriqueCommandes from './HistoriqueCommandes';
import Footer from './Footer'; // Import du footer
import './VendeurInterface.css';

const VendeurInterface = () => {
  const [sectionActive, setSectionActive] = useState('tableau-de-bord');
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: "Loup Zou",
    email: "loup.zou@lpd.com",
    role: "Vendeur",
    store: "Boutique Principale",
    telephone: "+221 77 123 45 67",
    photo: null
  });

  // Simuler la récupération des produits depuis l'API du gestionnaire de stock
  useEffect(() => {
    chargerProduitsDepuisStock();
    chargerHistoriqueCommandes();
    chargerDonneesUtilisateur();
  }, []);

  const chargerDonneesUtilisateur = async () => {
    try {
      // Charger depuis le localStorage si disponible
      const savedUser = localStorage.getItem('lpd_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('Utilisateur chargé depuis localStorage:', userData);
        setCurrentUser(userData);
        return;
      }

      // Sinon, utiliser les données par défaut
      const userData = {
        id: 1,
        name: "Loup Zou",
        email: "loup.zou@lpd.com",
        role: "Vendeur",
        store: "Boutique Principale",
        telephone: "+221 77 176 87 73",
        photo: null,
        last_login: new Date().toISOString()
      };
      setCurrentUser(userData);
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('lpd_user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  // Fonction pour mettre à jour les informations utilisateur
  const handleUpdateUser = (updatedUser) => {
    console.log('Mise à jour utilisateur reçue dans VendeurInterface:', updatedUser);
    
    try {
      // Mettre à jour l'état local
      setCurrentUser(updatedUser);
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('lpd_user', JSON.stringify(updatedUser));
      
      console.log('✅ Utilisateur mis à jour avec succès dans VendeurInterface');
    } catch (error) {
      console.error('❌ Erreur mise à jour utilisateur:', error);
    }
  };

  const chargerProduitsDepuisStock = async () => {
    try {
      // Simulation d'appel API vers le microservice stock
      const produitsSimules = [
        {
          id: 1,
          nom: "Bloc Note",
          code_barre: "694689174174",
          reference: "Mood diary",
          prix: 350,
          prix_seuil: 300,
          prix_gros: 3000,
          prix_seuil_gros: 2500,
          stock: 15,
          seuil_alerte: 5,
          categorie: "Etudes",
          tva: 18
        },
        {
          id: 2,
          nom: "Bouteille d'eau 1.5L",
          code_barre: "6044000268101",
          reference: "Paix-peace-1.5L",
          prix: 400,
          prix_seuil: 350,
          prix_gros: 3750,
          prix_seuil_gros: 3000,
          stock: 50,
          seuil_alerte: 35,
          categorie: "Alimentaires",
          tva: 18
        },
        {
          id: 3,
          nom: "Cahier 200 pages",
          code_barre: "1234567890123",
          reference: "CAH-200-M",
          prix: 1200,
          prix_seuil: 1000,
          prix_gros: 10000,
          prix_seuil_gros: 8500,
          stock: 25,
          seuil_alerte: 10,
          categorie: "Etudes",
          tva: 18
        },
        {
          id: 4,
          nom: "Stylo Bic Bleu",
          code_barre: "9876543210987",
          reference: "BIC-BLEU-M",
          prix: 150,
          prix_seuil: 120,
          prix_gros: 1200,
          prix_seuil_gros: 1000,
          stock: 100,
          seuil_alerte: 20,
          categorie: "Etudes",
          tva: 18
        },
        {
          id: 5,
          nom: "Aggraffes",
          code_barre: "8901057524421",
          reference: "Agg-NO-384556",
          prix: 500,
          prix_seuil: 400,
          prix_gros: 1000,
          prix_seuil_gros: 900,
          stock: 10,
          seuil_alerte: 2,
          categorie: "Outils",
          tva: 18
        },
        {
          id: 6,
          nom: "Seo",
          code_barre: "7725765594207",
          reference: "Bouteille d'eau",
          prix: 400,
          prix_seuil: 375,
          prix_gros: 3800,
          prix_seuil_gros: 3500,
          stock: 10,
          seuil_alerte: 2,
          categorie: "Alimentaires",
          tva: 18
        },
      ];
      setProduits(produitsSimules);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const chargerHistoriqueCommandes = async () => {
    try {
      // Simulation d'appel API vers le microservice commandes
      const commandesSimulees = [
        {
          id: 1,
          numero_commande: 'CMD-2024-001',
          client_nom: 'Marie Diop',
          client_telephone: '77 123 45 67',
          total_ht: 40000,
          total_ttc: 47200,
          tva: 7200,
          statut: 'complétée',
          type_vente: 'détail',
          created_at: '2024-01-15T10:30:00',
          produits: [
            { nom: 'Sac à Main Cuir Noir', quantite: 1, prix_unitaire: 25000, prix_vente: 25000 },
            { nom: 'Chemise Homme Blanche', quantite: 1, prix_unitaire: 15000, prix_vente: 15000 }
          ]
        },
        {
          id: 2,
          numero_commande: 'CMD-2024-002',
          client_nom: 'Abdoulaye Sow',
          client_telephone: '76 234 56 78',
          total_ht: 15000,
          total_ttc: 17700,
          tva: 2700,
          statut: 'en attente',
          type_vente: 'détail',
          created_at: '2024-01-15T14:20:00',
          produits: [
            { nom: 'Cahier 200 pages', quantite: 2, prix_unitaire: 1200, prix_vente: 2400 },
            { nom: 'Stylo Bic Bleu', quantite: 5, prix_unitaire: 150, prix_vente: 750 },
            { nom: 'Bloc Note', quantite: 3, prix_unitaire: 350, prix_vente: 1050 }
          ]
        },
        {
          id: 3,
          numero_commande: 'CMD-2024-003',
          client_nom: 'Entreprise SARL',
          client_telephone: '33 864 25 00',
          total_ht: 125000,
          total_ttc: 147500,
          tva: 22500,
          statut: 'complétée',
          type_vente: 'gros',
          created_at: '2024-01-14T09:15:00',
          produits: [
            { nom: 'Bouteille d\'eau 1.5L', quantite: 50, prix_unitaire: 375, prix_vente: 18750 },
            { nom: 'Kirene', quantite: 30, prix_unitaire: 380, prix_vente: 11400 }
          ]
        }
      ];
      setHistoriqueCommandes(commandesSimulees);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const gererCommandeValidee = async (nouvelleCommande) => {
    try {
      // Simulation d'envoi vers le microservice caisse
      console.log('📨 Envoi commande au caissier:', nouvelleCommande);

      // Ajouter à l'historique local
      setHistoriqueCommandes(prev => [nouvelleCommande, ...prev]);

      // Vider le panier
      setPanier([]);

      alert(`✅ Commande ${nouvelleCommande.numero_commande} envoyée au caissier avec succès !`);

    } catch (error) {
      console.error('Erreur envoi commande:', error);
      alert('❌ Erreur lors de l\'envoi de la commande au caissier');
    }
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      console.log('Déconnexion en cours...');
      setIsLoggedIn(false);
      
      // Nettoyer le localStorage si nécessaire
      // localStorage.removeItem('lpd_user');
      
      // Simulation de redirection après déconnexion
      setTimeout(() => {
        alert('Vous avez été déconnecté avec succès');
        // Ici vous redirigeriez vers la page de login
        // window.location.href = '/login';
      }, 1000);
    }
  };

  // Si l'utilisateur n'est pas connecté, afficher la page de login
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>LPD Manager</h1>
          <p>Interface Vendeur</p>
          <p className="login-message">Vous avez été déconnecté</p>
          <button 
            className="btn-login"
            onClick={() => setIsLoggedIn(true)}
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vendeur-interface">
      <Sidebar
        sectionActive={sectionActive}
        setSectionActive={setSectionActive}
        user={currentUser}
      />

      <div className="main-content">
        <Header
          sectionActive={sectionActive}
          setSectionActive={setSectionActive}
          onLogout={handleLogout}
          user={currentUser}
          commandes={historiqueCommandes}
          onUpdateUser={handleUpdateUser}
        />

        <main className="vendeur-contenu-principal">
          {sectionActive === 'tableau-de-bord' && (
            <TableauDeBord 
              user={currentUser}
              commandes={historiqueCommandes}
              produits={produits}
            />
          )}
          
          {sectionActive === 'nouvelle-commande' && (
            <NouvelleCommande
              panier={panier}
              setPanier={setPanier}
              produits={produits}
              onCommandeValidee={gererCommandeValidee}
              user={currentUser}
            />
          )}

          {sectionActive === 'historique-commandes' && (
            <HistoriqueCommandes
              commandes={historiqueCommandes}
              user={currentUser}
            />
          )}
        </main>
      </div>

      {/* Footer en position fixed */}
      <Footer />
    </div>
  );
};

export default VendeurInterface;
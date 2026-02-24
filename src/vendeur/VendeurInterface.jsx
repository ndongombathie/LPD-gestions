import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import TableauDeBord from './TableauDeBord';
import NouvelleCommande from './pages/NouvelleCommande';
import HistoriqueCommandes from './pages/HistoriqueCommandes';
import Footer from './Footer';
import './css/VendeurInterface.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const VendeurInterface = () => {
  const [sectionActive, setSectionActive] = useState('tableau-de-bord');
  const [panier, setPanier] = useState([]);
  const [produits, setProduits] = useState([]);
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    chargerProduitsDepuisStock();
    chargerHistoriqueCommandes();
    chargerDonneesUtilisateur();
  }, []);

  // Gestion de la fermeture du sidebar lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer le sidebar quand on change de section sur mobile
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  }, [sectionActive]);

  const chargerDonneesUtilisateur = async () => {
    try {
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        const apiUser = JSON.parse(userStr);
        
        const mappedUser = {
          id: apiUser.id,
          prenom: apiUser.prenom || '',
          nom: apiUser.nom || '',
          name: `${apiUser.prenom || ''} ${apiUser.nom || ''}`.trim(),
          email: apiUser.email || '',
          role: apiUser.role || 'vendeur',
          telephone: apiUser.telephone || '',
          adresse: apiUser.adresse || '',
          numero_cni: apiUser.numero_cni || '',
          boutique_id: apiUser.boutique_id || '',
          store: apiUser.boutique_id || 'Boutique Principale',
          photo: apiUser.photo || null,
          is_online: apiUser.is_online || false,
          last_seen_at: apiUser.last_seen_at,
          created_at: apiUser.created_at,
        };
        
        setCurrentUser(mappedUser);
        return;
      }

      const defaultUser = {
        id: null,
        name: "Utilisateur",
        prenom: "Utilisateur",
        nom: "",
        email: "user@lpd.com",
        role: "vendeur",
        store: "Boutique",
        telephone: "",
        photo: null,
      };
      setCurrentUser(defaultUser);
      
    } catch (error) {
      console.error('❌ Erreur chargement données utilisateur:', error);
      setCurrentUser({
        id: null,
        name: "Utilisateur",
        prenom: "Utilisateur",
        nom: "",
        email: "user@lpd.com",
        role: "vendeur",
        store: "Boutique",
        telephone: "",
        photo: null,
      });
    }
  };

  const handleUpdateUser = (updatedUser) => {
    try {
      setCurrentUser(updatedUser);
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const apiUser = JSON.parse(userStr);
        
        const updatedApiUser = {
          ...apiUser,
          prenom: updatedUser.prenom || updatedUser.name?.split(' ')[0] || apiUser.prenom,
          nom: updatedUser.nom || updatedUser.name?.split(' ').slice(1).join(' ') || apiUser.nom,
          email: updatedUser.email || apiUser.email,
          telephone: updatedUser.telephone || apiUser.telephone,
          adresse: updatedUser.adresse || apiUser.adresse,
          photo: updatedUser.photo !== undefined ? updatedUser.photo : apiUser.photo,
        };
        
        localStorage.setItem('user', JSON.stringify(updatedApiUser));
      }
      
    } catch (error) {
      console.error('❌ Erreur mise à jour utilisateur:', error);
    }
  };

  const chargerProduitsDepuisStock = async () => {
    try {
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
      console.log('📨 Envoi commande au caissier:', nouvelleCommande);
      setHistoriqueCommandes(prev => [nouvelleCommande, ...prev]);
      setPanier([]);
      alert(`✅ Commande ${nouvelleCommande.numero_commande} envoyée au caissier avec succès !`);
    } catch (error) {
      console.error('Erreur envoi commande:', error);
      alert('❌ Erreur lors de l\'envoi de la commande au caissier');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
      setPanier([]);
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="vendeur-interface">
      {/* Overlay pour mobile quand le sidebar est ouvert */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      
      <Sidebar
        sectionActive={sectionActive}
        setSectionActive={setSectionActive}
        user={currentUser}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="main-content">
        <Header
          user={currentUser}
          onLogout={handleLogout}
          onMenuClick={toggleSidebar}
          sidebarOpen={sidebarOpen}
          sectionActive={sectionActive}
          setSectionActive={setSectionActive}
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

      <Footer />
    </div>
  );
};

export default VendeurInterface;
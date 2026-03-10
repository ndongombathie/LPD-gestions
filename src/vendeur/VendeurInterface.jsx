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
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    chargerProduitsDepuisStock();
    chargerHistoriqueCommandes();
    chargerDonneesUtilisateur();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    }
  };

  const chargerProduitsDepuisStock = async () => {
    try {
      setProduits([]);
    } catch (error) {
    }
  };

  const chargerHistoriqueCommandes = async () => {
    try {
      setHistoriqueCommandes([]);
    } catch (error) {
    }
  };

  const gererCommandeValidee = async (nouvelleCommande) => {
    try {
      setHistoriqueCommandes(prev => [nouvelleCommande, ...prev]);
      setPanier([]);
    } catch (error) {
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        await logout();
      } catch (error) {
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
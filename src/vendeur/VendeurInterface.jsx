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
  const [loadingProduits, setLoadingProduits] = useState(true);

  const navigate = useNavigate();
  const { logout } = useAuth();

  /* =========================
     CHARGEMENT INITIAL
  ========================== */
  useEffect(() => {
    chargerDonneesUtilisateur();
    chargerProduitsDepuisStock();
    chargerHistoriqueCommandes();
  }, []);

  /* =========================
     UTILISATEUR
  ========================== */
  const chargerDonneesUtilisateur = () => {
    try {
      const userStr = localStorage.getItem('user');

      if (!userStr) return;

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
        boutique_id: apiUser.boutique_id,
        store: apiUser.boutique?.nom || 'Boutique',
        photo: apiUser.photo || null,
      };

      setCurrentUser(mappedUser);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur', error);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);

    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const apiUser = JSON.parse(userStr);

    localStorage.setItem(
      'user',
      JSON.stringify({
        ...apiUser,
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        email: updatedUser.email,
        telephone: updatedUser.telephone,
        adresse: updatedUser.adresse,
        photo: updatedUser.photo,
      })
    );
  };

  /* =========================
     PRODUITS (API LARAVEL)
  ========================== */
  const chargerProduitsDepuisStock = async () => {
    try {
      setLoadingProduits(true);

      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/api/produits', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur chargement produits');
      }

      const data = await response.json();
      setProduits(data.data || data);
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
    } finally {
      setLoadingProduits(false);
    }
  };

  /* =========================
     HISTORIQUE COMMANDES
  ========================== */
  const chargerHistoriqueCommandes = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/api/commandes', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setHistoriqueCommandes(data.data || data);
    } catch (error) {
      console.error('❌ Erreur historique commandes', error);
    }
  };

  /* =========================
     COMMANDE VALIDÉE
  ========================== */
  const gererCommandeValidee = (nouvelleCommande) => {
    setHistoriqueCommandes((prev) => [nouvelleCommande, ...prev]);
    setPanier([]);
    alert(`✅ Commande ${nouvelleCommande.numero_commande} envoyée au caissier`);
  };

  /* =========================
     DÉCONNEXION
  ========================== */
  const handleLogout = async () => {
    if (!window.confirm('Voulez-vous vous déconnecter ?')) return;

    try {
      await logout();
    } catch (error) {
      console.error(error);
    }

    setPanier([]);
    navigate('/login');
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="vendeur-interface">
      {currentUser && (
        <Sidebar
          sectionActive={sectionActive}
          setSectionActive={setSectionActive}
          user={currentUser}
        />
      )}

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
            loadingProduits ? (
              <p className="loading">⏳ Chargement des produits...</p>
            ) : (
              <NouvelleCommande
                panier={panier}
                setPanier={setPanier}
                produits={produits}
                onCommandeValidee={gererCommandeValidee}
                user={currentUser}
              />
            )
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

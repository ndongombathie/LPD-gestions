import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignOutAlt, 
  faStore, 
  faCalendarAlt,
  faMoneyBillWave,
  faUser,
  faUserTie,
  faKey,
  faChevronDown,
  faChevronUp,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import './Header.css';

// Composant Header - édition du nom DISABLED. Seul le mot de passe peut être modifié via "Modifier le mot de passe".
const Header = ({ sectionActive, setSectionActive, onLogout, user, commandes, onUpdateUser }) => {
  const [ventesDuJour, setVentesDuJour] = useState(0);
  const [menuUtilisateurOuvert, setMenuUtilisateurOuvert] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(null); // only used for password modal
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const menuRef = useRef(null);
  const modalRef = useRef(null);

  // Fermer le menu/modal quand on clique ailleurs
  useEffect(() => {
    const handleClickExterieur = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuUtilisateurOuvert(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target) && modalOuvert) {
        setModalOuvert(null);
      }
    };

    document.addEventListener('mousedown', handleClickExterieur);
    return () => {
      document.removeEventListener('mousedown', handleClickExterieur);
    };
  }, [modalOuvert]);

  // Calculer les ventes du jour
  useEffect(() => {
    calculerVentesDuJour();
  }, [commandes]);

  const calculerVentesDuJour = () => {
    const aujourdhui = new Date().toDateString();
    const ventesAujourdhui = commandes?.filter(commande => {
      const dateCommande = new Date(commande.created_at).toDateString();
      return dateCommande === aujourdhui && commande.statut === 'complétée';
    }) || [];

    const totalVentes = ventesAujourdhui.reduce((total, commande) => {
      return total + (commande.total_ttc || 0);
    }, 0);

    setVentesDuJour(totalVentes);
  };

  // Formater le montant en FCFA
  const formaterMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };

  // Ouvrir/fermer menu utilisateur
  const toggleMenuUtilisateur = () => {
    setMenuUtilisateurOuvert(!menuUtilisateurOuvert);
  };

  // Ouvrir le modal de modification du mot de passe
  const handleModifierMotDePasse = () => {
    setMenuUtilisateurOuvert(false);
    setModalOuvert('password');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage({ type: '', text: '' });
  };

  // Fermer le modal
  const fermerModal = () => {
    setModalOuvert(null);
    setMessage({ type: '', text: '' });
  };

  // Gérer les changements dans le formulaire de mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Valider le formulaire de mot de passe
  const validerMotDePasse = () => {
    if (!passwordData.currentPassword) {
      setMessage({ type: 'error', text: 'Le mot de passe actuel est obligatoire' });
      return false;
    }
    if (!passwordData.newPassword) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe est obligatoire' });
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return false;
    }
    return true;
  };

  // Soumettre la modification du mot de passe
  const soumettreMotDePasse = async () => {
    if (!validerMotDePasse()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Simuler un appel API (remplacez par votre appel réel)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });

      // Réinitialiser le formulaire et fermer le modal après 2 secondes
      setTimeout(() => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setModalOuvert(null);
        setMessage({ type: '', text: '' });
      }, 2000);

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erreur lors de la modification du mot de passe' });
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const handleDeconnexion = () => {
    setMenuUtilisateurOuvert(false);
    onLogout();
  };

  return (
    <header className="vendeur-header">
      <div className="header-ligne-superieure">
        <div className="header-gauche">
          <div className="header-info">
            <h1 className="header-titre">
              <FontAwesomeIcon icon={faStore} className="header-icon" />
              Librairie Papeterie Daradji
            </h1>
            <span className="header-sous-titre">
              <FontAwesomeIcon icon={faStore} className="sous-titre-icon" />
              {user?.store || 'Boutique Principale'} • 
              <FontAwesomeIcon icon={faCalendarAlt} className="sous-titre-icon" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
        
        <div className="header-droite">
          <div className="header-indicateurs">
            <div className="indicateur-ventes">
              <span className="indicateur-label">
                <FontAwesomeIcon icon={faMoneyBillWave} className="indicateur-icon" />
                Ventes du jour
              </span>
              <span className="indicateur-valeur">{formaterMontant(ventesDuJour)}</span>
            </div>
          </div>
          
          {/* Section Utilisateur avec Menu Déroulant - only password modification allowed */}
          <div className="utilisateur-section" ref={menuRef}>
            <div 
              className="utilisateur-info clickable"
              onClick={toggleMenuUtilisateur}
            >
              <div className="utilisateur-avatar">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="avatar-image" />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="avatar-icon" />
                )}
              </div>
              <div className="utilisateur-details">
                <span className="utilisateur-nom">
                  <FontAwesomeIcon icon={faUser} className="user-icon" />
                  {user?.name || 'Utilisateur'}
                </span>
                <span className="utilisateur-role">
                  <FontAwesomeIcon icon={faUserTie} className="role-icon" />
                  {user?.role || 'Vendeur'}
                </span>
              </div>
              <FontAwesomeIcon 
                icon={menuUtilisateurOuvert ? faChevronUp : faChevronDown} 
                className="menu-chevron" 
              />
            </div>
            
            {/* Menu Déroulant */}
            {menuUtilisateurOuvert && (
              <div className="menu-utilisateur">
                <div className="menu-header">
                  <div className="menu-utilisateur-info">
                    <div className="menu-avatar">
                      {user?.photo ? (
                        <img src={user.photo} alt="Profile" className="menu-avatar-image" />
                      ) : (
                        <FontAwesomeIcon icon={faUser} className="menu-avatar-icon" />
                      )}
                    </div>
                    <div className="menu-details">
                      <span className="menu-nom">{user?.name || 'Utilisateur'}</span>
                      <span className="menu-role">{user?.role || 'Vendeur'}</span>
                      <span className="menu-boutique">{user?.store || 'Boutique Principale'}</span>
                      {user?.email && <span className="menu-email">{user.email}</span>}
                      {user?.telephone && <span className="menu-telephone">{user.telephone}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="menu-separateur"></div>
                
                <div className="menu-options">
                  {/* Only password change allowed in profile */}
                  <button 
                    className="menu-option"
                    onClick={handleModifierMotDePasse}
                  >
                    <FontAwesomeIcon icon={faKey} className="option-icon" />
                    <span className="option-text">Modifier le mot de passe</span>
                  </button>
                </div>
                
                <div className="menu-separateur"></div>
                
                <div className="menu-actions">
                  <button 
                    className="menu-action deconnexion"
                    onClick={handleDeconnexion}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="action-icon" />
                    <span className="action-text">Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de modification du mot de passe */}
      {modalOuvert === 'password' && (
        <div className="modal-overlay">
          <div className="modal" ref={modalRef}>
            <div className="modal-header">
              <h3>
                <FontAwesomeIcon icon={faKey} className="modal-icon" />
                Modifier le mot de passe
              </h3>
              <button className="modal-close" onClick={fermerModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}
              
              <div className="form-password">
                <div className="form-group">
                  <label>Mot de passe actuel *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Entrez votre mot de passe actuel"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nouveau mot de passe *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Entrez le nouveau mot de passe"
                  />
                  <small>Minimum 6 caractères</small>
                </div>
                
                <div className="form-group">
                  <label>Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirmez le nouveau mot de passe"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={fermerModal}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTimes} />
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={soumettreMotDePasse}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faSave} />
                {loading ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
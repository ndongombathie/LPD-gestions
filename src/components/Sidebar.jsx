import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, 
  faShoppingCart, 
  faHistory,
  faUser,
  faStore,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ sectionActive, setSectionActive, user }) => {
  // Logo en base64
  const logoBase64 = "data:image/png;base64,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";

  const menuItems = [
    {
      id: 'tableau-de-bord',
      label: 'Tableau de bord',
      icone: faTachometerAlt,
      
    },
    {
      id: 'nouvelle-commande',
      label: 'Nouvelle commande',
      icone: faShoppingCart,
      badge: null
    },
    {
      id: 'historique-commandes',
      label: 'Historique',
      icone: faHistory,
      badge: '5'
    }
  ];

  // Fonction pour obtenir les initiales de l'utilisateur (identique au Header)
  const getInitialesUtilisateur = () => {
    if (!user?.name) {
      return 'LZ'; // Fallback si pas d'info utilisateur
    }
    
    // Séparer le nom complet en mots
    const mots = user.name.trim().split(' ');
    
    if (mots.length === 1) {
      // Si un seul mot, prendre les 2 premières lettres
      return mots[0].substring(0, 2).toUpperCase();
    } else {
      // Si plusieurs mots, prendre la première lettre du premier et dernier mot
      return (mots[0].charAt(0) + mots[mots.length - 1].charAt(0)).toUpperCase();
    }
  };

  // Fonction pour obtenir le nom complet (identique au Header)
  const getNomComplet = () => {
    return user?.name || 'Utilisateur';
  };

  // Fonction pour obtenir le rôle (identique au Header)
  const getRole = () => {
    return user?.role || 'Vendeur';
  };

  return (
    <aside className="sidebar">
      {/* Logo et nom de l'application */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img 
            src={logoBase64} 
            alt="LPD Manager" 
            className="logo-image"
          />
          <div className="logo-text">
            <span className="app-name">LPD Manager</span>
            <span className="app-version">Vendeur</span>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="section-label">
            <FontAwesomeIcon icon={faBars} className="section-label-icon" />
            NAVIGATION
          </span>
          <ul className="nav-menu">
            {menuItems.map(item => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${sectionActive === item.id ? 'nav-link-active' : ''}`}
                  onClick={() => setSectionActive(item.id)}
                >
                  <span className="nav-icon">
                    <FontAwesomeIcon icon={item.icone} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Pied de sidebar */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <div className="user-avatar-initiales">
              {getInitialesUtilisateur()}
            </div>
          </div>
          <div className="user-details">
            <span className="user-name">{getNomComplet()}</span>
            <span className="user-role">{getRole()}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faShoppingCart,
  faDollarSign,
  faBox,
  faFire,
  faCalendarDay,
  faClock,
  faArrowUp,
  faArrowDown,
  faMinus,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import './css/TableauDeBord.css';

const TableauDeBord = () => {
  const [stats, setStats] = useState({
    ventesAujourdhui: 0,
    commandesTraitees: 0,
    produitsVendus: 0
  });

  const [produitsPopulaires, setProduitsPopulaires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerDonnees = () => {
      setLoading(true);
      
      // Simulation de chargement de données
      setTimeout(() => {
        setStats({
          ventesAujourdhui: 125420,
          commandesTraitees: 24,
          produitsVendus: 42
        });

        setProduitsPopulaires([
          {
            id: 1,
            nom: 'Sac à Main Cuir Noir',
            reference: 'SAC-CUIR-001',
            ventes: 28,
            revenu: 420000,
            tendance: 'up'
          },
          {
            id: 2,
            nom: 'Chemise Homme Blanche',
            reference: 'CHM-BLANC-001',
            ventes: 19,
            revenu: 285000,
            tendance: 'up'
          },
          {
            id: 3,
            nom: 'Parfum Luxury 100ml',
            reference: 'PARF-LUX-001',
            ventes: 15,
            revenu: 675000,
            tendance: 'stable'
          },
          {
            id: 4,
            nom: 'Montre Sport Étanche',
            reference: 'MONT-SPORT-002',
            ventes: 12,
            revenu: 360000,
            tendance: 'down'
          }
        ]);

        setLoading(false);
      }, 100);
    };

    chargerDonnees();

    // Mise à jour en temps réel
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        ventesAujourdhui: prev.ventesAujourdhui + Math.floor(Math.random() * 500),
        commandesTraitees: prev.commandesTraitees + 1
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getTendanceIcon = (tendance) => {
    switch (tendance) {
      case 'up': 
        return <FontAwesomeIcon icon={faArrowUp} />;
      case 'down': 
        return <FontAwesomeIcon icon={faArrowDown} />;
      default: 
        return <FontAwesomeIcon icon={faMinus} />;
    }
  };

  const getTendanceClass = (tendance) => {
    return `tendance-${tendance}`;
  };

  if (loading) {
    return (
      <div className="tableau-de-bord loading">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSync} spin />
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tableau-de-bord">
      {/* En-tête */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <FontAwesomeIcon icon={faChartLine} className="header-icon" />
            <h1>Tableau de Bord</h1>
          </div>
          <p className="header-description">Aperçu de votre activité</p>
        </div>
        
        <div className="header-info">
          <div className="time-display">
            <div className="current-date">
              <FontAwesomeIcon icon={faCalendarDay} />
              <span>
                {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="current-time">
              <FontAwesomeIcon icon={faClock} />
              <span>
                {new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques - 3 cartes */}
      <div className="stats-grid">
        <div className="stat-card revenue-card">
          <div className="card-icon">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="card-content">
            <h3>Ventes du Jour</h3>
            <div className="card-value">{stats.ventesAujourdhui.toLocaleString()} FCFA</div>
            <div className="card-trend positive">
              <FontAwesomeIcon icon={faArrowUp} />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        <div className="stat-card orders-card">
          <div className="card-icon">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <div className="card-content">
            <h3>Commandes</h3>
            <div className="card-value">{stats.commandesTraitees}</div>
            <div className="card-subtitle">Aujourd'hui</div>
          </div>
        </div>

        <div className="stat-card products-card">
          <div className="card-icon">
            <FontAwesomeIcon icon={faBox} />
          </div>
          <div className="card-content">
            <h3>Produits Vendus</h3>
            <div className="card-value">{stats.produitsVendus}</div>
            <div className="card-subtitle">Unités</div>
          </div>
        </div>
      </div>

      {/* Produits populaires */}
      <div className="popular-products-section">
        <div className="section-header">
          <div className="section-title">
            <FontAwesomeIcon icon={faFire} className="section-icon" />
            <h2>Produits Populaires</h2>
          </div>
          <span className="section-subtitle">Top des ventes du mois</span>
        </div>
        
        <div className="products-list">
          {produitsPopulaires.map(produit => (
            <div key={produit.id} className="product-item">
              <div className="product-main-info">
                <div className="product-name">{produit.nom}</div>
                <div className="product-sku">{produit.reference}</div>
              </div>
              
              <div className="product-stats">
                <div className="sales-count">
                  <strong>{produit.ventes}</strong> ventes
                </div>
                <div className="revenue-amount">
                  {produit.revenu.toLocaleString()} FCFA
                </div>
              </div>
              
              <div className={`product-trend ${getTendanceClass(produit.tendance)}`}>
                {getTendanceIcon(produit.tendance)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableauDeBord;
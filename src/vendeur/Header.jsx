import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "./css/Header.css";

const Header = ({ onLogout, user, commandes }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ventesDuJour, setVentesDuJour] = useState(0);

  const menuRef = useRef(null);

  // 🔁 Calcul ventes du jour
  useEffect(() => {
    const today = new Date().toDateString();
    const total = (commandes || [])
      .filter(
        (c) =>
          new Date(c.created_at).toDateString() === today &&
          c.statut === "complétée"
      )
      .reduce((sum, c) => sum + (c.total_ttc || 0), 0);

    setVentesDuJour(total);
  }, [commandes]);

  // 🔒 Fermer menu au clic extérieur
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatMoney = (n) =>
    new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

  return (
    <header className="vendeur-header">
      <div className="header-left">
        <h1>
          <FontAwesomeIcon icon={faStore} /> Librairie Papeterie Daradji
        </h1>
        <span>
          <FontAwesomeIcon icon={faCalendarAlt} />{" "}
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="header-right">
        <div className="ventes">
          <FontAwesomeIcon icon={faMoneyBillWave} />
          {formatMoney(ventesDuJour)}
        </div>

        {/* 👤 Utilisateur */}
        <div className="user-box" ref={menuRef}>
          <div className="user-info" onClick={() => setMenuOpen(!menuOpen)}>
            <FontAwesomeIcon icon={faUser} />
            <div>
              <strong>{user?.name}</strong>
              <small>
                <FontAwesomeIcon icon={faUserTie} /> {user?.role}
              </small>
            </div>
            <FontAwesomeIcon
              icon={menuOpen ? faChevronUp : faChevronDown}
            />
          </div>

          {menuOpen && (
            <div className="user-menu">
              <button onClick={() => setModalOpen(true)}>
                <FontAwesomeIcon icon={faKey} /> Modifier mot de passe
              </button>

              <button className="logout" onClick={onLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🔐 Modal mot de passe (UI seulement ici) */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              <FontAwesomeIcon icon={faKey} /> Modifier le mot de passe
            </h3>
            <button className="close" onClick={() => setModalOpen(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <input type="password" placeholder="Mot de passe actuel" />
            <input type="password" placeholder="Nouveau mot de passe" />
            <input type="password" placeholder="Confirmation" />

            <button className="save">
              <FontAwesomeIcon icon={faSave} /> Enregistrer
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

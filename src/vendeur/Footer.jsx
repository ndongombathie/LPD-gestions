import React from 'react';
import './css/Footer.css';

const Footer = () => {
const currentYear = new Date().getFullYear();

return (
  <footer className="vendeur-footer">
    <div className="footer-content">
      <span className="footer-text">
        © {currentYear} LPD Manager - Interface Vendeur
      </span>
    </div>
  </footer>
);
};

export default Footer;
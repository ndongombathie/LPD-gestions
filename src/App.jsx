// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Connexion from "./authentification/login/Connexion";          // adapte le chemin
import VendeurInterface from "./vendeur/VendeurInterface"; // adapte le chemin

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VendeurInterface />} />
        {/* <Route path="/login" element={<Connexion />} /> */}
        <Route path="/vendeur" element={<VendeurInterface />} />
      </Routes>
    </Router>
  );
}

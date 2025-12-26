// ==========================================================
// ⚙️ App.jsx — Entrée principale (multi-modules sécurisé)
// ==========================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Connexion from "./authentification/login/Connexion";

import ComptableApp from "./comptable/ComptableApp";
import AppResponsable from "./responsable/AppResponsable";
import VendeurInterface from "./vendeur/VendeurInterface";

import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔐 Connexion */}
        <Route path="/login" element={<Connexion />} />

        {/* 🧑‍💼 Vendeur */}
        <Route
          path="/vendeur/*"
          element={
            <ProtectedRoute allowedRoles={["vendeur"]}>
              <VendeurInterface />
            </ProtectedRoute>
          }
        />

        {/* 💰 Comptable */}
        <Route
          path="/comptable/*"
          element={
            <ProtectedRoute allowedRoles={["comptable"]}>
              <ComptableApp />
            </ProtectedRoute>
          }
        />

        {/* 🧠 Responsable */}
        <Route
          path="/responsable/*"
          element={
            <ProtectedRoute allowedRoles={["responsable"]}>
              <AppResponsable />
            </ProtectedRoute>
          }
        />

        {/* 🔁 Route par défaut */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

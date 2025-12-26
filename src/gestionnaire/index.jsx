import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import DecaissementsPage from './pages/DecaissementsPage';
import GestionnaireLayout from './layouts/GestionnaireLayout';

const GestionnaireRoutes = () => {
  return (
    <GestionnaireLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/gestionnaire/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/decaissements" element={<DecaissementsPage />} />
      </Routes>
    </GestionnaireLayout>
  );
};

export default GestionnaireRoutes;


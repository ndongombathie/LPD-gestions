import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CaissePage from './pages/CaissePage';
import RapportCaissePage from './pages/RapportCaissePage';
import HistoriquePage from './pages/HistoriquePage';
import DashboardPage from './pages/DashboardPage';
import DecaissementsPage from './pages/DecaissementsPage';
import CaissierLayout from './layouts/CaissierLayout';

const CaissierRoutes = () => {
  return (
    <CaissierLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/caissier/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/caisse" element={<CaissePage />} />
        <Route path="/decaissements" element={<DecaissementsPage />} />
        <Route path="/historique" element={<HistoriquePage />} />
        <Route path="/rapport" element={<RapportCaissePage />} />
      </Routes>
    </CaissierLayout>
  );
};

export default CaissierRoutes;


import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CaissierRoutes from './index.jsx'

function AppCaissier() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection par défaut vers le dashboard */}
        {/* <Route path="/" element={<Navigate to="/caissier/dashboard" replace />} /> */}

        {/* Module Caissier */}
        <Route path="/caissier/*" element={<CaissierRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}
export default AppCaissier

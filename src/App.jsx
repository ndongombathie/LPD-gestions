import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import CaissierRoutes from './caissier'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection par défaut vers le dashboard */}
        <Route path="/" element={<Navigate to="/caissier/dashboard" replace />} />

        {/* Module Caissier */}
        <Route path="/caissier/*" element={<CaissierRoutes />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/caissier/caisse" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

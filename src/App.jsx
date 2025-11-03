import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DepotLayout from './pages/depot/layout/DepotLayout';
import Dashboard from './pages/depot/dashboard/Dashboard';
import ProductsList from './pages/depot/products/ProductsList';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection racine vers /depot */}
        <Route path="/" element={<Navigate to="/depot" replace />} />
        
        <Route path="/depot" element={<DepotLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsList />} />
          {/* Décommentez ces routes quand vous créerez les pages : */}
          {/* <Route path="mouvementStock" element={<MouvementStock />} /> */}
          {/* <Route path="fournisseurs" element={<Fournisseurs />} /> */}
          {/* <Route path="reports" element={<Reports />} /> */}
          {/* <Route path="inventaire" element={<Inventaire />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
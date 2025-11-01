import React from 'react';
import DepotLayout from './pages/depot/layout/DepotLayout';
import Dashboard from './pages/depot/dashboard/Dashboard';

function App() {
  return (
    <DepotLayout>
      <Dashboard />
    </DepotLayout>
  );
}

export default App;
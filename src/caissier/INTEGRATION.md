# Guide d'intégration - Interface Caissier

## Installation des dépendances

Les composants utilisent React Router DOM. Assurez-vous qu'il est installé :

```bash
npm install react-router-dom
```

## Intégration dans App.jsx

Voici un exemple d'intégration dans votre application principale :

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CaissierRoutes from './caissier';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Vos autres routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Routes du caissier */}
        <Route path="/caissier/*" element={<CaissierRoutes />} />
        
        {/* Autres routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

## Structure recommandée

Pour une meilleure organisation, vous pouvez créer un layout spécifique pour le caissier :

```jsx
// src/caissier/layouts/CaissierLayout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CaissierLayout = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background-light">
      {/* Navigation spécifique au caissier */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/caissier/caisse"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/caissier/caisse'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Caisse
              </Link>
              <Link
                to="/caissier/rapport"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/caissier/rapport'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Rapport
              </Link>
              <Link
                to="/caissier/historique"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/caissier/historique'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Historique
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Contenu */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default CaissierLayout;
```

Puis modifier `caissier/index.jsx` :

```jsx
import CaissierLayout from './layouts/CaissierLayout';
// ... autres imports

const CaissierRoutes = () => {
  return (
    <CaissierLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/caissier/caisse" replace />} />
        <Route path="/caisse" element={<CaissePage />} />
        <Route path="/rapport" element={<RapportCaissePage />} />
        <Route path="/historique" element={<HistoriquePage />} />
      </Routes>
    </CaissierLayout>
  );
};
```

## Services API

Créez un service API pour centraliser les appels :

```jsx
// src/caissier/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const caissierApi = {
  // Récupérer les tickets en attente
  getPendingTickets: () => api.get('/tickets/pending'),
  
  // Encaisser un ticket
  encaisserTicket: (ticketId, data) => 
    api.post(`/tickets/${ticketId}/encaisser`, data),
  
  // Créer un décaissement
  createDecaissement: (data) => 
    api.post('/decaissements', data),
  
  // Récupérer le rapport journalier
  getRapportJournalier: (date) => 
    api.get(`/caisses-journal/${date}`),
  
  // Enregistrer le fond de caisse
  saveFondCaisse: (data) => 
    api.post('/caisses-journal', data),
  
  // Clôturer la caisse
  cloturerCaisse: (date, data) => 
    api.put(`/caisses-journal/${date}/cloture`, data),
  
  // Récupérer l'historique
  getHistorique: (params) => 
    api.get('/caissier/historique', { params }),
};

export default api;
```

Puis utilisez ce service dans vos composants :

```jsx
import { caissierApi } from '../services/api';

// Dans votre composant
const fetchTickets = async () => {
  try {
    const response = await caissierApi.getPendingTickets();
    setTickets(response.data);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## Configuration de l'environnement

Créez un fichier `.env` à la racine du projet :

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Protection des routes

Si vous utilisez un système d'authentification, protégez les routes :

```jsx
// src/caissier/components/ProtectedCaissierRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Votre hook d'authentification

const ProtectedCaissierRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'caissier') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};
```

Puis dans `App.jsx` :

```jsx
import ProtectedCaissierRoute from './caissier/components/ProtectedCaissierRoute';

<Route
  path="/caissier/*"
  element={
    <ProtectedCaissierRoute>
      <CaissierRoutes />
    </ProtectedCaissierRoute>
  }
/>
```

## Notes importantes

1. **Polling** : L'interface utilise actuellement un polling toutes les 5 secondes. Pour la production, remplacez par WebSockets.

2. **Gestion d'erreurs** : Ajoutez une gestion d'erreurs globale avec un toast/notification system.

3. **Performance** : Pour de grandes listes, implémentez la pagination ou la virtualisation.

4. **Accessibilité** : Assurez-vous que tous les composants sont accessibles (ARIA labels, navigation clavier, etc.).

## Prochaines étapes

1. Intégrer les services API réels
2. Ajouter la gestion d'erreurs
3. Implémenter WebSockets pour le temps réel
4. Ajouter des tests unitaires et d'intégration
5. Optimiser les performances


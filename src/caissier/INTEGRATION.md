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

Le projet utilise déjà une instance Axios centralisée (`src/services/http/client.js`) et un service caissier (`src/caissier/services/caissierApi.js`).
Les endpoints “dashboard/rapport” sont maintenant sous le préfixe `caissier/` :

- `GET /api/caissier/dashboard/stats`
- `GET /api/caissier/dashboard/ventes-par-moyen`
- `GET /api/caissier/dashboard/ventes-par-heure`
- `GET /api/caissier/caisses-journal/{date}`
- `POST /api/caissier/caisses-journal`
- `PUT /api/caissier/caisses-journal/{date}/cloture`

### Exemple (si vous devez l’utiliser ailleurs)

```jsx
// Exemple minimal (déjà implémenté dans src/caissier/services/caissierApi.js)
import { httpClient } from '../services/http/client';

export const caissierApi = {
  getDashboardStats: (date) => httpClient.get('/caissier/dashboard/stats', { params: { date } }),
  getVentesParMoyen: (date) => httpClient.get('/caissier/dashboard/ventes-par-moyen', { params: { date } }),
  getVentesParHeure: (date) => httpClient.get('/caissier/dashboard/ventes-par-heure', { params: { date } }),

  getCaisseJournal: (date) => httpClient.get(`/caissier/caisses-journal/${date}`),
  createCaisseJournal: (data) => httpClient.post('/caissier/caisses-journal', data),
  cloturerCaisse: (date, data) => httpClient.put(`/caissier/caisses-journal/${date}/cloture`, data),
};
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
VITE_API_URL=http://localhost:8000/api
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


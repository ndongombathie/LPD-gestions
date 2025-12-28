# 🗺️ Architecture des Routes - LPD Gestion

## 📋 Vue d'ensemble

L'application utilise une architecture centralisée pour la gestion des routes avec React Router v6. Toutes les routes sont définies dans un seul fichier `Routes.jsx` pour une meilleure maintenabilité et lisibilité.

## 🏗️ Structure

```
src/
├── App.jsx                         # Point d'entrée avec BrowserRouter
├── Routes.jsx                      # Configuration centralisée des routes
├── components/
│   └── ProtectedRoute.jsx         # Composant de protection par rôle
└── [modules]/
    ├── Layout[Module].jsx         # Layout de chaque module
    └── pages/                     # Pages du module
```

## 🔐 Système d'authentification

### 1. Connexion
- Route : `/login`
- Composant : `Connexion.jsx`
- Gère l'authentification via API Laravel Sanctum
- Stocke le token et les infos utilisateur dans localStorage
- Redirige automatiquement selon le rôle

### 2. Protection des routes
Le composant `ProtectedRoute` protège les routes selon deux critères :
- **Authentification** : Vérifie la présence d'un token
- **Autorisation** : Vérifie que le rôle correspond aux rôles autorisés

```jsx
<ProtectedRoute allowedRoles={["responsable"]}>
  <LayoutResponsable />
</ProtectedRoute>
```

## 👥 Rôles et Routes

### Responsable
- **Base URL** : `/responsable`
- **Rôle requis** : `responsable`
- **Pages disponibles** :
  - Dashboard
  - Utilisateurs
  - Fournisseurs
  - Clients spéciaux
  - Commandes
  - Inventaire
  - Rapports
  - Décaissements
  - Journal d'activités

### Comptable
- **Base URL** : `/comptable`
- **Rôle requis** : `comptable`
- **Pages disponibles** :
  - Dashboard
  - Gestion standard (utilisateurs, fournisseurs, etc.)
  - Contrôle caissier (journal, versements)
  - Contrôle gestionnaire (boutique, dépôt, responsable)
  - Inventaires (dépôt, boutique, historique)
  - Contrôle des ventes

### Gestionnaire Boutique
- **Base URL** : `/gestionnaire-boutique`
- **Rôle requis** : `gestionnaire`
- **Pages disponibles** :
  - Dashboard
  - Produits
  - Stock
  - Historique/Transferts
  - Alertes
  - Rapports

### Gestionnaire Dépôt
- **Base URL** : `/depot`
- **Rôle requis** : `gestionnaire`
- **Pages disponibles** :
  - Dashboard
  - Produits
  - Mouvements de stock
  - Fournisseurs
  - Rapports

### Caissier
- **Base URL** : `/caissier`
- **Rôle requis** : `caissier`
- **Pages disponibles** :
  - Dashboard
  - Caisse
  - Décaissements
  - Historique
  - Rapport

## 🔄 Flux d'authentification

1. **Connexion** (`/login`)
   ```
   Utilisateur → API Login → Token + User Info → localStorage
   ```

2. **Redirection automatique**
   ```javascript
   // Dans Connexion.jsx
   const redirectByRole = (role) => {
     switch (role.toLowerCase()) {
       case "responsable": return "/responsable/dashboard";
       case "comptable": return "/comptable/dashboard";
       case "gestionnaire": return "/gestionnaire-boutique/dashboard";
       case "caissier": return "/caissier/dashboard";
       default: return "/login";
     }
   };
   ```

3. **Protection des routes**
   ```
   Requête → ProtectedRoute → Vérifie token → Vérifie rôle → Autorise/Redirige
   ```

## 🚀 Avantages de cette architecture

### ✅ Centralisation
- Toutes les routes au même endroit
- Vue d'ensemble claire de la structure
- Maintenance simplifiée

### ✅ Sécurité
- Protection automatique par rôle
- Vérification du token à chaque navigation
- Redirection automatique si non autorisé

### ✅ Évolutivité
- Ajout facile de nouveaux rôles
- Structure modulaire et extensible
- Pas de duplication de code

### ✅ Performance
- Un seul BrowserRouter pour toute l'app
- Lazy loading possible si nécessaire
- Navigation fluide entre les modules

## 📝 Comment ajouter un nouveau module

1. **Créer le layout et les pages**
   ```
   src/nouveau-module/
   ├── LayoutNouveauModule.jsx
   └── pages/
       └── Dashboard.jsx
   ```

2. **Importer dans Routes.jsx**
   ```jsx
   import LayoutNouveauModule from "./nouveau-module/LayoutNouveauModule";
   import DashboardNouveauModule from "./nouveau-module/pages/Dashboard";
   ```

3. **Ajouter les routes**
   ```jsx
   <Route
     path="/nouveau-module"
     element={
       <ProtectedRoute allowedRoles={["nouveau-role"]}>
         <LayoutNouveauModule />
       </ProtectedRoute>
     }
   >
     <Route index element={<Navigate to="/nouveau-module/dashboard" replace />} />
     <Route path="dashboard" element={<DashboardNouveauModule />} />
   </Route>
   ```

4. **Mettre à jour la redirection dans Connexion.jsx**
   ```javascript
   case "nouveau-role":
     return "/nouveau-module/dashboard";
   ```

## 🛠️ Dépannage

### Problème : Boucle de redirection
**Solution** : Vérifier que le rôle dans localStorage correspond exactement au rôle autorisé (case-sensitive)

### Problème : Route non trouvée
**Solution** : Vérifier que toutes les routes enfants ont bien un `element` défini

### Problème : Accès non autorisé
**Solution** : Vérifier les `allowedRoles` dans `ProtectedRoute` et le rôle utilisateur

## 📚 Ressources

- [React Router v6 Documentation](https://reactrouter.com/en/main)
- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)

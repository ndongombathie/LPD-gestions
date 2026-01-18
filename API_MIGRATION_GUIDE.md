# 🔧 ARCHITECTURE API CENTRALISÉE - GUIDE DE MIGRATION

**Date**: Janvier 2026  
**Objectif**: Centraliser toutes les requêtes API et l'authentification

---

## 📂 NOUVELLE STRUCTURE

```
src/
├── services/
│   ├── http/
│   │   └── client.js              ← Instance axios UNIQUE (créée ✅)
│   ├── api/
│   │   ├── auth.js                ← Auth centralisée (créée ✅)
│   │   ├── commandes.js           ← Commandes API (créée ✅)
│   │   ├── clients.js             ← Clients API (créée ✅)
│   │   ├── produits.js            ← Produits API (créée ✅)
│   │   ├── fournisseurs.js        ← Fournisseurs API (créée ✅)
│   │   ├── utilisateurs.js        ← Utilisateurs API (créée ✅)
│   │   ├── decaissements.js       ← Décaissements API (créée ✅)
│   │   ├── stock.js               ← Stock API (créée ✅)
│   │   ├── paiements.js           ← Paiements API (créée ✅)
│   │   └── index.js               ← Export central (créée ✅)
│   ├── api.js                     ← ⚠️ À SUPPRIMER (old)
│   ├── AuthService.js             ← ⚠️ À SUPPRIMER (old)
│   └── axiosClient.js             ← ⚠️ À SUPPRIMER (old)
├── utils/
│   ├── api.js                     ← ⚠️ À SUPPRIMER (old)
│   └── axios.jsx                  ← ⚠️ À SUPPRIMER (old)
├── contexts/
│   └── AuthContext.jsx            ← Auth centralisée (créée ✅)
└── hooks/
    └── useAuth.js                 ← Auth hook (créée ✅)
```

---

## ✅ ÉTAPES DE MIGRATION

### ÉTAPE 1: Wrapper avec AuthProvider (App.jsx)

```jsx
// src/App.jsx
import { AuthProvider } from '@/contexts/AuthContext';
import Routes from '@/Routes';

function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default App;
```

### ÉTAPE 2: Remplacer les imports dans les composants

**AVANT (❌ old)**:
```jsx
import { authAPI } from '@/utils/api';
import { instance } from '@/utils/axios';
import api from '@/services/api';
```

**APRÈS (✅ new)**:
```jsx
// Option 1: Utiliser le hook
import { useAuth } from '@/hooks/useAuth';
import { authAPI, commandesAPI, clientsAPI } from '@/services/api';

// Dans le composant
const { user, login, logout, isAuthenticated } = useAuth();

// Option 2: Importer directement l'API
import { authAPI, commandesAPI } from '@/services/api';
```

---

## 🔐 EXEMPLES DE MIGRATION

### Exemple 1: Login (Connexion.jsx)

**AVANT (❌ old)**:
```jsx
import { instance } from '@/utils/axios';

const handleSubmit = async (e) => {
  try {
    const { data } = await instance.post('auth/login', {
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/responsable/dashboard");
  } catch (error) {
    setMessage(error.response?.data?.message);
  }
};
```

**APRÈS (✅ new)**:
```jsx
import { useAuth } from '@/hooks/useAuth';

export function Connexion() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user } = await login(email, password);
      // Token et user sauvegardés automatiquement par authAPI
      // Redirection basée sur le rôle
      navigate(redirectByRole(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### Exemple 2: Logout (Header.jsx)

**AVANT (❌ old)**:
```jsx
const handleLogout = async () => {
  try {
    await instance.post("/auth/logout");
  } catch {}  // ❌ Empty catch!
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};
```

**APRÈS (✅ new)**:
```jsx
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // Gère token, user, et API call
    navigate("/login");
  };

  return (
    <button onClick={handleLogout}>
      Déconnexion
    </button>
  );
};
```

### Exemple 3: Récupérer des commandes (Commandes.jsx)

**AVANT (❌ old)**:
```jsx
import { commandesAPI } from '@/utils/api';

const loadCommandes = async () => {
  try {
    const res = await commandesAPI.getAll();
    setCommandes(res);
  } catch (error) {
    console.error("Erreur:", error); // ❌ Only console.error
  }
};
```

**APRÈS (✅ new)**:
```jsx
import { commandesAPI } from '@/services/api';

const loadCommandes = async () => {
  try {
    const data = await commandesAPI.getAll();
    setCommandes(data);
  } catch (error) {
    // Error handling par le wrapper (automatique)
    toast.error('Erreur chargement commandes');
  }
};
```

### Exemple 4: Changer le mot de passe

**AVANT (❌ old)**:
```jsx
const handleChangePassword = async (oldPwd, newPwd, confirmPwd) => {
  try {
    await instance.put("/auth/change-password", {
      old_password: oldPwd,
      new_password: newPwd,
      new_password_confirmation: confirmPwd,
    });
    toast.success("Mot de passe changé");
  } catch (error) {
    toast.error(error.response?.data?.message);
  }
};
```

**APRÈS (✅ new)**:
```jsx
import { useAuth } from '@/hooks/useAuth';

function PasswordModal() {
  const { changePassword } = useAuth();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await changePassword(oldPwd, newPwd, confirmPwd);
      toast.success("Mot de passe modifié avec succès");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur changement mot de passe');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

---

## 📋 LISTE DES FICHIERS À MODIFIER

### Fichiers à mettre à jour (remplacer imports):

| Fichier | Raison |
|---------|--------|
| [src/authentification/login/Connexion.jsx](Connexion.jsx) | Importer `useAuth` au lieu de `authAPI` |
| [src/comptable/Header.jsx](Header.jsx) | Utiliser AuthContext pour logout |
| [src/gestionnaire-boutique/components/Header.jsx](Header.jsx) | Utiliser AuthContext |
| [src/gestionnaire-depot/layout/Header.jsx](Header.jsx) | Utiliser AuthContext |
| [src/responsable/Header.jsx](Header.jsx) | Utiliser AuthContext |
| [src/vendeur/Header.jsx](Header.jsx) | Utiliser AuthContext |
| [src/caissier/layouts/CaissierLayout.jsx](CaissierLayout.jsx) | Utiliser AuthContext |
| [src/components/ProtectedRoute.jsx](ProtectedRoute.jsx) | Utiliser AuthContext |
| [src/responsable/pages/Commandes.jsx](Commandes.jsx) | Importer `commandesAPI` depuis services/api |
| [src/responsable/pages/ClientsSpeciaux.jsx](ClientsSpeciaux.jsx) | Importer API depuis services/api |
| [src/responsable/pages/Fournisseurs.jsx](Fournisseurs.jsx) | Importer API depuis services/api |
| [src/responsable/pages/Utilisateurs.jsx](Utilisateurs.jsx) | Importer API depuis services/api |
| [src/responsable/pages/Decaissements.jsx](Decaissements.jsx) | Importer API depuis services/api |
| ... tous les fichiers utilisant authAPI ou instance |

### Fichiers à SUPPRIMER:

- ✅ `src/utils/api.js` (old - remplacé par services/api/)
- ✅ `src/utils/axios.jsx` (old - remplacé par services/http/client.js)
- ✅ `src/services/api.js` (old - remplacé par services/api/)
- ✅ `src/services/AuthService.js` (old - remplacé par services/api/auth.js)
- ✅ `src/services/axiosClient.js` (old - remplacé par services/http/client.js)

---

## 🎯 CHECKLIST DE MIGRATION

### Phase 1: Setup (Fait ✅)
- [x] Créer instance axios unique (`http/client.js`)
- [x] Créer AuthContext (`contexts/AuthContext.jsx`)
- [x] Créer useAuth hook (`hooks/useAuth.js`)
- [x] Créer APIs par module (`services/api/*.js`)
- [x] Créer index central (`services/api/index.js`)

### Phase 2: Integration (À faire)
- [ ] Wrapper App.jsx avec AuthProvider
- [ ] Mettre à jour ProtectedRoute.jsx
- [ ] Mettre à jour Connexion.jsx
- [ ] Mettre à jour tous les Header.jsx
- [ ] Mettre à jour toutes les pages utilisant API

### Phase 3: Cleanup (À faire)
- [ ] Supprimer `src/utils/api.js`
- [ ] Supprimer `src/utils/axios.jsx`
- [ ] Supprimer `src/services/api.js`
- [ ] Supprimer `src/services/AuthService.js`
- [ ] Supprimer `src/services/axiosClient.js`
- [ ] Vérifier tous les imports

### Phase 4: Testing (À faire)
- [ ] Test login/logout
- [ ] Test API calls
- [ ] Test 401 handling
- [ ] Test timeout handling
- [ ] Test network errors

---

## 🚀 AVANTAGES DE CETTE ARCHITECTURE

✅ **Instance axios unique** - Pas de doublons, config cohérente  
✅ **Token gestion centralisée** - sessionStorage au lieu localStorage  
✅ **AuthContext global** - Single source of truth pour auth  
✅ **Error handling uniforme** - Tous les errors gérés pareil  
✅ **401 handling global** - Redirection auto sur timeout  
✅ **Timeout par défaut** - 10 secondes pour toutes les requêtes  
✅ **API organization** - Un fichier par module/ressource  
✅ **Type-safe** - JSDoc comments pour autocompletion  
✅ **Facile à tester** - APIs isolées et mockables  
✅ **Extensible** - Facile ajouter retry logic, caching, etc.

---

## ⚠️ POINTS IMPORTANTS

1. **sessionStorage vs localStorage**: Le token est maintenant dans sessionStorage (plus sûr)
2. **AuthContext obligatoire**: Wrapper App.jsx avec `<AuthProvider>`
3. **Pas d'accès direct localStorage**: Utiliser `useAuth()` hook
4. **Événement global**: `auth:unauthorized` dispatché sur 401
5. **Error messages**: Tous les APIs throw des erreurs (pas de console.error silent)

---

**Prêt à commencer la migration!** 🚀

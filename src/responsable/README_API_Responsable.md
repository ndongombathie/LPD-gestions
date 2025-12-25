# 🧠 Documentation API — Module Responsable (LPD Manager)

Ce document décrit **toutes les API et endpoints nécessaires** pour que le module **Responsable** du projet **LPD Gestions** (frontend React + backend Laravel + MySQL) fonctionne à 100 %.  
Le module inclut :  
- **LayoutResponsable** (structure principale)  
- **Header** (profil, notifications, sécurité)  
- **Sidebar** (navigation)  
- **Dashboard** (statistiques globales)  
- **Utilisateurs** (CRUD complet)  
- **Fournisseurs** (CRUD complet)  

---

## 🔗 Base URL

http://localhost:8000/api


---

## 🧩 Structure du module Responsable

src/responsable/
├── LayoutResponsable.jsx → Structure principale
├── Header.jsx → Profil, notifications, sécurité
├── Sidebar.jsx → Navigation principale
├── pages/
│ ├── Dashboard.jsx → Statistiques, graphiques
│ ├── Utilisateurs.jsx → Gestion des utilisateurs
│ ├── Fournisseurs.jsx → Gestion des fournisseurs
│ └── ...
└── components/ → Composants réutilisables (cards, tables…)

---

## 1️⃣ Authentification & Session

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **POST** | `api/auth/login` | Authentifie un utilisateur et renvoie un token |
| **GET** | `/auth/check` | Vérifie la validité du token et le rôle |
| **GET** | `api/mon-profil` | Récupère le profil complet du user connecté |
| **PUT** | `api/mon-profil` | Met à jour prénom, nom et photo |
| **POST** | `/user/change-password` | Change le mot de passe de l’utilisateur |

---

## 2️⃣ Module Header — Profil, Notifications & Sécurité

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `api/mon-profil` | Récupère les infos du profil connecté |
| **PUT** | `api/mon-profil` | Met à jour prénom, nom et photo |
| **POST** | `/user/change-password` | Change le mot de passe |
| **GET** | `/user/notifications` | Liste des notifications récentes |
| **PUT** | `/user/notifications/read-all` | Marque toutes les notifs comme lues |

---

## 3️⃣ Sidebar — Navigation & Sécurité des routes

| Page | Route frontend | Endpoint backend |
|------|----------------|------------------|
| Tableau de bord | `/responsable/dashboard` | `/api/dashboard/overview` |
| Utilisateurs | `/responsable/utilisateurs` | `/api/utilisateurs` |
| Fournisseurs | `/responsable/fournisseurs` | `/api/fournisseurs` |
| Inventaire | `/responsable/inventaire` | `/api/inventaire` |
| Rapports | `/responsable/rapports` | `/api/rapports` |
| Journal d’activités | `/responsable/journal-activites` | `/api/journal-activites` |

---

## 4️⃣ Dashboard — Statistiques et graphiques

| Endpoint | Description |
|-----------|-------------|
| `/dashboard/overview` | Statistiques globales |
| `/dashboard/ventes` | Données de ventes hebdomadaires |
| `/dashboard/stocks` | Répartition des stocks |
| `/dashboard/benefices` | Évolution mensuelle des bénéfices |

---

## 5️⃣ Utilisateurs — CRUD complet

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `api/uilisateurs` | Liste tous les utilisateurs |
| **POST** | `api/uilisateurs` | Crée un nouvel utilisateur |
| **GET** | `api/uilisateurs/{uilisateur}` | Récupère un utilisateur |
| **PUT** | `api/uilisateurs/{uilisateur}` | Met à jour un utilisateur |
| **DELETE** | `api/uilisateurs/{uilisateur}` | Supprime un utilisateur |

---

## 6️⃣ Fournisseurs — CRUD complet

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `api/fournisseurs` | Liste des fournisseurs |
| **POST** | `api/fournisseurs` | Ajoute un nouveau fournisseur |
| **GET** | `api/fournisseurs/{fournisseur}` | Détails d’un fournisseur |
| **PUT** | `api/fournisseurs/{fournisseur}` | Met à jour un fournisseur |
| **DELETE** | `api/fournisseurs/{fournisseur}` | Supprime un fournisseur |

---

## 7️⃣ Journal d’activités

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `/journal-activites` | Liste des activités récentes |
| **POST** | `/journal-activites` | Ajoute une activité |
| **DELETE** | `/journal-activites/clear` | Vide le journal (option admin) |

---

## 🔐 Sécurité et Middleware

| Vérification | Description |
|---------------|-------------|
| **Auth Sanctum** | Toutes les routes `api/*` nécessitent un token valide |
| **RoleMiddleware** | `Responsable` uniquement pour les endpoints ci-dessus |
| **Rate Limiting** | Recommandé (60 req/min) |
| **CSRF / CORS** | À configurer pour le front React (`localhost:5173`) |

---

## 🏁 Version & Crédits

**LPD Manager — Interface Responsable**  
Version : `v1.0.0`  
Développé par : **SSD Consulting / Team LPD**  
Année : **2025**  
Auteur principal du module Responsable : **Malick Niang**

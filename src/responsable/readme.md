## 1️⃣ Authentification & Session

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **POST** | `/api/auth/login` | Authentifie un utilisateur et renvoie un token |
| **GET** | `/api/mon-profil` | Récupère le profil complet du user connecté |
| **PUT** | `/api/mon-profil` | Met à jour prénom, nom et photo |

## 2️⃣ Module Header — Profil, Notifications & Sécurité

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `/api/mon-profil` | Récupère les infos du profil connecté |
| **PUT** | `/api/mon-profil` | Met à jour prénom, nom et photo |


## 5️⃣ Utilisateurs — CRUD complet

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `/api/uilisateurs` | Liste tous les utilisateurs |
| **POST** | `/api/uilisateurs` | Crée un nouvel utilisateur |
| **GET** | `/api/uilisateurs/{uilisateur}` | Récupère un utilisateur |
| **PUT** | `/api/uilisateurs/{uilisateur}` | Met à jour un utilisateur |
| **DELETE** | `/api/uilisateurs/{uilisateur}` | Supprime un utilisateur |


## 6️⃣ Fournisseurs — CRUD complet

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| **GET** | `/api/fournisseurs` | Liste des fournisseurs |
| **POST** | `/api/fournisseurs` | Ajoute un nouveau fournisseur |
| **GET** | `/api/fournisseurs/{fournisseur}` | Détails d’un fournisseur |
| **PUT** | `/api/fournisseurs/{fournisseur}` | Met à jour un fournisseur |
| **DELETE** | `/api/fournisseurs/{fournisseur}` | Supprime un fournisseur |


GET|HEAD        api/decaissements .....................| afficher la liste des decaissements par defaut toute la liste est afficher mais il y'a des filtres par exemple on peut filtrer par motif 
exemple 
    {
    "motif":"Voluptas voluptatem doloremque impedit neque iusto cumque ut ut."
    }

    
POST            api/decaissements .....................| creer un decaissement par exemple :
            {
            "motif":"pour acheter d'autres produits",
            "libelle":"decaissement 21",
            "montant":20000,
            "methode_paiement":"wave",
            "date":"2026-01-27"
            }

GET|HEAD        api/decaissements/{decaissement} .............................................. |afficher les detailles d'un decaissemnts
PUT|PATCH       api/decaissements/{decaissement} ............................................... | modifier les infos d'un decaissement
DELETE          api/decaissements/{decaissement} .......................................| supprimer un decaissement


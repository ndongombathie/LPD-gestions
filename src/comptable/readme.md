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
  exemple :
  {
      "nom": "Diallo",
      "prenom": "Diallo",
      "password":"password",
      "adresse": "9400 Orval Fort\nEast Drew, MD 41584",
      "numero_cni": "CNI05001378",
      "telephone": "771232454",
      "role": "caissier",
      "email": "diallo.malick@univ-thies.sn"
  }
  
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

# Endpoint pour l'inventaire du boutique
GET|HEAD        api/inventaires-boutique | affiche l'inventaire des produits du boutique

# historique des ventes 
GET           api/historique-ventes  | afficher la liste de l'historique des ventes on appliquer des filtre aussi
GET           api/total-vente-par-jour | la vente journalier

# liste des produits et leurs informations
GET           api/produits            | affiche les produits et leurs etat de stock

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

<<<<<<< HEAD
GET|HEAD        api/decaissements/{decaissement} .............................................. |afficher les detailles d'un decaissemnts
PUT|PATCH       api/decaissements/{decaissement} ............................................... | modifier les infos d'un decaissement
DELETE          api/decaissements/{decaissement} .......................................| supprimer un decaissement
=======
# la gestion des commandes
POST            api/commandes  | ajouter une nouvelle commande pour un client normal
GET|HEAD        api/commandes/{commande} | afficher les details d'une commande et le client de la commande
PUT|PATCH       api/commandes/{commande} | modifier une commande specifique
DELETE          api/commandes/{commande} | supprimer une commande
>>>>>>> responsable_correction

# Nombre total de ventes par vendeur et Total encaissé par vendeur
GET     api/total-ventes-par-vendeur

# la liste des commndes effectuer un vendeur en cliquer sur le bouton detail voir la liste des commandes
GET api/commandes-par-vendeur/{id}

<<<<<<< HEAD
=======

>>>>>>> responsable_correction
# Nombre total de vendeurs
GET         api/vendeurs-count
# Nombre totaò de caissier
GET         api/caissiers-count

# Nombre total de gestionnaire de boutique
GET         api/gestionnaires-count

<<<<<<< HEAD
=======

# •	Nombre de produits en rupture
GET         api/nombre-produits-en-rupture

# nombere de produit en nombre-produits-sous-seuil
GET         api/nombre-produits-sous-seuil

# nombre de normaux.
GET         api/nombre-produits-en-normaux




>>>>>>> responsable_correction
# total-vente-par-jour
GET       api/total-vente-par-jour

# •	Montant total des commandes (clients normaux + spéciaux).
GET        api/montant-total-commandes

# •	Montant total des paiements encaissés (partiels et complets).
GET         api/somme-paiements-total
# Reste total à encaisser.
GET         api/reste-total-encaisser

<<<<<<< HEAD
# •	Nombre de produits en rupture
GET         api/nombre-produits-en-rupture

# nombere de produit en nombre-produits-sous-seuil
GET         api/nombre-produits-sous-seuil

# nombre de normaux.
GET         api/nombre-produits-en-normaux
=======
>>>>>>> responsable_correction

# o	Total commandes
GET         api/total-commandes-payees
 
# o	Commandes en attente caisse
<<<<<<< HEAD
GET         api/commandes-en-attente-caisse
=======
GET         api/commandes-en-attente-caisse


# la liste des paiement associer a une commande
GET    api/commandes/{commande}/paiements  | obtenir la liste des paiements associer a une commande


# • Liste paginée des caissiers avec :
    ◦ Total encaissements et décaissements
    ◦ Fond d’ouverture fourni
    ◦ Solde net = Encaissement − Décaissement − Fond d’ouverture 
    
GET     api/caissier/caisses-journals

# la liste de tous les paiemnent effectuer un caissier | sur la carte caissier en cliquant sur le button detail d'un caissier
GET     api/commandes-par-caissier/{id}

# attribuer une fond de caisse a un caissier
POST    api/fond-caisse/{id} | attribuer une fond de caisse a un caissier en donnant sur la route id du cassier (http://127.0.0.1:8000/api/fond-caisse/019c8cb0-734c-7075-aaff-53f064488ab9) et en payload le montant ex: { "montant":20000 }


>>>>>>> responsable_correction

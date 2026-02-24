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

## les endpoints pour decaissements
GET|HEAD        api/decaissements ...........................................| liste des decaissements
POST            api/decaissements ...........................................| ajouter un nouveau decaissement
GET|HEAD        api/decaissements/{decaissement} ............................| obtenir les detailles d'un decaissement specifique
PUT|PATCH       api/decaissements/{decaissement} ............................| modifier un decaissement specifique
DELETE          api/decaissements/{decaissement} ............................| supprimer un decaissement specifique
PUT             api/decaissements/{decaissement}/statut .....................| changer le status d'un decaissement (valider ou annuler) par defaut il est en attente

# les endpoints pour les produits
GET             api/produits ..................................| la liste des produits
GET|HEAD        api/produits/{produit} ........................| afficher les details d'un produit specifique

# la gestion des clients special
GET|HEAD        api/clients | la liste des clients filtrer par client special
POST            api/clients  | ajouter une client special
GET|HEAD        api/clients/{client} | afficher les information detaillé d'un client
PUT|PATCH       api/clients/{client} | modifier les informations d'un client
DELETE          api/clients/{client} | supprimer un client
GET|HEAD        api/clients/{client}/paiements-tranches | historique des paiements par tranche d'un client 

# la gestion des commandes
POST            api/commandes  | ajouter une nouvelle commande pour un client normal
GET|HEAD        api/commandes/{commande} | afficher les details d'une commande et le client de la commande
PUT|PATCH       api/commandes/{commande} | modifier une commande specifique
DELETE          api/commandes/{commande} | supprimer une commande

# Nombre total de ventes par vendeur et Total encaissé par vendeur
GET     api/total-ventes-par-vendeur

# la liste des commndes effectuer un vendeur en cliquer sur le bouton detail voir la liste des commandes
GET api/commandes-par-vendeur/{id}

# Nombre total de vendeurs
GET         api/vendeurs-count
# Nombre totaò de caissier
GET         api/caissiers-count

# Nombre total de gestionnaire de boutique
GET         api/gestionnaires-count

# total-vente-par-jour
GET       api/total-vente-par-jour

# •	Montant total des commandes (clients normaux + spéciaux).
GET        api/montant-total-commandes

# •	Montant total des paiements encaissés (partiels et complets).
GET         api/somme-paiements-total
# Reste total à encaisser.
GET         api/reste-total-encaisser

# •	Nombre de produits en rupture
GET         api/nombre-produits-en-rupture

# nombere de produit en nombre-produits-sous-seuil
GET         api/nombre-produits-sous-seuil

# nombre de normaux.
GET         api/nombre-produits-en-normaux

# o	Total commandes
GET         api/total-commandes-payees
 
# o	Commandes en attente caisse
GET         api/commandes-en-attente-caisse

# paiement par tranche
POST    api/commandes/{commande}/paiements-tranches  | effectuer un paiement par tranche pour une commande

# la liste des paiement associer a une commande
GET    api/commandes/{commande}/paiements  | obtenir la liste des paiements associer a une commande


# • Liste paginée des caissiers avec :
    ◦ Total encaissements et décaissements
    ◦ Fond d’ouverture fourni
    ◦ Solde net = Encaissement − Décaissement − Fond d’ouverture 
    
GET     api/caissier/caisses-journals

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



# Endpoint pour l'inventaire du boutique
GET|HEAD        api/inventaires-boutique | affiche l'inventaire des produits du boutique

# historique des ventes 
GET           api/historique-ventes  | afficher la liste de l'historique des ventes on appliquer des filtre aussi

GET           api/total-vente-par-jour | la vente journalier

# liste des produits du depot et leurs informations
GET           api/produits            | affiche les produits du depot et leurs etat de stock

# liste des produits du boutique et leurs informations
GET           api/produits-controle   | affiche les produits du boutique et leurs etat de stock

# les des produitd du depots et leurs informations
GET           api/produits-controle-depots

# reitialiser un mot de passe puis envoyer un mail
POST          api/utilisateurs/{utilisateur_id}/reset-password

# inventaire depot 
GET          api/mouvements-stock/inventaire-depot  

# vous aussi pouvez filtrer pa date_debut et date_fin
# les journals caissier 
GET            api/caissier/caisses-journals


# les statistiques sur le dasboard jopurnal caisse vous aussi pouvez filtrer pa date_debut et date_fin

# Total des caisses
GET             api/caissier/caisses-journal-total-caisse

# Total décaissements
GET|HEAD        api/caissier/caisses-journal-total_decaissement

# Total encaissements
GET|HEAD        api/caissier/caisses-journal-total-encaissement

# controle vendeur 
GET     api/commandes-payees

# Enregistrer inventaire de depot
GET    api/enregistrer-inventaire-depot | en donnant les deux intevalle de dates
# Enregistrer inventaire de depot
GET    api/enregistrer-inventaire-boutique | en donnant les deux intevalle de dates

# historiques des inventaires
GET   api/historique-inventaires   | afficher historiques des inventaires

# les mouvement de stock pour un produit donnee pour le deopt
GET api/mouvements-stock/{id} | afficher les mouvement de stock d'un produit donnee dans le deopt.

# les mouvement de stock pour un produit donnee pour le deopt
GET api/mouvement-stock-boutique/{id} | afficher les mouvement de stock d'un produit donnee dans le boutique.


GET|HEAD        api/enregistrer-versements | historiques des encaissements

POST            api/enregistrer-versements | enregistrer un encaissement payload(caissier_id,montant,observation,la date(optionel))
# liste des produits
GET             api/produits-disponibles-boutique   | toutes les produits disponible
# la gestion des clients
POST            api/clients  | ajouter une client normal
PUT|PATCH       api/clients/{client} | modifier les informations d'un client

# la gestion des commande
GET             api/commandes  | historique de tous les commandes
POST            api/commandes  | ajouter une nouvelle commande pour un client normal
GET|HEAD        api/commandes/{commande} | afficher les details d'une commande et le client de la commande
PUT|PATCH       api/commandes/{commande} | modifier une commande specifique
DELETE          api/commandes/{commande} | supprimer une commande


# les elements du tableau de bord

# ventes du jour
GET       api/montant-total-ventes-today 

# commandes traitées
GET      api/commandes-payees-aujourdhui
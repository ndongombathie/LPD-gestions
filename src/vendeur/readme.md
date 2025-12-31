
# la gestion des clients
POST            api/clients  | ajouter une client normal
PUT|PATCH       api/clients/{client} | modifier les informations d'un client

# la gestion des commande
POST            api/commandes  | ajouter une nouvelle commande pour un client normal
GET|HEAD        api/commandes/{commande} | afficher les details d'une commande et le client de la commande
PUT|PATCH       api/commandes/{commande} | modifier une commande specifique
DELETE          api/commandes/{commande} | supprimer une commande

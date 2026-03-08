Carte Vendeurs :

    • Liste paginée des vendeurs avec :
        ◦ Nombre total de ventes par vendeur
        ◦ Total encaissé par vendeur

    GET    api/total-ventes-par-vendeur

    • Statistiques globales :
        ◦ Nombre total de vendeurs : GET   api/vendeurs-count
        ◦ Total des ventes tous vendeurs confondus : 

    • Historique détaillé par vendeur : GET api/commandes-par-vendeur/{id}
    • Barre de recherche par nom et email. GET api/commandes-par-vendeur/{id} sur la meme endpoint tu peux filtrer par {"type_vente": "gros" } , {"statut", "payee"} ou par les informations du clients sur la commande {"search" : "niang"}


Carte Caissiers
    • Liste paginée des caissiers avec :
        ◦ Total encaissements et décaissements
        ◦ Fond d’ouverture fourni
        ◦ Solde net = Encaissement − Décaissement − Fond d’ouverture

    GET     api/caissier/caisses-journals

    • Statistiques globales :
        ◦ Nombre total de caissiers : GET   api/caissiers-count
        ◦ Totaux encaissements, décaissements et solde net

    • Historique détaillé par caissier : GET api/commandes-par-caissier/{id}
    • Barre de recherche par nom et email : GET api/commandes-par-caissier/{id} sur la meme endpoint tu peux filtrer par par les informations du clients ou du vendeur {"search" : "niang"}

GET|HEAD        api/commandes-attente  | Historique de la liste des commandes en attente de validation
POST            api/commandes/{commande}/paiements | valider et payer une commande (en attente -> payee)
GET|HEAD        api/commandes-annulees | Historique de la liste des commandes annulees
GET|HEAD        api/commandes-payees   | Historique de la liste des commandes validees et payees
GET|HEAD        api/commandes/{commande} | afficher les details d'une commande et le client de la commande
PUT|PATCH       api/commandes/{commande}  commandes.update › CommandeController@update
DELETE          api/commandes/{commande}  commandes.destroy › CommandeController@destroy
POST            api/commandes/{commande}/annuler | annuler une commande

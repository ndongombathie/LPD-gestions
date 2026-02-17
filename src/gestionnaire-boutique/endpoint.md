

# affiche la liste des produits transferes par le gestionnaire de depots
GET|HEAD        api/produits-transfer 

# mise a jour des champs ( prix_vente_detail, prix_vente_gros, prix_seuil_detail, prix_seuil_gros )
PUT       api/valider-produits-transfer

# la liste des transfert validee
 GET|HEAD        api/transfers/valide

# montant total du stock
GET             api/montant-total-stock

# les produits en sous seuils
GET        api/produits-sous-seuil

# les produits en ruptures
GET         /produits-rupture

# nombre de produits total dans le boutique
GET|HEAD        api/nombre-produits-total

# la quantite de produit total
GET       api/quantite-totale-produit

# la liste des produits disponible dans le stock
<<<<<<< HEAD
GET             api/produits-disponibles-boutiqueapi
=======
GET             api/produits-disponibles-boutique

# historique des actons
GET             api/all-produits-transfer
>>>>>>> a80e8ae (ajout des recherches sur les endpoints de boutiques controller)

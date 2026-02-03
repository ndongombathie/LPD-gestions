

# affiche la liste des produits transferes par le gestionnaire de depots
GET|HEAD        api/produits-transfer 

# mise a jour des champs ( prix_vente_detail, prix_vente_gros, prix_seuil_detail, prix_seuil_gros )
PUT       api/valider-produits-transfer

# les produits en sous seuils 
GET        api/produits-sous-seuil

# nombre de produits total dans le boutique
GET|HEAD        api/nombre-produits-total

# la quantite de produit total
GET       api/quantite-totale-produit

# la liste des transfert validee
 GET|HEAD        api/transfers/valide

# la liste des produits disponible dans le stock
GET             api/produits-disponibles-boutique

# montant total du stock
GET             api/montant-total-stock
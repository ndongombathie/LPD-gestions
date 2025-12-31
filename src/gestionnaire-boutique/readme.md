# Gestionnaire de boutique

**Dossier racine attendu :** `gestionnaire-boutique/`

---

## Vue d'ensemble

Ce dépôt contient **seulement** la partie "Gestionnaire de boutique" du projet multi-boutiques. Il couvre :

* Gestion locale du stock (CRUD produits en boutique)
* Suivi des entrées/sorties et transferts internes (vers/depuis dépôt ou autres boutiques)
* Gestion des ventes locales (création de commandes, détail, paiements, reste à payer)
* Demandes de réapprovisionnement vers le dépôt central et suivi des statuts
* Génération de rapports locaux (ventes, stock, alertes de seuil)

> Tous les fichiers, dossiers et codes doivent être placés sous `gestionnaire-boutique/`.

---

## Palette de couleurs (UI)

Les codes sont extraits de l'image fournie :

* **Violet principal :** `#472EAD`
* **Orange accent :** `#F58020`
* **Gris clair (fond clair) :** `#F3F4F6`
* **Noir texte :** `#111827`
* **Blanc pur :** `#FFFFFF`

Utiliser ces couleurs dans les composants principaux :

* Header : violet principal
* Boutons primaires : violet principal
* Boutons secondaires / alerts : orange accent
* Fonds / containers : gris clair
* Textes : noir ou blanc selon contraste

---

## Public cible & rôles

**Rôle principal ciblé :** `Gestionnaire de boutique` (`user.role = manager_boutique`)

### Permissions principales :

* CRUD produits en boutique
* Émettre demandes de réapprovisionnement
* Accepter / initier transferts internes (vers d'autres boutiques)
* Générer rapports

---

## Fonctionnalités détaillées

### Gestion produits (boutique)

* Ajouter produit (nom, code, catégorie, prix_vente, prix_gros, prix_seuil, quantité initiale)
* Modifier produit (prix, seuil, code, catégorie)
* Supprimer produit (soft-delete recommandé)
* Recherche & filtres (par catégorie, alerte stock, recherche par code)
* Vue détail produit (historique mouvements locaux)

### Stocks boutiques

* Suivi par `stocks_boutiques` (quantité actuelle par produit & boutique)
* Incrémentation/décrémentation automatique lors de ventes / réceptions / transferts
* Alertes quand `quantite <= prix_seuil` (notification ou badge)

### Ventes locales

* Mise à jour automatique des stocks locaux
* Gestion du `reste_du`

### Réapprovisionnement (workflow)

1. Le gestionnaire de boutique crée une **demande de réapprovisionnement** (`produit_id`, `quantite_demandee`, `note`).
2. La demande est envoyée au dépôt central (`statut = en_attente`).
3. Le dépôt valide la demande (`statut = validée`) → le dépôt décrémente son `stock_global` et crée un mouvement de transfert.
4. Lors de la réception à la boutique, la quantité locale est incrémentée et le statut passe à `réceptionnée`.
5. Rejets / modifications possibles (motif obligatoirement enregistré).

### Transferts internes (boutique ↔ boutique)

* Initier transfert (source boutique, destination boutique, produit_id, quantite)
* Validation par la boutique destinataire
* Mises à jour atomiques du stock (transactionnel)
* Historique des transferts consultable

### Rapports

* Rapport ventes (période, top produits, chiffre d'affaires total, par vendeur)
* Rapport stock (produits en dessous du seuil, valeur de stock = quantité × prix_achat/prix_gros)
* Historique mouvements (filtres : date, type, produit, source/destination)
* Export CSV / PDF


# affiche la liste des produits transferes par le gestionnaire de depots
GET|HEAD        api/produits-transfer 
# mise a jour des champs (prix de vente detail,prix de vente en gros,......) 
GET|HEAD         api/valider-produits-transfer
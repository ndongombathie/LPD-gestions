# 📚 Documentation API - Interface Caissier

## 🔌 APIs Existantes

### Authentification
- **Connexion** : Permet à un utilisateur de se connecter avec son email et mot de passe
- **Déconnexion** : Permet de se déconnecter et invalider la session
- **Profil utilisateur** : Récupère les informations du caissier connecté
- **Mise à jour profil** : Permet de modifier les informations du profil

### Commandes
- **Liste des commandes** : Récupère toutes les commandes avec pagination
- **Détails d'une commande** : Récupère les informations détaillées d'une commande spécifique
- **Commandes en attente** : Récupère uniquement les commandes qui attendent d'être encaissées
- **Commandes payées** : Récupère les commandes qui ont été complètement payées
- **Commandes annulées** : Récupère les commandes qui ont été annulées
- **Valider une commande** : Change le statut d'une commande de "attente" à "validée"
- **Annuler une commande** : Annule une commande en attente

### Paiements
- **Créer un paiement** : Enregistre un paiement pour une commande (encaissement)
- **Liste des paiements** : Récupère tous les paiements effectués pour une commande
- **Détails d'un paiement** : Récupère les informations d'un paiement spécifique

### Décaissements
- **Liste des décaisements** : Récupère tous les décaisements avec pagination
- **Créer un décaisement** : Crée une nouvelle demande de décaisement
- **Détails d'un décaisement** : Récupère les informations détaillées d'un décaisement
- **Mettre à jour un décaisement** : Modifie les informations d'un décaisement
- **Changer le statut d'un décaisement** : Valide ou annule un décaisement (utilisé par le caissier)
- **Supprimer un décaisement** : Supprime un décaisement

### Historique
- **Historique des ventes** : Récupère l'historique de toutes les ventes effectuées
- **Créer une entrée d'historique** : Enregistre une nouvelle vente dans l'historique
- **Détails d'une vente** : Récupère les détails d'une vente spécifique

### Produits
- **Liste des produits** : Récupère tous les produits disponibles
- **Détails d'un produit** : Récupère les informations détaillées d'un produit
- **Produits en rupture** : Récupère la liste des produits qui sont en rupture de stock

### Clients
- **Liste des clients** : Récupère tous les clients enregistrés
- **Détails d'un client** : Récupère les informations d'un client spécifique
- **Paiements par tranches d'un client** : Récupère l'historique des paiements échelonnés d'un client

---

## ❌ APIs Manquantes

### Statistiques du Dashboard
- **Statistiques du jour** : Récupère les statistiques de la journée (fond d'ouverture, total encaissements, total décaisements, solde actuel)
- **Tickets en attente** : Récupère le nombre de tickets en attente d'encaissement
- **Ventes par moyen de paiement** : Récupère le récapitulatif des ventes groupées par moyen de paiement (espèces, carte, Wave, Orange Money)
- **Ventes par heure** : Récupère la répartition des ventes par tranche horaire de la journée

### Gestion de la Caisse
- **Fond d'ouverture** : Permet de définir le montant initial de la caisse au début de la journée
- **Solde actuel de la caisse** : Récupère le solde actuel (fond d'ouverture + encaissements - décaisements)
- **Récapitulatif des encaissements** : Récupère la liste détaillée de tous les encaissements du jour avec leurs informations

### Rapports de Caisse
- **Rapport de caisse du jour** : Récupère le rapport complet de la journée (fond, encaissements, décaisements, solde, liste des transactions)
- **Créer un rapport de caisse** : Initialise un nouveau rapport de caisse pour une date donnée
- **Clôturer la caisse** : Finalise le rapport de caisse avec le solde réel et permet d'enregistrer les observations
- **Historique des rapports** : Récupère les rapports de caisse des jours précédents
- **Export PDF du rapport** : Génère et télécharge un fichier PDF du rapport de caisse

### Recherche et Filtres
- **Recherche de commandes** : Permet de rechercher des commandes par numéro, vendeur, client ou date
- **Filtres avancés pour l'historique** : Permet de filtrer l'historique par type (encaissement/décaisement), date, montant, etc.
- **Recherche de produits par code QR** : Valide et récupère les informations d'un produit à partir de son code QR

### Notifications en Temps Réel
- **Notifications de nouveaux tickets** : Système de notification pour informer le caissier lorsqu'un nouveau ticket arrive
- **Mise à jour en temps réel des tickets** : Permet de recevoir les mises à jour des tickets sans recharger la page

---

## 📝 Notes

- Les APIs existantes sont fonctionnelles et prêtes à être utilisées
- Les APIs manquantes doivent être créées dans le backend Laravel
- Certaines fonctionnalités peuvent être réalisées en combinant plusieurs APIs existantes (ex: calculer les statistiques à partir des commandes et décaisements)
- Les APIs de rapport de caisse sont essentielles pour la fonctionnalité de clôture quotidienne

# Fonctionnalités Restantes - Interface Caissier

## 📊 État actuel

### ✅ Ce qui fonctionne (Simulation)

**Interface & Design :**
- ✅ Sidebar avec navigation
- ✅ Header avec profil utilisateur
- ✅ Responsive design
- ✅ Palette de couleurs appliquée
- ✅ Graphiques et statistiques (données statiques)

**Pages :**
- ✅ Dashboard (données statiques)
- ✅ Page Caisse (affichage tickets simulés)
- ✅ Modal d'encaissement (UI complète)
- ✅ Page Décaissements (liste et formulaire)
- ✅ Page Historique (liste avec filtres)
- ✅ Page Rapport (saisie manuelle possible)
- ✅ Impression facture (client-side)

**Fonctionnalités UI :**
- ✅ Filtres de recherche (côté client)
- ✅ Formatage des devises et dates
- ✅ Gestion TVA (THT + TVA = TTC)
- ✅ Calcul automatique de monnaie à rendre

---

## ❌ Fonctionnalités qui nécessitent l'API

### 1. **Gestion des tickets en temps réel** 🔴 CRITIQUE

**Problème actuel :**
- Les tickets sont simulés avec `setTimeout`
- Pas de vraie synchronisation avec la base de données
- Plusieurs caissiers ne verront pas les mêmes tickets

**À implémenter :**
- [ ] API `GET /api/tickets/pending` pour récupérer les tickets en attente
- [ ] WebSocket ou polling intelligent pour les mises à jour en temps réel
- [ ] Notifications push pour nouveaux tickets
- [ ] Marquage des tickets comme "en cours de traitement" pour éviter les doublons

**Fichiers à modifier :**
- `src/caissier/pages/CaissePage.jsx` (ligne ~28)

---

### 2. **Encaissement des tickets** 🔴 CRITIQUE

**Problème actuel :**
- L'encaissement est simulé, aucune donnée n'est sauvegardée
- Le stock n'est pas décrémenté
- L'argent de la caisse n'est pas mis à jour

**À implémenter :**
- [ ] API `POST /api/tickets/{id}/encaisser`
  - Body: `{ moyen_paiement, montant_paye, ref_paiement? }`
- [ ] Décrémentation automatique du stock boutique
- [ ] Mise à jour du solde de caisse
- [ ] Enregistrement dans la table `tickets`
- [ ] Enregistrement dans la table `paiements` (pour clients spéciaux)
- [ ] Validation que le montant payé >= total TTC
- [ ] Validation que le stock est suffisant
- [ ] Journalisation de l'action

**Fichiers à modifier :**
- `src/caissier/pages/CaissePage.jsx` (ligne ~95)

---

### 3. **Gestion des décaissements** 🔴 CRITIQUE

**Problème actuel :**
- Les décaissements sont simulés, non sauvegardés
- Pas de vérification du solde disponible
- Pas de validation par le responsable

**À implémenter :**
- [ ] API `POST /api/decaissements`
  - Body: `{ montant, motif, piece_jointe? }`
- [ ] Vérification que le solde de caisse est suffisant
- [ ] Validation par le responsable (selon règles métier)
- [ ] Enregistrement dans la table `decaissements`
- [ ] Décrémentation du solde de caisse
- [ ] Journalisation de l'action

**Fichiers à modifier :**
- `src/caissier/pages/DecaissementsPage.jsx` (ligne ~60)

---

### 4. **Rapport journalier** 🔴 CRITIQUE

**Problème actuel :**
- Données simulées
- La saisie manuelle fonctionne mais n'est pas sauvegardée
- Pas de calcul automatique depuis les vrais encaissements/décaissements

**À implémenter :**
- [ ] API `GET /api/caisses-journal/{date}` pour récupérer le rapport
- [ ] API `PUT /api/caisses-journal/{date}` pour sauvegarder
- [ ] Calcul automatique des totaux depuis les vrais tickets/décaissements
- [ ] API `POST /api/caisses-journal/{date}/cloture` pour clôturer
- [ ] Validation : solde calculé = solde saisi (avec tolérance)
- [ ] Génération PDF côté serveur
- [ ] Export Excel

**Fichiers à modifier :**
- `src/caissier/pages/RapportCaissePage.jsx` (lignes ~23, ~195, ~215)

---

### 5. **Historique des opérations** 🟡 IMPORTANT

**Problème actuel :**
- Données simulées uniquement
- Filtres fonctionnent côté client sur données simulées

**À implémenter :**
- [ ] API `GET /api/caissier/historique`
  - Query params: `type`, `dateDebut`, `dateFin`, `recherche`
- [ ] Récupération depuis les tables `tickets` et `decaissements`
- [ ] Pagination pour grandes listes
- [ ] Export des données filtrées

**Fichiers à modifier :**
- `src/caissier/pages/HistoriquePage.jsx` (ligne ~25)

---

### 6. **Paiements partiels (Clients spéciaux)** 🟡 IMPORTANT

**Problème actuel :**
- L'UI permet de payer mais ne gère pas les paiements multiples
- Pas de suivi du reste dû

**À implémenter :**
- [ ] Vérification si client spécial avant encaissement
- [ ] Interface pour paiement par acomptes
- [ ] Enregistrement dans table `paiements` avec type (`acompte`, `solde`, `remboursement`)
- [ ] Calcul et affichage du reste dû
- [ ] Suivi des paiements multiples pour un même ticket
- [ ] Décrémentation du stock seulement au dernier paiement

**Fichiers à modifier :**
- `src/caissier/pages/CaissePage.jsx` (modal d'encaissement)
- Nouveau composant : `src/caissier/components/PaymentPartialModal.jsx`

---

### 7. **Authentification & Sécurité** 🔴 CRITIQUE

**Problème actuel :**
- Aucune authentification
- Pas de vérification des permissions
- N'importe qui peut accéder à toutes les fonctionnalités

**À implémenter :**
- [ ] Système d'authentification (JWT ou session)
- [ ] Protection des routes avec middleware
- [ ] Vérification du rôle "caissier" pour accès
- [ ] Récupération automatique de `boutique_id` depuis la session
- [ ] Expiration de session
- [ ] Refresh token

**Fichiers à créer/modifier :**
- `src/services/auth.js` (nouveau)
- `src/caissier/components/ProtectedCaissierRoute.jsx` (nouveau)
- `src/App.jsx` (ajouter protection)

---

### 8. **Validation serveur** 🔴 CRITIQUE

**Problème actuel :**
- Validations uniquement côté client
- Facilement contournable

**À implémenter :**
- [ ] Validation des montants (positifs, cohérents)
- [ ] Vérification des permissions utilisateur
- [ ] Validation du stock disponible
- [ ] Validation du solde de caisse pour décaissements
- [ ] Validation des prix (>= prix_seuil)
- [ ] Gestion des erreurs et messages appropriés

---

### 9. **Gestion du stock** 🟡 IMPORTANT

**Problème actuel :**
- Pas de vérification du stock avant encaissement
- Pas d'alertes stock faible
- Pas de décrémentation automatique

**À implémenter :**
- [ ] API pour vérifier le stock avant encaissement
- [ ] Décrémentation automatique après encaissement validé
- [ ] Alertes si stock insuffisant
- [ ] Vérification des seuils d'alerte

---

### 10. **Export & Impression** 🟢 AMÉLIORATION

**Problème actuel :**
- Impression client-side uniquement (basique)
- Pas d'export PDF serveur
- Pas d'export Excel

**À implémenter :**
- [ ] Génération PDF côté serveur (avec logo, en-tête personnalisé)
- [ ] Export Excel du rapport journalier
- [ ] Export Excel de l'historique
- [ ] Templates de facture personnalisables

**Fichiers à modifier :**
- `src/caissier/components/InvoicePrint.jsx`
- `src/caissier/pages/RapportCaissePage.jsx` (fonction export)

---

### 11. **WebSocket / Temps réel** 🟢 AMÉLIORATION

**Problème actuel :**
- Polling toutes les 5 secondes (inefficace)
- Pas de notifications instantanées

**À implémenter :**
- [ ] Connexion WebSocket
- [ ] Événements : `ticket:created`, `ticket:encaisse`, `ticket:annule`
- [ ] Notifications en temps réel
- [ ] Synchronisation multi-caissiers

**Fichiers à créer :**
- `src/services/websocket.js` (nouveau)
- `src/caissier/hooks/useRealtimeTickets.js` (nouveau)

---

### 12. **Gestion d'erreurs & UX** 🟡 IMPORTANT

**Problème actuel :**
- Messages d'erreur basiques (alert)
- Pas de retry automatique
- Pas de gestion d'erreurs réseau

**À implémenter :**
- [ ] Système de notifications (toast) professionnel
- [ ] Gestion des erreurs réseau (retry, offline)
- [ ] Messages d'erreur clairs et traduits
- [ ] Loading states appropriés
- [ ] Gestion des timeouts

**Fichiers à créer :**
- `src/services/errorHandler.js` (nouveau)
- Utiliser `react-hot-toast` ou similaire

---

### 13. **Performance & Optimisation** 🟢 AMÉLIORATION

**Problème actuel :**
- Pas de pagination
- Chargement de toutes les données d'un coup
- Pas de cache

**À implémenter :**
- [ ] Pagination pour grandes listes
- [ ] Lazy loading des données
- [ ] Cache des données avec React Query ou SWR
- [ ] Virtualisation des listes longues
- [ ] Optimisation des requêtes API

---

### 14. **Tests** 🟢 QUALITÉ

**Problème actuel :**
- Aucun test
- Difficile de garantir la qualité

**À implémenter :**
- [ ] Tests unitaires des composants
- [ ] Tests d'intégration des flux
- [ ] Tests E2E avec Cypress/Playwright
- [ ] Tests de régression

---

## 📋 Résumé par priorité

### 🔴 CRITIQUE (Doit être fait en premier)
1. Authentification & Sécurité
2. Encaissement des tickets
3. Gestion des décaissements
4. Rapport journalier
5. Validation serveur

### 🟡 IMPORTANT (À faire rapidement)
6. Gestion du stock
7. Historique des opérations
8. Paiements partiels clients spéciaux
9. Gestion d'erreurs & UX

### 🟢 AMÉLIORATION (Peut attendre)
10. WebSocket / Temps réel
11. Export & Impression avancés
12. Performance & Optimisation
13. Tests

---

## 🔌 APIs nécessaires (Checklist)

### Tickets
- [ ] `GET /api/tickets/pending` - Récupérer tickets en attente
- [ ] `POST /api/tickets/{id}/encaisser` - Encaisser un ticket
- [ ] `POST /api/tickets/{id}/paiement-partiel` - Paiement partiel (clients spéciaux)
- [ ] `GET /api/tickets/{id}` - Détails d'un ticket

### Décaissements
- [ ] `GET /api/decaissements` - Liste des décaissements
- [ ] `POST /api/decaissements` - Créer un décaissement
- [ ] `GET /api/decaissements/{id}` - Détails

### Caisse journalière
- [ ] `GET /api/caisses-journal/{date}` - Rapport du jour
- [ ] `PUT /api/caisses-journal/{date}` - Mettre à jour
- [ ] `POST /api/caisses-journal/{date}/cloture` - Clôturer
- [ ] `GET /api/caisses-journal/{date}/pdf` - Export PDF
- [ ] `GET /api/caisses-journal/{date}/excel` - Export Excel

### Historique
- [ ] `GET /api/caissier/historique` - Historique avec filtres
- [ ] `GET /api/caissier/historique/export` - Export

### Stock
- [ ] `GET /api/stocks/boutique/{boutique_id}/produit/{produit_id}` - Vérifier stock
- [ ] `POST /api/stocks/decrement` - Décrémenter stock

### Authentification
- [ ] `POST /api/auth/login` - Connexion
- [ ] `POST /api/auth/logout` - Déconnexion
- [ ] `GET /api/auth/me` - Info utilisateur courant
- [ ] `POST /api/auth/refresh` - Rafraîchir token

### WebSocket
- [ ] Événement `ticket:created` - Nouveau ticket
- [ ] Événement `ticket:encaisse` - Ticket encaissé
- [ ] Événement `ticket:annule` - Ticket annulé

---

## 📝 Notes importantes

1. **Ordre d'implémentation recommandé** :
   - D'abord l'authentification (pour sécuriser tout)
   - Ensuite l'encaissement (fonctionnalité principale)
   - Puis décaissements et rapport
   - Enfin les améliorations

2. **Données simulées actuelles** :
   - Toutes les données sont dans des `setTimeout` ou `Promise.resolve()`
   - Elles doivent être remplacées par de vrais appels API
   - Les commentaires `TODO` indiquent où faire les changements

3. **Structure backend attendue** :
   - Voir `CAISSIER_PROCESSUS.md` pour les détails des APIs
   - Les schémas de base de données sont dans le cahier des charges

4. **État actuel du frontend** :
   - ✅ 100% fonctionnel visuellement
   - ✅ Toutes les interfaces sont prêtes
   - ⚠️ 0% connecté au backend
   - ⚠️ Données 100% simulées


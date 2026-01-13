# ✅ Checklist API - Interface Caissier

## 📊 État général : 0% connecté au backend

| Fonctionnalité | UI Prête | API Nécessaire | Priorité |
|----------------|----------|----------------|----------|
| Dashboard | ✅ 100% | ❌ Manquante | 🟢 Faible |
| Affichage tickets | ✅ 100% | ❌ Manquante | 🔴 Critique |
| Encaissement | ✅ 100% | ❌ Manquante | 🔴 Critique |
| Décaissements | ✅ 100% | ❌ Manquante | 🔴 Critique |
| Historique | ✅ 100% | ❌ Manquante | 🟡 Important |
| Rapport journalier | ✅ 100% | ❌ Manquante | 🔴 Critique |
| Authentification | ❌ 0% | ❌ Manquante | 🔴 Critique |
| Impression facture | ✅ 90% | ❌ PDF serveur | 🟢 Faible |
| Paiements partiels | ❌ 0% | ❌ Manquante | 🟡 Important |

---

## 🔴 APIs CRITIQUES (À faire en premier)

### 1. Authentification
```javascript
POST /api/auth/login
POST /api/auth/logout  
GET  /api/auth/me
```
**Impact** : Sans cela, l'application n'est pas sécurisée

---

### 2. Tickets en attente
```javascript
GET /api/tickets/pending?boutique_id={id}
```
**Impact** : Le caissier ne peut pas voir les vrais tickets

**Localisation code** : `CaissePage.jsx` ligne 28

---

### 3. Encaissement
```javascript
POST /api/tickets/{id}/encaisser
Body: {
  moyen_paiement: "especes",
  montant_paye: 59000,
  ref_paiement?: "REF123"
}
```
**Impact** : Aucun encaissement réel ne peut être effectué

**Localisation code** : `CaissePage.jsx` ligne 95

**Actions backend nécessaires** :
- ✅ Créer l'enregistrement dans `tickets`
- ✅ Décrémenter le stock dans `stocks_boutiques`
- ✅ Créer enregistrement dans `paiements` si client spécial
- ✅ Mettre à jour `caisses_journal`

---

### 4. Décaissements
```javascript
POST /api/decaissements
Body: {
  boutique_id: 1,
  montant: 10000,
  motif: "Achat fournitures",
  piece_jointe?: null
}
```
**Impact** : Aucun décaissement réel

**Localisation code** : `DecaissementsPage.jsx` ligne 60

---

### 5. Rapport journalier
```javascript
GET /api/caisses-journal/{date}?boutique_id={id}
PUT /api/caisses-journal/{date}
POST /api/caisses-journal/{date}/cloture
```
**Impact** : Impossible de générer de vrais rapports

**Localisation code** : `RapportCaissePage.jsx` lignes 23, 195, 215

---

## 🟡 APIs IMPORTANTES

### 6. Historique
```javascript
GET /api/caissier/historique?type=encaissement&dateDebut=...&dateFin=...
```
**Localisation code** : `HistoriquePage.jsx` ligne 25

---

### 7. Vérification stock
```javascript
GET /api/stocks/boutique/{boutique_id}/produit/{produit_id}
```
**Impact** : Risque de vendre des produits en rupture

---

## 🟢 APIs OPTIONNELLES (Amélioration)

### 8. Export PDF/Excel
```javascript
GET /api/caisses-journal/{date}/pdf
GET /api/caisses-journal/{date}/excel
```

### 9. WebSocket (Temps réel)
```javascript
WS /ws/caisse/{boutique_id}
Événements: ticket:created, ticket:encaisse
```

---

## 📍 Points d'intégration dans le code

### Fichiers avec `TODO` API :

1. **CaissePage.jsx**
   - Ligne 28 : `GET /api/tickets/pending`
   - Ligne 95 : `POST /api/tickets/{id}/encaisser`

2. **DecaissementsPage.jsx**
   - Ligne 35 : `GET /api/decaissements`
   - Ligne 60 : `POST /api/decaissements`

3. **RapportCaissePage.jsx**
   - Ligne 23 : `GET /api/caisses-journal/{date}`
   - Ligne 195 : `PUT /api/caisses-journal/{date}`
   - Ligne 107 : `POST /api/caisses-journal/{date}/cloture`

4. **HistoriquePage.jsx**
   - Ligne 25 : `GET /api/caissier/historique`

---

## 🎯 Plan d'action recommandé

### Phase 1 : Sécurité (1-2 jours)
- [ ] Implémenter authentification
- [ ] Protéger toutes les routes
- [ ] Récupérer `boutique_id` depuis session

### Phase 2 : Core métier (3-5 jours)
- [ ] API tickets en attente
- [ ] API encaissement
- [ ] API décaissements
- [ ] Décrémentation stock automatique

### Phase 3 : Rapports (2-3 jours)
- [ ] API rapport journalier
- [ ] Calcul automatique des totaux
- [ ] Clôture de caisse

### Phase 4 : Améliorations (2-3 jours)
- [ ] API historique
- [ ] Paiements partiels
- [ ] WebSocket temps réel

---

## ⚠️ Ce qui ne fonctionnera PAS sans API

❌ Aucune donnée réelle ne sera affichée
❌ Aucun encaissement ne sera sauvegardé
❌ Le stock ne sera pas décrémenté
❌ Les décaissements ne seront pas enregistrés
❌ Les rapports seront vides ou faux
❌ Multi-utilisateurs ne sera pas synchronisé
❌ Pas de sécurité (n'importe qui peut accéder)

---

## ✅ Ce qui fonctionne DÉJÀ

✅ Toute l'interface utilisateur
✅ Tous les formulaires et validations UI
✅ Calculs (TVA, monnaie, totaux)
✅ Impression facture (client-side)
✅ Filtres et recherche (côté client)
✅ Graphiques et statistiques (avec données statiques)
✅ Responsive design
✅ Navigation et routing

---

## 💡 Conclusion

**Frontend** : ✅ **100% prêt** - Toutes les interfaces sont fonctionnelles  
**Backend** : ❌ **0% connecté** - Toutes les données sont simulées  
**Prochaine étape** : Connecter le frontend au backend en remplaçant les simulations par de vrais appels API


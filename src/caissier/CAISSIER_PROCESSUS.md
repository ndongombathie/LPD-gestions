# Processus et Architecture - Interface Caissier

## 📋 Vue d'ensemble du processus

### 1. Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                   Application React                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Layout avec Sidebar + Header              │  │
│  │  ┌──────────┐  ┌──────────────────────────────┐  │  │
│  │  │ Sidebar  │  │      Zone de contenu          │  │  │
│  │  │         │  │  - Dashboard                   │  │  │
│  │  │ - Menu  │  │  - Caisse                      │  │  │
│  │  │         │  │  - Décaissements               │  │  │
│  │  └──────────┘  │  - Historique                 │  │  │
│  │                │  - Rapport                    │  │  │
│  │                └──────────────────────────────┐  │  │
│  │                                               │  │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Services API (À implémenter)          │ │
│  │  - Tickets en temps réel                        │ │
│  │  - Encaissements                                │ │
│  │  - Décaissements                                │ │
│  │  - Rapport journalier                           │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

## 🔄 Flux de processus métier

### **Processus 1 : Vue en temps réel des tickets**

```
┌─────────────┐
│   Vendeur   │
│ Crée ticket │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Ticket validé      │
│  Statut: en_attente │
└──────┬──────────────┘
       │
       │ (Polling toutes les 5s)
       ▼
┌─────────────────────┐
│  Interface Caissier │
│  Affiche ticket     │
│  dans liste         │
└──────┬──────────────┘
       │
       │ Caissier clique "Encaisser"
       ▼
┌─────────────────────┐
│  Modal d'encaissement│
│  - Sélection moyen  │
│  - Saisie montant   │
│  - Calcul TVA       │
└──────┬──────────────┘
       │
       │ Validation
       ▼
┌─────────────────────┐
│  API POST           │
│  /tickets/{id}/     │
│  encaisser          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  - Stock décrémenté │
│  - Ticket encaissé  │
│  - Impression facture│
└─────────────────────┘
```

### **Processus 2 : Encaissement**

1. **Affichage du ticket**
   - Le caissier voit le ticket en attente
   - Informations affichées : N°, vendeur, produits, THT, TVA, TTC

2. **Saisie du paiement**
   - Sélection du moyen de paiement (Espèces, Carte, Wave, OM, Chèque)
   - Saisie du montant payé
   - Calcul automatique de la monnaie à rendre

3. **Validation**
   - Vérification : montant >= TTC
   - Enregistrement via API
   - Mise à jour du statut du ticket
   - Décrémentation du stock
   - Propose l'impression de la facture

### **Processus 3 : Décaissement**

```
┌──────────────────┐
│ Page Décaissements│
│ Bouton "Nouveau"  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Modal Formulaire │
│ - Montant        │
│ - Motif          │
└──────┬───────────┘
       │
       │ Validation
       ▼
┌──────────────────┐
│ API POST         │
│ /decaissements   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ - Décrémentation │
│   de la caisse   │
│ - Historique     │
│   enregistré     │
└──────────────────┘
```

### **Processus 4 : Rapport journalier**

1. **Saisie manuelle** (Mode édition)
   - Fond d'ouverture
   - Total encaissements
   - Total décaissements
   - Solde de clôture
   - Calcul automatique affiché en aide

2. **Consultation**
   - Affichage des valeurs
   - Détail des tickets encaissés
   - Détail des décaissements
   - Répartition par moyen de paiement

3. **Export/Clôture**
   - Export PDF
   - Clôture de la caisse

## 🔌 APIs nécessaires (Non encore implémentées)

### **1. Gestion des tickets**

```javascript
// Récupérer les tickets en attente
GET /api/tickets/pending
Response: {
  success: true,
  data: [
    {
      id: 1,
      numero: "TKT-2024-001",
      commande_id: 101,
      boutique_id: 1,
      vendeur_id: 5,
      vendeur_nom: "Amadou Diop",
      date_ticket: "2024-01-15T10:30:00Z",
      total_ht: 50000,
      tva: 9000,
      total_ttc: 59000,
      statut: "en_attente",
      client_special: false,
      lignes: [
        {
          produit_id: 1,
          nom_produit: "Produit A",
          quantite: 2,
          prix_unitaire: 25000,
          total_ligne: 50000
        }
      ]
    }
  ]
}

// Encaisser un ticket
POST /api/tickets/{id}/encaisser
Body: {
  moyen_paiement: "especes", // especes|carte|wave|om|cheque|autre
  montant_paye: 59000,
  ref_paiement: "REF123" // optionnel
}
Response: {
  success: true,
  data: {
    ticket: {...},
    paiement: {...}
  }
}
```

### **2. Gestion des décaissements**

```javascript
// Créer un décaissement
POST /api/decaissements
Body: {
  boutique_id: 1, // récupéré depuis la session
  montant: 10000,
  motif: "Achat fournitures",
  piece_jointe: null // optionnel
}
Response: {
  success: true,
  data: {
    id: 1,
    montant: 10000,
    motif: "Achat fournitures",
    created_at: "2024-01-15T12:00:00Z",
    autorise_par: "Responsable Boutique"
  }
}

// Récupérer les décaissements
GET /api/decaissements?date=2024-01-15
Response: {
  success: true,
  data: [...]
}
```

### **3. Rapport journalier**

```javascript
// Récupérer le rapport
GET /api/caisses-journal/{date}
Response: {
  success: true,
  data: {
    date: "2024-01-15",
    boutique_id: 1,
    fond_ouverture: 50000,
    total_encaissements: 250000,
    total_decaissements: 15000,
    solde_cloture: 285000,
    cloture_par: null,
    created_at: "2024-01-15T08:00:00Z"
  }
}

// Créer/Mettre à jour le rapport
PUT /api/caisses-journal/{date}
Body: {
  fond_ouverture: 50000,
  total_encaissements: 250000,
  total_decaissements: 15000,
  solde_cloture: 285000
}

// Clôturer la caisse
POST /api/caisses-journal/{date}/cloture
Body: {
  solde_cloture: 285000
}
```

### **4. Historique**

```javascript
// Récupérer l'historique
GET /api/caissier/historique?type=encaissement&dateDebut=2024-01-01&dateFin=2024-01-31&recherche=
Response: {
  success: true,
  data: [
    {
      id: 1,
      type: "encaissement", // ou "decaissement"
      ticket: {...}, // si type = encaissement
      montant: 59000,
      motif: null, // si type = encaissement
      created_at: "2024-01-15T10:30:00Z"
    }
  ]
}
```

## ⚠️ Points manquants / À implémenter

### **1. Authentification et sécurité**
- [ ] Système d'authentification (JWT, session)
- [ ] Protection des routes avec middleware
- [ ] Vérification des permissions (RBAC)
- [ ] Récupération automatique de `boutique_id` depuis la session

### **2. Temps réel (WebSocket)**
- [ ] Remplacement du polling par WebSocket
- [ ] Notifications push pour nouveaux tickets
- [ ] Synchronisation multi-caissiers

### **3. Gestion des paiements partiels**
- [ ] Pour clients spéciaux
- [ ] Traçabilité des acomptes
- [ ] Calcul du reste dû

### **4. Validation et gestion d'erreurs**
- [ ] Validation côté client complète
- [ ] Messages d'erreur utilisateur
- [ ] Gestion des erreurs réseau
- [ ] Retry automatique

### **5. Impression et exports**
- [ ] Génération PDF côté serveur (server-side)
- [ ] Export Excel du rapport
- [ ] Impression de facture avec logo/entreprise

### **6. Gestion du stock**
- [ ] Vérification du stock avant encaissement
- [ ] Alertes stock faible
- [ ] Décrémentation automatique après encaissement

### **7. Tests et qualité**
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests E2E

### **8. Performance**
- [ ] Pagination pour grandes listes
- [ ] Lazy loading
- [ ] Cache des données
- [ ] Optimisation des requêtes

## 🎨 Code couleur utilisé

- **Violet principal** : `#472EAD` (primary-600) - Boutons principaux, liens actifs
- **Orange accent** : `#F58020` (accent-500) - Éléments importants, highlights
- **Gris clair** : `#F3F4F6` (background-light) - Fonds de page
- **Noir texte** : `#111827` (text-primary) - Textes principaux
- **Blanc pur** : `#FFFFFF` (background-white) - Cartes, modales

## 📝 Notes importantes

1. **Données simulées** : Actuellement, toutes les données sont simulées avec `setTimeout`. Il faudra remplacer par de vrais appels API.

2. **Polling** : Le système utilise un polling toutes les 5 secondes. Pour la production, utiliser WebSockets pour un vrai temps réel.

3. **Validation** : Les validations de base sont faites côté client, mais il faut aussi valider côté serveur.

4. **Sécurité** : Tous les appels API doivent inclure le token d'authentification dans les headers.

5. **Boutique** : Le `boutique_id` doit être récupéré depuis la session utilisateur, pas saisi manuellement.

## 🚀 Prochaines étapes

1. Implémenter les services API réels
2. Intégrer l'authentification
3. Remplacer le polling par WebSocket
4. Ajouter les validations serveur
5. Implémenter l'export PDF serveur
6. Ajouter les tests
7. Optimiser les performances


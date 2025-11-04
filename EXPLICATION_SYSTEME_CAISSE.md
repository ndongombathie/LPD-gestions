# 📚 Explication du Système de Caisse

## 📋 Table des matières
1. [Clients spéciaux](#clients-spéciaux)
2. [Calcul TVA / THT / TTC](#calcul-tva--tht--ttc)
3. [Processus des tickets](#processus-des-tickets)

---

## 👥 Clients spéciaux

### **Qu'est-ce qu'un client spécial ?**

Un **client spécial** est un client qui bénéficie de conditions de paiement privilégiées :
- Peut payer par **acomptes** (paiements partiels)
- A une limite de crédit (`creditLimit`)
- Peut avoir un solde en cours (`currentBalance`)
- Ne nécessite pas de payer la totalité du montant TTC en une seule fois

### **Identification des clients spéciaux**

Dans le système, un client spécial est identifié par :
```javascript
{
  client_special: true,           // Flag indiquant que c'est un client spécial
  client_nom: "Nom du Client",    // Nom du client
  creditLimit: 500000,            // Limite de crédit (optionnel)
  currentBalance: 150000          // Solde actuel (optionnel)
}
```

### **Affichage dans l'interface**

Dans la liste des tickets, les clients spéciaux sont marqués avec un **badge orange** :
```jsx
{ticket.client_special && (
  <Badge variant="accent" className="text-xs">Client spécial</Badge>
)}
```

### **Gestion des paiements pour clients spéciaux**

⚠️ **ATTENTION** : Actuellement, cette fonctionnalité n'est **pas encore complètement implémentée**.

#### **Fonctionnement prévu :**

1. **Paiement partiel autorisé**
   - Un client spécial peut payer moins que le montant TTC total
   - Exemple : Ticket de 100 000 FCFA → Peut payer 50 000 FCFA en acompte

2. **Suivi du reste dû**
   - Le système doit suivre le montant déjà payé
   - Calcul automatique : `reste_du = total_ttc - montant_total_paye`

3. **Paiements multiples**
   - Un même ticket peut avoir plusieurs paiements
   - Chaque paiement est enregistré avec un type :
     - `acompte` : Paiement partiel
     - `solde` : Paiement final qui clôture le ticket
     - `remboursement` : Remboursement au client

4. **Décrémentation du stock**
   - Le stock ne doit être décrémenté **que lorsque le paiement final est effectué**
   - Pas de décrémentation lors d'un simple acompte

### **Code actuel (à améliorer)**

Actuellement dans `CaissePage.jsx`, la validation bloque les paiements partiels :

```javascript
// Ligne 91-95 dans CaissePage.jsx
const montant = parseFloat(paymentData.montantPaye);
if (montant < selectedTicket.total_ttc) {
  alert('Le montant payé ne peut pas être inférieur au total TTC');
  return;
}
```

**⚠️ Problème** : Cette validation empêche les clients spéciaux de payer partiellement.

**✅ Solution à implémenter** :
```javascript
// Vérifier si c'est un client spécial
if (!selectedTicket.client_special && montant < selectedTicket.total_ttc) {
  alert('Le montant payé ne peut pas être inférieur au total TTC');
  return;
}

// Pour un client spécial, vérifier s'il reste du à payer
if (selectedTicket.client_special) {
  const montantDejaPaye = selectedTicket.montant_deja_paye || 0;
  const resteDu = selectedTicket.total_ttc - montantDejaPaye;
  
  if (montant > resteDu) {
    alert(`Le montant payé ne peut pas dépasser le reste dû: ${formatCurrency(resteDu)}`);
    return;
  }
  
  // Si c'est un acompte, ne pas décrémenter le stock
  // Si c'est le solde final, décrémenter le stock
}
```

---

## 💰 Calcul TVA / THT / TTC

### **Définitions**

- **THT (Total Hors Taxes)** : Montant total des produits **sans** la taxe
- **TVA (Taxe sur la Valeur Ajoutée)** : Taxe appliquée sur le THT (actuellement 18%)
- **TTC (Total Toutes Taxes Comprises)** : Montant final à payer (THT + TVA)

### **Formule de calcul**

```javascript
// Dans utils/formatters.js - ligne 54-63
export const calculateTVA = (totalHT, tauxTVA = 18) => {
  const tva = (totalHT * tauxTVA) / 100;      // TVA = THT × 18%
  const totalTTC = totalHT + tva;             // TTC = THT + TVA
  return {
    totalHT,      // Ex: 50 000 FCFA
    tauxTVA,      // 18%
    tva,          // 50 000 × 18% = 9 000 FCFA
    totalTTC,     // 50 000 + 9 000 = 59 000 FCFA
  };
};
```

### **Exemple concret**

Supposons une vente avec :
- Produit A : 2 × 25 000 FCFA = **50 000 FCFA**

**Calcul étape par étape :**

1. **THT** = 50 000 FCFA (total des produits sans taxe)
2. **TVA** = 50 000 × 18% = **9 000 FCFA**
3. **TTC** = 50 000 + 9 000 = **59 000 FCFA**

### **Affichage dans l'interface**

#### **Dans la liste des tickets** (`CaissePage.jsx` - lignes 248-252) :
```jsx
<div className="flex flex-wrap gap-3 text-xs text-gray-500">
  <span>THT: {formatCurrency(ticket.total_ht)}</span>      {/* 50 000 FCFA */}
  <span>•</span>
  <span>TVA: {formatCurrency(ticket.tva)}</span>           {/* 9 000 FCFA */}
  <span>•</span>
  <span className="font-semibold">
    TTC: {formatCurrency(ticket.total_ttc)}                {/* 59 000 FCFA */}
  </span>
</div>
```

#### **Dans la modal d'encaissement** (`CaissePage.jsx` - lignes 332-345) :
```jsx
<div className="flex justify-between text-sm mb-1">
  <span>Total HT:</span>
  <span className="font-medium">{formatCurrency(selectedTicket.total_ht)}</span>
</div>
<div className="flex justify-between text-sm mb-1">
  <span>TVA (18%):</span>
  <span className="font-medium">{formatCurrency(selectedTicket.tva)}</span>
</div>
<div className="flex justify-between text-lg font-bold pt-2 border-t">
  <span>Total TTC:</span>
  <span className="text-primary-600">
    {formatCurrency(selectedTicket.total_ttc)}
  </span>
</div>
```

#### **Dans la facture imprimée** (`InvoicePrint.jsx` - lignes 82-93) :
```jsx
<div className="flex justify-between py-2 text-sm">
  <span>Total HT:</span>
  <span>{formatCurrency(ticket.total_ht)}</span>
</div>
<div className="flex justify-between py-2 text-sm">
  <span>TVA (18%):</span>
  <span>{formatCurrency(ticket.tva)}</span>
</div>
<div className="flex justify-between py-3 border-t-2 text-lg font-bold">
  <span>Total TTC:</span>
  <span className="text-primary-600">
    {formatCurrency(ticket.total_ttc)}
  </span>
</div>
```

### **Où les calculs sont faits ?**

Les calculs TVA sont effectués **côté serveur** lors de la création du ticket par le vendeur. Le caissier reçoit le ticket avec les valeurs déjà calculées :

```javascript
{
  total_ht: 50000,    // Calculé côté serveur
  tva: 9000,          // Calculé côté serveur (50000 × 18%)
  total_ttc: 59000    // Calculé côté serveur (50000 + 9000)
}
```

Le caissier ne fait **pas** de calcul, il utilise les valeurs reçues du serveur.

---

## 🎫 Processus des tickets

### **Vue d'ensemble du flux**

```
┌─────────────┐
│   Vendeur   │
│ Crée ticket │  ← Le vendeur crée un ticket de vente
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Ticket validé      │  ← Statut: "en_attente"
│  Statut: en_attente │  ← Calcul THT, TVA, TTC
│  Stock réservé      │  ← Stock temporairement réservé
└──────┬──────────────┘
       │
       │ (Polling toutes les 5s ou WebSocket)
       ▼
┌─────────────────────┐
│  Interface Caissier │  ← Le caissier voit le ticket
│  Affiche ticket     │     dans la liste
│  dans liste         │
└──────┬──────────────┘
       │
       │ Caissier clique "Encaisser"
       ▼
┌─────────────────────┐
│  Modal d'encaissement│  ← Saisie moyen de paiement
│  - Sélection moyen  │     et montant
│  - Saisie montant   │
│  - Calcul monnaie   │  ← Calcul automatique si trop payé
└──────┬──────────────┘
       │
       │ Validation
       ▼
┌─────────────────────┐
│  API POST           │  ← Enregistrement du paiement
│  /tickets/{id}/     │     Décrémentation du stock
│  encaisser          │     Mise à jour statut
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  - Stock décrémenté │  ← Stock réellement diminué
│  - Ticket encaissé  │  ← Statut: "encaissé"
│  - Impression facture│  ← Proposition d'impression
└─────────────────────┘
```

### **Étapes détaillées**

#### **1. Création du ticket par le vendeur**

Le vendeur crée un ticket avec :
- Liste des produits et quantités
- Calcul automatique THT, TVA, TTC
- Réservation temporaire du stock

**Données du ticket** :
```javascript
{
  id: 1,
  numero: "TKT-2024-001",
  commande_id: 101,
  boutique_id: 1,
  vendeur_id: 5,
  vendeur_nom: "Amadou Diop",
  date_ticket: "2024-01-15T10:30:00Z",
  total_ht: 50000,           // Calculé côté serveur
  tva: 9000,                 // Calculé côté serveur
  total_ttc: 59000,          // Calculé côté serveur
  statut: "en_attente",      // Statut initial
  client_special: false,     // Type de client
  client_nom: null,          // Nom si client spécial
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
```

#### **2. Affichage en temps réel (polling)**

Le système interroge l'API toutes les 5 secondes pour récupérer les nouveaux tickets :

```javascript
// CaissePage.jsx - lignes 23-76
useEffect(() => {
  const fetchTickets = async () => {
    // TODO: Remplacer par un vrai appel API
    // const response = await api.get('/tickets/pending');
    
    // Simulation actuelle avec setTimeout
    setTimeout(() => {
      setTickets([...]);
    }, 500);
  };

  fetchTickets();
  const interval = setInterval(fetchTickets, 5000); // Toutes les 5 secondes
  return () => clearInterval(interval);
}, []);
```

**⚠️ À améliorer** : Remplacer le polling par WebSocket pour un vrai temps réel.

#### **3. Affichage dans la liste**

Les tickets sont affichés avec :
- Numéro du ticket
- Badge "Client spécial" si applicable
- Badge "En attente" (orange)
- Informations : vendeur, client, heure, total TTC
- Détails : THT, TVA, TTC
- Bouton "Encaisser"

#### **4. Ouverture de la modal d'encaissement**

Quand le caissier clique sur "Encaisser" :

```javascript
// CaissePage.jsx - lignes 78-86
const handleEncaisse = (ticket) => {
  setSelectedTicket(ticket);
  setPaymentData({
    moyenPaiement: 'especes',
    montantPaye: ticket.total_ttc.toString(), // Pré-rempli avec le TTC
    tauxTVA: 18,
  });
  setIsPaymentModalOpen(true);
};
```

La modal affiche :
- Détails du ticket (numéro, vendeur, date)
- Calcul THT, TVA, TTC
- Sélection du moyen de paiement (Espèces, Carte, Wave, OM, Chèque, Autre)
- Champ "Montant payé" (pré-rempli avec le TTC)
- Calcul automatique de la monnaie à rendre si trop payé

#### **5. Validation et soumission**

```javascript
// CaissePage.jsx - lignes 88-124
const handlePaymentSubmit = async () => {
  if (!selectedTicket) return;

  const montant = parseFloat(paymentData.montantPaye);
  
  // Validation (actuellement bloque les paiements partiels)
  if (montant < selectedTicket.total_ttc) {
    alert('Le montant payé ne peut pas être inférieur au total TTC');
    return;
  }

  try {
    // TODO: Appel API réel
    // await api.post('/tickets/{id}/encaisser', {
    //   moyen_paiement: paymentData.moyenPaiement,
    //   montant_paye: montant,
    // });

    // Mise à jour locale
    setTickets(tickets.map(t => 
      t.id === selectedTicket.id 
        ? { ...t, statut: 'encaissé', moyen_paiement: paymentData.moyenPaiement }
        : t
    ));

    // Proposition d'impression
    if (window.confirm('Paiement enregistré. Voulez-vous imprimer la facture ?')) {
      printInvoice(ticketEncaisse);
    }
  } catch (error) {
    alert('Erreur lors de l\'encaissement: ' + error.message);
  }
};
```

#### **6. Traitement côté serveur (à implémenter)**

L'API `POST /api/tickets/{id}/encaisser` doit :

1. **Vérifier le statut** : Le ticket doit être "en_attente"
2. **Enregistrer le paiement** dans la table `paiements`
3. **Mettre à jour le ticket** : Statut → "encaissé"
4. **Décrémenter le stock** : Diminuer les quantités vendues
5. **Si client spécial et paiement partiel** :
   - Enregistrer comme "acompte"
   - NE PAS décrémenter le stock
   - Calculer le reste dû
   - Mettre le statut à "partiellement_paye"

#### **7. Impression de la facture**

Après l'encaissement, le système propose d'imprimer la facture :

```javascript
// InvoicePrint.jsx
// Génère une page HTML formatée pour l'impression
// Inclut :
// - En-tête avec logo/nom entreprise
// - Numéro de facture et date
// - Informations client (si client spécial)
// - Tableau des produits
// - Totaux (THT, TVA, TTC)
// - Informations de paiement
```

### **Statuts des tickets**

- **`en_attente`** : Ticket créé, en attente de paiement
- **`encaissé`** : Paiement complet effectué, stock décrémenté
- **`partiellement_paye`** : (À implémenter) Client spécial, paiement partiel
- **`annule`** : Ticket annulé

### **Structure des données**

#### **Ticket complet** :
```javascript
{
  id: 1,
  numero: "TKT-2024-001",
  commande_id: 101,
  boutique_id: 1,
  vendeur_id: 5,
  vendeur_nom: "Amadou Diop",
  date_ticket: "2024-01-15T10:30:00Z",
  
  // Calculs financiers
  total_ht: 50000,
  tva: 9000,
  total_ttc: 59000,
  
  // Informations client
  client_special: false,
  client_nom: null,
  client_id: null,
  
  // Statut et paiement
  statut: "en_attente",
  moyen_paiement: null,        // Défini après encaissement
  montant_paye: null,          // Défini après encaissement
  montant_deja_paye: 0,        // Pour clients spéciaux
  reste_du: 59000,             // Pour clients spéciaux
  
  // Détails produits
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
```

---

## 🔧 Points à améliorer / À implémenter

### **1. Clients spéciaux**
- [ ] Permettre les paiements partiels pour clients spéciaux
- [ ] Suivi du reste dû
- [ ] Interface pour voir l'historique des paiements d'un ticket
- [ ] Décrémentation du stock seulement au paiement final

### **2. Temps réel**
- [ ] Remplacer le polling par WebSocket
- [ ] Notifications push pour nouveaux tickets
- [ ] Synchronisation multi-caissiers

### **3. Calculs TVA**
- [ ] Gestion de plusieurs taux de TVA (18%, 10%, 0%)
- [ ] Calcul par ligne de produit si taux différents
- [ ] Affichage détaillé par taux de TVA

### **4. Validation**
- [ ] Validation côté serveur des montants
- [ ] Vérification du stock avant encaissement
- [ ] Contrôle des permissions

---

## 📞 Questions fréquentes

### **Q : Un client normal peut-il payer partiellement ?**
**R :** Non, actuellement non. Seuls les clients spéciaux pourront payer partiellement (fonctionnalité à implémenter).

### **Q : Le taux de TVA peut-il être modifié ?**
**R :** Actuellement, le taux est fixé à 18% dans le code. Il faudrait le rendre configurable par produit ou par type de vente.

### **Q : Que se passe-t-il si le stock n'est pas disponible lors de l'encaissement ?**
**R :** Actuellement, cette vérification n'est pas faite. Il faudrait vérifier le stock disponible avant d'autoriser l'encaissement.

### **Q : Peut-on annuler un ticket encaissé ?**
**R :** Actuellement non. Il faudrait implémenter une fonction d'annulation avec remboursement et réapprovisionnement du stock.

---

**Document créé le :** 2024-01-15
**Dernière mise à jour :** 2024-01-15



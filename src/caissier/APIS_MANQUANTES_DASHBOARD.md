# 📋 APIs Manquantes pour le Dashboard Caissier

## 🎯 Explication Simple : Fond d'Ouverture et Solde Actuel

### 💰 Fond d'Ouverture

**C'est quoi ?**
- Le montant d'argent disponible dans la caisse **au début de la journée**
- C'est une valeur **fixe** qui ne change pas pendant toute la journée

**D'où vient-il ?**
- C'est le **solde de clôture de la veille**
- Exemple : Si hier soir vous avez clôturé avec 200 000 FCFA, alors aujourd'hui le fond d'ouverture = 200 000 FCFA

**Exemple :**
```
Lundi soir : Clôture → Solde de clôture = 200 000 FCFA
Mardi matin : Fond d'ouverture = 200 000 FCFA (égal au solde de clôture de lundi)
```

---

### 💵 Solde Actuel

**C'est quoi ?**
- Le montant d'argent disponible dans la caisse **en ce moment**
- C'est une valeur **variable** qui change à chaque transaction

**Comment c'est calculé ?**
```
Solde Actuel = Fond d'ouverture + Total Encaissements - Total Décaissements
```

**Exemple :**
```
Fond d'ouverture = 50 000 FCFA
+ Encaissements du jour = 200 000 FCFA
- Décaissements du jour = 30 000 FCFA
= Solde Actuel = 220 000 FCFA
```

**Important :**
- Le solde actuel change à chaque encaissement ou décaisement
- Le fond d'ouverture reste fixe toute la journée

---

## ❌ APIs Manquantes pour le Dashboard

### 1. **API Statistiques du Dashboard** (CRITIQUE)

**Pourquoi ?**
Actuellement, le frontend doit :
- Récupérer toutes les commandes payées
- Récupérer tous les décaisements
- Filtrer par date côté client
- Calculer les totaux côté client

C'est lent et inefficace. Il faut une API qui retourne directement les statistiques calculées.

**API à créer :**

```
GET /api/caissier/dashboard/stats?date=2025-01-15
```

**Paramètres :**
- `date` (optionnel) : Date au format YYYY-MM-DD. Si non fourni, utiliser la date du jour.

**Réponse attendue :**
```json
{
  "fond_ouverture": 50000,
  "total_encaissements": 245000,
  "total_decaissements": 15000,
  "solde_actuel": 280000,
  "tickets_en_attente": 3,
  "tickets_traites": 12
}
```

**Logique backend :**
```php
// Dans DashboardController.php ou CommandeController.php

public function getDashboardStats(Request $request) {
    $date = $request->input('date', now()->toDateString());
    
    // Récupérer le fond d'ouverture (solde de clôture de la veille)
    $fondOuverture = $this->getFondOuverture($date);
    
    // Total encaissements du jour
    $totalEncaissements = Commande::where('statut', 'payee')
        ->whereDate('date', $date)
        ->sum('total');
    
    // Total décaisements du jour (uniquement ceux avec statut 'fait')
    $totalDecaissements = Decaissement::where('statut', 'fait')
        ->whereDate('updated_at', $date)
        ->sum('montant');
    
    // Solde actuel
    $soldeActuel = $fondOuverture + $totalEncaissements - $totalDecaissements;
    
    // Tickets en attente
    $ticketsEnAttente = Commande::where('statut', 'attente')->count();
    
    // Tickets traités du jour
    $ticketsTraites = Commande::where('statut', 'payee')
        ->whereDate('date', $date)
        ->count();
    
    return response()->json([
        'fond_ouverture' => $fondOuverture,
        'total_encaissements' => $totalEncaissements,
        'total_decaissements' => $totalDecaissements,
        'solde_actuel' => $soldeActuel,
        'tickets_en_attente' => $ticketsEnAttente,
        'tickets_traites' => $ticketsTraites,
    ]);
}

// Fonction pour récupérer le fond d'ouverture
private function getFondOuverture($date) {
    // Calculer la date de la veille
    $dateVeille = Carbon::parse($date)->subDay()->toDateString();
    
    // Récupérer le rapport de clôture de la veille
    $rapportVeille = CaisseJournal::where('date', $dateVeille)
        ->where('cloture', true)
        ->first();
    
    // Si un rapport existe, retourner le solde de clôture
    if ($rapportVeille) {
        return $rapportVeille->solde_reel ?? $rapportVeille->solde_theorique ?? 0;
    }
    
    // Sinon, retourner 0 (première journée ou pas de clôture précédente)
    return 0;
}
```

---

### 2. **API Ventes par Moyen de Paiement** (OPTIONNEL mais recommandé)

**Pourquoi ?**
Actuellement, le frontend doit :
- Récupérer toutes les commandes payées
- Pour chaque commande, récupérer ses paiements (1 appel API par commande)
- Grouper par type de paiement
- Calculer les totaux et pourcentages

C'est très lent si vous avez beaucoup de commandes.

**API à créer :**

```
GET /api/caissier/dashboard/ventes-par-moyen?date=2025-01-15
```

**Réponse attendue :**
```json
{
  "date": "2025-01-15",
  "ventes": [
    {
      "moyen": "Espèces",
      "montant": 120000,
      "pourcentage": 49
    },
    {
      "moyen": "Carte",
      "montant": 80000,
      "pourcentage": 33
    },
    {
      "moyen": "Wave",
      "montant": 25000,
      "pourcentage": 10
    },
    {
      "moyen": "Orange Money",
      "montant": 20000,
      "pourcentage": 8
    }
  ],
  "total": 245000
}
```

**Logique backend :**
```php
public function getVentesParMoyen(Request $request) {
    $date = $request->input('date', now()->toDateString());
    
    // Récupérer toutes les commandes payées du jour
    $commandes = Commande::where('statut', 'payee')
        ->whereDate('date', $date)
        ->with('paiements')
        ->get();
    
    // Grouper les paiements par type
    $ventesParMoyen = [];
    $total = 0;
    
    foreach ($commandes as $commande) {
        foreach ($commande->paiements as $paiement) {
            $type = $paiement->type_paiement ?? 'especes';
            if (!isset($ventesParMoyen[$type])) {
                $ventesParMoyen[$type] = 0;
            }
            $ventesParMoyen[$type] += $paiement->montant;
            $total += $paiement->montant;
        }
    }
    
    // Convertir en tableau avec labels et pourcentages
    $labels = [
        'especes' => 'Espèces',
        'carte' => 'Carte',
        'wave' => 'Wave',
        'om' => 'Orange Money',
        'autre' => 'Autre'
    ];
    
    $result = [];
    foreach ($ventesParMoyen as $type => $montant) {
        $result[] = [
            'moyen' => $labels[$type] ?? $type,
            'montant' => $montant,
            'pourcentage' => $total > 0 ? round(($montant / $total) * 100) : 0
        ];
    }
    
    return response()->json([
        'date' => $date,
        'ventes' => $result,
        'total' => $total
    ]);
}
```

---

### 3. **API Ventes par Heure** (OPTIONNEL mais recommandé)

**Pourquoi ?**
Pour éviter de filtrer et grouper côté frontend.

**API à créer :**

```
GET /api/caissier/dashboard/ventes-par-heure?date=2025-01-15
```

**Réponse attendue :**
```json
{
  "date": "2025-01-15",
  "ventes": [
    {
      "heure": "08h-10h",
      "montant": 35000
    },
    {
      "heure": "10h-12h",
      "montant": 65000
    },
    {
      "heure": "12h-14h",
      "montant": 85000
    },
    {
      "heure": "14h-16h",
      "montant": 45000
    },
    {
      "heure": "16h-18h",
      "montant": 16000
    },
    {
      "heure": "18h-20h",
      "montant": 0
    }
  ]
}
```

**Logique backend :**
```php
public function getVentesParHeure(Request $request) {
    $date = $request->input('date', now()->toDateString());
    
    // Récupérer toutes les commandes payées du jour
    $commandes = Commande::where('statut', 'payee')
        ->whereDate('date', $date)
        ->get();
    
    // Initialiser les tranches horaires
    $tranches = [
        '08h-10h' => 0,
        '10h-12h' => 0,
        '12h-14h' => 0,
        '14h-16h' => 0,
        '16h-18h' => 0,
        '18h-20h' => 0,
    ];
    
    // Grouper par tranche horaire
    foreach ($commandes as $commande) {
        $dateCommande = Carbon::parse($commande->date ?? $commande->created_at);
        $heure = $dateCommande->hour;
        
        $tranche = '18h-20h'; // Par défaut
        if ($heure >= 8 && $heure < 10) $tranche = '08h-10h';
        elseif ($heure >= 10 && $heure < 12) $tranche = '10h-12h';
        elseif ($heure >= 12 && $heure < 14) $tranche = '12h-14h';
        elseif ($heure >= 14 && $heure < 16) $tranche = '14h-16h';
        elseif ($heure >= 16 && $heure < 18) $tranche = '16h-18h';
        
        $tranches[$tranche] += $commande->total ?? 0;
    }
    
    // Convertir en tableau
    $result = [];
    foreach ($tranches as $heure => $montant) {
        $result[] = [
            'heure' => $heure,
            'montant' => $montant
        ];
    }
    
    return response()->json([
        'date' => $date,
        'ventes' => $result
    ]);
}
```

---

### 4. **API Gestion des Rapports de Caisse Journaliers** (CRITIQUE pour le fond d'ouverture)

**Pourquoi ?**
Sans cette API, le fond d'ouverture sera toujours à 0. Il faut pouvoir :
- Enregistrer le solde de clôture de chaque jour
- Récupérer le solde de clôture de la veille pour le fond d'ouverture

**APIs à créer :**

#### 4.1. Récupérer un rapport de caisse

```
GET /api/caissier/caisses-journal/{date}
```

**Réponse attendue :**
```json
{
  "date": "2025-01-15",
  "fond_ouverture": 50000,
  "total_encaissements": 245000,
  "total_decaissements": 15000,
  "solde_theorique": 280000,
  "solde_reel": null,
  "cloture": false,
  "observations": null,
  "created_at": "2025-01-15T08:00:00",
  "updated_at": "2025-01-15T08:00:00"
}
```

#### 4.2. Créer/Initialiser un rapport journalier

```
POST /api/caissier/caisses-journal
```

**Body :**
```json
{
  "date": "2025-01-15",
  "fond_ouverture": 50000
}
```

#### 4.3. Clôturer la caisse

```
PUT /api/caissier/caisses-journal/{date}/cloture
```

**Body :**
```json
{
  "solde_reel": 280000,
  "observations": "Tout est correct"
}
```

**Réponse :**
```json
{
  "date": "2025-01-15",
  "fond_ouverture": 50000,
  "total_encaissements": 245000,
  "total_decaissements": 15000,
  "solde_theorique": 280000,
  "solde_reel": 280000,
  "cloture": true,
  "observations": "Tout est correct"
}
```

**Important :**
- Le `solde_reel` enregistré lors de la clôture devient le `fond_ouverture` du jour suivant
- Si `solde_reel` est différent de `solde_theorique`, noter l'écart dans `observations`

---

## 📝 Résumé des APIs Manquantes

| API | Priorité | Description |
|-----|----------|-------------|
| `GET /api/caissier/dashboard/stats` | 🔴 CRITIQUE | Statistiques du dashboard (remplace tous les calculs frontend) |
| `GET /api/caissier/caisses-journal/{date}` | 🔴 CRITIQUE | Récupérer un rapport de caisse (pour le fond d'ouverture) |
| `POST /api/caissier/caisses-journal` | 🔴 CRITIQUE | Créer un rapport journalier |
| `PUT /api/caissier/caisses-journal/{date}/cloture` | 🔴 CRITIQUE | Clôturer la caisse |
| `GET /api/caissier/dashboard/ventes-par-moyen` | 🟡 OPTIONNEL | Ventes groupées par moyen de paiement |
| `GET /api/caissier/dashboard/ventes-par-heure` | 🟡 OPTIONNEL | Ventes groupées par heure |

---

## 🗄️ Table à créer dans la base de données

Pour les rapports de caisse journaliers, créer la table `caisses_journal` :

```sql
CREATE TABLE caisses_journal (
    id UUID PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    fond_ouverture DECIMAL(15, 2) DEFAULT 0,
    total_encaissements DECIMAL(15, 2) DEFAULT 0,
    total_decaissements DECIMAL(15, 2) DEFAULT 0,
    solde_theorique DECIMAL(15, 2) DEFAULT 0,
    solde_reel DECIMAL(15, 2) NULL,
    cloture BOOLEAN DEFAULT false,
    observations TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## ✅ Après implémentation

Une fois ces APIs créées, le frontend pourra :
1. Appeler `GET /api/caissier/dashboard/stats` au lieu de faire tous les calculs
2. Récupérer le fond d'ouverture réel depuis `GET /api/caissier/caisses-journal/{date-veille}`
3. Afficher des statistiques précises et en temps réel

**Performance :**
- ⚡ Beaucoup plus rapide (données pré-calculées)
- 📉 Moins de données transférées
- 🔄 Calculs faits une seule fois côté serveur


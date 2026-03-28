# routes manquant
d'abord faut cree la route   api/categories pour les endpoints de la 
gestion des catégories 

# les endpoints que j'ai besoin au plus vite possible 
## Endpoints requis pour le Dashboard (Gestionnaire Dépôt)

Pour rendre le tableau de bord totalement dynamique et performant, j'ai besoin de ces endpoints spécifiques. L'idéal serait de regrouper les statistiques globales dans un seul appel pour éviter de surcharger le réseau.

### 1. Statistiques Globales 
**Besoin :** Récupérer les chiffres clés pour les cartes du haut (Mouvements du jour, Fournisseurs ,stock optimal ).
* **Method :** `GET`
**Réponse attendue (JSON) :**
```json
{
    
    "mouvements_jour_count": 23,       // Total entrées + sorties effectuées aujourd'hui
    "total_fournisseurs": 8,           // Nombre total de fournisseurs actifs
    "livraisons_mois_count": 15,       // Nombre de réceptions effectuées ce mois-ci
    
    // --- Pour le calcul du "Stock Optimal" ---
    "total_produits": 150,             // Nombre total de produits en base
    "produits_sains_count": 142,       // Nombre de produits dont le stock > stock_seuil

    // --- Pour les Alertes (Rouge/Orange) ---
    "produits_rupture_count": 3,       // Nombre de produits où stock = 0
    "produits_alert_seuil_count": 5    // Nombre de produits où 0 < stock <= stock_seuil
}

### 2. Historique d'Activité Récente
**Besoin :** Afficher la liste chronologique des dernières actions (Entrés, Sorties) pour le bloc "Activité Récente".
* **Method :** `GET`
* **Réponse attendue (JSON) :**
    ```json
    [
        {
            "id": 101,
            "type": "entré",         
            "titre": "Réception de marchandise",
            "description": "50 cartons – Papeterie Plus",
            "created_at": "2024-10-24T10:30:00"
        },
        {
            "id": 100,
            "type": "sortie",
            "titre": "Sortie vers Boutique",
            "description": "30 stylos – Dakar Centre",
            "created_at": "2024-10-24T08:15:00"
        }
    ]
    ```

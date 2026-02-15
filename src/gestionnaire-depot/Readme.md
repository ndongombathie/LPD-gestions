# INSTALLATION COMPLÈTE DE TOUTES LES DÉPENDANCES NÉCESSAIRES
npm install react-router-dom react-icons lucide-react html2canvas jspdf

Dramé je penses k ca marchera et ni ca ne marche pas fait un capture de l'erreurs et envoi le à l'ia que tu utilise


# endpoints  pour la gestion des categories
GET|HEAD        api/categories ..................................... | affiche la liste des categories
POST            api/categories ..................................... | creer un categories (donner le  nom en entree)
GET|HEAD        api/categories/{category} ...........................| afficher les infos d'un categorie (nom)
PUT|PATCH       api/categories/{category} ...........................|  modiier les infos d'un categorie  (nom)
DELETE          api/categories/{category}                            | supprimer une categorie

# creer un transfer et mouvement de stock vers le gestionnaire de boutique 
POST       api/stocks/transfer | envoyer un transfert vers le gestion de boutique
GET        api/mouvements-stock | afficher les mouvements de stocks


# les endpoints pour la gestion des produits
GET             api/produits  | la liste des produits
POST            api/produits  | enregistrer un nouveau produit
GET|HEAD        api/produits-ruptures  | la liste des produits en rupture de stock
GET|HEAD        api/produits/{produit} | afficher les detaille d'un produit specifique
PUT|PATCH       api/produits/{produit} | modifier un produit
DELETE          api/produits/{produit} | supprimer un produit


# la liste des produits en rupture
GET             api/produits_en_rupture | les produits en rupture de stock

# endpoint pour reapprovisionner un produit
POST            api/stocks/reapprovisionner    | donner en post le quantité et le produit_id


 # la liste de l'historique des actions
GET     api/historique-actions

# Reduction de stock d'un produit
PUT     api/produits/{produit}/reduire-stock

GET     api/fournisseurs | Liste des fournisseurs 

# annuler un tramsfert 
PUT    api/annuler-produits-transfer | donner en payload (transfer_id) du transfert





📝 Note pour l'équipe
Toutes les modifications sont contenues dans la branche fix/bordures-noires-interface-depot et n'affectent pas les autres rôles (boutique, vendeur, caissier, etc.). Les corrections sont spécifiques à l'interface gestionnaire de dépôt.

RÉSUMÉ DES MODIFICATIONS - Interface Gestionnaire Dépôt
📋 Modifications apportées
1. CORRECTION DES BORDURES NOIRES (Interface Dépôt)
Problème : Bordures noires apparues sur toutes les interfaces après le merge
Solution : Création d'un fichier CSS spécifique depot-fix.css qui isole les corrections à l'interface dépôt
Fichiers modifiés :

✅ src/gestionnaire-depot/styles/depot-fix.css (nouveau)

✅ src/gestionnaire-depot/pages/Dashboard.jsx (+ autres pages)

2. CORRECTION DE SÉCURITÉ - Reports.jsx
Problème : Risque XSS (Cross-Site Scripting) avec innerHTML
Solution : Utilisation de DOMPurify pour sécuriser les insertions HTML
Fichier modifié :

✅ src/gestionnaire-depot/pages/Reports.jsx
Correction : Remplacement de innerHTML par DOMPurify.sanitize()

3. CORRECTION DE SÉCURITÉ - Header.jsx
Problèmes corrigés :

✅ Remplacement de localStorage par sessionStorage pour une meilleure sécurité

✅ Ajout de validation utilisateur (champs requis)

✅ Correction de la déconnexion qui provoquait une page blanche
Fichier modifié :

✅ src/gestionnaire-depot/layout/Header.jsx

4. VÉRIFICATION - Sidebar.jsx
Analyse : Le fichier était déjà correct
Conclusion : Aucune modification nécessaire

🛠️ Détails techniques
Fichiers créés :
src/gestionnaire-depot/styles/depot-fix.css

Correction des bordures noires spécifique à l'interface dépôt

Ne touche pas les autres interfaces

Fichiers modifiés :
Reports.jsx :

Installation : npm install dompurify

Ajout : import DOMPurify from 'dompurify';

Remplacement : pdfContainer.innerHTML = header; → pdfContainer.innerHTML = DOMPurify.sanitize(header);

Remplacement : pdfContainer.innerHTML += createPDFContent(); → pdfContainer.innerHTML += DOMPurify.sanitize(createPDFContent());

Header.jsx :

SessionStorage au lieu de localStorage

Validation des données utilisateur

Correction de la fonction de déconnexion (window.location.href = "/")

Toutes les pages de l'interface dépôt :

Ajout de l'import : import "../styles/depot-fix.css";

Ajout de la classe : className="depot-page"

✅ Impact
Pour l'interface Dépôt :
✅ Bordures noires corrigées

✅ Sécurité renforcée (XSS, sessionStorage)

✅ Déconnexion fonctionnelle

Pour les autres interfaces :
✅ Aucun impact (corrections isolées)

✅ Pas de modifications dans leurs fichiers

✅ Compatibilité maintenue
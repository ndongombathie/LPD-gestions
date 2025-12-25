import { produitsSimules, clientsSimules, genererNumeroCommande, genererDateAleatoire } from '../data/produitsSimules';

// Stockage local pour simuler une base de données
let commandesEnMemoire = [];
let produitsEnMemoire = [...produitsSimules];

// Générer des commandes simulées initiales
const genererCommandesInitiales = () => {
  const commandes = [];
  
  // Générer 10 commandes passées
  for (let i = 0; i < 10; i++) {
    const nbProduits = Math.floor(Math.random() * 3) + 1; // 1 à 3 produits
    const produitsCommande = [];
    let totalHT = 0;
    
    for (let j = 0; j < nbProduits; j++) {
      const produitIndex = Math.floor(Math.random() * produitsSimules.length);
      const produit = produitsSimules[produitIndex];
      const quantite = Math.floor(Math.random() * 2) + 1; // 1 à 2 unités
      
      produitsCommande.push({
        id: produit.id,
        nom: produit.nom,
        quantite: quantite,
        prix_unitaire: produit.prix,
        prix_vente: produit.prix
      });
      
      totalHT += produit.prix * quantite;
    }
    
    const tva = totalHT * 0.18;
    const totalTTC = totalHT + tva;
    
    commandes.push({
      id: i + 1,
      numero_commande: genererNumeroCommande(),
      client_nom: clientsSimules[Math.floor(Math.random() * clientsSimules.length)].nom,
      client_telephone: clientsSimules[Math.floor(Math.random() * clientsSimules.length)].telephone,
      total_ht: Math.round(totalHT),
      tva: Math.round(tva),
      total_ttc: Math.round(totalTTC),
      statut: 'complétée',
      type_vente: Math.random() > 0.7 ? 'gros' : 'détail',
      created_at: genererDateAleatoire(),
      produits: produitsCommande
    });
  }
  
  return commandes;
};

// Initialiser les commandes
commandesEnMemoire = genererCommandesInitiales();

export const simulationService = {
  // Récupérer tous les produits
  async getProduits() {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      success: true,
      data: produitsEnMemoire
    };
  },

  // Rechercher un produit par code barre
  async getProduitByCodeBarre(codeBarre) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const produit = produitsEnMemoire.find(p => p.code_barre === codeBarre);
    return {
      success: !!produit,
      data: produit,
      message: produit ? 'Produit trouvé' : 'Produit non trouvé'
    };
  },

  // Récupérer toutes les commandes
  async getCommandes() {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      success: true,
      data: [...commandesEnMemoire].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    };
  },

  // Créer une nouvelle commande
  async createCommande(commandeData) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Générer un nouvel ID
    const nouvelId = Math.max(...commandesEnMemoire.map(c => c.id), 0) + 1;
    
    // Créer la nouvelle commande
    const nouvelleCommande = {
      id: nouvelId,
      numero_commande: genererNumeroCommande(),
      client_nom: commandeData.client.nom || 'Client Non Enregistré',
      client_telephone: commandeData.client.telephone || '',
      total_ht: commandeData.total_ht,
      tva: commandeData.tva,
      total_ttc: commandeData.total_ttc,
      statut: 'complétée',
      type_vente: commandeData.type_vente,
      created_at: new Date().toISOString(),
      produits: commandeData.produits.map(p => ({
        id: p.produit_id,
        nom: produitsEnMemoire.find(prod => prod.id === p.produit_id)?.nom || 'Produit Inconnu',
        quantite: p.quantite,
        prix_unitaire: p.prix_base,
        prix_vente: p.prix_unitaire
      }))
    };
    
    // Mettre à jour les stocks des produits
    commandeData.produits.forEach(produitCommande => {
      const produit = produitsEnMemoire.find(p => p.id === produitCommande.produit_id);
      if (produit) {
        produit.stock = Math.max(0, produit.stock - produitCommande.quantite);
      }
    });
    
    // Ajouter la commande à l'historique
    commandesEnMemoire.unshift(nouvelleCommande);
    
    return {
      success: true,
      data: nouvelleCommande,
      message: 'Commande créée avec succès'
    };
  },

  // Récupérer les statistiques du dashboard
  async getStatistiques() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const aujourdhui = new Date().toISOString().split('T')[0];
    const ventesAujourdhui = commandesEnMemoire
      .filter(c => c.created_at.split('T')[0] === aujourdhui)
      .reduce((total, c) => total + c.total_ttc, 0);
    
    const produitsStockFaible = produitsEnMemoire.filter(p => p.stock <= p.seuil_alerte).length;
    
    return {
      success: true,
      data: {
        ventes_aujourdhui: ventesAujourdhui,
        total_produits: produitsEnMemoire.length,
        total_clients: clientsSimules.length,
        produits_stock_faible: produitsStockFaible,
        tendance_ventes: Math.floor(Math.random() * 21) - 10 // -10% à +10%
      }
    };
  },

  // Récupérer les activités récentes
  async getActivitesRecentes() {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    const activites = [];
    
    // Dernières commandes
    const dernieresCommandes = commandesEnMemoire.slice(0, 3);
    dernieresCommandes.forEach(commande => {
      activites.push({
        id: activites.length + 1,
        type: 'vente',
        titre: 'Nouvelle vente complétée',
        description: `Commande ${commande.numero_commande} pour ${commande.client_nom}`,
        temps: 'Il y a quelques minutes',
        icone: '💰'
      });
    });
    
    // Alertes stock faible
    const produitsFaibleStock = produitsEnMemoire.filter(p => p.stock <= p.seuil_alerte);
    if (produitsFaibleStock.length > 0) {
      activites.push({
        id: activites.length + 1,
        type: 'alerte',
        titre: 'Stock faible détecté',
        description: `${produitsFaibleStock.length} produit(s) nécessite(nt) réapprovisionnement`,
        temps: 'Il y a 1 heure',
        icone: '⚠️'
      });
    }
    
    // Activité système
    activites.push({
      id: activites.length + 1,
      type: 'systeme',
      titre: 'Synchronisation terminée',
      description: 'Toutes les données sont à jour',
      temps: 'Il y a 2 heures',
      icone: '🔄'
    });
    
    return {
      success: true,
      data: activites
    };
  }
};

export default simulationService;
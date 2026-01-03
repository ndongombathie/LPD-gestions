// Service API pour l'interface caissier
import { instance } from '../../utils/axios';

export const caissierApi = {
  // ==================== DASHBOARD ====================
  
  /**
   * Récupère les statistiques du jour
   */
  async getDashboardStats(date = null) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Récupérer les commandes payées (filtrer côté client pour aujourd'hui)
      // Limiter à 50 commandes pour la performance
      const commandesPayees = await instance.get('/commandes-payees', { params: { per_page: 50 } });
      const commandesDuJour = (commandesPayees.data?.data || commandesPayees.data || []).filter(cmd => {
        if (!cmd.date && !cmd.created_at) return false;
        const cmdDate = new Date(cmd.date || cmd.created_at);
        return cmdDate >= todayStart && cmdDate <= todayEnd;
      });
      
      // Récupérer les décaisements (filtrer côté client pour aujourd'hui)
      const decaissements = await instance.get('/decaissements');
      const decaissementsDuJour = (decaissements.data?.data || []).filter(dec => {
        if (!dec.created_at && !dec.updated_at) return false;
        const decDate = new Date(dec.updated_at || dec.created_at);
        return decDate >= todayStart && decDate <= todayEnd;
      });
      
      // Récupérer les commandes en attente
      const commandesAttente = await instance.get('/commandes-attente');
      
      // Calculer les totaux
      const totalEncaissements = commandesDuJour.reduce((sum, cmd) => sum + (cmd.total || 0), 0);
      const totalDecaissements = decaissementsDuJour.reduce((sum, dec) => {
        if (dec.statut === 'fait') {
          return sum + (dec.montant || 0);
        }
        return sum;
      }, 0);
      
      // Fond d'ouverture (à définir plus tard, pour l'instant 0)
      const fondOuverture = 0;
      const soldeActuel = fondOuverture + totalEncaissements - totalDecaissements;
      
      return {
        fondOuverture,
        totalEncaissements,
        totalDecaissements,
        soldeActuel,
        ticketsEnAttente: commandesAttente.data?.data?.length || 0,
        ticketsTraites: commandesDuJour.length,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  /**
   * Récupère les ventes par moyen de paiement du jour
   */
  async getVentesParMoyen(date = null) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Limiter à 50 commandes pour la performance
      const commandesPayees = await instance.get('/commandes-payees', { params: { per_page: 50 } });
      const commandesDuJour = (commandesPayees.data?.data || commandesPayees.data || []).filter(cmd => {
        if (!cmd.date && !cmd.created_at) return false;
        const cmdDate = new Date(cmd.date || cmd.created_at);
        return cmdDate >= todayStart && cmdDate <= todayEnd;
      });
      
      // Utiliser les paiements déjà inclus dans les commandes (optimisation)
      const ventesParMoyen = {};
      
      commandesDuJour.forEach(commande => {
        // Si les paiements sont déjà inclus dans la réponse
        if (commande.paiements && Array.isArray(commande.paiements)) {
          commande.paiements.forEach(paiement => {
            const moyen = paiement.type_paiement || 'especes';
            if (!ventesParMoyen[moyen]) {
              ventesParMoyen[moyen] = 0;
            }
            ventesParMoyen[moyen] += paiement.montant || 0;
          });
        } else {
          // Fallback : utiliser le total de la commande avec un moyen par défaut
          const moyen = 'especes';
          if (!ventesParMoyen[moyen]) {
            ventesParMoyen[moyen] = 0;
          }
          ventesParMoyen[moyen] += commande.total || 0;
        }
      });
      
      // Convertir en tableau avec pourcentages
      const total = Object.values(ventesParMoyen).reduce((sum, val) => sum + val, 0);
      const labels = {
        'especes': 'Espèces',
        'carte': 'Carte',
        'wave': 'Wave',
        'om': 'Orange Money',
        'autre': 'Autre'
      };
      
      return Object.entries(ventesParMoyen).map(([moyen, montant]) => ({
        moyen: labels[moyen] || moyen,
        montant,
        pourcentage: total > 0 ? Math.round((montant / total) * 100) : 0
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes par moyen:', error);
      return [];
    }
  },

  /**
   * Récupère les ventes par heure du jour
   */
  async getVentesParHeure(date = null) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Limiter à 50 commandes pour la performance
      const commandesPayees = await instance.get('/commandes-payees', { params: { per_page: 50 } });
      const commandesDuJour = (commandesPayees.data?.data || commandesPayees.data || []).filter(cmd => {
        if (!cmd.date && !cmd.created_at) return false;
        const cmdDate = new Date(cmd.date || cmd.created_at);
        return cmdDate >= todayStart && cmdDate <= todayEnd;
      });
      
      // Grouper par tranche horaire
      const tranches = {
        '08h-10h': { heure: '08h-10h', montant: 0 },
        '10h-12h': { heure: '10h-12h', montant: 0 },
        '12h-14h': { heure: '12h-14h', montant: 0 },
        '14h-16h': { heure: '14h-16h', montant: 0 },
        '16h-18h': { heure: '16h-18h', montant: 0 },
        '18h-20h': { heure: '18h-20h', montant: 0 },
      };
      
      commandesDuJour.forEach(commande => {
        const dateCommande = new Date(commande.date || commande.created_at);
        const heure = dateCommande.getHours();
        
        let tranche = '18h-20h';
        if (heure >= 8 && heure < 10) tranche = '08h-10h';
        else if (heure >= 10 && heure < 12) tranche = '10h-12h';
        else if (heure >= 12 && heure < 14) tranche = '12h-14h';
        else if (heure >= 14 && heure < 16) tranche = '14h-16h';
        else if (heure >= 16 && heure < 18) tranche = '16h-18h';
        
        if (tranches[tranche]) {
          tranches[tranche].montant += commande.total || 0;
        }
      });
      
      return Object.values(tranches);
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes par heure:', error);
      return [];
    }
  },

  /**
   * Récupère l'activité récente (derniers encaissements et décaisements)
   */
  async getActiviteRecente(limit = 5) {
    try {
      // Récupérer les dernières commandes payées (limiter pour la performance)
      const commandesPayees = await instance.get('/commandes-payees', {
        params: { per_page: Math.min(limit * 2, 50) }
      });
      
      // Récupérer les derniers décaisements (limiter pour la performance)
      const decaissements = await instance.get('/decaissements', {
        params: { per_page: Math.min(limit * 2, 50) }
      });
      
      const activites = [];
      
      // Ajouter les encaissements
      (commandesPayees.data?.data || []).forEach(commande => {
        activites.push({
          type: 'encaissement',
          montant: commande.total || 0,
          date: commande.date || commande.created_at,
          description: `Commande ${commande.id?.substring(0, 8)}`
        });
      });
      
      // Ajouter les décaisements
      (decaissements.data?.data || []).forEach(dec => {
        if (dec.statut === 'fait') {
          activites.push({
            type: 'decaissement',
            montant: dec.montant || 0,
            date: dec.updated_at || dec.created_at,
            description: dec.motif || 'Décaissement'
          });
        }
      });
      
      // Trier par date (plus récent en premier)
      activites.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return activites.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité récente:', error);
      return [];
    }
  },

  // ==================== COMMANDES ====================
  
  /**
   * Récupère les commandes en attente
   */
  async getCommandesAttente() {
    try {
      const response = await instance.get('/commandes-attente');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes en attente:', error);
      throw error;
    }
  },

  /**
   * Récupère les détails d'une commande
   */
  async getCommandeDetails(commandeId) {
    try {
      const response = await instance.get(`/commandes/${commandeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la commande:', error);
      throw error;
    }
  },

  // ==================== PAIEMENTS ====================
  
  /**
   * Crée un paiement (encaissement)
   */
  async creerPaiement(commandeId, data) {
    try {
      const response = await instance.post(`/commandes/${commandeId}/paiements`, {
        montant: data.montant,
        type_paiement: data.type_paiement
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      throw error;
    }
  },

  /**
   * Récupère les paiements d'une commande
   */
  async getPaiements(commandeId) {
    try {
      const response = await instance.get(`/commandes/${commandeId}/paiements`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  },

  // ==================== DÉCAISSEMENTS ====================
  
  /**
   * Récupère les décaissements en attente
   */
  async getDecaissementsAttente() {
    try {
      const response = await instance.get('/decaissements-attente');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des décaissements en attente:', error);
      throw error;
    }
  },

  /**
   * Récupère les décaisements
   */
  async getDecaissements(filters = {}) {
    try {
      const response = await instance.get('/decaissements', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des décaisements:', error);
      throw error;
    }
  },

  /**
   * Valide un décaisement
   */
  async validerDecaissement(decaissementId) {
    try {
      const response = await instance.put(`/decaissements/${decaissementId}/statut`, {
        statut: 'fait'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation du décaisement:', error);
      throw error;
    }
  },

  /**
   * Annule un décaisement
   */
  async annulerDecaissement(decaissementId) {
    try {
      const response = await instance.delete(`/decaissements/${decaissementId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation du décaisement:', error);
      throw error;
    }
  },

  // ==================== HISTORIQUE ====================
  
  /**
   * Récupère l'historique complet (paiements + décaisements + annulations)
   */
  async getHistoriqueComplet(filters = {}) {
    try {
      // Récupérer les commandes payées avec leurs paiements (optimisé)
      const commandesPayeesResponse = await instance.get('/commandes-payees', { 
        params: { per_page: 100, ...filters } 
      });
      const commandesPayees = commandesPayeesResponse.data?.data || commandesPayeesResponse.data || [];
      
      // Récupérer les commandes annulées
      const commandesAnnuleesResponse = await instance.get('/commandes-annulees', { 
        params: { per_page: 100, ...filters } 
      });
      const commandesAnnulees = commandesAnnuleesResponse.data?.data || commandesAnnuleesResponse.data || [];
      
      // Extraire les paiements des commandes payées - chaque paiement est une entrée séparée
      const paiements = [];
      commandesPayees.forEach(commande => {
        if (commande.paiements && Array.isArray(commande.paiements) && commande.paiements.length > 0) {
          // Si les paiements sont inclus, créer une entrée pour chaque paiement
          commande.paiements.forEach(paiement => {
            paiements.push({
              ...paiement,
              commande: commande,
              // Utiliser la date du paiement (heure exacte) au lieu de la date de la commande
              date: paiement.date || paiement.created_at,
              created_at: paiement.created_at || paiement.date,
            });
          });
        } else {
          // Si pas de paiements, utiliser la date de la commande
          paiements.push({
            id: `paiement_${commande.id}`,
            montant: commande.total,
            type_paiement: 'payee',
            date: commande.date || commande.created_at,
            created_at: commande.created_at || commande.date,
            commande: commande
          });
        }
      });
      
      // Récupérer les décaisements
      const decaissementsResponse = await instance.get('/decaissements', { 
        params: { per_page: 100, ...filters } 
      });
      const decaissements = decaissementsResponse.data?.data || decaissementsResponse.data || [];
      
      // Combiner et trier par date
      const historique = [
        ...paiements.map(p => ({
          id: `paiement_${p.id}`,
          type: 'encaissement',
          date: p.date || p.created_at,
          created_at: p.created_at || p.date,
          paiement: p,
          commande: p.commande,
        })),
        ...commandesAnnulees.map(c => ({
          id: `annulation_${c.id}`,
          type: 'annulation',
          date: c.updated_at || c.created_at,
          created_at: c.updated_at || c.created_at,
          commande: c,
        })),
        ...decaissements.filter(d => d.statut?.toLowerCase() === 'fait').map(d => ({
          id: `decaissement_${d.id}`,
          type: 'decaissement',
          // Utiliser updated_at pour les décaissements validés (heure exacte de validation)
          date: d.updated_at || d.date || d.created_at,
          created_at: d.created_at || d.date,
          decaissement: d,
        }))
      ].sort((a, b) => {
        // Trier par date/heure exacte dans l'ordre chronologique (croissant)
        const dateA = new Date(a.date || a.created_at);
        const dateB = new Date(b.date || b.created_at);
        return dateA - dateB;
      });
      
      return historique;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
};

export default caissierApi;


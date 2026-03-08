// Service API pour l'interface caissier
import { httpClient } from '../../services/http/client';

export const caissierApi = {
  // ==================== DASHBOARD ====================
  
  /** Date du jour en local (YYYY-MM-DD) pour éviter les décalages timezone */
  getDateLocal(date = null) {
    const d = date ? new Date(date) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /**
   * Récupère les statistiques du jour
   */
  async getDashboardStats(date = null) {
      const today = date || this.getDateLocal();
      const response = await httpClient.get('/caissier/dashboard/stats', { params: { date: today } });
      const data = response.data || {};

      return {
        fondOuverture: data.fond_ouverture ?? 0,
        totalEncaissements: data.total_encaissements ?? 0,
        totalDecaissements: data.total_decaissements ?? 0,
        soldeActuel: data.solde_actuel ?? 0,
        ticketsEnAttente: data.tickets_en_attente ?? 0,
        ticketsTraites: data.tickets_traites ?? 0,
      };
  },

  /**
   * Récupère les ventes par moyen de paiement du jour
   */
  async getVentesParMoyen(date = null) {
    try {
      const today = date || this.getDateLocal();
      const response = await httpClient.get('/caissier/dashboard/ventes-par-moyen', { params: { date: today } });
      return response.data?.ventes || [];
    } catch {
      // Erreur silencieuse - retourner tableau vide
      return [];
    }
  },

  /**
   * Récupère les ventes par heure du jour
   */
  async getVentesParHeure(date = null) {
    try {
      const today = date || this.getDateLocal();
      const response = await httpClient.get('/caissier/dashboard/ventes-par-heure', { params: { date: today } });
      return response.data?.ventes || [];
    } catch {
      // Erreur silencieuse - retourner tableau vide
      return [];
    }
  },

  // ==================== CAISSE JOURNAL (CAISSIER) ====================

  /**
   * Liste des rapports journaliers (pour comptable / export).
   * @param {Object} params - date_debut, date_fin (Y-m-d), cloture (0|1)
   */
  async getCaissierCaisseJournalList(params = {}) {
    const response = await httpClient.get('/caissier/caisses-journal', { params });
    return response.data;
  },

  /**
   * Récupère le rapport journalier de caisse pour une date.
   */
  async getCaissierCaisseJournal(date) {
    const response = await httpClient.get(`/caissier/caisses-journal/${date}`);
    return response.data;
  },

  /**
   * Initialise (ou met à jour) le fond d'ouverture d'un jour.
   */
  async createCaissierCaisseJournal(data) {
    const response = await httpClient.post('/caissier/caisses-journal', data);
    return response.data;
  },

  /**
   * Clôture la caisse d'un jour.
   */
  async cloturerCaissierCaisseJournal(date, data) {
    const response = await httpClient.put(`/caissier/caisses-journal/${date}/cloture`, data);
    return response.data;
  },

  /**
   * Récupère l'activité récente (derniers encaissements et décaisements)
   */
  async getActiviteRecente(limit = 5) {
    try {
      // Récupérer les dernières commandes payées (limiter pour la performance)
      const commandesPayees = await httpClient.get('/commandes-payees', {
        params: { per_page: Math.min(limit * 2, 50) }
      });
      
      // Récupérer les derniers décaisements (limiter pour la performance)
      const decaissements = await httpClient.get('/decaissements', {
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
        if (dec.statut === 'valide') {
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
    } catch {
      // Erreur silencieuse - retourner tableau vide
      return [];
    }
  },

  // ==================== COMMANDES ====================
  
  /**
   * Récupère les commandes en attente (pagination côté serveur)
   * @param {Object} filters - { page, per_page, search }
   * @returns {Object} { data, total, current_page, last_page, per_page, total_amount }
   */
  async getCommandesAttente(filters = {}) {
      const response = await httpClient.get('/commandes-attente', { params: filters });
      return response.data;
  },

  /**
   * Récupère les commandes payées (historique des ventes)
   */
  async getCommandesPayees(filters = {}) {
      const response = await httpClient.get('/commandes-payees', { params: filters });
      return response.data;
  },

  /**
   * Récupère les détails d'une commande
   */
  async getCommandeDetails(commandeId) {
      const response = await httpClient.get(`/commandes/${commandeId}`);
      return response.data;
  },

  /**
   * Annule une commande
   */
  async annulerCommande(commandeId) {
      const response = await httpClient.post(`/commandes/${commandeId}/annuler`);
      return response.data;
  },

  // ==================== PAIEMENTS ====================
  
  /**
   * Crée un paiement (encaissement)
   */
  async creerPaiement(commandeId, data) {
      const response = await httpClient.post(`/commandes/${commandeId}/paiements`, {
        montant: data.montant,
        type_paiement: data.type_paiement
      });
      return response.data;
  },

  /**
   * Récupère les paiements d'une commande
   */
  async getPaiements(commandeId) {
      const response = await httpClient.get(`/commandes/${commandeId}/paiements`);
      return response.data;
  },

  // ==================== DÉCAISSEMENTS ====================
  
  /**
   * Récupère les décaissements en attente (pagination côté serveur)
   * @param {Object} filters - { page, per_page }
   * @returns {Object} { data, total, current_page, last_page, per_page, total_amount }
   */
  async getDecaissementsAttente(filters = {}) {
      const response = await httpClient.get('/decaissements-attente', { params: filters });
      return response.data;
  },

  /**
   * Récupère les décaisements
   */
  async getDecaissements(filters = {}) {
      const response = await httpClient.get('/decaissements', { params: filters });
      return response.data;
  },

  /**
   * Valide un décaisement
   */
  async validerDecaissement(decaissementId, data = {}) {
      const response = await httpClient.put(`/decaissements/${decaissementId}/statut`, {
        statut: 'valide',
        ...(data?.methode_paiement ? { methode_paiement: data.methode_paiement } : {})
      });
      return response.data;
  },

  /**
   * Annule un décaisement
   */
  async annulerDecaissement(decaissementId) {
      const response = await httpClient.delete(`/decaissements/${decaissementId}`);
      return response.data;
  },

  // ==================== HISTORIQUE ====================
  
  /**
   * Récupère l'historique complet (paiements + décaisements + annulations)
   * @param {Object} filters - { page, per_page, type, dateDebut, dateFin }
   */
  async getHistoriqueComplet(filters = {}) {
      const { page = 1, per_page = 50, ...otherFilters } = filters;
      // Pour la pagination côté serveur, charger plus de données de chaque source
      // puis combiner et paginer côté client (approche hybride)
      const itemsPerSource = Math.max(per_page * 3, 200); // Charger 3x plus pour avoir assez de données après filtrage
      
      // Récupérer les commandes payées avec leurs paiements (optimisé)
      const commandesPayeesResponse = await httpClient.get('/commandes-payees', { 
        params: { per_page: itemsPerSource, page: 1, ...otherFilters } 
      });
      const commandesPayees = commandesPayeesResponse.data?.data || commandesPayeesResponse.data || [];
      
      // Récupérer les commandes annulées
      const commandesAnnuleesResponse = await httpClient.get('/commandes-annulees', { 
        params: { per_page: itemsPerSource, page: 1, ...otherFilters } 
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
      
      // Récupérer les décaissements validés pour l'historique (statut "valide")
      const decaissementsResponse = await httpClient.get('/decaissements', { 
        params: { per_page: itemsPerSource, page: 1, ...otherFilters } 
      });
      const decaissementsRaw = decaissementsResponse.data?.data ?? decaissementsResponse.data ?? [];
      const decaissements = Array.isArray(decaissementsRaw) ? decaissementsRaw : [];
      const isDecaissementValide = (d) => {
        const s = (d?.statut ?? '').toString().toLowerCase();
        // Uniquement les décaissements avec statut "valide" ou "validé" (exclure "fait", "en_attente", etc.)
        return s === 'valide' || s === 'validé';
      };
      
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
        ...decaissements.filter(isDecaissementValide).map(d => ({
          id: `decaissement_${d.id}`,
          type: 'decaissement',
          // Date et heure du décaissement = moment de la validation (updated_at)
          date: d.updated_at || d.date || d.created_at,
          created_at: d.updated_at || d.date || d.created_at,
          decaissement: d,
        }))
      ].sort((a, b) => {
        // Trier par date/heure : plus récent en premier (ordre décroissant)
        const normalize = (v) => {
          if (!v) return null;
          const s = (typeof v === 'string' && v.includes(' ') && !v.includes('T')) ? v.replace(' ', 'T') : v;
          const d = new Date(s);
          return Number.isNaN(d.getTime()) ? null : d;
        };
        const dateA = normalize(a.date || a.created_at);
        const dateB = normalize(b.date || b.created_at);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
      });
      
      return historique;
  }
};

export default caissierApi;


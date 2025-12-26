import { instance } from './axios';

// Gestion du token dans localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Intercepteur pour ajouter le token aux requêtes
instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      // Note: La gestion de la redirection est gérée par les composants individuels
      console.warn('Erreur 401: Token manquant ou expiré');
    }
    return Promise.reject(error);
  }
);

// ===== AUTHENTIFICATION =====
export const authAPI = {
  register: async (data) => {
    const response = await instance.post('/auth/register', data);
    if (response.data.token) {
      setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await instance.post('/auth/login', { email, password });
    if (response.data.token) {
      setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await instance.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setToken(null);
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  changePassword: async (currentPassword, newPassword, newPasswordConfirmation) => {
    const response = await instance.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
    return response.data;
  },
};

// ===== COMMANDES =====
export const commandesAPI = {
  // Récupérer toutes les commandes
  getAll: async (params = {}) => {
    const response = await instance.get('/commandes', { params });
    return response.data;
  },

  // Récupérer les commandes en attente (pour le caissier)
  getPending: async () => {
    const response = await instance.get('/commandes/pending');
    return response.data;
  },

  // Récupérer une commande par ID
  getById: async (id) => {
    const response = await instance.get(`/commandes/${id}`);
    return response.data;
  },

  // Créer une commande
  create: async (data) => {
    const response = await instance.post('/commandes', data);
    return response.data;
  },

  // Valider une commande
  valider: async (id) => {
    const response = await instance.post(`/commandes/${id}/valider`);
    return response.data;
  },

  // Annuler une commande
  annuler: async (id) => {
    const response = await instance.post(`/commandes/${id}/annuler`);
    return response.data;
  },
};

// ===== PAIEMENTS =====
export const paiementsAPI = {
  // Enregistrer un paiement pour une commande
  create: async (commandeId, data) => {
    const response = await instance.post(`/commandes/${commandeId}/paiements`, {
      montant: data.montantPaye,
      type_paiement: data.moyenPaiement,
    });
    return response.data;
  },

  // Récupérer les paiements d'une commande
  getByCommande: async (commandeId) => {
    const response = await instance.get(`/commandes/${commandeId}/paiements`);
    return response.data;
  },
};

// ===== PRODUITS =====
export const produitsAPI = {
  getAll: async (params = {}) => {
    const response = await instance.get('/produits', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await instance.get(`/produits/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await instance.post('/produits', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await instance.put(`/produits/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await instance.delete(`/produits/${id}`);
  },
};

// ===== CLIENTS =====
export const clientsAPI = {
  getAll: async (params = {}) => {
    const response = await instance.get('/clients', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await instance.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await instance.post('/clients', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await instance.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await instance.delete(`/clients/${id}`);
  },
};

// ===== STOCKS =====
export const stocksAPI = {
  getAll: async (params = {}) => {
    const response = await instance.get('/stocks', { params });
    return response.data;
  },

  transfer: async (data) => {
    const response = await instance.post('/stocks/transfer', data);
    return response.data;
  },
};

// ===== DÉCAISSEMENTS =====
export const decaissementsAPI = {
  getAll: async () => {
    const response = await instance.get('/decaissements');
    return response.data;
  },

  getById: async (id) => {
    const response = await instance.get(`/decaissements/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await instance.post('/decaissements', data);
    return response.data;
  },

  valider: async (id) => {
    const response = await instance.put(`/decaissements/${id}/valider`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await instance.put(`/decaissements/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await instance.delete(`/decaissements/${id}`);
  },
};

// ===== CAISSES JOURNAL =====
export const caissesJournalAPI = {
  getByDate: async (date) => {
    const response = await instance.get(`/caisses-journal/${date}`);
    return response.data;
  },

  update: async (date, data) => {
    const response = await instance.put(`/caisses-journal/${date}`, data);
    return response.data;
  },

  cloture: async (date) => {
    const response = await instance.post(`/caisses-journal/${date}/cloture`);
    return response.data;
  },
};

// ===== HISTORIQUE =====
export const historiqueAPI = {
  get: async (filters = {}) => {
    const response = await instance.get('/caissier/historique', { params: filters });
    return response.data;
  },
};

// ===== DASHBOARD =====
export const dashboardAPI = {
  getStats: async (date = null) => {
    // Utiliser le rapport journalier pour obtenir les stats
    const dateStr = date || new Date().toISOString().split('T')[0];
    const response = await instance.get(`/caisses-journal/${dateStr}`);
    const rapport = response.data;
    
    // Calculer les stats depuis le rapport
    return {
      fondOuverture: rapport.fond_ouverture || 0,
      totalEncaissements: rapport.total_encaissements || 0,
      totalDecaissements: rapport.total_decaissements || 0,
      soldeActuel: rapport.solde_cloture || 0,
      ticketsEnAttente: 0, // Sera calculé depuis commandes/pending
      ticketsTraites: rapport.tickets_encaisses?.length || 0,
      ventesParMoyen: rapport.ventes_par_moyen || {},
    };
  },
};

// Export par défaut
export default {
  auth: authAPI,
  commandes: commandesAPI,
  paiements: paiementsAPI,
  produits: produitsAPI,
  clients: clientsAPI,
  stocks: stocksAPI,
  decaissements: decaissementsAPI,
  caissesJournal: caissesJournalAPI,
  historique: historiqueAPI,
  dashboard: dashboardAPI,
};


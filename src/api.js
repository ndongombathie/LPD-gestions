// Configuration de l'API
const API_BASE_URL = 'http://localhost:8000/api'; // Votre URL Laravel

// Headers communs pour toutes les requêtes
const getHeaders = () => {
  const token = localStorage.getItem('auth_token'); // Si vous avez de l'authentification
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Fonction utilitaire pour les appels API
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: getHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Service Produits
export const produitService = {
  async getAll() {
    return await fetchAPI('/produits');
  },

  async getById(id) {
    return await fetchAPI(`/produits/${id}`);
  },

  async getByCodeBarre(codeBarre) {
    return await fetchAPI(`/produits/code-barre/${codeBarre}`);
  },

  async search(query) {
    return await fetchAPI(`/produits/recherche?q=${encodeURIComponent(query)}`);
  },

  async updateStock(id, stock) {
    return await fetchAPI(`/produits/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ stock })
    });
  }
};

// Service Commandes
export const commandeService = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await fetchAPI(`/commandes?${queryString}`);
  },

  async getById(id) {
    return await fetchAPI(`/commandes/${id}`);
  },

  async create(commandeData) {
    return await fetchAPI('/commandes', {
      method: 'POST',
      body: JSON.stringify(commandeData)
    });
  },

  async updateStatus(id, statut) {
    return await fetchAPI(`/commandes/${id}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut })
    });
  },

  async annuler(id) {
    return await fetchAPI(`/commandes/${id}/annuler`, {
      method: 'PUT'
    });
  }
};

// Service Statistiques
export const statistiqueService = {
  async getDashboard() {
    return await fetchAPI('/dashboard');
  },

  async getVentesJournalieres() {
    return await fetchAPI('/statistiques/ventes-journalieres');
  },

  async getActivitesRecentes() {
    return await fetchAPI('/activites');
  }
};

// Service Clients
export const clientService = {
  async getAll() {
    return await fetchAPI('/clients');
  },

  async create(clientData) {
    return await fetchAPI('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  },

  async search(query) {
    return await fetchAPI(`/clients/recherche?q=${encodeURIComponent(query)}`);
  }
};

export default {
  produitService,
  commandeService,
  statistiqueService,
  clientService
};
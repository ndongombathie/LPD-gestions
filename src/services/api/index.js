/**
 * 🌐 API Index - Point d'entrée unique pour tous les APIs
 * 
 * Usage:
 * import { authAPI, commandesAPI, clientsAPI, ... } from '@/services/api';
 * 
 * ou
 * 
 * import apiClient from '@/services/api';
 * const commandes = await apiClient.commandes.getAll();
 */

export { authAPI, tokenManager, userManager } from './auth';
export { commandesAPI } from './commandes';
export { clientsAPI } from './clients';
export { produitsAPI } from './produits';
export { fournisseursAPI } from './fournisseurs';
export { utilisateursAPI } from './utilisateurs';
export { decaissementsAPI } from './decaissements';
export { stockAPI } from './stock';
export { paiementsAPI } from './paiements';
export { default as profileAPI } from './profile';

/**
 * ✅ AJOUT — API RAPPORTS (Audit Logs)
 */
export { default as rapportsAPI } from './rapports';



/**
 * Objet centralisé pour accès facile
 */
export default {
  auth: async () => {
    const { authAPI } = await import('./auth');
    return authAPI;
  },

  commandes: async () => {
    const { commandesAPI } = await import('./commandes');
    return commandesAPI;
  },

  clients: async () => {
    const { clientsAPI } = await import('./clients');
    return clientsAPI;
  },

  produits: async () => {
    const { produitsAPI } = await import('./produits');
    return produitsAPI;
  },

  fournisseurs: async () => {
    const { fournisseursAPI } = await import('./fournisseurs');
    return fournisseursAPI;
  },

  utilisateurs: async () => {
    const { utilisateursAPI } = await import('./utilisateurs');
    return utilisateursAPI;
  },

  decaissements: async () => {
    const { decaissementsAPI } = await import('./decaissements');
    return decaissementsAPI;
  },

  stock: async () => {
    const { stockAPI } = await import('./stock');
    return stockAPI;
  },

  paiements: async () => {
    const { paiementsAPI } = await import('./paiements');
    return paiementsAPI;
  },

  profile: async () => {
    const { default: profileAPI } = await import('./profile');
    return profileAPI;
  },

  /**
   * ✅ AJOUT — accès dynamique aux rapports
   */
  rapports: async () => {
  const { default: rapportsAPI } = await import('./rapports');
  return rapportsAPI;

  },
};

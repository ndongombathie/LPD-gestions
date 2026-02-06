/**
 * 🌐 API Index - Point d'entrée unique pour tous les APIs
 *
 * Usage:
 * import { authAPI, commandesAPI, clientsAPI } from '@/services/api';
 *
 * ou
 *
 * import apiClient from '@/services/api';
 * const utilisateurs = await (await apiClient.utilisateurs()).getAll();
 */

// ===== EXPORTS NOMMÉS =====
export { authAPI, tokenManager, userManager } from './auth';
export { commandesAPI } from './commandes';
export { clientsAPI } from './clients';
export { produitsAPI } from './produits';
export { fournisseursAPI } from './fournisseurs';
export { decaissementsAPI } from './decaissements';
export { stockAPI } from './stock';
export { paiementsAPI } from './paiements';
export { default as profileAPI } from './profile';

// ⚠️ utilisateurs = EXPORT PAR DÉFAUT
export { default as utilisateursAPI } from './utilisateurs';

/**
 * 📦 Objet centralisé (lazy loading)
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
    const { default: utilisateursAPI } = await import('./utilisateurs');
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
};

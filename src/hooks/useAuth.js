/**
 * 🎣 useAuth Hook - Utiliser AuthContext facilement
 * 
 * Usage:
 * const { user, login, logout, isAuthenticated } = useAuth();
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export default function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('❌ useAuth doit être utilisé à l\'intérieur d\'un <AuthProvider>');
  }
  
  return context;
}

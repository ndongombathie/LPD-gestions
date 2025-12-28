// ==========================================================
// 🔐 ProtectedRoute.jsx — Protection des routes par rôle
// ==========================================================

import { Navigate, useLocation } from "react-router-dom";

/**
 * Composant de protection des routes
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à protéger
 * @param {string[]} props.allowedRoles - Rôles autorisés (optionnel)
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Si pas de token, rediriger vers login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si des rôles sont spécifiés, vérifier l'autorisation
  if (allowedRoles.length > 0 && userStr) {
    try {
      const user = JSON.parse(userStr);
      const userRole = user?.role?.toLowerCase();

      // L'admin est autorisé partout
      if (userRole === 'admin') {
        return children;
      }

      // Vérifier si le rôle de l'utilisateur est autorisé
      if (!allowedRoles.some(role => role.toLowerCase() === userRole)) {
        // Rediriger vers le dashboard correspondant au rôle
        const redirectMap = {
          'responsable': '/responsable/dashboard',
          'comptable': '/comptable/dashboard',
          'gestionnaire-boutique': '/gestionnaire-boutique/dashboard',
          'gestionnaire-depot': '/depot/dashboard',
          'caissier': '/caissier/dashboard',
          'vendeur': '/vendeur',
          'admin': '/responsable/dashboard'
        };
        
        const redirectPath = redirectMap[userRole] || '/login';
        return <Navigate to={redirectPath} replace />;
      }
    } catch (error) {
      console.error("Erreur parsing user:", error);
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

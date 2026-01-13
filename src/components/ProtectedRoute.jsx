// ==========================================================
// 🔐 ProtectedRoute.jsx — Protection des routes par rôle
// ==========================================================

import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * Composant de protection des routes
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à protéger
 * @param {string[]} props.allowedRoles - Rôles autorisés (optionnel)
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  // Si pas de token, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si des rôles sont spécifiés, vérifier l'autorisation
  if (allowedRoles.length > 0 && user) {
    const userRole = user?.role?.toLowerCase();

    // L'admin est autorisé partout
    if (userRole === "admin") {
      return children;
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!allowedRoles.some((role) => role.toLowerCase() === userRole)) {
      const redirectMap = {
        responsable: "/responsable/dashboard",
        comptable: "/comptable/dashboard",
        "gestionnaire-boutique": "/gestionnaire-boutique/dashboard",
        "gestionnaire_depot": "/depot/dashboard",
        caissier: "/caissier/dashboard",
        vendeur: "/vendeur",
        admin: "/responsable/dashboard",
      };

      const redirectPath = redirectMap[userRole] || "/login";
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
}

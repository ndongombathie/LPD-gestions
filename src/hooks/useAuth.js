/**
 * 🎣 useAuth Hook - Accès simplifié à AuthContext
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { authAPI } from "@/services/api/auth";

export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "❌ useAuth doit être utilisé à l'intérieur d'un <AuthProvider>"
    );
  }

  const { user, setUser, logout } = context;

  /**
   * 🔐 Changement de mot de passe
   */
  const changePassword = async (
    currentPassword,
    newPassword,
    newPasswordConfirmation
  ) => {
    const res = await authAPI.changePassword(
      currentPassword,
      newPassword,
      newPasswordConfirmation
    );

    // Optionnel : si backend renvoie user mis à jour
    if (res?.user && setUser) {
      setUser(res.user);
    }

    return res;
  };

  return {
    ...context,
    user,
    logout,
    changePassword,
  };
}

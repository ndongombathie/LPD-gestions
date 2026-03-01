import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commandesAPI } from "@/services/api";
import { logger } from "@/utils/logger";

export function usePaiementsClients(toast) {
  const queryClient = useQueryClient();

  // ======================================================
  // 🔄 Charger les paiements d’un client spécial
  // ======================================================
  // ✅ CORRECTION :
  // On ne modifie plus le cache manuellement.
  // Laravel recalcule tout (montant payé, reste, statut).
  const loadPaiementsForClient = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["clients-speciaux"],
      });
    } catch (error) {
      logger.error("usePaiementsClients.load", { error });
      toast("error", "Erreur", "Impossible de charger les paiements.");
    }
  };

  // ======================================================
  // ➕ Créer une tranche (en attente caisse)
  // ✅ CORRECTION : Utilise commandesAPI.envoyerTranche()
  // ✅ CORRECTION : N'envoie que le montant
  // ======================================================
  const trancheMutation = useMutation({
    mutationFn: ({ commandeId, montant }) =>
      commandesAPI.envoyerTranche(commandeId, {
        montant,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-speciaux"],
      });

      toast(
        "success",
        "Tranche envoyée",
        "La tranche est en attente caisse."
      );
    },

    onError: (error) => {
      logger.error("usePaiementsClients.create", { error });
      toast("error", "Erreur", "Impossible de créer la tranche.");
    },
  });

  // ======================================================
  // ✏️ Modifier une tranche (reste en attente)
  // ❌ DÉSACTIVÉ - Retourne une fonction qui affiche une erreur
  // ======================================================
  const handleVoirDetailEditTranche = (commande, paiement, newMontant, onSuccessCallback) => {
    toast("error", "Modification impossible", "Cette opération n'est pas disponible.");
    if (onSuccessCallback) onSuccessCallback();
  };

  // ======================================================
  // 🗑 Supprimer une tranche
  // ❌ DÉSACTIVÉ - Retourne une fonction qui affiche une erreur
  // ======================================================
  const handleVoirDetailDeleteTranche = (commande, paiement, onSuccessCallback) => {
    toast("error", "Suppression impossible", "Cette opération n'est pas disponible.");
    if (onSuccessCallback) onSuccessCallback();
  };

  return {
    loadPaiementsForClient,

    // ✅ handleTrancheSubmit : n'envoie que le montant
    handleTrancheSubmit: (commande, montant, onSuccessCallback) =>
      trancheMutation.mutate(
        {
          commandeId: commande.id,
          montant,
        },
        {
          onSuccess: () => {
            if (onSuccessCallback) onSuccessCallback();
          },
        }
      ),

    // ✅ Fonctions désactivées (backend 405)
    handleVoirDetailEditTranche,
    handleVoirDetailDeleteTranche,
  };
}
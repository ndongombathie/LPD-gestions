import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paiementsAPI } from "@/services/api";
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
  // ======================================================
  const trancheMutation = useMutation({
    mutationFn: ({ commandeId, tranche }) =>
    paiementsAPI.create(commandeId, {
      montant: tranche.montant,
      mode_paiement: tranche.mode,
      date_paiement: tranche.date,
      type_paiement: "tranche",
      commentaire: tranche.commentaire || "",
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
  // ======================================================
  const editTrancheMutation = useMutation({
    mutationFn: (p) =>
      paiementsAPI.update(p.id, {
        montant: p.montant,
        mode_paiement: p.mode_paiement,
        date_paiement: p.date_paiement || p.date,        commentaire: p.commentaire || "",
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-speciaux"],
      });

      toast("success", "Tranche modifiée", "Mise à jour réussie.");
    },

    onError: (error) => {
      logger.error("usePaiementsClients.update", { error });
      toast("error", "Erreur", "Impossible de modifier la tranche.");
    },
  });

  // ======================================================
  // 🗑 Supprimer une tranche
  // ======================================================
  const deleteTrancheMutation = useMutation({
    mutationFn: (id) => paiementsAPI.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients-speciaux"],
      });

      toast("success", "Tranche supprimée", "Suppression réussie.");
    },

    onError: (error) => {
      logger.error("usePaiementsClients.delete", { error });
      toast("error", "Erreur", "Impossible de supprimer la tranche.");
    },
  });

  return {
    loadPaiementsForClient,

    handleTrancheSubmit: (commande, tranche) =>
      trancheMutation.mutate({
        commandeId: commande.id,
        tranche,
      }),

    handleVoirDetailEditTranche: (commande, paiement) =>
      editTrancheMutation.mutate(paiement),

    handleVoirDetailDeleteTranche: (commande, paiement) =>
      deleteTrancheMutation.mutate(paiement.id),
  };
}

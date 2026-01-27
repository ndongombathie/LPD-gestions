// src/hooks/usePaiementsClients.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paiementsAPI } from "@/services/api";
import { logger } from "@/utils/logger";

export function usePaiementsClients(toast) {
  const queryClient = useQueryClient();

  // ======================================================
  // 🔄 Charger les paiements d’un client
  // (injection dans le cache React Query)
  // ======================================================
  const loadPaiementsForClient = async (clientId) => {
    try {
      const cache = queryClient.getQueryData(["clients-speciaux"]);
      if (!cache) return;

      const { clients, commandes } = cache;
      const commandesClient = commandes.filter(
        (c) => c.clientId === clientId
      );

      if (!commandesClient.length) return;

      const updatedCommandes = [...commandes];

      await Promise.all(
        commandesClient.map(async (cmd) => {
          try {
            const payload = await paiementsAPI.getByCommande(cmd.id);

            const paiements = (payload || []).map((p) => ({
              id: p.id,
              date: p.date_paiement || p.date || "",
              montant:
                Number(
                  p.montant || p.montant_paye || p.montant_paiement || 0
                ) || 0,
              mode: p.mode_paiement || p.mode || "especes",
              commentaire: p.commentaire || "",
              statut:
                p.statut ||
                p.status ||
                p.statut_paiement ||
                p.statutPaiement ||
                null,
              type: p.type_paiement || p.type || p.typePaiement || null,
            }));

            const idx = updatedCommandes.findIndex(
              (c) => c.id === cmd.id
            );
            if (idx !== -1) {
              updatedCommandes[idx] = {
                ...updatedCommandes[idx],
                paiements,
              };
            }
          } catch (e) {
            logger.error("usePaiementsClients.load.commande", { error: e });
          }
        })
      );

      queryClient.setQueryData(["clients-speciaux"], {
        clients,
        commandes: updatedCommandes,
      });
    } catch (error) {
      logger.error("usePaiementsClients.load", { error });
      toast(
        "error",
        "Erreur",
        "Impossible de charger les paiements de ce client."
      );
    }
  };

  // ======================================================
  // ➕ Créer une tranche
  // ======================================================
  const trancheMutation = useMutation({
    mutationFn: ({ commandeId, tranche }) =>
      paiementsAPI.create(commandeId, {
        montant: tranche.montant,
        mode_paiement: tranche.mode,
        date_paiement: tranche.date,
        type_paiement: "tranche",
        statut_paiement: "en_attente_caisse",
        statut: "en_attente_caisse",
        commentaire: tranche.commentaire || "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast(
        "success",
        "Tranche en attente caisse",
        "La tranche a été envoyée à la caisse."
      );
    },
    onError: (error) => {
      logger.error("usePaiementsClients.create", { error });

      if (error.response?.status === 422 && error.response.data?.errors) {
        const firstError =
          Object.values(error.response.data.errors)[0]?.[0] ||
          "Vérifiez les informations de la tranche.";
        toast("error", "Tranche refusée", firstError);
      } else {
        toast(
          "error",
          "Erreur",
          "Impossible d'enregistrer cette tranche pour le moment."
        );
      }
    },
  });

  // ======================================================
  // ✏️ Modifier une tranche
  // ======================================================
  const editTrancheMutation = useMutation({
    mutationFn: (updatedPaiement) =>
      paiementsAPI.update(updatedPaiement.id, {
        montant: updatedPaiement.montant,
        mode_paiement: updatedPaiement.mode,
        date_paiement: updatedPaiement.date,
        commentaire: updatedPaiement.commentaire || "",
        statut_paiement: "en_attente_caisse",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast(
        "success",
        "Tranche modifiée",
        "La tranche a été mise à jour."
      );
    },
    onError: (error) => {
      logger.error("usePaiementsClients.update", { error });
      toast(
        "error",
        "Erreur",
        "Impossible de modifier cette tranche."
      );
    },
  });

  // ======================================================
  // 🗑 Supprimer une tranche
  // ======================================================
  const deleteTrancheMutation = useMutation({
    mutationFn: (paiementId) =>
      paiementsAPI.delete(paiementId),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast(
        "success",
        "Tranche supprimée",
        "La tranche a été supprimée."
      );
    },
    onError: (error) => {
      logger.error("usePaiementsClients.delete", { error });
      toast(
        "error",
        "Erreur",
        "Impossible de supprimer cette tranche."
      );
    },
  });

  // ======================================================
  // API DU HOOK
  // ======================================================
  return {
    loadPaiementsForClient,
    handleTrancheSubmit: (commande, tranche) =>
      trancheMutation.mutate({
        commandeId: commande.id,
        tranche,
      }),
    handleVoirDetailEditTranche: (commande, updatedPaiement) =>
      editTrancheMutation.mutate(updatedPaiement),
    handleVoirDetailDeleteTranche: (commande, paiement) =>
      deleteTrancheMutation.mutate(paiement.id),
  };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paiementsAPI } from "@/services/api";
import { logger } from "@/utils/logger";

export function usePaiementsClients(toast) {
  const queryClient = useQueryClient();

  // ======================================================
  // 🔄 Charger TOUS les paiements d’un client spécial
  // ======================================================
  const loadPaiementsForClient = async (clientId) => {
    try {
      const cache = queryClient.getQueryData(["clients-speciaux"]);
      if (!cache) return;

      const { clients, commandes } = cache;

      const commandesClient = commandes.filter(c => c.clientId === clientId);
      if (!commandesClient.length) return;

      const updatedCommandes = [...commandes];

      await Promise.all(
        commandesClient.map(async (cmd) => {
          try {
            const payload = await paiementsAPI.getByCommande(cmd.id);

            const paiements = (payload || []).map((p) => ({
              id: p.id,
              date_paiement: p.date_paiement,
              montant: Number(p.montant || 0),
              mode_paiement: p.mode_paiement,
              commentaire: p.commentaire || "",
              statut_paiement: p.statut_paiement,   // 🔑 LARAVEL
              type_paiement: p.type_paiement,       // 🔑 LARAVEL
            }));

            const idx = updatedCommandes.findIndex(c => c.id === cmd.id);
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
        statut_paiement: "en_attente_caisse",
        commentaire: tranche.commentaire || "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Tranche envoyée", "La tranche est en attente caisse.");
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
        date_paiement: p.date,
        commentaire: p.commentaire || "",
        statut_paiement: "en_attente_caisse",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Tranche modifiée", "Mise à jour réussie.");
    },
  });

  // ======================================================
  // 🗑 Supprimer une tranche
  // ======================================================
  const deleteTrancheMutation = useMutation({
    mutationFn: (id) => paiementsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Tranche supprimée", "Suppression réussie.");
    },
  });

  return {
    loadPaiementsForClient,
    handleTrancheSubmit: (commande, tranche) =>
      trancheMutation.mutate({ commandeId: commande.id, tranche }),

    handleVoirDetailEditTranche: (commande, paiement) =>
      editTrancheMutation.mutate(paiement),

    handleVoirDetailDeleteTranche: (commande, paiement) =>
      deleteTrancheMutation.mutate(paiement.id),
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsAPI, commandesAPI } from "@/services/api";
import { logger } from "@/utils/logger";
import { normalizeCommande } from "@/utils/normalizeCommande";
import { useMemo } from "react";

export function useClientsSpeciaux(toast, { page, search, etat }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clients-speciaux", page, search, etat],
    placeholderData: (prev) => prev,
    staleTime: 30000,

    queryFn: async () => {
      const [resumeRes, commandesRes] = await Promise.all([
      clientsAPI.getResumeFinancierSpeciaux({
        page: page,
        etat: etat,
        ...(search ? { search } : {}),
      }),

        commandesAPI.getAll({
          type_client: "special",
          per_page: 1000,
        }),
      ]);

      const clients = resumeRes?.data ?? [];
      const meta = {
        total: resumeRes?.total ?? 0,
        last_page: resumeRes?.last_page ?? 1,
      };

      const commandesPayload = Array.isArray(commandesRes.data)
        ? commandesRes.data
        : commandesRes.data?.data || [];

      const commandes = commandesPayload
        .map(normalizeCommande)
        .filter(Boolean)
        .map((cmd) => ({
          ...cmd,
          clientId: cmd.clientId ? String(cmd.clientId) : null,
        }));

      return {
        clients,
        commandes,
        meta,
      };
    },

    onError: (error) => {
      logger.error("useClientsSpeciaux.fetch", { error });
      toast(
        "error",
        "Erreur",
        "Impossible de charger les clients spéciaux."
      );
    },
  });

  const clients = query.data?.clients ?? [];
  const commandes = query.data?.commandes ?? [];
  const meta = query.data?.meta ?? {};

  // ===============================
  // INDEX COMMANDES PAR CLIENT
  // ===============================
  const commandesParClient = useMemo(() => {
    const map = {};
    commandes.forEach((cmd) => {
      if (!cmd.clientId) return;
      if (!map[cmd.clientId]) map[cmd.clientId] = [];
      map[cmd.clientId].push(cmd);
    });
    return map;
  }, [commandes]);

  // ===============================
  // ENRICHISSEMENT UNIQUEMENT TRANCHES
  // ===============================
  const clientsWithTranches = useMemo(() => {
    return clients.map((client) => {
      const cs = commandesParClient[String(client.id)] || [];

      let nbTranchesEnAttente = 0;
      let montantTranchesEnAttente = 0;

      cs.forEach((cmd) => {
          if (
          cmd.statut !== "annulee" &&
          Number(cmd.resteAPayer || 0) > 0
        ) {
          nbTranchesEnAttente++;
          montantTranchesEnAttente += Number(cmd.montantAEncaisser || 0);
        }
      });

      return {
        ...client,
        nomComplet: [client.prenom, client.nom]
          .filter(Boolean)
          .join(" "),
        nbTranchesEnAttente,
        montantTranchesEnAttente,
      };
    });
  }, [clients, commandesParClient]);

const invalidate = () =>
  queryClient.invalidateQueries({
    queryKey: ["clients-speciaux"],
    exact: false,
  });

  const addMutation = useMutation({
    mutationFn: ({ onSuccess, onError, ...data }) =>
      clientsAPI.create({
        ...data,
        type_client: "special",
      }),
    onSuccess: (_, variables) => {
      invalidate();
      toast("success", "Client ajouté");
      variables?.onSuccess?.();
    },
    onError: (error, variables) => {
      toast(
        "error",
        "Création impossible",
        error?.response?.data?.message ||
          "Impossible de créer le client."
      );
      variables?.onError?.();
    },
  });

const editMutation = useMutation({
  mutationFn: ({ id, data }) => clientsAPI.update(id, data),

  onSuccess: () => {
    invalidate();
    toast("success", "Client modifié");
  },

  onError: (error) => {
    toast(
      "error",
      "Modification impossible",
      error?.response?.data?.message ||
      "Impossible de modifier ce client."
    );
  },
});

  const deleteMutation = useMutation({
    mutationFn: ({ id }) => clientsAPI.delete(id),
    onSuccess: (_, variables) => {
      invalidate();
      toast("success", "Client supprimé");
      variables?.onSuccess?.();
    },
  });

return {
  clients: clientsWithTranches,
  commandes,
  totalPages: meta.last_page || 1,
  totalClients: meta.total || 0,
  loading: query.isFetching,

  handleAdd: addMutation.mutate,

  handleEdit: ({ id, onSuccess, onError, ...data }) =>
    id &&
    editMutation.mutate(
      { id, data },
      {
        onSuccess,
        onError,
      }
    ),

  handleDelete: (id, onSuccess) =>
    deleteMutation.mutate({ id, onSuccess }),
};
}
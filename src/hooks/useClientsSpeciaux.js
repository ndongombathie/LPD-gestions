import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsAPI, commandesAPI } from "@/services/api";
import { logger } from "@/utils/logger";
import { normalizeCommande } from "@/utils/normalizeCommande";
import { useMemo } from "react";

export function useClientsSpeciaux(toast, { page, search }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clients-speciaux", page, search],
    keepPreviousData: true,
    staleTime: 30000,

    queryFn: async () => {
      const [clientsRes, commandesRes] = await Promise.all([
        clientsAPI.getAll({
          type_client: "special",
          page,
          search: search || undefined,
        }),
        commandesAPI.getAll({
          type_client: "special",
          per_page: 1000,
        })
      ]);

      // ===============================
      // STATS BACKEND
      // ===============================
      const stats =
        commandesRes?.stats ||
        commandesRes?.data?.stats ||
        null;

      // ===============================
      // CLIENTS
      // ===============================
      const payload = clientsRes?.data ?? [];

      const meta = {
        total: clientsRes?.total ?? 0,
        last_page: clientsRes?.last_page ?? 1,
      };

      const normalizedClients = payload.map((c) => ({
        id: String(c.id),
        nom: c.nom || "",
        contact: c.contact || c.telephone || "",
        entreprise: c.entreprise || "",
        adresse: c.adresse || "",
        nbCommandes: Number(c.commandes_count ?? 0),
      }));

      // ===============================
      // COMMANDES
      // ===============================
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
        clients: normalizedClients,
        commandes,
        meta,
        stats,
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
  // STATS GLOBALES (depuis backend)
  // ===============================
  const statsGlobales = {
    nbClients: Number(meta.total ?? 0),
    totalTTC: Number(query.data?.stats?.totalTTC ?? 0),
    totalPaye: Number(query.data?.stats?.totalPaye ?? 0),
    detteTotale: Number(query.data?.stats?.dette ?? 0),
  };

  // ===============================
  // INDEX COMMANDES PAR CLIENT
  // ===============================
  const commandesParClient = useMemo(() => {
    const map = {};

    commandes.forEach((cmd) => {
      if (!cmd.clientId) return;

      if (!map[cmd.clientId]) {
        map[cmd.clientId] = [];
      }

      map[cmd.clientId].push(cmd);
    });

    return map;
  }, [commandes]);

  // ===============================
  // CLIENTS ENRICHIS
  // ===============================
  const clientsEnrichis = useMemo(() => {
    return clients.map((client) => {
      const cs = commandesParClient[client.id] || [];

      let totalTTC = 0;
      let totalPaye = 0;
      let detteTotale = 0;
      let nbTranchesEnAttente = 0;
      let montantTranchesEnAttente = 0;

      cs.forEach((cmd) => {
        if (cmd.statut !== "annulee") {
          totalTTC += Number(cmd.totalTTC || 0);
          (cmd.paiements || []).forEach((p) => {
            totalPaye += Number(p.montant || 0);
          });
        }

        (cmd.paiements || []).forEach((p) => {
          if (
            p.type_paiement === "tranche" &&
            cmd.statut !== "annulee" &&
            cmd.resteAPayer > 0
          ) {
            nbTranchesEnAttente++;
            montantTranchesEnAttente += Number(p.montant || 0);
          }
        });
      });

      detteTotale = totalTTC - totalPaye;
      
      return {
        ...client,
        nbCommandes: client.nbCommandes,
        totalTTC,
        totalPaye,
        detteTotale,
        nbTranchesEnAttente,
        montantTranchesEnAttente,
      };
    });
  }, [clients, commandesParClient]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["clients-speciaux"],
    });

  const addMutation = useMutation({
    mutationFn: ({ onSuccess, onError, ...data }) =>
      clientsAPI.create({
        ...data,
        type_client: "special",
        solde: 0,
      }),

    onSuccess: (_, variables) => {
      invalidate();
      toast("success", "Client ajouté");
      variables?.onSuccess?.();
    },

    onError: (error, variables) => {
      const message =
        error?.response?.data?.message ||
        "Impossible de créer le client.";

      toast("error", "Création impossible", message);
      variables?.onError?.();
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => clientsAPI.update(id, data),
    onSuccess: (_, variables) => {
      invalidate();
      toast("success", "Client modifié");
      variables?.data?.onSuccess?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }) => clientsAPI.delete(id),
    onSuccess: (_, variables) => {
      invalidate();
      toast("success", "Client supprimé");
      variables?.onSuccess?.();
    },
    onError: (error, variables) => {
      toast(
        "error",
        "Suppression refusée car il a des dettes",
        error?.response?.data?.message ??
        "Impossible de supprimer ce client."
      );
      variables?.onSuccess?.();
    },
  });

  return {
    clients,
    commandes,
    clientsEnrichis,
    statsGlobales,
    totalPages: meta.last_page || 1,
    loading: query.isLoading ,
    handleAdd: addMutation.mutate,
    handleEdit: (data) =>
      data?.id && editMutation.mutate({ id: data.id, data }),
    handleDelete: (id, onSuccess) =>
      deleteMutation.mutate({ id, onSuccess }),
  };
}
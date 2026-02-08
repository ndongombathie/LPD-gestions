import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsAPI, commandesAPI } from "@/services/api";
import { logger } from "@/utils/logger";
import { normalizeCommande } from "@/utils/normalizeCommande";
import { useMemo, useState } from "react";

export function useClientsSpeciaux(toast) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // ===========================
  // FETCH (AVEC PAGINATION)
  // ===========================
  const query = useQuery({
    queryKey: ["clients-speciaux", page],
    keepPreviousData: true,

    queryFn: async () => {
      const [clientsRes, commandesRes] = await Promise.all([
        clientsAPI.getAll({ type_client: "special", page }),
        commandesAPI.getAll({ type_client: "special" }),
      ]);

      // ⚠️ clientsRes est DÉJÀ response.data
      const payload = Array.isArray(clientsRes.data) 
        ? clientsRes.data 
        : clientsRes.data ?? [];

      const meta = clientsRes.meta ?? {};

      // ================= CLIENTS =================
      const normalizedClients = payload.map((c) => ({
        id: c.id,
        nom: c.nom || "",
        contact: c.contact || c.telephone || "",
        entreprise: c.entreprise || "",
        adresse: c.adresse || "",
      }));

      // ================= COMMANDES =================
      const commandesPayload = Array.isArray(commandesRes.data)
        ? commandesRes.data
        : commandesRes.data?.data || [];

      const commandes = commandesPayload.map(normalizeCommande);

      return {
        clients: normalizedClients,
        commandes,
        meta,
      };
    },

    onError: (error) => {
      logger.error("useClientsSpeciaux.fetch", { error });
      toast("error", "Erreur", "Impossible de charger les clients spéciaux.");
    },
  });

  const clients = query.data?.clients || [];
  const commandes = query.data?.commandes || [];
  const meta = query.data?.meta || {};

  // ===========================
  // COMMANDES ACTIVES
  // ===========================
  const commandesActives = useMemo(
    () => commandes.filter((c) => c.statut !== "annulee"),
    [commandes]
  );

  // ===========================
  // CLIENTS ENRICHIS
  // ===========================
  const clientsEnrichis = useMemo(() => {
    return clients.map((client) => {
      const cs = commandesActives.filter(
        (cmd) => String(cmd.clientId) === String(client.id)
      );

      let totalTTC = 0;
      let totalPaye = 0;
      let detteTotale = 0;
      let nbTranchesEnAttente = 0;
      let montantTranchesEnAttente = 0;

      cs.forEach((cmd) => {
        totalTTC += Number(cmd.totalTTC || 0);
        totalPaye += Number(cmd.montantPaye || 0);
        detteTotale += Number(cmd.resteAPayer || 0);

        const tranches = (cmd.paiements || []).filter(
          (p) =>
            p.type_paiement === "tranche" &&
            p.statut_paiement === "en_attente_caisse"
        );

        nbTranchesEnAttente += tranches.length;
        montantTranchesEnAttente += tranches.reduce(
          (s, p) => s + Number(p.montant || 0),
          0
        );
      });

      return {
        ...client,
        nbCommandes: cs.length,
        totalTTC,
        totalPaye,
        detteTotale,
        nbTranchesEnAttente,
        montantTranchesEnAttente,
      };
    });
  }, [clients, commandesActives]);

  // ===========================
  // STATS GLOBALES
  // ===========================
  const statsGlobales = useMemo(() => {
    return {
      nbClients: meta.total || clientsEnrichis.length,
      totalTTC: clientsEnrichis.reduce((s, c) => s + c.totalTTC, 0),
      totalPaye: clientsEnrichis.reduce((s, c) => s + c.totalPaye, 0),
      detteTotale: clientsEnrichis.reduce((s, c) => s + c.detteTotale, 0),
    };
  }, [clientsEnrichis, meta]);

  // ===========================
  // MUTATIONS
  // ===========================
  const addMutation = useMutation({
    mutationFn: (data) =>
      clientsAPI.create({ ...data, type_client: "special", solde: 0 }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Client ajouté");

      variables?.onSuccess?.();
    },

  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => clientsAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Client modifié");

      variables?.data?.onSuccess?.();
    },
  });


const deleteMutation = useMutation({
  mutationFn: ({ id }) => clientsAPI.delete(id),

  onSuccess: (_, variables) => {
    queryClient.invalidateQueries(["clients-speciaux"]);
    toast("success", "Client supprimé");

    variables?.onSuccess?.(); // ferme le modal
  },

  onError: (error, variables) => {
    const message =
      error?.response?.data?.message ||
      "Impossible de supprimer ce client .";

    toast("error", "Suppression refusée car il a des dettes ", message);

    variables?.onSuccess?.(); // ✅ ferme aussi le modal en cas d’échec
  },
});



  return {
    clients,
    commandes,
    clientsEnrichis,
    statsGlobales,

    page,
    totalPages: meta.last_page || 1,
    setPage,

    loading: query.isLoading || query.isFetching,

    handleAdd: addMutation.mutate,
    handleEdit: (data) => {
      if (!data?.id) {
        console.error("ID client manquant :", data);
        return;
      }

      editMutation.mutate({
        id: data.id,
        data
      });
    },
    handleDelete: (id, onSuccess) =>
    deleteMutation.mutate({ id, onSuccess }),

  };
}

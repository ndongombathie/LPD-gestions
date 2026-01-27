// src/hooks/useClientsSpeciaux.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsAPI, commandesAPI } from "@/services/api";
import { logger } from "@/utils/logger";
import { normalizeCommande } from "@/utils/normalizeCommande";
import { useMemo } from "react";

export function useClientsSpeciaux(toast) {
  const queryClient = useQueryClient();

  // ===========================
  // FETCH (React Query)
  // ===========================
  const query = useQuery({
    queryKey: ["clients-speciaux"],
    queryFn: async () => {
      const [clientsRes, commandesRes] = await Promise.all([
        clientsAPI.getAll({ type_client: "special" }),
        commandesAPI.getAll(),
      ]);

      const clientsPayload = Array.isArray(clientsRes?.data)
        ? clientsRes.data
        : clientsRes;

      const normalizedClients = (clientsPayload || []).map((c) => ({
        id: c.id,
        nom: c.nom || "",
        contact: c.contact || c.telephone || "",
        entreprise: c.entreprise || "",
        adresse: c.adresse || "",
      }));

      const commandesPayload = Array.isArray(commandesRes.data?.data)
        ? commandesRes.data.data
        : commandesRes.data;

      const allCommandes = (commandesPayload || []).map(normalizeCommande);

      const clientIds = new Set(normalizedClients.map((c) => c.id));
      const commandesClientsSpeciaux = allCommandes.filter((cmd) =>
        clientIds.has(cmd.clientId)
      );

      return {
        clients: normalizedClients,
        commandes: commandesClientsSpeciaux,
      };
    },
    onError: (error) => {
      logger.error("useClientsSpeciaux.fetch", { error });
      toast(
        "error",
        "Erreur de chargement",
        "Impossible de charger les clients spéciaux."
      );
    },
  });

  const clients = query.data?.clients || [];
  const commandes = query.data?.commandes || [];

  // ===========================
  // LOGIQUE MÉTIER (inchangée)
  // ===========================
  const commandesActives = useMemo(
    () => commandes.filter((c) => c.statut !== "annulee"),
    [commandes]
  );

  const clientsEnrichis = useMemo(() => {
    return clients.map((c) => {
      const cs = commandesActives.filter((cmd) => cmd.clientId === c.id);

      const totalTTC = cs.reduce((s, x) => s + (x.totalTTC || 0), 0);
      const totalPaye = cs.reduce((s, x) => s + (x.montantPaye || 0), 0);
      const detteTotale = cs.reduce(
        (s, x) => s + Math.max(x.resteAPayer || 0, 0),
        0
      );

      return {
        ...c,
        nbCommandes: cs.length,
        totalTTC,
        totalPaye,
        detteTotale,
      };
    });
  }, [clients, commandesActives]);

  const statsGlobales = useMemo(() => {
    return {
      nbClients: clientsEnrichis.length,
      totalTTC: clientsEnrichis.reduce((s, c) => s + c.totalTTC, 0),
      totalPaye: clientsEnrichis.reduce((s, c) => s + c.totalPaye, 0),
      detteTotale: clientsEnrichis.reduce((s, c) => s + c.detteTotale, 0),
    };
  }, [clientsEnrichis]);

  // ===========================
  // MUTATIONS CRUD
  // ===========================
  const addMutation = useMutation({
    mutationFn: (data) =>
      clientsAPI.create({ ...data, type_client: "special", solde: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Client ajouté");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => clientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Client modifié");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients-speciaux"]);
      toast("success", "Client supprimé");
    },
  });

  // ===========================
  // API PUBLIQUE
  // ===========================
  return {
    clients,
    commandes,
    loading: query.isLoading,
    clientsEnrichis,
    statsGlobales,
    handleAdd: addMutation.mutate,
    handleEdit: (data) =>
      editMutation.mutate({ id: data.id, data }),
    handleDelete: (id) => deleteMutation.mutate(id),
  };
}

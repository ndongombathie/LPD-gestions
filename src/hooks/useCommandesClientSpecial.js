import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { commandesAPI } from "@/responsable/services/api";
import { normalizeCommande } from "@/utils/normalizeCommande";
import { logger } from "@/utils/logger";

export function useCommandesClientSpecial({
  clientId,
  page,
  per_page = 10,
  search,
  statut,
  date_debut,
  date_fin,
}){

  // ✅ NORMALISATION DES PARAMÈTRES
  const normalizedSearch =
    search && search.trim() !== "" ? search.trim() : undefined;

  const normalizedStatut =
    statut && statut !== "tous" ? statut : undefined;

  const query = useQuery({
    queryKey: [
      "commandes-client-special",
      clientId,
      page,
      per_page,
      normalizedSearch,
      normalizedStatut,
      date_debut,
      date_fin,
    ],

    enabled: !!clientId,
    keepPreviousData: true,
    staleTime: 30000,

    queryFn: async () => {
      try {
          const res = await commandesAPI.getAll({
            client_id: clientId,
            page,
            per_page,
            search: normalizedSearch,
            statut: normalizedStatut,
            start_date: date_debut,
            end_date: date_fin,
          });

        const payload = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const commandes = payload
          .map(normalizeCommande)
          .filter(Boolean);

        return {
          commandes,
          meta: {
            current_page: res.data?.current_page ?? 1,
            last_page: res.data?.last_page ?? 1,
            total: res.data?.total ?? 0,
          },
          stats: res.stats ?? {},
        };

      } catch (error) {
        logger.error("useCommandesClientSpecial.fetch", { error });
        toast.error("Impossible de charger les commandes.");
        throw error;
      }
    },
  });

  return {
    commandes: query.data?.commandes ?? [],
    stats: query.data?.stats ?? {},
    currentPage: query.data?.meta?.current_page ?? 1,
    totalPages: query.data?.meta?.last_page ?? 1,
    total: query.data?.meta?.total ?? 0,
    loading: query.isLoading || query.isFetching,
  };
}

import { useQuery } from "@tanstack/react-query";
import { commandesAPI } from "@/services/api";
import { normalizeCommande } from "@/utils/normalizeCommande";
import { logger } from "@/utils/logger";

export function useCommandesClientSpecial({
  clientId,
  page,
  perPage = 10,
  search,
  statut,
  toast,
}) {

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
      perPage,
      normalizedSearch,
      normalizedStatut,
    ],

    enabled: !!clientId,
    keepPreviousData: true,
    staleTime: 30000,

    queryFn: async () => {
      try {
        const res = await commandesAPI.getAll({
          type_client: "special",
          client_id: clientId,
          page,
          perPage,
          search: normalizedSearch,
          statut: normalizedStatut,
        });

        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        const commandes = payload
          .map(normalizeCommande)
          .filter(Boolean);

        return {
          commandes,
          meta: {
            current_page: res.current_page ?? 1,
            last_page: res.last_page ?? 1,
            total: res.total ?? 0,
          },
          stats: res.stats ?? {},
        };

      } catch (error) {
        logger.error("useCommandesClientSpecial.fetch", { error });
        toast(
          "error",
          "Erreur",
          "Impossible de charger les commandes."
        );
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

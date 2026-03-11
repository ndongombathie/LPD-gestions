import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paiementsAPI } from "@/responsable/services/api/paiements";

export function useHistoriqueEncaissementsClient({
  clientId,
  search,
  mode,
  date_debut,
  date_fin,
}) {

  // ✅ Normalisation propre
  const normalizedSearch =
    search && search.trim() !== "" ? search.trim() : undefined;

  const normalizedMode =
    mode && mode !== "tous" ? mode : undefined;

  const query = useQuery({
    queryKey: [
      "historique-encaissements-client",
      clientId,
      normalizedSearch,
      normalizedMode,
      date_debut,
      date_fin,
    ],

    enabled: !!clientId,
    staleTime: 30000,

    queryFn: async () => {
      try {
        const data = await paiementsAPI.getHistoriqueEncaissementsClient(
          clientId,
          {
            search: normalizedSearch,
            mode: normalizedMode,
            date_debut,
            date_fin,
          }
        );

        // ✅ Backend retourne directement un tableau
        return Array.isArray(data) ? data : [];

      } catch (error) {
        toast.error("Impossible de charger les encaissements.");
        throw error;
      }
    },
  });

  return {
    encaissements: query.data ?? [],
    loading: query.isLoading || query.isFetching,
  };
}
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/** Charge le contenu éditable de la page d'accueil (hero + about). */
export function useHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-home"],
    queryFn: async () => (await api.get("/home")).data,
    staleTime: 60 * 1000,
  });
  return { home: data, isLoading };
}

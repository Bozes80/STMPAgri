import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * Retourne la liste des réseaux sociaux actifs, triés par `order`.
 * Utilisé par le Footer et le bouton flottant WhatsApp.
 */
export function useSocials() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["public-socials"],
    queryFn: async () => (await api.get("/socials")).data || [],
    staleTime: 60 * 1000,
  });
  return { socials: data, isLoading };
}

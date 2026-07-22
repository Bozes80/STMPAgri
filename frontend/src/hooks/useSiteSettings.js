import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/** Paramètres visuels + coordonnées Header/Footer (édités depuis /admin/apparence). */
export function useSiteSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => (await api.get("/site-settings")).data,
    staleTime: 60 * 1000,
  });
  return { settings: data, isLoading };
}

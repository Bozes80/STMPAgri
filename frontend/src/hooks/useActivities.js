import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * Charge les activités depuis /api/activities (public, actives uniquement).
 * Chaque activité principale contient une liste `children` (sous-rubriques).
 */
export function useActivities() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["public-activities"],
    queryFn: async () => (await api.get("/activities")).data || [],
    staleTime: 60 * 1000,
  });
  return { activities: data, isLoading };
}

/** Charge une activité par sa clé (slug), avec `children` et `parent` éventuel. */
export function useActivityByKey(key) {
  const { data, isLoading } = useQuery({
    queryKey: ["public-activity", key],
    queryFn: async () => (await api.get(`/activities/${key}`)).data,
    enabled: !!key,
    retry: false,
    staleTime: 60 * 1000,
  });
  return { activity: data, isLoading };
}

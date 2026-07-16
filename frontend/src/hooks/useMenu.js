import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * Charge un menu depuis /api/menus/<location>. Retourne { items, tree, name }.
 * items = liste plate. tree = items enrichis avec `children` pour les usages dropdown.
 */
export function useMenu(location) {
  const { data, isLoading } = useQuery({
    queryKey: ["public-menu", location],
    queryFn: async () => (await api.get(`/menus/${location}`)).data,
    staleTime: 60 * 1000,
  });

  const items = (data?.items || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const byId = Object.fromEntries(items.map((i) => [i.id, { ...i, children: [] }]));
  const tree = [];
  for (const it of items) {
    const enriched = byId[it.id];
    if (it.parent_id && byId[it.parent_id]) byId[it.parent_id].children.push(enriched);
    else tree.push(enriched);
  }

  return {
    name: data?.name || "",
    items,
    tree,
    isLoading,
    isEmpty: !isLoading && items.length === 0,
  };
}

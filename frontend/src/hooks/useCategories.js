import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

// Fallback statique en attendant que la première requête aboutisse.
const FALLBACK = PRODUCT_CATEGORIES
  .filter((c) => c.value !== "all")
  .map((c, i) => ({ id: c.value, name: c.label, value: c.value, order: i }));

/**
 * Retourne la liste des catégories produits (depuis /api/categories).
 * Utilisé partout où on affichait auparavant PRODUCT_CATEGORIES.
 * `withAll: true` ajoute l'entrée { value: "all", name: "Tous les produits" } au début.
 */
export function useCategories({ withAll = false } = {}) {
  const { data = [], ...rest } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
    staleTime: 5 * 60 * 1000,
    placeholderData: FALLBACK,
  });
  const list = withAll
    ? [{ id: "all", name: "Tous les produits", value: "all", order: -1 }, ...data]
    : data;
  return { categories: list, ...rest };
}

/** Retourne le libellé humain d'une catégorie à partir de son slug. */
export function useCategoryLabel(value) {
  const { categories } = useCategories();
  return categories.find((c) => c.value === value)?.name || value;
}

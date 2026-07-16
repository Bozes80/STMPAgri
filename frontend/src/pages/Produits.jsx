import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import PageHero from "@/components/PageHero";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { IMAGES } from "@/lib/constants";
import { useCategories } from "@/hooks/useCategories";

export default function Produits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("cat") || "all");
  const [search, setSearch] = useState("");
  const { categories } = useCategories({ withAll: true });

  useEffect(() => {
    const cat = searchParams.get("cat") || "all";
    setCategory(cat);
  }, [searchParams]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["products", category, search],
    queryFn: async () =>
      (await api.get("/products", { params: { category, search: search || undefined } })).data,
  });

  const selectCat = (value) => {
    setCategory(value);
    if (value === "all") setSearchParams({});
    else setSearchParams({ cat: value });
  };

  return (
    <>
      <PageHero
        crumb="Produits"
        title="Notre catalogue de produits agricoles"
        subtitle="Engrais, fertilisants, produits phytosanitaires et équipements agricoles — sélectionnés pour leur qualité et leur conformité."
        image={IMAGES.fertilizer}
      />

      <section className="py-16">
        <div className="container-stmp">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-10">
            <div className="flex items-center gap-2 flex-wrap" data-testid="product-filters">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
              {categories.map((c) => (
                <Button
                  key={c.value}
                  size="sm"
                  variant={category === c.value ? "default" : "outline"}
                  data-testid={`filter-${c.value}`}
                  onClick={() => selectCat(c.value)}
                  className={
                    category === c.value
                      ? "bg-[#0E7A3A] hover:bg-[#0b632f] text-white"
                      : "border-border"
                  }
                >
                  {c.name}
                </Button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                data-testid="product-search-input"
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-24 text-muted-foreground" data-testid="no-products">
              Aucun produit ne correspond à votre recherche.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.map((p) => (
                <Reveal key={p.id}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

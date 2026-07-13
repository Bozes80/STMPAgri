import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import ArticleCard from "@/components/ArticleCard";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { ARTICLE_CATEGORIES, IMAGES } from "@/lib/constants";

export default function Actualites() {
  const [category, setCategory] = useState("all");
  const { data = [], isLoading } = useQuery({
    queryKey: ["articles", category],
    queryFn: async () =>
      (await api.get("/articles", { params: { category } })).data,
  });

  return (
    <>
      <PageHero
        crumb="Actualités"
        title="Actualités & conseils agricoles"
        subtitle="Nutrition des cultures, protection phytosanitaire, logistique et commerce international : notre expertise à votre service."
        image={IMAGES.sustain}
      />

      <section className="py-16">
        <div className="container-stmp">
          <div className="flex flex-wrap gap-2 mb-10" data-testid="article-filters">
            {ARTICLE_CATEGORIES.map((c) => (
              <Button
                key={c.value}
                size="sm"
                variant={category === c.value ? "default" : "outline"}
                data-testid={`article-filter-${c.value}`}
                onClick={() => setCategory(c.value)}
                className={category === c.value ? "bg-[#0E7A3A] hover:bg-[#0b632f] text-white" : ""}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
            </div>
          ) : data.length === 0 ? (
            <p className="text-center py-24 text-muted-foreground">Aucun article dans cette catégorie.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {data.map((a) => (
                <Reveal key={a.id}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

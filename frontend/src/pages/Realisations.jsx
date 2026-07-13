import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, CalendarDays } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { IMAGES } from "@/lib/constants";

export default function Realisations() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["realisations"],
    queryFn: async () => (await api.get("/realisations")).data,
  });

  return (
    <>
      <PageHero
        crumb="Réalisations"
        title="Nos réalisations sur le terrain"
        subtitle="Livraisons d'intrants, opérations logistiques, partenariats et importations réussies : la preuve de notre engagement."
        image={IMAGES.cargo1}
      />

      <section className="py-16">
        <div className="container-stmp">
          {isLoading ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E7A3A]" />
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {data.map((r) => (
                <Reveal key={r.id}>
                  <Card
                    data-testid={`realisation-card-${r.id}`}
                    className="group overflow-hidden border-border rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full flex flex-col"
                  >
                    <div className="overflow-hidden aspect-[16/10]">
                      <img
                        src={r.image}
                        alt={r.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <Badge className="w-fit mb-3 bg-[#0E7A3A]/10 text-[#0E7A3A] hover:bg-[#0E7A3A]/15 border-0 capitalize">
                        {r.category}
                      </Badge>
                      <h3 className="font-heading font-semibold text-xl">{r.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                        {r.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {r.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#7FAE3C]" /> {r.location}
                          </span>
                        )}
                        {r.year && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-[#7FAE3C]" /> {r.year}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
